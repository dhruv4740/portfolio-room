import bpy, json, math, mathutils
D=bpy.data; rig=D.objects['rig_lamp']
for bn in ['ctrl_top_rotation_A','ctrl_top_rotation_B','ctrl_top-position','ctrl_lamp_base_pivot']:
    pb=rig.pose.bones[bn]
    for c in pb.constraints:
        if c.type=='LIMIT_ROTATION':
            print(bn,'LIMIT_ROT use',[getattr(c,a) for a in ['use_limit_x','use_limit_y','use_limit_z']],
                  'x',[round(math.degrees(c.min_x),1),round(math.degrees(c.max_x),1)],
                  'y',[round(math.degrees(c.min_y),1),round(math.degrees(c.max_y),1)],
                  'z',[round(math.degrees(c.min_z),1),round(math.degrees(c.max_z),1)],'space',c.owner_space)
        if c.type=='LIMIT_LOCATION':
            print(bn,'LIMIT_LOC use',[getattr(c,a) for a in ['use_min_x','use_max_x','use_min_y','use_max_y','use_min_z','use_max_z']],
                  'x',[c.min_x,c.max_x],'y',[c.min_y,c.max_y],'z',[c.min_z,c.max_z],'space',c.owner_space)
    print(bn,'rot_mode',pb.rotation_mode,'basis_euler',[round(math.degrees(v),2) for v in pb.matrix_basis.to_euler()],
          'basis_loc',[round(v,5) for v in pb.matrix_basis.translation])

def aim():
    deps=bpy.context.evaluated_depsgraph_get()
    o=D.objects['geo_lamp-head']; ev=o.evaluated_get(deps); m=ev.to_mesh()
    mw=ev.matrix_world; nm=mw.to_3x3().inverted().transposed()
    names=[s.material.name if s.material else None for s in o.material_slots]
    a=0.0; n=mathutils.Vector(); c=mathutils.Vector()
    for p in m.polygons:
        if names[p.material_index].endswith('_light'):
            a+=p.area; n+=(nm@p.normal).normalized()*p.area; c+=(mw@p.center)*p.area
    ev.to_mesh_clear()
    return n.normalized(), c/a

n,c=aim(); print('BASE aim',[round(v,4) for v in n],'centroid',[round(v,4) for v in c])
pb=rig.pose.bones['ctrl_top_rotation_A']; pb.rotation_mode='XYZ'
for axis in [0,1,2]:
    for deg in [-60,-30,30,60]:
        e=[0,0,0]; e[axis]=math.radians(deg)
        pb.rotation_euler=e; bpy.context.view_layer.update()
        n,c=aim()
        print(f'A axis{axis} {deg:+4d}deg aim=[{n.x:+.3f},{n.y:+.3f},{n.z:+.3f}] elev={math.degrees(math.asin(-n.z)):+6.1f}deg c=[{c.x:+.3f},{c.y:+.3f},{c.z:+.3f}]')
    pb.rotation_euler=[0,0,0]; bpy.context.view_layer.update()
