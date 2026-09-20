import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Worn leather office chair, prepared by scripts/blender/prepare_chair.py.
// Origin is the centre of the footprint on the floor, and the asset is scaled
// so its seating surface lands on the room's existing seat height, because
// the seated camera and the stand-up anchor are built around that.
//
// Unlike the mouse and the ceiling fixture this stays raycastable: clicking
// the chair is how you sit down (WorkspaceStage reads userData.anchorId).
export function createAuthoredChair({root, fallback, position, rotationY = 0, onReady}) {
  let disposed=false, asset=null;
  const mount=new THREE.Group();mount.name='Authored chair';
  mount.position.set(...position);mount.rotation.y=rotationY;root.add(mount);
  const state={status:'loading'};
  const release=object=>{
    const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))materials.add(m);});
    materials.forEach(m=>{Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
  };
  const ready=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/after-hours/chair.glb`).then(gltf=>{
    if(disposed){release(gltf.scene);return;}
    asset=gltf.scene;asset.updateMatrixWorld(true);
    // Six source parts, six materials, none of which move relative to each
    // other: batch per material so the chair costs six draws, not more.
    const batches=new Map(),originalGeometries=new Set();
    asset.traverse(o=>{if(!o.isMesh)return;
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if(!batches.has(o.material))batches.set(o.material,[]);
      batches.get(o.material).push(g);originalGeometries.add(o.geometry);
    });
    asset.clear();
    for(const [material,parts] of batches){
      const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
      if(!geometry)throw new Error('Chair geometry attributes are incompatible');
      const mesh=new THREE.Mesh(geometry,material);mesh.name=`Chair ${material.name}`;
      mesh.castShadow=true;mesh.receiveShadow=true;
      // Clicking any part of the chair sits you down, as before.
      mesh.userData.anchorId='chair';
      material.envMapIntensity=.5;
      asset.add(mesh);
    }
    originalGeometries.forEach(g=>g.dispose());
    mount.add(asset);fallback.visible=false;
    state.status='ready';onReady?.();
  }).catch(error=>{if(!disposed){state.status='fallback';console.warn('Chair fallback:',error.message);onReady?.();}});
  return {ready,state,mount,
    dispose(){disposed=true;if(asset)release(asset);mount.removeFromParent();},
  };
}
