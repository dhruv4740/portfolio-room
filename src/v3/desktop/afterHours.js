import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createDeskContactShadows } from './deskContactShadows.js';

const ROOT = `${import.meta.env.BASE_URL}materials/after-hours/`;

// Resources are optional upgrades: failure leaves the working authored scene.
// All URLs are local; runtime never depends on an asset-library service.
export function createAfterHours({scene,model,renderer,invalidate,tier,onStatus}) {
  let disposed=false, city=null, sky='night', probeDirty=true, lastLamp=-1, wet=false;
  const applyWet=()=>city?.traverse(o=>{if(o.isMesh&&o.material){o.material.roughness=Math.min(o.material.userData.dryRoughness??=o.material.roughness,wet?.35:1);o.material.envMapIntensity=wet?.35:.12;}});
  const resources=[],targets=[], uniforms={lamp:{value:1},time:{value:0}};
  const textureLoader=new THREE.TextureLoader();
  const loadTexture=async(url,color=false)=>{
    const t=await textureLoader.loadAsync(url);
    if(disposed){t.dispose();throw new Error('Scene disposed');}
    t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
    t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());resources.push(t);return t;
  };
  const snowGeometry=new THREE.BufferGeometry(), positions=[], seeds=[];
  let seed=1926;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  // The true-scale room supplies its own volume just outside its window.
  const rv=model.rainVolume||{x:[-.6,4],z:[-2.05,-5.25]};
  for(let i=0;i<(tier==='low'?180:tier==='high'?850:460);i++){
    positions.push(rv.x[0]+random()*(rv.x[1]-rv.x[0]),-1+random()*8,rv.z[0]+random()*(rv.z[1]-rv.z[0]));seeds.push(random());
  }
  snowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  snowGeometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
  // Mumbai rain, not snow: fast, slightly wind-slanted streaks. Each point
  // draws a thin vertical sliver so it reads as a falling drop.
  const snowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:uniforms.time},
    vertexShader:`attribute float seed;uniform float time;varying float fade;
      void main(){vec3 p=position;p.y=-1.+mod(position.y+1.-time*(7.5+seed*3.),8.);
      p.x+=(p.y-6.)*-.06;vec4 mv=modelViewMatrix*vec4(p,1.);
      fade=mix(.28,.6,seed)*clamp((-mv.z-1.)*.4,0.,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((140.+seed*90.)/-mv.z,3.,26.);}`,
    fragmentShader:`varying float fade;void main(){vec2 c=gl_PointCoord-.5;if(abs(c.x)>.03)discard;
      gl_FragColor=vec4(.62,.70,.78,fade*smoothstep(.5,.0,abs(c.y)));}`});
  const snow=new THREE.Points(snowGeometry,snowMaterial);snow.name='Exterior rain';snow.frustumCulled=false;snow.raycast=()=>{};snow.visible=false;scene.add(snow);

  // A small, low-opacity glass reflection follows the actual sliding sash.
  // Mid/low retain the prefiltered room probe without a second scene render.
  let glassReflection=null, costlyFrames=0;
  if(tier==='high'&&!model.cinematic){
    const shader={...Reflector.ReflectorShader,fragmentShader:Reflector.ReflectorShader.fragmentShader.replace('blendOverlay( base.rgb, color ), 1.0','blendOverlay( base.rgb, color ), 0.13')};
    glassReflection=new Reflector(new THREE.PlaneGeometry(.64,1.85),{textureWidth:384,textureHeight:512,multisample:0,clipBias:.003,color:0x7f7f7f,shader});
    glassReflection.name='Sash reflection';glassReflection.position.set(0,0,.091);
    glassReflection.material.transparent=true;glassReflection.material.depthWrite=false;
    glassReflection.raycast=()=>{};model.roomActions.objects.windowOpen.add(glassReflection);
  }

  // Camera-facing wisps rise in world space from the moving liquid surface.
  const steamGeometry=new THREE.BufferGeometry();
  steamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(36),3));
  steamGeometry.setAttribute('seed',new THREE.Float32BufferAttribute(Array.from({length:12},(_,i)=>i/12),1));
  const steamOrigin=new THREE.Vector3();
  const steamMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:uniforms.time,origin:{value:steamOrigin}},
    vertexShader:`attribute float seed;uniform float time;uniform vec3 origin;varying float fade;
      void main(){float age=fract(seed+time*.23);vec3 p=origin+vec3(sin(age*7.+seed*31.)*.018*age,age*.19,cos(seed*26.+age*4.)*.016*age);
      vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((7.+age*16.)/-mv.z,2.,42.);fade=sin(age*3.14159)*.055;}`,
    fragmentShader:`varying float fade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.76,.79,.79,fade*smoothstep(.5,0.,d));}`});
  const steam=new THREE.Points(steamGeometry,steamMaterial);steam.name='Coffee steam';steam.frustumCulled=false;steam.raycast=()=>{};scene.add(steam);

  // Small physical-scale architecture details, batched by material.
  const detail=new THREE.Group();detail.name='Winter room details';model.root.add(detail);
  const trim=new THREE.MeshStandardMaterial({color:'#303934',roughness:.54,metalness:.12});
  // Wet concrete sill (was a snow cap; it never snows in Mumbai).
  const snowCap=new THREE.MeshStandardMaterial({color:'#4a4d4c',roughness:.62});
  const detailParts=[];
  function box(size,pos,mat){const g=new THREE.BoxGeometry(...size);g.translate(...pos);detailParts.push({g,mat});}
  // Trim and sill are authored for the old room's window; the true-scale room
  // models its own.
  if(!model.cinematic){
  for(const x of [.56,2.21])box([.026,2.13,.045],[x,1.99,-1.565],trim);
  box([1.72,.045,.26],[1.385,.975,-1.89],snowCap);
  for(let i=0;i<13;i++)box([.045,.43,.10],[.85+i*.082,.50,-1.60],trim);
  for(const y of [.29,.70])box([1.10,.036,.08],[1.34,y,-1.57],trim);
  for(const mat of [trim,snowCap]){
    const gs=detailParts.filter(p=>p.mat===mat).map(p=>p.g);
    const mesh=new THREE.Mesh(mergeGeometries(gs),mat);gs.forEach(g=>g.dispose());mesh.receiveShadow=true;detail.add(mesh);
  }
  }

  const pmrem=new THREE.PMREMGenerator(renderer), probes=new Map();
  const contacts=createDeskContactShadows({renderer,root:model.root,staticGeometry:model.contactGeometry,
    objects:[model.phone,model.notebook,model.hands.root,...['coffee','award','headphones','pen'].map(key=>model.roomActions.objects[key]).filter(Boolean)],
    center:model.contactSurfaces.desk.center,size:model.contactSurfaces.desk.size,
    raisedReceivers:[model.contactSurfaces.mat],resolution:tier==='low'?256:512,
    updatesPerSecond:tier==='low'?10:15,invalidate});
  function captureProbe(){
    if(disposed||sky!=='night')return;
    const key=model.roomActions.state.lamp>.5?'on':'off';
    if(probes.has(key)){scene.environment=probes.get(key).texture;return;}
    const target=new THREE.WebGLCubeRenderTarget(tier==='high'?128:64,{type:THREE.HalfFloatType});
    const cube=new THREE.CubeCamera(.05,120,target);cube.position.set(0,1.60,.1);
    const visible=[model.hands.root.visible,model.figure.root.visible,snow.visible];
    model.hands.root.visible=false;model.figure.root.visible=false;snow.visible=false;
    const reflectVisible=glassReflection?.visible;if(glassReflection)glassReflection.visible=false;
    const steamVisible=steam.visible;steam.visible=false;
    scene.environment=null;
    const oldShadow=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
    try{contacts.withoutReceivers(()=>cube.update(renderer,scene));}
    finally{
      renderer.shadowMap.enabled=oldShadow;
      model.hands.root.visible=visible[0];model.figure.root.visible=visible[1];snow.visible=visible[2];
      steam.visible=steamVisible;if(glassReflection)glassReflection.visible=reflectVisible;
    }
    const filtered=pmrem.fromCubemap(target.texture);target.dispose();targets.push(filtered);probes.set(key,filtered);
    scene.environment=filtered.texture;scene.environmentIntensity=.35;
  }
  const status={city:'loading',materials:'loading',bake:'loading',lamp:'loading',fixture:'loading'};
  const report=()=>onStatus?.({...status});
  // The licensed mouse loads after the static contact set is merged, so it
  // hands its real geometry to the contact pass once it is in the scene.
  const mousePromise=model.mouse.ready.then(()=>{
    if(disposed)return;
    const geometry=model.mouse.contactGeometry();
    if(geometry)contacts.addStatic(geometry);
  });
  const fixturePromise=model.ceilingFixture.ready.then(()=>{
    if(disposed)return;status.fixture=model.ceilingFixture.state.status;invalidate();report();});
  const lampPromise=model.taskLamp.ready.then(()=>{if(disposed)return;status.lamp=model.taskLamp.state.status;probeDirty=true;invalidate();report();});
  // The city GLB is meshopt-compressed (scripts: gltf-transform meshopt).
  // The city GLB is placed for the old window; the true-scale room keeps its
  // own sightline-fitted exterior.
  const cityPromise=model.cinematic?Promise.resolve().then(()=>{status.city='skipped';report();}):new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${import.meta.env.BASE_URL}models/after-hours/winter-city.glb`).then(gltf=>{
    if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return;}
    city=gltf.scene;city.name='After Hours winter city';
    city.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.raycast=()=>{};
      o.material.fog=true;o.material.envMapIntensity=.12;
      // Exterior has its own soft sky fill; no indoor point lights reach it.
      if(!o.material.name.startsWith('Window ')){o.material.color.multiplyScalar(.68);o.material.emissive.copy(o.material.color);o.material.emissiveIntensity=.06;}
    }});
    scene.add(city);applyWet();model.city.visible=false;status.city='ready';probeDirty=true;invalidate();report();
  }).catch(e=>{status.city='fallback';console.warn('Winter city fallback:',e.message);report();});
  const mapsPromise=fetch(`${ROOT}manifest.json`).then(r=>{if(!r.ok)throw new Error('material manifest unavailable');return r.json();}).then(async manifest=>{
    const entries=manifest.sets||manifest.materials||manifest;
    const sets={};await Promise.all(Object.entries(entries).filter(([,v])=>v?.baseColor).map(async([key,v])=>{
      const urls=[v.baseColor,v.normal,v.roughness];const ts=await Promise.all(urls.map((url,i)=>url?loadTexture(url.startsWith('/')?url:ROOT+url,i===0):null));
      ts.filter(Boolean).forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});sets[key]=ts;
    }));
    if(disposed)return;
    function assign(material,set,repeat=[1,1]){if(!material||!set)return;
      [material.map,material.normalMap,material.roughnessMap]=set.map(t=>{if(!t)return null;const c=t.clone();c.repeat.set(...repeat);resources.push(c);return c;});
      material.color.set('#ffffff');material.normalScale.set(.32,.32);material.roughness=.86;material.needsUpdate=true;
    }
    assign(model.materials.oak,sets.wood,[2,1]);
    assign(model.materials.plaster,sets.plaster,[2,2]);
    // The true-scale room's UVs are in metres; tiles keep feat/v3's density.
    const tile=name=>1/(name==='floor'?1.27:1.6);
    for(const [name,m] of Object.entries(model.bakedMaterials))assign(m,sets[name==='floor'?'floor':'plaster'],model.cinematic?[tile(name),tile(name)]:name==='floor'?[4,3]:[3,2]);
    await cityPromise;
    city?.traverse(o=>{if(!o.isMesh)return;const n=o.material.name;if(n==='Winter masonry'||n==='Winter limestone'){
      const color=o.material.color.clone();assign(o.material,sets.brick,[.5,.5]);o.material.color.copy(color).multiplyScalar(2.2);
      // Approximate exterior sky/street bounce without adding a light to every
      // indoor material's shader. Keep the brick detail legible below windows.
      o.material.emissive.copy(o.material.color);o.material.emissiveMap=o.material.map;o.material.emissiveIntensity=.12;
    }});
    status.materials='ready';probeDirty=true;invalidate();report();
  }).catch(e=>{status.materials='fallback';console.warn('Room materials fallback:',e.message);report();});
  // Each room has its own bake (scripts/blender/bake_room.py, bake_true_scale_room.py).
  const BAKED=`${ROOT}${model.cinematic?'baked-true-scale':'baked'}/`;
  const bakePromise=Promise.all(Object.entries(model.bakedMaterials).map(async([name,m])=>{
    const [off,on]=await Promise.all(['off','on'].map(mode=>loadTexture(`${BAKED}${name}-${mode}.png`)));
    off.channel=on.channel=1;m.lightMap=off;m.lightMapIntensity=sky==='night'?.7:0;
    m.onBeforeCompile=shader=>{
      shader.uniforms.taskLamp=uniforms.lamp;shader.uniforms.lampLightmap={value:on};
      shader.fragmentShader='uniform float taskLamp;uniform sampler2D lampLightmap;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',THREE.ShaderChunk.lights_fragment_maps.replace('texture2D( lightMap, vLightMapUv )','mix(texture2D( lightMap, vLightMapUv ),texture2D(lampLightmap,vLightMapUv),taskLamp)'));
    };m.customProgramCacheKey=()=>`after-hours-bake-${name}`;m.needsUpdate=true;
  })).then(()=>{status.bake='ready';probeDirty=true;invalidate();report();}).catch(e=>{status.bake='fallback';console.warn('Room bake fallback:',e.message);report();});

  return {
    ready:Promise.allSettled([cityPromise,mapsPromise,bakePromise,lampPromise,mousePromise,fixturePromise]),
    update(time,cost=0){uniforms.time.value=time;uniforms.lamp.value=model.roomActions.state.lamp;
      model.taskLamp.update(uniforms.lamp.value);
      model.roomActions.objects.coffee.updateWorldMatrix(true,false);
      steamOrigin.set(0,.079,0).applyMatrix4(model.roomActions.objects.coffee.matrixWorld);
      steam.visible=model.roomActions.state.coffeeLevel>.01 && time!==0;
      // Shed the extra scene pass before sustained overload lowers resolution.
      costlyFrames=cost>27?costlyFrames+1:0;
      if(glassReflection&&costlyFrames>=10)glassReflection.visible=false;
      const lamp=uniforms.lamp.value>.5?1:0;
      if(lamp!==lastLamp){probeDirty=true;lastLamp=lamp;}
      if(probeDirty&&status.city!=='loading'&&status.materials!=='loading'&&status.bake!=='loading'&&status.lamp!=='loading'){
        probeDirty=false;captureProbe();
      }
      contacts.update(performance.now());
    },
    contactStats:()=>contacts.stats(),
    setContactsEnabled:value=>contacts.setEnabled(value),
    setSky(value){sky=value;scene.environment=value==='night'?(probes.get(lastLamp?'on':'off')?.texture||null):null;
      for(const m of Object.values(model.bakedMaterials))m.lightMapIntensity=value==='night'?.7:0;probeDirty=true;},
    // Rain shows in any light; wet streets read as glossier city surfaces.
    setWeather(raining){snow.visible=!!raining;wet=!!raining;applyWet();invalidate();},
    dispose(){disposed=true;contacts.dispose();scene.environment=null;scene.remove(snow,steam);snowGeometry.dispose();snowMaterial.dispose();steamGeometry.dispose();steamMaterial.dispose();
      if(glassReflection){glassReflection.removeFromParent();glassReflection.geometry.dispose();glassReflection.dispose();}
      city?.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.normalMap?.dispose();o.material.roughnessMap?.dispose();o.material.dispose();}});if(city)scene.remove(city);
      resources.forEach(t=>t.dispose());targets.forEach(t=>t.dispose());pmrem.dispose();},
  };
}
