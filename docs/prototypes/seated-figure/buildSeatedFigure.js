import * as THREE from 'three';

// Static seated silhouette; only the separate arm assembly changes pose.
export function buildSeatedFigure() {
  const root = new THREE.Group(); root.name = 'Seated figure';
  const shirt = new THREE.MeshStandardMaterial({color:'#3c4949',roughness:1});
  const trousers = new THREE.MeshStandardMaterial({color:'#242c36',roughness:1});
  const shoe = new THREE.MeshStandardMaterial({color:'#242321',roughness:0.9});
  const skin = new THREE.MeshStandardMaterial({color:'#b9896e',roughness:0.82});
  const hair = new THREE.MeshStandardMaterial({color:'#24201d',roughness:1});
  function ellipsoid(name, position, scale, material, parent=root) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),material);
    mesh.name=name;mesh.position.set(...position);mesh.scale.set(...scale);
    mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function limb(name,a,b,r1,r2,material) {
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,from.distanceTo(to),24),material);
    mesh.name=name;mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  // Cross-section loft keeps the shirt broader at the shoulders, with a soft hem.
  const rings=[[0.72,0.18,0.115,1.26],[0.79,0.225,0.14,1.26],[0.96,0.19,0.13,1.25],
    [1.18,0.21,0.135,1.24],[1.37,0.245,0.12,1.23],[1.46,0.22,0.095,1.23],[1.50,0.10,0.07,1.23]];
  const positions=[],indices=[];
  for(const [y,w,d,z] of rings)for(let i=0;i<32;i++){const a=i/32*Math.PI*2;positions.push(0.05+Math.cos(a)*w,y,z+Math.sin(a)*d);}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<32;i++){const a=j*32+i,b=j*32+(i+1)%32;indices.push(a,a+32,b,b,a+32,b+32);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const torso=new THREE.Mesh(geometry,shirt);torso.castShadow=torso.receiveShadow=true;root.add(torso);
  ellipsoid('Trouser seat',[0.05,0.75,1.22],[0.245,0.12,0.21],trousers);
  for(const side of [-1,1]) {
    const x=0.05+side*0.145;
    limb('Thigh',[x,0.76,1.23],[x+side*0.025,0.68,0.76],0.115,0.095,trousers);
    ellipsoid('Knee',[x+side*0.025,0.68,0.76],[0.094,0.093,0.096],trousers);
    limb('Trouser leg',[x+side*0.025,0.68,0.76],[x+side*0.03,0.17,0.70],0.091,0.061,trousers);
    ellipsoid('Shoe',[x+side*0.03,0.12,0.63],[0.078,0.055,0.16],shoe);
    ellipsoid('Shoulder',[0.05+side*0.225,1.40,1.23],[0.085,0.105,0.09],shirt);
  }
  const head=new THREE.Group();head.name='Head hidden at first person';root.add(head);
  ellipsoid('Neck',[0.05,1.51,1.23],[0.063,0.095,0.065],skin,head);
  ellipsoid('Head silhouette',[0.05,1.69,1.21],[0.112,0.147,0.114],skin,head);
  // A continuous hair cap covers the back and sides; there are no face features.
  ellipsoid('Hair',[0.05,1.735,1.23],[0.117,0.112,0.116],hair,head);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.013,8,32),shirt);
  collar.rotation.x=Math.PI/2;collar.position.set(0.05,1.49,1.23);collar.castShadow=true;root.add(collar);
  return {root,head};
}
