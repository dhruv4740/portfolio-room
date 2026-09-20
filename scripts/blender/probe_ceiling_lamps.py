# Independent measurement of the two ceiling fixture candidates. Reports loop
# triangles, not polygon faces, because earlier candidate READMEs reported
# faces as triangles.
import bpy, glob
from mathutils import Vector

for path in sorted(glob.glob('art/candidates/ceiling-lamp/*/*.fbx')):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    tris = faces = verts = 0
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    mats = set()
    for o in meshes:
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles); faces += len(o.data.polygons)
        verts += len(o.data.vertices)
        for m in o.data.materials:
            if m: mats.add(m.name)
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
    s = hi - lo
    print('LAMP %s objects=%d tris=%d faces=%d verts=%d materials=%d size=(%.3f, %.3f, %.3f)'
          % (path, len(meshes), tris, faces, verts, len(mats), s.x, s.y, s.z))
    print('     material_names=%s' % sorted(mats))
