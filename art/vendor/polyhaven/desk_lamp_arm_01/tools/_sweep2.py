import bpy, math, mathutils
D=bpy.data; rig=D.objects['rig_lamp']
A=rig.pose.bones['ctrl_top_rotation_A']; B=rig.pose.bones['ctrl_top_rotation_B']
P=rig.pose.bones['ctrl_top-position']
A.rotation_mode='XYZ'; B.rotation_mode='XYZ'
def state():
    deps=bpy.context.evaluated_depsgraph_get()
    o=D.objects['geo_lamp-head']; ev=o.evaluated_get(deps); m=ev.to_mesh()
    mw=ev.matrix_world; nm=mw.to_3x3().inverted().transposed()
    names=[s.material.name if s.material else None for s in o.material_slots]
    a=0.0; n=mathutils.Vector(); c=mathutils.Vector(); mnz=1e9; mxz=-1e9
    for p in m.polygons:
        for vi in p.vertices:
            z=(mw@m.vertices[vi].co).z; mnz=min(mnz,z); mxz=max(mxz,z)
        if names[p.material_index].endswith('_light'):
            a+=p.area; n+=(nm@p.normal).normalized()*p.area; c+=(mw@p.center)*p.area
    ev.to_mesh_clear()
    return n.normalized(), c/a, mnz, mxz
print('       Bz     Ay    aim                elev   emitter(x,y,z)         headZ')
for bz in [-96,-80,-65,-55.56,-40,-20,0,20,40,60,75]:
    B.rotation_euler=(0,0,math.radians(bz))
    for ay in [0,28.78,60,90]:
        A.rotation_euler=(0,math.radians(ay),0)
        bpy.context.view_layer.update()
        n,c,mnz,mxz=state()
        print(f'  {bz:+7.1f} {ay:+6.1f}  [{n.x:+.3f},{n.y:+.3f},{n.z:+.3f}] {math.degrees(math.asin(max(-1,min(1,-n.z)))):+6.1f}  [{c.x:+.3f},{c.y:+.3f},{c.z:+.3f}]  {mnz:.3f}..{mxz:.3f}')
