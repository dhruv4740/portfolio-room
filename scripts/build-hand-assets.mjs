import { gzipSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { seatedHands } from '../src/v3/desktop/seatedHands.js';
const hands=seatedHands(), chunks=[];
const header=(values)=>{const b=Buffer.alloc(values.length*4);values.forEach((v,i)=>b.writeUInt32LE(v,i*4));chunks.push(b);};
header([0x48414e44,1]);
for(const h of [hands.left,hands.right])for(const mesh of [h.skinMesh,h.clothMesh]){
  const g=mesh.geometry, n=g.attributes.position.count, index=g.index?.array || Uint32Array.from({length:n},(_,i)=>i);
  header([n,index.length,g.attributes.uv?1:0]);
  for(const key of ['position','normal','skinIndex','skinWeight',...(g.attributes.uv?['uv']:[])]){
    const a=g.attributes[key].array;chunks.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength));
  }
  const a=Uint32Array.from(index);chunks.push(Buffer.from(a.buffer));
}
await mkdir('public/models',{recursive:true});
const output=Buffer.concat(chunks);await writeFile('public/models/hands-v1.bin',output);
await writeFile('public/models/hands-v1.bin.gz',gzipSync(output,{level:9}));
console.log(`Connected hand assets: ${output.length} bytes, four draw assemblies`);
