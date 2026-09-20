import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Licensed A4Tech Bloody V7, prepared by scripts/blender/prepare_mouse.py.
// Origin is the centre of the footprint on the base plane, metre scale, and
// the button/wheel end faces -Z, so it drops straight onto the mat.
// Six source parts share five materials and never move relative to each
// other: batch them the way the task lamp does rather than pay six draws.
export function createAuthoredMouse({root, fallback, anchor, onReady}) {
  let disposed=false, asset=null;
  const mount=new THREE.Group();mount.name='Authored mouse';
  mount.position.set(...anchor.position);mount.rotation.y=anchor.rotationY;
  root.add(mount);
  const state={status:'loading'};
  const release=object=>{
    const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))materials.add(m);});
    materials.forEach(m=>{Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
  };
  const ready=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/after-hours/mouse.glb`).then(gltf=>{
    if(disposed){release(gltf.scene);return;}
    asset=gltf.scene;asset.updateMatrixWorld(true);
    const batches=new Map(),originalGeometries=new Set();
    asset.traverse(o=>{if(!o.isMesh)return;
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      // Nothing samples UVs: the source ships no textures at all.
      for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);
      if(!batches.has(o.material))batches.set(o.material,[]);
      batches.get(o.material).push(g);originalGeometries.add(o.geometry);
    });
    asset.clear();
    for(const [material,parts] of batches){
      const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
      if(!geometry)throw new Error('Mouse geometry attributes are incompatible');
      const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};
      material.envMapIntensity=.65;
      asset.add(mesh);
    }
    originalGeometries.forEach(g=>g.dispose());
    mount.add(asset);fallback.visible=false;
    state.status='ready';onReady?.();
  }).catch(error=>{if(!disposed){state.status='fallback';console.warn('Mouse fallback:',error.message);onReady?.();}});
  return {ready,state,mount,
    // Real geometry for the contact shadow pass, in world space, positions
    // only. Null until the asset loads; the fallback box covers that window.
    contactGeometry(){
      if(!asset)return null;
      mount.updateMatrixWorld(true);
      const parts=[];
      asset.traverse(o=>{if(!o.isMesh)return;
        const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
        g.applyMatrix4(o.matrixWorld);
        for(const name of Object.keys(g.attributes))if(name!=='position')g.deleteAttribute(name);
        parts.push(g);});
      const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
      return merged;
    },
    dispose(){disposed=true;if(asset)release(asset);mount.removeFromParent();},
  };
}
