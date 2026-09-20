# Builds the editable work .blend and the candidate GLB from the untouched
# Poly Haven source. No rendering.
#
#   blender.exe -b source/blend/desk_lamp_arm_01_1k.blend --factory-startup \
#       -P tools/prepare_and_export.py -- <work.blend> <out.glb> <report.json>
#
# What it changes relative to source, and why:
#  * Runtime maps are retargeted to the glTF 1K JPEGs. glTF cannot carry EXR, so
#    leaving rough/metal/nor as EXR forces the exporter to synthesise and
#    re-encode PNGs. The ARM JPEG is already AO/Rough/Metal packed the way glTF
#    wants, and an already-JPEG image is copied rather than re-encoded.
#  * The emissive mask is moved off Emission Strength (a scalar in glTF, so a
#    texture there is silently dropped) onto Emission Color via a multiply with
#    the source's own warm colour.
#  * Every root-level object is translated so the clamp's upper-jaw desk-contact
#    pad centre lands on the origin.
# Nothing else about the materials is touched.
import bpy, json, sys, os, mathutils

args = sys.argv[sys.argv.index('--') + 1:]
WORK, GLB, REPORT = args[0], args[1], args[2]

D = bpy.data
S = bpy.context.scene
report = {'blender': list(bpy.app.version)}

GLTF_TEX = os.path.abspath(os.path.join(os.path.dirname(WORK), '..', 'source', 'gltf', 'textures'))
ARM = os.path.join(GLTF_TEX, 'desk_lamp_arm_01_arm_1k.jpg')
NOR = os.path.join(GLTF_TEX, 'desk_lamp_arm_01_nor_gl_1k.jpg')
DIFF = os.path.join(GLTF_TEX, 'desk_lamp_arm_01_diff_1k.jpg')

# Measured in probe_contact.py: centroid of the 910 mm2 downward-facing
# upper-jaw pad, the face that rests on the desk top.
def contact_centroid():
    """Area-weighted centre of the clamp's upper-jaw pad: the largest downward
    facing face on geo_base_pivot near the top of the clamp mouth. Measured on
    evaluated geometry, because the rig's IK/Copy-Rotation chain settles into a
    pose that differs from the raw mesh."""
    deps = bpy.context.evaluated_depsgraph_get()
    o = D.objects['geo_base_pivot'].evaluated_get(deps)
    m = o.to_mesh()
    mw, nm = o.matrix_world, o.matrix_world.to_3x3().inverted().transposed()
    best_z, best = None, {}
    for p in m.polygons:
        if (nm @ p.normal).normalized().z > -0.97:
            continue
        z = round((mw @ p.center).z, 3)
        e = best.setdefault(z, {'a': 0.0, 'c': mathutils.Vector()})
        e['a'] += p.area
        e['c'] += (mw @ p.center) * p.area
    best_z = max(best, key=lambda z: best[z]['a'])
    c = best[best_z]['c'] / best[best_z]['a']
    area = best[best_z]['a']
    o.to_mesh_clear()
    return c, area


def evaluated_bounds():
    deps = bpy.context.evaluated_depsgraph_get()
    mn = [1e9] * 3
    mx = [-1e9] * 3
    tris = 0
    for o in D.objects:
        if o.type != 'MESH' or not o.name.startswith('geo_'):
            continue
        ev = o.evaluated_get(deps)
        m = ev.to_mesh()
        mw = ev.matrix_world
        for v in m.vertices:
            w = mw @ v.co
            for i in range(3):
                mn[i] = min(mn[i], w[i])
                mx[i] = max(mx[i], w[i])
        tris += sum(len(p.vertices) - 2 for p in m.polygons)
        ev.to_mesh_clear()
    return {'min': [round(v, 6) for v in mn], 'max': [round(v, 6) for v in mx],
            'size': [round(mx[i] - mn[i], 6) for i in range(3)], 'eval_tris': tris}


report['source_evaluated_bounds'] = evaluated_bounds()

# --- 1. Retarget textures -----------------------------------------------------
arm_img = D.images.load(ARM, check_existing=True)
arm_img.name = 'desk_lamp_arm_01_arm'
arm_img.colorspace_settings.name = 'Non-Color'

for img, path in ((D.images.get('desk_lamp_arm_01_nor_gl.png'), NOR),
                  (D.images.get('desk_lamp_arm_01_diff.png'), DIFF)):
    if img:
        img.filepath = bpy.path.relpath(path) if bpy.data.filepath else path
        img.source = 'FILE'
        img.reload()

tex_changes = []
for mat in D.materials:
    nt = mat.node_tree
    if not nt:
        continue
    bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf:
        continue
    rough_node = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image
                       and 'rough' in n.image.name), None)
    metal_node = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image
                       and 'metal' in n.image.name), None)
    if not (rough_node and metal_node):
        continue

    sep = nt.nodes.new('ShaderNodeSeparateColor')
    sep.location = (rough_node.location.x + 260, rough_node.location.y)
    armn = nt.nodes.new('ShaderNodeTexImage')
    armn.image = arm_img
    armn.label = 'ARM (occlusion/roughness/metallic)'
    armn.location = (rough_node.location.x, rough_node.location.y - 320)
    # Reuse whatever UV/mapping chain the source already feeds the rough node.
    if rough_node.inputs['Vector'].links:
        nt.links.new(rough_node.inputs['Vector'].links[0].from_socket, armn.inputs['Vector'])
    nt.links.new(armn.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])

    # Occlusion: the exporter picks this up only if a node group with this exact
    # name and an 'Occlusion' input exists. If the name is wrong it stays inert
    # and the GLB simply carries no occlusionTexture; the parse check reports it.
    grp = D.node_groups.get('glTF Material Output')
    if grp is None:
        grp = D.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        grp.nodes.new('NodeGroupInput')
    gnode = nt.nodes.new('ShaderNodeGroup')
    gnode.node_tree = grp
    gnode.location = (sep.location.x + 240, sep.location.y - 200)
    nt.links.new(sep.outputs['Red'], gnode.inputs['Occlusion'])

    nt.nodes.remove(rough_node)
    nt.nodes.remove(metal_node)
    tex_changes.append(mat.name)

    # Emissive: move the mask off the scalar Emission Strength socket.
    mask_node = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image
                      and 'mask01' in n.image.name), None)
    if mask_node:
        warm = tuple(bsdf.inputs['Emission Color'].default_value)
        mask_node.image.colorspace_settings.name = 'sRGB'
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        mix.location = (mask_node.location.x + 260, mask_node.location.y)
        nt.links.new(mask_node.outputs['Color'], mix.inputs[6])   # A
        mix.inputs[7].default_value = warm                        # B
        for link in list(bsdf.inputs['Emission Strength'].links):
            nt.links.remove(link)
        bsdf.inputs['Emission Strength'].default_value = 1.0
        nt.links.new(mix.outputs[2], bsdf.inputs['Emission Color'])
        report['emissive_warm_color'] = [round(c, 6) for c in warm]

report['materials_retargeted'] = tex_changes
report['images_after'] = [{'name': i.name, 'filepath': i.filepath, 'size': list(i.size),
                           'colorspace': i.colorspace_settings.name}
                          for i in D.images if i.size[0]]

# --- 2. Pose ------------------------------------------------------------------
# The file as delivered evaluates to a pose that aims the shade 28 deg below
# horizontal, i.e. mostly sideways. Zeroing the two head controls (both are
# clamped by the rig's own Limit Rotation constraints to a single free axis
# each) swings the shade to straight down, which is the ordinary desk working
# pose the asset is meant to sit in. Verified by measuring the emitter normal.
rig = D.objects['rig_lamp']
pose_set = {}
for bone_name in ('ctrl_top_rotation_A', 'ctrl_top_rotation_B'):
    pb = rig.pose.bones[bone_name]
    pb.rotation_mode = 'XYZ'
    pose_set[bone_name] = {'was': [round(v, 5) for v in pb.matrix_basis.to_euler()]}
    pb.rotation_euler = (0.0, 0.0, 0.0)
bpy.context.view_layer.update()
report['pose_controls_zeroed'] = pose_set


def emitter_state():
    deps = bpy.context.evaluated_depsgraph_get()
    o = D.objects['geo_lamp-head'].evaluated_get(deps)
    m = o.to_mesh()
    mw, nm = o.matrix_world, o.matrix_world.to_3x3().inverted().transposed()
    names = [s.material.name if s.material else None for s in D.objects['geo_lamp-head'].material_slots]
    a, n, c = 0.0, mathutils.Vector(), mathutils.Vector()
    for p in m.polygons:
        if names[p.material_index] and names[p.material_index].endswith('_light'):
            a += p.area
            n += (nm @ p.normal).normalized() * p.area
            c += (mw @ p.center) * p.area
    o.to_mesh_clear()
    return n.normalized(), c / a, a


# --- 3. Re-root ---------------------------------------------------------------
# Translate every root-level object equally. Children, hooks, curve deformers and
# the armature keep their relative transforms because they all move together.
CONTACT, contact_area = contact_centroid()
report['contact_face_measured'] = {'centroid': [round(v, 6) for v in CONTACT],
                                   'area_mm2': round(contact_area * 1e6, 2)}
moved = 0
for o in D.objects:
    if o.parent is None:
        o.location = o.location - CONTACT
        moved += 1
bpy.context.view_layer.update()
report['rerooted_objects'] = moved
report['contact_offset_applied'] = [round(v, 6) for v in -CONTACT]
report['rerooted_evaluated_bounds'] = evaluated_bounds()
residual, residual_area = contact_centroid()
report['contact_after_reroot'] = [round(v, 6) for v in residual]
n, c, a = emitter_state()
report['emitter_delivered'] = {
    'area_mm2': round(a * 1e6, 2),
    'centroid_blender_zup': [round(v, 5) for v in c],
    'aim_blender_zup': [round(v, 5) for v in n],
    'centroid_gltf_yup': [round(c[0], 5), round(c[2], 5), round(-c[1], 5)],
    'aim_gltf_yup': [round(n[0], 5), round(n[2], 5), round(-n[1], 5)],
}

# --- 4. Export ----------------------------------------------------------------
exported = []
for o in bpy.context.view_layer.objects:
    keep = o.type == 'MESH' and o.name.startswith('geo_')
    o.select_set(keep)
    if keep:
        exported.append(o.name)
bpy.context.view_layer.objects.active = D.objects[exported[0]]
report['exported_objects'] = sorted(exported)

os.makedirs(os.path.dirname(GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=GLB,
    export_format='GLB',
    use_selection=True,
    export_apply=True,          # bakes Array + Curve wires and the rest-pose armature
    export_yup=True,            # Blender Z-up -> glTF Y-up; no manual rotation
    export_cameras=False,
    export_lights=False,
    export_skins=False,         # constraints do not survive glTF; ship named nodes
    export_animations=False,
    export_materials='EXPORT',
    export_image_format='AUTO', # already-JPEG images are copied, not re-encoded
    export_normals=True,
    export_tangents=False,
    export_extras=False,
    export_unused_images=False,
    export_unused_textures=False,
)
report['glb_bytes'] = os.path.getsize(GLB)

# --- 5. Save the editable work file ------------------------------------------
os.makedirs(os.path.dirname(WORK), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=WORK, relative_remap=True, copy=False)
report['work_blend'] = WORK
report['work_bytes'] = os.path.getsize(WORK)

open(REPORT, 'w', encoding='utf-8').write(json.dumps(report, indent=1))
print('WROTE', GLB, report['glb_bytes'], 'bytes;', WORK, report['work_bytes'], 'bytes')
