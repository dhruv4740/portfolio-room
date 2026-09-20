# Independent check: reimport the exported GLB into an empty Blender scene and
# measure it from scratch. Nothing from the export session is reused.
import bpy, json, sys, mathutils
glb=sys.argv[sys.argv.index('--')+1]
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=glb)
deps=bpy.context.evaluated_depsgraph_get()
mn=[1e9]*3; mx=[-1e9]*3; tris=0; objs=[]
emit={'a':0.0,'n':mathutils.Vector(),'c':mathutils.Vector()}
for o in bpy.data.objects:
    if o.type!='MESH': continue
    objs.append(o.name)
    mw=o.matrix_world; nm=mw.to_3x3().inverted().transposed()
    for v in o.data.vertices:
        w=mw@v.co
        for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
    tris+=sum(len(p.vertices)-2 for p in o.data.polygons)
    names=[s.material.name if s.material else None for s in o.material_slots]
    for p in o.data.polygons:
        n=names[p.material_index] if p.material_index<len(names) else None
        if n and 'light' in n:
            emit['a']+=p.area; emit['n']+=(nm@p.normal).normalized()*p.area; emit['c']+=(mw@p.center)*p.area
mats={}
for m in bpy.data.materials:
    imgs=[(n.image.name, n.image.size[0], n.image.source, bool(n.image.packed_file))
          for n in (m.node_tree.nodes if m.node_tree else []) if n.type=='TEX_IMAGE' and n.image]
    mats[m.name]={'images':imgs,'missing':[i[0] for i in imgs if i[1]==0]}
out={'imported_meshes':len(objs),'triangles':tris,
     'bounds_min':[round(v,5) for v in mn],'bounds_max':[round(v,5) for v in mx],
     'size':[round(mx[i]-mn[i],5) for i in range(3)],
     'emitter_centroid':[round(v,5) for v in (emit['c']/emit['a'])],
     'emitter_aim':[round(v,5) for v in emit['n'].normalized()],
     'materials':mats,
     'lights':[o.name for o in bpy.data.objects if o.type=='LIGHT'],
     'cameras':[o.name for o in bpy.data.objects if o.type=='CAMERA'],
     'armatures':[o.name for o in bpy.data.objects if o.type=='ARMATURE'],
     'names_sample':sorted(objs)[:5]}
print('REIMPORT '+json.dumps(out))
