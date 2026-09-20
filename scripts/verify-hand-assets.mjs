// The binary and procedural fallback must describe the same bind geometry.
// Also exercise every authored pose through actual CPU skinning, not UI state.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { loadHandAssets } from '../src/v3/desktop/handAssets.js';
import { seatedHands, POSES } from '../src/v3/desktop/seatedHands.js';

const rig=seatedHands(),source=[rig.left.skinMesh,rig.left.clothMesh,rig.right.skinMesh,rig.right.clothMesh];
const fetchBefore=globalThis.fetch;
try {
  for(const file of ['hands-v1.bin','hands-v1.bin.gz']){
    const bytes=await readFile(new URL('../public/models/'+file,import.meta.url));
    globalThis.fetch=async()=>new Response(bytes);
    const geometries=await loadHandAssets();
    assert.equal(geometries.length,4);
    geometries.forEach((geometry,i)=>{
      for(const name of ['position','normal','skinIndex','skinWeight','uv']){
        assert.deepEqual(geometry.attributes[name]?.array,source[i].geometry.attributes[name]?.array,`${file} mesh ${i} ${name}`);
      }
      assert.deepEqual(geometry.index.array,Uint32Array.from(source[i].geometry.index.array),`${file} indices`);
      geometry.dispose();
    });
    console.log(file,'matches the generated bind geometry');
  }
} finally {globalThis.fetch=fetchBefore;}

const point=new THREE.Vector3();
for(const h of [rig.left,rig.right]){
  const {skinIndex:ids,skinWeight:weights}=h.skinMesh.geometry.attributes;
  for(let i=0;i<ids.count;i++){
    let sum=0;
    for(let lane=0;lane<4;lane++){
      const index=ids.array[i*4+lane],weight=weights.array[i*4+lane];
      assert.ok(index<h.skeleton.bones.length && weight>=0 && Number.isFinite(weight));
      sum+=weight;
    }
    assert.ok(Math.abs(sum-1)<1e-5,'Skin weights must sum to one');
  }
}
for(const [name,pose] of Object.entries(POSES)){
  Object.assign(rig.left.pose,pose);Object.assign(rig.right.pose,pose);
  rig.update();rig.root.updateMatrixWorld(true);
  for(const h of [rig.left,rig.right]){
    const geometry=h.skinMesh.geometry;
    for(let i=0;i<geometry.attributes.position.count;i++){
      point.fromBufferAttribute(geometry.attributes.position,i);
      h.skinMesh.applyBoneTransform(i,point);
      assert.ok(point.toArray().every(Number.isFinite),name+' has non-finite skin');
      assert.ok(point.distanceTo(h.hand.position)<.4,name+' has escaped skin vertices');
    }
  }
}
console.log(Object.keys(POSES).length,'poses: normalized weights, finite bounded skin deformation');
