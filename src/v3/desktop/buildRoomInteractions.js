import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const AWARD_REST = [-0.12, 0.62, 0];
export const PEN_REST = [0, 0.187, 0];
export const KEY_ROWS =['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'\\", 'zxcvbnm,./   ', '            '];

export function buildRoomInteractions({root,materials:m,canvasTexture,anchors,achievements,bulb,lampInterior,lampPool,moon,moonOpen,blindsGroup,keys,keyConfig,windowLight}) {
  const objects={};
  function group(id) {const g=new THREE.Group();g.position.set(...anchors[id]);g.name=id;objects[id]=g;root.add(g);return g;}
  function mesh(g,geometry,material,position=[0,0,0],id=g.name) {const o=new THREE.Mesh(geometry,material);o.position.set(...position);o.receiveShadow=true;o.castShadow=false;o.userData.anchorId=id;g.add(o);return o;}
  function box(g,size,position,material=m.dark) {return mesh(g,new RoundedBoxGeometry(...size,2,0.008),material,position);}
  const lamp=group('lamp');const toggle=box(lamp,[0.055,0.025,0.075],[0,0,0]);
  const coffee=group('coffee');
  const ceramic=new THREE.MeshPhysicalMaterial({color:'#c4b9a2',roughness:.24,metalness:0,clearcoat:.42,clearcoatRoughness:.18});
  const profile=[[0,-.070],[.047,-.070],[.049,-.068],[.050,-.064],[.059,-.064],[.066,-.060],[.071,-.050],[.073,.061],[.074,.069],[.073,.073],[.070,.075],[.067,.073],[.065,.069],[.064,-.043],[.061,-.050],[.054,-.053],[0,-.053]];
  mesh(coffee,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64),ceramic);
  // Handle turned toward the sitter's left hand (back-left of the mug is unreachable).
  // Half a torus whose ends meet the outer wall, so no part of the loop sits inside the mug.
  const handle=mesh(coffee,new THREE.TorusGeometry(0.044,0.011,16,40,Math.PI),ceramic,[-0.043,0.008,0.043]);handle.rotation.set(0,Math.PI/4,Math.PI/2);
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
  // A standing desk frame, turned toward the chair and leaning back on a strut.
  const award=group('award');award.rotation.set(...AWARD_REST);box(award,[0.26,0.33,0.02],[0,0,0],m.wood);
  const strut=box(award,[0.03,0.3,0.012],[0,-0.03,-0.06],m.wood);strut.rotation.x=-0.35;
  const awardTexture=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle='#eee8d5';ctx.fillRect(0,0,w,h);ctx.fillStyle='#282b29';ctx.textAlign='center';ctx.font='bold 56px serif';ctx.fillText('HACKATHONS',w/2,110);
    let y=225;for(const a of achievements){ctx.font='bold 36px sans-serif';ctx.fillText(a.result.toUpperCase()+' · '+a.year,w/2,y);y+=52;ctx.font='28px sans-serif';let row='';for(const word of a.label.split(' ')){const next=row?row+' '+word:word;if(ctx.measureText(next).width>w-100){ctx.fillText(row,w/2,y);y+=38;row=word;}else row=next;}ctx.fillText(row,w/2,y);y+=110;}
  },1000,1300);
  mesh(award,new THREE.PlaneGeometry(0.235,0.305),new THREE.MeshBasicMaterial({map:awardTexture,toneMapped:false}),[0,0,0.011]);
  const drawer=group('drawer');box(drawer,[0.61,0.14,0.045],[0,0,0],m.wood);box(drawer,[0.60,0.025,0.48],[0,-0.065,-0.23],m.wood);
  for(const x of [-0.285,0.285])box(drawer,[0.025,0.13,0.48],[x,0,-0.23],m.wood);
  box(drawer,[0.15,0.018,0.025],[0,0,0.038]);
  // The résumé page (US Letter, 2550x3300 scan) lies in the drawer. Its holder
  // group uses the notebook's frame (flat, +y up) so grips read the same way;
  // image top points to holder -z.
  const pageTexture=new THREE.TextureLoader().load('/resume-page.jpg');pageTexture.colorSpace=THREE.SRGBColorSpace;pageTexture.anisotropy=8;
  const resumePage=new THREE.Group();resumePage.name='resumePage';resumePage.position.set(0,-0.047,-0.23);drawer.add(resumePage);
  const pagePlane=mesh(resumePage,new THREE.PlaneGeometry(0.21,0.21*3300/2550),new THREE.MeshBasicMaterial({map:pageTexture,toneMapped:false,side:THREE.DoubleSide}),[0,0,0],'drawer');pagePlane.rotation.x=-Math.PI/2;
  // Pencil: the group origin is the graphite tip, the body runs along local +z.
  const pen=group('pen');pen.rotation.set(...PEN_REST);
  const penBody=mesh(pen,new THREE.CylinderGeometry(0.0075,0.0075,0.33,6),new THREE.MeshStandardMaterial({color:'#d9a441',roughness:0.6}),[0,0,0.2]);penBody.rotation.x=Math.PI/2;
  const penTip=mesh(pen,new THREE.ConeGeometry(0.0075,0.035,6),new THREE.MeshStandardMaterial({color:'#e6cfa2',roughness:0.8}),[0,0,0.0175]);penTip.rotation.x=-Math.PI/2;
  const blinds=group('blinds');mesh(blinds,new THREE.CylinderGeometry(0.004,0.004,0.85,8),m.bone,[0,0.2,0]);const cord=mesh(blinds,new THREE.CapsuleGeometry(0.016,0.055,4,12),m.dark,[0,-0.25,0]);
  const headphones=group('headphones');const band=mesh(headphones,new THREE.TorusGeometry(0.115,0.012,10,40,Math.PI),m.dark);band.rotation.x=-Math.PI/2;
  for(const x of [-0.115,0.115])box(headphones,[0.055,0.085,0.09],[x,0,0],m.dark);
  const sash=group('windowOpen');
  // The blind slats sit at world z=-1.56 (0.07 in front of this group's
  // z=-1.63 anchor). Bias the sash meshes forward so the sash renders in
  // front of the blinds from the seated camera, without moving the group's
  // own anchor (used for the slide animation and the camera framing target).
  const sashZ = 0.09;
  // A dark 3cm frame so the moving sash reads as an edge against the sky,
  // rather than blending into the (also light) blind slats behind it.
  const sashFrame=new THREE.MeshStandardMaterial({color:'#20242a',roughness:0.5,metalness:0.3});
  box(sash,[0.68,0.035,0.03],[0,0.94,sashZ],sashFrame);
  box(sash,[0.68,0.035,0.03],[0,-0.94,sashZ],sashFrame);
  box(sash,[0.035,1.88,0.03],[-0.32,0,sashZ],sashFrame);
  box(sash,[0.035,1.88,0.03],[0.32,0,sashZ],sashFrame);
  box(sash,[0.02,0.09,0.03],[-0.30,0,sashZ+0.02],m.dark);
  // Round 2's glass material — the round-3 MeshPhysicalMaterial attempt
  // regressed the window-visibility measurement and is not used.
  const glassMat=new THREE.MeshStandardMaterial({color:'#c5d9eb',roughness:0.1,metalness:0.2,transparent:true,opacity:0.22,depthWrite:false});
  mesh(sash,new THREE.PlaneGeometry(0.64,1.85),glassMat,[0,0,sashZ]);
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
    bulb.intensity=(bulb.userData.onIntensity??1.85)*state.lamp;lampPool.material.opacity=0.38*state.lamp;lampInterior.material.color.set(state.lamp>0.5?'#d6a26b':'#29251e');toggle.rotation.x=(1-state.lamp)*0.28;
    // Blend two pre-baked shadow states; neither map is updated during a pull.
    blindsGroup.children.forEach((s,i)=>{s.rotation.x=THREE.MathUtils.lerp(-0.22,-1.42,state.blinds);s.position.y=2.88-i*THREE.MathUtils.lerp(0.145,0.024,state.blinds);});
    const closed=keyConfig?.closed??1.15;const open=keyConfig?.open??1.60;
    moon.intensity=closed*(1-state.blinds);moonOpen.intensity=open*state.blinds;drawer.position.z=homes.drawer.z+state.drawer*0.46;
    if(objects.windowOpen)objects.windowOpen.position.x=homes.windowOpen.x-state.windowOpen*0.58;
    if(windowLight)windowLight.intensity=(keyConfig?.windowLight??0.55)*state.windowOpen;
  }
  return {objects,homes,state,cord,apply,updateLiquid,setKey,liquid,liquidUniforms,blindsGroup,resumePage};
}
