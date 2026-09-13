import * as THREE from 'three';
import { buildRoomInteractions } from './buildRoomInteractions.js';
import { buildSeatedFigure } from './buildSeatedFigure.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { identity, education, experience, achievements } from '../content/index.js';

// An authored architectural model. Coordinates here describe its geometry,
// not a capture; content anchors remain normalized in the content source.
export const WORKSPACE = {
  min: [-2.5, 0, -1.85], max: [2.5, 3.2, 2.1],
  target: [0, 1.1, -0.15],
  anchors: {
    monitor: [0, 1.79, -0.37],
    lamp: [-1.28,1.21,-0.38], coffee: [-0.89,1.242,0.46], award: [-1.36,1.99,-1.43],
    drawer: [1.10,0.99,0.62], blinds: [2.16,1.75,-1.48], headphones: [0.67,1.24,-0.05], keyboard: [-0.12,1.249,0.29],
    notebook: [1.14, 1.21, 0.30],
    window: [1.4, 2.12, -1.75],
    phone: [-0.80, 1.196, -0.03],
  },
  seat: { position: [0.05, 1.72, 1.16], target: [0, 1.42, -0.37] },
  chair: [0.05, 1.08, 1.414],
  screen: { center: [0, 1.79, -0.362], width: 1.28, height: 0.79 },
};

function canvasTexture(draw, width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function woodTexture() {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#a88661'; ctx.fillRect(0, 0, w, h);
    let seed = 47;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 520; i++) {
      const y = random() * h;
      ctx.strokeStyle = `rgba(${random() > 0.5 ? '61,39,22' : '229,203,160'},${0.035 + random() * 0.12})`;
      ctx.lineWidth = 0.4 + random() * 1.6;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + random() * 12, w * 0.6, y - random() * 12, w, y + random() * 4);
      ctx.stroke();
    }
  });
}

function screenTexture() {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#667e91'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#354757'; ctx.fillRect(0, 0, w, 42);
    ctx.font = '20px monospace'; ctx.fillStyle = '#ddd9d0';
    ctx.fillText('dhruvOS', 26, 28); ctx.fillStyle = '#8e918e'; ctx.fillText('WORKSPACE 01', w - 210, 28);
    ctx.strokeStyle = '#464845'; ctx.lineWidth = 1;
    ctx.strokeRect(72, 102, 880, 420);
    ctx.fillStyle = '#222426'; ctx.fillRect(73, 103, 878, 44);
    ctx.fillStyle = '#e8e4dc'; ctx.font = '18px monospace'; ctx.fillText('Selected work', 96, 131);
    ctx.fillStyle = '#ff5f1f'; ctx.fillRect(95, 186, 9, 9);
    ctx.fillStyle = '#ece7db'; ctx.font = '48px sans-serif'; ctx.fillText('Things I made.', 95, 256);
    ctx.fillStyle = '#969991'; ctx.font = '20px monospace'; ctx.fillText('Open the machine. Try something.', 97, 302);
    const labels = ['01   dhruvOS', '02   Experiments', '03   Selected projects'];
    labels.forEach((label, i) => {
      const y = 366 + i * 53;
      ctx.strokeStyle = '#363a38'; ctx.beginPath(); ctx.moveTo(96, y - 22); ctx.lineTo(924, y - 22); ctx.stroke();
      ctx.fillStyle = '#cccfc5'; ctx.font = '22px monospace'; ctx.fillText(label, 99, y + 8);
      ctx.fillStyle = '#ff5f1f'; ctx.fillText('↗', 887, y + 8);
    });
    ctx.fillStyle = '#666e68'; ctx.font = '16px monospace'; ctx.fillText('DHRUV KOTHARI                                    ENTER ↗', 75, 591);
  }, 1024, 640);
}

// Replace this function's returned texture with the supplied FocusLock capture.
// Portrait 9:20, 540 x 1200 pixels; UVs run top-to-bottom with no crop.
export function phoneFocusLockTexture() {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#33444d'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#aebcc2'; ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, w - 72, h - 72);
    ctx.textAlign = 'center'; ctx.fillStyle = '#e4eaec';
    ctx.font = 'bold 46px sans-serif'; ctx.fillText('FocusLock', w / 2, 420);
    ctx.font = '25px monospace'; ctx.fillText('SCREEN PLACEHOLDER', w / 2, 510);
    ctx.font = '22px monospace'; ctx.fillText('Actual capture pending', w / 2, 560);
    ctx.fillText('540 x 1200', w / 2, 940);
  }, 540, 1200);
}

// Texture UV origin is bottom-left. Drawing, hover and click tests share this.
export const INSTAGRAM_ICON_UV_RECT = Object.freeze({
  uMin: 205 / 540, uMax: 335 / 540,
  vMin: 1 - 610 / 1200, vMax: 1 - 480 / 1200,
});
// One app icon, drawn rather than loaded so the phone needs no external asset.
// The joke only works if the icon is recognisable, so this is the real mark.
export function phoneHomeTexture(highlighted = false) {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#15171a'; ctx.fillRect(0, 0, w, h);

    const r = INSTAGRAM_ICON_UV_RECT;
    const x = r.uMin * w, y = (1 - r.vMax) * h;
    const size = (r.uMax - r.uMin) * w;
    const radius = size * 0.24;

    if (highlighted) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 34;
    }

    // Rounded-square tile with the familiar warm corner-to-corner gradient.
    const tile = ctx.createLinearGradient(x, y + size, x + size, y);
    tile.addColorStop(0, '#FFD521');
    tile.addColorStop(0.35, '#F50000');
    tile.addColorStop(0.7, '#B900B4');
    tile.addColorStop(1, '#4C68D7');
    ctx.beginPath(); ctx.roundRect(x, y, size, size, radius);
    ctx.fillStyle = tile; ctx.fill();
    if (highlighted) ctx.restore();

    // Camera glyph: rounded outline, lens, and the small top-right dot.
    const stroke = size * 0.075;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = stroke;
    const inset = size * 0.21;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.72, y + size * 0.28, stroke * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    ctx.textAlign = 'center'; ctx.fillStyle = '#e9e9ea';
    ctx.font = '26px -apple-system, Segoe UI, sans-serif';
    ctx.fillText('Instagram', w / 2, y + size + 44);
  }, 540, 1200);
}

// An authored impression, not a claimed photographic view or named landmark.
// Stable seeded windows avoid texture regeneration or any animation clock.
function skylineTexture(foreground = false) {
  return canvasTexture((ctx, w, h) => {
    let seed = foreground ? 819 : 47;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    if (!foreground) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#18232f'); sky.addColorStop(0.6, '#4d4742'); sky.addColorStop(1, '#625044');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    }
    let x = -30;
    while (x < w) {
      const width = 28 + random() * (foreground ? 85 : 44);
      const tower = !foreground && random() > 0.72;
      const height = foreground ? 100 + random() * 190 : tower ? 420 + random() * 260 : 180 + random() * 210;
      const roof = h - height;
      ctx.fillStyle = foreground ? '#202323' : tower ? '#353634' : '#3a3632';
      ctx.fillRect(x, roof, width, height);
      // Roof terraces, water tanks, service cores: irregular low-rise massing.
      ctx.fillRect(x + width * 0.15, roof - 7, width * 0.7, 7);
      if (random() > 0.4) ctx.fillRect(x + 9, roof - 20, width * 0.25, 20);
      if (tower) {
        ctx.fillStyle = '#44413a';
        for (let y = roof + 12; y < h; y += 27) ctx.fillRect(x + 1, y, width - 2, 2);
      }
      for (let y = roof + 16; y < h - 12; y += foreground ? 25 : 22) {
        for (let wx = x + 7; wx < x + width - 7; wx += 13) {
          if (random() > 0.48) continue;
          ctx.fillStyle = ['#b68b52', '#d3a66a', '#8e775a', '#e0b57b'][Math.floor(random() * 4)];
          ctx.fillRect(wx, y, 4 + random() * 3, 7);
        }
      }
      x += width + 3 + random() * 10;
    }
  }, 768, 1024);
}

// Authored rigid parts, not a skeleton. Finger gaps remain visible at rest;
// forearms join the wrists and long sleeves continue behind the seated eye.
function seatedHands() {
  const root = new THREE.Group(); root.name = 'Seated hands and forearms'; root.visible = false;
  const skin = new THREE.MeshStandardMaterial({ color: '#b9896e', roughness: 0.82 });
  const cloth = new THREE.MeshStandardMaterial({ color: '#3c4949', roughness: 1 });

  function mesh(geometry, material, parent, position = [0, 0, 0]) {
    const m = new THREE.Mesh(geometry, material); m.position.set(...position);
    m.castShadow = false; m.receiveShadow = true; m.raycast = () => {}; parent.add(m); return m;
  }
  function rod(parent, a, b, radius, tip, material) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const m = mesh(new THREE.CylinderGeometry(tip, radius, av.distanceTo(bv), 10), material, parent, av.clone().add(bv).multiplyScalar(0.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.sub(av).normalize()); return m;
  }
  // Continuous skin surfaces: smoothly varying cross sections, no joint collars.
  function skinSweep(points, radii, segments = 32, sides = 20, flatten = 1) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const frames = curve.computeFrenetFrames(segments, false);
    const vertices = [], indices = [], uv = [];
    for (let j = 0; j <= segments; j++) {
      const t = j / segments, q = curve.getPointAt(t), f = t * (radii.length - 1);
      const k = Math.min(radii.length - 2, Math.floor(f));
      const u = f - k;
      const blend = k === radii.length - 2 ? 1 - Math.sqrt(Math.max(0,1-u*u)) : u*u*(3-2*u);
      const radius = THREE.MathUtils.lerp(radii[k], radii[k + 1], blend);
      for (let i = 0; i <= sides; i++) {
        const angle = i / sides * Math.PI * 2;
        const v = q.clone().addScaledVector(frames.normals[j], Math.cos(angle) * radius)
          .addScaledVector(frames.binormals[j], Math.sin(angle) * radius * flatten);
        vertices.push(v.x,v.y,v.z); uv.push(i / sides,t);
        if(j < segments && i < sides) { const a=j*(sides+1)+i,b=a+sides+1; indices.push(a,a+1,b,b,a+1,b+1); }
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function palmGeometry() {
    const profile = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.025,0.018,0.105),new THREE.Vector3(0.033,0.022,0.067),
      new THREE.Vector3(0.047,0.024,0.022),new THREE.Vector3(0.051,0.019,-0.02),
      new THREE.Vector3(0.046,0.013,-0.049),new THREE.Vector3(0.032,0.008,-0.064),
      new THREE.Vector3(0.001,0.001,-0.070)]);
    const vertices=[],uv=[],indices=[],rings=48,sides=32;
    for(let j=0;j<=rings;j++) {
      const p=profile.getPoint(j/rings);
      for(let i=0;i<=sides;i++) {
        const a=i/sides*Math.PI*2;vertices.push(Math.cos(a)*p.x,Math.sin(a)*p.y,p.z);uv.push(i/sides,j/rings);
        if(j<rings&&i<sides){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const hands = [];
  for (const side of [-1, 1]) {
    const hand = new THREE.Group(); root.add(hand);
    hand.position.set(side * 0.27, 1.28, 0.405);
    mesh(palmGeometry(), skin, hand);

    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Group();
      const order = side === 1 ? i : 3 - i;
      finger.position.set(-0.036 + i * 0.024, 0, -[0.044, 0.057, 0.049, 0.026][order]); hand.add(finger);
      const length = [0.079, 0.091, 0.081, 0.057][order];
      finger.userData.tip = new THREE.Vector3(0, -0.028, -length).add(finger.position);
      const relaxed = skinSweep([[0,0,0.012],[0,0.004,-length*0.25],[0,0.009,-length*0.48],
        [0,-0.002,-length*0.76],[0,-0.018,-length*0.96],[0,-0.028,-length]],
        [0.0125,0.0118,0.0115,0.0098,0.008,0.001]);
      const curled = skinSweep([[0,0,0.012],[0,0.008,-0.025],[0,-0.012,-0.039],
        [0,-0.035,-0.018],[0,-0.026,0.010]], [0.0125,0.012,0.011,0.009,0.001]);
      finger.userData.relaxed = relaxed; finger.userData.curled = curled;
      mesh(relaxed.clone(), skin, finger);
      fingers.push(finger);
    }
    const thumb = new THREE.Group(); hand.add(thumb);
    mesh(skinSweep([[-side*0.028,-0.004,0.042],[-side*0.051,-0.004,0.013],
      [-side*0.070,-0.010,-0.006],[-side*0.087,-0.018,-0.03]], [0.024,0.019,0.013,0.001]),skin,thumb);
    // Separate sleeve/forearm rods follow the authored wrist, without IK.
    const sleeve = mesh(new THREE.CylinderGeometry(0.054, 0.082, 1, 24), cloth, root);
    const arm = mesh(new THREE.CylinderGeometry(0.028, 0.048, 1, 32), skin, root);
    const wrist = new THREE.Vector3(), elbow = new THREE.Vector3(side * 0.40, 1.13, 1.10);
    const shoulder = new THREE.Vector3(0.05 + side * 0.225, 1.40, 1.23);
    const fit = (m, a, b) => {
      m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = a.distanceTo(b);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
    };
    hands.push({ hand, fingers, thumb, arm, sleeve, index: side === 1 ? 0 : 3, update() {
      wrist.set(0, 0, 0.095).applyEuler(hand.rotation).add(hand.position);
      const direction = wrist.clone().sub(shoulder), distance = direction.length(); direction.normalize();
      const pole = new THREE.Vector3(side * 0.25,-1,0.1);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
      elbow.copy(shoulder).addScaledVector(direction,distance*0.5).addScaledVector(pole,Math.sqrt(Math.max(0,0.40**2-(distance*0.5)**2)));
      fit(arm, elbow, wrist); fit(sleeve, shoulder, elbow);
    }});
  }
  function update() { hands.forEach(h => h.update()); }
  function reset() {
    hands.forEach((h, i) => { h.hand.position.set(i ? 0.27 : -0.27, 1.28, 0.405); h.hand.rotation.set(0, 0, 0); h.thumb.position.set(0,0,0); h.thumb.scale.set(1,1,1); h.fingers.forEach(f => { f.rotation.set(0,0,0); f.position.y = 0; }); h.hand.visible = h.arm.visible = h.sleeve.visible = true; }); update();
  }
  const mergedMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
  for (const h of hands) for (const group of [h.hand, ...h.fingers, h.thumb]) {
    const parts = group.children.filter(o => o.isMesh), geometries = [];
    for (const part of parts) {
      part.updateMatrix();
      const g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone(); g.applyMatrix4(part.matrix);
      const color = part.material.color, values = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < values.length; i += 3) { values[i] = color.r; values[i+1] = color.g; values[i+2] = color.b; }
      g.setAttribute('color', new THREE.BufferAttribute(values, 3)); geometries.push(g);
      part.geometry.dispose(); group.remove(part);
    }
    mesh(mergeGeometries(geometries, false), mergedMaterial, group); geometries.forEach(g => g.dispose());
  }
  function grip(h, pointing = false) {
    h.fingers.forEach((f,i) => {
      const geometry = pointing && i === h.index ? f.userData.relaxed : f.userData.curled;
      const m = f.children[0]; m.geometry.dispose(); m.geometry = geometry.clone();
      const c = skin.color, colors = new Float32Array(m.geometry.attributes.position.count * 3);
      for(let n=0;n<colors.length;n+=3){ colors[n]=c.r;colors[n+1]=c.g;colors[n+2]=c.b; }
      m.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3)); f.rotation.set(0,0,0);
    });
  }
  const resetPose = reset;
  function rest() { resetPose(); hands.forEach(h => {
    h.fingers.forEach(f => {
      const m=f.children[0];m.geometry.dispose();m.geometry=f.userData.relaxed.clone();
      const c=skin.color, colors=new Float32Array(m.geometry.attributes.position.count*3);
      for(let n=0;n<colors.length;n+=3){colors[n]=c.r;colors[n+1]=c.g;colors[n+2]=c.b;}
      m.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    });
  }); }

  reset();
  return { root, left: hands[0], right: hands[1], update, reset: rest, grip };
}

export function buildWorkspace(scene) {
  const root = new THREE.Group(); root.name = 'Dhruv workspace'; scene.add(root);
  const interactive = [];
  const materials = {};
  const mat = (name, color, options = {}) => materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...options });
  const plaster = mat('plaster', '#b9b5a9');
  const floor = mat('floor', '#969386');
  const dark = mat('graphite', '#24282a', { roughness: 0.38, metalness: 0.42 });
  const black = mat('rubber', '#131718', { roughness: 0.95, metalness: 0 });
  const steel = mat('steel', '#8b8f89', { metalness: 0.92, roughness: 0.18 });
  const bone = mat('bone', '#e4dfce', { roughness: 0.82 });
  const paper = mat('paper', '#e4dfcc', { roughness: 0.98 });
  const orange = mat('orange', '#df5b29', { roughness: 0.5 });
  const wood = mat('oak', '#ffffff', { map: woodTexture(), roughness: 0.52, metalness: 0.02 });

  function tag(mesh, id) {
    if (id && id !== 'desk') { mesh.userData.anchorId = id; interactive.push(mesh); }
    return mesh;
  }
  function box(name, size, position, material, radius = 0, id) {
    const geometry = radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return tag(mesh, id);
  }
  function cylinder(name, radius, height, position, material, top = radius) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, 24), material);
    mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  function rod(name, from, to, radius, material) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mesh = cylinder(name, radius, a.distanceTo(b), a.clone().add(b).multiplyScalar(0.5).toArray(), material);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()); return mesh;
  }
  function cable(points, radius = 0.009) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, radius, 5, false), black); root.add(mesh); return mesh;
  }

  // An open corner: the cutaway is intentional, like an architectural model.
  box('Foundation', [5.1, 0.18, 4.0], [0, -0.1, 0.1], dark, 0.035);
  box('Concrete floor', [5, 0.08, 3.9], [0, 0.025, 0.1], floor, 0.01);
  for (let x = -2; x <= 2; x += 1) box('Floor joint', [0.008, 0.003, 3.86], [x, 0.067, 0.1], mat('joint', '#7f7c71'));
  // Solid left portion and an inset luminous window on the right.
  // The wall behind the window panel is solid geometry (no real cutout), so it
  // would fully block a light placed outside to simulate daylight. Since the
  // window and its frame are a glued-on inset rather than an actual hole, they
  // (and the wall) are excluded from shadow casting here — only the blind
  // slats occlude, which is what actually produces the banding cue.
  const backWall = box('Back wall', [5, 3.12, 0.13], [0, 1.58, -1.8], plaster);
  backWall.castShadow = false;
  const architecture = new THREE.Group(); root.add(architecture);
  function wall(name,size,position,angle=0) {
    const material=plaster.clone();const mesh=box(name,size,position,material);mesh.rotation.y=angle;
    architecture.add(mesh);
    mesh.onBeforeRender=(_r,_s,camera)=>{const outside=camera.position.z>2.15||Math.abs(camera.position.x)>2.5;material.colorWrite=!outside;material.depthWrite=!outside;};
    return mesh;
  }
  wall('Left wall',[0.13,3.12,3.88],[-2.43,1.58,0.1]);
  wall('Right wall behind opening',[0.13,3.12,1.85],[2.43,1.58,-0.93]);
  wall('Right wall front pier',[0.13,3.12,0.62],[2.43,1.58,1.72]);
  wall('Doorway lintel',[0.13,0.57,1.06],[2.43,2.86,0.89]);
  wall('Passage end',[0.10,2.50,1.08],[3.12,1.28,0.89]);
  wall('Passage return',[0.75,2.50,0.10],[2.77,1.28,0.32]);
  wall('Clipped rear corner',[0.13,3.12,0.90],[-2.14,1.58,-1.49],-Math.PI/4);
  box('Passage foundation',[0.82,0.18,1.10],[2.80,-0.10,0.88],dark);
  box('Passage threshold',[0.82,0.04,1.10],[2.80,0.09,0.88],floor);

  const roofLeft=box('Folded ceiling left',[2.55,0.08,3.9],[-1.25,3.21,0.1],plaster);roofLeft.rotation.z=0.04;
  const roofRight=box('Folded ceiling right',[2.55,0.08,3.9],[1.25,3.21,0.1],plaster);roofRight.rotation.z=-0.04;
  box('Ceiling beam',[0.14,0.18,3.9],[-0.65,3.16,0.1],wood);
  box('Back skirting', [4.95, 0.065, 0.045], [0, 0.12, -1.708], dark);
  box('Left skirting', [0.045, 0.065, 1.52], [-2.34, 0.12, -1.06], dark);
  const windowRecess = box('Window recess', [1.53, 2.03, 0.065], [1.39, 1.99, -1.697], dark, 0.025, 'window');
  windowRecess.castShadow = false;
  const city = new THREE.Group(); city.name = 'Mumbai night view';
  const cityMaps = [skylineTexture(), skylineTexture(true)];
  cityMaps.forEach((map, index) => {
    map.repeat.set(0.78, 0.88); map.offset.set(0.11, 0.06);
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(1.41, 1.91), new THREE.MeshBasicMaterial({
      map, transparent: index === 1, alphaTest: index === 1 ? 0.01 : 0,
      toneMapped: false, fog: false,
    }));
    layer.position.set(1.39, 1.99, -1.65 + index * 0.005);
    // Camera-driven UV parallax through the existing aperture avoids a large
    // exterior plane leaking around the cutaway wall. No new frame requests.
    layer.onBeforeRender = (_renderer, _scene, camera) => {
      const depth = Math.max(0.5, camera.position.z + 1.65);
      const amount = index ? 0.065 : 0.025;
      map.offset.x = 0.11 + THREE.MathUtils.clamp((camera.position.x - 1.39) / depth * amount, -0.1, 0.1);
      map.offset.y = 0.06 + THREE.MathUtils.clamp((camera.position.y - 1.99) / depth * amount, -0.05, 0.05);
    };
    tag(layer, 'window'); city.add(layer);
  });
  root.add(city);
  const mullion = box('Window mullion', [0.034, 1.92, 0.04], [1.39, 1.99, -1.62], bone);
  mullion.castShadow = false;
  const blindsGroup=new THREE.Group();root.add(blindsGroup);
  for (let i = 0; i < 11; i++) {
    const slat = box('Venetian blind', [1.47, 0.022, 0.08], [1.39, 2.88 - i * 0.145, -1.56], bone, 0, 'window');
    slat.rotation.x = -0.22;slat.castShadow=true;blindsGroup.add(slat);
  }
  box('Window sill', [1.7, 0.065, 0.32], [1.39, 0.99, -1.54], bone, 0.012);

  // Desk: solid oak, a thin edge, and a black steel trestle.
  box('Oak desktop', [3.52, 0.12, 1.45], [0, 1.105, -0.04], wood, 0.028, 'desk');
  box('Desk edge inlay', [3.42, 0.012, 0.012], [0, 1.071, 0.687], dark);
  for (const x of [-1.46, 1.46]) {
    for (const z of [-0.54, 0.49]) box('Steel desk leg', [0.052, 1.0, 0.052], [x, 0.565, z], dark, 0.008);
    box('Desk foot rail', [0.055, 0.055, 1.12], [x, 0.19, -0.025], dark, 0.008);
  }
  box('Rear stretcher', [2.94, 0.07, 0.045], [0, 0.84, -0.54], dark);
  box('Felt desk mat', [1.62, 0.014, 0.6], [-0.05, 1.174, 0.25], mat('felt', '#454744'), 0.025, 'desk');

  // Real screen geometry gives the entrance a destination and a known plane.
  box('Monitor foot', [0.5, 0.035, 0.29], [0, 1.18, -0.35], steel, 0.02, 'monitor');
  box('Monitor stand', [0.08, 0.31, 0.06], [0, 1.34, -0.43], steel, 0.014, 'monitor');
  box('Monitor enclosure', [1.4, 0.93, 0.085], [0, 1.79, -0.418], dark, 0.04, 'monitor');
  const displayMaterial = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(WORKSPACE.screen.width, WORKSPACE.screen.height), displayMaterial);
  display.name = 'Interactive monitor screen'; display.position.set(...WORKSPACE.screen.center); root.add(display); tag(display, 'monitor');
  box('Monitor chin', [1.29, 0.035, 0.018], [0, 1.35, -0.362], dark, 0.006, 'monitor');
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5f1f' }));
  led.position.set(0.58, 1.35, -0.345); root.add(led);
  cable([[0, 1.55, -0.47], [0.12, 1.17, -0.5], [0.7, 1.17, -0.67], [1.3, 0.75, -0.7]]);

  // A compact mechanical keyboard: instanced keycaps, an orange escape key.
  box('Keyboard case', [1.04, 0.055, 0.36], [-0.12, 1.211, 0.29], bone, 0.026, 'desk');
  const keyGeometry = new RoundedBoxGeometry(0.061, 0.027, 0.055, 1, 0.006);
  const keys = new THREE.InstancedMesh(keyGeometry, mat('keycaps', '#d3d0c3'), 60);
  const transform = new THREE.Object3D();
  for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) {
    transform.position.set(-0.562 + col * 0.077, 1.249, 0.163 + row * 0.059);
    transform.updateMatrix(); keys.setMatrixAt(row * 12 + col, transform.matrix);
  }
  keys.castShadow = false; root.add(keys); tag(keys, 'keyboard');
  box('Escape key', [0.063, 0.031, 0.057], [-0.562, 1.251, 0.163], orange, 0.006);
  box('Spacebar', [0.35, 0.032, 0.055], [-0.13, 1.252, 0.4], bone, 0.006);
  box('Mouse', [0.13, 0.057, 0.21], [0.63, 1.22, 0.32], bone, 0.04, 'desk');
  box('Mouse wheel', [0.014, 0.011, 0.032], [0.63, 1.252, 0.279], dark, 0.004);

  // Keep the complete phone out of static batching and out of baked shadows.
  const phone = new THREE.Group(); phone.name = 'Animated phone';
  phone.position.set(...WORKSPACE.anchors.phone); root.add(phone);
  const phoneBody = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.023, 0.33, 2, 0.012), dark);
  phoneBody.position.y = -0.016; phone.add(phoneBody); tag(phoneBody, 'phone');
  const phoneTextures = { home: phoneHomeTexture(), hover: phoneHomeTexture(true), focuslock: phoneFocusLockTexture() };
  const phoneMaterial = new THREE.MeshBasicMaterial({ map: phoneTextures.home, toneMapped: false });
  const phoneDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.30), phoneMaterial);
  phoneDisplay.rotation.x = -Math.PI / 2; phone.add(phoneDisplay); tag(phoneDisplay, 'phone');
  const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.002, 0.003), black);
  earpiece.position.set(0, 0.001, -0.157); phone.add(earpiece); tag(earpiece, 'phone');
  const phoneGlow = new THREE.PointLight('#d4d5d8', 0.07, 0.38, 2);
  phoneGlow.position.set(-0.80, 1.24, -0.03); root.add(phoneGlow);

  // Open notebook: a real document object, pencil and authored page markings.
  const book = box('Notebook cover', [0.46, 0.024, 0.57], [1.14, 1.18, 0.3], mat('cover', '#3e4942'), 0.007, 'notebook');
  book.rotation.y = -0.04;
  const pages = box('Notebook pages', [0.44, 0.016, 0.55], [1.14, 1.199, 0.3], paper, 0.003, 'notebook'); pages.rotation.y = -0.04;
  // The notebook is read by zooming in on it, not by opening a side panel, so
  // this page has to carry real legible text. Facts come from the content
  // source; nothing here is authored twice.
  // Read by zooming, so legibility beats atmosphere: dark ink, generous type,
  // and a layout that uses the whole page rather than crowding the top edge —
  // the top is the most foreshortened part of the page from the reading angle.
  const notes = canvasTexture((ctx, w, h) => {
    const M = 130;                 // left margin
    const R = w - 110;             // right edge of the ruled area
    ctx.fillStyle = '#efeade'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(110,116,104,0.20)'; ctx.lineWidth = 1.5;
    for (let y = 250; y < h - 60; y += 74) {
      ctx.beginPath(); ctx.moveTo(M - 34, y); ctx.lineTo(R, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(198,83,43,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(M - 34, 60); ctx.lineTo(M - 34, h - 60); ctx.stroke();

    const line = (text, y, size, colour, font = 'monospace', weight = '') => {
      ctx.font = `${weight} ${size}px ${font}`.trim();
      ctx.fillStyle = colour; ctx.fillText(text, M, y);
    };
    const INK = '#22261f', SOFT = '#4d5349', FAINT = '#8b9182';

    line(identity.name, 168, 76, INK, 'Georgia, serif', 'bold');
    line(`${education.degree} · ${education.year}`, 224, 34, SOFT);

    let y = 336;
    line('NOW', y, 28, FAINT); y += 66;
    const current = experience[0];
    line(`${current.role}`, y, 40, INK); y += 56;
    line(current.org, y, 34, SOFT); y += 88;

    line('BEFORE', y, 28, FAINT); y += 66;
    experience.slice(1).forEach((job) => {
      line(`${job.role} — ${job.org}`, y, 33, INK); y += 62;
    });
    y += 34;

    line('RESULTS', y, 28, FAINT); y += 66;
    achievements.forEach((item) => {
      const [event] = item.label.split(' — ');
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = item.result === 'Winner' ? '#c6532b' : SOFT;
      ctx.fillText(item.result.toUpperCase(), M, y); y += 44;
      // Wrap: the longest of these names is far wider than the page.
      ctx.font = '31px monospace'; ctx.fillStyle = INK;
      let row = '';
      for (const word of event.split(' ')) {
        const next = row ? `${row} ${word}` : word;
        if (ctx.measureText(next).width > R - M - 20) {
          ctx.fillText(row, M, y); y += 40; row = word;
        } else { row = next; }
      }
      if (row) { ctx.fillText(row, M, y); y += 40; }
      y += 22;
    });

    // The lower half of the page was empty. The statement is real copy and it
    // is the one first-person line in the whole room.
    y += 50;
    line('—', y, 30, FAINT); y += 62;
    ctx.font = 'italic 34px Georgia, serif'; ctx.fillStyle = SOFT;
    let row = '';
    for (const word of identity.statement.split(' ')) {
      const next = row ? `${row} ${word}` : word;
      if (ctx.measureText(next).width > R - M - 20) {
        ctx.fillText(row, M, y); y += 48; row = word;
      } else { row = next; }
    }
    if (row) ctx.fillText(row, M, y);
  }, 1400, 1800);
  const notePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.514), new THREE.MeshStandardMaterial(
    { map: notes, roughness: 0.98, emissive: '#ffffff', emissiveMap: notes, emissiveIntensity: 0.34 }));
  notePlane.rotation.set(-Math.PI / 2, 0, -0.04); notePlane.position.set(1.14, 1.209, 0.3); root.add(notePlane); tag(notePlane, 'notebook');
  // Movable assembly stays outside static batching and the baked shadow map.
  const notebook = new THREE.Group(); notebook.position.set(...WORKSPACE.anchors.notebook); root.add(notebook);
  for (const part of [book, pages, notePlane]) {
    part.position.sub(notebook.position); part.castShadow = false; notebook.add(part);
  }
  rod('Graphite pencil', [1.47, 1.218, 0.06], [1.54, 1.218, 0.43], 0.009, dark);

  // Task light, books and a ceramic cup give the room a human scale.
  cylinder('Lamp base', 0.13, 0.035, [-1.28, 1.185, -0.48], dark);
  rod('Lamp lower arm', [-1.28, 1.2, -0.48], [-1.39, 1.69, -0.43], 0.017, dark);
  rod('Lamp upper arm', [-1.39, 1.69, -0.43], [-1.05, 1.95, -0.4], 0.017, dark);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.15, 32, 1, true), dark);
  shade.position.set(-1.03, 1.89, -0.4); shade.rotation.z = -0.3; root.add(shade);
  const bulb = new THREE.PointLight('#ffe4b1', 0.75, 2.2, 2); bulb.position.set(-1.02, 1.82, -0.39); root.add(bulb);
  for (let i = 0; i < 3; i++) box('Book stack', [0.48 - i * 0.025, 0.052, 0.34], [-1.25, 1.197 + i * 0.055, 0.15], [bone, dark, mat('bookTaupe', '#858070')][i], 0.008, 'desk');
  /* mug is authored by buildRoomInteractions */


  // Small speaker pair and vented workstation beneath the desk.
  for (const x of [-0.96, 0.95]) {
    box('Nearfield speaker', [0.18, 0.28, 0.16], [x, 1.305, -0.45], dark, 0.02);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(0.059, 24), black); cone.position.set(x, 1.3, -0.362); root.add(cone);
  }
  box('Workstation tower', [0.35, 0.64, 0.64], [1.0, 0.405, -0.38], dark, 0.025);
  for (let i = 0; i < 12; i++) box('Tower vent', [0.24, 0.009, 0.009], [1.0, 0.27 + i * 0.027, -0.054], black);

  // Chair with timber seat, perforated back and tubular steel frame.
  box('Chair seat', [0.6, 0.07, 0.55], [0.05, 0.63, 1.2], wood, 0.055, 'chair');
  for (const x of [-0.19, 0.29]) {
    rod('Chair front leg', [x, 0.12, 0.98], [x, 0.62, 1.0], 0.019, dark);
    rod('Chair rear leg', [x, 0.12, 1.48], [x, 1.2, 1.4], 0.019, dark);
  }
  box('Chair back', [0.57, 0.29, 0.045], [0.05, 1.08, 1.414], wood, 0.04, 'chair');
  for (let i = 0; i < 7; i++) box('Chair back slot', [0.025, 0.18, 0.005], [-0.145 + i * 0.064, 1.08, 1.441], dark, 0.009);

  // Pinboard, shelf and a quiet typographic print instead of decorative neon.
  box('Pinboard frame', [1.35, 0.9, 0.05], [-1.45, 2.35, -1.695], wood, 0.014);
  box('Pinboard felt', [1.28, 0.83, 0.015], [-1.45, 2.35, -1.66], mat('board', '#555a50'));
  const print = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#e3decb'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#262b29'; ctx.font = 'bold 96px sans-serif'; ctx.fillText('MAKE', 40, 138); ctx.fillText('IT REAL.', 40, 247);
    ctx.fillStyle = '#c9572e'; ctx.fillRect(42, 304, 180, 12);
    ctx.font = '22px monospace'; ctx.fillStyle = '#555a50'; ctx.fillText('NOTES FROM THE WORKSPACE', 42, 418);
  }, 640, 480);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.79, 0.59), new THREE.MeshStandardMaterial({ map: print, roughness: 0.95 }));
  poster.position.set(-1.56, 2.37, -1.645); poster.rotation.z = -0.035; root.add(poster);
  box('Pinned note', [0.24, 0.27, 0.004], [-0.97, 2.51, -1.64], paper);
  box('Wall shelf', [1.28, 0.055, 0.25], [-1.44, 1.74, -1.56], wood, 0.008);
  for (let i = 0; i < 6; i++) box('Shelf book', [0.056, 0.22 + (i % 3) * 0.026, 0.15], [-1.85 + i * 0.069, 1.89, -1.57], [bone, dark, mat('sage', '#828977')][i % 3], 0.002);
  cylinder('Plant pot', 0.105, 0.18, [-0.99, 1.855, -1.52], mat('pot', '#aaa18d'), 0.125);
  const leafMat = mat('leaf', '#405549');
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4;
    const tip = [-0.99 + Math.cos(angle) * 0.17, 2.08 + (i % 3) * 0.08, -1.52 + Math.sin(angle) * 0.1];
    rod('Plant stem', [-0.99, 1.93, -1.52], tip, 0.004, leafMat);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), leafMat);
    leaf.position.set(...tip); leaf.scale.set(0.055, 0.11, 0.016); leaf.rotation.set(0.2, angle, angle * 0.4); root.add(leaf);
  }

  // A faint cool rim is the only shadow-casting source. Depth is baked once.
  scene.add(new THREE.HemisphereLight('#8294b2', '#21160e', 0.42));
  const moon = new THREE.DirectionalLight('#8eadd8', 1.15);
  moon.position.set(2.1, 3.6, -2.7); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -2.6, right: 2.6, top: 3, bottom: -1.6, near: 0.3, far: 9 });
  moon.shadow.bias = -0.00018;
  moon.target.position.set(-0.8, 1.6, -0.7); scene.add(moon, moon.target);
  // Both endpoint maps are baked by the single initial shadow-map update.
  // Each blind's depth-only shader supplies the alternate pose for the open map.
  const moonOpen=moon.clone();moonOpen.intensity=0;moonOpen.position.copy(moon.position);moonOpen.target=moon.target;
  moonOpen.shadow=moon.shadow.clone();moonOpen.shadow.camera.userData.blindsOpen=true;scene.add(moonOpen);
  blindsGroup.children.forEach((slat,i)=>{
    const pose={value:0};const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
    depth.onBeforeCompile=shader=>{shader.uniforms.openPose=pose;shader.uniforms.rowOffset={value:i*0.121};shader.vertexShader='uniform float openPose; uniform float rowOffset;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float a=-1.20*openPose;float c=cos(a),s=sin(a);
        transformed.yz=mat2(c,s,-s,c)*position.yz;
        transformed.y += openPose*rowOffset*0.975897;
        transformed.z += openPose*rowOffset*0.218230;`);};
    slat.customDepthMaterial=depth;slat.onBeforeShadow=(_r,_o,_c,shadowCamera)=>{pose.value=shadowCamera.userData.blindsOpen?1:0;};
  });

  bulb.intensity = 1.85; bulb.distance = 3.0;
  shade.material = dark;
  const lampInterior = new THREE.Mesh(new THREE.CircleGeometry(0.115, 24),
    new THREE.MeshBasicMaterial({ color: '#d6a26b' }));
  lampInterior.rotation.x = Math.PI / 2;
  lampInterior.position.set(-1.03, 1.818, -0.4); root.add(lampInterior);

  // Static pendant; only its local emission changes during the entry stutter.
  cylinder('Ceiling rose', 0.10, 0.025, [-0.65, 3.1075, 0.5], dark);
  rod('Pendant cord', [-0.65, 3.12, 0.5], [-0.65, 2.58, 0.5], 0.008, black);
  cylinder('Pendant socket', 0.036, 0.09, [-0.65, 2.55, 0.5], dark);
  const pendantMaterial = new THREE.MeshStandardMaterial({ color: '#ad8860', emissive: '#e0ac68', emissiveIntensity: 0.7 });
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), pendantMaterial);
  pendant.position.set(-0.65, 2.47, 0.5); pendant.scale.y = 1.35; root.add(pendant);
  const pendantLight = new THREE.PointLight('#ffd29a', 0.85, 3.2, 2);
  pendantLight.position.copy(pendant.position); root.add(pendantLight);

  // A post-batch group for effects that must keep their own transforms and
  // stay untagged: screen spill, lamp pool decal, and contact shadows under
  // legs/chair/tower. Added after the merge loop below so batching can't eat them.
  const fx = new THREE.Group(); fx.name = 'Lighting FX';

  const poolTexture = canvasTexture((ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }, 128, 128);
  function glowDecal(name, size, position, rotationX, color, opacity) {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 2, size * 2),
      new THREE.MeshBasicMaterial({ map: poolTexture, color, transparent: true, opacity, depthWrite: false, toneMapped: false }),
    );
    decal.name = name; decal.position.set(...position); decal.rotation.x = rotationX;
    decal.renderOrder = 2; fx.add(decal); return decal;
  }
  function contactShadow(name, size, position) {
    const tex = canvasTexture((ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, 'rgba(0,0,0,0.55)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    }, 128, 128);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(...size),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
    );
    decal.name = name; decal.rotation.x = -Math.PI / 2; decal.position.set(...position);
    decal.renderOrder = 1; fx.add(decal); return decal;
  }

  // Warm lamp pool on the desk surface beneath the shade.
  const lampPool=glowDecal('Lamp pool', 0.48, [-1.03, 1.167, -0.3], -Math.PI / 2, '#ffb35c', 0.38);
  // Screen spill onto desk/keyboard in front of the monitor.
  glowDecal('Screen spill', 0.67, [0, 1.183, 0.02], -Math.PI / 2, '#b6d8ff', 0.38);
  const screenGlow = new THREE.PointLight('#b6d8ff', 2.4, 1.65, 2);
  screenGlow.position.set(0, 1.57, -0.08); fx.add(screenGlow);

  const edgeSpill = glowDecal('Screen desk edge', 0.55, [0, 1.108, 0.687], 0, '#b6d8ff', 0.23);
  edgeSpill.scale.y = 0.1;

  // Contact shadows: desk legs, chair feet, tower, monitor foot, wall/floor corner.
  for (const x of [-1.46, 1.46]) for (const z of [-0.54, 0.49]) contactShadow('Leg contact', [0.22, 0.22], [x, 0.068, z]);
  contactShadow('Chair contact', [0.7, 0.7], [0.05, 0.068, 1.22]);
  contactShadow('Tower contact', [0.5, 0.5], [1.0, 0.068, -0.38]);
  contactShadow('Monitor contact', [0.62, 0.4], [0, 1.167, -0.35]);
  const cornerShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 0.5),
    new THREE.MeshBasicMaterial({
      color: '#000000', transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false,
    }),
  );
  cornerShadow.rotation.x = -Math.PI / 2; cornerShadow.position.set(0, 0.068, -1.55); cornerShadow.renderOrder = 1;
  fx.add(cornerShadow);

  // Bake static transforms and batch by material + interaction target. A room
  // contains many small pieces, but each key/slat need not cost a draw call.
  // Keep targets separate so first-hit raycasting still selects real objects.
  const batches = new Map();
  for (const mesh of [...root.children]) {
    if (!mesh.isMesh || mesh.isInstancedMesh) continue;
    mesh.updateMatrix();
    const id = mesh.userData.anchorId || '';
    const key = `${mesh.material.uuid}:${id}:${mesh.castShadow}`;
    if (!batches.has(key)) batches.set(key, { material: mesh.material, id, castShadow: mesh.castShadow, geometries: [] });
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrix);
    batches.get(key).geometries.push(geometry);
    mesh.geometry.dispose(); root.remove(mesh);
  }
  interactive.length = 0;
  interactive.push(keys);
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries, false);
    batch.geometries.forEach(item => item.dispose());
    if (!geometry) throw new Error('Could not prepare workspace geometry');
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.name = batch.id || 'Workspace architecture';
    mesh.castShadow = batch.castShadow; mesh.receiveShadow = true;
    root.add(mesh); tag(mesh, batch.id);
  }
  root.add(fx);
  const roomActions=buildRoomInteractions({root,materials:{bone,dark,wood,paper},canvasTexture,anchors:WORKSPACE.anchors,achievements,bulb,lampInterior,lampPool,moon,moonOpen,blindsGroup,keys});
  const hands = seatedHands(); root.add(hands.root); hands.root.visible = true;
  const figure = buildSeatedFigure(); root.add(figure.root);

  return {
    root, interactive,
    hands, phone, phoneGlow, phoneDisplay, notebook, figure, roomActions, keys,
    resetNotebook() { notebook.position.set(...WORKSPACE.anchors.notebook); notebook.rotation.set(0, 0, 0); },
    setPhoneScreen(name) { phoneMaterial.map = phoneTextures[name]; },
    resetPhone() { phone.position.set(...WORKSPACE.anchors.phone); phone.rotation.set(0,0,0); phoneMaterial.map = phoneTextures.home; phoneGlow.color.set('#d4d5d8'); phoneGlow.intensity = 0.07; },
    setHandsVisible(visible) { hands.root.visible = visible; },
    setEntryPower(value) { pendantLight.intensity = 0.85 * value; pendantMaterial.emissiveIntensity = 0.7 * value; },
    dispose() {
      const geometries = new Set(), mats = new Set(), textures = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if(object.customDepthMaterial)mats.add(object.customDepthMaterial);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => mats.add(m));
        if (object.isLight) object.dispose?.();
      });
      for (const h of [hands.left,hands.right]) for (const f of h.fingers) { geometries.add(f.userData.relaxed); geometries.add(f.userData.curled); }
      Object.values(phoneTextures).forEach(t => textures.add(t));
      mats.forEach(m => { for (const value of Object.values(m)) if (value?.isTexture) textures.add(value); m.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
