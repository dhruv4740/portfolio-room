// Transfer the authored anatomical surface into the existing control rig.
// Bone-local frames straighten the source's curled fingers; UVs and source
// weights survive. The original asset stays untouched and reproducible.
import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {seatedHands} from '../src/v3/desktop/seatedHands.js';
const source=JSON.parse(await readFile('art/after-hours/authored-hands/source-skin.json','utf8'));
const rig=seatedHands();
const vec=a=>new THREE.Vector3(...a);
function frame(origin,z,y){
  z=z.clone().normalize();y=y.clone().addScaledVector(z,-y.dot(z)).normalize();
  return new THREE.Matrix4().makeBasis(y.clone().cross(z).normalize(),y,z).setPosition(origin);
}
const chunks=[],stats=[];
function header(values){const b=Buffer.alloc(values.length*4);values.forEach((v,i)=>b.writeUInt32LE(v,i*4));chunks.push(b);}
function serialize(g){
  const n=g.attributes.position.count,index=g.index?.array||Uint32Array.from({length:n},(_,i)=>i);
  header([n,index.length,g.attributes.uv?1:0]);
  for(const key of ['position','normal','skinIndex','skinWeight',...(g.attributes.uv?['uv']:[])]){
    const a=g.attributes[key].array;chunks.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
  }
  chunks.push(Buffer.from(Uint32Array.from(index).buffer));
}
header([0x48414e44,1]);
for(const [h,suffix] of [[rig.left,'L'],[rig.right,'R']]){
  const bones=h.skeleton.boneInverses.map(m=>m.clone().invert());
  const sb=name=>source.bones[`${name}.${suffix}`];
  const wrist=vec(sb('hand').head),knuckle=vec(sb('middle1').head);
  const srcZ=wrist.clone().sub(knuckle).normalize();
  const srcX=vec(sb('point1').head).sub(vec(sb('pink1').head)).multiplyScalar(-h.side).normalize();
  const srcY=srcZ.clone().cross(srcX).normalize();
  const palmFrame=frame(wrist,srcZ,srcY);
  const palmTarget=bones[0].clone().multiply(new THREE.Matrix4().makeTranslation(0,.001,.050));
  const width=vec(sb('point1').head).distanceTo(vec(sb('pink1').head));
  const radial=.066/width;
  const palmScale=new THREE.Matrix4().makeScale(radial,radial,.123/wrist.distanceTo(knuckle));
  const palmTransfer=palmTarget.clone().multiply(palmScale).multiply(palmFrame.clone().invert());
  const transfer=new Map();
  for(const name of ['hand','palm'])transfer.set(`${name}.${suffix}`,{index:0,matrix:palmTransfer});
  // The source uses two forearm deform bones. Both follow our analytic arm;
  // its normalized +Y length is converted back to physical metres here.
  const forearmFrame=frame(wrist,srcZ,srcY);
  const forearmTarget=bones[1].clone().multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  const forearmScale=new THREE.Matrix4().makeScale(radial/1.15,radial/.72,1/.295);
  const forearmTransfer=forearmTarget.multiply(forearmScale).multiply(forearmFrame.invert());
  for(const name of ['forearm','elbow','arm'])transfer.set(`${name}.${suffix}`,{index:1,matrix:forearmTransfer});
  for(const [f,name] of ['point','middle','ring','pink','thumb'].entries()){
    const lengths=(f<4?h.digits[f]:h.thumb).userData.L;
    for(let j=0;j<3;j++){
      const b=sb(`${name}${j+1}`),head=vec(b.head),tail=vec(b.tail),z=head.clone().sub(tail);
      const sourceFrame=frame(head,z,srcY);
      const index=2+f*3+j;
      const scale=new THREE.Matrix4().makeScale(radial,radial,lengths[j]/head.distanceTo(tail));
      transfer.set(`${name}${j+1}.${suffix}`,{index,matrix:bones[index].clone().multiply(scale).multiply(sourceFrame.invert())});
    }
  }
  const converted=source.vertices.map(v=>{
    const p=vec(v.p),weights=v.weights.filter(([name])=>transfer.has(name));
    if(weights.length===0)return null;
    const total=weights.reduce((s,[,w])=>s+w,0);if(total<.9)return null;
    // Hide the cut safely inside the cuff; upper arms retain the cloth rig.
    if(p.clone().sub(wrist).dot(srcZ)>.12)return null;
    const out=new THREE.Vector3(),merged=new Map();
    for(const [name,w] of weights){const t=transfer.get(name);out.addScaledVector(p.clone().applyMatrix4(t.matrix),w/total);merged.set(t.index,(merged.get(t.index)||0)+w/total);}
    const top=[...merged].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((s,[,w])=>s+w,0);
    return {p:out,top:top.map(([i,w])=>[i,w/sum])};
  });
  const positions=[],uvs=[],indices=[],weights=[];
  for(const tri of source.triangles){
    if(tri.some(c=>!converted[c.v]))continue;
    for(const c of tri){const v=converted[c.v];positions.push(...v.p);uvs.push(...c.uv);
      for(let lane=0;lane<4;lane++){indices.push(v.top[lane]?.[0]||0);weights.push(v.top[lane]?.[1]||0);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  // Average shared positions, including UV seams, without changing UV topology.
  g.computeVertexNormals();const normals=g.attributes.normal,smooth=new Map();
  const key=i=>positions.slice(i*3,i*3+3).map(v=>Math.round(v*1e6)).join(',');
  for(let i=0;i<normals.count;i++){const k=key(i);if(!smooth.has(k))smooth.set(k,new THREE.Vector3());smooth.get(k).add(new THREE.Vector3().fromBufferAttribute(normals,i));}
  for(let i=0;i<normals.count;i++){const n=smooth.get(key(i)).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
  serialize(g);serialize(h.clothMesh.geometry);
  stats.push({side:suffix,triangles:positions.length/9,radialScale:radial});
}
const output=Buffer.concat(chunks);
await writeFile('public/models/hands-authored.bin',output);
await writeFile('public/models/hands-authored.bin.gz',gzipSync(output,{level:9}));
console.log(JSON.stringify({stats,bytes:output.length,gzip:gzipSync(output).length}));
