"""Run export-hand-reference.mjs first, then Blender --background --python this.
Creates an editable reference with the runtime bind weights. Do not present this
as new authored anatomy: it deliberately preserves the current procedural mesh.
"""
import bpy,json,pathlib
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
data=json.loads((ROOT/'art/after-hours/hand-rig-reference.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def xyz(v): return (v[0],-v[2],v[1])
def mat(name,color,roughness):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=roughness
    return m
materials={'skin':mat('Reference skin',(.45,.25,.16),.82),'sleeve':mat('Reference cloth',(.045,.066,.066),1),'nails':mat('Reference nails',(.40,.23,.17),.58)}
skin_nodes=materials['skin'].node_tree
region=skin_nodes.nodes.new('ShaderNodeVertexColor');region.layer_name='skin_region'
skin_nodes.links.new(region.outputs['Color'],skin_nodes.nodes.get('Principled BSDF').inputs['Base Color'])
for hand in data['hands']:
    armature=bpy.data.armatures.new(hand['name']+' runtime bones')
    rig=bpy.data.objects.new(hand['name']+' bind reference',armature);bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    for i,b in enumerate(hand['bones']):
        bone=armature.edit_bones.new(b['name']);matrix=b['bindWorld']
        bone.head=xyz(matrix[12:15]);bone.tail=bone.head+Vector(xyz(matrix[4:7])).normalized()*.025
        bone.use_deform=True
    for b in hand['bones']:
        if b['parent']>=0: armature.edit_bones[b['name']].parent=armature.edit_bones[hand['bones'][b['parent']]['name']]
    bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False);rig.show_in_front=True
    for part in hand['meshes']:
        mesh=bpy.data.meshes.new(hand['name']+' '+part['name']);p=part['position'];indices=part['index']
        mesh.from_pydata([xyz(p[i:i+3]) for i in range(0,len(p),3)],[],[indices[i:i+3] for i in range(0,len(indices),3)]);mesh.update()
        obj=bpy.data.objects.new(mesh.name,mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(materials[part['name']])
        for poly in mesh.polygons: poly.use_smooth=True
        if part.get('uv'):
            uv=mesh.uv_layers.new(name='UVMap')
            for loop in mesh.loops:
                i=loop.vertex_index*2;uv.data[loop.index].uv=part['uv'][i:i+2]
        if part.get('color'):
            colors=mesh.color_attributes.new(name='skin_region',type='FLOAT_COLOR',domain='POINT')
            for i,c in enumerate(colors.data): c.color=(*part['color'][i*3:i*3+3],1)
        groups=[obj.vertex_groups.new(name=b['name']) for b in hand['bones']]
        for vertex in range(len(p)//3):
            for lane in range(4):
                k=vertex*4+lane;w=part['skinWeight'][k]
                if w>0: groups[part['skinIndex'][k]].add([vertex],w,'REPLACE')
        mod=obj.modifiers.new('Runtime weights reference','ARMATURE');mod.object=rig
        obj['warning']='Reference only. Preserve bone names, bind coordinates and contacts when retopologizing.'
bpy.context.scene.unit_settings.system='METRIC'
note=bpy.data.texts.new('READ BEFORE AUTHORING')
note.write('Runtime bind reference, NOT a finished realism replacement.\nKeep named bones and bind positions. Sculpt/retopologize skin, transfer weights, author UVs and skin maps.\nValidate rest, typing, mug, pen, phone, award before runtime replacement.\nThe displayed 25mm bone tails are editing aids; bind heads/weights are exact.\n')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/after-hours/hand-rig-reference.blend'),compress=True)
