# Identifies the mount geometry, the desk-contact plane, and the emitter's
# light exit direction. Read-only, no rendering.
#   blender.exe -b <source.blend> --factory-startup -P probe_mount_and_head.py -- <out.json>
import bpy, json, sys, mathutils
from collections import defaultdict

out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else None
D = bpy.data
report = {}

MOUNT = ['geo_pivot-holder', 'geo_base_pivot', 'geo_lamp-base-pivot']


def world_verts(o):
    return [o.matrix_world @ v.co for v in o.data.vertices]


# 1. Mount profile: horizontal extent of each object sliced by z.
profiles = {}
for name in MOUNT:
    o = D.objects.get(name)
    if not o:
        continue
    vs = world_verts(o)
    zs = [v.z for v in vs]
    lo, hi = min(zs), max(zs)
    slices = []
    steps = 24
    for i in range(steps):
        a = lo + (hi - lo) * i / steps
        b = lo + (hi - lo) * (i + 1) / steps
        band = [v for v in vs if a - 1e-9 <= v.z <= b + 1e-9]
        if not band:
            slices.append({'z': round((a + b) / 2, 5), 'n': 0})
            continue
        slices.append({
            'z': round((a + b) / 2, 5), 'n': len(band),
            'x': [round(min(v.x for v in band), 5), round(max(v.x for v in band), 5)],
            'y': [round(min(v.y for v in band), 5), round(max(v.y for v in band), 5)],
            'maxr': round(max(((v.x) ** 2 + (v.y) ** 2) ** .5 for v in band), 5),
        })
    profiles[name] = {'z_range': [round(lo, 5), round(hi, 5)], 'slices': slices,
                      'tris': sum(len(p.vertices) - 2 for p in o.data.polygons)}
report['mount_profiles'] = profiles

# 2. Faces using the emissive material: centroid + area-weighted normal.
emit = defaultdict(lambda: {'area': 0.0, 'n': mathutils.Vector(), 'c': mathutils.Vector(), 'faces': 0,
                            'min': None, 'max': None})
for o in D.objects:
    if o.type != 'MESH' or not o.material_slots:
        continue
    light_slots = {i for i, s in enumerate(o.material_slots)
                   if s.material and s.material.name.endswith('_light')}
    if not light_slots:
        continue
    mw, nm = o.matrix_world, o.matrix_world.to_3x3().inverted().transposed()
    for p in o.data.polygons:
        if p.material_index not in light_slots:
            continue
        e = emit[o.name]
        a = p.area
        e['area'] += a
        e['n'] += (nm @ p.normal).normalized() * a
        e['c'] += (mw @ p.center) * a
        e['faces'] += 1
        for vi in p.vertices:
            w = mw @ o.data.vertices[vi].co
            e['min'] = w.copy() if e['min'] is None else mathutils.Vector([min(e['min'][i], w[i]) for i in range(3)])
            e['max'] = w.copy() if e['max'] is None else mathutils.Vector([max(e['max'][i], w[i]) for i in range(3)])
report['emissive'] = {
    k: {'faces': v['faces'], 'area_m2': round(v['area'], 8),
        'centroid': [round(x, 5) for x in (v['c'] / v['area'])],
        'mean_normal': [round(x, 5) for x in v['n'].normalized()],
        'bbox_min': [round(x, 5) for x in v['min']], 'bbox_max': [round(x, 5) for x in v['max']]}
    for k, v in emit.items() if v['area'] > 0}

# 3. Lamp head: area-weighted normal of the widest-open end (the shade mouth).
head = D.objects.get('geo_lamp-head')
if head:
    mw, nm = head.matrix_world, head.matrix_world.to_3x3().inverted().transposed()
    vs = world_verts(head)
    report['head'] = {
        'bbox_min': [round(min(v[i] for v in vs), 5) for i in range(3)],
        'bbox_max': [round(max(v[i] for v in vs), 5) for i in range(3)],
        'tris': sum(len(p.vertices) - 2 for p in head.data.polygons),
        'slots': [s.material.name if s.material else None for s in head.material_slots],
    }

# 4. Per-material triangle split across the whole model.
by_mat = defaultdict(int)
deps = bpy.context.evaluated_depsgraph_get()
for o in D.objects:
    if o.type != 'MESH' or not o.name.startswith('geo_'):
        continue
    ev = o.evaluated_get(deps)
    m = ev.to_mesh()
    names = [s.material.name if s.material else None for s in o.material_slots]
    for p in m.polygons:
        n = names[p.material_index] if p.material_index < len(names) else None
        by_mat[n] += len(p.vertices) - 2
    ev.to_mesh_clear()
report['tris_by_material'] = dict(by_mat)

# 5. Pose-bone limits on the mount, which is what "desk thickness" would ride on.
rig = D.objects.get('rig_lamp')
if rig:
    lim = {}
    for bn in ['ctrl_pivot-holder', 'ctrl_lamp_base_pivot', 'ctrl_top-position']:
        pb = rig.pose.bones.get(bn)
        if not pb:
            continue
        cs = []
        for c in pb.constraints:
            d = {'type': c.type, 'name': c.name}
            for attr in ['use_min_x', 'use_max_x', 'use_min_y', 'use_max_y', 'use_min_z', 'use_max_z',
                         'min_x', 'max_x', 'min_y', 'max_y', 'min_z', 'max_z', 'owner_space']:
                if hasattr(c, attr):
                    d[attr] = getattr(c, attr)
            cs.append(d)
        lim[bn] = {'constraints': cs,
                   'head_world': [round(v, 5) for v in (rig.matrix_world @ pb.head)],
                   'matrix_basis_translation': [round(v, 5) for v in pb.matrix_basis.translation]}
    report['mount_bone_limits'] = lim

text = json.dumps(report, indent=1, default=str)
if out:
    open(out, 'w', encoding='utf-8').write(text)
    print('WROTE', out, len(text))
else:
    print(text)
