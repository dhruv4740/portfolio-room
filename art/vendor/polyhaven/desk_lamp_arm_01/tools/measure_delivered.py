# Measures the delivered (evaluated, re-rooted) pose that the GLB was exported
# from, and converts key points to glTF Y-up. Run against the work .blend.
import bpy, json, sys, mathutils
D=bpy.data
deps=bpy.context.evaluated_depsgraph_get()
rep={}
def yup(v): return [round(v[0],5), round(v[2],5), round(-v[1],5)]

mn=[1e9]*3; mx=[-1e9]*3; tris=0
emit={'a':0.0,'n':mathutils.Vector(),'c':mathutils.Vector(),'f':0,'mn':[1e9]*3,'mx':[-1e9]*3}
contact={'a':0.0,'c':mathutils.Vector()}
jaw_up=[]; parts={}
for o in D.objects:
    if o.type!='MESH' or not o.name.startswith('geo_'): continue
    ev=o.evaluated_get(deps); m=ev.to_mesh(); mw=ev.matrix_world
    nm=mw.to_3x3().inverted().transposed()
    pmn=[1e9]*3; pmx=[-1e9]*3
    for v in m.vertices:
        w=mw@v.co
        for i in range(3):
            mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
            pmn[i]=min(pmn[i],w[i]); pmx[i]=max(pmx[i],w[i])
    tris+=sum(len(p.vertices)-2 for p in m.polygons)
    parts[o.name]={'min':[round(v,5) for v in pmn],'max':[round(v,5) for v in pmx],
                   'tris':sum(len(p.vertices)-2 for p in m.polygons)}
    names=[s.material.name if s.material else None for s in o.material_slots]
    for p in m.polygons:
        mat=names[p.material_index] if p.material_index<len(names) else None
        if mat and mat.endswith('_light'):
            a=p.area; emit['a']+=a; emit['f']+=1
            emit['n']+=(nm@p.normal).normalized()*a; emit['c']+=(mw@p.center)*a
            for vi in p.vertices:
                w=mw@m.vertices[vi].co
                for i in range(3):
                    emit['mn'][i]=min(emit['mn'][i],w[i]); emit['mx'][i]=max(emit['mx'][i],w[i])
    if o.name=='geo_base_pivot':
        for p in m.polygons:
            n=(nm@p.normal).normalized(); c=mw@p.center
            if n.z<-0.97 and abs(c.z)<0.003: contact['a']+=p.area; contact['c']+=c*p.area
            if n.z>0.97 and -0.055<c.z<-0.040: jaw_up.append((round(c.z,5),p.area))
    if o.name=='geo_pivot-holder':
        for p in m.polygons:
            n=(nm@p.normal).normalized(); c=mw@p.center
            if n.z>0.97 and c.z>-0.03: rep.setdefault('screw_pad',{'a':0.0,'z':0.0}); rep['screw_pad']['a']+=p.area; rep['screw_pad']['z']=round(c.z,5)
    ev.to_mesh_clear()

rep['delivered_bounds_blender_zup']={'min':[round(v,5) for v in mn],'max':[round(v,5) for v in mx],
                                     'size':[round(mx[i]-mn[i],5) for i in range(3)],'tris':tris}
rep['delivered_bounds_gltf_yup']={'min':[round(mn[0],5),round(mn[2],5),round(-mx[1],5)],
                                  'max':[round(mx[0],5),round(mx[2],5),round(-mn[1],5)],
                                  'size':[round(mx[0]-mn[0],5),round(mx[2]-mn[2],5),round(mx[1]-mn[1],5)]}
c=emit['c']/emit['a']; n=emit['n'].normalized()
rep['emitter']={'faces':emit['f'],'area_mm2':round(emit['a']*1e6,2),
                'centroid_blender':[round(v,5) for v in c],'centroid_gltf_yup':yup(c),
                'mean_normal_blender':[round(v,5) for v in n],
                'aim_gltf_yup':[round(n[0],5),round(n[2],5),round(-n[1],5)],
                'bbox_min_gltf':yup(mathutils.Vector(emit['mn'])),'bbox_max_gltf':yup(mathutils.Vector(emit['mx']))}
if contact['a']:
    cc=contact['c']/contact['a']
    rep['desk_contact_face']={'area_mm2':round(contact['a']*1e6,2),
                              'centroid_blender':[round(v,5) for v in cc],'centroid_gltf_yup':yup(cc)}
rep['lower_jaw_up_faces']={'z_values':sorted({z for z,_ in jaw_up}),
                           'area_mm2':round(sum(a for _,a in jaw_up)*1e6,2)}
if 'screw_pad' in rep: rep['screw_pad']['a']=round(rep['screw_pad']['a']*1e6,2)
rep['parts']=parts
print(json.dumps(rep,indent=1))
