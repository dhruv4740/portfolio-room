import * as THREE from 'three';

// Sample actual skinned surface vertices, not bone endpoints. Cache only the
// vertex classification; poses and the live key geometry are measured afresh.
const classified=new WeakMap();
function vertices(mesh,digit){
  let groups=classified.get(mesh.geometry);
  if(!groups){
    groups=Array.from({length:5},()=>[]);
    const ids=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
    for(let i=0;i<ids.count;i++){
      let dominant=0,best=-1;
      for(let lane=0;lane<4;lane++){const w=weights.array[i*4+lane];if(w>best){best=w;dominant=ids.array[i*4+lane];}}
      if(dominant===0||dominant>=2&&dominant<=16)groups[4].push(i);
      if(dominant>=2&&dominant<=13)groups[Math.floor((dominant-2)/3)].push(i);
    }
    classified.set(mesh.geometry,groups);
  }
  return groups[digit??4];
}
export function keySurfaceBoxes(keys){
  keys.geometry.computeBoundingBox();keys.updateWorldMatrix(true,false);
  const matrix=new THREE.Matrix4(),boxes=[];
  for(let i=0;i<keys.count;i++){
    keys.getMatrixAt(i,matrix);matrix.premultiply(keys.matrixWorld);
    boxes.push(keys.geometry.boundingBox.clone().applyMatrix4(matrix));
  }
  return boxes;
}
export function skinKeyClearance(h,boxes,digit){
  h.hand.updateWorldMatrix(true,true);h.skinMesh.updateWorldMatrix(true,false);
  const mesh=h.skinMesh,p=new THREE.Vector3();let clearance=Infinity,samples=0;
  for(const i of vertices(mesh,digit)){
    p.fromBufferAttribute(mesh.geometry.attributes.position,i);
    mesh.applyBoneTransform(i,p).applyMatrix4(mesh.matrixWorld);
    for(const b of boxes){
      if(p.x<b.min.x||p.x>b.max.x||p.z<b.min.z||p.z>b.max.z)continue;
      clearance=Math.min(clearance,p.y-b.max.y);samples++;
    }
  }
  return {clearance,samples};
}
