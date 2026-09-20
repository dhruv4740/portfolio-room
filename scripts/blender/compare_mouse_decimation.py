# Same-camera render of the mouse at a given decimate ratio, so the
# simplification is judged against an actual close-up rather than a tri count.
#
#   blender -b -noaudio --python scripts/blender/compare_mouse_decimation.py -- 1.0 //scripts/shots/mouse-source.png
import bpy, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
ratio, out = float(argv[0]), argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='art/candidates/mouse/computer_mouse_a4tech_bloody_v7/scene.gltf')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
if ratio < 1:
    for o in meshes:
        m = o.modifiers.new('d', 'DECIMATE'); m.ratio = ratio
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=m.name)

lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        for i in range(3):
            lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
c = (lo + hi) / 2
r = max(hi - lo)

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
bpy.context.scene.collection.objects.link(cam)
cam.location = c + Vector((r * 0.55, -r * 0.75, r * 0.45))
cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam

light = bpy.data.lights.new('key', 'AREA'); light.energy = r * r * 120; light.size = r
key = bpy.data.objects.new('key', light)
bpy.context.scene.collection.objects.link(key)
key.location = c + Vector((r, -r, r * 1.5))

sc = bpy.context.scene
try:
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x = 900; sc.render.resolution_y = 700
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('RENDERED', out, 'ratio', ratio)
