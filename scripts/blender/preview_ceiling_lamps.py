# Untextured shape previews of both ceiling fixture candidates, so the choice
# is made on form and hanging proportion rather than on triangle count.
import bpy, glob, os
from mathutils import Vector

for path in sorted(glob.glob('art/candidates/ceiling-lamp/*/*.fbx')):
    name = os.path.basename(os.path.dirname(path))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in meshes:
        o.data.materials.clear()

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
    # Straight-on elevation: a hanging fixture is judged from the side.
    cam.location = c + Vector((0, -r * 2.6, 0))
    cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam

    light = bpy.data.lights.new('key', 'AREA'); light.energy = r * r * 400; light.size = r * 2
    key = bpy.data.objects.new('key', light)
    bpy.context.scene.collection.objects.link(key)
    key.location = c + Vector((r, -r * 2, r))
    key.rotation_euler = (c - key.location).to_track_quat('-Z', 'Y').to_euler()

    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = 700; sc.render.resolution_y = 700
    sc.render.filepath = '//scripts/shots/fixture-%s.png' % name
    bpy.ops.render.render(write_still=True)
    print('RENDERED', name, 'size=(%.3f, %.3f, %.3f)' % (hi.x - lo.x, hi.y - lo.y, hi.z - lo.z))
