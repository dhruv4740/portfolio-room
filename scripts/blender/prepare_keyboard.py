# Gaming mechanical keyboard -> room asset.
#
# The FBX is one mesh, but it is not monolithic: loose-part analysis finds a
# 6600-vert chassis, 92 keycaps of identical 333-vert topology, and one junk
# 14-vert plane. Identical topology is the instancing case, so we export a
# single canonical 1u keycap plus the chassis and let the runtime instance the
# caps. That keeps the room's existing InstancedMesh contract (instanceId ->
# setKey -> KEY_ROWS) intact instead of rewriting it.
#
# Emits:
#   public/models/after-hours/keyboard.glb   chassis + canonical keycap
#   src/v3/desktop/keyboardLayout.js         92 ordered instances, room space
import bpy, bmesh, os, json
from mathutils import Vector

SRC = os.path.abspath('art/candidates/keyboard/gaming-keyboard/source/keyboard.FBX')
TEX = os.path.abspath('art/candidates/keyboard/gaming-keyboard/textures')
OUT = os.path.abspath('public/models/after-hours/keyboard.glb')
LAYOUT = os.path.abspath('src/v3/desktop/keyboardLayout.js')

# Room contract. The case is .48 x .20 and cap tops sit at 1.2375 (that is
# WORKSPACE.anchors.keyboard, and KEY_TOP in WorkspaceStage drives finger dip).
CASE_W, CASE_Z, KEY_TOP = 0.48, 0.28, 1.2375

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
src = [o for o in bpy.data.objects if o.type == 'MESH'][0]

bm = bmesh.new(); bm.from_mesh(src.data); bm.verts.ensure_lookup_table()
seen = set(); islands = []
for v in bm.verts:
    if v.index in seen: continue
    stack = [v]; seen.add(v.index); idx = []
    while stack:
        cur = stack.pop(); idx.append(cur.index)
        for e in cur.link_edges:
            n = e.other_vert(cur)
            if n.index not in seen: seen.add(n.index); stack.append(n)
    pts = [src.matrix_world @ bm.verts[i].co for i in idx]
    lo = Vector((min(p[i] for p in pts) for i in range(3)))
    hi = Vector((max(p[i] for p in pts) for i in range(3)))
    islands.append({'idx': set(idx), 'n': len(idx), 'lo': lo, 'hi': hi,
                    'c': (lo + hi) / 2, 'size': hi - lo})
bm.free()

chassis = max(islands, key=lambda i: i['n'])
caps = [i for i in islands if i['n'] == 333]
assert len(caps) == 92, len(caps)
print('CHASSIS lo=%s hi=%s' % (tuple(round(v, 4) for v in chassis['lo']),
                               tuple(round(v, 4) for v in chassis['hi'])))

# --- scale and placement -----------------------------------------------------
S = CASE_W / chassis['size'].x                       # uniform; no distortion
UNIT = 0.0390                                        # 1u cap footprint in source
home = [c for c in caps if abs(c['c'].y + 0.0220) < 0.006 and abs(c['size'].x - UNIT) < 1e-3]
assert home, 'home row not found'
Y0 = KEY_TOP - max(c['hi'].z for c in home) * S      # home-row cap tops land on KEY_TOP
print('SCALE %.5f  Y0 %.5f  depth %.4f' % (S, Y0, chassis['size'].y * S))
print('CHASSIS y bottom=%.5f top=%.5f' % (chassis['lo'].z * S + Y0, chassis['hi'].z * S + Y0))
print('CAP tops y %.5f .. %.5f' % (min(c['hi'].z for c in caps) * S + Y0,
                                   max(c['hi'].z for c in caps) * S + Y0))

def room(c):
    # Blender Z-up -> room: x->x, z->y, -y->z (the glTF axis convention).
    return [c.x * S, c.z * S + Y0, -c.y * S + CASE_Z]

# --- grid mapping ------------------------------------------------------------
# KEY_ROWS is 12 columns x 5 rows. Rows match the real rows back to front;
# within a row we take the run of 1u caps carrying those legends, skipping the
# left macro column and the wide modifiers.
# Cluster rows on y: the macro column sits a couple of millimetres off its
# row's centre, so exact keys would split each row in two.
rows = {}
for c in sorted(caps, key=lambda c: -c['c'].y):
    hit = next((k for k in rows if abs(k - c['c'].y) < 0.012), None)
    rows.setdefault(hit if hit is not None else round(c['c'].y, 4), []).append(c)
ys = sorted(rows, reverse=True)
print('ROWS ' + ' '.join('%.3f:%d' % (y, len(rows[y])) for y in ys))
assert len(ys) == 6, ys

def unit_run(y, skip, count):
    r = sorted([c for c in rows[y] if abs(c['size'].x - UNIT) < 1e-3], key=lambda c: c['c'].x)
    out = r[skip:skip + count]
    assert len(out) == count, (y, len(r), count)
    return out

def at(y, x):
    m = [c for c in rows[y] if abs(c['c'].x - x) < 0.004]
    assert len(m) == 1, (y, x, len(m))
    return m[0]

fn, num, qwe, asd, zxc, spc = ys
grid = []
grid += unit_run(num, 2, 12)                         # 1234567890-=  (skips macro col and ~)
grid += unit_run(qwe, 1, 12)                         # qwertyuiop[]  (skips macro col)
grid += unit_run(asd, 1, 11) + [at(qwe, 0.2387)]     # asdfghjkl;' then the real backslash key
grid += unit_run(zxc, 1, 10) + [at(zxc, 0.2126), at(zxc, 0.3444)]  # zxcvbnm,./ + two blanks
grid += sorted(rows[spc], key=lambda c: c['c'].x)    # bottom row, all blank
assert len(grid) == 60, len(grid)
ids = {id(c) for c in grid}
rest = [c for c in caps if id(c) not in ids]
assert len(ids) == 60 and len(rest) == 32, (len(ids), len(rest))
escape = min(rows[fn], key=lambda c: c['c'].x)

layout = [{'p': [round(v, 5) for v in room(c['c'])],
           'w': round(c['size'].x / UNIT, 4),
           'esc': c is escape} for c in grid + rest]

# --- build the export --------------------------------------------------------
def extract(island, name):
    b = bmesh.new(); b.from_mesh(src.data); b.verts.ensure_lookup_table()
    bmesh.ops.delete(b, geom=[v for v in b.verts if v.index not in island['idx']], context='VERTS')
    me = bpy.data.meshes.new(name); b.to_mesh(me); b.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    ob.matrix_world = src.matrix_world.copy()
    return ob

cap_src = min(home, key=lambda c: abs(c['c'].x))
cap = extract(cap_src, 'Keycap')
case = extract(chassis, 'Chassis')
bpy.data.objects.remove(src, do_unlink=True)

for ob in (cap, case):
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.select_set(False)

# One cap is drawn 92 times, so its triangle count is the dominant cost: the
# raw 632-tri sculpt would be 58k triangles of keycap. Decimated to roughly a
# quarter it still keeps the dished top and chamfered edges at this size.
bpy.context.view_layer.objects.active = cap
d = cap.modifiers.new('cap', 'DECIMATE'); d.ratio = 0.26
bpy.ops.object.modifier_apply(modifier=d.name)

# Canonical cap: centred on its own bounds and scaled to room size. The runtime
# supplies the label atlas, so replace the asset UVs with a top-down 0..1
# projection over the cap bounds - the same 0..1 space the RoundedBoxGeometry it
# replaces provided, but with the legend square on the top face.
lo, hi = cap_src['lo'], cap_src['hi']
uv = cap.data.uv_layers[0]
for poly in cap.data.polygons:
    for li in poly.loop_indices:
        co = cap.data.vertices[cap.data.loops[li].vertex_index].co
        # v is inverted here: the glTF exporter negates v on the way out, and
        # the label atlas is a CanvasTexture (flipY = true), so the two
        # conventions would otherwise cancel the wrong way and print upside down.
        uv.data[li].uv = ((co.x - lo.x) / (hi.x - lo.x), 1.0 - (co.y - lo.y) / (hi.y - lo.y))
cc = cap_src['c']
for v in cap.data.vertices: v.co = (v.co - cc) * S
cap.data.materials.clear()

# Chassis: origin at the board centre in X/Y and at its own underside in Z, so
# the runtime places it with a single position.
bc = chassis['c']
for v in case.data.vertices:
    v.co = Vector(((v.co.x - bc.x) * S, (v.co.y - bc.y) * S, (v.co.z - chassis['lo'].z) * S))

m = bpy.data.materials.new('Keyboard case'); m.use_nodes = True
tree = m.node_tree; bsdf = tree.nodes['Principled BSDF']

def tex(fname, noncolor=False):
    n = tree.nodes.new('ShaderNodeTexImage')
    n.image = bpy.data.images.load(os.path.join(TEX, fname))
    if noncolor: n.image.colorspace_settings.name = 'Non-Color'
    n.image.scale(1024, 1024)
    return n

tree.links.new(tex('keyboard_13 - Default_BaseColor.jpeg').outputs['Color'], bsdf.inputs['Base Color'])
tree.links.new(tex('keyboard_13 - Default_Roughness.jpeg', True).outputs['Color'], bsdf.inputs['Roughness'])
tree.links.new(tex('keyboard_13 - Default_Metallic.jpeg', True).outputs['Color'], bsdf.inputs['Metallic'])
nm = tree.nodes.new('ShaderNodeNormalMap')
tree.links.new(tex('keyboard_13 - Default_Normal.jpeg', True).outputs['Color'], nm.inputs['Color'])
tree.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
case.data.materials.clear(); case.data.materials.append(m)

tris = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
print('EXPORT chassis tris=%d cap tris=%d' % (tris(case), tris(cap)))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True,
                          export_image_format='JPEG', export_jpeg_quality=82,
                          export_yup=True, export_apply=True)
print('GLB %.2f MiB' % (os.path.getsize(OUT) / 1048576))

with open(LAYOUT, 'w', encoding='utf-8') as f:
    f.write('// Generated by scripts/blender/prepare_keyboard.py - do not edit by hand.\n'
            '// 92 keycap instances in room space. The first 60 are the KEY_ROWS grid in\n'
            '// row-major order (instanceId -> setKey depends on that); the remaining 32\n'
            '// are modifiers, which setKey already ignores because it bounds-checks 60.\n'
            '// p: cap centre. w: width in 1u units - the canonical cap is stretched in x\n'
            '// for wide keys. esc: the orange accent cap.\n'
            'export const KEYCAPS = %s;\n' % json.dumps(layout, separators=(',', ':')))
print('LAYOUT %d instances' % len(layout))
