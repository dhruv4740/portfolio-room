// Cinematic room — the shared physical contract, in metres, Y up.
//
// Candidate module. Nothing in the live app imports this yet; the live scene
// still runs buildWorkspace.js at its old ~1.6x scale. Every number below is
// authored at true scale rather than produced by scaling a root group, so the
// props that are already 1.0x (phone, Poly Haven task lamp, licensed mouse,
// licensed keyboard) keep their real sizes and only move.
//
// Values marked CONTRACT come from docs/PROMPT-OPUS-ROOM-COMPOSITION.md.
// Values marked DERIVED are computed here from an asset measurement, and where
// a derived value disagrees with the contract the residual is exported next to
// it instead of being silently absorbed. See docs/reviews/OPUS-ROOM-COMPOSITION.md.

import { KEYCAPS } from './keyboardLayout.js';

// --- room shell --------------------------------------------------------------
// Interior volume. The open corner of the old room is kept: the front wall and
// the right wall are still built, so the overview camera can sit outside them.
export const ROOM = {
  interior: { minX: -1.80, maxX: 1.80, minZ: -0.90, maxZ: 1.60, floorY: 0, ceilingY: 2.60 }, // CONTRACT ceiling ~2.6
  wallThickness: 0.12,
  slabThickness: 0.10,
  skirting: { height: 0.075, depth: 0.018 },
};

// --- desk --------------------------------------------------------------------
export const DESK = {
  size: [1.80, 0.80],           // CONTRACT
  center: [0, -0.05],           // CONTRACT  (x, z)
  topY: 0.740,                  // CONTRACT
  thickness: 0.035,             // CONTRACT — a real 35 mm top; never scale this
  edgeRadius: 0.006,
  legInset: 0.06,               // trestle set in from the ends
  legSection: 0.038,
  footRailSection: 0.040,
  stretcherY: 0.50,
};
export const DESK_BOUNDS = {
  minX: DESK.center[0] - DESK.size[0] / 2, maxX: DESK.center[0] + DESK.size[0] / 2,
  minZ: DESK.center[1] - DESK.size[1] / 2, maxZ: DESK.center[1] + DESK.size[1] / 2,
};

// Felt mat. CONTRACT is "around .75 x .40, top Y=.749". The contract's mat
// centre is not given; it is placed here so the mat stays inside the desk's
// front edge (z = 0.35) while still carrying keyboard and mouse.
export const MAT = {
  size: [0.75, 0.40],           // CONTRACT
  center: [0.02, 0.14],         // DERIVED (x, z) — front edge lands at z = 0.34
  topY: 0.749,                  // CONTRACT
  thickness: 0.009,
  radius: 0.018,
};

// --- keyboard ----------------------------------------------------------------
// The licensed board was exported by scripts/blender/prepare_keyboard.py at
// CASE_W = 0.48 m with home-row cap tops on KEY_TOP = 1.2375 and the chassis
// origin at its own underside, which the live builder puts at y = 1.19723.
//
// Two measurements follow from that export and are the reason the contract's
// two keyboard numbers can both be met:
//   board height, underside -> home-row cap top = 1.2375 - 1.19723 = 0.04027 m
//   live float above the felt mat                = 1.19723 - 1.174   = 0.02323 m
// The second one is a defect in the live scene, not a design choice: the board
// currently hovers 23 mm over the mat. This module seats it on the mat.
//
// CONTRACT asks for "about .44 m overall width" and a home-row top of 0.785.
// At the exported 0.48 m width the board is 40.3 mm tall to the home row, so on
// a mat whose top is 0.749 the home row would land at 0.78927 (+4.3 mm).
// Scaling the board uniformly to the contract's 0.44 m width scales its height
// with it and lands the home row at 0.78592 — 0.9 mm over the contract. That
// near-exact agreement is the evidence that 0.785 was derived from a 0.44 m
// board, so the 0.44 m scale is adopted and the 0.9 mm residual is reported
// rather than hidden.
export const KEYBOARD_SOURCE = {
  exportedCaseWidth: 0.48,
  exportedHomeRowTop: 1.2375,     // KEY_TOP in prepare_keyboard.py
  exportedChassisOriginY: 1.19723,
  exportedCenter: [0, 0.28],      // (x, z) of the chassis origin in the live room
  exportedMatTop: 1.174,
};
export const KEYBOARD = {
  caseWidth: 0.44,                                        // CONTRACT
  scale: 0.44 / KEYBOARD_SOURCE.exportedCaseWidth,        // 0.9166667, uniform
  center: [0, 0.17],                                      // CONTRACT (x, z)
  restY: MAT.topY,                                        // underside seated on the felt
};
KEYBOARD.bodyHeightToHomeRow =
  (KEYBOARD_SOURCE.exportedHomeRowTop - KEYBOARD_SOURCE.exportedChassisOriginY) * KEYBOARD.scale;
// DERIVED: what the home row actually reaches with this asset at this scale.
KEYBOARD.homeRowTop = KEYBOARD.restY + KEYBOARD.bodyHeightToHomeRow;   // 0.78592
KEYBOARD.homeRowTopContract = 0.785;                                   // CONTRACT
KEYBOARD.homeRowTopResidual = KEYBOARD.homeRowTop - KEYBOARD.homeRowTopContract;
// The live scene's unexplained gap, exported so Codex's contact pass can see
// that this module removed it rather than reproducing it.
KEYBOARD.removedLiveFloat =
  KEYBOARD_SOURCE.exportedChassisOriginY - KEYBOARD_SOURCE.exportedMatTop;  // 0.02323

// Keycap instances, transformed out of keyboardLayout.js into this room.
// Order, count, per-row Y offsets, 1u widths and the escape flag are preserved
// exactly: instanceId -> KEY_ROWS -> setKey stays valid, which is the whole
// reason the caps are not re-exported from Blender for this study.
export const CINEMATIC_KEYCAPS = KEYCAPS.map((cap) => {
  const [x, y, z] = cap.p;
  return {
    p: [
      KEYBOARD.center[0] + (x - KEYBOARD_SOURCE.exportedCenter[0]) * KEYBOARD.scale,
      KEYBOARD.restY + (y - KEYBOARD_SOURCE.exportedChassisOriginY) * KEYBOARD.scale,
      KEYBOARD.center[1] + (z - KEYBOARD_SOURCE.exportedCenter[1]) * KEYBOARD.scale,
    ],
    w: cap.w,
    esc: cap.esc,
  };
});
// Chassis placement for createAuthoredKeyboard: origin is the board underside
// at the board centre, so one position plus one uniform scale places it.
export const KEYBOARD_CHASSIS = {
  position: [KEYBOARD.center[0], KEYBOARD.restY, KEYBOARD.center[1]],
  scale: KEYBOARD.scale,
};

// --- monitor -----------------------------------------------------------------
// The clickable plane and the camera-travel target are the same value: nothing
// below re-states the display size as a literal.
export const SCREEN = {
  center: [0, 1.085, -0.30],    // CONTRACT
  width: 0.66,                  // CONTRACT
  height: 0.37125,              // CONTRACT (16:9)
};
export const MONITOR = {
  bezel: 0.02,
  enclosureDepth: 0.045,
  // Enclosure is the display plus a 20 mm bezel; its front face sits 2 mm
  // behind the display so the emissive plane never z-fights the panel.
  enclosureSize: [SCREEN.width + 0.04, SCREEN.height + 0.04, 0.045],
  enclosureCenter: [SCREEN.center[0], SCREEN.center[1], SCREEN.center[2] - 0.0245],
  standSection: [0.045, 0.032],
  footSize: [0.24, 0.018, 0.16],
  footCenter: [0, DESK.topY + 0.009, -0.40],
  chin: 0.022,
};
MONITOR.enclosureBottomY = SCREEN.center[1] - MONITOR.enclosureSize[1] / 2;
MONITOR.standHeight = MONITOR.enclosureBottomY - (DESK.topY + MONITOR.footSize[1]);
MONITOR.standCenter = [0, DESK.topY + MONITOR.footSize[1] + MONITOR.standHeight / 2, -0.40];

// --- camera and body ---------------------------------------------------------
export const CAMERA = {
  seated: { position: [0.05, 1.23, 0.83], target: SCREEN.center },   // CONTRACT
  // Outside the front-right corner, looking back into the desk and the window.
  overview: { position: [-1.32, 2.02, 1.52], target: [0.18, 1.00, -0.42] },
  // Used only by the offline sightline check and the review harness.
  fov: 56,
};
export const BODY = {
  shoulderMidpoint: [0.05, 1.10, 0.82],   // CONTRACT
  seatTopY: 0.45,                         // CONTRACT
  chair: [0.05, 0, 0.86],                 // chair origin on the floor
};

// --- window ------------------------------------------------------------------
// The aperture is sized and placed by the two constraints in the prompt: the
// monitor's right edge must not occlude it from the seated camera, and it must
// fall inside the seated frustum. Both are checked numerically by
// scripts/review-cinematic-room-geometry.mjs and reported as a band.
export const WINDOW = {
  wallZ: ROOM.interior.minZ,        // interior face of the window wall
  opening: { minX: 0.62, maxX: 1.50, minY: 0.95, maxY: 2.10 },
  jambSection: 0.030,               // deliberately thin: no prison-bar framing
  railSection: 0.030,
  mullionWidth: 0.018,
  mullionX: 1.06,
  reveal: 0.10,
  sill: { width: 1.02, depth: 0.16, thickness: 0.05, projection: 0.06 },
  snow: { thickness: 0.022, inset: 0.012 },
};
WINDOW.sill.topY = WINDOW.opening.minY;
WINDOW.center = [
  (WINDOW.opening.minX + WINDOW.opening.maxX) / 2,
  (WINDOW.opening.minY + WINDOW.opening.maxY) / 2,
];
// Venetian blinds: real slat geometry rather than the old 11 slats at 145 mm,
// which read as a louvre grille at this opening height.
export const BLINDS = {
  slats: 22,
  slatWidth: WINDOW.opening.maxX - WINDOW.opening.minX - 0.02,
  slatDepth: 0.050,
  slatThickness: 0.0016,
  closedPitch: 0.052,
  openPitch: 0.009,
  closedTilt: -0.20,
  openTilt: -1.45,
  headY: WINDOW.opening.maxY - 0.03,
  z: WINDOW.wallZ + 0.055,
};

// --- exterior ----------------------------------------------------------------
// Depths are chosen against the sightline cone through the aperture, computed
// in sightlineAt(): the near parapet is pushed below the cone instead of being
// deleted, the middle-distance block sits inside it, and the far skyline plane
// is large enough to fill the rest of the cone at its depth.
export const EXTERIOR = {
  nearParapet: { center: [1.40, 0.10, -2.60], size: [2.40, 1.04, 0.70] },   // top y = 0.62
  // The middle-distance block was 1.8 x 5.0 at z = -6.5 with 135 mm windows.
  // It passed the cone test — it was inside the sightline and covered 53% of
  // its width — and still rendered wrong, because "inside the cone" says
  // nothing about whether the thing reads as a building. At that size it was a
  // 1.8 m pillar close to the glass, and its windows were the only thing the
  // eye could scale it by.
  //
  // Now an actual building: 14 m wide, 20 m tall, 14 m away, positioned so its
  // near corner falls inside the cone and the far skyline shows beside it.
  // Windows are authored in metres, not as a fraction of the facade.
  midBlock: {
    // Depth follows from the angle, not the other way round. The old pillar
    // subtended about 0.25 rad across and 0.68 rad up, which was a good window
    // composition — it only failed because a 1.8 m object cannot carry it. A
    // real tower filling the same angles sits at ~57 m: 16 m wide, 40 m tall.
    // Putting a correctly sized building at the old 6.5 m depth instead leaves
    // the opening showing a 3 m sliver of facade, which is worse than the bug.
    center: [35.5, 14.0, -57.0], size: [16.0, 40.0, 12.0],
    window: { width: 1.10, height: 1.50, pitchX: 2.40, pitchY: 3.20 },
  },
  // Far backdrop, behind the tower. Sized so its drawn skyline — which sits in
  // the lower two thirds of the texture — lands inside the cone rather than
  // below it; an oversized plane pushes the horizon out of shot entirely.
  farCity: { center: [53.0, 16.0, -90.0], size: [52.0, 64.0] },
};

// --- speakers ----------------------------------------------------------------
// The live driver set (speakerDetails.js) is authored in absolute world
// coordinates for .18 x .28 x .16 cabinets at (±.955, 1.305, -.45), so it
// cannot be reused here by moving a group. These are the cinematic cabinets;
// cinematicSpeakerDetails.js re-derives the lathe profiles against them.
//
// Driver sizes follow the cabinet rather than being authored separately: the
// live flange is 137 mm across on a 180 mm cabinet (a 5.25" woofer), and the
// same proportion on a 110 mm cabinet gives an 84 mm flange — a 3" woofer with
// a ~19 mm dome tweeter, which is what a nearfield this size actually carries.
export const SPEAKER = {
  size: [0.11, 0.175, 0.10],
  x: [-0.80, 0.80],
  z: -0.30,
  // Source cabinet the live profiles were authored against, used as the divisor
  // for the radial scale. Not a value to tune — it describes the old asset.
  sourceWidth: 0.18,
  sourceFrontZ: -0.37,
  sourceCenterY: 1.305,
  sourceHeight: 0.28,
  sourceWooferY: 1.265,
  sourceTweeterY: 1.385,
};
SPEAKER.centerY = DESK.topY + SPEAKER.size[1] / 2;
SPEAKER.frontZ = SPEAKER.z + SPEAKER.size[2] / 2;
SPEAKER.scale = SPEAKER.size[0] / SPEAKER.sourceWidth;
// Driver heights keep their fraction of the cabinet height.
SPEAKER.wooferY = SPEAKER.centerY +
  ((SPEAKER.sourceWooferY - SPEAKER.sourceCenterY) / SPEAKER.sourceHeight) * SPEAKER.size[1];
SPEAKER.tweeterY = SPEAKER.centerY +
  ((SPEAKER.sourceTweeterY - SPEAKER.sourceCenterY) / SPEAKER.sourceHeight) * SPEAKER.size[1];

// --- key light ---------------------------------------------------------------
// The live SKY_CONFIGS carries a key position per sky state, but those are
// live-room coordinates and would throw the light outside this room, so the
// cinematic builder ignores them and uses these instead.
//
// A directional key is only believable if its ray actually passes through the
// aperture — otherwise the blind slats cast a shadow from light that entered
// through a wall. So the position is not authored directly: each state names a
// point in the opening the light comes through, and the position is placed by
// extending the target->entry ray outward. Passing through the aperture is then
// true by construction, and the harness re-checks the entry point is inside the
// opening.
export const KEY_TARGET = [-0.45, 1.05, -0.35];

/** Position a directional key so target -> entry -> position is one straight line. */
export function keyPositionThrough(entry, reach) {
  return [
    entry[0] + (entry[0] - KEY_TARGET[0]) * reach,
    entry[1] + (entry[1] - KEY_TARGET[1]) * reach,
    entry[2] + (entry[2] - KEY_TARGET[2]) * reach,
  ];
}

// entry: where the ray crosses the window wall. reach: how far outside to sit.
export const KEY_LIGHTS = {
  // High cool moon, entering through the upper half of the opening.
  night: { entry: [1.05, 1.90, WINDOW.wallZ], reach: 1.6 },
  // Low warm sun from the right: a shallow angle deep into the room.
  dusk: { entry: [1.25, 1.45, WINDOW.wallZ], reach: 2.0 },
  // High sun, steeper and nearer the mullion.
  day: { entry: [0.95, 2.00, WINDOW.wallZ], reach: 2.2 },
};
for (const cfg of Object.values(KEY_LIGHTS)) cfg.position = keyPositionThrough(cfg.entry, cfg.reach);

// --- object rests ------------------------------------------------------------
// Every movable object's home position. buildCinematicWorkspace and
// cinematicRoomInteractions both read these; nothing restates them.
export const ANCHORS = {
  monitor: [SCREEN.center[0], SCREEN.center[1], SCREEN.center[2]],
  keyboard: [KEYBOARD.center[0], KEYBOARD.homeRowTop, KEYBOARD.center[1]],
  // Clamp lamp: z matches what createAuthoredTaskLamp derives for this desk
  // (rear edge + 10 mm). Its X is hardcoded in that helper and is corrected by
  // the builder, so the two must agree on this value.
  lamp: [-0.66, DESK.topY + 0.012, DESK.center[1] - DESK.size[1] / 2 + 0.010],
  coffee: [-0.47, DESK.topY, 0.24],
  award: [-0.56, DESK.topY, -0.14],
  headphones: [0.38, DESK.topY, -0.12],
  notebook: [0.60, DESK.topY, 0.18],
  pen: [0.76, DESK.topY + 0.004, 0.05],
  phone: [-0.28, MAT.topY, 0.02],
  mouse: [0.30, MAT.topY, 0.17],
  drawer: [0.62, 0.56, 0.30],
  blinds: [WINDOW.opening.maxX - 0.06, WINDOW.opening.maxY - 0.30, WINDOW.wallZ + 0.07],
  window: [WINDOW.center[0], WINDOW.center[1], WINDOW.wallZ],
  windowOpen: [WINDOW.center[0] + 0.22, WINDOW.center[1], WINDOW.wallZ + 0.03],
  ceilingFixture: [-0.42, ROOM.interior.ceilingY, 0.30],
  speakers: [[-0.80, DESK.topY, -0.30], [0.80, DESK.topY, -0.30]],
};

// The Poly Haven hanging industrial lamp exports at 0.550 x 0.888 x 0.550 m —
// a genuine factory pendant, authored against the live room's 3.12 m ceiling.
// Hung from 2.60 m unchanged its underside reaches y = 1.699: under standing
// head height and directly over the desk's front edge. This scale puts the
// shade at 0.343 m across with its underside at 2.033 m, which is where a
// pendant hangs in a room this size. Applied by the builder to the fixture's
// mount, because the helper takes no scale parameter.
export const CEILING_FIXTURE_SCALE = 0.625;

// Props that are already 1.0x keep their real sizes.
export const PHONE_SIZE = { width: 0.078, height: 0.166, depth: 0.009 };
export const MOUSE_ANCHOR = { position: ANCHORS.mouse, rotationY: -0.08 };

// --- the bounds the stage needs ---------------------------------------------
export const WORKSPACE = {
  min: [ROOM.interior.minX - 0.2, -0.2, ROOM.interior.minZ - 0.2],
  max: [ROOM.interior.maxX + 0.2, ROOM.interior.ceilingY + 0.2, ROOM.interior.maxZ + 0.2],
  target: [0.05, 1.05, -0.30],
  overview: { position: CAMERA.overview.position, target: CAMERA.overview.target },
  seat: { position: CAMERA.seated.position, target: CAMERA.seated.target },
  chair: BODY.chair,
  screen: SCREEN,
  deskSurface: {
    center: [DESK.center[0], DESK.topY, DESK.center[1]],
    size: DESK.size, radius: DESK.edgeRadius, thickness: DESK.thickness,
  },
  matSurface: { center: [MAT.center[0], MAT.topY, MAT.center[1]], size: MAT.size, radius: MAT.radius },
  anchors: ANCHORS,
  phoneSize: PHONE_SIZE,
};

// --- sightline arithmetic ----------------------------------------------------
// Used by the review harness to state window visibility as numbers instead of
// a claim, and by the exterior placement above.

/** Horizontal half-angle of the seated camera, radians, for a given aspect. */
export function horizontalHalfAngle(aspect = 16 / 9, fovDeg = CAMERA.fov) {
  return Math.atan(Math.tan((fovDeg * Math.PI) / 180 / 2) * aspect);
}

/**
 * The rectangle of exterior space visible through the aperture at depth z,
 * as seen from the seated camera. Returns null for z behind the wall plane.
 */
export function sightlineAt(z, camera = CAMERA.seated.position) {
  const [cx, cy, cz] = camera;
  const denom = WINDOW.wallZ - cz;
  if (z >= WINDOW.wallZ) return null;
  const t = (z - cz) / denom;
  const o = WINDOW.opening;
  return {
    t,
    minX: cx + (o.minX - cx) * t, maxX: cx + (o.maxX - cx) * t,
    minY: cy + (o.minY - cy) * t, maxY: cy + (o.maxY - cy) * t,
  };
}

/**
 * The band of x on the window wall that is both clear of the monitor
 * enclosure's right edge and inside the seated frustum. The aperture has to
 * live inside this band for "window visible from the fixed seated camera" to
 * be true; the harness prints both numbers.
 */
export function windowVisibilityBand(aspect = 16 / 9) {
  const [cx, cy, cz] = CAMERA.seated.position;
  const monitorRightX = MONITOR.enclosureCenter[0] + MONITOR.enclosureSize[0] / 2;
  const monitorFrontZ = MONITOR.enclosureCenter[2] + MONITOR.enclosureSize[2] / 2;
  const grazeT = (WINDOW.wallZ - cz) / (monitorFrontZ - cz);
  const clearOfMonitor = cx + (monitorRightX - cx) * grazeT;

  const [tx, , tz] = CAMERA.seated.target;
  const yaw = Math.atan2(tx - cx, tz - cz);            // 0 = straight down -Z
  const edge = yaw + horizontalHalfAngle(aspect);       // right edge of frame
  const insideFrustum = cx + Math.tan(edge) * (cz - WINDOW.wallZ);

  const o = WINDOW.opening;
  return {
    clearOfMonitor, insideFrustum,
    apertureMinX: o.minX, apertureMaxX: o.maxX,
    leftMargin: o.minX - clearOfMonitor,
    rightMargin: insideFrustum - o.maxX,
    ok: o.minX > clearOfMonitor && o.maxX < insideFrustum,
    cameraEyeY: cy,
  };
}
