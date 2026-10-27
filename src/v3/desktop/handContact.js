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
// Same skinning as SkinnedMesh.applyBoneTransform, but each bone's matrix is
// built once per call instead of once per vertex lane, the mesh/bind inverse
// transforms are folded into one matrix, and vertices outside the keys' joint
// footprint skip the per-box loop. Results match the per-vertex path to float
// precision.
const boneMats=[],worldFromSkin=new THREE.Matrix4();
export function skinKeyClearance(h,boxes,digit){
  h.hand.updateWorldMatrix(true,true);h.skinMesh.updateWorldMatrix(true,false);
  const mesh=h.skinMesh,geo=mesh.geometry,pos=geo.attributes.position.array,ids=geo.attributes.skinIndex.array,wts=geo.attributes.skinWeight.array;
  const {bones,boneInverses}=mesh.skeleton,bind=mesh.bindMatrix.elements;
  const used=new Set();for(const i of vertices(mesh,digit))for(let l=0;l<4;l++)if(wts[i*4+l]!==0)used.add(ids[i*4+l]);
  for(const b of used){(boneMats[b]||(boneMats[b]=new THREE.Matrix4())).multiplyMatrices(bones[b].matrixWorld,boneInverses[b]);}
  worldFromSkin.multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse);const W=worldFromSkin.elements;
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(const b of boxes){if(b.min.x<minX)minX=b.min.x;if(b.max.x>maxX)maxX=b.max.x;if(b.min.z<minZ)minZ=b.min.z;if(b.max.z>maxZ)maxZ=b.max.z;}
  let clearance=Infinity,samples=0;
  for(const i of vertices(mesh,digit)){
    const px=pos[i*3],py=pos[i*3+1],pz=pos[i*3+2];
    const bx=bind[0]*px+bind[4]*py+bind[8]*pz+bind[12],by=bind[1]*px+bind[5]*py+bind[9]*pz+bind[13],bz=bind[2]*px+bind[6]*py+bind[10]*pz+bind[14];
    let ax=0,ay=0,az=0;
    for(let l=0;l<4;l++){
      const w=wts[i*4+l];if(w===0)continue;
      const m=boneMats[ids[i*4+l]].elements,inv=1/(m[3]*bx+m[7]*by+m[11]*bz+m[15]);
      ax+=w*inv*(m[0]*bx+m[4]*by+m[8]*bz+m[12]);ay+=w*inv*(m[1]*bx+m[5]*by+m[9]*bz+m[13]);az+=w*inv*(m[2]*bx+m[6]*by+m[10]*bz+m[14]);
    }
    const iw=1/(W[3]*ax+W[7]*ay+W[11]*az+W[15]);
    const x=iw*(W[0]*ax+W[4]*ay+W[8]*az+W[12]),y=iw*(W[1]*ax+W[5]*ay+W[9]*az+W[13]),z=iw*(W[2]*ax+W[6]*ay+W[10]*az+W[14]);
    if(x<minX||x>maxX||z<minZ||z>maxZ)continue;
    for(const b of boxes){
      if(x<b.min.x||x>b.max.x||z<b.min.z||z>b.max.z)continue;
      clearance=Math.min(clearance,y-b.max.y);samples++;
    }
  }
  return {clearance,samples};
}
