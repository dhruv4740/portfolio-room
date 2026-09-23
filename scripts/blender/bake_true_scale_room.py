"""Bake room irradiance (no surface colour) for the true-scale room.
Run: node scripts/blender/true-scale-layout.mjs > layout.json, then
TRUE_SCALE_LAYOUT=layout.json blender --background --python scripts/blender/bake_true_scale_room.py
Same method as bake_room.py (lamp off/on atlases, architecture receivers
only); geometry and receiver UVs follow cinematicLayout.js and the uv1
parameterisation in buildCinematicWorkspace.js.
"""
import bpy, pathlib, json, os
from mathutils import Vector
ROOT = pathlib.Path(__file__).resolve().parents[2]
L = json.loads(pathlib.Path(os.environ['TRUE_SCALE_LAYOUT']).read_text())
OUT = ROOT / 'public/materials/after-hours/baked-true-scale'; OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'art/after-hours'; SOURCE.mkdir(parents=True, exist_ok=True)
SMOKE = os.environ.get('BAKE_SMOKE') == '1'

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene; scene.render.engine = 'CYCLES'; scene.cycles.samples = 4 if SMOKE else 64
scene.cycles.use_denoising = True; scene.cycles.max_bounces = 5
scene.render.bake.use_pass_direct = True; scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = False; scene.render.bake.margin = 8
if scene.world is None: scene.world = bpy.data.worlds.new('World')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.20, .29, .45, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .15

def mat(name, color):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*color, 1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .8
    return m
wall = mat('Bake neutral plaster', (.42, .40, .36)); oak = mat('Bake desk bounce', (.20, .11, .055)); black = mat('Bake occluder', (.025, .03, .035))

def cube(name, size, pos, material):
    # three.js (x, y, z) -> Blender (x, -z, y)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(pos[0], -pos[2], pos[1]))
    o = bpy.context.object; o.name = name; o.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(material); return o

I = L['room']['interior']; T = L['room']['wallThickness']; O = L['window']['opening']; wz = L['window']['wallZ']
sx, sy, sz = I['maxX'] - I['minX'], I['ceilingY'] - I['floorY'], I['maxZ'] - I['minZ']
midX, midZ = (I['minX'] + I['maxX']) / 2, (I['minZ'] + I['maxZ']) / 2
wcx = (O['minX'] + O['maxX']) / 2
for name, size, pos in [
    ('back-left', (O['minX'] - I['minX'], sy, T), ((I['minX'] + O['minX']) / 2, sy / 2, wz - T / 2)),
    ('back-right', (I['maxX'] - O['maxX'], sy, T), ((O['maxX'] + I['maxX']) / 2, sy / 2, wz - T / 2)),
    ('below', (O['maxX'] - O['minX'], O['minY'], T), (wcx, O['minY'] / 2, wz - T / 2)),
    ('above', (O['maxX'] - O['minX'], I['ceilingY'] - O['maxY'], T), (wcx, (O['maxY'] + I['ceilingY']) / 2, wz - T / 2)),
    ('left', (T, sy, sz + 2 * T), (I['minX'] - T / 2, sy / 2, midZ)),
    ('right-rear', (T, sy, sz * .62), (I['maxX'] + T / 2, sy / 2, I['minZ'] + sz * .31)),
    ('right-front', (T, sy, sz * .16), (I['maxX'] + T / 2, sy / 2, I['maxZ'] - sz * .08)),
    ('door-header', (T, .45, sz * .22), (I['maxX'] + T / 2, I['ceilingY'] - .225, I['minZ'] + sz * .73)),
    ('front', (sx + 2 * T, sy, T), (midX, sy / 2, I['maxZ'] + T / 2)),
    ('ceiling', (sx + 2 * T, .10, sz + 2 * T), (midX, I['ceilingY'] + .05, midZ)),
    ('floor', (sx + 2 * T, .10, sz + 2 * T), (midX, I['floorY'] - .05, midZ)),
]: cube(name, size, pos, wall)
D = L['desk']
cube('Desk', (D['size'][0], D['thickness'], D['size'][1]), (D['center'][0], D['topY'] - D['thickness'] / 2, D['center'][1]), oak)
for x in (D['center'][0] - D['size'][0] / 2 + D['legInset'], D['center'][0] + D['size'][0] / 2 - D['legInset']):
    for z in (D['center'][1] - D['size'][1] / 2 + .05, D['center'][1] + D['size'][1] / 2 - .05):
        cube('Leg', (D['legSection'], D['topY'], D['legSection']), (x, D['topY'] / 2, z), black)
M = L['monitor']
cube('Monitor', M['enclosureSize'], M['enclosureCenter'], black)
for x in L['speaker']['x']:
    cube('Speaker', L['speaker']['size'], (x, L['speaker']['centerY'], L['speaker']['z']), black)

def area(name, pos, target, power, color, size):
    bpy.ops.object.light_add(type='AREA', location=(pos[0], -pos[2], pos[1]))
    o = bpy.context.object; o.name = name; o.data.energy = power; o.data.color = color; o.data.shape = 'DISK'; o.data.size = size
    to = Vector((target[0], -target[2], target[1])) - o.location; o.rotation_euler = to.to_track_quat('-Z', 'Y').to_euler(); return o
# Powers follow bake_room.py scaled by the shorter throw distances in this room.
area('Cold window', (wcx, (O['minY'] + O['maxY']) / 2, wz - T - .05), (0.2, 0.8, 0.8), 12, (.43, .60, 1), .9)
S = L['screen']['center']
area('Monitor bounce', (S[0], S[1], S[2] + .03), (S[0], S[1] - .4, S[2] + 1.0), 1.5, (.57, .72, .85), .45)
B = L['lampBulb']
LAMP_POWER = 8
lamp = area('Task lamp', B, (B[0] + .15, D['topY'], B[2] + .25), LAMP_POWER, (1, .64, .32), .12)

# Receivers sit a millimetre inside each room surface. Corner UVs match the
# uv1 formulas in buildCinematicWorkspace.js box().
e = .001
receivers = {
    'back': [(I['minX'], I['floorY'], wz + e), (I['maxX'], I['floorY'], wz + e), (I['maxX'], I['ceilingY'], wz + e), (I['minX'], I['ceilingY'], wz + e)],
    'left': [(I['minX'] + e, I['floorY'], I['maxZ']), (I['minX'] + e, I['floorY'], I['minZ']), (I['minX'] + e, I['ceilingY'], I['minZ']), (I['minX'] + e, I['ceilingY'], I['maxZ'])],
    'right': [(I['maxX'] - e, I['floorY'], I['minZ']), (I['maxX'] - e, I['floorY'], I['maxZ']), (I['maxX'] - e, I['ceilingY'], I['maxZ']), (I['maxX'] - e, I['ceilingY'], I['minZ'])],
    'floor': [(I['minX'], I['floorY'] + e, I['maxZ']), (I['maxX'], I['floorY'] + e, I['maxZ']), (I['maxX'], I['floorY'] + e, I['minZ']), (I['minX'], I['floorY'] + e, I['minZ'])],
}
objects = {}
for name, points in receivers.items():
    mesh = bpy.data.meshes.new(name); mesh.from_pydata([(x, -z, y) for x, y, z in points], [], [(0, 1, 2, 3)]); mesh.update()
    o = bpy.data.objects.new('Irradiance ' + name, mesh); bpy.context.collection.objects.link(o)
    uv = mesh.uv_layers.new(name='UVMap')
    for loop, coord in zip(uv.data, [(0, 0), (1, 0), (1, 1), (0, 1)]): loop.uv = coord
    m = mat('Receiver ' + name, (.5, .5, .5)); o.data.materials.append(m)
    objects[name] = o; o.hide_render = True
res = 64 if SMOKE else 512
for mode in ['off', 'on']:
    lamp.data.energy = 0 if mode == 'off' else LAMP_POWER
    for name, o in objects.items():
        o.hide_render = False; bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        img = bpy.data.images.new(name + '-' + mode, res, res, float_buffer=True); img.colorspace_settings.name = 'Non-Color'
        nodes = o.active_material.node_tree.nodes; node = nodes.new('ShaderNodeTexImage'); node.image = img; nodes.active = node
        bpy.ops.object.bake(type='DIFFUSE')
        img.scale(256, 256)
        compact = bpy.data.images.new(name + '-' + mode + '-runtime', 256, 256, alpha=False, float_buffer=False)
        compact.colorspace_settings.name = 'Non-Color'; compact.pixels[:] = img.pixels[:]
        compact.filepath_raw = str(OUT / (name + '-' + mode + '.png')); compact.file_format = 'PNG'; compact.save()
        o.hide_render = True
if not SMOKE:
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'room-lighting-true-scale.blend'))
(OUT / 'manifest.json').write_text(json.dumps({'generator': 'scripts/blender/bake_true_scale_room.py', 'layout': 'src/v3/desktop/cinematicLayout.js',
    'resolution': 256, 'bakeResolution': res, 'samples': scene.cycles.samples, 'channels': 'linear irradiance; no albedo', 'receivers': list(receivers)}, indent=2))
