import * as THREE from 'three';
import { createDeskContactShadows } from './deskContactShadows.js';
import { skipNightProbe } from '../lib/features.js';

const ROOT = `${import.meta.env.BASE_URL}materials/after-hours/`;

// Resources are optional upgrades: failure leaves the working authored scene.
// All URLs are local; runtime never depends on an asset-library service.
export function createAfterHours({scene,model,renderer,invalidate,tier,onStatus}) {
  let disposed=false, sky='night', probeDirty=true, lastLamp=-1;
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


  const pmrem=new THREE.PMREMGenerator(renderer), probes=new Map();
  const contacts=createDeskContactShadows({renderer,root:model.root,staticGeometry:model.contactGeometry,
    objects:[model.phone,model.hands.root,...['coffee','award','headphones'].map(key=>model.roomActions.objects[key]).filter(Boolean)],
    center:model.contactSurfaces.desk.center,size:model.contactSurfaces.desk.size,
    raisedReceivers:[model.contactSurfaces.mat],resolution:tier==='low'?256:512,
    updatesPerSecond:tier==='low'?10:15,invalidate});
  function captureProbe(){
    if(disposed||sky!=='night'||skipNightProbe())return;
    const key=model.roomActions.state.lamp>.5?'on':'off';
    if(probes.has(key)){scene.environment=probes.get(key).texture;return;}
    const target=new THREE.WebGLCubeRenderTarget(tier==='high'?128:64,{type:THREE.HalfFloatType});
    const cube=new THREE.CubeCamera(.05,120,target);cube.position.set(0,1.60,.1);
    const visible=[model.hands.root.visible,model.figure.root.visible,snow.visible];
    model.hands.root.visible=false;model.figure.root.visible=false;snow.visible=false;
    const steamVisible=steam.visible;steam.visible=false;
    scene.environment=null;
    const oldShadow=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
    try{contacts.withoutReceivers(()=>cube.update(renderer,scene));}
    finally{
      renderer.shadowMap.enabled=oldShadow;
      model.hands.root.visible=visible[0];model.figure.root.visible=visible[1];snow.visible=visible[2];
      steam.visible=steamVisible;
    }
    const filtered=pmrem.fromCubemap(target.texture);target.dispose();targets.push(filtered);probes.set(key,filtered);
    scene.environment=filtered.texture;scene.environmentIntensity=.35;
  }
  const status={city:'skipped',materials:'loading',bake:'loading',lamp:'loading',fixture:'loading'};
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
    for(const [name,m] of Object.entries(model.bakedMaterials))assign(m,sets[name==='floor'?'floor':'plaster'],[tile(name),tile(name)]);
        status.materials='ready';probeDirty=true;invalidate();report();
  }).catch(e=>{status.materials='fallback';console.warn('Room materials fallback:',e.message);report();});
  // The room's bake comes from scripts/blender/bake_true_scale_room.py.
  const BAKED=`${ROOT}baked-true-scale/`;
  const bakePromise=Promise.all(Object.entries(model.bakedMaterials).map(async([name,m])=>{
    const [off,on]=await Promise.all(['off','on'].map(mode=>loadTexture(`${BAKED}${name}-${mode}.png`)));
    off.channel=on.channel=1;m.lightMap=off;m.lightMapIntensity=sky==='night'?.7:0;
    m.onBeforeCompile=shader=>{
      shader.uniforms.taskLamp=uniforms.lamp;shader.uniforms.lampLightmap={value:on};
      shader.fragmentShader='uniform float taskLamp;uniform sampler2D lampLightmap;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',THREE.ShaderChunk.lights_fragment_maps.replace('texture2D( lightMap, vLightMapUv )','mix(texture2D( lightMap, vLightMapUv ),texture2D(lampLightmap,vLightMapUv),taskLamp)'));
    };m.customProgramCacheKey=()=>"after-hours-bake";m.needsUpdate=true;
  })).then(()=>{status.bake='ready';probeDirty=true;invalidate();report();}).catch(e=>{status.bake='fallback';console.warn('Room bake fallback:',e.message);report();});

  return {
    ready:Promise.allSettled([mapsPromise,bakePromise,lampPromise,mousePromise,fixturePromise]),
    update(time){uniforms.time.value=time;uniforms.lamp.value=model.roomActions.state.lamp;
      model.taskLamp.update(uniforms.lamp.value);
      model.roomActions.objects.coffee.updateWorldMatrix(true,false);
      steamOrigin.set(0,.079,0).applyMatrix4(model.roomActions.objects.coffee.matrixWorld);
      steam.visible=model.roomActions.state.coffeeLevel>.01 && time!==0;
      const lamp=uniforms.lamp.value>.5?1:0;
      if(lamp!==lastLamp){probeDirty=true;lastLamp=lamp;}
      if(probeDirty&&status.materials!=='loading'&&status.bake!=='loading'&&status.lamp!=='loading'){
        probeDirty=false;captureProbe();
      }
      contacts.update(performance.now());
    },
    contactStats:()=>contacts.stats(),
    warmContacts:()=>contacts.warm(),
    // Capture the night probe before the warm-up gate compiles, so the env-map program variants link behind the loader.
    warmProbe(){if(probeDirty){probeDirty=false;captureProbe();}},
    setContactsEnabled:value=>contacts.setEnabled(value),
    setSky(value){sky=value;scene.environment=value==='night'?(probes.get(lastLamp?'on':'off')?.texture||null):null;
      for(const m of Object.values(model.bakedMaterials))m.lightMapIntensity=value==='night'?.7:0;probeDirty=true;},
    // Rain shows in any light.
    setWeather(raining){snow.visible=!!raining;invalidate();},
    dispose(){disposed=true;contacts.dispose();scene.environment=null;scene.remove(snow,steam);snowGeometry.dispose();snowMaterial.dispose();steamGeometry.dispose();steamMaterial.dispose();
      resources.forEach(t=>t.dispose());targets.forEach(t=>t.dispose());pmrem.dispose();},
  };
}
