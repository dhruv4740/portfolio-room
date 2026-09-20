# Per-cap footprint and position, so the room's 12x5 KEY_ROWS grid can be
# mapped onto the real caps rather than onto an invented grid.
import bpy, bmesh
from mathutils import Vector

SRC = 'art/candidates/keyboard/gaming-keyboard/source/keyboard.FBX'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
o = [m for m in bpy.data.objects if m.type == 'MESH'][0]
print('MESHES', [m.name for m in bpy.data.objects if m.type == 'MESH'])
print('MATERIALS', [m.name for m in o.data.materials])
print('TRIS', len(o.data.loop_triangles) or sum(len(p.vertices) - 2 for p in o.data.polygons))

bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
seen = set(); islands = []
for v in bm.verts:
    if v.index in seen: continue
    stack=[v]; seen.add(v.index); pts=[]
    while stack:
        cur=stack.pop(); pts.append(o.matrix_world @ cur.co)
        for e in cur.link_edges:
            n=e.other_vert(cur)
            if n.index not in seen: seen.add(n.index); stack.append(n)
    lo=Vector((min(p[i] for p in pts) for i in range(3)))
    hi=Vector((max(p[i] for p in pts) for i in range(3)))
    islands.append({'n':len(pts),'lo':lo,'hi':hi,'c':(lo+hi)/2,'size':hi-lo})
bm.free()
islands.sort(key=lambda i:-i['n'])
print('ISLAND vert-count histogram:')
from collections import Counter
for n,c in sorted(Counter(i['n'] for i in islands).items()): print('  verts=%d count=%d'%(n,c))
caps=[i for i in islands[1:]]
for i in sorted(caps,key=lambda i:(-round(i['c'].y,3), i['c'].x)):
    print('CAP n=%3d c=(%7.4f,%7.4f,%7.4f) size=(%.4f,%.4f,%.4f)'%(i['n'],i['c'].x,i['c'].y,i['c'].z,*i['size']))
