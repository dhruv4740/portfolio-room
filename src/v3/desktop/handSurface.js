import * as THREE from 'three';
import { loadHandAssets } from './handAssets.js';
const prebuilt = typeof window === 'undefined' ? null : await loadHandAssets().catch(error => { console.warn(error.message + '; generating local fallback'); return null; });

import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Smooth implicit union in the neutral bind pose. Unlike overlapping capsules,
// this produces a single closed skin surface through the webbing and wrist.
// Only built once; all subsequent deformation runs in the skinning shader.
export function bindHandSurface(h, root, skin, cloth) {
  const bones = [h.hand, h.arm, ...h.digits.flatMap(f => f.userData.joints), ...h.thumb.userData.joints, h.sleeve, h.elbow];
  root.updateMatrixWorld(true);
  if (prebuilt) {
    const skeleton=new THREE.Skeleton(bones), offset=h.side===-1?0:2;
    h.skinMesh=new THREE.SkinnedMesh(prebuilt[offset].clone(),skin);
    h.clothMesh=new THREE.SkinnedMesh(prebuilt[offset+1].clone(),cloth);
    for(const source of h.clothParts){source.removeFromParent();source.geometry.dispose();}
    for(const mesh of [h.skinMesh,h.clothMesh]){root.add(mesh);mesh.bind(skeleton,new THREE.Matrix4());mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};}
    h.skeleton=skeleton;
    return;
  }

  const inverse = h.hand.matrixWorld.clone().invert();
  const point = (bone, p) => new THREE.Vector3(...p).applyMatrix4(bone.matrixWorld).applyMatrix4(inverse);
  const parts = [];
  const ellipsoid = (center, radius) => parts.push({ center, radius, bone: 0 });
  ellipsoid([0, -.001, -.038], [.046, .016, .052]);
  ellipsoid([0, .001, .023], [.034, .017, .053]);
  const segment = (bone, a, b, r0, r1) => {
    const d = b.clone().sub(a);
    parts.push({ a, d, lengthSq: d.lengthSq(), r0, r1, bone: bones.indexOf(bone) });
  };
  for (const f of [...h.digits, h.thumb]) {
    const { L, R, joints } = f.userData;
    joints.forEach((j, i) => segment(j, point(j, [0, 0, 0]), point(j, [0, 0, -L[i]]), R[i], R[i + 1]));
  }
  // The end is buried under the cuff; wrist weights blend over the palm heel.
  segment(h.arm, point(h.arm, [0, 0, 0]), point(h.arm, [0, .23, 0]), .018, .016);
  const distance = (part, x, y, z) => {
    if (part.center) {
      const c = part.center, r = part.radius;
      const a = (x-c[0])/r[0], b = (y-c[1])/r[1], d = (z-c[2])/r[2];
      const k0 = Math.hypot(a,b,d), k1 = Math.hypot(a/r[0],b/r[1],d/r[2]);
      return k1 ? k0*(k0-1)/k1 : -Math.min(...r);
    }
    const px=x-part.a.x, py=y-part.a.y, pz=z-part.a.z;
    const t = THREE.MathUtils.clamp((px*part.d.x+py*part.d.y+pz*part.d.z)/part.lengthSq,0,1);
    return Math.hypot(px-part.d.x*t,py-part.d.y*t,pz-part.d.z*t) - THREE.MathUtils.lerp(part.r0,part.r1,t);
  };
  const field = (x,y,z) => {
    let d = 1;
    for (const part of parts) {
      const b = distance(part,x,y,z), k = .0045;
      const w = Math.max(k-Math.abs(d-b),0)/k;
      d = Math.min(d,b)-w*w*k*.25;
    }
    return d;
  };
  const step=.005, min=[-.12,-.09,-.18], count=[49,40,70];
  const [nx,ny,nz]=count, values=new Float32Array(nx*ny*nz);
  const index=(x,y,z)=>(z*ny+y)*nx+x;
  for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++) values[index(x,y,z)]=field(min[0]+x*step,min[1]+y*step,min[2]+z*step);
  const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const positions=[];
  const tri=(a,b,c)=>positions.push(...a,...b,...c);
  for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++) {
    const v=corners.map(c=>values[index(x+c[0],y+c[1],z+c[2])]);
    if(v.every(n=>n>=0)||v.every(n=>n<0))continue;
    const p=corners.map(c=>[min[0]+(x+c[0])*step,min[1]+(y+c[1])*step,min[2]+(z+c[2])*step]);
    const cross=(a,b)=>{const t=v[a]/(v[a]-v[b]);return p[a].map((n,i)=>n+(p[b][i]-n)*t);};
    for(const t of tetra) {
      const inside=t.filter(i=>v[i]<0), outside=t.filter(i=>v[i]>=0);
      if(inside.length===1)tri(...outside.map(i=>cross(inside[0],i)));
      else if(inside.length===3)tri(...inside.map(i=>cross(outside[0],i)));
      else if(inside.length===2){const [a,b]=inside,[c,d]=outside;const ac=cross(a,c),ad=cross(a,d),bc=cross(b,c),bd=cross(b,d);tri(ac,ad,bc);tri(ad,bd,bc);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  // Orient each face toward the signed-distance gradient.
  for(let i=0;i<positions.length;i+=9){
    const a=new THREE.Vector3(...positions.slice(i,i+3)),b=new THREE.Vector3(...positions.slice(i+3,i+6)),c=new THREE.Vector3(...positions.slice(i+6,i+9));
    const n=b.clone().sub(a).cross(c.clone().sub(a)), m=a.clone().add(b).add(c).multiplyScalar(1/3), e=.0002;
    const g=new THREE.Vector3(field(m.x+e,m.y,m.z)-field(m.x-e,m.y,m.z),field(m.x,m.y+e,m.z)-field(m.x,m.y-e,m.z),field(m.x,m.y,m.z+e)-field(m.x,m.y,m.z-e));
    if(n.dot(g)<0)for(let j=0;j<3;j++){const q=positions[i+3+j];positions[i+3+j]=positions[i+6+j];positions[i+6+j]=q;}
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const welded=mergeVertices(geometry, .00001);geometry.dispose();const normal=[];const vp=welded.getAttribute('position');const e=.00015;
  for(let i=0;i<vp.count;i++){const x=vp.getX(i),y=vp.getY(i),z=vp.getZ(i);const n=new THREE.Vector3(field(x+e,y,z)-field(x-e,y,z),field(x,y+e,z)-field(x,y-e,z),field(x,y,z+e)-field(x,y,z-e)).normalize();normal.push(n.x,n.y,n.z);}
  welded.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));
  const indices=[],weights=[], p=welded.getAttribute('position');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i), scores=new Map();
    const ds=parts.map(part=>distance(part,x,y,z)), best=Math.min(...ds);
    parts.forEach((part,j)=>{const w=Math.exp(-Math.pow((ds[j]-best)/.009,2));scores.set(part.bone,(scores.get(part.bone)||0)+w);});
    const top=[...scores].sort((a,b)=>b[1]-a[1]).slice(0,4), sum=top.reduce((s,v)=>s+v[1],0);
    for(let j=0;j<4;j++){indices.push(top[j]?.[0]||0);weights.push((top[j]?.[1]||0)/sum);}
  }
  welded.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  welded.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  welded.applyMatrix4(h.hand.matrixWorld);
  const skeleton=new THREE.Skeleton(bones);
  const skinMesh=new THREE.SkinnedMesh(welded,skin);root.add(skinMesh);skinMesh.bind(skeleton);
  const clothGeometries=[];
  for(const source of h.clothParts){
    const g=source.geometry.clone();g.applyMatrix4(source.matrixWorld);
    const n=g.getAttribute('position').count, ids=[],ws=[];
    for(let i=0;i<n;i++){ids.push(bones.indexOf(source.parent),0,0,0);ws.push(1,0,0,0);}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(ws,4));
    clothGeometries.push(g);source.removeFromParent();source.geometry.dispose();
  }
  const clothGeometry=mergeGeometries(clothGeometries);clothGeometries.forEach(g=>g.dispose());
  const clothMesh=new THREE.SkinnedMesh(clothGeometry,cloth);root.add(clothMesh);clothMesh.bind(skeleton);
  for(const mesh of [skinMesh,clothMesh]){mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.raycast=()=>{};}
  h.skinMesh=skinMesh;h.clothMesh=clothMesh;h.skeleton=skeleton;
}
