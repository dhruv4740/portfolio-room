import * as THREE from 'three';

// Seated hands and forearms: authored rigid parts on a joint hierarchy, no
// skinning, no IK beyond the analytic elbow. Hand frame (both hands): fingers
// point -z, palm faces -y, wrist at +z, thumb on the side nearer the body's
// centre line. Grips in WorkspaceStage are authored in this frame.

export const HAND_REST = { x: 0.27, y: 1.311, z: 0.405 };

// Per-finger curl (index..pinky), finger fan, thumb opposition and thumb
// curl, all 0..1. A pose is a flat object so GSAP and lerpPose can tween it.
export const POSES = {
  // Rest curls put every fingertip 4-5 mm above the keycap tops (1.2625) from HAND_REST.y.
  rest:  { c0: 0.27, c1: 0.24, c2: 0.27, c3: 0.42, spread: 0.50, tOpp: 0.25, tCurl: 0.25 },
  open:  { c0: 0.08, c1: 0.08, c2: 0.10, c3: 0.12, spread: 0.90, tOpp: 0.10, tCurl: 0.08 },
  flat:  { c0: 0.22, c1: 0.24, c2: 0.26, c3: 0.30, spread: 0.35, tOpp: 0.55, tCurl: 0.15 },
  point: { c0: 0.06, c1: 0.78, c2: 0.88, c3: 0.94, spread: 0.20, tOpp: 0.45, tCurl: 0.55 },
  pinch: { c0: 0.55, c1: 0.62, c2: 0.78, c3: 0.88, spread: 0.20, tOpp: 0.95, tCurl: 0.35 },
  wrap:  { c0: 0.72, c1: 0.76, c2: 0.78, c3: 0.82, spread: 0.10, tOpp: 0.85, tCurl: 0.55 },
  hook:  { c0: 0.55, c1: 0.60, c2: 0.80, c3: 0.90, spread: 0.10, tOpp: 0.50, tCurl: 0.50 },
  cup:   { c0: 0.45, c1: 0.50, c2: 0.52, c3: 0.56, spread: 0.30, tOpp: 0.60, tCurl: 0.30 },
  // Side-edge hold of a flat object: fingers curled behind it, thumb over the front.
  hold:  { c0: 0.50, c1: 0.55, c2: 0.60, c3: 0.65, spread: 0.20, tOpp: 0.70, tCurl: 0.20 },
  // Writing: index and thumb on the pencil, the other fingers tucked under.
  pen:   { c0: 0.50, c1: 0.60, c2: 0.80, c3: 0.90, spread: 0.20, tOpp: 0.90, tCurl: 0.45 },
};
export const POSE_KEYS = Object.keys(POSES.rest);
export function lerpPose(out, a, b, w) { for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * w; return out; }
export function curlSum(p) { return p.c0 + p.c1 + p.c2 + p.c3 + p.tCurl * 0.5; }

const MCP = 1.5, PIP = 1.8, DIP = 1.0; // radians at full curl
const T_MCP = 0.9, T_IP = 1.1;
const WRIST = new THREE.Vector3(0, 0.001, 0.088);
const UPPER_ARM = 0.40;

// [thumb-side x, z, length, radius factor, fan]: index, middle, ring, pinky.
const FINGERS = [
  { x: 0.033, z: -0.066, length: 0.072, r: 1.00, fan: 0.14 },
  { x: 0.011, z: -0.073, length: 0.080, r: 1.00, fan: 0.03 },
  { x: -0.011, z: -0.069, length: 0.074, r: 0.96, fan: -0.06 },
  { x: -0.033, z: -0.058, length: 0.058, r: 0.86, fan: -0.17 },
];

function lathe(profile, segments) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  g.rotateX(-Math.PI / 2); return g; // revolve axis +y becomes -z
}
// Tapered segment with rounded ends, base joint at the origin, running along -z.
function phalanxGeometry(r0, r1, length) {
  const pts = [];
  for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + (i / 4) * (Math.PI / 2); pts.push([Math.cos(a) * r0, Math.sin(a) * r0 * 0.85]); }
  pts.push([r1, length]);
  for (let i = 1; i <= 4; i++) { const a = (i / 4) * (Math.PI / 2); pts.push([Math.cos(a) * r1, length + Math.sin(a) * r1]); }
  return lathe(pts, 14);
}
// Palm: superellipse cross sections from the wrist (+z) to the knuckles (-z).
function palmGeometry() {
  const rings = [ // z, half width, half thickness, y offset
    [0.104, 0.000, 0.000, 0.001], [0.100, 0.020, 0.012, 0.001], [0.088, 0.028, 0.017, 0.001],
    [0.068, 0.036, 0.020, 0.001], [0.042, 0.043, 0.022, 0.000], [0.012, 0.048, 0.022, 0.000],
    [-0.022, 0.050, 0.021, 0.000], [-0.050, 0.049, 0.019, 0.000], [-0.068, 0.046, 0.016, 0.000],
    [-0.080, 0.038, 0.011, -0.001], [-0.087, 0.022, 0.005, -0.002], [-0.090, 0.000, 0.000, -0.002],
  ];
  const sides = 28, e = 2 / 2.6, pos = [], idx = [];
  const se = (v) => Math.sign(v) * Math.abs(v) ** e;
  for (const [z, w, t, y0] of rings) for (let i = 0; i <= sides; i++) { const a = (i / sides) * Math.PI * 2; pos.push(w * se(Math.cos(a)), y0 + t * se(Math.sin(a)), z); }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) { const a = j * (sides + 1) + i, b = a + sides + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// Forearm: open tapered tube along +y from the wrist (0) to the elbow (1); the
// wrist ellipsoid and elbow ball cover its ends.
function forearmGeometry() {
  return new THREE.LatheGeometry([[0.024, 0], [0.0255, 0.12], [0.030, 0.40], [0.038, 0.78], [0.042, 1.0]].map(p => new THREE.Vector2(...p)), 24);
}

export function seatedHands() {
  const root = new THREE.Group(); root.name = 'Seated hands and forearms'; root.visible = false;
  const skin = new THREE.MeshStandardMaterial({ color: '#b9896e', roughness: 0.82 });
  const cloth = new THREE.MeshStandardMaterial({ color: '#3c4949', roughness: 1 });
  function mesh(geometry, material, parent) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = false; m.receiveShadow = true; m.raycast = () => {}; parent.add(m); return m;
  }
  // Three-segment chain: root -> joint0 [segment0, joint1 [segment1, joint2 [segment2]]].
  function chain(parent, L, R) {
    const joints = []; let p = parent;
    for (let i = 0; i < 3; i++) {
      const j = new THREE.Group(); if (i) j.position.z = -L[i - 1]; p.add(j);
      mesh(phalanxGeometry(R[i], R[i + 1], L[i]), skin, j).scale.y = 0.9;
      joints.push(j); p = j;
    }
    return joints;
  }
  const fit = (m, a, b) => {
    m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = a.distanceTo(b);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
  };
  const hands = [];
  // Leaning in moves both shoulders (the camera moves with them in WorkspaceStage).
  const lean = new THREE.Vector3();
  for (const side of [-1, 1]) {
    const hand = new THREE.Group(); root.add(hand);
    mesh(palmGeometry(), skin, hand);
    const wristBall = mesh(new THREE.SphereGeometry(1, 20, 12), skin, hand);
    wristBall.position.set(0, 0.001, 0.090); wristBall.scale.set(0.0285, 0.0178, 0.024);

    const digits = FINGERS.map(spec => {
      const f = new THREE.Group(); f.position.set(-side * spec.x, 0.002, spec.z); hand.add(f);
      const L = [0.46, 0.30, 0.24].map(k => k * spec.length);
      const R = [0.0100, 0.0090, 0.0080, 0.0068].map(r => r * spec.r);
      f.userData = { L, fan: side * spec.fan, joints: chain(f, L, R), tip: new THREE.Vector3() };
      return f;
    });
    const thumb = new THREE.Group(); thumb.position.set(-side * 0.032, -0.006, 0.040); hand.add(thumb);
    const TL = [0.046, 0.032, 0.027];
    thumb.userData = { L: TL, joints: chain(thumb, TL, [0.0140, 0.0115, 0.0100, 0.0082]) };

    const arm = mesh(forearmGeometry(), skin, hand);
    const sleeve = mesh(new THREE.CylinderGeometry(0.054, 0.082, 1, 24), cloth, root);
    const elbow = mesh(new THREE.SphereGeometry(0.055, 20, 12), cloth, root);
    hands.push({
      hand, digits, fingers: side === 1 ? digits : digits.slice().reverse(), thumb, arm, sleeve, elbow, side,
      index: side === 1 ? 0 : 3, pose: { ...POSES.rest },
      shoulder: new THREE.Vector3(0.05 + side * 0.225, 1.40, 1.23), wristDeg: 0,
    });
  }

  // Thumb base: metacarpal direction and curl direction in hand space, from
  // lying alongside the index (opp 0) to opposing the fingers under the palm (opp 1).
  const d0 = new THREE.Vector3(), d1 = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  const tx = new THREE.Vector3(), ty = new THREE.Vector3(), tz = new THREE.Vector3(), basis = new THREE.Matrix4();
  function applyPose(h) {
    const p = h.pose, side = h.side;
    h.digits.forEach((f, i) => {
      const c = p['c' + i], { L, joints } = f.userData;
      f.rotation.y = f.userData.fan * p.spread;
      joints[0].rotation.x = -c * MCP; joints[1].rotation.x = -c * PIP; joints[2].rotation.x = -c * DIP;
      const a1 = c * MCP, a2 = a1 + c * PIP, a3 = a2 + c * DIP;
      // Tip in the finger root's frame (before any typing dip on the root), offset by the root position.
      f.userData.tip.set(0, -(L[0] * Math.sin(a1) + L[1] * Math.sin(a2) + L[2] * Math.sin(a3)),
        -(L[0] * Math.cos(a1) + L[1] * Math.cos(a2) + L[2] * Math.cos(a3))).add(f.position);
    });
    d0.set(-side * 0.80, -0.22, -0.55); d1.set(-side * 0.30, -0.85, -0.45);
    p0.set(side * 0.35, -0.40, -0.85); p1.set(side * 0.90, -0.15, -0.40);
    tz.copy(d0).lerp(d1, p.tOpp).normalize().negate();           // long axis along -z
    ty.copy(p0).lerp(p1, p.tOpp); ty.addScaledVector(tz, -ty.dot(tz)).normalize().negate(); // curl toward -y
    tx.crossVectors(ty, tz);
    h.thumb.quaternion.setFromRotationMatrix(basis.makeBasis(tx, ty, tz));
    const tj = h.thumb.userData.joints; tj[1].rotation.x = -p.tCurl * T_MCP; tj[2].rotation.x = -p.tCurl * T_IP;
  }

  const wristW = new THREE.Vector3(), s = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3();
  const elbowW = new THREE.Vector3(), elbowL = new THREE.Vector3(), ax = new THREE.Vector3(), ay = new THREE.Vector3(), az = new THREE.Vector3();
  function updateHand(h) {
    applyPose(h);
    h.hand.updateMatrixWorld(true);
    wristW.copy(WRIST); h.hand.localToWorld(wristW);
    s.copy(h.shoulder).add(lean);
    dir.subVectors(wristW, s); const distance = dir.length(); dir.normalize();
    pole.set(h.side * 0.25, -1, 0.1); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    elbowW.copy(s).addScaledVector(dir, distance * 0.5).addScaledVector(pole, Math.sqrt(Math.max(0, UPPER_ARM ** 2 - (distance * 0.5) ** 2)));
    // The forearm hangs off the hand, so its elliptical wrist rolls with the palm.
    elbowL.copy(elbowW); h.hand.worldToLocal(elbowL);
    ay.subVectors(elbowL, WRIST); const length = ay.length(); ay.normalize();
    ax.set(1, 0, 0).addScaledVector(ay, -ay.x); if (ax.lengthSq() < 1e-6) ax.set(0, 1, 0).addScaledVector(ay, -ay.y); ax.normalize();
    az.crossVectors(ax, ay);
    h.arm.quaternion.setFromRotationMatrix(basis.makeBasis(ax, ay, az));
    h.arm.position.copy(WRIST); h.arm.scale.set(1.15, length, 0.72);
    h.wristDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(ay.z, -1, 1)));
    h.elbow.position.copy(elbowW);
    fit(h.sleeve, s, elbowW);
  }
  function update() { hands.forEach(updateHand); }
  function reset() {
    lean.set(0, 0, 0);
    for (const h of hands) {
      h.hand.position.set(h.side * HAND_REST.x, HAND_REST.y, HAND_REST.z); h.hand.rotation.set(0, 0, 0);
      Object.assign(h.pose, POSES.rest); for (const f of h.fingers) f.rotation.x = 0;
      h.hand.visible = h.arm.visible = h.sleeve.visible = h.elbow.visible = true;
    }
    update();
  }
  // Fingertips and thumb tip in hand-local space for the current pose.
  function localTips(h) {
    h.hand.updateMatrixWorld(true);
    const tip = (obj, z) => h.hand.worldToLocal(obj.localToWorld(new THREE.Vector3(0, 0, z)));
    return { digits: h.digits.map(f => tip(f.userData.joints[2], -f.userData.L[2])), thumb: tip(h.thumb.userData.joints[2], -h.thumb.userData.L[2]) };
  }
  // Where a pen sits in a pinch: through the index and thumb pads, running back
  // over the web of the thumb. Hand-local contact point and axis.
  function pinchFrame(h, pose = POSES.pinch) {
    const saved = { ...h.pose }; Object.assign(h.pose, pose); applyPose(h);
    const tips = localTips(h);
    Object.assign(h.pose, saved); applyPose(h);
    const contact = tips.digits[0].clone().lerp(tips.thumb, 0.5);
    const axis = new THREE.Vector3(-h.side * 0.048, -0.004, -0.040).sub(contact).normalize();
    return { contact, axis };
  }
  reset();
  return { root, left: hands[0], right: hands[1], lean, update, reset, localTips, pinchFrame };
}
