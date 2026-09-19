"""Bake reusable room irradiance, excluding surface color, for the runtime room.
Run with Blender --background --python scripts/blender/bake_room.py.
Direct and indirect task illumination are separated by on/off atlases. Hero
objects remain real-time shaded; this bake covers the architecture only.
"""
import bpy, pathlib, math, json
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'public/materials/after-hours/baked'; OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'art/after-hours'; SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=24
scene.cycles.use_denoising=True; scene.cycles.max_bounces=5
scene.render.bake.use_pass_direct=True; scene.render.bake.use_pass_indirect=True
scene.render.bake.use_pass_color=False; scene.render.bake.margin=8
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.20,.29,.45,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.15

def mat(name,color):
    m=bpy.data.materials.new(name); m.use_nodes=True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
    return m
wall=mat('Bake neutral plaster',(.42,.40,.36)); oak=mat('Bake desk bounce',(.20,.11,.055)); black=mat('Bake occluder',(.025,.03,.035))
def cube(name,size,pos,material):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(pos[0],-pos[2],pos[1]))
    o=bpy.context.object;o.name=name;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);return o
for name,size,pos in [
 ('left',(0.16,3.12,3.88),(-2.43,1.58,.1)),('right',(.16,3.12,3.88),(2.43,1.58,.1)),
 ('back-left',(3.135,3.12,.16),(-.9325,1.58,-1.8)),('back-right',(.375,3.12,.16),(2.3125,1.58,-1.8)),
 ('below',(1.49,.955,.16),(1.38,.4975,-1.8)),('above',(1.49,.165,.16),(1.38,3.0575,-1.8)),
 ('ceiling',(5,.08,4.1),(0,3.18,.1)),('floor',(5,.08,3.9),(0,.025,.1)),('front',(5,3.12,.16),(0,1.58,2.16))]:cube(name,size,pos,wall)
cube('Desk',(3.52,.12,1.45),(0,1.105,-.04),oak)
cube('Monitor',(1.40,.93,.085),(0,1.79,-.418),black)
for x in [-1.46,1.46]:
 for z in [-.54,.49]:cube('Leg',(.052,1,.052),(x,.565,z),black)
cube('Tower',(.35,.64,.64),(1,.405,-.38),black)

def area(name,pos,target,power,color,size):
    bpy.ops.object.light_add(type='AREA',location=(pos[0],-pos[2],pos[1]))
    o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size
    to=Vector((target[0],-target[2],target[1]))-o.location;o.rotation_euler=to.to_track_quat('-Z','Y').to_euler();return o
area('Cold window',(1.4,2,-1.55),(0,1,.5),32,(.43,.60,1),1.4)
area('Monitor bounce',(0,1.8,-.35),(0,1.2,.7),3,(.57,.72,.85),.7)
lamp=area('Task lamp',(-1.02,1.82,-.39),(-.7,1.1,.05),24,(1,.64,.32),.18)

# Light receivers are a millimetre inside the matching room surfaces. Their
# UVs span the same world extents used in afterHours.js; window aperture is
# baked but never sampled by runtime geometry.
receivers={
 'back':[(-2.5,.02,-1.719),(2.5,.02,-1.719),(2.5,3.14,-1.719),(-2.5,3.14,-1.719)],
 'left':[(-2.349,.02,2.04),(-2.349,.02,-1.84),(-2.349,3.14,-1.84),(-2.349,3.14,2.04)],
 'right':[(2.349,.02,-1.84),(2.349,.02,2.04),(2.349,3.14,2.04),(2.349,3.14,-1.84)],
 'floor':[(-2.5,.066,2.05),(2.5,.066,2.05),(2.5,.066,-1.85),(-2.5,.066,-1.85)]}
objects={}
for name,points in receivers.items():
    mesh=bpy.data.meshes.new(name);mesh.from_pydata([(x,-z,y) for x,y,z in points],[],[(0,1,2,3)]);mesh.update()
    o=bpy.data.objects.new('Irradiance '+name,mesh);bpy.context.collection.objects.link(o)
    uv=mesh.uv_layers.new(name='UVMap')
    for loop,coord in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=coord
    m=mat('Receiver '+name,(.5,.5,.5));o.data.materials.append(m)
    objects[name]=o;o.hide_render=True
for mode in ['off','on']:
    lamp.data.energy=0 if mode=='off' else 24
    for name,o in objects.items():
        o.hide_render=False;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        img=bpy.data.images.new(name+'-'+mode,512,512,float_buffer=True);img.colorspace_settings.name='Non-Color'
        nodes=o.active_material.node_tree.nodes;node=nodes.new('ShaderNodeTexImage');node.image=img;nodes.active=node
        bpy.ops.object.bake(type='DIFFUSE')
        # Irradiance is low frequency: downsample and store linear byte PNG,
        # not Blender's default 16-bit RGBA float-image export (~10MB total).
        img.scale(256,256)
        compact=bpy.data.images.new(name+'-'+mode+'-runtime',256,256,alpha=False,float_buffer=False)
        compact.colorspace_settings.name='Non-Color';compact.pixels[:]=img.pixels[:]
        compact.filepath_raw=str(OUT/(name+'-'+mode+'.png'));compact.file_format='PNG';compact.save()
        o.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'room-lighting.blend'))
(OUT/'manifest.json').write_text(json.dumps({'generator':'scripts/blender/bake_room.py','source':'art/after-hours/room-lighting.blend','resolution':256,'bakeResolution':512,'samples':24,'channels':'linear irradiance; no albedo','receivers':list(receivers)},indent=2))
