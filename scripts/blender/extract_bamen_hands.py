"""Extract the BAMEN bare hands and arms source skin, rig, and PBR textures.
Run with:
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P scripts/blender/extract_bamen_hands.py
"""
import bpy, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'art/candidates/hands/free-gameready-fps-female-arms'
OUT = ROOT / 'art/after-hours/authored-hands'
TEX = ROOT / 'public/models/hands-authored'

OUT.mkdir(parents=True, exist_ok=True)
TEX.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
fbx_path = SOURCE / 'source/[FPS Female Arms].fbx'
bpy.ops.import_scene.fbx(filepath=str(fbx_path))

rig = bpy.data.objects['[FPS Female Arms] RIG']
left_obj = bpy.data.objects['[FPS Female Left Arm]']
right_obj = bpy.data.objects['[FPS Female Right Arm]']

data = {
    'source': 'BAMEN / FREE GameReady [FPS Female Arms] / CC BY 4.0',
    'bones': {},
    'vertices': [],
    'triangles': []
}

# 1. Extract Rig Bones
for b in rig.data.bones:
    data['bones'][b.name] = {
        'head': list(rig.matrix_world @ b.head_local),
        'tail': list(rig.matrix_world @ b.tail_local)
    }

# 2. Extract Left & Right Arm Meshes
for obj, suffix in [(left_obj, 'L'), (right_obj, 'R')]:
    mesh = obj.data
    mesh.calc_loop_triangles()
    v_offset = len(data['vertices'])
    
    # Vertices
    vgroups = {vg.index: vg.name for vg in obj.vertex_groups}
    for v in mesh.vertices:
        world_p = list(obj.matrix_world @ v.co)
        weights = []
        for g in v.groups:
            if g.group in vgroups and g.weight > 0.0001:
                weights.append([vgroups[g.group], round(g.weight, 5)])
        data['vertices'].append({
            'p': world_p,
            'weights': weights
        })
    
    # Triangles and UVs
    uv_layer = mesh.uv_layers.active
    for tri in mesh.loop_triangles:
        tri_data = []
        for loop_idx in tri.loops:
            v_idx = v_offset + mesh.loops[loop_idx].vertex_index
            uv_coord = list(uv_layer.data[loop_idx].uv)
            tri_data.append({'v': v_idx, 'uv': uv_coord})
        if suffix == 'R':
            tri_data.reverse()
        data['triangles'].append(tri_data)

skin_json = OUT / 'source-skin.json'
skin_json.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
print(f"Extracted {len(data['vertices'])} vertices, {len(data['triangles'])} triangles, {len(data['bones'])} bones to {skin_json}")

# 3. Process Textures (1024x1024 for lightweight WebGL delivery)
tex_source = SOURCE / 'textures'
for src_name, out_name, is_srgb in [
    ('albedo.png', 'color.jpg', True),
    ('normal.png', 'normal.png', False),
    ('roughness.png', 'roughness.jpg', False)
]:
    src_file = tex_source / src_name
    if not src_file.exists():
        print(f"WARNING: Missing {src_file}")
        continue
    img = bpy.data.images.load(str(src_file))
    img.colorspace_settings.name = 'sRGB' if is_srgb else 'Non-Color'
    img.scale(1024, 1024)
    out_path = TEX / out_name
    img.filepath_raw = str(out_path)
    img.file_format = 'PNG' if out_name.endswith('.png') else 'JPEG'
    img.save()
    print(f"Exported texture: {out_path} ({img.size[0]}x{img.size[1]})")

print("EXTRACTION COMPLETE")
