# Prepare the licensed A4Tech Bloody V7 mouse for the room.
# Source is untextured (5 flat PBR materials, no image maps), so this is a
# decimation and scale pass only: nothing to bake, no UV atlas to preserve.
#
#   blender -b -noaudio --python scripts/blender/prepare_mouse.py -- [ratio]
#
# Reports measured triangles and bounds before and after, so the numbers in
# the handoff are measured rather than asserted.
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
RATIO = float(argv[0]) if argv else 0.085
SRC = 'art/candidates/mouse/computer_mouse_a4tech_bloody_v7/scene.gltf'
OUT = 'art/vendor/sketchfab/a4tech_bloody_v7/export/mouse.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)

meshes = [o for o in bpy.data.objects if o.type == 'MESH']


def stats(label):
    tris = 0
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for o in meshes:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
    size = hi - lo
    print('%s tris=%d size_m=(%.4f, %.4f, %.4f) min=(%.4f, %.4f, %.4f)'
          % (label, tris, size.x, size.y, size.z, lo.x, lo.y, lo.z))
    return tris, lo, hi


stats('SOURCE')

for o in meshes:
    m = o.modifiers.new('decimate', 'DECIMATE')
    m.decimate_type = 'COLLAPSE'
    m.ratio = RATIO
    # Keep the silhouette's hard edges from folding into the shell.
    m.use_symmetry = False
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)

tris, lo, hi = stats('DECIMATED')

# Real A4Tech Bloody V7 is about 124 x 66 x 38 mm. The source measures
# 8.5115 along its long axis, so one uniform factor lands all three.
TARGET_LENGTH = 0.124
# The Sketchfab export parents every mesh under empties, so clear parents
# (keeping the world transform) before any origin or scale work applies.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

for o in meshes:
    o.data.calc_loop_triangles()
    lo2 = Vector((1e9,) * 3); hi2 = Vector((-1e9,) * 3)
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        for i in range(3):
            lo2[i] = min(lo2[i], w[i]); hi2[i] = max(hi2[i], w[i])
    print('PART %-24s tris=%6d size=(%.3f, %.3f, %.3f)'
          % (o.name, len(o.data.loop_triangles), hi2.x - lo2.x, hi2.y - lo2.y, hi2.z - lo2.z))

tris, lo, hi = stats('FLATTENED')
scale = TARGET_LENGTH / (hi.y - lo.y)
# Origin at the centre of the footprint, on the base plane: the room places
# the mouse by its contact point with the mat.
centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for o in meshes:
    o.location -= centre
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
# The asset measures 85.5 mm across where the real V7 is 66 mm. Narrowing X
# by 0.85 lands a plausible 73 mm without touching length, height or profile.
# Recorded as a modification in ATTRIBUTION.md.
NARROW = 0.85
for o in meshes:
    o.scale = (scale * NARROW, scale, scale)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print('SCALE %.6f NARROW %.2f' % (scale, NARROW))
stats('FITTED')

import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB',
                          export_apply=True, export_materials='EXPORT',
                          export_normals=True, export_texcoords=False)
print('WROTE', OUT, os.path.getsize(OUT), 'bytes')
