// Offline geometry review for the cinematic room candidate.
//
//   node scripts/review-cinematic-room-geometry.mjs
//
// Needs no GPU, no browser, no dev server and no Vite config change: it imports
// src/v3/desktop/cinematicLayout.js directly and checks the contract and the
// window sightlines as arithmetic. This exists so the composition can be
// argued from numbers while the build/browser slot is held by Codex.
//
// Exit code is 1 if any CHECK fails.

import {
  ROOM, DESK, DESK_BOUNDS, MAT, KEYBOARD, KEYBOARD_SOURCE, CINEMATIC_KEYCAPS,
  SCREEN, MONITOR, CAMERA, BODY, WINDOW, BLINDS, EXTERIOR, ANCHORS,
  sightlineAt, windowVisibilityBand, horizontalHalfAngle,
} from '../src/v3/desktop/cinematicLayout.js';

let failures = 0;
const m = (v) => (typeof v === 'number' ? v.toFixed(4) : v);
const line = (label, value, note = '') => console.log(`  ${label.padEnd(38)} ${String(m(value)).padStart(10)}  ${note}`);
function check(label, ok, detail = '') {
  console.log(`  [${ok ? ' ok ' : 'FAIL'}] ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

console.log('\n== contract, as built ==');
line('desk top Y', DESK.topY, 'contract .740');
line('desk size', `${DESK.size[0]} x ${DESK.size[1]}`, 'contract 1.80 x .80');
line('desk x span', `${m(DESK_BOUNDS.minX)}..${m(DESK_BOUNDS.maxX)}`);
line('desk z span', `${m(DESK_BOUNDS.minZ)}..${m(DESK_BOUNDS.maxZ)}`);
line('mat top Y', MAT.topY, 'contract .749');
line('screen size', `${SCREEN.width} x ${SCREEN.height}`, `aspect ${m(SCREEN.width / SCREEN.height)}`);
line('screen centre Y', SCREEN.center[1], 'contract 1.085');
line('ceiling Y', ROOM.interior.ceilingY, 'contract ~2.6');
line('seated eye Y', CAMERA.seated.position[1], 'contract 1.23');
line('eye above desk top', CAMERA.seated.position[1] - DESK.topY, 'real seated 0.47-0.52');
line('shoulder Y', BODY.shoulderMidpoint[1], 'contract 1.10');
line('seat top Y', BODY.seatTopY, 'contract 0.45');

check('screen is 16:9', near(SCREEN.width / SCREEN.height, 16 / 9, 0.001));
check('monitor stand has positive height', MONITOR.standHeight > 0.02,
  `stand ${m(MONITOR.standHeight)} m between desk foot and enclosure`);
check('mat inside desk footprint',
  MAT.center[0] - MAT.size[0] / 2 > DESK_BOUNDS.minX && MAT.center[0] + MAT.size[0] / 2 < DESK_BOUNDS.maxX &&
  MAT.center[1] - MAT.size[1] / 2 > DESK_BOUNDS.minZ && MAT.center[1] + MAT.size[1] / 2 < DESK_BOUNDS.maxZ,
  `mat z ${m(MAT.center[1] - MAT.size[1] / 2)}..${m(MAT.center[1] + MAT.size[1] / 2)} vs desk front ${m(DESK_BOUNDS.maxZ)}`);
check('monitor foot on the desk, clear of the mat',
  MONITOR.footCenter[2] + MONITOR.footSize[2] / 2 < MAT.center[1] - MAT.size[1] / 2);
// createAuthoredTaskLamp hardcodes its clamp X and only derives Y/Z from the
// desk, so the builder overrides X with ANCHORS.lamp[0]. Both have to be on
// the desk or the lamp hangs in mid-air.
check('lamp clamp is on the desk',
  ANCHORS.lamp[0] > DESK_BOUNDS.minX && ANCHORS.lamp[0] < DESK_BOUNDS.maxX &&
  ANCHORS.lamp[2] > DESK_BOUNDS.minZ && ANCHORS.lamp[2] < DESK_BOUNDS.maxZ,
  `clamp x ${m(ANCHORS.lamp[0])} z ${m(ANCHORS.lamp[2])}; the helper's own -1.28 is off the desk`);
check('lamp clamp z matches what the helper derives',
  near(ANCHORS.lamp[2], DESK.center[1] - DESK.size[1] / 2 + 0.010, 1e-9));

console.log('\n== keyboard, transformed not re-exported ==');
const xs = CINEMATIC_KEYCAPS.map((k) => k.p[0]);
const ys = CINEMATIC_KEYCAPS.map((k) => k.p[1]);
const zs = CINEMATIC_KEYCAPS.map((k) => k.p[2]);
const srcYs = [...new Set(CINEMATIC_KEYCAPS.map((_, i) => i))].length;
line('cap count', CINEMATIC_KEYCAPS.length, 'must stay 92 for instanceId/setKey');
line('uniform scale applied', KEYBOARD.scale, `${KEYBOARD_SOURCE.exportedCaseWidth} -> ${KEYBOARD.caseWidth} m`);
line('cap centre x span', `${m(Math.min(...xs))}..${m(Math.max(...xs))}`);
line('cap centre z span', `${m(Math.min(...zs))}..${m(Math.max(...zs))}`);
line('cap centre y span', `${m(Math.min(...ys))}..${m(Math.max(...ys))}`);
line('board height to home row', KEYBOARD.bodyHeightToHomeRow);
line('home-row top, derived', KEYBOARD.homeRowTop, 'contract .785');
line('residual vs contract', KEYBOARD.homeRowTopResidual, 'reported, not absorbed');
line('live float removed', KEYBOARD.removedLiveFloat, 'board was hovering over the mat');

check('92 caps preserved', CINEMATIC_KEYCAPS.length === 92 && srcYs === 92);
check('home-row top within 2 mm of contract', Math.abs(KEYBOARD.homeRowTopResidual) < 0.002,
  `${m(KEYBOARD.homeRowTop)} vs .785`);
check('keyboard sits on the felt, no float',
  near(Math.min(...ys) - KEYBOARD.restY, (1.22437 - KEYBOARD_SOURCE.exportedChassisOriginY) * KEYBOARD.scale, 1e-6));
check('keyboard inside the mat',
  Math.min(...xs) > MAT.center[0] - MAT.size[0] / 2 && Math.max(...xs) < MAT.center[0] + MAT.size[0] / 2 &&
  Math.min(...zs) > MAT.center[1] - MAT.size[1] / 2 && Math.max(...zs) < MAT.center[1] + MAT.size[1] / 2);
check('mouse clear of the keyboard and on the mat',
  ANCHORS.mouse[0] - 0.037 > Math.max(...xs) + 0.012 &&
  ANCHORS.mouse[0] + 0.037 < MAT.center[0] + MAT.size[0] / 2,
  `mouse x ${m(ANCHORS.mouse[0] - 0.037)}..${m(ANCHORS.mouse[0] + 0.037)}, caps end ${m(Math.max(...xs))}`);

console.log('\n== window visibility from the fixed seated camera ==');
const band = windowVisibilityBand();
line('horizontal half-angle (16:9)', (horizontalHalfAngle() * 180) / Math.PI, 'degrees, fov 56');
line('monitor right edge grazes x', band.clearOfMonitor, 'at the window wall');
line('frustum right edge reaches x', band.insideFrustum, 'at the window wall');
line('aperture x', `${band.apertureMinX}..${band.apertureMaxX}`);
line('margin left of aperture', band.leftMargin, 'clear of the monitor');
line('margin right of aperture', band.rightMargin, 'inside frame');
check('aperture sits inside the visible band', band.ok);

// Vertical: how much of the opening the seated frame actually contains.
const [ecx, ecy, ecz] = CAMERA.seated.position;
const pitch = Math.atan2(CAMERA.seated.target[1] - ecy,
  Math.hypot(CAMERA.seated.target[0] - ecx, CAMERA.seated.target[2] - ecz));
const halfV = (CAMERA.fov * Math.PI) / 180 / 2;
const wallDist = ecz - WINDOW.wallZ;
const visTop = ecy + Math.tan(pitch + halfV) * wallDist;
const visBottom = ecy + Math.tan(pitch - halfV) * wallDist;
line('frame covers wall Y', `${m(visBottom)}..${m(visTop)}`);
line('aperture Y', `${WINDOW.opening.minY}..${WINDOW.opening.maxY}`);
const visibleHeight = Math.min(visTop, WINDOW.opening.maxY) - Math.max(visBottom, WINDOW.opening.minY);
line('visible opening height', visibleHeight, `of ${m(WINDOW.opening.maxY - WINDOW.opening.minY)} m`);
check('more than half the opening is in frame',
  visibleHeight > (WINDOW.opening.maxY - WINDOW.opening.minY) * 0.5);
check('the sill is in frame', visBottom < WINDOW.sill.topY);

console.log('\n== exterior, against the sightline cone ==');
for (const [name, block] of Object.entries({
  nearParapet: EXTERIOR.nearParapet, midBlock: EXTERIOR.midBlock,
})) {
  const front = block.center[2] + block.size[2] / 2;
  const cone = sightlineAt(front);
  const bx = [block.center[0] - block.size[0] / 2, block.center[0] + block.size[0] / 2];
  const by = [block.center[1] - block.size[1] / 2, block.center[1] + block.size[1] / 2];
  console.log(`  ${name} front face z=${m(front)}`);
  line('  cone x at that depth', `${m(cone.minX)}..${m(cone.maxX)}`);
  line('  cone y at that depth', `${m(cone.minY)}..${m(cone.maxY)}`);
  line('  block x', `${m(bx[0])}..${m(bx[1])}`);
  line('  block y', `${m(by[0])}..${m(by[1])}`);
  const overlaps = bx[1] > cone.minX && bx[0] < cone.maxX && by[1] > cone.minY && by[0] < cone.maxY;
  if (name === 'nearParapet') {
    check('near parapet does not occlude the view', !overlaps,
      `its top ${m(by[1])} is below the cone floor ${m(cone.minY)}`);
  } else {
    check('middle-distance block is inside the cone', overlaps);
    const covered = (Math.min(bx[1], cone.maxX) - Math.max(bx[0], cone.minX)) / (cone.maxX - cone.minX);
    check('it does not fill the opening', covered < 0.75, `covers ${(covered * 100).toFixed(0)}% of the cone width`);
  }
}
const farCone = sightlineAt(EXTERIOR.farCity.center[2]);
line('far cone x', `${m(farCone.minX)}..${m(farCone.maxX)}`);
line('far cone y', `${m(farCone.minY)}..${m(farCone.maxY)}`);
check('far skyline plane covers the cone at its depth',
  EXTERIOR.farCity.center[0] - EXTERIOR.farCity.size[0] / 2 < farCone.minX &&
  EXTERIOR.farCity.center[0] + EXTERIOR.farCity.size[0] / 2 > farCone.maxX &&
  EXTERIOR.farCity.center[1] - EXTERIOR.farCity.size[1] / 2 < farCone.minY &&
  EXTERIOR.farCity.center[1] + EXTERIOR.farCity.size[1] / 2 > farCone.maxY);

console.log('\n== framing proportion ==');
line('jamb / rail section', WINDOW.jambSection, 'live room used .065');
line('mullion width', WINDOW.mullionWidth, 'live room used .034');
line('opening width', WINDOW.opening.maxX - WINDOW.opening.minX);
const framedFraction = (2 * WINDOW.jambSection + WINDOW.mullionWidth) / (WINDOW.opening.maxX - WINDOW.opening.minX);
check('frame occupies under 10% of the opening width', framedFraction < 0.10,
  `${(framedFraction * 100).toFixed(1)}%`);
line('blind slats', BLINDS.slats);
line('closed pitch', BLINDS.closedPitch, 'real venetian 25-50 mm');
line('slat stack, closed', BLINDS.slats * BLINDS.closedPitch, `opening ${m(WINDOW.opening.maxY - WINDOW.opening.minY)}`);
check('closed blinds cover the opening',
  BLINDS.headY - (BLINDS.slats - 1) * BLINDS.closedPitch < WINDOW.opening.minY + 0.06);

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} check(s) failed`}\n`);
process.exit(failures === 0 ? 0 : 1);
