import bpy
ks=list(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
want=['export_format','export_apply','use_selection','export_yup','export_cameras','export_lights','export_image_format','export_materials','export_skins','export_animations','export_extras','export_texture_dir','export_keep_originals','export_jpeg_quality','export_normals','export_tangents','export_attributes','use_visible','use_active_collection','export_hierarchy_full_collections','export_import_convert_lighting_mode','export_original_specular','export_try_sparse_sk','export_gn_mesh','export_unused_images','export_unused_textures']
print('PRESENT:',[k for k in want if k in ks])
print('MISSING:',[k for k in want if k not in ks])
print('IMAGE_FORMAT enum:',[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_image_format'].enum_items])
print('gltf settings group name hint:')
import io_scene_gltf2, os
try:
    from io_scene_gltf2.blender.exp.material import gltf2_blender_search_node_tree as st
    print(' module ok')
except Exception as e:
    print(' ', e)
