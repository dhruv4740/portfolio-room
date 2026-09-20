import * as THREE from 'three';
import { loadHandAssets } from './handAssets.js';
import { applyHandAppearance } from './handAppearance.js';
const prebuilt = typeof window === 'undefined' ? null : await loadHandAssets().catch(error => { console.warn(error.message + '; generating local fallback'); return null; });

import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// One extra skinned draw per hand: thin nail plates follow the distal bones,
// including thumb opposition, rather than floating above the animated fingers.
function bindNails(h,root,bones){
  const parts=[];
  for(const digit of [...h.digits,h.thumb]){
    const {L,R,joints}=digit.userData, joint=joints[2];
    const g=new THREE.SphereGeometry(1,12,8);
    g.scale(R[2]*.68,.0007,L[2]*.34);
    g.translate(0,R[2]*.89,-L[2]*.57);g.applyMatrix4(joint.matrixWorld);
    const ids=[],weights=[];
    for(let i=0;i<g.attributes.position.count;i++){ids.push(bones.indexOf(joint),0,0,0);weights.push(1,0,0,0);}
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
    g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));parts.push(g);
  }
  const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  const nails=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:'#ae8574',roughness:.58}));
  root.add(nails);nails.bind(h.skeleton,new THREE.Matrix4());nails.frustumCulled=false;nails.receiveShadow=true;nails.raycast=()=>{};
  h.nailMesh=nails;
}

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
    applyHandAppearance(h);
    bindNails(h,root,bones);
    return;
  }

  const inverse = h.hand.matrixWorld.clone().invert();
  const point = (bone, p) => new THREE.Vector3(...p).applyMatrix4(bone.matrixWorld).applyMatrix4(inverse);
  const parts = [];
  // A single flattened palm, broad at the knuckles and tapered at the wrist.
  // Two overlapping ellipsoids produced a swollen heel and a pinched waist.
  parts.push({ palm: true, bone: 0 });
  // Thenar pad is part of the palm, not a second spherical thumb joint.
  parts.push({pad:true,center:[-h.side*.021,-.006,.006],radii:[.021,.011,.031],bone:0});
  const segment = (bone, a, b, r0, r1) => {
    const d = b.clone().sub(a);
    parts.push({ a, d, lengthSq: d.lengthSq(), r0, r1, bone: bones.indexOf(bone) });
  };
  for (const f of [...h.digits, h.thumb]) {
    const { L, R, joints } = f.userData;
    joints.forEach((j, i) => segment(j, point(j, [0, 0, 0]), point(j, [0, 0, -L[i]]), R[i], R[i + 1]));
  }
  // The end is buried under the cuff; wrist weights blend over the palm heel.
  segment(h.arm, point(h.arm, [0, -.065, 0]), point(h.arm, [0, .23, 0]), .020, .016);
  // A wrist is an oval section, not a round tube. Keep the long axis and
  // bone weights unchanged; flatten only the local forearm depth near the cuff.
  parts[parts.length-1].depthAxis = point(h.arm,[0,0,1]).sub(point(h.arm,[0,0,0])).normalize();
  const distance = (part, x, y, z) => {
    if(part.pad){
      const [a,b,c]=part.radii,[cx,cy,cz]=part.center;
      // Approximate ellipsoid distance, sufficient for this shallow palm pad.
      const k0=Math.hypot((x-cx)/a,(y-cy)/b,(z-cz)/c);
      const k1=Math.hypot((x-cx)/(a*a),(y-cy)/(b*b),(z-cz)/(c*c));
      return k1>1e-8?k0*(k0-1)/k1:-b;
    }
    if (part.palm) {
      const t = THREE.MathUtils.smoothstep(z, -.040, .050);
      const width = THREE.MathUtils.lerp(.044, .022, t);
      const thickness = THREE.MathUtils.lerp(.012, .011, t);
      const radius = .008;
      const qx = Math.abs(x) - (width-radius);
      // Shallow dorsal arch and metacarpal ridges break the former flat,
      // mitten-like back. The palm-facing side keeps its existing grip surface.
      const lateral = Math.min(1, Math.abs(x)/width);
      let dorsal = .0018*(1-lateral*lateral)*(1-t);
      const ridgeEnvelope = Math.exp(-Math.pow((z+.023)/.034,4));
      for (const digit of h.digits) {
        const target = digit.position.x * THREE.MathUtils.lerp(1,.50,t);
        dorsal += .0009*Math.exp(-Math.pow((x-target)/.0055,2))*ridgeEnvelope;
      }
      // Two shallow palmar folds; geometry rather than painted dark stripes.
      const foldA=Math.exp(-Math.pow((z+.040+.10*x)/.0018,2));
      const foldB=Math.exp(-Math.pow((z+.010-.16*x)/.002,2));
      const crease=.00045*(foldA+foldB)*(1-lateral*lateral);
      const qy = y >= -.001
        ? y+.001-(thickness-radius+dorsal)
        : -y-.001-(thickness-radius-crease);
      // Knuckles follow an arch: middle finger starts farther forward than
      // index/pinky. Stop the palm at their roots, not over their first joints.
      const front = -.067 + .015 * Math.min(1, Math.pow(x/.044,2));
      const back = .051;
      const qz = Math.abs(z-(front+back)*.5) - ((back-front)*.5-radius);
      return Math.hypot(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0))
        + Math.min(Math.max(qx,qy,qz),0)-radius;
    }
    const px=x-part.a.x, py=y-part.a.y, pz=z-part.a.z;
    const t = THREE.MathUtils.clamp((px*part.d.x+py*part.d.y+pz*part.d.z)/part.lengthSq,0,1);
    const rx=px-part.d.x*t, ry=py-part.d.y*t, rz=pz-part.d.z*t;
    let radiusSq=rx*rx+ry*ry+rz*rz;
    if(part.depthAxis){
      const depth=rx*part.depthAxis.x+ry*part.depthAxis.y+rz*part.depthAxis.z;
      const flatten=THREE.MathUtils.lerp(.72,1,THREE.MathUtils.smoothstep(t,0,.35));
      radiusSq+=depth*depth*(1/(flatten*flatten)-1);
    }
    return Math.sqrt(radiusSq) - THREE.MathUtils.lerp(part.r0,part.r1,t);
  };
  const field = (x,y,z) => {
    let d = 1;
    for (const part of parts) {
      const b = distance(part,x,y,z), k = part.depthAxis?.012:part.pad?.006:.003;
      const w = Math.max(k-Math.abs(d-b),0)/k;
      d = Math.min(d,b)-w*w*k*.25;
    }
    return d;
  };
  // 5mm sampling left only three cells across a fingertip, producing visible
  // angular silhouettes. 3.5mm keeps fingers smoother without subdividing cloth.
  const step=.0035, min=[-.12,-.09,-.18], count=[70,58,100];
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
    parts.forEach((part,j)=>{const w=Math.exp(-Math.pow((ds[j]-best)/.006,2));scores.set(part.bone,(scores.get(part.bone)||0)+w);});
    // Geometric proximity made a narrow 50/50 seam at the palm heel. Blend
    // across a 48mm longitudinal band, independent of the cap's distance.
    // Preserve any thumb contribution: replacing it at a z cutoff creates a
    // discontinuous fold where the opposed thumb crosses the heel region.
    if(z>.018){
      const armWeight=THREE.MathUtils.smoothstep(z,.018,.082);
      const wristWeight=(scores.get(0)||0)+(scores.get(1)||0);
      scores.set(0,wristWeight*(1-armWeight));scores.set(1,wristWeight*armWeight);
    }
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
  applyHandAppearance(h);
  bindNails(h,root,bones);
}
