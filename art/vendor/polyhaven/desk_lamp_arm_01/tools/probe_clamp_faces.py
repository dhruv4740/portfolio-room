# Locates the horizontal faces of the clamp assembly so the desk-contact plane
# and the jaw gap can be measured rather than guessed. Read-only.
#   blender.exe -b <source.blend> --factory-startup -P probe_clamp_faces.py -- <out.json>
import bpy, json, sys, mathutils
from collections import defaultdict

out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else None
D = bpy.data
report = {}

PARTS = ['geo_base_pivot', 'geo_pivot-holder', 'geo_lamp-base-pivot']

for name in PARTS:
    o = D.objects.get(name)
    if not o:
        continue
    mw = o.matrix_world
    nm = mw.to_3x3().inverted().transposed()
    up, down = defaultdict(float), defaultdict(float)
    for p in o.data.polygons:
        n = (nm @ p.normal).normalized()
        if abs(n.z) < 0.97:
            continue
        z = round((mw @ p.center).z, 4)
        (up if n.z > 0 else down)[z] += p.area
    report[name] = {
        'up_faces': sorted(({'z': z, 'area_mm2': round(a * 1e6, 2)} for z, a in up.items()
                            if a * 1e6 > 5), key=lambda d: d['z']),
        'down_faces': sorted(({'z': z, 'area_mm2': round(a * 1e6, 2)} for z, a in down.items()
                              if a * 1e6 > 5), key=lambda d: d['z']),
    }

# Screw axis: what does ctrl_pivot-holder's local Y become in world space?
rig = D.objects.get('rig_lamp')
if rig:
    pb = rig.pose.bones.get('ctrl_pivot-holder')
    m = rig.matrix_world @ pb.matrix
    report['screw_axis'] = {
        'bone_head_world': [round(v, 5) for v in (rig.matrix_world @ pb.head)],
        'bone_tail_world': [round(v, 5) for v in (rig.matrix_world @ pb.tail)],
        'local_x_in_world': [round(v, 5) for v in (m.to_3x3() @ mathutils.Vector((1, 0, 0)))],
        'local_y_in_world': [round(v, 5) for v in (m.to_3x3() @ mathutils.Vector((0, 1, 0)))],
        'local_z_in_world': [round(v, 5) for v in (m.to_3x3() @ mathutils.Vector((0, 0, 1)))],
        'limit_y_range_m': [-0.024, 0.0158],
    }

# The lamp head's shade mouth: outward normal of the rim opposite the emitter.
head = D.objects.get('geo_lamp-head')
if head:
    mw, nm = head.matrix_world, head.matrix_world.to_3x3().inverted().transposed()
    emit_c = mathutils.Vector((-0.00218, 0.16685, 0.6581))
    # Faces on the non-emissive material whose normal points away from the emitter centroid
    # and that lie near the open end.
    best = []
    for p in head.data.polygons:
        n = (nm @ p.normal).normalized()
        c = mw @ p.center
        best.append((n, c, p.area))
    # Area-weighted mean normal of the whole head, and of the emissive dish only,
    # already known; report the head's own local axis instead.
    report['head_axes'] = {
        'matrix_world_col_x': [round(v, 5) for v in head.matrix_world.to_3x3().col[0]],
        'matrix_world_col_y': [round(v, 5) for v in head.matrix_world.to_3x3().col[1]],
        'matrix_world_col_z': [round(v, 5) for v in head.matrix_world.to_3x3().col[2]],
        'origin_world': [round(v, 5) for v in head.matrix_world.translation],
    }
    # Sample: vertex extremes along the emitter normal (0,0,-1) to find the shade rim plane.
    vs = [mw @ v.co for v in head.data.vertices]
    report['head_z_extremes'] = {'min_z': round(min(v.z for v in vs), 5),
                                 'max_z': round(max(v.z for v in vs), 5)}

text = json.dumps(report, indent=1)
if out:
    open(out, 'w', encoding='utf-8').write(text)
    print('WROTE', out, len(text))
else:
    print(text)
