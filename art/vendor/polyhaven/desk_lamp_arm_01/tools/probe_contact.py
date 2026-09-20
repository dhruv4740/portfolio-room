# Centroid of the desk-contact face and the footprint of everything below it.
import bpy, json, sys, mathutils
from collections import defaultdict
D = bpy.data
rep = {}
o = D.objects['geo_base_pivot']
mw = o.matrix_world; nm = mw.to_3x3().inverted().transposed()
groups = defaultdict(lambda: {'a': 0.0, 'c': mathutils.Vector(), 'n': 0,
                              'mn': [9, 9, 9], 'mx': [-9, -9, -9]})
for p in o.data.polygons:
    nv = (nm @ p.normal).normalized()
    if nv.z > -0.97:
        continue
    z = round((mw @ p.center).z, 3)
    g = groups[z]
    g['a'] += p.area; g['c'] += (mw @ p.center) * p.area; g['n'] += 1
    for vi in p.vertices:
        w = mw @ o.data.vertices[vi].co
        for i in range(3):
            g['mn'][i] = min(g['mn'][i], w[i]); g['mx'][i] = max(g['mx'][i], w[i])
rep['base_pivot_down_faces'] = {
    str(z): {'faces': g['n'], 'area_mm2': round(g['a'] * 1e6, 1),
             'centroid': [round(v, 5) for v in (g['c'] / g['a'])],
             'xy_min': [round(g['mn'][i], 5) for i in range(2)],
             'xy_max': [round(g['mx'][i], 5) for i in range(2)]}
    for z, g in groups.items() if g['a'] * 1e6 > 20}

# Screw collar top face centroid
h = D.objects['geo_pivot-holder']; mw2 = h.matrix_world; nm2 = mw2.to_3x3().inverted().transposed()
acc = {'a': 0.0, 'c': mathutils.Vector()}
for p in h.data.polygons:
    if (nm2 @ p.normal).normalized().z > 0.97 and abs((mw2 @ p.center).z + 0.0202) < 0.001:
        acc['a'] += p.area; acc['c'] += (mw2 @ p.center) * p.area
rep['screw_collar_top'] = {'area_mm2': round(acc['a'] * 1e6, 1),
                           'centroid': [round(v, 5) for v in (acc['c'] / acc['a'])]}

# Footprint of all geo_ vertices below z = 0.0004 vs above
below, above = [], []
for ob in D.objects:
    if ob.type != 'MESH' or not ob.name.startswith('geo_'):
        continue
    for v in ob.data.vertices:
        w = ob.matrix_world @ v.co
        (below if w.z < 0.0004 else above).append((w, ob.name))
def stat(pts):
    if not pts: return None
    return {'count': len(pts),
            'xy_min': [round(min(p[0][i] for p in pts), 5) for i in range(2)],
            'xy_max': [round(max(p[0][i] for p in pts), 5) for i in range(2)],
            'z_min': round(min(p[0].z for p in pts), 5),
            'objects': sorted({p[1] for p in pts})}
rep['below_desk_plane'] = stat(below)
rep['above_count'] = len(above)
print(json.dumps(rep, indent=1))
