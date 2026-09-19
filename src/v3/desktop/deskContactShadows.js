import * as THREE from 'three';

// Local contact occlusion, not a replacement for architectural light shadows.
// A camera under the desk sees the nearest underside of each selected caster.
// Height attenuates its silhouette, then two small separable passes soften it.
// This module is deliberately not imported by the stage until visual QA.
export function createDeskContactShadows({
  renderer, root, staticGeometry = null, objects = [], invalidate,
  center = [0, 1.165, -.04], size = [3.52, 1.45],
  raisedReceivers = [],
  resolution = 512, maxHeight = .5, strength = .46, updatesPerSecond = 15,
}) {
  let disposed = false, dirty = true, timer = null, lastCapture = -Infinity;
  const interval = 1000 / updatesPerSecond;
  const casters = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-size[0]/2,size[0]/2,size[1]/2,-size[1]/2,.001,maxHeight);
  camera.position.set(center[0],center[1]-.002,center[2]);
  camera.up.set(0,0,1);
  camera.lookAt(center[0],center[1]+1,center[2]);camera.updateMatrixWorld();
  const projection = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  const height = Math.max(64,Math.round(resolution*size[1]/size[0]));
  const makeTarget = () => new THREE.WebGLRenderTarget(resolution,height,{
    minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
    format:THREE.RGBAFormat,type:THREE.UnsignedByteType,depthBuffer:true,
    stencilBuffer:false,generateMipmaps:false,
  });
  const raw = makeTarget(), horizontal = makeTarget(), softened = makeTarget();
  const casterMaterial = new THREE.ShaderMaterial({
    side:THREE.DoubleSide,blending:THREE.NoBlending,
    uniforms:{deskHeight:{value:center[1]},heightRange:{value:maxHeight}},
    vertexShader:`
      #include <common>
      #include <skinning_pars_vertex>
      varying float worldHeight;
      void main(){
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        vec4 local=vec4(transformed,1.);
        #ifdef USE_INSTANCING
          local=instanceMatrix*local;
        #endif
        worldHeight=(modelMatrix*local).y;
        gl_Position=projectionMatrix*viewMatrix*modelMatrix*local;
      }`,
    fragmentShader:`
      uniform float deskHeight;uniform float heightRange;varying float worldHeight;
      void main(){
        float distanceAbove=worldHeight-deskHeight;
        if(distanceAbove<-.003||distanceAbove>heightRange)discard;
        float contact=exp(-max(distanceAbove,0.)*11.);
        contact*=1.-smoothstep(heightRange*.65,heightRange,distanceAbove);
        gl_FragColor=vec4(0.,0.,0.,contact);
      }`,
  });
  // Source geometries and skeletons are borrowed. They are never rebound,
  // mutated or disposed by this effect.
  const mirrors = [], skeletons = new Set(), matrixSnapshots = new Map();
  const sources = new Set();
  for(const object of objects) object.traverse(source=>{
    if(!source.isMesh||sources.has(source))return;
    sources.add(source);
    let mirror;
    if(source.isSkinnedMesh){
      mirror=new THREE.SkinnedMesh(source.geometry,casterMaterial);
      mirror.skeleton=source.skeleton;
      mirror.bindMatrix.copy(source.bindMatrix);
      mirror.bindMatrixInverse.copy(source.bindMatrixInverse);
      mirror.bindMode=source.bindMode;skeletons.add(source.skeleton);
    }else if(source.isInstancedMesh){
      mirror=new THREE.InstancedMesh(source.geometry,casterMaterial,source.count);
      // Instancing here is only for fixed keycaps; moving instanced casters
      // require explicit markDirty() after editing their instance matrices.
      mirror.instanceMatrix=source.instanceMatrix;
    }else mirror=new THREE.Mesh(source.geometry,casterMaterial);
    mirror.matrixAutoUpdate=false;mirror.frustumCulled=false;
    casters.add(mirror);mirrors.push({source,mirror});
  });
  if(staticGeometry){
    const fixed=new THREE.Mesh(staticGeometry,casterMaterial);
    fixed.frustumCulled=false;casters.add(fixed);
  }

  const blurScene=new THREE.Scene(), blurCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const blurMaterial=new THREE.ShaderMaterial({
    depthTest:false,depthWrite:false,blending:THREE.NoBlending,
    uniforms:{source:{value:null},step:{value:new THREE.Vector2()}},
    vertexShader:'varying vec2 uvSample;void main(){uvSample=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`uniform sampler2D source;uniform vec2 step;varying vec2 uvSample;
      void main(){vec4 sum=texture2D(source,uvSample)*.227027;
        sum+=texture2D(source,uvSample+step*1.384615)*.316216;
        sum+=texture2D(source,uvSample-step*1.384615)*.316216;
        sum+=texture2D(source,uvSample+step*3.230769)*.070270;
        sum+=texture2D(source,uvSample-step*3.230769)*.070270;
        gl_FragColor=sum;}`,
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),blurMaterial);blurScene.add(quad);
  const receiverMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
    uniforms:{occlusion:{value:softened.texture},contactProjection:{value:projection},strength:{value:strength},surfaceSize:{value:new THREE.Vector2(...size)},cornerRadius:{value:.028}},
    vertexShader:`uniform mat4 contactProjection;varying vec4 projected;varying vec2 surfaceUv;
      void main(){surfaceUv=uv;vec4 world=modelMatrix*vec4(position,1.);projected=contactProjection*world;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D occlusion;uniform float strength;uniform vec2 surfaceSize;uniform float cornerRadius;
      varying vec4 projected;varying vec2 surfaceUv;
      void main(){vec2 uvShadow=projected.xy/projected.w*.5+.5;
        if(any(lessThan(uvShadow,vec2(0.)))||any(greaterThan(uvShadow,vec2(1.))))discard;
        vec2 q=abs((surfaceUv-.5)*surfaceSize)-(surfaceSize*.5-cornerRadius);
        if(length(max(q,vec2(0.)))+min(max(q.x,q.y),0.)>cornerRadius)discard;
        gl_FragColor=vec4(0.,0.,0.,texture2D(occlusion,uvShadow).a*strength);}`,
  });
  // The felt mat needs its own receiver above its top: a desk-only decal would
  // disappear beneath the mat, losing precisely the keyboard/hand contacts.
  const receivers=[{center,size,radius:.028},...raisedReceivers].map((surface,index)=>{
    // Render-target textures must be shared, not cloned with cloneUniforms.
    const material=index===0?receiverMaterial:new THREE.ShaderMaterial({
      vertexShader:receiverMaterial.vertexShader,fragmentShader:receiverMaterial.fragmentShader,
      transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
      uniforms:{...receiverMaterial.uniforms,surfaceSize:{value:new THREE.Vector2()},cornerRadius:{value:0}},
    });
    material.uniforms.surfaceSize.value.set(...surface.size);
    material.uniforms.cornerRadius.value=surface.radius??.02;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...surface.size),material);
    mesh.name=`Desk contact receiver ${index}`;mesh.rotation.x=-Math.PI/2;
    mesh.position.set(surface.center[0],surface.center[1]+.0008,surface.center[2]);mesh.raycast=()=>{};
    mesh.visible=false;root.add(mesh);return mesh;
  });

  function matrixChanged(object){
    const values=object.matrixWorld.elements;let previous=matrixSnapshots.get(object),changed=!previous;
    if(!previous){previous=new Float64Array(16);matrixSnapshots.set(object,previous);}
    for(let i=0;i<16;i++){
      if(Math.abs(values[i]-previous[i])>.0001)changed=true;
      previous[i]=values[i];
    }
    return changed;
  }
  function visibleInTree(object){
    for(let current=object;current;current=current.parent)if(!current.visible)return false;
    return true;
  }
  function sync(){
    for(const {source,mirror} of mirrors){
      source.updateWorldMatrix(true,false);
      const visible=visibleInTree(source);
      if(mirror.visible!==visible){mirror.visible=visible;dirty=true;}
      if(matrixChanged(source))dirty=true;
      mirror.matrix.copy(source.matrixWorld);
    }
    for(const skeleton of skeletons){
      for(const bone of skeleton.bones){bone.updateWorldMatrix(true,false);if(matrixChanged(bone))dirty=true;}
      skeleton.update();
    }
  }
  const savedColor=new THREE.Color(), savedViewport=new THREE.Vector4(), savedScissor=new THREE.Vector4();
  function capture(){
    const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
    renderer.getClearColor(savedColor);const alpha=renderer.getClearAlpha();
    renderer.getViewport(savedViewport);renderer.getScissor(savedScissor);
    const scissor=renderer.getScissorTest(),autoClear=renderer.autoClear;
    const shadows=renderer.shadowMap.enabled,xr=renderer.xr.enabled;
    try{
      renderer.xr.enabled=false;renderer.shadowMap.enabled=false;renderer.autoClear=true;
      renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);
      renderer.setRenderTarget(raw);renderer.clear();renderer.render(casters,camera);
      // ~9mm blur in both world axes despite the rectangular render target.
      blurMaterial.uniforms.source.value=raw.texture;
      blurMaterial.uniforms.step.value.set(.003/size[0],0);
      renderer.setRenderTarget(horizontal);renderer.clear();renderer.render(blurScene,blurCamera);
      blurMaterial.uniforms.source.value=horizontal.texture;
      blurMaterial.uniforms.step.value.set(0,.003/size[1]);
      renderer.setRenderTarget(softened);renderer.clear();renderer.render(blurScene,blurCamera);
      receivers.forEach(mesh=>{mesh.visible=true;});dirty=false;
    }finally{
      renderer.setRenderTarget(target,face,mip);renderer.setViewport(savedViewport);
      renderer.setScissor(savedScissor);renderer.setScissorTest(scissor);
      renderer.setClearColor(savedColor,alpha);renderer.autoClear=autoClear;
      renderer.shadowMap.enabled=shadows;renderer.xr.enabled=xr;
    }
  }
  return {
    update(now){
      if(disposed)return;sync();if(!dirty)return;
      const remaining=interval-(now-lastCapture);
      if(remaining>0){
        if(timer===null)timer=setTimeout(()=>{timer=null;if(!disposed)invalidate();},Math.ceil(remaining));
        return;
      }
      if(timer!==null){clearTimeout(timer);timer=null;}
      capture();lastCapture=now;
    },
    markDirty(){dirty=true;},
    dispose(){
      if(disposed)return;disposed=true;if(timer!==null)clearTimeout(timer);
      receivers.forEach(mesh=>{mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();});
      quad.geometry.dispose();blurMaterial.dispose();casterMaterial.dispose();
      raw.dispose();horizontal.dispose();softened.dispose();matrixSnapshots.clear();casters.clear();
    },
  };
}
