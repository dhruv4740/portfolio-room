import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Mechanical keyboard, prepared by scripts/blender/prepare_keyboard.py.
//
// The asset ships two meshes: the chassis, and one canonical 1u keycap. The
// caps are instanced because all 92 of them share 333-vert topology in the
// source, which means the room's existing InstancedMesh stays the same object
// throughout — instanceId, setKey and the hit path never see a load boundary.
// So this does not build the caps; it swaps the geometry underneath the
// InstancedMesh that buildWorkspace already created, and the procedural
// RoundedBoxGeometry it replaces is the failed-load fallback.
export function createAuthoredKeyboard({root, keys, fallback, position, onReady}) {
  let disposed = false, chassis = null;
  const state = {status: 'loading'};
  const release = object => {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    object.traverse(o => {
      if (o.geometry) geometries.add(o.geometry);
      for (const m of (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean)) materials.add(m);
    });
    materials.forEach(m => { Object.values(m).forEach(t => { if (t?.isTexture) textures.add(t); }); m.dispose(); });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
  };
  const ready = new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/after-hours/keyboard.glb`).then(gltf => {
    if (disposed) { release(gltf.scene); return; }
    const cap = gltf.scene.getObjectByName('Keycap');
    const body = gltf.scene.getObjectByName('Chassis');
    if (!cap?.isMesh || !body?.isMesh) throw new Error('keyboard.glb is missing Keycap or Chassis');

    // buildRoomInteractions puts the per-instance label slot on the geometry,
    // so it has to come across with the swap or every cap reads the same cell.
    const slot = keys.geometry.getAttribute('keySlot');
    const capGeometry = cap.geometry;
    capGeometry.setAttribute('keySlot', slot);
    keys.geometry.dispose();
    keys.geometry = capGeometry;
    keys.computeBoundingSphere();

    chassis = new THREE.Mesh(body.geometry, body.material);
    chassis.name = 'Keyboard case';
    chassis.position.set(...position);
    chassis.castShadow = true; chassis.receiveShadow = true;
    chassis.material.envMapIntensity = .4;
    root.add(chassis);
    fallback.visible = false;
    state.status = 'ready'; onReady?.();
  }).catch(error => {
    if (disposed) return;
    state.status = 'fallback';
    console.warn('Keyboard fallback:', error.message);
    onReady?.();
  });
  return {ready, state,
    dispose() { disposed = true; if (chassis) { release(chassis); chassis.removeFromParent(); } },
  };
}
