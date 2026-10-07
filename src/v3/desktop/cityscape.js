// Procedural Mumbai view for the cinematic room's window. No downloaded assets:
// a street canyon of lit-window towers in three depth bands (one merged mesh,
// one draw call), a sky dome with sun/moon/stars/clouds in one shader, a road
// with moving traffic lights, and scene fog for aerial perspective.
//
// Scale is real: the room's floor (y = 0) is the third floor, so the street sits
// about 9 m below; window pitch on the facades is 3 m x 3.2 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const GROUND_Y = -9;
const TILE = { cols: 4, rows: 4, pitchX: 3.0, pitchY: 3.2 };

const STATES = {
  day: {
    zenith: '#3f7ab8', horizon: '#c4d6e2', fog: '#bccfdc', fogDensity: 0.0042,
    sunColor: '#fff2d6', sunSize: 0.0016, sunGlow: 0.35, stars: 0, cloud: 0.55, cloudColor: '#ffffff',
    road: '#3a3d3f', facade: ['#9a8f84', '#a39a8e', '#8d8780', '#b0a498', '#85807b', '#9b9288'],
    glass: ['#7f9db3', '#6c8aa0', '#93aec0'], litChance: 0.0, dir: [0.30, 0.45, -0.80],
  },
  dusk: {
    zenith: '#242a52', horizon: '#e7894a', fog: '#b0624c', fogDensity: 0.0048,
    sunColor: '#ffb066', sunSize: 0.0022, sunGlow: 0.8, stars: 0.05, cloud: 0.5, cloudColor: '#ff9a6a',
    road: '#2c2c30', facade: ['#6b5a55', '#5f504d', '#74625b', '#58494a', '#6a5953'],
    glass: ['#d08d52', '#b66f3f', '#e2a766'], litChance: 0.4, dir: [0.50, 0.14, -0.85],
  },
  night: {
    zenith: '#050913', horizon: '#242c3c', fog: '#161d2a', fogDensity: 0.0052,
    sunColor: '#dfe8ff', sunSize: 0.0009, sunGlow: 0.22, stars: 1, cloud: 0.18, cloudColor: '#3a4660',
    road: '#16181b', facade: ['#2c3138', '#30343a', '#272b31', '#353a40', '#2a2f35'],
    glass: ['#10151b', '#0d1217', '#151b22'], litChance: 0.42, dir: [0.35, 0.50, -0.80],
  },
};

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// One facade tile (4 x 4 windows) per sky state; UVs on the boxes are in metres
// so the windows keep their real size on every building.
function facadeTexture(state) {
  const cfg = STATES[state], cell = 64, size = cell * TILE.cols;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), r = rng(88);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < TILE.rows; row++) for (let col = 0; col < TILE.cols; col++) {
    const x = col * cell, y = row * cell;
    // Slab edge and a darker recess make a window, a balcony rail or an AC box.
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(x, y + cell - 8, cell, 8);
    const kind = r();
    const lit = r() < cfg.litChance;
    ctx.fillStyle = lit ? ['#ffd9a0', '#ffc77a', '#f5e3bd', '#ffb860'][Math.floor(r() * 4)] : cfg.glass[Math.floor(r() * cfg.glass.length)];
    ctx.fillRect(x + 12, y + 10, cell - 24, cell - 28);
    if (kind > 0.8) { ctx.fillStyle = 'rgba(40,40,44,0.8)'; ctx.fillRect(x + 14, y + cell - 22, 20, 12); }   // AC unit
    else if (kind > 0.62) { ctx.fillStyle = 'rgba(30,30,34,0.55)'; ctx.fillRect(x + 6, y + cell - 18, cell - 12, 4); } // rail
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 12, y + 10, cell - 24, 3);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

function tower(random, x, z, w, d, h, palette, y0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y0 + h / 2, z);
  const uv = g.attributes.uv, nrm = g.attributes.normal;
  const ox = random(), oy = random();
  const tw = TILE.cols * TILE.pitchX, th = TILE.rows * TILE.pitchY;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
    if (ny > 0.5) { uv.setXY(i, 0.02, 0.02); continue; }                 // roof: a flat blank tile corner
    const u = uv.getX(i), v = uv.getY(i), span = nx > 0.5 ? d : w;
    uv.setXY(i, ox + u * span / tw, oy + v * h / th);
  }
  const color = new THREE.Color(palette[Math.floor(random() * palette.length)]);
  color.offsetHSL(0, 0, (random() - 0.5) * 0.06);
  const col = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) { col[3 * i] = color.r; col[3 * i + 1] = color.g; col[3 * i + 2] = color.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const parts = [g];
  if (random() > 0.45) {                                                  // rooftop plant room / water tank
    const rw = w * (0.25 + random() * 0.3), rd = d * 0.4, rh = 2 + random() * 2.5;
    const roof = new THREE.BoxGeometry(rw, rh, rd); roof.translate(x + (random() - 0.5) * w * 0.4, y0 + h + rh / 2, z);
    const ruv = roof.attributes.uv; for (let i = 0; i < ruv.count; i++) ruv.setXY(i, 0.02, 0.02);
    const rc = new Float32Array(roof.attributes.position.count * 3).fill(0.55);
    roof.setAttribute('color', new THREE.BufferAttribute(rc, 3)); parts.push(roof);
  }
  return parts;
}

const skyMaterial = () => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() },
    sunSize: { value: 0.001 }, sunGlow: { value: 0.3 }, stars: { value: 0 },
    cloud: { value: 0.5 }, cloudColor: { value: new THREE.Color() }, time: { value: 0 },
  },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    varying vec3 vDir; uniform vec3 zenith, horizon, sunDir, sunColor, cloudColor; uniform float sunSize, sunGlow, stars, cloud, time;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }
    void main(){
      vec3 d = normalize(vDir);
      float h = clamp(d.y, 0., 1.);
      vec3 col = mix(horizon, zenith, pow(h, .55));
      float sd = max(dot(d, normalize(sunDir)), 0.);
      col += sunColor * sunGlow * pow(sd, 24.) * .55;
      col += sunColor * smoothstep(1. - sunSize * 6., 1. - sunSize, sd) * 2.2;
      if (d.y > 0.02) {
        vec2 cp = d.xz / (d.y + .25) * 1.6 + vec2(time * .004, 0.);
        float c = smoothstep(.48, .78, fbm(cp)) * cloud * smoothstep(.02, .25, d.y);
        col = mix(col, cloudColor * (.55 + .45 * smoothstep(.0, .7, sd + .3)), c * .8);
        vec2 sp = floor(d.xz / (d.y + .1) * 90.);
        float st = step(.9965, hash(sp)) * stars * smoothstep(.12, .45, d.y) * (1. - c);
        col += vec3(.8,.85,1.) * st;
      }
      gl_FragColor = vec4(col, 1.);
    }`,
});

export function createCityscape({ sunDirs = {} } = {}) {
  const group = new THREE.Group(); group.name = 'Mumbai view';
  const random = rng(5150);
  const geoms = [];

  // Opposite side of the street: a continuous, irregular wall of 4-9 storey blocks.
  for (let x = -90; x < 120;) {
    const w = 9 + random() * 11, h = 14 + random() * 22;
    const z = -34 - random() * 6, d = 10 + random() * 4;
    // Keep the sight line from the window clear so it opens onto the skyline and sky.
    if (x + w > -14 && x < 20) { x = 20; continue; }
    geoms.push(...tower(random, x + w / 2, z, w, d, h + (0 - GROUND_Y), STATES.day.facade, GROUND_Y));
    x += w + 0.6 + random() * 1.5;
  }
  // Mid city: taller towers, wider gaps.
  for (let x = -260; x < 330;) {
    const w = 14 + random() * 18, h = 35 + random() * 80;
    geoms.push(...tower(random, x + w / 2, -62 - random() * 40, w, 16 + random() * 14, h, STATES.day.facade, GROUND_Y));
    x += w + 6 + random() * 28;
  }
  // Far skyline: big, hazed slabs.
  for (let x = -520; x < 620;) {
    const w = 20 + random() * 30, h = 60 + random() * 150;
    geoms.push(...tower(random, x + w / 2, -190 - random() * 90, w, 22 + random() * 20, h, STATES.day.facade, GROUND_Y));
    x += w + 8 + random() * 40;
  }
  const merged = mergeGeometries(geoms); geoms.forEach(g => g.dispose());
  const textures = { day: facadeTexture('day'), dusk: facadeTexture('dusk'), night: facadeTexture('night') };
  const facadeMat = new THREE.MeshBasicMaterial({ map: textures.night, vertexColors: true, toneMapped: false });
  const towers = new THREE.Mesh(merged, facadeMat); towers.name = 'Skyline'; group.add(towers);

  // Road, kerb strips and a footpath in front of the opposite blocks.
  const roadMat = new THREE.MeshBasicMaterial({ color: STATES.night.road, toneMapped: false });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(700, 400), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.set(0, GROUND_Y - 0.01, -150); group.add(road);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(700, 7), new THREE.MeshBasicMaterial({ color: '#222426', toneMapped: false }));
  lane.rotation.x = -Math.PI / 2; lane.position.set(0, GROUND_Y, -11.5); group.add(lane);

  // Sky dome. The sun/moon direction is the same ray the key lights use.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16), skyMaterial()); sky.name = 'Sky';
  group.add(sky);

  // Traffic: lights drifting along the street, each side its own direction/colour.
  const CARS = 18, carGeo = new THREE.PlaneGeometry(1.5, 0.45);
  const carMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, vertexColors: false });
  const cars = new THREE.InstancedMesh(carGeo, carMat, CARS);
  const carState = Array.from({ length: CARS }, (_, i) => ({ x: -70 + random() * 140, speed: (4 + random() * 7) * (i % 2 ? 1 : -1), lane: i % 2 ? -10.4 : -12.6 }));
  const m4 = new THREE.Matrix4(), tint = new THREE.Color();
  carState.forEach((c, i) => cars.setColorAt(i, tint.set(c.speed > 0 ? '#ff4a3a' : '#fff0c8')));
  cars.frustumCulled = false; group.add(cars);
  const updateCars = (t) => {
    carState.forEach((c, i) => {
      const x = ((c.x + c.speed * t + 80) % 160 + 160) % 160 - 80;
      m4.makeTranslation(x, GROUND_Y + 0.6, c.lane); cars.setMatrixAt(i, m4);
    });
    cars.instanceMatrix.needsUpdate = true;
  };
  updateCars(0);

  group.traverse(o => { o.castShadow = false; o.receiveShadow = false; o.raycast = () => {}; });
  group.position.set(0, 0, 0);

  let current = 'night';
  function apply(state) {
    const cfg = STATES[state]; if (!cfg) return;
    current = state;
    facadeMat.map = textures[state]; facadeMat.needsUpdate = true;
    // Facades read as hazed shapes by day, near-silhouettes at night.
    facadeMat.color.set(state === 'day' ? '#ffffff' : state === 'dusk' ? '#b09a96' : '#555c6c');
    roadMat.color.set(cfg.road);
    const u = sky.material.uniforms;
    u.zenith.value.set(cfg.zenith); u.horizon.value.set(cfg.horizon); u.sunColor.value.set(cfg.sunColor);
    u.sunSize.value = cfg.sunSize; u.sunGlow.value = cfg.sunGlow; u.stars.value = cfg.stars;
    u.cloud.value = cfg.cloud; u.cloudColor.value.set(cfg.cloudColor);
    u.sunDir.value.set(...(sunDirs[state] || cfg.dir)).normalize();
    carMat.color.set(state === 'day' ? '#2a2a2e' : '#ffffff');
    return cfg;
  }
  apply('night');

  return {
    group,
    apply,
    fogFor: (state) => ({ color: STATES[state]?.fog ?? STATES.night.fog, density: STATES[state]?.fogDensity ?? STATES.night.fogDensity }),
    update(t) { sky.material.uniforms.time.value = t; updateCars(t); },
    get state() { return current; },
    dispose() {
      merged.dispose(); facadeMat.dispose(); roadMat.dispose(); Object.values(textures).forEach(t => t.dispose());
      sky.geometry.dispose(); sky.material.dispose(); carGeo.dispose(); carMat.dispose(); cars.dispose();
    },
  };
}
