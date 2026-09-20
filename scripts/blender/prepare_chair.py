# Prepare the owner's worn leather office chair for the room.
#
#   blender -b -noaudio --python scripts/blender/prepare_chair.py -- [resolution]
#
# The source exports at 3.22 x 2.39 x 3.32 (no real-world scale). The room's
# procedural chair puts the seat top at y=0.665 and the back at z=1.414, and
# the seated camera, contact shadow and stand-up anchor are all built around
# those, so the import is scaled to match the SEAT HEIGHT rather than to a
# nominal overall size.
import bpy, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
RESOLUTION = int(argv[0]) if argv else 1024

SRC = 'art/candidates/chair/worn-leather-office-chair/source/Leather Chair.fbx'
TEX = 'art/candidates/chair/worn-leather-office-chair/textures'
OUT = 'art/vendor/sketchfab/worn_leather_office_chair/export/chair.glb'
WORK = 'art/vendor/sketchfab/worn_leather_office_chair/work'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=SRC)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']


def bounds():
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in meshes:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            for i in range(3):
                lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
    return lo, hi


def stats(label):
    lo, hi = bounds()
    tris = 0
    for o in meshes:
        o.data.calc_loop_triangles(); tris += len(o.data.loop_triangles)
    s = hi - lo
    print('%s tris=%d size=(%.4f, %.4f, %.4f) z=%.4f..%.4f'
          % (label, tris, s.x, s.y, s.z, lo.z, hi.z))
    return lo, hi


stats('SOURCE')

bpy.ops.object.select_all(action='DESELECT')
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo, hi = stats('FLATTENED')

# The seating surface is the top of the "Leather Seating" mesh.
seat = next(o for o in meshes if 'Seating' in o.name)
seat_top = max((seat.matrix_world @ v.co).z for v in seat.data.vertices)
print('SOURCE_SEAT_TOP %.4f of total height %.4f' % (seat_top - lo.z, hi.z - lo.z))

# Room contract: floor at y=0 (legs start y=0.12 procedurally, but the chair
# should stand on the floor), seat top at y=0.665.
TARGET_SEAT = 0.665
scale = TARGET_SEAT / (seat_top - lo.z)
centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
for o in meshes:
    o.location -= centre
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
for o in meshes:
    o.scale = (scale, scale, scale)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
print('SCALE %.6f' % scale)
lo, hi = stats('FITTED')
print('FITTED_SEAT_TOP %.4f' % (max((seat.matrix_world @ v.co).z for v in seat.data.vertices)))

# Textures: 2K/1K PNG source, 24 files. Resize and let the glTF exporter pack
# roughness with the AO/metal channel it needs.
os.makedirs(bpy.path.abspath('//%s' % WORK), exist_ok=True)


def image(name, colorspace='Non-Color'):
    path = os.path.abspath(os.path.join(TEX, name))
    if not os.path.exists(path):
        return None
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = colorspace
    if max(img.size) > RESOLUTION:
        img.scale(RESOLUTION, RESOLUTION)
    img.filepath_raw = '//%s/%s_%d.png' % (WORK, name.rsplit('.', 1)[0], RESOLUTION)
    img.file_format = 'PNG'
    img.save()
    return img


# Material name -> texture prefix actually present on disk.
PREFIX = {
    'Chair Arc': 'Chair_Arc', 'Chair_Arc': 'Chair_Arc',
    'Chair Details': 'Chair_Details', 'Chair_Details': 'Chair_Details',
    'Leather Seating': 'Leather_Seating', 'Leather_Seating': 'Leather_Seating',
    'Leather Top': 'Leather_Top', 'Leather_Top': 'Leather_Top',
    'Wood  Front': 'Wood__Front', 'Wood__Front': 'Wood__Front', 'Wood Front': 'Wood__Front',
    'Wood Legs': 'Wood_Legs', 'Wood_Legs': 'Wood_Legs',
}


def build(material):
    prefix = PREFIX.get(material.name)
    if not prefix:
        print('UNMAPPED material %s' % material.name)
        return
    material.use_nodes = True
    nt = material.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    def tex(img, socket):
        if not img:
            return
        node = nt.nodes.new('ShaderNodeTexImage')
        node.image = img
        nt.links.new(node.outputs['Color'], socket)

    tex(image('%s_Base_Color.png' % prefix, 'sRGB'), bsdf.inputs['Base Color'])
    tex(image('%s_Roughness.png' % prefix), bsdf.inputs['Roughness'])
    normal = image('%s_Normal_OpenGL.png' % prefix) or image('%s_Normal.png' % prefix)
    if normal:
        nmap = nt.nodes.new('ShaderNodeNormalMap')
        tex(normal, nmap.inputs['Color'])
        nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Metallic'].default_value = 0.0
    print('MATERIAL %s <- %s' % (material.name, prefix))


for material in bpy.data.materials:
    build(material)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True,
                          export_materials='EXPORT', export_normals=True,
                          export_image_format='JPEG', export_jpeg_quality=80)
print('WROTE', OUT, os.path.getsize(OUT), 'bytes')
