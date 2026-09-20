# Which way does the prepared mouse face? A mouse is tall at the palm rest and
# low at the button/wheel end, so the height profile along its long axis names
# the front without guessing. Reports in glTF axes (Y up), as the runtime sees it.
import bpy, sys
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='art/vendor/sketchfab/a4tech_bloody_v7/export/mouse.glb')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']

pts = []
for o in meshes:
    for v in o.data.vertices:
        pts.append(o.matrix_world @ v.co)

lo = Vector((min(p[i] for p in pts) for i in range(3)))
hi = Vector((max(p[i] for p in pts) for i in range(3)))
print('BOUNDS_BLENDER min=(%.4f,%.4f,%.4f) max=(%.4f,%.4f,%.4f)' % (*lo, *hi))

# Split along Blender Y (the long axis) and compare peak height in each half.
mid = (lo.y + hi.y) / 2
for name, sel in (('Y_NEG_HALF', lambda p: p.y < mid), ('Y_POS_HALF', lambda p: p.y >= mid)):
    h = [p for p in pts if sel(p)]
    print('%s peak_z=%.4f mean_z=%.4f n=%d'
          % (name, max(p.z for p in h), sum(p.z for p in h) / len(h), len(h)))

# glTF conversion is (x, y, z)_blender -> (x, z, -y)_gltf.
print('GLTF_BOUNDS min=(%.4f,%.4f,%.4f) max=(%.4f,%.4f,%.4f)'
      % (lo.x, lo.z, -hi.y, hi.x, hi.z, -lo.y))
