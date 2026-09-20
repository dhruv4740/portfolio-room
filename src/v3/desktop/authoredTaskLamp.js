import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Poly Haven's clamp pad is the origin; +X is the outside of the clamp.
// Keep the asset at metre scale. The screw alone can move axially without
// breaking the exported static linkage (the source IK rig is not exported).
export function createAuthoredTaskLamp({root, fallback, bulb, pool, desktop, onReady}) {
  let disposed=false, asset=null, emission=[];
  const mount=new THREE.Group();mount.name='Authored task lamp';
  mount.position.set(-1.28,desktop.center[1],desktop.center[2]-desktop.size[1]/2+.010);
  mount.rotation.y=Math.PI/2;root.add(mount);
  const state={status:'loading'};
  const release=object=>{
    const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set();
    object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean))materials.add(m);});
    materials.forEach(m=>{Object.values(m).forEach(t=>{if(t?.isTexture)textures.add(t);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>{if(t.source?.data?.close)images.add(t.source.data);t.dispose();});images.forEach(i=>i.close());
  };
  const ready=new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/after-hours/desk-lamp.glb`).then(gltf=>{
    if(disposed){release(gltf.scene);return;}
    asset=gltf.scene;
    const screw=asset.getObjectByName('geo_pivot-holder');
    if(screw){
      // Translate in glTF world Y, independent of the source node's basis.
      asset.updateMatrixWorld(true);
      const world=screw.getWorldPosition(new THREE.Vector3());world.y-=desktop.thickness-.02057;
      screw.position.copy(screw.parent.worldToLocal(world));
    }
    // The linkage is static. Bake its corrected pose into two material meshes
    // instead of paying 27 draw calls for separately named source parts.
    asset.updateMatrixWorld(true);
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
      if(!geometry)throw new Error('Lamp geometry attributes are incompatible');
      const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;asset.add(mesh);
    }
    originalGeometries.forEach(g=>g.dispose());
    const emissiveMaterials=new Set();
    asset.traverse(o=>{if(!o.isMesh)return;
      o.castShadow=true;o.receiveShadow=true;o.raycast=()=>{};
      for(const m of (Array.isArray(o.material)?o.material:[o.material])){
        // Thin shade/cable surfaces retain the source's two-sided treatment.
        m.envMapIntensity=.65;
        if(m.emissiveMap)emissiveMaterials.add(m);
      }
    });
    emission=[...emissiveMaterials];mount.add(asset);
    fallback.visible=false;pool.visible=false;
    mount.updateMatrixWorld(true);
    // The shade casts shadows, so a source inside the dish clips its own cone
    // against the rim. Measured rim plane is local y=.4995; sit just below it.
    bulb.position.copy(mount.localToWorld(new THREE.Vector3(-.14886,.49100,.07183)));
    bulb.target.position.copy(mount.localToWorld(new THREE.Vector3(-.14886,0,.07183)));
    bulb.userData.onIntensity=5.5;
    state.status='ready';onReady?.();
  }).catch(error=>{if(!disposed){state.status='fallback';console.warn('Task lamp fallback:',error.message);onReady?.();}});
  return {ready,state,mount,
    update(power){for(const material of emission)material.emissiveIntensity=power;},
    dispose(){disposed=true;if(asset)release(asset);mount.removeFromParent();},
  };
}
