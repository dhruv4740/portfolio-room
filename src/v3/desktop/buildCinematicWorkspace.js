import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildCinematicRoomInteractions } from './cinematicRoomInteractions.js';
import { buildSeatedFigure } from './buildSeatedFigure.js';
import { seatedHands } from './seatedHands.js';
import { createCinematicSpeakerDetails } from './cinematicSpeakerDetails.js';
import { createAuthoredTaskLamp } from './authoredTaskLamp.js';
import { createAuthoredMouse } from './authoredMouse.js';
import { createAuthoredCeilingFixture } from './authoredCeilingFixture.js';
import { createAuthoredKeyboard } from './authoredKeyboard.js';
import { phoneFocusLockTexture, phoneHomeTexture, SKY_CONFIGS } from './buildWorkspace.js';
import { achievements } from '../content/index.js';
import {
  WORKSPACE, ROOM, DESK, DESK_BOUNDS, MAT, KEYBOARD, KEYBOARD_CHASSIS, CINEMATIC_KEYCAPS,
  SCREEN, MONITOR, CAMERA, BODY, WINDOW, BLINDS, EXTERIOR, ANCHORS, MOUSE_ANCHOR,
  CEILING_FIXTURE_SCALE, KEY_LIGHTS, KEY_TARGET, SPEAKER,
} from './cinematicLayout.js';

// Cinematic room — a replacement environment built at true metre scale.
//
// Adopted on feat/true-scale-room: WorkspaceStage builds this instead of
// buildWorkspace.js. The return shape is the live builder's, key for key.
//
// Every dimension comes from cinematicLayout.js. No literal below restates a
// contract value, and the root group is never scaled: props that are already
// 1.0x (phone, task lamp, mouse, keyboard) keep their real size and only move.

export { WORKSPACE, SCREEN };
export { SKY_CONFIGS };

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
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
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
    ctx.font = '20px monospace'; ctx.fillStyle = '#8e918e'; ctx.fillText('WORKSPACE 01', w - 210, 28);
    ctx.strokeStyle = '#464845'; ctx.lineWidth = 1; ctx.strokeRect(72, 102, 880, 420);
    ctx.fillStyle = '#222426'; ctx.fillRect(73, 103, 878, 44);
    ctx.fillStyle = '#e8e4dc'; ctx.font = '18px monospace'; ctx.fillText('Selected work', 96, 131);
    ctx.fillStyle = '#ff5f1f'; ctx.fillRect(95, 186, 9, 9);
    ctx.fillStyle = '#ece7db'; ctx.font = '48px sans-serif'; ctx.fillText('Things I made.', 95, 256);
    ctx.fillStyle = '#969991'; ctx.font = '20px monospace'; ctx.fillText('Open the machine. Try something.', 97, 302);
    ['01   Desktop projects', '02   Built to be used', '03   Explore the computer'].forEach((label, i) => {
      const y = 366 + i * 53;
      ctx.strokeStyle = '#363a38'; ctx.beginPath(); ctx.moveTo(96, y - 22); ctx.lineTo(924, y - 22); ctx.stroke();
      ctx.fillStyle = '#cccfc5'; ctx.font = '22px monospace'; ctx.fillText(label, 99, y + 8);
      ctx.fillStyle = '#ff5f1f'; ctx.fillText('↗', 887, y + 8);
    });
    ctx.fillStyle = '#666e68'; ctx.font = '16px monospace'; ctx.fillText('DHRUV KOTHARI                                    ENTER ↗', 75, 591);
  }, 1024, 640);
}

// Skyline backdrop. Same authored-impression approach as the live room, but
// the night variant is graded for the composition this study is after: the
// far plane is the cool, low-contrast layer and carries most of the lit
// windows, because the middle-distance block in front of it is modelled
// geometry and supplies the near contrast on its own.
function skylineTexture(state = 'night') {
  return canvasTexture((ctx, w, h) => {
    let seed = 47;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (state === 'day') { sky.addColorStop(0, '#4a78a6'); sky.addColorStop(0.6, '#89acc7'); sky.addColorStop(1, '#c5d8e2'); }
    else if (state === 'dusk') { sky.addColorStop(0, '#23253b'); sky.addColorStop(0.55, '#9c4935'); sky.addColorStop(1, '#c97746'); }
    else { sky.addColorStop(0, '#10161f'); sky.addColorStop(0.55, '#2b3440'); sky.addColorStop(1, '#4a4b48'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    let x = -30;
    while (x < w) {
      const width = 26 + random() * 46;
      const tower = random() > 0.70;
      const height = tower ? 400 + random() * 280 : 170 + random() * 200;
      const roof = h - height;
      ctx.fillStyle = state === 'day' ? (tower ? '#636e73' : '#5c676b')
        : state === 'dusk' ? (tower ? '#393339' : '#40363a') : (tower ? '#2c3138' : '#2f3236');
      ctx.fillRect(x, roof, width, height);
      ctx.fillRect(x + width * 0.15, roof - 7, width * 0.7, 7);
      if (random() > 0.4) ctx.fillRect(x + 9, roof - 20, width * 0.25, 20);
      for (let y = roof + 16; y < h - 12; y += 22) {
        for (let wx = x + 7; wx < x + width - 7; wx += 13) {
          if (random() > 0.44) continue;
          ctx.fillStyle = state === 'day' ? ['#9abacf', '#b4cee0', '#7d9cb3'][Math.floor(random() * 3)]
            : state === 'dusk' ? ['#e8a855', '#d68b3e', '#f2c16b'][Math.floor(random() * 3)]
              : ['#b68b52', '#d3a66a', '#8e775a', '#e0b57b'][Math.floor(random() * 4)];
          ctx.fillRect(wx, y, 5, 9);
        }
      }
      x += width + 6 + random() * 16;
    }
  }, 2048, 1024);
}

export function buildCinematicWorkspace(scene, options = {}) {
  const root = new THREE.Group(); root.name = 'Cinematic workspace'; scene.add(root);
  const interactive = [];
  const materials = {};
  const mat = (name, color, opts = {}) => materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...opts });
  const plaster = mat('plaster', '#7f837f', { roughness: 0.96 });
  const floor = mat('floor', '#4b4e4b', { roughness: 0.94 });
  const dark = mat('graphite', '#24282a', { roughness: 0.38, metalness: 0.42 });
  const black = mat('rubber', '#131718', { roughness: 0.95, metalness: 0 });
  const steel = mat('steel', '#8b8f89', { metalness: 0.92, roughness: 0.32 });
  const bone = mat('bone', '#e4dfce', { roughness: 0.82 });
  const paper = mat('paper', '#e4dfcc', { roughness: 0.98 });
  const wood = mat('oak', '#ffffff', { map: woodTexture(), roughness: 0.52, metalness: 0.02 });
  const bakedMaterials = {};

  // Lightmap UVs are parameterised from ROOM, not from the live room's
  // hardcoded 5 x 3.12 x 3.9 extents. No bake exists for this room yet;
  // afterHours.js would need a new one, and reusing the current bake here is
  // explicitly temporary (see the report).
  const IN = ROOM.interior;
  const span = { x: IN.maxX - IN.minX, y: IN.ceilingY - IN.floorY, z: IN.maxZ - IN.minZ };

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
      const p = geometry.getAttribute('position'), uv = [];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) + position[0], y = p.getY(i) + position[1], z = p.getZ(i) + position[2];
        uv.push(
          surface === 'back' || surface === 'floor' ? (x - IN.minX) / span.x
            : surface === 'left' ? (IN.maxZ - z) / span.z : (z - IN.minZ) / span.z,
          surface === 'floor' ? (IN.maxZ - z) / span.z : (y - IN.floorY) / span.y,
        );
      }
      geometry.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return tag(mesh, id);
  }
  function cylinder(name, radius, height, position, material, top = radius) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, 24), material);
    mesh.name = name; mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); return mesh;
  }
  function rod(name, from, to, radius, material) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mesh = cylinder(name, radius, a.distanceTo(b), a.clone().add(b).multiplyScalar(0.5).toArray(), material);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()); return mesh;
  }
  function cable(points, radius = 0.006) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, radius, 5, false), black); root.add(mesh); return mesh;
  }

  // --- shell -----------------------------------------------------------------
  const T = ROOM.wallThickness, S = ROOM.slabThickness;
  const midX = (IN.minX + IN.maxX) / 2, midZ = (IN.minZ + IN.maxZ) / 2;
  box('Foundation', [span.x + 2 * T + 0.06, 0.14, span.z + 2 * T + 0.06], [midX, -0.10, midZ], dark, 0.03);
  box('Concrete floor', [span.x + 2 * T, 0.06, span.z + 2 * T], [midX, -0.03, midZ], floor, 0.008);
  for (let x = Math.ceil(IN.minX); x <= IN.maxX; x += 0.9)
    box('Floor joint', [0.005, 0.002, span.z], [x, 0.0005, midZ], mat('joint', '#6f6d66'));

  // Window wall, built as four pieces around a real aperture so light and the
  // exterior geometry pass through it.
  const O = WINDOW.opening;
  const wallZ = IN.minZ - T / 2;
  box('Back wall left', [O.minX - IN.minX, span.y, T], [(IN.minX + O.minX) / 2, span.y / 2, wallZ], plaster);
  box('Back wall right', [IN.maxX - O.maxX, span.y, T], [(O.maxX + IN.maxX) / 2, span.y / 2, wallZ], plaster);
  box('Window wall below', [O.maxX - O.minX, O.minY, T], [WINDOW.center[0], O.minY / 2, wallZ], plaster);
  box('Window wall above', [O.maxX - O.minX, IN.ceilingY - O.maxY, T], [WINDOW.center[0], (O.maxY + IN.ceilingY) / 2, wallZ], plaster);
  box('Left wall', [T, span.y, span.z + 2 * T], [IN.minX - T / 2, span.y / 2, midZ], plaster);
  box('Right wall rear', [T, span.y, span.z * 0.62], [IN.maxX + T / 2, span.y / 2, IN.minZ + span.z * 0.31], plaster);
  box('Right wall front', [T, span.y, span.z * 0.16], [IN.maxX + T / 2, span.y / 2, IN.maxZ - span.z * 0.08], plaster);
  box('Doorway header', [T, 0.45, span.z * 0.22], [IN.maxX + T / 2, IN.ceilingY - 0.225, IN.minZ + span.z * 0.73], plaster);
  box('Front wall', [span.x + 2 * T, span.y, T], [midX, span.y / 2, IN.maxZ + T / 2], plaster);
  box('Ceiling', [span.x + 2 * T, S, span.z + 2 * T], [midX, IN.ceilingY + S / 2, midZ], plaster);
  box('Ceiling beam', [0.085, 0.10, span.z], [-0.50, IN.ceilingY - 0.05, midZ], dark);
  box('Back skirting', [span.x, ROOM.skirting.height, ROOM.skirting.depth],
    [midX, ROOM.skirting.height / 2, IN.minZ + ROOM.skirting.depth / 2], dark);
  for (const x of [IN.minX + ROOM.skirting.depth / 2, IN.maxX - ROOM.skirting.depth / 2])
    box('Side skirting', [ROOM.skirting.depth, ROOM.skirting.height, span.z], [x, ROOM.skirting.height / 2, midZ], dark);

  // --- window joinery --------------------------------------------------------
  // Thin sections: the live room's 65 mm jambs and 34 mm mullion read as bars
  // at this opening size. 30 mm jambs and an 18 mm mullion are 8.9% of the
  // opening width in total (checked by the review harness).
  const J = WINDOW.jambSection, R = WINDOW.railSection, revZ = IN.minZ - WINDOW.reveal / 2;
  for (const x of [O.minX + J / 2, O.maxX - J / 2])
    box('Window jamb', [J, O.maxY - O.minY, WINDOW.reveal], [x, WINDOW.center[1], revZ], dark, 0.004, 'window');
  for (const y of [O.minY + R / 2, O.maxY - R / 2])
    box('Window rail', [O.maxX - O.minX, R, WINDOW.reveal], [WINDOW.center[0], y, revZ], dark, 0.004, 'window');
  const mullion = box('Window mullion', [WINDOW.mullionWidth, O.maxY - O.minY - R * 2, 0.026],
    [WINDOW.mullionX, WINDOW.center[1], IN.minZ - 0.013], bone);
  mullion.castShadow = false;

  // Sill: a real slab lapping into the reveal, with a foreground snow ledge.
  const sill = WINDOW.sill;
  box('Window sill', [sill.width, sill.thickness, sill.depth],
    [WINDOW.center[0], sill.topY - sill.thickness / 2, IN.minZ - sill.depth / 2 + sill.projection], bone, 0.006);
  const snow = box('Sill snow', [sill.width - 2 * WINDOW.snow.inset, WINDOW.snow.thickness, sill.depth - WINDOW.snow.inset],
    [WINDOW.center[0], sill.topY + WINDOW.snow.thickness / 2 - 0.004,
      IN.minZ - sill.depth / 2 + sill.projection - WINDOW.snow.inset / 2],
    mat('snow', '#e9eef4', { roughness: 0.88 }), 0.011);
  snow.castShadow = false;

  const blindsGroup = new THREE.Group(); blindsGroup.name = 'Blinds'; root.add(blindsGroup);
  for (let i = 0; i < BLINDS.slats; i++) {
    const slat = box('Venetian blind', [BLINDS.slatWidth, BLINDS.slatThickness, BLINDS.slatDepth],
      [WINDOW.center[0], BLINDS.headY - i * BLINDS.closedPitch, BLINDS.z], bone, 0, 'window');
    slat.rotation.x = BLINDS.closedTilt; slat.castShadow = true; blindsGroup.add(slat);
  }

  // --- exterior --------------------------------------------------------------
  // Three depths, placed against the sightline cone computed in
  // cinematicLayout.sightlineAt(): a near parapet under the cone (visible only
  // when you look down through the glass, so it never occludes the view), one
  // modelled middle-distance block inside the cone, and the far skyline plane.
  const city = new THREE.Group(); city.name = 'Winter city';
  const cityTextures = { night: skylineTexture('night'), dusk: skylineTexture('dusk'), day: skylineTexture('day') };
  const farPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(...EXTERIOR.farCity.size),
    new THREE.MeshBasicMaterial({ map: cityTextures.night, toneMapped: false, fog: false }));
  farPlane.position.set(...EXTERIOR.farCity.center);
  farPlane.raycast = () => {}; tag(farPlane, 'window'); city.add(farPlane);

  const facade = new THREE.MeshStandardMaterial({ color: '#232c35', roughness: 1 });
  const litWindows = new THREE.MeshBasicMaterial({ color: '#c9ab7c', toneMapped: false });
  // Windows are placed on a real metre pitch across the facade, so the window
  // size is what sets the building's apparent scale — not a fraction of
  // whatever the block happens to be. A facade whose windows are a fixed
  // percentage of it can never read as the wrong size, which is exactly how
  // the old 1.8 m block passed every numeric check and still looked wrong.
  function block(center, size, win, lit = 0.45) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(...size), facade);
    b.position.set(...center); city.add(b);
    let seed = 1201;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const cols = Math.max(1, Math.floor((size[0] - win.pitchX * 0.5) / win.pitchX));
    const rows = Math.max(1, Math.floor((size[1] - win.pitchY * 0.5) / win.pitchY));
    const spanX = cols * win.pitchX, spanY = rows * win.pitchY;
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      if (random() > lit) continue;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(win.width, win.height), litWindows);
      pane.position.set(
        center[0] - spanX / 2 + (col + 0.5) * win.pitchX,
        center[1] - spanY / 2 + (row + 0.5) * win.pitchY,
        center[2] + size[2] / 2 + 0.01);
      city.add(pane);
    }
  }
  block(EXTERIOR.midBlock.center, EXTERIOR.midBlock.size, EXTERIOR.midBlock.window);
  // The parapet is a low roof structure, not a tower: a couple of service
  // windows at domestic size, deliberately sparse.
  block(EXTERIOR.nearParapet.center, EXTERIOR.nearParapet.size,
    { width: 0.34, height: 0.42, pitchX: 0.62, pitchY: 0.60 }, 0.35);
  for (const material of [facade, litWindows]) {
    const parts = city.children.filter(o => o.material === material);
    const gs = parts.map(o => { o.updateMatrix(); const g = o.geometry.clone().applyMatrix4(o.matrix); o.removeFromParent(); o.geometry.dispose(); return g; });
    if (gs.length) { const combined = mergeGeometries(gs); gs.forEach(g => g.dispose()); city.add(new THREE.Mesh(combined, material)); }
  }
  city.traverse(o => { if (o.isMesh) { o.castShadow = false; o.raycast = () => {}; } });
  root.add(city);

  // --- desk ------------------------------------------------------------------
  const deskSurface = WORKSPACE.deskSurface, matSurface = WORKSPACE.matSurface;
  const oakDesktop = box('Oak desktop', [DESK.size[0], DESK.thickness, DESK.size[1]],
    [DESK.center[0], DESK.topY - DESK.thickness / 2, DESK.center[1]], wood, DESK.edgeRadius, 'desk');
  const deskBox = new THREE.Box3().setFromObject(oakDesktop);
  box('Desk edge inlay', [DESK.size[0] - 0.06, 0.004, 0.004], [DESK.center[0], DESK.topY - 0.004, DESK_BOUNDS.maxZ - 0.004], dark);
  const legX = [DESK_BOUNDS.minX + DESK.legInset, DESK_BOUNDS.maxX - DESK.legInset];
  const legZ = [DESK_BOUNDS.minZ + DESK.legInset, DESK_BOUNDS.maxZ - DESK.legInset];
  for (const x of legX) {
    for (const z of legZ) box('Steel desk leg', [DESK.legSection, DESK.topY - DESK.thickness, DESK.legSection],
      [x, (DESK.topY - DESK.thickness) / 2, z], dark, 0.006);
    box('Desk foot rail', [DESK.footRailSection, DESK.footRailSection, legZ[1] - legZ[0] + DESK.footRailSection],
      [x, DESK.footRailSection / 2 + 0.008, DESK.center[1]], dark, 0.006);
  }
  box('Rear stretcher', [legX[1] - legX[0], 0.05, 0.03], [DESK.center[0], DESK.stretcherY, legZ[0]], dark);
  box('Felt desk mat', [MAT.size[0], MAT.thickness, MAT.size[1]],
    [MAT.center[0], MAT.topY - MAT.thickness / 2, MAT.center[1]], mat('felt', '#2c312f'), MAT.radius, 'desk');

  // --- monitor ---------------------------------------------------------------
  box('Monitor foot', MONITOR.footSize, [MONITOR.footCenter[0], DESK.topY + MONITOR.footSize[1] / 2, MONITOR.footCenter[2]], steel, 0.012, 'monitor');
  box('Monitor stand', [MONITOR.standSection[0], MONITOR.standHeight, MONITOR.standSection[1]], MONITOR.standCenter, steel, 0.009, 'monitor');
  const monitorEnclosure = box('Monitor enclosure', MONITOR.enclosureSize, MONITOR.enclosureCenter, dark, 0.018, 'monitor');
  const displayMaterial = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.width, SCREEN.height), displayMaterial);
  display.name = 'Interactive monitor screen'; display.position.set(...SCREEN.center);
  root.add(display); tag(display, 'monitor');
  const monitorScreenBox = new THREE.Box3().setFromObject(display);
  const monitorBezelBox = new THREE.Box3().setFromObject(monitorEnclosure);
  box('Monitor chin', [SCREEN.width, MONITOR.chin, 0.010],
    [0, SCREEN.center[1] - SCREEN.height / 2 - MONITOR.chin / 2, SCREEN.center[2] + 0.001], dark, 0.003, 'monitor');
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff5f1f' }));
  led.position.set(SCREEN.width / 2 - 0.02, SCREEN.center[1] - SCREEN.height / 2 - MONITOR.chin / 2, SCREEN.center[2] + 0.004);
  root.add(led);
  cable([[0, MONITOR.enclosureBottomY, SCREEN.center[2] - 0.06], [0.06, DESK.topY - 0.02, -0.46],
    [0.42, DESK.topY - 0.06, -0.48], [0.70, 0.30, -0.50]]);

  // --- keyboard --------------------------------------------------------------
  // 92 instanced caps at the transformed layout. The uniform 0.44/0.48 scale is
  // baked into the instance matrices, so the authored cap geometry that
  // createAuthoredKeyboard swaps in is scaled by the same amount as the
  // chassis, and instanceId -> KEY_ROWS -> setKey is untouched.
  const keyboardFallback = new THREE.Group(); keyboardFallback.name = 'Keyboard fallback'; root.add(keyboardFallback);
  keyboardFallback.add(box('Keyboard case', [KEYBOARD.caseWidth, 0.032 * KEYBOARD.scale, 0.185 * KEYBOARD.scale],
    [KEYBOARD.center[0], KEYBOARD.restY + 0.016 * KEYBOARD.scale, KEYBOARD.center[1]], bone, 0.008, 'desk'));
  const keyGeometry = new RoundedBoxGeometry(0.0211, 0.0210, 0.0219, 2, 0.0018);
  const keys = new THREE.InstancedMesh(keyGeometry, mat('keycaps', '#d3d0c3'), CINEMATIC_KEYCAPS.length);
  const transform = new THREE.Object3D(), keyColor = new THREE.Color();
  CINEMATIC_KEYCAPS.forEach((cap, i) => {
    transform.position.set(...cap.p);
    transform.scale.set(cap.w * KEYBOARD.scale, KEYBOARD.scale, KEYBOARD.scale);
    transform.updateMatrix(); keys.setMatrixAt(i, transform.matrix);
    keys.setColorAt(i, keyColor.set(cap.esc ? '#ff5f1f' : '#ffffff'));
  });
  keys.castShadow = false; root.add(keys); tag(keys, 'keyboard');

  const mouseFallback = new THREE.Group(); mouseFallback.name = 'Mouse fallback'; root.add(mouseFallback);
  mouseFallback.add(box('Mouse', [0.066, 0.038, 0.124], [ANCHORS.mouse[0], MAT.topY + 0.019, ANCHORS.mouse[2]], bone, 0.020));
  mouseFallback.add(box('Mouse wheel', [0.008, 0.006, 0.016], [ANCHORS.mouse[0], MAT.topY + 0.039, ANCHORS.mouse[2] - 0.026], dark, 0.002));

  // --- phone -----------------------------------------------------------------
  const phone = new THREE.Group(); phone.name = 'Animated phone';
  phone.position.set(...ANCHORS.phone); root.add(phone);
  const phoneSize = WORKSPACE.phoneSize;
  const phoneBody = new THREE.Mesh(new RoundedBoxGeometry(phoneSize.width, phoneSize.depth, phoneSize.height, 2, 0.004), dark);
  phoneBody.position.y = -phoneSize.depth * 0.5; phone.add(phoneBody); tag(phoneBody, 'phone');
  const phoneTextures = { home: phoneHomeTexture(), hover: phoneHomeTexture(true), focuslock: phoneFocusLockTexture() };
  const phoneMaterial = new THREE.MeshBasicMaterial({ map: phoneTextures.home, toneMapped: false });
  const phoneDisplay = new THREE.Mesh(new THREE.PlaneGeometry(phoneSize.width - 0.006, phoneSize.height - 0.012), phoneMaterial);
  phoneDisplay.rotation.x = -Math.PI / 2; phoneDisplay.position.y = 0.0004; phone.add(phoneDisplay); tag(phoneDisplay, 'phone');
  const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.001, 0.0015), black);
  earpiece.position.set(0, 0.0005, -phoneSize.height * 0.5 + 0.004); phone.add(earpiece); tag(earpiece, 'phone');
  const phoneGlow = new THREE.Object3D(); phoneGlow.color = new THREE.Color('#d4d5d8'); phoneGlow.intensity = 0.07;
  phoneGlow.position.set(ANCHORS.phone[0], ANCHORS.phone[1] + 0.05, ANCHORS.phone[2]); root.add(phoneGlow);

  // --- notebook --------------------------------------------------------------
  const nb = ANCHORS.notebook;
  const book = box('Notebook cover', [0.29, 0.015, 0.36], [nb[0], DESK.topY + 0.0075, nb[2]], mat('cover', '#3e4942'), 0.005, 'notebook');
  book.rotation.y = -0.04;
  const pages = box('Notebook pages', [0.275, 0.010, 0.345], [nb[0], DESK.topY + 0.019, nb[2]], paper, 0.002, 'notebook');
  pages.rotation.y = -0.04;
  const notes = canvasTexture(drawBlankPage, 1400, 1800);
  const notePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.321), new THREE.MeshStandardMaterial(
    { map: notes, roughness: 0.98, emissive: '#ffffff', emissiveMap: notes, emissiveIntensity: 0.34 }));
  notePlane.rotation.set(-Math.PI / 2, 0, -0.04);
  notePlane.position.set(nb[0], DESK.topY + 0.0245, nb[2]); root.add(notePlane); tag(notePlane, 'notebook');
  const notebook = new THREE.Group(); notebook.position.set(...nb); root.add(notebook);
  for (const part of [book, pages, notePlane]) {
    part.position.sub(notebook.position); part.castShadow = false; notebook.add(part);
  }

  // --- task lamp fallback, books ---------------------------------------------
  const lampAnchor = ANCHORS.lamp;
  const lampFallback = new THREE.Group(); lampFallback.name = 'Task lamp fallback'; root.add(lampFallback);
  lampFallback.add(cylinder('Lamp base', 0.075, 0.022, [lampAnchor[0], DESK.topY + 0.011, lampAnchor[2]], dark));
  lampFallback.add(rod('Lamp lower arm', [lampAnchor[0], DESK.topY + 0.02, lampAnchor[2]], [lampAnchor[0] - 0.07, DESK.topY + 0.33, lampAnchor[2] + 0.03], 0.011, dark));
  lampFallback.add(rod('Lamp upper arm', [lampAnchor[0] - 0.07, DESK.topY + 0.33, lampAnchor[2] + 0.03], [lampAnchor[0] + 0.14, DESK.topY + 0.49, lampAnchor[2] + 0.05], 0.011, dark));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.088, 0.095, 32, 1, true), dark);
  shade.position.set(lampAnchor[0] + 0.15, DESK.topY + 0.455, lampAnchor[2] + 0.05); shade.rotation.z = -0.3; lampFallback.add(shade);
  const bulb = new THREE.SpotLight('#ffe4b1', 1.85, 1.9, 0.8, 0.7, 2);
  bulb.castShadow = true; bulb.shadow.mapSize.set(512, 512);
  bulb.shadow.camera.near = 0.02; bulb.shadow.camera.far = 2; bulb.shadow.bias = -0.0002; bulb.shadow.normalBias = 0.001;
  bulb.position.set(lampAnchor[0] + 0.15, DESK.topY + 0.41, lampAnchor[2] + 0.05);
  bulb.target.position.set(lampAnchor[0] + 0.15, DESK.topY, lampAnchor[2] + 0.05);
  bulb.userData.onIntensity = 1.85; root.add(bulb, bulb.target);
  const lampInterior = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), new THREE.MeshBasicMaterial({ color: '#d6a26b' }));
  lampInterior.rotation.x = Math.PI / 2;
  lampInterior.position.set(lampAnchor[0] + 0.15, DESK.topY + 0.408, lampAnchor[2] + 0.05); lampFallback.add(lampInterior);

  for (let i = 0; i < 3; i++) {
    const width = 0.30 - i * 0.016, y = DESK.topY + 0.017 + i * 0.034;
    const cover = [bone, dark, mat('bookTaupe', '#858070')][i];
    box('Book page block', [width - 0.008, 0.026, 0.205], [-0.66, y, 0.17], paper, 0.002, 'desk');
    for (const dy of [-0.015, 0.015]) box('Book cover', [width, 0.003, 0.212], [-0.66, y + dy, 0.17], cover, 0.001, 'desk');
    box('Book spine', [0.006, 0.033, 0.212], [-0.66 - width * 0.5 + 0.003, y, 0.17], cover, 0.002, 'desk');
  }

  // --- speakers, tower, chair ------------------------------------------------
  // Cabinets come from SPEAKER, the same export the driver fronts are derived
  // from, so the two cannot drift apart.
  for (const x of SPEAKER.x) box('Nearfield speaker', SPEAKER.size, [x, SPEAKER.centerY, SPEAKER.z], dark, 0.012);
  // The live createSpeakerDetails() is not called: its driver fronts are
  // authored in absolute world coordinates for the live room's .18 x .28 x .16
  // cabinets, so at true scale they neither land nor fit. The cinematic set
  // re-expresses the same profiles against SPEAKER.
  const speakerDetails = createCinematicSpeakerDetails();
  root.add(speakerDetails.root);
  box('Workstation tower', [0.20, 0.40, 0.40], [0.66, 0.20, -0.30], dark, 0.015);
  for (let i = 0; i < 12; i++) box('Tower vent', [0.14, 0.006, 0.006], [0.66, 0.11 + i * 0.017, -0.10], black);

  const chair = BODY.chair;
  box('Chair seat', [0.46, 0.05, 0.44], [chair[0], BODY.seatTopY - 0.025, chair[2]], wood, 0.035, 'chair');
  for (const dx of [-0.17, 0.19]) {
    rod('Chair front leg', [chair[0] + dx, 0.01, chair[2] - 0.17], [chair[0] + dx, BODY.seatTopY - 0.03, chair[2] - 0.16], 0.014, dark);
    rod('Chair rear leg', [chair[0] + dx, 0.01, chair[2] + 0.20], [chair[0] + dx, BODY.seatTopY + 0.44, chair[2] + 0.14], 0.014, dark);
  }
  const chairBackY = BODY.seatTopY + 0.38;
  box('Chair back', [0.44, 0.22, 0.035], [chair[0], chairBackY, chair[2] + 0.16], wood, 0.03, 'chair');
  for (let i = 0; i < 7; i++) box('Chair back slot', [0.019, 0.14, 0.004], [chair[0] - 0.11 + i * 0.049, chairBackY, chair[2] + 0.18], dark, 0.006);

  // --- lighting --------------------------------------------------------------
  // Night composition: a warm working pool at the desk, one cool key through
  // the window, and no fill in the corners. Only the key casts shadows.
  const hemiLight = new THREE.HemisphereLight('#8294b2', '#21160e', 0.42);
  scene.add(hemiLight);
  const moon = new THREE.DirectionalLight('#8eadd8', 1.15);
  moon.position.set(...KEY_LIGHTS.night.position); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  // Bounds hold the room for all three key directions, not just night: the
  // dusk key is the shallowest and needs the widest box. Sized from the room
  // diagonal rather than tuned to one direction.
  Object.assign(moon.shadow.camera, { left: -3.0, right: 3.0, top: 3.0, bottom: -1.6, near: 0.3, far: 12 });
  moon.shadow.bias = -0.00018;
  moon.target.position.set(...KEY_TARGET); scene.add(moon, moon.target);
  const moonOpen = moon.clone(); moonOpen.intensity = 0; moonOpen.position.copy(moon.position); moonOpen.target = moon.target;
  moonOpen.shadow = moon.shadow.clone(); moonOpen.shadow.camera.userData.blindsOpen = true; scene.add(moonOpen);
  const windowLight = new THREE.PointLight('#9ab8d6', 0, 2.2, 2);
  windowLight.position.set(WINDOW.center[0], WINDOW.center[1], IN.minZ + 0.10); root.add(windowLight);
  const keyConfig = { closed: 1.15, open: 1.60, windowLight: 0.55 };
  // Each slat's depth-only shader supplies the open pose, so both shadow maps
  // bake from one update. rowOffset follows the new pitch difference.
  const openDelta = BLINDS.closedPitch - BLINDS.openPitch;
  blindsGroup.children.forEach((slat, i) => {
    const pose = { value: 0 };
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    depth.onBeforeCompile = shader => {
      shader.uniforms.openPose = pose; shader.uniforms.rowOffset = { value: i * openDelta };
      shader.vertexShader = 'uniform float openPose; uniform float rowOffset;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float a=${(BLINDS.openTilt - BLINDS.closedTilt).toFixed(5)}*openPose;float c=cos(a),s=sin(a);
        transformed.yz=mat2(c,s,-s,c)*position.yz;
        transformed.y += openPose*rowOffset;`);
    };
    slat.customDepthMaterial = depth;
    slat.onBeforeShadow = (_r, _o, _c, shadowCamera) => { pose.value = shadowCamera.userData.blindsOpen ? 1 : 0; };
  });

  // Pendant, hung off a rose in the ceiling slab.
  const ceilingAnchor = ANCHORS.ceilingFixture;
  cylinder('Ceiling rose', 0.062, 0.018, [ceilingAnchor[0], IN.ceilingY - 0.009, ceilingAnchor[2]], dark);
  const pendantFallback = new THREE.Group(); pendantFallback.name = 'Pendant fallback'; root.add(pendantFallback);
  pendantFallback.add(rod('Pendant cord', [ceilingAnchor[0], IN.ceilingY, ceilingAnchor[2]], [ceilingAnchor[0], IN.ceilingY - 0.34, ceilingAnchor[2]], 0.005, black));
  pendantFallback.add(cylinder('Pendant socket', 0.023, 0.056, [ceilingAnchor[0], IN.ceilingY - 0.36, ceilingAnchor[2]], dark));
  const pendantMaterial = new THREE.MeshStandardMaterial({ color: '#ad8860', emissive: '#e0ac68', emissiveIntensity: 0.7 });
  const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 12), pendantMaterial);
  pendant.position.set(ceilingAnchor[0], IN.ceilingY - 0.41, ceilingAnchor[2]); pendant.scale.y = 1.35;
  pendantFallback.add(pendant);
  const ceilingFixture = createAuthoredCeilingFixture({
    root, fallback: pendantFallback,
    position: [ceilingAnchor[0], IN.ceilingY - 0.012, ceilingAnchor[2]],
    onReady: () => { options.onShadowNeedsUpdate?.(); },
  });
  // Measured in the first render: the Poly Haven pendant exports at
  // 0.550 x 0.888 x 0.550 m, sized for the live room's 3.12 m ceiling. Hung
  // unchanged from a 2.60 m one its underside lands at y = 1.699 — below
  // standing head height, directly over the desk's front edge, and it
  // dominates the overview frame. The helper takes no scale parameter and is
  // not edited here, so the mount is scaled instead; the asset is added as its
  // child and inherits it, and the origin is the top of the chain so the
  // fixture stays pinned to the rose. The fallback hangs off `root`, not the
  // mount, and is already short enough to leave alone.
  ceilingFixture.mount.scale.setScalar(CEILING_FIXTURE_SCALE);
  const pendantLight = new THREE.Object3D(); pendantLight.intensity = 0.85;
  pendantLight.position.copy(pendant.position); root.add(pendantLight);

  // --- lighting FX -----------------------------------------------------------
  const fx = new THREE.Group(); fx.name = 'Lighting FX';
  const poolTexture = canvasTexture((ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.4, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, 128, 128);
  function glowDecal(name, size, position, rotationX, color, opacity) {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), new THREE.MeshBasicMaterial(
      { map: poolTexture, color, transparent: true, opacity, depthWrite: false, toneMapped: false }));
    decal.name = name; decal.position.set(...position); decal.rotation.x = rotationX; decal.renderOrder = 2;
    fx.add(decal); return decal;
  }
  function contactShadow(name, size, position) {
    const tex = canvasTexture((ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }, 128, 128);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial(
      { map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    decal.name = name; decal.rotation.x = -Math.PI / 2; decal.position.set(...position); decal.renderOrder = 1;
    fx.add(decal); return decal;
  }
  const lampPool = glowDecal('Lamp pool', 0.30, [lampAnchor[0] + 0.15, DESK.topY + 0.002, lampAnchor[2] + 0.06], -Math.PI / 2, '#ffb35c', 0.38);
  glowDecal('Screen spill', 0.38, [0, DESK.topY + 0.003, 0.02], -Math.PI / 2, '#b6d8ff', 0.24);
  const screenGlow = new THREE.PointLight('#b6d8ff', 1.1, 1.05, 2);
  screenGlow.position.set(0, SCREEN.center[1] - 0.12, SCREEN.center[2] + 0.14); fx.add(screenGlow);
  const edgeSpill = glowDecal('Screen desk edge', 0.32, [0, DESK.topY - 0.017, DESK_BOUNDS.maxZ], 0, '#b6d8ff', 0.23);
  edgeSpill.scale.y = 0.1;
  for (const x of legX) for (const z of legZ) contactShadow('Leg contact', [0.14, 0.14], [x, 0.002, z]);
  contactShadow('Chair contact', [0.52, 0.52], [chair[0], 0.002, chair[2]]);
  contactShadow('Tower contact', [0.32, 0.32], [0.66, 0.002, -0.30]);
  contactShadow('Monitor contact', [0.34, 0.24], [0, DESK.topY + 0.002, MONITOR.footCenter[2]]);
  const cornerShadow = new THREE.Mesh(new THREE.PlaneGeometry(span.x, 0.34), new THREE.MeshBasicMaterial(
    { color: '#000000', transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false }));
  cornerShadow.rotation.x = -Math.PI / 2; cornerShadow.position.set(midX, 0.002, IN.minZ + 0.17);
  cornerShadow.renderOrder = 1; fx.add(cornerShadow);

  // --- batching --------------------------------------------------------------
  const contactNames = new Set(['Keyboard case', 'Book page block', 'Book cover', 'Book spine', 'Nearfield speaker', 'Monitor foot', 'Monitor stand']);
  const contactParts = []; root.updateMatrixWorld(true);
  for (const mesh of root.children) {
    if (!mesh.isMesh || !contactNames.has(mesh.name)) continue;
    const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(mesh.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
    contactParts.push(g);
  }
  const contactGeometry = contactParts.length ? mergeGeometries(contactParts, false) : null;
  contactParts.forEach(g => g.dispose());

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
    if (!geometry) throw new Error('Could not prepare cinematic workspace geometry');
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.name = batch.id || 'Workspace architecture';
    mesh.castShadow = batch.castShadow; mesh.receiveShadow = true;
    root.add(mesh); tag(mesh, batch.id);
  }
  root.add(fx);

  // --- interactions and authored assets --------------------------------------
  const roomActions = buildCinematicRoomInteractions({
    root, materials: { bone, dark, wood, paper }, canvasTexture, anchors: ANCHORS, achievements,
    bulb, lampInterior, lampPool, moon, moonOpen, blindsGroup, keys, keyConfig, windowLight,
  });
  const taskLamp = createAuthoredTaskLamp({
    root, fallback: lampFallback, bulb, pool: lampPool, desktop: deskSurface,
    onReady: () => { roomActions.apply(); options.onShadowNeedsUpdate?.(); },
  });
  // The helper derives only Y and Z from `desktop`; its clamp X is hardcoded to
  // the live room's -1.28, which is 380 mm past this desk's left edge (-0.90)
  // and would hang the lamp in mid-air. The helper is not edited during the
  // hand repair, so the mount is corrected here, on this room's left rear edge.
  const lampMount = root.getObjectByName('Authored task lamp');
  if (lampMount) lampMount.position.x = ANCHORS.lamp[0];
  const keyboard = createAuthoredKeyboard({
    root, keys, fallback: keyboardFallback,
    position: KEYBOARD_CHASSIS.position,
    // The helper places the chassis but takes no scale, and it must not be
    // edited during the hand repair. Scale it here once it has been added.
    onReady: () => {
      // The fallback's case carries the same name but lives inside the
      // fallback group, so match on the direct child of root.
      const chassis = root.children.find(o => o.isMesh && o.name === 'Keyboard case');
      if (chassis) chassis.scale.setScalar(KEYBOARD_CHASSIS.scale);
      options.onShadowNeedsUpdate?.();
    },
  });
  const mouse = createAuthoredMouse({
    root, fallback: mouseFallback, anchor: MOUSE_ANCHOR,
    onReady: () => { options.onShadowNeedsUpdate?.(); },
  });

  // The hand rig is authored in this room's coordinates (seatedHands.js). The
  // seated figure is still modelled in the old room's, so its root maps the old
  // shoulders (0.05, 1.40, 1.23) onto BODY.shoulderMidpoint with the floor fixed.
  const hands = seatedHands(); root.add(hands.root); hands.root.visible = true;
  const figure = buildSeatedFigure(); root.add(figure.root);
  const FIG_XZ = 0.9, FIG_Y = BODY.shoulderMidpoint[1] / 1.40;
  figure.root.scale.set(FIG_XZ, FIG_Y, FIG_XZ);
  figure.root.position.set(BODY.shoulderMidpoint[0] - FIG_XZ * 0.05, 0, BODY.shoulderMidpoint[2] - FIG_XZ * 1.23);

  return {
    // Old-room lightmaps and trim do not fit this geometry; afterHours skips them.
    cinematic: true,
    // Rain falls just outside this room's window (afterHours reads this).
    rainVolume: { x: [WINDOW.opening.minX - 0.6, WINDOW.opening.maxX + 2.5], z: [WINDOW.wallZ - 0.35, WINDOW.wallZ - 3.55] },
    // One line of live GitHub activity under the "Selected work" panel.
    setGithubActivity(line) {
      const texture = displayMaterial.map, ctx = texture.image.getContext('2d');
      ctx.fillStyle = '#152028'; ctx.fillRect(72, 530, 900, 34);
      ctx.fillStyle = '#3ecf8e'; ctx.beginPath(); ctx.arc(82, 547, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9ea39f'; ctx.font = '17px monospace';
      ctx.fillText(`GITHUB  ${line}`.slice(0, 84), 96, 553);
      texture.needsUpdate = true;
    },
    root, interactive, materials, bakedMaterials, city, bulb, hemiLight, contactGeometry,
    taskLamp, mouse, ceilingFixture, keyboard,
    contactSurfaces: { desk: deskSurface, mat: matSurface },
    hands, phone, phoneGlow, phoneDisplay, notebook, figure, roomActions, keys,
    staticBoxes: { monitorScreen: monitorScreenBox, monitorBezel: monitorBezelBox, desk: deskBox },
    notePage: notePlane, notes,
    clearNotes() { const c = notes.image; drawBlankPage(c.getContext('2d'), c.width, c.height); notes.needsUpdate = true; },
    resetNotebook() { notebook.position.set(...ANCHORS.notebook); notebook.rotation.set(0, 0, 0); },
    setPhoneScreen(name) { phoneMaterial.map = phoneTextures[name]; },
    resetPhone() {
      phone.position.set(...ANCHORS.phone); phone.rotation.set(0, 0, 0);
      phoneMaterial.map = phoneTextures.home; phoneGlow.color.set('#d4d5d8'); phoneGlow.intensity = 0.07;
    },
    setHandsVisible(visible) { hands.root.visible = visible; },
    setEntryPower(value) {
      pendantLight.intensity = 0.85 * value;
      pendantMaterial.emissiveIntensity = 0.7 * value;
      ceilingFixture.update(value);
    },
    setSky(skyState) {
      if (!SKY_CONFIGS[skyState]) return;
      const cfg = SKY_CONFIGS[skyState];
      hemiLight.color.set(cfg.hemi.sky);
      hemiLight.groundColor.set(cfg.hemi.ground);
      hemiLight.intensity = cfg.hemi.intensity;
      moon.color.set(cfg.key.color); moonOpen.color.set(cfg.key.color);
      // cfg.key.position is deliberately NOT used: those are live-room
      // coordinates. KEY_LIGHTS supplies a position per state whose ray passes
      // through the aperture. Both keys share one target, so moving them keeps
      // the open/closed shadow pair consistent.
      const key = KEY_LIGHTS[skyState];
      if (key) { moon.position.set(...key.position); moonOpen.position.set(...key.position); }
      keyConfig.closed = cfg.key.closed; keyConfig.open = cfg.key.open; keyConfig.windowLight = cfg.windowLight;
      farPlane.material.map = cityTextures[skyState];
      farPlane.material.needsUpdate = true;
      roomActions.apply();
      options.onShadowNeedsUpdate?.();
    },
    dispose() {
      speakerDetails.dispose();
      taskLamp.dispose(); mouse.dispose(); ceilingFixture.dispose(); keyboard.dispose();
      contactGeometry?.dispose();
      const geometries = new Set(), mats = new Set(), textures = new Set(), skeletons = new Set();
      scene.traverse(object => {
        if (object.skeleton) skeletons.add(object.skeleton);
        if (object.geometry) geometries.add(object.geometry);
        if (object.customDepthMaterial) mats.add(object.customDepthMaterial);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => mats.add(m));
        if (object.isLight) object.dispose?.();
      });
      Object.values(phoneTextures).forEach(t => textures.add(t));
      Object.values(cityTextures).forEach(t => textures.add(t));
      mats.forEach(m => { for (const value of Object.values(m)) if (value?.isTexture) textures.add(value); m.dispose(); });
      geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose());
      skeletons.forEach(s => s.dispose());
    },
  };
}
