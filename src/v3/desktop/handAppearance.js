import * as THREE from 'three';

// Small, local microrelief tile. No image download or extra draw; mipmapping
// removes the detail at ordinary desk distance rather than leaving speckles.
export function createHandSkin() {
  const size=128, data=new Uint8Array(size*size*4);
  let seed=71237;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const noise=Float32Array.from({length:size*size},random);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const at=(dx,dy)=>noise[((y+dy+size)%size)*size+(x+dx+size)%size];
    const value=Math.round(190+26*(at(0,0)*.5+(at(-1,0)+at(1,0)+at(0,-1)+at(0,1))*.125));
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;
  // Skin, not clay: a dielectric at ior 1.4 (F0 ~0.028) with a soft sheen, and
  // diffuse light that wraps past the terminator further in red than in blue,
  // the cheap stand-in for light scattering under the surface.
  const material=new THREE.MeshPhysicalMaterial({name:'Hand skin',color:'#ffffff',
    vertexColors:true,roughness:.64,roughnessMap:texture,bumpMap:texture,bumpScale:.00012,
    ior:1.4,sheen:.18,sheenRoughness:.6,sheenColor:new THREE.Color('#e6a58f')});
  const chunk=THREE.ShaderChunk.lights_physical_pars_fragment;
  const lambert='reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );';
  if(chunk.includes(lambert)){
    const wrapped=chunk.replace(lambert,`{
      float nl = dot( geometryNormal, directLight.direction );
      vec3 wrapNL = saturate( ( vec3( nl ) + SKIN_WRAP ) / ( 1.0 + SKIN_WRAP ) );
      reflectedLight.directDiffuse += ( irradiance + ( wrapNL - saturate( nl ) ) * directLight.color ) * BRDF_Lambert( material.diffuseContribution );
    }`);
    material.onBeforeCompile=shader=>{
      shader.fragmentShader='#define SKIN_WRAP vec3( 0.42, 0.20, 0.14 )\n'+shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',wrapped);
    };
    material.customProgramCacheKey=()=>'hand-skin-wrap';
  }
  return material;
}

// Bake regional colour and microdetail coordinates into each neutral mesh.
// Works on loaded binaries and the local fallback; colours deform with skin.
export function applyHandAppearance(h) {
  const mesh=h.skinMesh, geometry=mesh.geometry;
  const inverse=h.skeleton.boneInverses[0];
  const positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const point=new THREE.Vector3(),normal=new THREE.Vector3();
  const base=new THREE.Color('#ad7d62'),palm=new THREE.Color('#bc8a70');
  const jointColor=new THREE.Color('#a87562'),color=new THREE.Color();
  const colors=[],uv=[];
  const jointPoints=h.digits.flatMap(d=>d.userData.joints.map(j=>
    new THREE.Vector3().setFromMatrixPosition(j.matrixWorld).applyMatrix4(inverse)));
  // Each digit as capsules in hand space. A vertex belongs to its nearest digit;
  // how close the second-nearest digit's surface comes is how shut-in that skin
  // is, which darkens the webs and the seams between fingers so they read as
  // separate digits instead of one smooth paddle.
  const local=(joint,z=0)=>joint.localToWorld(new THREE.Vector3(0,0,z)).applyMatrix4(inverse);
  const digits=[...h.digits,h.thumb].map(d=>{const {L,R,joints}=d.userData;
    return joints.map((j,k)=>{const a=local(j),b=local(j,-L[k]);return {a,d:b.sub(a),r:R[k]};});});
  const seg=new THREE.Vector3();
  const gapTo=(segments)=>{let g=Infinity;for(const s of segments){
    const t=THREE.MathUtils.clamp(seg.subVectors(point,s.a).dot(s.d)/s.d.lengthSq(),0,1);
    g=Math.min(g,seg.subVectors(point,s.a).addScaledVector(s.d,-t).length()-s.r);}return g;};
  const crease=new THREE.Color('#6a3a2e');
  for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(inverse);
    normal.fromBufferAttribute(normals,i).transformDirection(inverse);
    const palmWeight=THREE.MathUtils.smoothstep(-normal.y,.15,.85);
    color.copy(base).lerp(palm,palmWeight*.65);
    let jointWeight=0;
    for(const joint of jointPoints)jointWeight=Math.max(jointWeight,Math.exp(-point.distanceToSquared(joint)/.00013));
    color.lerp(jointColor,jointWeight*.18);
    const gaps=digits.map(gapTo).sort((a,b)=>a-b);
    color.lerp(crease,(1-THREE.MathUtils.smoothstep(gaps[1],.001,.009))*.42);
    const variation=Math.sin(point.x*193+point.z*71)*Math.sin(point.z*137-point.y*83);
    color.multiplyScalar(1+variation*.016);
    colors.push(color.r,color.g,color.b);
    // Oblique projection avoids a collapsed side-wall coordinate at the wrist.
    uv.push((point.x+point.y*.7)/.012,(point.z+point.y*.4)/.012);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
}
