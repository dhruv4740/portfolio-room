import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Poly Haven hanging industrial lamp (CC0), trimmed to a short chain by
// scripts/blender/prepare_ceiling_fixture.py. Origin is the top of the chain,
// so it hangs straight off the ceiling rose. Two materials (body and glass)
// are already few enough to leave unbatched.
//
// The arrival power stutter drives emissive intensity here exactly as it drove
// the procedural bulb's: no extra dynamic light is introduced.
export function createAuthoredCeilingFixture({root, fallback, position, onReady}) {
  let disposed=false, asset=null, emission=[], baseEmissive=1;
  const mount=new THREE.Group();mount.name='Authored ceiling fixture';
  mount.position.set(...position);root.add(mount);
  const state={status:'loading'};
  const release=object=>{
    const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))materials.add(m);});
    materials.forEach(m=>{Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
  };
  const ready=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/after-hours/ceiling-fixture.glb`).then(gltf=>{
    if(disposed){release(gltf.scene);return;}
    asset=gltf.scene;
    const emissiveMaterials=new Set();
    asset.traverse(o=>{if(!o.isMesh)return;
      // Architectural shadows are static and already baked; a ceiling fixture
      // casting into that cached map would double the contact it already has.
      o.castShadow=false;o.receiveShadow=true;o.raycast=()=>{};
      for(const m of (Array.isArray(o.material)?o.material:[o.material])){
        m.envMapIntensity=.4;
        if(m.emissiveMap)emissiveMaterials.add(m);
      }
    });
    emission=[...emissiveMaterials];
    baseEmissive=emission[0]?.emissiveIntensity??1;
    mount.add(asset);fallback.visible=false;
    state.status='ready';onReady?.();
  }).catch(error=>{if(!disposed){state.status='fallback';console.warn('Ceiling fixture fallback:',error.message);onReady?.();}});
  return {ready,state,mount,
    update(power){for(const material of emission)material.emissiveIntensity=baseEmissive*power;},
    dispose(){disposed=true;if(asset)release(asset);mount.removeFromParent();},
  };
}
