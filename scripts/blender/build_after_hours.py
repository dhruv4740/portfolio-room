"""Editable winter exterior. Blender --background --python this_file.
Coordinates are supplied in three.js Y-up metres, converted once on creation.
No downloaded geometry: all architectural meshes below are original authored
modules. Material provenance for imported maps lives in ASSET-REGISTER.md.
"""
import bpy, math, random, pathlib, json
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models/after-hours'
SOURCE = ROOT / 'art/after-hours'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(1709)

def material(name, color, roughness=0.8, metallic=0, emission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness
    p.inputs['Metallic'].default_value=metallic
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
    return m

M={
 'Winter masonry':material('Winter masonry',(0.16,0.125,0.105)),
 'Winter limestone':material('Winter limestone',(0.26,0.28,0.30)),
 'Winter dark roof':material('Winter dark roof',(0.035,0.045,0.057),.85),
 'Winter metal':material('Winter metal',(0.08,0.095,0.11),.48,.65),
 'Winter snow':material('Winter snow',(0.62,0.70,0.79),.97),
 'Winter glass':material('Winter glass',(0.025,0.041,0.06),.23,.32),
 'Window amber':material('Window amber',(0.64,0.32,0.12),.6,0,.65),
 'Window ivory':material('Window ivory',(0.46,0.49,0.43),.6,0,.45),
 'Window shade':material('Window shade',(0.075,0.095,0.11),.9),
}
B={key:[[],[],[]] for key in M}

def box(key, center, size):
    verts,faces,uvs=B[key]; start=len(verts)
    x,y,z=center; w,h,d=[s*.5 for s in size]
    # Explicit separate face vertices allow physical-scale UV tiling.
    corners=[(x-w,y-h,z-d),(x+w,y-h,z-d),(x+w,y+h,z-d),(x-w,y+h,z-d),
             (x-w,y-h,z+d),(x+w,y-h,z+d),(x+w,y+h,z+d),(x-w,y+h,z+d)]
    for inds,axes in [((0,3,2,1),(0,1)),((4,5,6,7),(0,1)),((0,4,7,3),(2,1)),
                      ((1,2,6,5),(2,1)),((3,7,6,2),(0,2)),((0,1,5,4),(0,2))]:
        base=len(verts)
        for i in inds:
            v=corners[i]; verts.append((v[0],-v[2],v[1])); uvs.append((v[axes[0]],v[axes[1]]))
        faces.append(tuple(range(base,base+4)))

def building(x,z,width,depth,floors,ground=-8,style=0):
    height=floors*2.9+.5; top=ground+height; front=z+depth*.5
    wall='Winter masonry' if style%2==0 else 'Winter limestone'
    box(wall,(x,ground+height*.5,z),(width,height,depth))
    box('Winter dark roof',(x,top+.06,z),(width+.18,.14,depth+.18))
    box('Winter snow',(x,top+.14,z),(width+.12,.09,depth+.12))
    # Cornice, parapet and shaded recesses establish thickness at roof line.
    for level in [ground+.28,top-.25]:
        box('Winter limestone',(x,level,front+.09),(width+.24,.14,.26))
    for dz in [-depth*.5,depth*.5]:
        box(wall,(x,top+.30,z+dz),(width,.46,.16))
        box('Winter snow',(x,top+.55,z+dz),(width+.04,.07,.23))
    cols=max(2,int(width/1.65)); spacing=width/(cols+.35)
    for row in range(floors):
        cy=ground+1.5+row*2.9
        for col in range(cols):
            cx=x+(col-(cols-1)*.5)*spacing; ww=.76 if style%2 else .86
            box('Winter dark roof',(cx,cy,front+.016),(ww+.24,1.55,.038))
            lit=random.random()<.29
            key=random.choice(['Window amber','Window ivory']) if lit else 'Winter glass'
            box(key,(cx,cy,front+.048),(ww,1.28,.02))
            for dx in [-ww*.5-.045,ww*.5+.045]:
                box('Winter limestone',(cx+dx,cy,front+.082),(.075,1.47,.15))
            box('Winter limestone',(cx,cy-.72,front+.12),(ww+.32,.11,.32))
            box('Winter snow',(cx,cy-.65,front+.16),(ww+.25,.035,.22))
            box('Winter metal',(cx,cy,front+.095),(.035,1.28,.05))
            box('Winter metal',(cx,cy+.04,front+.095),(ww,.038,.05))
            if lit:
                # Unequal curtain coverage, not repeated glowing rectangles.
                curtain=ww*random.uniform(.12,.42)
                box('Window shade',(cx-ww*.5+curtain*.5,cy,front+.069),(curtain,1.28,.014))
                box('Window shade',(cx,cy+random.uniform(.25,.48),front+.071),(ww,.11,.018))
        if row and style%2==0:
            box('Winter limestone',(x,ground+row*2.9,front+.035),(width,.095,.12))
    # Vertical drain pipe and brackets.
    px=x+width*.5-.12
    box('Winter metal',(px,ground+height*.5,front+.16),(.085,height,.085))
    for row in range(floors):
        box('Winter metal',(px,ground+row*2.9+.5,front+.18),(.14,.07,.15))
    # Rooftop service shed, ducts, chimney and snow caps.
    box('Winter dark roof',(x-width*.22,top+.48,z),(width*.22,.8,depth*.26))
    box('Winter snow',(x-width*.22,top+.91,z),(width*.24,.07,depth*.28))
    box(wall,(x+width*.27,top+.66,z-depth*.2),(.52,1.25,.62))
    box('Winter snow',(x+width*.27,top+1.30,z-depth*.2),(.68,.08,.78))
    box('Winter metal',(x,top+.28,z+.5),(width*.36,.3,.4))
    # Fire escape on one frontage, with actual landings and railings.
    if style==0:
        ex=x-width*.33
        for row in range(1,min(floors,5)):
            y=ground+row*2.9+.45
            box('Winter metal',(ex,y,front+.58),(1.5,.065,.9))
            for k in range(9):
                box('Winter metal',(ex-.7+k*.175,y+.48,front+1.0),(.025,.92,.025))
            box('Winter metal',(ex,y+.96,front+1.0),(1.5,.03,.03))
            for k in range(11):
                box('Winter metal',(ex-.48,y-k*.24,front+.35+k*.045),(.55,.025,.13))

# Near buildings flank a gap; the view has a street canyon and distant scale.
building(-5.7,-11,6.4,5.5,5,-9,0)
building(8.2,-14,7.0,6.0,6,-10,1)
building(.5,-24,8.5,7.0,6,-11,2)
building(-11,-29,8,7,9,-12,1)
building(12,-33,9,8,10,-13,0)
building(-1,-43,9,8,11,-16,1)
building(-15,-49,11,8,13,-17,2)
building(19,-54,12,9,14,-18,1)
for i in range(16):
    x=-45+i*6.2; z=-68-random.uniform(0,18); h=random.uniform(13,29)
    box('Winter dark roof',(x,h*.5-17,z),(random.uniform(3,5),h,5))
    for row in range(int(h/2.5)):
        for col in range(3):
            if random.random()<.18:
                box('Window ivory',(x+(col-1)*.9,-15+row*2.5,z+2.51),(.35,.7,.025))

objects=[]
for name,(verts,faces,uvs) in B.items():
    if not verts: continue
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    mesh.materials.append(M[name]); uv=mesh.uv_layers.new(name='UVMap')
    for polygon in mesh.polygons:
        for loop in polygon.loop_indices: uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    objects.append(obj)

bpy.context.scene.world.color=(.08,.10,.15)
bpy.ops.object.light_add(type='AREA',location=(2,3,7))
bpy.context.object.name='Authoring sky'; bpy.context.object.data.energy=1800; bpy.context.object.data.size=12
bpy.ops.object.camera_add(location=(1.1,0.45,1.93))
camera=bpy.context.object; camera.rotation_euler=(Vector((1.45,12,2))-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'winter-city.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in objects: obj.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'winter-city.glb'),export_format='GLB',use_selection=True,export_yup=True,export_cameras=False,export_lights=False)
manifest={'generator':'scripts/blender/build_after_hours.py','source':'art/after-hours/winter-city.blend','runtime':'public/models/after-hours/winter-city.glb','units':'metres','objects':len(objects),'triangles':sum(len(o.data.polygons)*2 for o in objects)}
(OUT/'city-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest))
