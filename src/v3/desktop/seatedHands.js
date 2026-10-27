import * as THREE from 'three';
import { bindHandSurface } from './handSurface.js';
import { createHandSkin } from './handAppearance.js';
import { keySurfaceBoxes, skinKeyClearance } from './handContact.js';

// Connected skin driven by finger bones and an analytic two-bone arm solve. Hand frame (both hands): fingers
// point -z, palm faces -y, wrist at +z, thumb on the side nearer the body's
// centre line. Grips in WorkspaceStage are authored in this frame.

// yaw (fallback until the keyboard loads) turns each hand inward, as a typist's
// hands angle toward the home row; the index tips stay on F and J.
// True-scale room: y is the keyboard's home-row top (0.786) plus the palm's
// clearance; x/z fall back near F/J until the keyboard's key boxes load.
export const HAND_REST = { x: 0.10, y: 0.8265, z: 0.285, yaw: 0.30, ulnar: 0.08 };

// Per-finger curl (index..pinky), finger fan, thumb opposition and thumb
// curl, all 0..1. A pose is a flat object so GSAP and lerpPose can tween it.
export const POSES = {
  // Relaxed keyboard posture: expose the proximal fingers instead of folding
  // them beneath the palm. Height is paired with HAND_REST above.
  rest:  { c0: 0.18, c1: 0.16, c2: 0.19, c3: 0.26, spread: 0.50, tOpp: 0.42, tCurl: 0.30 },
  open:  { c0: 0.08, c1: 0.08, c2: 0.10, c3: 0.12, spread: 0.90, tOpp: 0.10, tCurl: 0.08 },
  flat:  { c0: 0.22, c1: 0.24, c2: 0.26, c3: 0.30, spread: 0.35, tOpp: 0.55, tCurl: 0.15 },
  point: { c0: 0.06, c1: 0.78, c2: 0.88, c3: 0.94, spread: 0.20, tOpp: 0.45, tCurl: 0.55 },
  pinch: { c0: 0.55, c1: 0.62, c2: 0.78, c3: 0.88, spread: 0.20, tOpp: 0.95, tCurl: 0.35 },
  wrap:  { c0: 0.72, c1: 0.76, c2: 0.78, c3: 0.82, spread: 0.10, tOpp: 0.85, tCurl: 0.55 },
  hook:  { c0: 0.55, c1: 0.60, c2: 0.80, c3: 0.90, spread: 0.10, tOpp: 0.40, tCurl: 0.80 },
  // Mug handle: hooked like `hook` but the far joints stay open so the tips end at the handle, not inside the wall.
  mug:   { c0: 0.50, c1: 0.55, c2: 0.55, c3: 0.60, spread: 0.10, tOpp: 0.40, tCurl: 0.80 },
  cup:   { c0: 0.45, c1: 0.50, c2: 0.52, c3: 0.56, spread: 0.30, tOpp: 0.60, tCurl: 0.30 },
  // Side-edge hold of a flat object: fingers curled behind it, thumb over the front.
  hold:  { c0: 0.50, c1: 0.55, c2: 0.60, c3: 0.65, spread: 0.20, tOpp: 0.70, tCurl: 0.20 },
  // Writing: index and thumb on the pencil, the other fingers tucked under.
  pen:   { c0: 0.50, c1: 0.60, c2: 0.80, c3: 0.90, spread: 0.20, tOpp: 0.90, tCurl: 0.45 },
};
export const POSE_KEYS = Object.keys(POSES.rest);
export function lerpPose(out, a, b, w) { for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * w; return out; }
export function curlSum(p) { return p.c0 + p.c1 + p.c2 + p.c3 + p.tCurl * 0.5; }

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const MCP = 1.5, PIP = 1.8, DIP = 1.0; // radians at full curl
const T_MCP = 0.9, T_IP = 1.1;
const WRIST = new THREE.Vector3(0, 0.001, 0.050);
const UPPER_ARM = 0.32, FOREARM = 0.27;
// Past this wrist-to-shoulder distance the shoulder comes forward (torso lean)
// instead of the arm straightening into a rod. In the true-scale room the home
// row is ~50 cm from the shoulders, so typing needs no lean.
const REACH = UPPER_ARM + FOREARM - 0.015;
const TORSO_RISE = 0.06, TORSO_DROP = 0.05;

// [thumb-side x, z, length, radius factor, fan]: index, middle, ring, pinky.
const FINGERS = [
  { x: 0.033, z: -0.066, length: 0.072, r: 1.00, fan: 0.14 },
  { x: 0.011, z: -0.073, length: 0.080, r: 1.00, fan: 0.03 },
  { x: -0.011, z: -0.069, length: 0.074, r: 0.96, fan: -0.06 },
  { x: -0.033, z: -0.058, length: 0.058, r: 0.86, fan: -0.17 },
];

// Shirt sleeve over the forearm: a cuff 3-4 cm above the wrist, then a slightly
// loose tube to the elbow. Same frame as the forearm so it rolls with the palm.
const ELBOW_R = 0.0445;
function sleeveGeometry() {
  return new THREE.LatheGeometry([[0.015, 0.115], [0.0245, 0.115], [0.029, 0.12], [0.029, 0.17], [0.0325, 0.40], [0.0405, 0.78], [ELBOW_R, 1.0]].map(p => new THREE.Vector2(...p)), 24);
}

export function seatedHands() {
  const root = new THREE.Group(); root.name = 'Seated hands and forearms'; root.visible = false;
  const skin = createHandSkin();
  const cloth = new THREE.MeshStandardMaterial({ color: '#3c4949', roughness: 1 });
  function mesh(geometry, material, parent) {
    const m = new THREE.Mesh(geometry, material); m.castShadow = false; m.receiveShadow = true; m.raycast = () => {}; parent.add(m); return m;
  }
  // Three-segment chain: root -> joint0 [segment0, joint1 [segment1, joint2 [segment2]]].
  function chain(parent, L, R) {
    const joints = []; let p = parent;
    for (let i = 0; i < 3; i++) {
      const j = new THREE.Bone(); if (i) j.position.z = -L[i - 1]; p.add(j);
      joints.push(j); p = j;
    }
    return joints;
  }
  const fit = (m, a, b) => {
    m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.y = a.distanceTo(b);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
  };
  const hands = [];
  let keyboard=null,keyboardGeometry=null;
  // Leaning in moves both shoulders (the camera moves with them in WorkspaceStage).
  const lean = new THREE.Vector3();
  const torsoOffset=new THREE.Vector3(),reachWrist=new THREE.Vector3(),reachDelta=new THREE.Vector3();
  for (const side of [-1, 1]) {
    const hand = new THREE.Bone(); root.add(hand);

    const digits = FINGERS.map(spec => {
      const f = new THREE.Group(); f.position.set(-side * spec.x, 0.002, spec.z); hand.add(f);
      const L = [0.46, 0.30, 0.24].map(k => k * spec.length);
      const R = [0.0090, 0.0082, 0.0074, 0.0064].map(r => r * spec.r);
      f.userData = { L, R, fan: side * spec.fan, joints: chain(f, L, R), tip: new THREE.Vector3() };
      return f;
    });
    const thumb = new THREE.Group(); thumb.position.set(-side * 0.032, -0.006, 0.019); hand.add(thumb);
    const TL = [0.035, 0.025, 0.022];
    thumb.userData = { L: TL, R: [0.014, 0.012, 0.010, 0.008], joints: chain(thumb, TL, [0.014, 0.012, 0.010, 0.008]) };

    const arm = new THREE.Bone(); hand.add(arm);
    const cuff = mesh(sleeveGeometry(), cloth, arm);
    const elbow = new THREE.Bone(); elbow.position.y = 1; arm.add(elbow);
    const elbowCover = mesh(new THREE.SphereGeometry(1, 20, 12), cloth, elbow);
    const sleeve = new THREE.Bone(); root.add(sleeve);
    const upperCloth = mesh(new THREE.CylinderGeometry(0.042, 0.048, 1, 24), cloth, sleeve);
    hands.push({
      clothParts: [cuff, elbowCover, upperCloth], hand, digits, fingers: side === 1 ? digits : digits.slice().reverse(), thumb, arm, sleeve, elbow, side,
      index: side === 1 ? 0 : 3, pose: { ...POSES.rest },
      shoulder: new THREE.Vector3(0.05 + side * 0.2025, 1.04, 0.69), wristDeg: 0,
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
    d0.set(-side * 0.62, -0.22, -0.76); d1.set(-side * 0.30, -0.85, -0.45);
    p0.set(side * 0.35, -0.40, -0.85); p1.set(side * 0.90, -0.15, -0.40);
    tz.copy(d0).lerp(d1, p.tOpp).normalize().negate();           // long axis along -z
    ty.copy(p0).lerp(p1, p.tOpp); ty.addScaledVector(tz, -ty.dot(tz)).normalize().negate(); // curl toward -y
    tx.crossVectors(ty, tz);
    h.thumb.quaternion.setFromRotationMatrix(basis.makeBasis(tx, ty, tz));
    const tj = h.thumb.userData.joints; tj[1].rotation.x = -p.tCurl * T_MCP; tj[2].rotation.x = -p.tCurl * T_IP;
  }

  const wristW = new THREE.Vector3(), s = new THREE.Vector3(), s0 = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3();
  const elbowT = new THREE.Vector3(), rootInv = new THREE.Matrix4(), ideal = new THREE.Vector3(), elbowW = new THREE.Vector3(), elbowL = new THREE.Vector3(), ax = new THREE.Vector3(), ay = new THREE.Vector3(), az = new THREE.Vector3();
  function updateHand(h) {
    applyPose(h);
    h.hand.updateMatrixWorld(true);
    wristW.copy(WRIST); h.hand.localToWorld(wristW);
    s0.copy(h.shoulder).add(lean).add(torsoOffset); s.copy(s0);
    dir.subVectors(wristW, s); let distance = dir.length(); dir.normalize();
    if (distance > REACH) { s.addScaledVector(dir, distance - REACH); distance = REACH; }
    pole.set(h.side * 0.25, -1, 0.1);
    // Opt-in (elbowFollow 0..1): pull the elbow toward where the hand's own
    // wrist axis points, so an authored grip far from the keyboard keeps a
    // straight wrist instead of hanging off an elbow that always drops down.
    if (h.elbowFollow > 0) {
      ideal.set(0, 0, 1).transformDirection(h.hand.matrixWorld).multiplyScalar(FOREARM).add(wristW).sub(s);
      ideal.addScaledVector(dir, -ideal.dot(dir)); if (ideal.lengthSq() > 1e-8) pole.normalize().lerp(ideal.normalize(), h.elbowFollow);
    }
    pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    // Two unequal bones: the elbow sits `along` the shoulder-wrist line and `drop` toward the pole.
    const along = (distance * distance + UPPER_ARM * UPPER_ARM - FOREARM * FOREARM) / (2 * distance);
    elbowW.copy(s).addScaledVector(dir, along).addScaledVector(pole, Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - along * along)));
    // Keep the elbow cover above the desk top where it hangs over or just off the desk edge (the sleeve used to sink ~15 mm during the phone reach).
    const dk = h.deskBox;
    if (dk) {
      root.updateWorldMatrix(true, false); elbowT.copy(elbowW).applyMatrix4(root.matrixWorld);
      if (elbowT.x > dk.min.x && elbowT.x < dk.max.x && elbowT.z > dk.min.z && elbowT.z < dk.max.z + 0.1 && elbowT.y < dk.max.y + 0.052) {
        elbowT.y = dk.max.y + 0.052; elbowW.copy(elbowT).applyMatrix4(rootInv.copy(root.matrixWorld).invert());
      }
    }
    // The forearm hangs off the hand, so its elliptical wrist rolls with the palm.
    elbowL.copy(elbowW); h.hand.worldToLocal(elbowL);
    ay.subVectors(elbowL, WRIST); const length = ay.length(); ay.normalize();
    ax.set(1, 0, 0).addScaledVector(ay, -ay.x); if (ax.lengthSq() < 1e-6) ax.set(0, 1, 0).addScaledVector(ay, -ay.y); ax.normalize();
    az.crossVectors(ax, ay);
    h.arm.quaternion.setFromRotationMatrix(basis.makeBasis(ax, ay, az));
    h.arm.position.copy(WRIST); h.arm.scale.set(1.15, length, 0.72);
    h.elbow.scale.set(ELBOW_R, ELBOW_R / length, ELBOW_R);
    h.wristDeg = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(ay.z, -1, 1)));
    // The upper arm runs from the real shoulder (behind the camera) so its end never floats in view.
    fit(h.sleeve, s0, elbowW);
  }
  function update() {
    // Both arms share one real torso lean. Previously each solve invented a
    // forward shoulder while its sleeve remained attached to the old torso.
    // Project a common translation into each reachable shoulder volume.
    torsoOffset.set(0,0,0);
    for(let pass=0;pass<12;pass++)for(const h of hands){
      h.hand.updateWorldMatrix(true,false);reachWrist.copy(WRIST).applyMatrix4(h.hand.matrixWorld);
      reachDelta.copy(reachWrist).sub(h.shoulder).sub(lean).sub(torsoOffset);
      const distance=reachDelta.length();if(distance>REACH)torsoOffset.addScaledVector(reachDelta,(distance-REACH)/distance);
    }
    // A seated torso leans; it does not rise out of the chair or sink into it.
    // Unclamped, reaching the window lifted the whole body 0.49 m.
    torsoOffset.y=THREE.MathUtils.clamp(torsoOffset.y,-TORSO_DROP,TORSO_RISE);
    hands.forEach(updateHand);
  }
  function reset() {
    lean.set(0, 0, 0);
    for (const h of hands) {
      h.hand.position.set(h.restX??h.side*HAND_REST.x, HAND_REST.y+(h.restLift||0), h.restZ??HAND_REST.z); h.hand.rotation.set(0, h.side*(h.restYaw??HAND_REST.yaw), 0);
      Object.assign(h.pose, POSES.rest); for (const f of h.fingers) f.rotation.x = 0; h.elbowFollow = 0;
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
  for (const h of hands) {
    // Bind with separated, straight digits; posed geometry would fuse a fist.
    Object.assign(h.pose, POSES.open, { c0: 0, c1: 0, c2: 0, c3: 0, tCurl: 0 });
    updateHand(h); root.updateMatrixWorld(true);
    bindHandSurface(h, root, skin, cloth);
  }
  reset();
  function refreshKeyboardSupport(){
    if(!keyboard||keyboardGeometry===keyboard.geometry)return;
    keyboardGeometry=keyboard.geometry;
    hands.forEach(h=>{h.restLift=0;});reset();
    const boxes=keySurfaceBoxes(keyboard);
    // Index fingers rest on F/J, not symmetric positions across a full-size
    // keyboard: the numeric/navigation block shifts the letter area left.
    // Each hand continues its own forearm seen from above, less a slight ulnar
    // tilt; the keyboard sits off-centre, so one shared angle bent one wrist
    // 18 degrees and the other 7.
    for(let pass=0;pass<3;pass++){
      for(const [i,h] of hands.entries()){
        const home=boxes[i===0?27:30]?.getCenter(new THREE.Vector3());if(!home)continue;
        const tip=localTips(h).digits[0].applyAxisAngle(Y_AXIS,h.side*(h.restYaw??HAND_REST.yaw));h.restX=home.x-tip.x;h.restZ=home.z-tip.z;
      }
      reset();
      for(const h of hands){
        h.elbow.getWorldPosition(reachDelta);reachWrist.copy(WRIST).applyMatrix4(h.hand.matrixWorld).sub(reachDelta);
        h.restYaw=h.side*Math.atan2(-reachWrist.x,-reachWrist.z)-HAND_REST.ulnar;
      }
    }
    reset();
    for(const h of hands){const {clearance}=skinKeyClearance(h,boxes);h.restLift=Number.isFinite(clearance)?Math.max(0,.002-clearance):0;}
    reset();
  }
  return { root, left: hands[0], right: hands[1], lean, torsoOffset, update, reset, localTips, pinchFrame,
    setKeyboard(keys){keyboard=keys;refreshKeyboardSupport();},refreshKeyboardSupport };
}
