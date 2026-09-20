# Read-only inspection of the Poly Haven source .blend. No rendering.
#   blender.exe -b <source.blend> --factory-startup -P inspect_source.py -- <out.json>
import bpy, json, sys, mathutils

out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else None
D = bpy.data
S = bpy.context.scene
report = {}

report['blender'] = list(bpy.app.version)
report['units'] = {
    'system': S.unit_settings.system,
    'scale_length': S.unit_settings.scale_length,
    'length_unit': S.unit_settings.length_unit,
}
report['collections'] = [{'name': c.name, 'objects': [o.name for o in c.objects],
                          'children': [x.name for x in c.children]} for c in D.collections]
report['scene_objects'] = [o.name for o in S.objects]

deps = bpy.context.evaluated_depsgraph_get()


def socket_targets(node_tree, image_node):
    """Follow links forward from an image node to the sockets it ultimately drives."""
    found = []
    stack = [(image_node, None)]
    seen = set()
    while stack:
        node, channel = stack.pop()
        for out_sock in node.outputs:
            for link in out_sock.links:
                to_node, to_sock = link.to_node, link.to_socket
                key = (to_node.name, to_sock.name, out_sock.name)
                if key in seen:
                    continue
                seen.add(key)
                ch = out_sock.name if node.type in {'SEPRGB', 'SEPARATE_COLOR'} else channel
                if to_node.type in {'BSDF_PRINCIPLED', 'EMISSION', 'OUTPUT_MATERIAL',
                                    'BSDF_DIFFUSE', 'BSDF_GLOSSY', 'MIX_SHADER', 'GROUP_OUTPUT'}:
                    found.append({'node': to_node.name, 'type': to_node.type,
                                  'socket': to_sock.name, 'via_channel': ch})
                else:
                    found.append({'node': to_node.name, 'type': to_node.type,
                                  'socket': to_sock.name, 'via_channel': ch, 'passthrough': True})
                    stack.append((to_node, ch))
    return found


mats = []
for m in D.materials:
    entry = {'name': m.name, 'users': m.users, 'use_nodes': m.use_nodes,
             'blend_method': getattr(m, 'blend_method', None), 'images': [], 'nodes': []}
    if m.use_nodes:
        entry['nodes'] = sorted({n.type for n in m.node_tree.nodes})
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image:
                entry['images'].append({
                    'node': n.name,
                    'image': n.image.name,
                    'filepath': n.image.filepath,
                    'source': n.image.source,
                    'size': list(n.image.size),
                    'colorspace': n.image.colorspace_settings.name,
                    'packed': bool(n.image.packed_file),
                    'drives': socket_targets(m.node_tree, n),
                })
        for n in m.node_tree.nodes:
            if n.type in {'EMISSION'} or (n.type == 'BSDF_PRINCIPLED'):
                em = {}
                for sock in n.inputs:
                    if 'Emission' in sock.name or sock.name in {'Strength', 'Color'}:
                        try:
                            em[sock.name] = list(sock.default_value) if hasattr(sock.default_value, '__len__') else sock.default_value
                        except Exception:
                            pass
                if em:
                    entry.setdefault('emission_defaults', {})[n.name] = em
    mats.append(entry)
report['materials'] = mats

objs = []
for o in D.objects:
    e = {
        'name': o.name, 'type': o.type,
        'parent': o.parent.name if o.parent else None,
        'parent_type': o.parent_type if o.parent else None,
        'parent_bone': o.parent_bone if o.parent else None,
        'location': [round(v, 6) for v in o.location],
        'rotation_euler': [round(v, 6) for v in o.rotation_euler],
        'scale': [round(v, 6) for v in o.scale],
        'world_translation': [round(v, 6) for v in o.matrix_world.translation],
        'dimensions': [round(v, 6) for v in o.dimensions],
        'modifiers': [{'name': mod.name, 'type': mod.type,
                       'levels': getattr(mod, 'render_levels', None),
                       'viewport_levels': getattr(mod, 'levels', None)} for mod in o.modifiers],
        'constraints': [{'name': c.name, 'type': c.type} for c in o.constraints],
        'in_scene': o.name in S.objects,
    }
    if o.type == 'MESH':
        raw = o.data
        e['uv_layers'] = [uv.name for uv in raw.uv_layers]
        e['vertex_groups'] = [g.name for g in o.vertex_groups]
        e['material_slots'] = [s.material.name if s.material else None for s in o.material_slots]
        e['raw_polys'] = len(raw.polygons)
        e['raw_tris'] = sum(len(p.vertices) - 2 for p in raw.polygons)
        ev = o.evaluated_get(deps)
        try:
            em = ev.to_mesh()
            e['eval_polys'] = len(em.polygons)
            e['eval_tris'] = sum(len(p.vertices) - 2 for p in em.polygons)
            ev.to_mesh_clear()
        except Exception as ex:
            e['eval_error'] = str(ex)
        bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
        e['world_bbox_min'] = [round(min(p[i] for p in bb), 6) for i in range(3)]
        e['world_bbox_max'] = [round(max(p[i] for p in bb), 6) for i in range(3)]
    if o.type == 'LIGHT':
        lt = o.data
        e['light'] = {'type': lt.type, 'energy': lt.energy, 'color': list(lt.color),
                      'size': getattr(lt, 'size', None),
                      'spot_size': getattr(lt, 'spot_size', None)}
        e['light_dir_world'] = [round(v, 6) for v in (o.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, -1)))]
    if o.type == 'ARMATURE':
        bones = []
        for b in o.data.bones:
            bones.append({'name': b.name, 'parent': b.parent.name if b.parent else None,
                          'head_local': [round(v, 6) for v in b.head_local],
                          'tail_local': [round(v, 6) for v in b.tail_local],
                          'length': round(b.length, 6), 'deform': b.use_deform})
        e['bones'] = bones
        e['pose_constraints'] = [{'bone': pb.name,
                                  'constraints': [{'name': c.name, 'type': c.type,
                                                   'target': getattr(getattr(c, 'target', None), 'name', None),
                                                   'subtarget': getattr(c, 'subtarget', None),
                                                   'influence': round(getattr(c, 'influence', 1.0), 4)}
                                                  for c in pb.constraints]}
                                 for pb in o.pose.bones if pb.constraints]
        e['custom_shapes'] = [pb.name for pb in o.pose.bones if pb.custom_shape]
    objs.append(e)
report['objects'] = objs

report['images'] = [{'name': i.name, 'filepath': i.filepath, 'size': list(i.size),
                     'colorspace': i.colorspace_settings.name, 'packed': bool(i.packed_file),
                     'users': i.users} for i in D.images]
report['cameras'] = [o.name for o in D.objects if o.type == 'CAMERA']
report['lights'] = [o.name for o in D.objects if o.type == 'LIGHT']
report['actions'] = [a.name for a in D.actions]

# Whole-model world bounds across mesh objects
pts = []
for o in D.objects:
    if o.type == 'MESH':
        pts += [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
if pts:
    report['model_world_bbox'] = {
        'min': [round(min(p[i] for p in pts), 6) for i in range(3)],
        'max': [round(max(p[i] for p in pts), 6) for i in range(3)],
        'size': [round(max(p[i] for p in pts) - min(p[i] for p in pts), 6) for i in range(3)],
    }

text = json.dumps(report, indent=1)
if out:
    with open(out, 'w', encoding='utf-8') as f:
        f.write(text)
    print('WROTE', out, len(text), 'bytes')
else:
    print(text)
