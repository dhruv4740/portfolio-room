# Vertical composition of the hanging industrial lamp: how much of its 1.355 m
# is chain, and where the shade and cage begin, so the drop can be trimmed.
import bpy
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath='art/candidates/ceiling-lamp/hanging-industrial-lamp/hanging_industrial_lamp_4k.fbx')
pts=[]
for o in [o for o in bpy.data.objects if o.type=='MESH']:
    for v in o.data.vertices: pts.append(o.matrix_world @ v.co)
zs=[p.z for p in pts]
lo,hi=min(zs),max(zs)
print('Z_RANGE %.4f %.4f height %.4f' % (lo,hi,hi-lo))
# widest radius per horizontal slice names the shade and the cage
import math
N=24
for i in range(N):
    a=lo+(hi-lo)*i/N; b=lo+(hi-lo)*(i+1)/N
    sl=[p for p in pts if a<=p.z<b]
    if not sl: print('SLICE %2d z=%.3f empty'%(i,a)); continue
    rad=max(math.hypot(p.x,p.y) for p in sl)
    print('SLICE %2d z=%.3f..%.3f max_radius=%.4f n=%d'%(i,a,b,rad,len(sl)))
