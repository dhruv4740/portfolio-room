"""Extract the licensed source skin and rest joints; never edit its FBX.
Blender -b --factory-startup -P scripts/blender/extract_authored_hands.py
Retargeting is performed separately in build-authored-hands.mjs.
"""
import bpy, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=ROOT/'art/candidates/hands/fp-arms'
OUT=ROOT/'art/after-hours/authored-hands'
TEX=ROOT/'public/models/hands-authored'
OUT.mkdir(parents=True,exist_ok=True);TEX.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(SOURCE/'source/arms2.fbx'))
rig=bpy.data.objects['root'];obj=bpy.data.objects['arm'];mesh=obj.data
mesh.calc_loop_triangles()
data={'source':'DJMaesen / FP arms / CC BY 4.0','bones':{},'vertices':[],'triangles':[]}
for b in rig.data.bones:
    data['bones'][b.name]={'head':list(rig.matrix_world@b.head_local),'tail':list(rig.matrix_world@b.tail_local)}
for v in mesh.vertices:
    data['vertices'].append({'p':list(obj.matrix_world@v.co),
        'weights':[(obj.vertex_groups[g.group].name,g.weight) for g in v.groups if g.weight>0.00001]})
uv=mesh.uv_layers.active
for tri in mesh.loop_triangles:
    data['triangles'].append([{'v':mesh.loops[i].vertex_index,'uv':list(uv.data[i].uv)} for i in tri.loops])
(OUT/'source-skin.json').write_text(json.dumps(data,separators=(',',':')))
for source,name,color in [('fparmsColor.png','color.jpg',True),('fparmsNormal.png','normal.png',False),('fparmsRoughness.png','roughness.jpg',False)]:
    image=bpy.data.images.load(str(SOURCE/'textures'/source))
    image.colorspace_settings.name='sRGB' if color else 'Non-Color'
    image.scale(1024,1024);image.filepath_raw=str(TEX/name)
    image.file_format='PNG' if name.endswith('.png') else 'JPEG';image.save()
print('EXTRACTED',len(data['vertices']),'vertices',len(data['triangles']),'triangles',len(data['bones']),'bones')
