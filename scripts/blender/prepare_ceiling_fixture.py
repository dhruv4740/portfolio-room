# Prepare the Poly Haven hanging industrial lamp as the room's ceiling pendant.
#
#   blender -b -noaudio --python scripts/blender/prepare_ceiling_fixture.py
#
# The source hangs 1.355 m, of which roughly a metre is chain and flex. The
# room's ceiling rose is only 0.54 m above its bulb, so the chain is trimmed
# to a short drop. 4K maps are resized to 1K: this fixture is never closer
# than about two metres from any camera in the scene.
import bpy, bmesh, os
from mathutils import Vector

SRC = 'art/candidates/ceiling-lamp/hanging-industrial-lamp/hanging_industrial_lamp_4k.fbx'
TEX = 'art/candidates/ceiling-lamp/hanging-industrial-lamp/textures'
OUT = 'art/vendor/polyhaven/hanging_industrial_lamp/export/ceiling-fixture.glb'
CUT = -0.45          # keep geometry below this source Z: body, cage and enough chain to hang clear
RESOLUTION = 1024

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']


def stats(label):
    tris = 0
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in meshes:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
    print('%s tris=%d size=(%.4f, %.4f, %.4f) z=%.4f..%.4f'
          % (label, tris, hi.x - lo.x, hi.y - lo.y, hi.z - lo.z, lo.z, hi.z))
    return lo, hi


stats('SOURCE')

# Trim the chain. Whole-vertex delete keeps the remaining links closed.
for o in meshes:
    bm = bmesh.new(); bm.from_mesh(o.data)
    doomed = [v for v in bm.verts if (o.matrix_world @ v.co).z > CUT]
    bmesh.ops.delete(bm, geom=doomed, context='VERTS')
    bm.to_mesh(o.data); bm.free()
    o.data.update()

lo, hi = stats('TRIMMED')

# Origin to the top of the trimmed chain, centred: the room hangs it from the
# ceiling rose, so the mount point is the useful origin.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
offset = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z))
for o in meshes:
    o.location -= offset
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
stats('PLACED')


def image(name, colorspace='Non-Color'):
    path = os.path.abspath(os.path.join(TEX, name))
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = colorspace
    if max(img.size) > RESOLUTION:
        img.scale(RESOLUTION, RESOLUTION)
    # Bake the resize into a file the glTF exporter can pack.
    img.filepath_raw = '//art/vendor/polyhaven/hanging_industrial_lamp/work/%s_1k.png' % name.split('.')[0]
    img.file_format = 'PNG'
    os.makedirs(bpy.path.abspath('//art/vendor/polyhaven/hanging_industrial_lamp/work'), exist_ok=True)
    img.save()
    print('TEXTURE %s -> %dx%d' % (name, img.size[0], img.size[1]))
    return img


def build(material, prefix, glass=False):
    material.use_nodes = True
    nt = material.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    def tex(img, socket, non_color=True):
        node = nt.nodes.new('ShaderNodeTexImage')
        node.image = img
        nt.links.new(node.outputs['Color'], socket)
        return node

    if glass:
        # Only a normal map ships for the glass; keep it thin and transmissive.
        nor = image('%s_glass_nor_gl_4k.png' % prefix)
        nmap = nt.nodes.new('ShaderNodeNormalMap')
        tex(nor, nmap.inputs['Color'])
        nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
        bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Roughness'].default_value = 0.12
        material.blend_method = 'BLEND'
        bsdf.inputs['Alpha'].default_value = 0.35
        return

    tex(image('%s_diff_4k.jpg' % prefix, 'sRGB'), bsdf.inputs['Base Color'])
    tex(image('%s_rough_4k.exr' % prefix), bsdf.inputs['Roughness'])
    tex(image('%s_metal_4k.exr' % prefix), bsdf.inputs['Metallic'])
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    tex(image('%s_nor_gl_4k.exr' % prefix), nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    emissive = image('%s_emissive_4k.png' % prefix, 'sRGB')
    tex(emissive, bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0


for material in bpy.data.materials:
    if material.name.endswith('_glass'):
        build(material, 'hanging_industrial_lamp', glass=True)
    else:
        build(material, 'hanging_industrial_lamp')

os.makedirs(os.path.dirname(OUT), exist_ok=True)
# PNG maps put this well over 13 MB. Poly Haven's own glTF variants ship JPEG;
# match that. Roughness and metalness are packed into one texture by the
# exporter, so the fixture costs four images, not six.
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True,
                          export_materials='EXPORT', export_normals=True,
                          export_image_format='JPEG', export_jpeg_quality=82)
print('WROTE', OUT, os.path.getsize(OUT), 'bytes')
