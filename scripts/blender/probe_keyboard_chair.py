# Can the owner's keyboard and chair downloads actually be used?
#
# The keyboard question is not licensing but topology: src/v3/desktop keeps a
# functional key-depression contract (keys / setKey / KEY_ROWS), so individual
# keycaps must be separable. "Loose parts" (connected vertex islands) answers
# that directly — a fused keycap shares geometry with the chassis and cannot
# be moved on its own.
import bpy, bmesh
from mathutils import Vector


def report(label, path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    print('=== %s' % label)
    total_tris = 0
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in meshes:
        o.data.calc_loop_triangles()
        total_tris += len(o.data.loop_triangles)
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])

        # Connected islands within this mesh.
        bm = bmesh.new(); bm.from_mesh(o.data)
        seen = set(); islands = []
        for v in bm.verts:
            if v.index in seen:
                continue
            stack = [v]; seen.add(v.index); size = 0
            zs = []
            while stack:
                cur = stack.pop(); size += 1
                zs.append((o.matrix_world @ cur.co).z)
                for e in cur.link_edges:
                    other = e.other_vert(cur)
                    if other.index not in seen:
                        seen.add(other.index); stack.append(other)
            islands.append((size, min(zs), max(zs)))
        bm.free()
        islands.sort(reverse=True)
        print('  object=%-20s tris=%6d verts=%6d materials=%d islands=%d'
              % (o.name, len(o.data.loop_triangles), len(o.data.vertices),
                 len(o.data.materials), len(islands)))
        print('    largest islands (verts): %s' % [i[0] for i in islands[:6]])
        small = [i for i in islands if i[0] < 200]
        print('    islands under 200 verts: %d  (keycap-sized candidates)' % len(small))
    s = hi - lo
    print('  TOTAL tris=%d size=(%.3f, %.3f, %.3f) objects=%d'
          % (total_tris, s.x, s.y, s.z, len(meshes)))


report('KEYBOARD', 'art/candidates/keyboard/gaming-keyboard/source/keyboard.FBX')
report('CHAIR', 'art/candidates/chair/worn-leather-office-chair/source/Leather Chair.fbx')
