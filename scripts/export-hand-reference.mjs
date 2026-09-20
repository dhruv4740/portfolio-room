// Export the exact runtime bind surface and bone indices for Blender authoring.
// This is a reference, not a replacement asset or a new animation rig.
import { writeFile,mkdir } from 'node:fs/promises';
import { seatedHands } from '../src/v3/desktop/seatedHands.js';
const rig=seatedHands();
const output={units:'metres',coordinates:'three.js Y up',hands:[]};
for(const [name,h] of [['left',rig.left],['right',rig.right]]){
  const bones=h.skeleton.bones;
  const labels=['hand','forearm',...['index','middle','ring','pinky','thumb'].flatMap(f=>[0,1,2].map(i=>`${f}_${i}`)),'upper_arm','elbow'];
  output.hands.push({name,bones:bones.map((bone,i)=>{
    let parent=bone.parent;while(parent&&!bones.includes(parent))parent=parent.parent;
    return {name:labels[i],parent:bones.indexOf(parent),bindWorld:h.skeleton.boneInverses[i].clone().invert().toArray()};
  }),meshes:[['skin',h.skinMesh],['sleeve',h.clothMesh],['nails',h.nailMesh]].map(([part,mesh])=>{
    const g=mesh.geometry;return {name:part,position:Array.from(g.attributes.position.array),index:Array.from(g.index.array),skinIndex:Array.from(g.attributes.skinIndex.array),skinWeight:Array.from(g.attributes.skinWeight.array),uv:g.attributes.uv?Array.from(g.attributes.uv.array):null,color:g.attributes.color?Array.from(g.attributes.color.array):null};
  })});
}
await mkdir('art/after-hours',{recursive:true});
await writeFile('art/after-hours/hand-rig-reference.json',JSON.stringify(output));
console.log('Exported both bind surfaces with 19 named bones each');
