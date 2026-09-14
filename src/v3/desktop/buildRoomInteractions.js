import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const DRAWER_CONTENT = { title: 'CONTENTS TO COME', body: 'A detail chosen by Dhruv. Placeholder.' };
export const KEY_ROWS = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'\\", 'zxcvbnm,./   ', '            '];

export function buildRoomInteractions({root,materials:m,canvasTexture,anchors,achievements,bulb,lampInterior,lampPool,moon,moonOpen,blindsGroup,keys,keyConfig,windowLight}) {
  const objects={};
  function group(id) {const g=new THREE.Group();g.position.set(...anchors[id]);g.name=id;objects[id]=g;root.add(g);return g;}
  function mesh(g,geometry,material,position=[0,0,0],id=g.name) {const o=new THREE.Mesh(geometry,material);o.position.set(...position);o.receiveShadow=true;o.castShadow=false;o.userData.anchorId=id;g.add(o);return o;}
  function box(g,size,position,material=m.dark) {return mesh(g,new RoundedBoxGeometry(...size,2,0.008),material,position);}
  const lamp=group('lamp');const toggle=box(lamp,[0.055,0.025,0.075],[0,0,0]);
  const coffee=group('coffee');
  const profile=[[0,-0.07],[0.063,-0.07],[0.074,-0.052],[0.074,0.074],[0.064,0.074],[0.061,-0.052],[0,-0.052]];
  mesh(coffee,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),m.bone);
  const handle=mesh(coffee,new THREE.TorusGeometry(0.044,0.011,12,32),m.bone,[0.077,0.008,0]);
  const liquidUniforms={time:{value:0},amplitude:{value:0}};
  const liquidMaterial=new THREE.MeshStandardMaterial({color:'#281307',roughness:0.23,metalness:0});
  liquidMaterial.onBeforeCompile=shader=>{
    shader.uniforms.sloshTime=liquidUniforms.time;shader.uniforms.sloshAmplitude=liquidUniforms.amplitude;
    shader.vertexShader='uniform float sloshTime; uniform float sloshAmplitude;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      float r2=0.061*0.061; float edge=max(0.0,1.0-dot(position.xy,position.xy)/r2);
      float wave=sin(position.x*65.0+sloshTime*8.0)+0.45*cos(position.y*92.0-sloshTime*6.0);
      float dx=sloshAmplitude*(edge*65.0*cos(position.x*65.0+sloshTime*8.0)-2.0*position.x/r2*wave);
      float dy=sloshAmplitude*(-edge*41.4*sin(position.y*92.0-sloshTime*6.0)-2.0*position.y/r2*wave);
      objectNormal=normalize(vec3(-dx,-dy,1.0));`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float rim = max(0.0, 1.0 - dot(position.xy, position.xy) / (0.061*0.061));
      transformed.z += sloshAmplitude * rim * (sin(position.x*65.0+sloshTime*8.0) + 0.45*cos(position.y*92.0-sloshTime*6.0));`);
  };
  const liquid=mesh(coffee,new THREE.RingGeometry(0,0.061,48,12),liquidMaterial,[0,0.049,0]);liquid.rotation.x=-Math.PI/2;
  const award=group('award');box(award,[0.43,0.55,0.035],[0,0,0],m.wood);
  const awardTexture=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle='#eee8d5';ctx.fillRect(0,0,w,h);ctx.fillStyle='#282b29';ctx.textAlign='center';ctx.font='bold 56px serif';ctx.fillText('HACKATHONS',w/2,110);
    let y=225;for(const a of achievements){ctx.font='bold 36px sans-serif';ctx.fillText(a.result.toUpperCase()+' · '+a.year,w/2,y);y+=52;ctx.font='28px sans-serif';let row='';for(const word of a.label.split(' ')){const next=row?row+' '+word:word;if(ctx.measureText(next).width>w-100){ctx.fillText(row,w/2,y);y+=38;row=word;}else row=next;}ctx.fillText(row,w/2,y);y+=110;}
  },1000,1300);
  mesh(award,new THREE.PlaneGeometry(0.39,0.507),new THREE.MeshBasicMaterial({map:awardTexture,toneMapped:false}),[0,0,0.021]);
  const drawer=group('drawer');box(drawer,[0.61,0.14,0.045],[0,0,0],m.wood);box(drawer,[0.60,0.025,0.48],[0,-0.065,-0.23],m.wood);
  for(const x of [-0.285,0.285])box(drawer,[0.025,0.13,0.48],[x,0,-0.23],m.wood);
  box(drawer,[0.15,0.018,0.025],[0,0,0.038]);
  const card=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#e5dfca';ctx.fillRect(0,0,w,h);ctx.fillStyle='#383c36';ctx.textAlign='center';ctx.font='bold 38px sans-serif';ctx.fillText(DRAWER_CONTENT.title,w/2,100);ctx.font='24px sans-serif';ctx.fillText(DRAWER_CONTENT.body,w/2,165);},750,280);
  const cardPlane=mesh(drawer,new THREE.PlaneGeometry(0.48,0.20),new THREE.MeshBasicMaterial({map:card}),[0,-0.047,-0.23]);cardPlane.rotation.x=-Math.PI/2;
  const blinds=group('blinds');mesh(blinds,new THREE.CylinderGeometry(0.004,0.004,0.85,8),m.bone,[0,0.2,0]);const cord=mesh(blinds,new THREE.CapsuleGeometry(0.016,0.055,4,12),m.dark,[0,-0.25,0]);
  const headphones=group('headphones');const band=mesh(headphones,new THREE.TorusGeometry(0.115,0.012,10,40,Math.PI),m.dark);band.rotation.x=-Math.PI/2;
  for(const x of [-0.115,0.115])box(headphones,[0.055,0.085,0.09],[x,0,0],m.dark);
  const sash=group('windowOpen');
  box(sash,[0.68,0.035,0.025],[0,0.94,0],m.bone);
  box(sash,[0.68,0.035,0.025],[0,-0.94,0],m.bone);
  box(sash,[0.035,1.88,0.025],[-0.32,0,0],m.bone);
  box(sash,[0.035,1.88,0.025],[0.32,0,0],m.bone);
  box(sash,[0.02,0.09,0.03],[-0.30,0,0.02],m.dark);
  const glassMat=new THREE.MeshStandardMaterial({color:'#c5d9eb',roughness:0.1,metalness:0.2,transparent:true,opacity:0.22,depthWrite:false});
  mesh(sash,new THREE.PlaneGeometry(0.64,1.85),glassMat,[0,0,0]);
  const state={lamp:1,blinds:0,drawer:0,headphones:0,coffeeLevel:1,windowOpen:0};
  const homes=Object.fromEntries(Object.entries(objects).map(([id,g])=>[id,g.position.clone()]));
  const labels=canvasTexture((ctx,w,h)=>{ctx.fillStyle='#d3d0c3';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#353936';ctx.font='36px sans-serif';for(let row=0;row<5;row++)for(let col=0;col<12;col++)ctx.fillText(KEY_ROWS[row][col].toUpperCase(),(col+0.5)*w/12,(4-row+0.5)*h/5);},1536,640);
  keys.material.map=labels;keys.material.color.set('#ffffff');
  keys.geometry.setAttribute('keySlot',new THREE.InstancedBufferAttribute(Float32Array.from({length:60},(_,i)=>i),1));
  keys.material.onBeforeCompile=shader=>{shader.vertexShader='attribute float keySlot;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vMapUv = (vMapUv + vec2(mod(keySlot,12.0),floor(keySlot/12.0))) / vec2(12.0,5.0);');};
  const keyMatrix=new THREE.Matrix4();const keyHomes=[];for(let i=0;i<60;i++){keys.getMatrixAt(i,keyMatrix);keyHomes.push(keyMatrix.clone());}
  function setKey(index,depth) {if(index<0||index>=60)return;keyMatrix.copy(keyHomes[index]);keyMatrix.elements[13]-=depth;keys.setMatrixAt(index,keyMatrix);keys.instanceMatrix.needsUpdate=true;}
  const levelRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));
  function updateLiquid(time,energy) {liquidUniforms.time.value=time;liquidUniforms.amplitude.value=energy*0.004;liquid.visible=state.coffeeLevel>0;liquid.position.y=-0.043+0.092*state.coffeeLevel;liquid.quaternion.copy(coffee.quaternion).invert().multiply(levelRotation);}
  function apply() {
    bulb.intensity=1.85*state.lamp;lampPool.material.opacity=0.38*state.lamp;lampInterior.material.color.set(state.lamp>0.5?'#d6a26b':'#29251e');toggle.rotation.x=(1-state.lamp)*0.28;
    // Blend two pre-baked shadow states; neither map is updated during a pull.
    blindsGroup.children.forEach((s,i)=>{s.rotation.x=THREE.MathUtils.lerp(-0.22,-1.42,state.blinds);s.position.y=2.88-i*THREE.MathUtils.lerp(0.145,0.024,state.blinds);});
    const closed=keyConfig?.closed??1.15;const open=keyConfig?.open??1.60;
    moon.intensity=closed*(1-state.blinds);moonOpen.intensity=open*state.blinds;drawer.position.z=homes.drawer.z+state.drawer*0.46;
    if(objects.windowOpen)objects.windowOpen.position.x=homes.windowOpen.x-state.windowOpen*0.58;
    if(windowLight)windowLight.intensity=0.55*state.windowOpen;
  }
  return {objects,homes,state,cord,apply,updateLiquid,setKey,liquid,liquidUniforms};
}
