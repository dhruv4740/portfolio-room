import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// An authored architectural model. Coordinates here describe its geometry,
// not a capture; content anchors remain normalized in the content source.
export const WORKSPACE = {
  min: [-2.5, 0, -1.85], max: [2.5, 3.2, 2.1],
  target: [0, 1.1, -0.15],
  anchors: {
    monitor: [0, 1.79, -0.37],
    desk: [-1.22, 1.18, 0.28],
    notebook: [1.12, 1.21, 0.38],
    window: [1.4, 2.12, -1.75],
  },
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
    ctx.fillStyle = '#151719'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#242729'; ctx.fillRect(0, 0, w, 42);
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
    if (id) { mesh.userData.anchorId = id; interactive.push(mesh); }
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
  box('Left return wall', [0.13, 3.12, 1.55], [-2.43, 1.58, -1.09], plaster);
  box('Back skirting', [4.95, 0.065, 0.045], [0, 0.12, -1.708], dark);
  box('Left skirting', [0.045, 0.065, 1.52], [-2.34, 0.12, -1.06], dark);
  const windowRecess = box('Window recess', [1.53, 2.03, 0.065], [1.39, 1.99, -1.697], dark, 0.025, 'window');
  windowRecess.castShadow = false;
  const lightPanel = new THREE.MeshBasicMaterial({ color: '#e8e3cc' });
  const daylight = box('Daylight', [1.41, 1.91, 0.016], [1.39, 1.99, -1.65], lightPanel, 0, 'window');
  daylight.castShadow = false;
  const mullion = box('Window mullion', [0.034, 1.92, 0.04], [1.39, 1.99, -1.62], bone);
  mullion.castShadow = false;
  for (let i = 0; i < 11; i++) {
    const slat = box('Venetian blind', [1.47, 0.022, 0.08], [1.39, 2.88 - i * 0.145, -1.56], bone, 0, 'window');
    slat.rotation.x = -0.22;
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
  keys.castShadow = true; root.add(keys); tag(keys, 'desk');
  box('Escape key', [0.063, 0.031, 0.057], [-0.562, 1.251, 0.163], orange, 0.006);
  box('Spacebar', [0.35, 0.032, 0.055], [-0.13, 1.252, 0.4], bone, 0.006);
  box('Mouse', [0.13, 0.057, 0.21], [0.63, 1.22, 0.32], bone, 0.04, 'desk');
  box('Mouse wheel', [0.014, 0.011, 0.032], [0.63, 1.252, 0.279], dark, 0.004);

  // Open notebook: a real document object, pencil and authored page markings.
  const book = box('Notebook cover', [0.57, 0.024, 0.4], [1.14, 1.18, 0.3], mat('cover', '#3e4942'), 0.007, 'notebook');
  book.rotation.y = -0.12;
  const pages = box('Notebook pages', [0.55, 0.016, 0.38], [1.14, 1.199, 0.3], paper, 0.003, 'notebook'); pages.rotation.y = -0.12;
  const notes = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#e4dfcc'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b9b6a7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.fillStyle = '#474c45'; ctx.font = '32px monospace'; ctx.fillText('WORK NOTES', 40, 67);
    ctx.font = '23px monospace'; ['01  Make it useful.', '02  Make it strange.', '03  Make it work.'].forEach((s, i) => ctx.fillText(s, 38, 128 + i * 47));
    ctx.strokeStyle = '#696e60'; ctx.strokeRect(590, 80, 240, 180); ctx.strokeRect(650, 140, 230, 180);
    ctx.fillStyle = '#c6532b'; ctx.fillRect(590, 356, 130, 7);
  });
  const notePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.548, 0.378), new THREE.MeshBasicMaterial({ map: notes }));
  notePlane.rotation.set(-Math.PI / 2, 0, -0.12); notePlane.position.set(1.14, 1.209, 0.3); root.add(notePlane); tag(notePlane, 'notebook');
  rod('Graphite pencil', [1.47, 1.218, 0.06], [1.54, 1.218, 0.43], 0.009, dark);

  // Task light, books and a ceramic cup give the room a human scale.
  cylinder('Lamp base', 0.13, 0.035, [-1.28, 1.185, -0.48], dark);
  rod('Lamp lower arm', [-1.28, 1.2, -0.48], [-1.39, 1.69, -0.43], 0.017, dark);
  rod('Lamp upper arm', [-1.39, 1.69, -0.43], [-1.05, 1.95, -0.4], 0.017, dark);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.15, 32, 1, true), dark);
  shade.position.set(-1.03, 1.89, -0.4); shade.rotation.z = -0.3; root.add(shade);
  const bulb = new THREE.PointLight('#ffe4b1', 0.75, 2.2, 2); bulb.position.set(-1.02, 1.82, -0.39); root.add(bulb);
  for (let i = 0; i < 3; i++) box('Book stack', [0.48 - i * 0.025, 0.052, 0.34], [-1.25, 1.197 + i * 0.055, 0.15], [bone, dark, mat('bookTaupe', '#858070')][i], 0.008, 'desk');
  cylinder('Ceramic mug', 0.074, 0.145, [-0.89, 1.242, 0.46], bone);
  cylinder('Coffee', 0.061, 0.002, [-0.89, 1.316, 0.46], mat('coffee', '#392a20'));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.011, 8, 20), bone); handle.position.set(-0.806, 1.253, 0.46); root.add(handle);

  // Small speaker pair and vented workstation beneath the desk.
  for (const x of [-0.96, 0.95]) {
    box('Nearfield speaker', [0.18, 0.28, 0.16], [x, 1.305, -0.45], dark, 0.02);
    const cone = new THREE.Mesh(new THREE.CircleGeometry(0.059, 24), black); cone.position.set(x, 1.3, -0.362); root.add(cone);
  }
  box('Workstation tower', [0.35, 0.64, 0.64], [1.0, 0.405, -0.38], dark, 0.025);
  for (let i = 0; i < 12; i++) box('Tower vent', [0.24, 0.009, 0.009], [1.0, 0.27 + i * 0.027, -0.054], black);

  // Chair with timber seat, perforated back and tubular steel frame.
  box('Chair seat', [0.6, 0.07, 0.55], [0.05, 0.63, 1.2], wood, 0.055);
  for (const x of [-0.19, 0.29]) {
    rod('Chair front leg', [x, 0.12, 0.98], [x, 0.62, 1.0], 0.019, dark);
    rod('Chair rear leg', [x, 0.12, 1.48], [x, 1.2, 1.4], 0.019, dark);
  }
  box('Chair back', [0.57, 0.29, 0.045], [0.05, 1.08, 1.414], wood, 0.04);
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
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.79, 0.59), new THREE.MeshBasicMaterial({ map: print }));
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

  // Ambient is a trickle, not a floor: the window is the key, everything else
  // falls away from it. Sun now rakes in through the window opening (behind
  // it, high, at negative z) instead of from the camera side, so the blinds
  // it passes through actually cast slatted shadows across desk and floor.
  scene.add(new THREE.HemisphereLight('#8f97a6', '#2c2a24', 0.55));
  const sun = new THREE.DirectionalLight('#ffd9a0', 4.4);
  // Positioned just outside the (non-physical) window opening, aimed across
  // the desk, so the blind slats sit between light and desk and band it.
  sun.position.set(2.1, 3.6, -2.7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 3, bottom: -1.6, near: 0.3, far: 9 });
  sun.shadow.bias = -0.00018;
  sun.target.position.set(0.1, 0.9, 0.3); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a9c2d6', 0.4); fill.position.set(-4, 3, 3); scene.add(fill);

  // Lamp: raise the pool intensity and shrink its reach so it reads as a real
  // local source rather than another ambient wash; emissive shade interior.
  bulb.intensity = 3.2; bulb.distance = 1.8; bulb.decay = 2;
  shade.material = new THREE.MeshStandardMaterial({
    color: '#1c1a17', emissive: '#ffb35c', emissiveIntensity: 1.6,
    roughness: 0.6, side: THREE.DoubleSide,
  });

  // A post-batch group for effects that must keep their own transforms and
  // stay untagged: screen spill, lamp pool decal, and contact shadows under
  // legs/chair/tower. Added after the merge loop below so batching can't eat them.
  const fx = new THREE.Group(); fx.name = 'Lighting FX';

  function glowDecal(name, size, position, rotationX, color, opacity) {
    const decal = new THREE.Mesh(
      new THREE.CircleGeometry(size, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false }),
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
  glowDecal('Lamp pool', 0.34, [-1.03, 1.176, -0.3], -Math.PI / 2, '#ffb35c', 0.22);
  // Screen spill onto desk/keyboard in front of the monitor.
  glowDecal('Screen spill', 0.55, [0, 1.177, 0.05], -Math.PI / 2, '#dfe6ea', 0.1);
  const screenGlow = new THREE.PointLight('#cfe0ec', 0.5, 1.4, 2);
  screenGlow.position.set(0, 1.6, -0.15); fx.add(screenGlow);

  // Contact shadows: desk legs, chair feet, tower, monitor foot, wall/floor corner.
  for (const x of [-1.46, 1.46]) for (const z of [-0.54, 0.49]) contactShadow('Leg contact', [0.22, 0.22], [x, 0.006, z]);
  contactShadow('Chair contact', [0.7, 0.7], [0.05, 0.006, 1.22]);
  contactShadow('Tower contact', [0.5, 0.5], [1.0, 0.006, -0.38]);
  contactShadow('Monitor contact', [0.62, 0.4], [0, 1.116, -0.35]);
  const cornerShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 0.5),
    new THREE.MeshBasicMaterial({
      color: '#000000', transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false,
    }),
  );
  cornerShadow.rotation.x = -Math.PI / 2; cornerShadow.position.set(0, 0.007, -1.55); cornerShadow.renderOrder = 1;
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

  return {
    root, interactive,
    dispose() {
      const geometries = new Set(), mats = new Set(), textures = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => mats.add(m));
        if (object.isLight) object.dispose?.();
      });
      mats.forEach(m => { for (const value of Object.values(m)) if (value?.isTexture) textures.add(value); m.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
