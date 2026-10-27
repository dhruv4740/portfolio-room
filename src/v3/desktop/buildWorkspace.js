import * as THREE from 'three';
import { buildRoomInteractions } from './buildRoomInteractions.js';
import { buildSeatedFigure } from './buildSeatedFigure.js';
import { seatedHands } from './seatedHands.js';
import { createSpeakerDetails } from './speakerDetails.js';
import { createAuthoredTaskLamp } from './authoredTaskLamp.js';
import { createAuthoredMouse } from './authoredMouse.js';
import { createAuthoredCeilingFixture } from './authoredCeilingFixture.js';
import { createAuthoredKeyboard } from './authoredKeyboard.js';
import { KEYCAPS } from './keyboardLayout.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { identity, education, experience, achievements } from '../content/index.js';
import { INSTAGRAM_ICON_UV_RECT } from './phoneScreenSize.js';

// An authored architectural model. Coordinates here describe its geometry,
// not a capture; content anchors remain normalized in the content source.
export const WORKSPACE = {
  min: [-2.5, 0, -1.85], max: [2.5, 3.2, 2.1],
  target: [0.15, 1.5, -0.55],
  overview: { position: [-0.55, 2.05, 1.98], target: [0.15, 1.52, -0.55] },
  anchors: {
    monitor: [0, 1.79, -0.37],
    lamp: [-1.28,1.21,-0.38], coffee: [-0.89,1.242,0.46], award: [-1.0,1.335,-0.22], // left of the monitor's sightline from the seat, in front of the speaker
    drawer: [1.10,0.99,0.62], blinds: [2.16,1.75,-1.48], headphones: [0.67,1.24,-0.05], keyboard: [0,1.2375,0.20],
    notebook: [1.14, 1.21, 0.30], pen: [1.47, 1.218, 0.06],
    window: [1.4, 2.12, -1.75],
    phone: [-0.80, 1.174, -0.03],
    windowOpen: [1.74, 1.99, -1.63],
  },
  seat: { position: [0.05, 1.72, 1.16], target: [0, 1.42, -0.37] },
  chair: [0.05, 1.08, 1.414],
  screen: { center: [0, 1.79, -0.362], width: 1.28, height: 0.79 },
  deskSurface: { center: [0,1.165,-.04], size: [3.52,1.45], radius: .008, thickness:.035 },
  matSurface: { center: [.11,1.174,.25], size: [.95,.52], radius: .025 },
  phoneSize: {width:.078,height:.166,depth:.009},
};

function drawBlankPage(ctx, w, h) {
  ctx.fillStyle = '#efeade'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(110,116,104,0.20)'; ctx.lineWidth = 1.5;
  for (let y = 160; y < h - 60; y += 74) { ctx.beginPath(); ctx.moveTo(96, y); ctx.lineTo(w - 110, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(198,83,43,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(96, 60); ctx.lineTo(96, h - 60); ctx.stroke();
}
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
    ctx.fillStyle = '#152028'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#25343b'; ctx.fillRect(0, 0, w, 42);
    ctx.font = '20px monospace'; ctx.fillStyle = '#ddd9d0';
    ctx.fillStyle = '#8e918e'; ctx.fillText('WORKSPACE 01', w - 210, 28);
    ctx.strokeStyle = '#464845'; ctx.lineWidth = 1;
    ctx.strokeRect(72, 102, 880, 420);
    ctx.fillStyle = '#222426'; ctx.fillRect(73, 103, 878, 44);
    ctx.fillStyle = '#e8e4dc'; ctx.font = '18px monospace'; ctx.fillText('Selected work', 96, 131);
    ctx.fillStyle = '#d9d4c7'; ctx.fillRect(95, 186, 9, 9);
    ctx.fillStyle = '#ece7db'; ctx.font = '48px sans-serif'; ctx.fillText('Things I made.', 95, 256);
    ctx.fillStyle = '#969991'; ctx.font = '20px monospace'; ctx.fillText('Open the machine. Try something.', 97, 302);
    const labels = ['01   Desktop projects', '02   Built to be used', '03   Explore the computer'];
    labels.forEach((label, i) => {
      const y = 366 + i * 53;
      ctx.strokeStyle = '#363a38'; ctx.beginPath(); ctx.moveTo(96, y - 22); ctx.lineTo(924, y - 22); ctx.stroke();
      ctx.fillStyle = '#cccfc5'; ctx.font = '22px monospace'; ctx.fillText(label, 99, y + 8);
      ctx.fillStyle = '#d9d4c7'; ctx.fillText('↗', 887, y + 8);
    });
    ctx.fillStyle = '#666e68'; ctx.font = '16px monospace'; ctx.fillText('DHRUV KOTHARI                                    ENTER ↗', 75, 591);
  }, 1024, 640);
}

// Only seen from the seat once you pull back out of the zoomed phone: a small
// stand-in for PhoneScreen's lock screen (FocusLock's overlay_lock.xml), so the
// handoff does not pop to a different screen. 540 x 1200, same as PhoneScreen.
export function phoneFocusLockTexture() {
  return canvasTexture((ctx, w) => {
    const card = (y, height, fill = '#1E293B', radius = 24, stroke = true) => {
      ctx.beginPath(); ctx.roundRect(36, y, w - 72, height, radius); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke(); }
    };
    ctx.fillStyle = '#121820'; ctx.fillRect(0, 0, w, 1200);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.beginPath(); ctx.roundRect(w / 2 - 66, 300, 132, 34, 17); ctx.fillStyle = '#1E293B'; ctx.fill();
    ctx.fillStyle = '#EF4444'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('LOCKED', w / 2, 318);
    ctx.fillStyle = '#F8FAFC'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText('FocusLock paused', w / 2, 384); ctx.fillText('com.instagram.android', w / 2, 428);
    card(470, 96);
    ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 17px sans-serif'; ctx.fillText("TODAY'S USAGE", w / 2, 518);
    card(596, 100);
    card(732, 72, '#111827', 18);
    ctx.fillStyle = '#F8FAFC'; ctx.font = '21px sans-serif'; ctx.fillText('Request 5 Minute Extension', w / 2, 768);
    card(819, 72, '#6366F1', 18, false);
    ctx.fillStyle = '#0A0E17'; ctx.font = 'bold 21px sans-serif'; ctx.fillText('I will take a break now', w / 2, 855);
  }, 540, 1200);
}

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

export const SKY_CONFIGS = {
  night: {
    hemi: { sky: '#8294b2', ground: '#21160e', intensity: 0.42 },
    key: { color: '#8eadd8', closed: 1.15, open: 1.60, position: [1.65, 2.85, -3.0] },
    windowLight: 0.55,
  },
};

// An authored impression, not a claimed photographic view or named landmark.
// Stable seeded windows avoid texture regeneration or any animation clock.
function skylineTexture(foreground = false, state = 'night') {
  return canvasTexture((ctx, w, h) => {
    let seed = foreground ? 819 : 47;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    if (!foreground) {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      if (state === 'day') {
        sky.addColorStop(0, '#4a78a6'); sky.addColorStop(0.6, '#89acc7'); sky.addColorStop(1, '#c5d8e2');
      } else if (state === 'dusk') {
        sky.addColorStop(0, '#23253b'); sky.addColorStop(0.55, '#9c4935'); sky.addColorStop(1, '#c97746');
      } else {
        sky.addColorStop(0, '#18232f'); sky.addColorStop(0.6, '#4d4742'); sky.addColorStop(1, '#625044');
      }
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    }
    let x = -30;
    while (x < w) {
      const width = 28 + random() * (foreground ? 85 : 44);
      const tower = !foreground && random() > 0.72;
      const height = foreground ? 100 + random() * 190 : tower ? 420 + random() * 260 : 180 + random() * 210;
      const roof = h - height;
      if (state === 'day') {
        ctx.fillStyle = foreground ? '#545c60' : tower ? '#636e73' : '#5c676b';
      } else if (state === 'dusk') {
        ctx.fillStyle = foreground ? '#262125' : tower ? '#393339' : '#40363a';
      } else {
        ctx.fillStyle = foreground ? '#202323' : tower ? '#353634' : '#3a3632';
      }
      ctx.fillRect(x, roof, width, height);
      // Roof terraces, water tanks, service cores: irregular low-rise massing.
      ctx.fillRect(x + width * 0.15, roof - 7, width * 0.7, 7);
      if (random() > 0.4) ctx.fillRect(x + 9, roof - 20, width * 0.25, 20);
      if (tower) {
        ctx.fillStyle = state === 'day' ? '#4b5559' : state === 'dusk' ? '#4c4046' : '#44413a';
        for (let y = roof + 12; y < h; y += 27) ctx.fillRect(x + 1, y, width - 2, 2);
      }
      for (let y = roof + 16; y < h - 12; y += foreground ? 25 : 22) {
        for (let wx = x + 7; wx < x + width - 7; wx += 13) {
          if (random() > 0.48) continue;
          if (state === 'day') {
            ctx.fillStyle = ['#9abacf', '#b4cee0', '#7d9cb3', '#8eaebf'][Math.floor(random() * 4)];
          } else if (state === 'dusk') {
            ctx.fillStyle = ['#e8a855', '#d68b3e', '#f2c16b', '#c47333'][Math.floor(random() * 4)];
          } else {
            ctx.fillStyle = ['#b68b52', '#d3a66a', '#8e775a', '#e0b57b'][Math.floor(random() * 4)];
          }
          ctx.fillRect(wx, y, 4 + random() * 3, 7);
        }
      }
      x += width + 3 + random() * 10;
    }
  }, 768, 1024);
}

export function buildWorkspace(scene, options = {}) {
  const root = new THREE.Group(); root.name = 'Dhruv workspace'; scene.add(root);
  const interactive = [];
  const materials = {};
  const mat = (name, color, options = {}) => materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...options });
  const plaster = mat('plaster', '#8d918c', { roughness: 0.96 });
  const floor = mat('floor', '#565955', { roughness: 0.94 });
  const dark = mat('graphite', '#24282a', { roughness: 0.38, metalness: 0.42 });
  const black = mat('rubber', '#131718', { roughness: 0.95, metalness: 0 });
  const steel = mat('steel', '#8b8f89', { metalness: 0.92, roughness: 0.32 });
  const bone = mat('bone', '#e4dfce', { roughness: 0.82 });
  const paper = mat('paper', '#e4dfcc', { roughness: 0.98 });
  const orange = mat('orange', '#df5b29', { roughness: 0.5 });
  const wood = mat('oak', '#ffffff', { map: woodTexture(), roughness: 0.52, metalness: 0.02 });
  const bakedMaterials = {};

  function tag(mesh, id) {
    if (id && id !== 'desk') { mesh.userData.anchorId = id; interactive.push(mesh); }
    return mesh;
  }
  function box(name, size, position, material, radius = 0, id) {
    const geometry = radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size);
    const surface = name.startsWith('Back wall') || name.startsWith('Window wall') ? 'back'
      : name === 'Left wall' ? 'left' : name.startsWith('Right wall') ? 'right'
      : name === 'Concrete floor' ? 'floor' : null;
    if (surface) {
      material = bakedMaterials[surface] ||= material.clone();
      material.name = `Baked ${surface}`;
      const p=geometry.getAttribute('position'), uv=[];
      for(let i=0;i<p.count;i++) {
        const x=p.getX(i)+position[0],y=p.getY(i)+position[1],z=p.getZ(i)+position[2];
        uv.push(surface==='back'?(x+2.5)/5:surface==='floor'?(x+2.5)/5:surface==='left'?(2.04-z)/3.88:(z+1.84)/3.88,
          surface==='floor'?(2.05-z)/3.9:(y-.02)/3.12);
      }
      geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(uv,2));
    }
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
  // Wall sections surround a real aperture: light and exterior geometry
  // can pass through it. Interior cameras never need threshold-based cutaways.
  box('Back wall left', [3.135, 3.12, .16], [-.9325, 1.58, -1.8], plaster);
  box('Back wall right', [.375, 3.12, .16], [2.3125, 1.58, -1.8], plaster);
  box('Window wall below', [1.49, .955, .16], [1.38, .4975, -1.8], plaster);
  box('Window wall above', [1.49, .165, .16], [1.38, 3.0575, -1.8], plaster);
  box('Left wall', [.16,3.12,3.88], [-2.43,1.58,.1], plaster);
  box('Right wall rear', [.16,3.12,2.10], [2.43,1.58,-.80], plaster);
  box('Right wall front', [.16,3.12,.68], [2.43,1.58,1.74], plaster);
  box('Doorway header', [.16,.62,1.15], [2.43,2.83,.825], plaster);
  box('Recess back', [.10,2.50,1.15], [2.82,1.27,.825], dark);
  box('Recess top', [.45,.10,1.15], [2.60,2.47,.825], plaster);
  for (const z of [.25,1.4]) box('Recess reveal', [.45,2.50,.08], [2.60,1.27,z], plaster);
  box('Front wall', [5,3.12,.16], [0,1.58,2.16], plaster);
  box('Ceiling', [5.1,.08,4.1], [0,3.18,.1], plaster);
  box('Ceiling beam', [.10,.12,4.0], [-.65,3.08,.1], dark);
  box('Back skirting', [4.95,.065,.045], [0,.12,-1.69], dark);
  for (const x of [-2.33,2.33]) box('Side skirting', [.045,.065,3.85], [x,.12,.1], dark);
  for (const x of [.615,2.155]) box('Window jamb', [.065,2.10,.25], [x,1.99,-1.73], dark,.008,'window');
  for (const y of [.96,3.02]) box('Window rail', [1.60,.065,.25], [1.385,y,-1.73], dark,.008,'window');
  const city = new THREE.Group(); city.name = 'Mumbai view';
  const cityTextures = {
    night: [skylineTexture(false, 'night'), skylineTexture(true, 'night')],
  };
  Object.values(cityTextures).forEach(pair => {
    pair[0].repeat.set(0.78, 0.88); pair[0].offset.set(0.11, 0.06);
    pair[1].repeat.set(0.78, 0.88); pair[1].offset.set(0.11, 0.06);
  });
  const cityLayers = [0, 1].map((index) => {
    const map = cityTextures.night[index];
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(index ? 6 : 12, index ? 5 : 10), new THREE.MeshBasicMaterial({
      map, transparent: index === 1, alphaTest: index === 1 ? 0.01 : 0,
      toneMapped: false, fog: false,
    }));
    layer.position.set(1.39, 1.99, index ? -4.5 : -8.0);
    layer.raycast = () => {}; // true depth supplies camera parallax through the aperture
    tag(layer, 'window'); city.add(layer);
    return layer;
  });
  // Nearby parapets establish scale against the distant skyline.
  const facade = new THREE.MeshStandardMaterial({color:'#26313b',roughness:1});
  const windows = new THREE.MeshBasicMaterial({color:'#c9ab7c',toneMapped:false});
  for (const [x,y,z,w,h] of [[-.7,.1,-4.2,.8,2.4],[2.6,.2,-5.0,1.2,3.0],[.65,-.4,-5.6,.9,2.2]]) {
    const building=new THREE.Mesh(new THREE.BoxGeometry(w,h,.65),facade);building.position.set(x,y,z);city.add(building);
    for(let row=0;row<12;row++)for(let col=0;col<5;col++)if((row+col)%3!==1){
      const win=new THREE.Mesh(new THREE.PlaneGeometry(.035,.055),windows);win.position.set(x-w*.35+col*w*.175,y-h*.4+row*h*.075,z+.331);city.add(win);
    }
  }
  for(const material of [facade,windows]) {
    const parts=city.children.filter(o=>o.material===material), gs=parts.map(o=>{o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);o.removeFromParent();o.geometry.dispose();return g;});
    const combined=mergeGeometries(gs);gs.forEach(g=>g.dispose());city.add(new THREE.Mesh(combined,material));
  }
  city.traverse(o=>{if(o.isMesh){o.castShadow=false;o.raycast=()=>{};}});
  root.add(city);
  const mullion = box('Window mullion', [0.034, 1.92, 0.04], [1.39, 1.99, -1.62], bone);
  mullion.castShadow = false;
  const blindsGroup=new THREE.Group();root.add(blindsGroup);
  for (let i = 0; i < 11; i++) {
    const slat = box('Venetian blind', [1.47, 0.003, 0.08], [1.39, 2.88 - i * 0.145, -1.56], bone, 0, 'window');
    slat.rotation.x = -0.22;slat.castShadow=true;blindsGroup.add(slat);
  }
  box('Window sill', [1.7, 0.065, 0.32], [1.39, 0.99, -1.54], bone, 0.012);

  // Desk: solid oak, a thin edge, and a black steel trestle.
  const deskSurface=WORKSPACE.deskSurface,matSurface=WORKSPACE.matSurface;
  const oakDesktop = box('Oak desktop', [deskSurface.size[0],deskSurface.thickness,deskSurface.size[1]], [deskSurface.center[0],deskSurface.center[1]-deskSurface.thickness/2,deskSurface.center[2]], wood, deskSurface.radius, 'desk');
  const deskBox = new THREE.Box3().setFromObject(oakDesktop);
  box('Desk edge inlay', [3.42, 0.006, 0.006], [0, 1.139, 0.687], dark);
  for (const x of [-1.46, 1.46]) {
    for (const z of [-0.54, 0.49]) box('Steel desk leg', [0.052, 1.065, 0.052], [x, 0.5975, z], dark, 0.008);
    box('Desk foot rail', [0.055, 0.055, 1.12], [x, 0.19, -0.025], dark, 0.008);
  }
  box('Rear stretcher', [2.94, 0.07, 0.045], [0, 0.84, -0.54], dark);
  box('Felt desk mat', [matSurface.size[0],.008,matSurface.size[1]], [matSurface.center[0],matSurface.center[1]-.004,matSurface.center[2]], mat('felt', '#303533'), matSurface.radius, 'desk');

  // Real screen geometry gives the entrance a destination and a known plane.
  box('Monitor foot', [0.5, 0.035, 0.29], [0, 1.18, -0.35], steel, 0.02, 'monitor');
  box('Monitor stand', [0.08, 0.31, 0.06], [0, 1.34, -0.43], steel, 0.014, 'monitor');
  const monitorEnclosure = box('Monitor enclosure', [1.4, 0.93, 0.085], [0, 1.79, -0.418], dark, 0.04, 'monitor');
  const displayMaterial = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(WORKSPACE.screen.width, WORKSPACE.screen.height), displayMaterial);
  display.name = 'Interactive monitor screen'; display.position.set(...WORKSPACE.screen.center); root.add(display); tag(display, 'monitor');
  // Static architecture never moves after this point, so a Box3 captured now
  // (before the batching pass below disposes these individual meshes) stays
  // valid for the lifetime of the scene — used by the test hook's boxOf().
  const monitorScreenBox = new THREE.Box3().setFromObject(display);
  const monitorBezelBox = new THREE.Box3().setFromObject(monitorEnclosure);
  box('Monitor chin', [1.29, 0.035, 0.018], [0, 1.35, -0.362], dark, 0.006, 'monitor');
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), new THREE.MeshBasicMaterial({ color: '#d9d4c7' }));
  led.position.set(0.58, 1.35, -0.345); root.add(led);
  cable([[0, 1.55, -0.47], [0.12, 1.17, -0.5], [0.7, 1.17, -0.67], [1.3, 0.75, -0.7]]);

  // A mechanical keyboard: 92 instanced keycaps at the measured layout, with an
  // orange escape cap. The first 60 instances are the KEY_ROWS grid in
  // row-major order, which is what setKey and the instanceId hit path index by.
  // The procedural case is the authored chassis's load fallback, so it is
  // grouped out of static batching and can be hidden wholesale.
  const keyboardFallback=new THREE.Group();keyboardFallback.name='Keyboard fallback';root.add(keyboardFallback);
  keyboardFallback.add(box('Keyboard case', [.48, .035, .20], [0, 1.201, .28], bone, .009, 'desk'));
  // Rubber feet bridge the gap between the felt mat and the case underside.
  for(const x of [-.17,.17])for(const z of [.215,.345])
    box('Keyboard foot',[.036,.0232,.025],[x,WORKSPACE.matSurface.center[1]+.0116,z],dark,.003,'desk');
  // Matches the canonical cap in keyboard.glb, so the fallback reads the same.
  const keyGeometry = new RoundedBoxGeometry(.0211, .0210, .0219, 2, .0018);
  const keys = new THREE.InstancedMesh(keyGeometry, mat('keycaps', '#d3d0c3'), KEYCAPS.length);
  const transform = new THREE.Object3D(), keyColor = new THREE.Color();
  KEYCAPS.forEach((cap, i) => {
    transform.position.set(...cap.p); transform.scale.set(cap.w, 1, 1);
    transform.updateMatrix(); keys.setMatrixAt(i, transform.matrix);
    keys.setColorAt(i, keyColor.set(cap.esc ? '#d9d4c7' : '#ffffff'));
  });
  keys.castShadow = false; root.add(keys); tag(keys, 'keyboard');
  // The procedural boxes are now only the licensed mouse's load fallback.
  // Grouping keeps them out of static batching so they can be hidden, and out
  // of the static contact set — the loaded asset supplies real contact geometry.
  const mouseFallback=new THREE.Group();mouseFallback.name='Mouse fallback';root.add(mouseFallback);
  mouseFallback.add(box('Mouse', [.070, .037, .12], [.37, 1.195, .30], bone, .022));
  mouseFallback.add(box('Mouse wheel', [.009, .007, .018], [.37, 1.216, .274], dark, .002));

  // Keep the complete phone out of static batching and out of baked shadows.
  const phone = new THREE.Group(); phone.name = 'Animated phone';
  phone.position.set(...WORKSPACE.anchors.phone); root.add(phone);
  const phoneSize=WORKSPACE.phoneSize;
  const phoneBody = new THREE.Mesh(new RoundedBoxGeometry(phoneSize.width, phoneSize.depth, phoneSize.height, 2, 0.004), dark);
  phoneBody.position.y = -phoneSize.depth*.5; phone.add(phoneBody); tag(phoneBody, 'phone');
  const phoneTextures = { home: phoneHomeTexture(), hover: phoneHomeTexture(true), focuslock: phoneFocusLockTexture() };
  const phoneMaterial = new THREE.MeshBasicMaterial({ map: phoneTextures.home, toneMapped: false });
  const phoneDisplay = new THREE.Mesh(new THREE.PlaneGeometry(phoneSize.width-.006, phoneSize.height-.012), phoneMaterial);
  phoneDisplay.rotation.x = -Math.PI / 2; phoneDisplay.position.y=.0004; phone.add(phoneDisplay); tag(phoneDisplay, 'phone');
  const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.001, 0.0015), black);
  earpiece.position.set(0, 0.0005, -phoneSize.height*.5+.004); phone.add(earpiece); tag(earpiece, 'phone');
  const phoneGlow = new THREE.Object3D(); phoneGlow.color = new THREE.Color('#d4d5d8'); phoneGlow.intensity = .07;
  phoneGlow.position.set(-0.80, 1.24, -0.03); root.add(phoneGlow);

  // Open notebook: a real document object, pencil and authored page markings.
  const book = box('Notebook cover', [0.46, 0.024, 0.57], [1.14, 1.18, 0.3], mat('cover', '#3e4942'), 0.007, 'notebook');
  book.rotation.y = -0.04;
  const pages = box('Notebook pages', [0.44, 0.016, 0.55], [1.14, 1.199, 0.3], paper, 0.003, 'notebook'); pages.rotation.y = -0.04;
  // A blank ruled page: visitors draw on it with the pen. The canvas is kept
  // live so strokes land on the same texture the notebook shows.
  const notes = canvasTexture(drawBlankPage, 1400, 1800);
  const notePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.514), new THREE.MeshStandardMaterial(
    { map: notes, roughness: 0.98, emissive: '#ffffff', emissiveMap: notes, emissiveIntensity: 0.34 }));
  notePlane.rotation.set(-Math.PI / 2, 0, -0.04); notePlane.position.set(1.14, 1.209, 0.3); root.add(notePlane); tag(notePlane, 'notebook');
  // Movable assembly stays outside static batching and the baked shadow map.
  const notebook = new THREE.Group(); notebook.position.set(...WORKSPACE.anchors.notebook); root.add(notebook);
  for (const part of [book, pages, notePlane]) {
    part.position.sub(notebook.position); part.castShadow = false; notebook.add(part);
  }

  // Task light, books and a ceramic cup give the room a human scale.
  const lampFallback=new THREE.Group();lampFallback.name='Task lamp fallback';root.add(lampFallback);
  lampFallback.add(cylinder('Lamp base', 0.13, 0.035, [-1.28, 1.185, -0.48], dark));
  lampFallback.add(rod('Lamp lower arm', [-1.28, 1.2, -0.48], [-1.39, 1.69, -0.43], 0.017, dark));
  lampFallback.add(rod('Lamp upper arm', [-1.39, 1.69, -0.43], [-1.05, 1.95, -0.4], 0.017, dark));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.15, 32, 1, true), dark);
  shade.position.set(-1.03, 1.89, -0.4); shade.rotation.z = -0.3; lampFallback.add(shade);
  const bulb = new THREE.SpotLight('#ffe4b1', 1.85, 3, .8, .7, 2);
  bulb.castShadow=true;bulb.shadow.mapSize.set(512,512);
  bulb.shadow.camera.near=.025;bulb.shadow.camera.far=3;bulb.shadow.bias=-.0002;bulb.shadow.normalBias=.001;
  bulb.position.set(-1.02, 1.82, -0.39);bulb.target.position.set(-1.02,1.165,-.39);root.add(bulb,bulb.target);
  for (let i = 0; i < 3; i++) {
    const width=.48-i*.025,y=1.197+i*.055,cover=[bone,dark,mat('bookTaupe','#858070')][i];
    box('Book page block',[width-.012,.041,.325],[-1.25,y,.15],paper,.003,'desk');
    for(const dy of [-.024,.024])box('Book cover',[width,.005,.34],[-1.25,y+dy,.15],cover,.002,'desk');
    box('Book spine',[.009,.052,.34],[-1.25-width*.5+.0045,y,.15],cover,.003,'desk');
  }
  /* mug is authored by buildRoomInteractions */


  // Small speaker pair and vented workstation beneath the desk.
  for (const x of [-0.96, 0.95]) {
    box('Nearfield speaker', [0.18, 0.28, 0.16], [x, 1.305, -0.45], dark, 0.02);
  }
  const speakerDetails = createSpeakerDetails();
  root.add(speakerDetails.root);
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

  // A faint cool rim is the only shadow-casting source. Depth is baked once.
  const hemiLight = new THREE.HemisphereLight('#8294b2', '#21160e', 0.42);
  scene.add(hemiLight);
  const moon = new THREE.DirectionalLight('#8eadd8', 1.15);
  moon.position.set(1.65, 2.85, -3.0); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -2.6, right: 2.6, top: 3, bottom: -1.6, near: 0.3, far: 9 });
  moon.shadow.bias = -0.00018;
  moon.target.position.set(-0.8, 1.6, -0.7); scene.add(moon, moon.target);
  // Both endpoint maps are baked by the single initial shadow-map update.
  // Each blind's depth-only shader supplies the alternate pose for the open map.
  const moonOpen=moon.clone();moonOpen.intensity=0;moonOpen.position.copy(moon.position);moonOpen.target=moon.target;
  moonOpen.shadow=moon.shadow.clone();moonOpen.shadow.camera.userData.blindsOpen=true;scene.add(moonOpen);
  const windowLight = new THREE.PointLight('#9ab8d6', 0, 3.5, 2);
  windowLight.position.set(1.74, 2.1, -1.55); root.add(windowLight);
  const keyConfig = { closed: 1.15, open: 1.60, windowLight: 0.55 };
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
  lampInterior.position.set(-1.03, 1.818, -0.4); lampFallback.add(lampInterior);

  // Static pendant; only its local emission changes during the entry stutter.
  cylinder('Ceiling rose', 0.10, 0.025, [-0.65, 3.1075, 0.5], dark);
  // Cord, socket and bulb are now the licensed fixture's load fallback.
  // Grouping keeps them out of static batching so they can be hidden.
  const pendantFallback=new THREE.Group();pendantFallback.name='Pendant fallback';root.add(pendantFallback);
  pendantFallback.add(rod('Pendant cord', [-0.65, 3.12, 0.5], [-0.65, 2.58, 0.5], 0.008, black));
  pendantFallback.add(cylinder('Pendant socket', 0.036, 0.09, [-0.65, 2.55, 0.5], dark));
  const pendantMaterial = new THREE.MeshStandardMaterial({ color: '#ad8860', emissive: '#e0ac68', emissiveIntensity: 0.7 });
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), pendantMaterial);
  pendant.position.set(-0.65, 2.47, 0.5); pendant.scale.y = 1.35; pendantFallback.add(pendant);
  const ceilingFixture=createAuthoredCeilingFixture({root,fallback:pendantFallback,
    // Hung from the existing ceiling rose; the asset drops .584 m from here.
    position:[-0.65,3.0975,0.5],onReady:()=>{options.onShadowNeedsUpdate?.();}});
  const pendantLight = new THREE.Object3D(); pendantLight.intensity = .85;
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
  glowDecal('Screen spill', 0.67, [0, 1.183, 0.02], -Math.PI / 2, '#b6d8ff', 0.24);
  const screenGlow = new THREE.PointLight('#b6d8ff', 1.8, 1.65, 2);
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
  // Contact casters retain actual geometry before the visible meshes are
  // batched. No duplicated proxy dimensions and no tabletop self-shadow.
  const contactNames=new Set(['Keyboard case','Keyboard foot','Book page block','Book cover','Book spine','Nearfield speaker','Monitor foot','Monitor stand']);
  const contactParts=[];root.updateMatrixWorld(true);
  for(const mesh of root.children){
    if(!mesh.isMesh||!contactNames.has(mesh.name))continue;
    const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    for(const name of Object.keys(g.attributes))if(name!=='position')g.deleteAttribute(name);
    contactParts.push(g);
  }
  const contactGeometry=mergeGeometries(contactParts,false);contactParts.forEach(g=>g.dispose());
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
  const roomActions=buildRoomInteractions({root,materials:{bone,dark,wood,paper},canvasTexture,anchors:WORKSPACE.anchors,achievements,bulb,lampInterior,lampPool,moon,moonOpen,blindsGroup,keys,keyConfig,windowLight});
  const taskLamp=createAuthoredTaskLamp({root,fallback:lampFallback,bulb,pool:lampPool,desktop:deskSurface,onReady:()=>{roomActions.apply();options.onShadowNeedsUpdate?.();}});
  const keyboard=createAuthoredKeyboard({root,keys,fallback:keyboardFallback,
    // The chassis origin is its own underside at the board centre; the export
    // puts the home-row cap tops on KEY_TOP from there.
    position:[0,1.19723,.28],
    onReady:()=>{options.onShadowNeedsUpdate?.();}});
  const mouse=createAuthoredMouse({root,fallback:mouseFallback,
    // Sitting on the felt mat (top y=1.174), squared roughly to the keyboard.
    anchor:{position:[.37,1.174,.30],rotationY:-.08},
    onReady:()=>{options.onShadowNeedsUpdate?.();}});
  const hands = seatedHands(); root.add(hands.root); hands.root.visible = true;
  const figure = buildSeatedFigure(); root.add(figure.root);

  return {
    root, interactive, materials, bakedMaterials, city, bulb, hemiLight, contactGeometry, taskLamp, mouse, ceilingFixture, keyboard,
    contactSurfaces: {desk:deskSurface,mat:matSurface},
    hands, phone, phoneGlow, phoneDisplay, notebook, figure, roomActions, keys,
    staticBoxes: { monitorScreen: monitorScreenBox, monitorBezel: monitorBezelBox, desk: deskBox },
    notePage: notePlane, notes,
    clearNotes() { const c = notes.image; drawBlankPage(c.getContext('2d'), c.width, c.height); notes.needsUpdate = true; },
    resetNotebook() { notebook.position.set(...WORKSPACE.anchors.notebook); notebook.rotation.set(0, 0, 0); },
    setPhoneScreen(name) { phoneMaterial.map = phoneTextures[name]; },
    // One line of live GitHub activity under the "Selected work" panel.
    setGithubActivity(line) {
      const texture = displayMaterial.map, ctx = texture.image.getContext('2d');
      ctx.fillStyle = '#152028'; ctx.fillRect(72, 530, 900, 34);
      ctx.fillStyle = '#3ecf8e'; ctx.beginPath(); ctx.arc(82, 547, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9ea39f'; ctx.font = '17px monospace';
      ctx.fillText(`GITHUB  ${line}`.slice(0, 84), 96, 553);
      texture.needsUpdate = true;
    },
    resetPhone() { phone.position.set(...WORKSPACE.anchors.phone); phone.rotation.set(0,0,0); phoneMaterial.map = phoneTextures.home; phoneGlow.color.set('#d4d5d8'); phoneGlow.intensity = 0.07; },
    setHandsVisible(visible) { hands.root.visible = visible; },
    setEntryPower(value) { pendantLight.intensity = 0.85 * value; pendantMaterial.emissiveIntensity = 0.7 * value; ceilingFixture.update(value); },
    setSky(skyState) {
      if (!SKY_CONFIGS[skyState]) return;
      const cfg = SKY_CONFIGS[skyState];
      hemiLight.color.set(cfg.hemi.sky);
      hemiLight.groundColor.set(cfg.hemi.ground);
      hemiLight.intensity = cfg.hemi.intensity;
      moon.color.set(cfg.key.color);
      moonOpen.color.set(cfg.key.color);
      moon.position.set(...cfg.key.position);
      moonOpen.position.set(...cfg.key.position);
      keyConfig.closed = cfg.key.closed;
      keyConfig.open = cfg.key.open;
      keyConfig.windowLight = cfg.windowLight;
      cityLayers[0].material.map = cityTextures[skyState][0];
      cityLayers[1].material.map = cityTextures[skyState][1];
      cityLayers[0].material.needsUpdate = true;
      cityLayers[1].material.needsUpdate = true;
      roomActions.apply();
      options.onShadowNeedsUpdate?.();
    },
    dispose() {
      // Clears its children before the general traversal to avoid double disposal.
      speakerDetails.dispose();
      taskLamp.dispose();
      mouse.dispose();
      ceilingFixture.dispose();
      keyboard.dispose();
      contactGeometry?.dispose();
      const geometries = new Set(), mats = new Set(), textures = new Set(), skeletons = new Set();
      scene.traverse(object => {
        if (object.skeleton) skeletons.add(object.skeleton);
        if (object.geometry) geometries.add(object.geometry);
        if(object.customDepthMaterial)mats.add(object.customDepthMaterial);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => mats.add(m));
        if (object.isLight) object.dispose?.();
      });
      Object.values(phoneTextures).forEach(t => textures.add(t));
      Object.values(cityTextures).forEach(pair => pair.forEach(t => textures.add(t)));
      mats.forEach(m => { for (const value of Object.values(m)) if (value?.isTexture) textures.add(value); m.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
      skeletons.forEach(s => s.dispose());
    },
  };
}
