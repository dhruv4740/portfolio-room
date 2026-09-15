import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { createRig } from './cameraRig.js';
import { buildWorkspace, WORKSPACE } from './buildWorkspace.js';
import PhoneScreen, { PHONE_SCREEN } from './PhoneScreen.jsx';
import { KEY_ROWS, AWARD_REST, PEN_REST } from './buildRoomInteractions.js';
import { createPerfGovernor } from './perfGovernor.js';

export function resolveSkyState() {
  const parseSky = (str) => {
    if (!str) return null;
    const val = new URLSearchParams(str).get('sky');
    if (val && ['night', 'dusk', 'day'].includes(val.toLowerCase())) {
      return val.toLowerCase();
    }
    return null;
  };
  const fromSearch = parseSky(typeof window !== 'undefined' ? window.location.search : '');
  if (fromSearch) return fromSearch;
  const hash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  const qIdx = hash.indexOf('?');
  if (qIdx !== -1) {
    const fromHash = parseSky(hash.slice(qIdx));
    if (fromHash) return fromHash;
  }
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 17) return 'day';
  if ((hour >= 5 && hour < 7) || (hour >= 17 && hour < 19)) return 'dusk';
  return 'night';
}

export default function WorkspaceStage({
  anchors = [], activeAnchorId = null, onAnchorSelect, onEnterScreen,
  onProgress, onReady, onStats, onError, onScreenRect, onTravel, reducedMotion = false,
  paused = false, phase = 'room', seated = false, onSit, entryVisible = true, onTypeKey, liveMonitor = false,
  windowIntent = false,
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const api = useRef(null);
  const phoneScreenRef = useRef(null);
  const [phoneLive, setPhoneLive] = useState(false);
  const callbacks = useRef({});
  callbacks.current = { onAnchorSelect, onEnterScreen, onProgress, onReady, onStats, onError, onScreenRect, onTravel, onSit, onTypeKey };
  const state = useRef({ paused, phase, reducedMotion, activeAnchorId, seated, liveMonitor, windowIntent });
  state.current = { paused, phase, reducedMotion, activeAnchorId, seated, liveMonitor, windowIntent };

  useEffect(() => {
    const host = hostRef.current;
    let renderer, controls, model, resizeObserver, tween, rig, action;
    let extraHeld = null;
    let phoneInHand = false, returningPhone = false, notebookInHand = false, returningNotebook = false;
    // null | 'in' | 'held' | 'out'. While set, PhoneScreen tracks the display.
    let phoneZoom = null;
    const entryTimers = [];
    let raf = 0, disposed = false, last = null, cadenceSum = 0, cpuSum = 0, count = 0, emitted = 0;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor('#0a0a0b');
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // Furniture and lights are static: camera moves do not invalidate shadows.
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      host.appendChild(renderer.domElement);
      const gov = createPerfGovernor(renderer); // render-on-demand + adaptive pixel ratio; see perfGovernor.js
      const scene = new THREE.Scene();
      // The room stays warm/naturalistic and drops into the --void black at
      // its edges — that contrast against the app's black chrome is intentional.
      scene.background = new THREE.Color('#0a0a0b');
      scene.fog = new THREE.Fog('#0a0a0b', 6, 13);
      model = buildWorkspace(scene, {
        onShadowNeedsUpdate: () => {
          renderer.shadowMap.needsUpdate = true;
          invalidate();
        },
      });
      const originalSetSky = model.setSky;
      model.setSky = (skyState) => {
        originalSetSky(skyState);
        host.dataset.skyState = skyState;
      };
      const initialSky = resolveSkyState();
      model.setSky(initialSky);
      host.dataset.skyState = initialSky;
      host.dataset.windowOpen = String(model.roomActions.state.windowOpen);
      const camera = new THREE.PerspectiveCamera(40, 1, 0.025, 60);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI * 0.2; controls.maxPolarAngle = Math.PI * 0.47;
      controls.minAzimuthAngle = -0.8; controls.maxAzimuthAngle = 0.85;
      controls.minDistance = 2.2; controls.maxDistance = 11;
      controls.addEventListener('change', () => invalidate());
      // Camera flights share wall-clock deadlines with Scan. A slow render
      // must not stretch a one-second flight into many seconds of GPU work.
      gsap.ticker.lagSmoothing(0);
      gsap.config({ autoSleep: 10 }); // Let the shared ticker sleep promptly after bounded flights.
      rig = createRig(camera, controls); rig.setIdle(false);
      let headYaw = 0, headPitch = 0;
      let home;
      const screenCenter = new THREE.Vector3(...WORKSPACE.screen.center);
      const projected = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let down = null;

      function framing() {
        // Fit the modeled room's known bounds. Capture framing remains separate.
        const size = new THREE.Vector3().subVectors(new THREE.Vector3(...WORKSPACE.max), new THREE.Vector3(...WORKSPACE.min));
        const vfov = THREE.MathUtils.degToRad(camera.fov);
        const distance = (Math.max(size.y / (2 * Math.tan(vfov / 2)), size.x / (2 * Math.tan(vfov / 2) * camera.aspect)) + size.z * 0.66) * 1.22;
        const target = new THREE.Vector3(0, 1.1, -0.2);
        const direction = new THREE.Vector3(0.62, 0.43, 1).normalize();
        home = { position: target.clone().addScaledVector(direction, distance), target };
      }
      function place(view) { camera.position.copy(view.position); controls.target.copy(view.target); controls.update(); }
      function updateMarkers() {
        const rect = host.getBoundingClientRect();
        for (const [id, el] of markerRefs.current) {
          const point = (id === 'chair' ? WORKSPACE.chair : WORKSPACE.anchors[id]); if (!point || !el) continue;
          projected.set(...point).project(camera);
          const visible = state.current.phase === 'room' && (!['phone','notebook','award','coffee','drawer','pen'].includes(state.current.activeAnchorId)) && (state.current.seated ? id !== 'chair' && id !== state.current.activeAnchorId : id === 'chair') && projected.z < 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.88;
          el.style.opacity = visible ? '1' : '0';
          el.style.visibility = visible ? 'visible' : 'hidden';
          el.style.pointerEvents = visible ? 'auto' : 'none';
          el.style.transform = `translate3d(${(projected.x * 0.5 + 0.5) * rect.width}px,${(-projected.y * 0.5 + 0.5) * rect.height}px,0)`;
        }
      }
      // Project the monitor screen's top-left/top-right/bottom-left corners and
      // derive the 2D affine CSS matrix that maps a full-viewport box onto that
      // projected quad. The screen plane is not rotated (buildWorkspace places
      // it fronto-parallel to +Z), so an affine map is an exact fit, not an
      // approximation. Lets the real dhruvOS iframe ride along the monitor's
      // projected rectangle throughout travel instead of cross-fading in cold.
      const halfW = WORKSPACE.screen.width / 2, halfH = WORKSPACE.screen.height / 2;
      const sc = WORKSPACE.screen.center;
      const corners = [
        [sc[0] - halfW, sc[1] + halfH, sc[2]], // top-left
        [sc[0] + halfW, sc[1] + halfH, sc[2]], // top-right
        [sc[0] - halfW, sc[1] - halfH, sc[2]], // bottom-left
        [sc[0] + halfW, sc[1] - halfH, sc[2]], // bottom-right
      ];
      function updateScreenAlign() {
        const p = state.current.phase;
        if (p !== 'entering' && p !== 'leaving' && !(p === 'room' && state.current.liveMonitor)) return;
        if (state.current.reducedMotion && p !== 'room') return;
        const rect = host.getBoundingClientRect();
        const W = rect.width || 1, H = rect.height || 1;
        const pts = corners.map((pt) => {
          projected.set(...pt).project(camera);
          return { x: (projected.x * 0.5 + 0.5) * W, y: (-projected.y * 0.5 + 0.5) * H, z: projected.z };
        });
        if (pts.some((pt) => pt.z > 1)) { callbacks.current.onScreenRect?.(null); return; }
        callbacks.current.onScreenRect?.({matrix:quadMatrix(pts,W,H),width:W,height:H});
      }
      // Maps a W x H box onto four projected corners. g and h make it a full
      // projective map, so it also fits the held phone, which is tilted.
      function quadMatrix([tl,tr,bl,br], W, H) {
        const dx1=tr.x-br.x,dx2=bl.x-br.x,dy1=tr.y-br.y,dy2=bl.y-br.y;
        const sx=tl.x-tr.x+br.x-bl.x,sy=tl.y-tr.y+br.y-bl.y,det=dx1*dy2-dx2*dy1;
        const g=(sx*dy2-dx2*sy)/det,h=(dx1*sy-sx*dy1)/det;
        const a=tr.x-tl.x+g*tr.x,b=bl.x-tl.x+h*bl.x,d=tr.y-tl.y+g*tr.y,e=bl.y-tl.y+h*bl.y;
        return [a/W,d/W,0,g/W,b/H,e/H,0,h/H,0,0,1,0,tl.x,tl.y,0,1];
      }
      const phoneCorner = new THREE.Vector3();
      function updatePhoneAlign() {
        if (!phoneZoom) return;
        const rect = host.getBoundingClientRect();
        const W = rect.width || 1, H = rect.height || 1;
        const { width: w, height: h } = model.phoneDisplay.geometry.parameters;
        model.phone.updateMatrixWorld();
        const pts = [[-w / 2, h / 2], [w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]].map(([x, y]) => {
          model.phoneDisplay.localToWorld(phoneCorner.set(x, y, 0)).project(camera);
          return { x: (phoneCorner.x * 0.5 + 0.5) * W, y: (-phoneCorner.y * 0.5 + 0.5) * H, z: phoneCorner.z };
        });
        phoneScreenRef.current?.setRect(pts.some((pt) => pt.z > 1) ? null : quadMatrix(pts, PHONE_SCREEN.width, PHONE_SCREEN.height));
      }
      function render() { if (!state.current.seated || state.current.phase !== 'room') controls.update(); if(model.roomActions.state.headphones)model.roomActions.objects.headphones.visible=camera.position.distanceTo(new THREE.Vector3(...WORKSPACE.seat.position))>0.24;const seatDistance = camera.position.distanceTo(new THREE.Vector3(...WORKSPACE.seat.position));
        // The chair reads as empty until you are in it. The body only exists
        // once the camera has arrived at the seat, so the approach never shows
        // someone already sitting there — and the head is dropped at the last
        // stretch so you are never inside your own skull.
        const inTheSeat = state.current.seated && seatDistance < 0.9;
        model.figure.root.visible = inTheSeat;
        // The hands are a separate group from the body. Left ungated they lie
        // on the keyboard above an empty chair — the exact disembodied-arms
        // problem the figure was added to solve.
        if (!inTheSeat) model.hands.root.visible = false;
        model.figure.head.visible = seatDistance > 0.24; renderer.render(scene, camera); updateMarkers(); updateScreenAlign(); updatePhoneAlign(); }
      function resetTiming() { last = null; cadenceSum = 0; cpuSum = 0; count = 0; }
      // Re-arm the render loop from outside tick() itself — used wherever something
      // animates without going through OrbitControls (camera-travel tween, resize).
      function invalidate() { gov.markDirty(); if (!raf && !disposed && !state.current.paused && !document.hidden) raf = requestAnimationFrame(tick); }
      function tick(now) {
        raf = 0;
        if (disposed || state.current.paused || document.hidden) return;
        if (!gov.isDirty()) return; // idle: stop issuing frames until something invalidates again
        if (!gov.shouldRender(now)) { raf = requestAnimationFrame(tick); return; } // still dirty, 60Hz floor
        const start = performance.now(); render(); const cpu = performance.now() - start;
        gov.recordFrame(cpu, now);
        const delta = last === null ? null : now - last;
        if (delta !== null && delta > 0 && delta < 250) { cadenceSum += delta; cpuSum += cpu; count++; }
        else { cadenceSum = 0; cpuSum = 0; count = 0; }
        last = now;
        if (now - emitted > 300) {
          const stats = gov.getStats();
          callbacks.current.onStats?.({ frameMs: count ? cadenceSum / count : null, cpuMs: count ? cpuSum / count : null, gpuMs: null, cameraPos: camera.position.toArray(), perfTier: stats.tier, pixelRatio: stats.pixelRatio });
          cadenceSum = 0; cpuSum = 0; count = 0; emitted = now;
        }
        raf = requestAnimationFrame(tick);
      }
      function refresh() {
        cancelAnimationFrame(raf); raf = 0; resetTiming();
        controls.enabled = false;
        updateMarkers();
        gov.markDirty();
        if (!state.current.paused && !document.hidden) raf = requestAnimationFrame(tick);
        else callbacks.current.onStats?.({ frameMs: null, cpuMs: null, gpuMs: null, cameraPos: camera.position.toArray() });
      }
      function markPhone(beat) { host.dataset.phoneState = beat; }
      // Grips are authored in each object's own frame, so a hand stays on the
      // handle or edge however the object turns. Desk props sit beyond arm's
      // length from an upright seat, so reaching leans the body in (camera and
      // shoulders together) instead of stretching the arm.
      const SEAT = new THREE.Vector3(...WORKSPACE.seat.position), look = new THREE.Vector3();
      const REST = [-0.27, 0.27].map(x => ({ p: new THREE.Vector3(x, 1.292, 0.405), q: new THREE.Quaternion() }));
      const restOf = h => REST[h === model.hands.left ? 0 : 1];
      const poseA = { p: new THREE.Vector3(), q: new THREE.Quaternion() }, poseB = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
      function gripPose(g, out) {
        if (g.q) { out.p.copy(g.p); out.q.copy(g.q); return out; }
        g.obj.updateMatrix();
        out.p.set(...g.p).applyMatrix4(g.obj.matrix);
        out.q.setFromEuler(new THREE.Euler(...g.r)).premultiply(g.obj.quaternion);
        return out;
      }
      // `via` routes the hand around an edge instead of through the object.
      function hold(h, a, b = a, w = 0, via = null) {
        if (via) { if (w < 0.5) { b = via; w *= 2; } else { a = via; w = (w - 0.5) * 2; } }
        gripPose(a, poseA); gripPose(b, poseB);
        h.hand.position.lerpVectors(poseA.p, poseB.p, w);
        h.hand.quaternion.slerpQuaternions(poseA.q, poseB.q, w);
      }
      const snapshot = h => ({ p: h.hand.position.clone(), q: h.hand.quaternion.clone() });
      function startLean() {
        rig.dispose(); look.copy(controls.target);
        model.hands.lean.copy(camera.position).sub(SEAT); if (model.hands.lean.length() > 0.7) model.hands.lean.set(0, 0, 0);
      }
      function leanCamera() {
        camera.position.copy(SEAT).add(model.hands.lean); camera.lookAt(look); controls.target.copy(look);
        camera.fov = 56; camera.updateProjectionMatrix();
      }
      const SEAT_LOOK = { x: WORKSPACE.seat.target[0], y: WORKSPACE.seat.target[1], z: WORKSPACE.seat.target[2] };
      const ZERO = { x: 0, y: 0, z: 0 };
      // Phone: palm down on the glass, thumb on the edge, then the hand rolls
      // under to hold it from behind while the screen turns to face you.
      const PHONE_TOP = { obj: model.phone, p: [-0.01, 0.03, 0.07], r: [0, 0, 0] };
      const PHONE_SIDE = { obj: model.phone, p: [-0.10, -0.005, 0.05], r: [0, 0, Math.PI / 2] };
      const PHONE_BACK = { obj: model.phone, p: [0, -0.045, 0.045], r: [0, 0, Math.PI * 0.999] };
      const PHONE_LEAN = { x: -0.28, y: -0.08, z: -0.42 };
      let phoneGrip = 1;
      function followPhone() { hold(model.hands.left, PHONE_TOP, PHONE_BACK, phoneGrip, PHONE_SIDE); }
      // PhoneScreen drives these. The texture under the DOM screen follows it,
      // so pulling back out of the zoom never pops to a different screen.
      function showFocusLock() {
        model.setPhoneScreen('focuslock'); model.phoneGlow.color.set('#b6d8ff'); model.phoneGlow.intensity = 0.14;
        markPhone('focuslock'); invalidate();
      }
      function phoneHome() {
        model.setPhoneScreen('home'); model.phoneGlow.color.set('#d4d5d8'); model.phoneGlow.intensity = 0.07;
        markPhone('zoomed'); invalidate();
      }
      // Hands lift the phone, then the camera closes on its screen the way the
      // monitor entry does, and PhoneScreen takes over as a real surface.
      function zoomPhone(reduced) {
        model.phone.updateMatrixWorld();
        const { width: w, height: h } = model.phoneDisplay.geometry.parameters;
        const center = model.phoneDisplay.getWorldPosition(new THREE.Vector3());
        // Along the display's own normal: the held phone is tilted, and pushing
        // in along the eye ray would keystone the screen.
        const normal = new THREE.Vector3(0, 0, 1).transformDirection(model.phoneDisplay.matrixWorld);
        const tan = Math.tan(THREE.MathUtils.degToRad(56 / 2));
        // Contain, not cover: the screen is portrait, so height usually decides.
        const distance = Math.max(h / (2 * tan), w / (2 * tan * camera.aspect)) * 1.06;
        phoneZoom = 'in'; markPhone('zooming');
        rig.flyTo({ position: center.clone().addScaledVector(normal, distance).toArray(), target: center.toArray() }, {
          reduced, duration: 0.9,
          onUpdate() { camera.fov = 56; camera.updateProjectionMatrix(); invalidate(); },
          onComplete() { phoneZoom = 'held'; markPhone('zoomed'); setPhoneLive(true); invalidate(); },
        });
      }
      function animatePhone(reduced) {
        action?.kill(); phoneInHand = true;
        model.resetPhone(); model.hands.reset(); model.hands.grip(model.hands.right, true); model.setHandsVisible(true);
        const left = model.hands.left, held = new THREE.Vector3(0.08, 1.53, 0.59);
        if (reduced) {
          rig.flyTo({ position: WORKSPACE.seat.position, target: [0.08, 1.51, 0.58] }, { reduced, duration: 0.65, onUpdate() { camera.fov = 56; camera.updateProjectionMatrix(); invalidate(); } });
          model.phone.position.copy(held); model.phone.rotation.x = 1.15; phoneGrip = 1;
          followPhone(); model.hands.update(); zoomPhone(true); return;
        }
        startLean();
        const [px, py, pz] = WORKSPACE.anchors.phone, from = snapshot(left), k = { reach: 0, grip: 0 };
        phoneGrip = 0;
        action = gsap.timeline({
          onUpdate() { if (k.reach < 1) hold(left, from, PHONE_TOP, k.reach); else { phoneGrip = k.grip; followPhone(); } model.hands.update(); leanCamera(); invalidate(); },
          onComplete() { zoomPhone(false); },
        });
        markPhone('reaching');
        action.to(model.hands.lean, { ...PHONE_LEAN, duration: 0.7, ease: 'power2.inOut' }, 0)
          .to(look, { x: px, y: py, z: pz + 0.15, duration: 0.7, ease: 'power2.inOut' }, 0)
          .to(k, { reach: 1, duration: 0.7, ease: 'power2.inOut' }, 0)
          .call(() => markPhone('lifting'), [], 0.7)
          .to(model.phone.position, { y: py + 0.12, duration: 0.35, ease: 'power2.out' }, 0.7)
          .to(model.hands.lean, { ...ZERO, duration: 0.85, ease: 'power2.inOut' }, 1.05)
          .to(look, { x: 0.08, y: 1.51, z: 0.58, duration: 0.85, ease: 'power2.inOut' }, 1.05)
          .to(model.phone.position, { x: held.x, y: held.y, z: held.z, duration: 0.85, ease: 'power2.inOut' }, 1.05)
          .to(model.phone.rotation, { x: 1.15, duration: 0.85, ease: 'power2.inOut' }, 1.05)
          .to(k, { grip: 1, duration: 0.85, ease: 'power2.inOut' }, 1.05)
          .call(() => markPhone('home'), [], 1.9);
        gsap.ticker.wake();
      }
      function returnPhone(reduced) {
        action?.kill(); rig.dispose(); returningPhone = true; markPhone('returning'); setPhoneLive(false);
        const finish = () => {
          phoneInHand = false; returningPhone = false; model.resetPhone(); model.hands.reset();
          phoneScreenRef.current?.reset(); markPhone('desk'); fly(); invalidate();
        };
        if (phoneZoom) {
          // Pull back out of the screen first. PhoneScreen rides the quad until
          // the seat view, then the matching texture underneath takes over.
          phoneZoom = 'out';
          rig.flyTo({ position: WORKSPACE.seat.position, target: [0.08, 1.51, 0.58] }, {
            reduced, duration: 0.7,
            onUpdate() { camera.fov = 56; camera.updateProjectionMatrix(); invalidate(); },
            onComplete() { phoneZoom = null; phoneScreenRef.current?.setRect(null); returnPhone(reduced); },
          });
          return;
        }
        if (reduced) { finish(); return; }
        const left = model.hands.left, [px, py, pz] = WORKSPACE.anchors.phone, k = { grip: phoneGrip, release: 0 };
        const atDesk = model.phone.position.distanceTo(new THREE.Vector3(px, py, pz)) < 0.002;
        let from = snapshot(left);
        startLean();
        action = gsap.timeline({ onUpdate() {
          if (k.release > 0) hold(left, from, restOf(left), k.release); else { phoneGrip = k.grip; followPhone(); }
          model.hands.update(); leanCamera(); invalidate();
        }, onComplete: finish });
        if (!atDesk) action.to(model.hands.lean, { ...PHONE_LEAN, duration: 0.8, ease: 'power2.inOut' }, 0)
          .to(look, { x: px, y: py, z: pz + 0.15, duration: 0.8, ease: 'power2.inOut' }, 0)
          .to(model.phone.position, { x: px, y: py + 0.12, z: pz, duration: 0.8, ease: 'power2.inOut' }, 0)
          .to(model.phone.rotation, { x: 0, y: 0, z: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
          .to(k, { grip: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
          .to(model.phone.position, { y: py, duration: 0.3, ease: 'power2.inOut' }, 0.8);
        const t = atDesk ? 0 : 1.1;
        action.call(() => { from = snapshot(left); }, [], t)
          .to(k, { release: 1, duration: 0.5, ease: 'power2.inOut' }, t)
          .to(model.hands.lean, { ...ZERO, duration: 0.5, ease: 'power2.inOut' }, t)
          .to(look, { ...SEAT_LOOK, duration: 0.5, ease: 'power2.inOut' }, t);
        gsap.ticker.wake();
      }
      // Notebook: the right hand takes the near corner from above; once lifted
      // both hands hold the side edges, fingers behind the cover.
      const NB_PICK = { obj: model.notebook, p: [0.17, 0.035, 0.2], r: [0, 0, 0] };
      const NB_SIDE = { obj: model.notebook, p: [0.29, -0.01, 0.12], r: [0, 0, -Math.PI / 2] };
      const NB_RIGHT = { obj: model.notebook, p: [0.25, -0.06, 0.18], r: [0, Math.PI / 2, Math.PI] };
      const NB_LEFT = { obj: model.notebook, p: [-0.25, -0.06, 0.18], r: [0, -Math.PI / 2, Math.PI] };
      const NB_LEAN = { x: 0.45, y: -0.06, z: -0.2 };
      const nb = { right: 1, left: 1 };
      function followNotebook() {
        hold(model.hands.right, NB_PICK, NB_RIGHT, nb.right, NB_SIDE);
        hold(model.hands.left, restOf(model.hands.left), NB_LEFT, nb.left);
        model.hands.update();
      }
      function animateNotebook(reduced) {
        action?.kill(); notebookInHand = true; model.resetNotebook(); model.hands.reset(); model.setHandsVisible(true);
        const held = { x:0.05,y:1.60,z:0.61 };
        const finish=()=>{host.dataset.notebookState='reading';nb.right=nb.left=1;followNotebook();invalidate();};
        if(reduced){
          rig.flyTo({position:WORKSPACE.seat.position,target:[0.05,1.60,0.61]},{reduced,duration:0.8,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          model.notebook.position.set(held.x,held.y,held.z);model.notebook.rotation.x=1.39;finish();return;
        }
        startLean(); host.dataset.notebookState='lifting';
        const right=model.hands.right,from=snapshot(right),k={reach:0},[nx,ny,nz]=WORKSPACE.anchors.notebook;
        nb.right=0; nb.left=0;
        action=gsap.timeline({onUpdate(){
          if(k.reach<1){hold(right,from,NB_PICK,k.reach);model.hands.update();}else followNotebook();
          leanCamera();invalidate();
        },onComplete:finish});
        action.to(model.hands.lean,{...NB_LEAN,duration:0.65,ease:'power2.inOut'},0)
          .to(look,{x:nx+0.1,y:ny,z:nz+0.1,duration:0.65,ease:'power2.inOut'},0)
          .to(k,{reach:1,duration:0.65,ease:'power2.inOut'},0)
          .to(model.notebook.position,{y:ny+0.14,duration:0.35,ease:'power2.out'},0.65)
          .to(model.hands.lean,{...ZERO,duration:0.85,ease:'power2.inOut'},1.0)
          .to(look,{...held,duration:0.85,ease:'power2.inOut'},1.0)
          .to(model.notebook.position,{...held,duration:0.85,ease:'power2.inOut'},1.0)
          .to(model.notebook.rotation,{x:1.39,duration:0.85,ease:'power2.inOut'},1.0)
          .to(nb,{right:1,duration:0.85,ease:'power2.inOut'},1.0)
          .to(nb,{left:1,duration:0.6,ease:'power2.inOut'},1.25);
        gsap.ticker.wake();
      }
      function returnNotebook(reduced) {
        action?.kill();rig.dispose();returningNotebook=true;host.dataset.notebookState='returning';
        const finish=()=>{notebookInHand=false;returningNotebook=false;model.resetNotebook();model.hands.reset();host.dataset.notebookState='desk';fly();invalidate();};
        if(reduced){finish();return;}
        const [x,y,z]=WORKSPACE.anchors.notebook,right=model.hands.right,k={release:0};
        let from=snapshot(right);
        startLean();
        action=gsap.timeline({onUpdate(){
          if(k.release>0){hold(right,from,restOf(right),k.release);hold(model.hands.left,restOf(model.hands.left));model.hands.update();}else followNotebook();
          leanCamera();invalidate();
        },onComplete:finish});
        action.to(nb,{left:0,duration:0.45,ease:'power2.inOut'},0)
          .to(model.notebook.position,{x,y:y+0.14,z,duration:0.8,ease:'power2.inOut'},0)
          .to(model.notebook.rotation,{x:0,y:0,z:0,duration:0.8,ease:'power2.inOut'},0)
          .to(nb,{right:0,duration:0.8,ease:'power2.inOut'},0)
          .to(model.hands.lean,{...NB_LEAN,duration:0.8,ease:'power2.inOut'},0)
          .to(look,{x:x+0.1,y,z:z+0.1,duration:0.8,ease:'power2.inOut'},0)
          .to(model.notebook.position,{y,duration:0.3,ease:'power2.inOut'},0.8)
          .call(()=>{from=snapshot(right);},[],1.1)
          .to(k,{release:1,duration:0.5,ease:'power2.inOut'},1.1)
          .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},1.1)
          .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},1.1);
        gsap.ticker.wake();
      }
      // Résumé: the right hand pulls the drawer by its handle and takes the page
      // from above; then both hands hold its side edges at reading distance.
      const PAGE_HELD = { x: 0.05, y: 1.56, z: 0.82 };
      const DRAWER_LEAN = { x: 0.3, y: -0.12, z: -0.05 };
      const drawerGrip = { handle: 0, pick: 0, right: 0, left: 0 };
      function poseDrawer() {
        const page = model.roomActions.resumePage, drawer = model.roomActions.objects.drawer, R = model.hands.right, k = drawerGrip;
        const HANDLE = { obj: drawer, p: [0, 0.03, 0.07], r: [0, 0, 0] };
        const PICK = { obj: page, p: [0.1, 0.03, 0.05], r: [0, 0, 0] };
        const RIGHT = { obj: page, p: [0.13, -0.05, 0.11], r: [0, Math.PI / 2, Math.PI] };
        const LEFT = { obj: page, p: [-0.13, -0.05, 0.11], r: [0, -Math.PI / 2, Math.PI] };
        if (k.right > 0) hold(R, PICK, RIGHT, k.right);
        else if (k.pick > 0) hold(R, HANDLE, PICK, k.pick);
        else hold(R, restOf(R), HANDLE, k.handle);
        hold(model.hands.left, restOf(model.hands.left), LEFT, k.left);
        model.hands.update();
      }
      // Awards frame: grips authored like the résumé page's, rotated into the upright frame (face +z, top +y).
      const AWARD_LEAN = { x: -0.2, y: -0.08, z: -0.5 };
      const AWARD_HELD_X = 1.13 - Math.PI / 2;
      const awardGrip = { pick: 0, left: 0, right: 0 };
      const upright = r => new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)))).toArray().slice(0, 3);
      const AWARD_R = upright([0, Math.PI / 2, Math.PI]), AWARD_L = upright([0, -Math.PI / 2, Math.PI]);
      function poseAward() {
        const o = model.roomActions.objects.award, L = model.hands.left, R = model.hands.right, k = awardGrip;
        const PICK = { obj: o, p: [-0.06, 0.2, 0.02], r: [0, 0, 0] };
        const LEFT = { obj: o, p: [-0.155, -0.13, -0.05], r: AWARD_L };
        const RIGHT = { obj: o, p: [0.155, -0.13, -0.05], r: AWARD_R };
        if (k.left > 0) hold(L, PICK, LEFT, k.left); else hold(L, restOf(L), PICK, k.pick);
        hold(R, restOf(R), RIGHT, k.right);
        model.hands.update();
      }
      // Pen: the right hand holds the pencil near its tip while the tip follows the pointer on the notebook page.
      const PEN_LEAN = { x: 0.42, y: -0.12, z: -0.22 };
      const PEN_HELD = { x: -0.95, y: 0.35 };
      const penGrip = { k: 0 };
      let lastInk = null;
      const penDrawing = () => extraHeld === 'pen' && host.dataset.actionState === 'drawing';
      function posePen() {
        hold(model.hands.right, restOf(model.hands.right), { obj: model.roomActions.objects.pen, p: [0.015, 0.035, 0.1], r: [0, 0, 0] }, penGrip.k);
        model.hands.update();
      }
      function drawAt(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const onPage = raycaster.intersectObject(model.notePage, false)[0];
        if (!onPage) { lastInk = null; return; }
        const pen = model.roomActions.objects.pen; pen.position.copy(onPage.point); pen.position.y += 0.002; posePen();
        if (down) {
          const c = model.notes.image, ctx = c.getContext('2d'), x = onPage.uv.x * c.width, y = (1 - onPage.uv.y) * c.height;
          ctx.strokeStyle = '#1d2733'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(...(lastInk || [x + 0.1, y])); ctx.lineTo(x, y); ctx.stroke();
          model.notes.needsUpdate = true; lastInk = [x, y];
        } else lastInk = null;
        invalidate();
      }
      const KEY_TOP = 1.2625;
      function pressKey(key,index) {
        if(!state.current.seated || state.current.phase !== 'room' || state.current.activeAnchorId) return;
        callbacks.current.onTypeKey?.(key);
        // The finger over that column dips until its tip meets the keycap top, then both come back up.
        const col=index%12,h=col<6?model.hands.left:model.hands.right,finger=h.fingers[Math.min(3,Math.floor((col<6?col:col-6)*4/6))];
        const tip=finger.localToWorld(finger.userData.tip.clone().sub(finger.position)),length=finger.userData.tip.distanceTo(finger.position);
        const dip=Math.asin(THREE.MathUtils.clamp((tip.y-KEY_TOP)/length,0,0.9));
        const depression={y:0};gsap.to(depression,{y:0.009,duration:0.07,repeat:1,yoyo:true,
          onUpdate(){model.roomActions.setKey(index,depression.y);finger.rotation.x=-dip*depression.y/0.009-(depression.y>0?Math.asin(Math.min(0.9,depression.y/length)):0);invalidate();},
          onComplete(){model.roomActions.setKey(index,0);finger.rotation.x=0;invalidate();}});
        gsap.ticker.wake();
      }
      function physicalKey(event) {
        if(event.key==='Escape'||event.key==='Tab'||event.ctrlKey||event.metaKey||event.altKey)return;
        if(event.key.length!==1&&!['Enter','Backspace','ArrowLeft','ArrowRight'].includes(event.key))return;
        if(state.current.activeAnchorId)return;event.preventDefault();
        const index=KEY_ROWS.join('').indexOf(event.key.toLowerCase());pressKey(event.key,index<0?59:index);
      }
      function finishExtra(id) {
        extraHeld=null;model.hands.reset();model.setHandsVisible(true);host.dataset.actionState='idle';invalidate();
        if(state.current.activeAnchorId===id)callbacks.current.onAnchorSelect?.(id);else fly();
      }
      function roomAction(id,reduced) {
        const r=model.roomActions,o=r.objects[id],h=model.hands[id==='coffee'||id==='lamp'?'left':'right'];
        action?.kill();model.hands.reset();model.setHandsVisible(true);if(!['headphones','award','drawer'].includes(id))model.hands.grip(h,id==='lamp'||id==='pen');extraHeld=id;host.dataset.actionState=id;
        controls.enabled=false;
        const update=()=>{r.apply();host.dataset.lampOn=String(r.state.lamp);host.dataset.blindsOpen=String(r.state.blinds);host.dataset.drawerOpen=String(r.state.drawer);host.dataset.windowOpen=String(r.state.windowOpen);model.hands.update();invalidate();};
        const follow=()=>{h.hand.position.copy(o.position).add(new THREE.Vector3(id==='coffee'?-0.085:0.12,-0.075,id==='award'?-0.075:id==='coffee'?-0.09:0.055));h.hand.rotation.copy(o.rotation);if(id==='coffee')h.hand.rotation.x+=1.15;update();};
        // The drawer stays "held" (extraHeld) while open so leaving it — via
        // Escape, BACK TO SEAT, or selecting another object — runs the normal
        // returnExtra() retraction instead of abandoning it open forever.
        const end=()=>{if(id==='drawer'&&r.state.drawer>0.5){model.hands.reset();host.dataset.actionState='drawer-open';invalidate();}else finishExtra(id);};
        if(id==='windowOpen') {
          const target=state.current.windowIntent?1:0;
          if(target===r.state.windowOpen){end();return;}
          const opening=target>r.state.windowOpen;
          const raiseBlindsFirst=opening&&r.state.blinds<0.5;
          rig.flyTo({position:WORKSPACE.seat.position,target:o.position.toArray()},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          if(reduced){
            if(raiseBlindsFirst)r.state.blinds=1;
            r.state.windowOpen=target;update();end();return;
          }
          action=gsap.timeline({onUpdate:update,onComplete:end});
          // The sash sits behind the closed blinds — from the seat, sliding it
          // is invisible until the blinds are out of the way. Opening always
          // raises them first (same tween shape/duration as the BLINDS
          // action); closing never lowers them back.
          if(raiseBlindsFirst)action.to(r.state,{blinds:1,duration:0.65,ease:'power2.inOut'});
          action.to(r.state,{windowOpen:target,duration:0.65,ease:'power2.inOut'});
          gsap.ticker.wake();return;
        }
        if(id==='drawer') {
          if(r.state.drawer>0.5){returnExtra(reduced);return;}
          const page=r.resumePage,room=o.parent,k=drawerGrip;Object.assign(k,{handle:0,pick:0,right:0,left:0});
          const reading=()=>{host.dataset.actionState='resume-reading';invalidate();};
          if(reduced){
            r.state.drawer=1;room.attach(page);page.position.set(PAGE_HELD.x,PAGE_HELD.y,PAGE_HELD.z);page.rotation.set(1.13,0,0);
            Object.assign(k,{handle:1,pick:1,right:1,left:1});update();poseDrawer();
            rig.flyTo({position:WORKSPACE.seat.position,target:[PAGE_HELD.x,PAGE_HELD.y,PAGE_HELD.z]},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
            reading();return;
          }
          const px=o.position.x,py=o.position.y-0.047,pz=o.position.z+0.46-0.23;
          startLean();
          action=gsap.timeline({onUpdate(){if(k.pick>0&&page.parent!==room)room.attach(page);update();poseDrawer();leanCamera();invalidate();},onComplete:reading});
          action.to(model.hands.lean,{...DRAWER_LEAN,duration:0.6,ease:'power2.inOut'},0)
            .to(look,{x:o.position.x,y:o.position.y,z:o.position.z+0.05,duration:0.6,ease:'power2.inOut'},0)
            .to(k,{handle:1,duration:0.6,ease:'power2.inOut'},0)
            .to(r.state,{drawer:1,duration:0.65,ease:'power2.inOut'},0.6)
            .to(look,{x:px,y:py,z:pz,duration:0.65,ease:'power2.inOut'},0.6)
            .to(k,{pick:1,duration:0.55,ease:'power2.inOut'},1.25)
            .to(page.position,{y:py+0.1,duration:0.3,ease:'power2.out'},1.8)
            .to(model.hands.lean,{...ZERO,duration:0.9,ease:'power2.inOut'},2.1)
            .to(look,{...PAGE_HELD,duration:0.9,ease:'power2.inOut'},2.1)
            .to(page.position,{...PAGE_HELD,duration:0.9,ease:'power2.inOut'},2.1)
            .to(page.rotation,{x:1.13,duration:0.9,ease:'power2.inOut'},2.1)
            .to(k,{right:1,duration:0.4,ease:'power2.inOut'},2.6)
            .to(k,{left:1,duration:0.65,ease:'power2.inOut'},2.35);
          gsap.ticker.wake();return;
        }
        if(['lamp','blinds'].includes(id)) {
          rig.flyTo({position:WORKSPACE.seat.position,target:o.position.toArray()},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          const target=1-r.state[id];
          if(reduced){r.state[id]=target;update();end();return;}
          action=gsap.timeline({onUpdate:update,onComplete:end});
          action.to(h.hand.position,{x:o.position.x,y:o.position.y+0.08,z:o.position.z+0.08,duration:0.5,ease:'power2.inOut'})
            .to(r.state,{[id]:target,duration:id==='lamp'?0.12:0.65,ease:'power2.inOut'})
            .to(h.hand.position,{x:h===model.hands.left?-0.27:0.27,y:1.28,z:0.405,duration:0.5});
          gsap.ticker.wake();return;
        }
        if(id==='pen') {
          const home=r.homes.pen,[nx,ny,nz]=WORKSPACE.anchors.notebook;penGrip.k=0;
          const drawing=()=>{host.dataset.actionState='drawing';renderer.domElement.style.cursor='crosshair';invalidate();};
          if(reduced){o.position.set(nx,ny+0.006,nz);o.rotation.set(PEN_HELD.x,PEN_HELD.y,0);penGrip.k=1;model.hands.lean.set(PEN_LEAN.x,PEN_LEAN.y,PEN_LEAN.z);look.set(nx,ny,nz);posePen();leanCamera();drawing();return;}
          startLean();
          action=gsap.timeline({onUpdate(){posePen();leanCamera();invalidate();},onComplete:drawing});
          action.to(model.hands.lean,{...PEN_LEAN,duration:0.7,ease:'power2.inOut'},0)
            .to(look,{x:nx,y:ny,z:nz,duration:0.7,ease:'power2.inOut'},0)
            .to(penGrip,{k:1,duration:0.6,ease:'power2.inOut'},0)
            .to(o.position,{y:home.y+0.06,duration:0.25,ease:'power2.out'},0.6)
            .to(o.rotation,{x:PEN_HELD.x,y:PEN_HELD.y,duration:0.5,ease:'power2.inOut'},0.6)
            .to(o.position,{x:nx,y:ny+0.006,z:nz,duration:0.5,ease:'power2.inOut'},0.85);
          gsap.ticker.wake();return;
        }
        if(id==='award') {
          // The left hand lifts the desk frame by its top edge; both hands then hold it at reading distance.
          const k=awardGrip,home=r.homes.award;Object.assign(k,{pick:0,left:0,right:0});
          const reading=()=>{host.dataset.actionState='award-reading';invalidate();};
          if(reduced){
            o.position.set(PAGE_HELD.x,PAGE_HELD.y,PAGE_HELD.z);o.rotation.set(AWARD_HELD_X,0,0);Object.assign(k,{pick:1,left:1,right:1});update();poseAward();
            rig.flyTo({position:WORKSPACE.seat.position,target:[PAGE_HELD.x,PAGE_HELD.y,PAGE_HELD.z]},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
            reading();return;
          }
          startLean();
          action=gsap.timeline({onUpdate(){update();poseAward();leanCamera();invalidate();},onComplete:reading});
          action.to(model.hands.lean,{...AWARD_LEAN,duration:0.6,ease:'power2.inOut'},0)
            .to(look,{x:home.x,y:home.y,z:home.z,duration:0.6,ease:'power2.inOut'},0)
            .to(k,{pick:1,duration:0.6,ease:'power2.inOut'},0)
            .to(o.position,{y:home.y+0.08,duration:0.3,ease:'power2.out'},0.6)
            .to(model.hands.lean,{...ZERO,duration:0.9,ease:'power2.inOut'},0.9)
            .to(look,{...PAGE_HELD,duration:0.9,ease:'power2.inOut'},0.9)
            .to(o.position,{...PAGE_HELD,duration:0.9,ease:'power2.inOut'},0.9)
            .to(o.rotation,{x:AWARD_HELD_X,y:0,duration:0.9,ease:'power2.inOut'},0.9)
            .to(k,{left:1,duration:0.9,ease:'power2.inOut'},0.9)
            .to(k,{right:1,duration:0.5,ease:'power2.inOut'},1.3);
          gsap.ticker.wake();return;
        }
        if(id==='headphones') {
          const wear=!r.state.headphones; r.state.headphones=Number(wear);host.dataset.headphonesOn=String(wear);
          window.dispatchEvent(new CustomEvent('workspace:headphones',{detail:{on:wear}}));
          const home=r.homes.headphones,HEAD=SEAT;
          if(reduced){o.position.copy(wear?HEAD:home);o.rotation.x=wear?Math.PI/2:0;o.visible=!wear;end();return;}
          // Both hands take the ear cups, palms in, and carry them up past the camera.
          const L=model.hands.left,R=model.hands.right,k={w:0};
          const CUP_L={obj:o,p:[-0.16,0.02,0.06],r:[0,0,Math.PI/2]},CUP_R={obj:o,p:[0.16,0.02,0.06],r:[0,0,-Math.PI/2]};
          const LEAN={x:0.35,y:-0.08,z:-0.5},HOME_LOOK={x:home.x,y:home.y,z:home.z+0.1};
          let fromL=snapshot(L),fromR=snapshot(R),releasing=false;
          const release=()=>{releasing=true;fromL=snapshot(L);fromR=snapshot(R);k.w=0;};
          startLean();
          action=gsap.timeline({onUpdate(){
            if(releasing){hold(L,fromL,restOf(L),k.w);hold(R,fromR,restOf(R),k.w);}else{hold(L,fromL,CUP_L,k.w);hold(R,fromR,CUP_R,k.w);}
            update();leanCamera();
          },onComplete(){o.visible=!wear;end();}});
          if(wear){
            o.visible=true;
            action.to(model.hands.lean,{...LEAN,duration:0.7,ease:'power2.inOut'},0)
              .to(look,{...HOME_LOOK,duration:0.7,ease:'power2.inOut'},0)
              .to(k,{w:1,duration:0.7,ease:'power2.inOut'},0)
              .to(o.position,{y:home.y+0.15,duration:0.35,ease:'power2.out'},0.7)
              .to(model.hands.lean,{...ZERO,duration:0.8,ease:'power2.inOut'},1.05)
              .to(look,{...SEAT_LOOK,duration:0.8,ease:'power2.inOut'},1.05)
              .to(o.position,{x:HEAD.x,y:HEAD.y,z:HEAD.z,duration:0.8,ease:'power2.inOut'},1.05)
              .to(o.rotation,{x:Math.PI/2,duration:0.8,ease:'power2.inOut'},1.05)
              .call(()=>{o.visible=false;release();},[],1.85)
              .to(k,{w:1,duration:0.5,ease:'power2.inOut'},1.85);
          } else {
            o.visible=false;o.position.copy(HEAD);o.rotation.x=Math.PI/2;
            action.to(k,{w:1,duration:0.45,ease:'power2.inOut'},0)
              .to(model.hands.lean,{...LEAN,duration:0.8,ease:'power2.inOut'},0.45)
              .to(look,{...HOME_LOOK,duration:0.8,ease:'power2.inOut'},0.45)
              .to(o.position,{x:home.x,y:home.y+0.15,z:home.z,duration:0.8,ease:'power2.inOut'},0.45)
              .to(o.rotation,{x:0,duration:0.8,ease:'power2.inOut'},0.45)
              .call(()=>{o.visible=true;},[],0.65)
              .to(o.position,{y:home.y,duration:0.3,ease:'power2.inOut'},1.25)
              .call(release,[],1.55)
              .to(k,{w:1,duration:0.5,ease:'power2.inOut'},1.55)
              .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},1.55)
              .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},1.55);
          }
          gsap.ticker.wake();return;
        }
        if(id==='coffee'&&r.state.coffeeLevel<=0.001) {
          // An empty mug refills where it stands.
          const clock={t:0,energy:1};
          const done=()=>{r.state.coffeeLevel=1;r.updateLiquid(0,0);host.dataset.coffeeLevel='1';window.dispatchEvent(new CustomEvent('workspace:coffee',{detail:{level:1}}));end();};
          if(reduced){done();return;}
          rig.flyTo({position:WORKSPACE.seat.position,target:o.position.toArray()},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          action=gsap.timeline({onUpdate(){r.updateLiquid(clock.t,clock.energy);update();},onComplete:done});
          action.to(r.state,{coffeeLevel:1,duration:1.2,ease:'power1.inOut'},0).to(clock,{t:1.6,duration:1.6,ease:'none'},0).to(clock,{energy:0,duration:0.5},1.1);
          gsap.ticker.wake();return;
        }
        if(id==='coffee') {
          const level=Math.max(0,r.state.coffeeLevel-0.25),clock={t:0,energy:1},home=r.homes.coffee;
          const finish=()=>{r.state.coffeeLevel=level;o.position.copy(home);o.rotation.set(0,0,0);r.updateLiquid(0,0);host.dataset.coffeeLevel=String(level);window.dispatchEvent(new CustomEvent('workspace:coffee',{detail:{level}}));end();};
          if(reduced){finish();return;}
          // Left hand: fingers through the handle, thumb on top, palm toward the mug.
          const left=model.hands.left,MUG={obj:o,p:[-0.033,0.012,0.125],r:[0,Math.PI/4,Math.PI/2]};
          const LEAN={x:-0.2,y:-0.05,z:-0.2},HOME_LOOK={x:home.x,y:home.y,z:home.z},k={reach:0,release:0};
          let from=snapshot(left);
          startLean();
          action=gsap.timeline({onUpdate(){
            r.updateLiquid(clock.t,clock.energy);
            if(k.release>0)hold(left,from,restOf(left),k.release);else hold(left,from,MUG,k.reach);
            update();leanCamera();
          },onComplete:finish});
          action.to(model.hands.lean,{...LEAN,duration:0.6,ease:'power2.inOut'},0)
            .to(look,{...HOME_LOOK,duration:0.6,ease:'power2.inOut'},0)
            .to(k,{reach:1,duration:0.6,ease:'power2.inOut'},0)
            .to(o.position,{y:home.y+0.1,duration:0.35,ease:'power2.out'},0.6)
            .to(model.hands.lean,{...ZERO,duration:0.7,ease:'power2.inOut'},0.95)
            .to(look,{x:-0.08,y:1.50,z:0.6,duration:0.7,ease:'power2.inOut'},0.95)
            .to(o.position,{x:-0.10,y:1.52,z:0.78,duration:0.7,ease:'power2.inOut'},0.95)
            .to(o.rotation,{x:0.35,duration:0.55},1.65).to(r.state,{coffeeLevel:level,duration:0.5},1.75)
            .to(o.rotation,{x:0,duration:0.4},2.3)
            .to(model.hands.lean,{...LEAN,duration:0.65,ease:'power2.inOut'},2.7)
            .to(look,{...HOME_LOOK,duration:0.65,ease:'power2.inOut'},2.7)
            .to(o.position,{x:home.x,y:home.y+0.1,z:home.z,duration:0.65,ease:'power2.inOut'},2.7)
            .to(o.position,{y:home.y,duration:0.35,ease:'power2.inOut'},3.35)
            .call(()=>{from=snapshot(left);},[],3.7)
            .to(k,{release:1,duration:0.5,ease:'power2.inOut'},3.7)
            .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},3.7)
            .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},3.7)
            .to(clock,{t:4.2,duration:4.2,ease:'none'},0).to(clock,{energy:0,duration:0.75},3.2);
          gsap.ticker.wake();return;
        }
      }
      function returnExtra(reduced) {
        const id=extraHeld,r=model.roomActions,o=r.objects[id];action?.kill();rig.dispose();
        if(id==='windowOpen'){finishExtra(id);return;}
        if(id==='drawer'){
          const page=r.resumePage,room=o.parent,k=drawerGrip;
          const update=()=>{r.apply();host.dataset.drawerOpen=String(r.state.drawer);};
          const finish=()=>{o.attach(page);page.position.set(0,-0.047,-0.23);page.rotation.set(0,0,0);r.state.drawer=0;update();Object.assign(k,{handle:0,pick:0,right:0,left:0});finishExtra(id);};
          if(reduced||page.parent!==room){finish();return;}
          const floor={x:o.position.x,y:o.position.y-0.047,z:o.position.z-0.23};
          startLean();
          action=gsap.timeline({onUpdate(){if(k.pick===0&&page.parent!==o)o.attach(page);update();poseDrawer();leanCamera();invalidate();},onComplete:finish});
          action.to(page.position,{...floor,duration:0.8,ease:'power2.inOut'},0)
            .to(page.rotation,{x:0,duration:0.8,ease:'power2.inOut'},0)
            .to(k,{left:0,duration:0.45,ease:'power2.inOut'},0)
            .to(k,{right:0,duration:0.8,ease:'power2.inOut'},0)
            .to(model.hands.lean,{...DRAWER_LEAN,duration:0.8,ease:'power2.inOut'},0)
            .to(look,{...floor,duration:0.8,ease:'power2.inOut'},0)
            .to(k,{pick:0,duration:0.45,ease:'power2.inOut'},0.8)
            .to(r.state,{drawer:0,duration:0.6,ease:'power2.inOut'},1.25)
            .to(look,{x:o.position.x,y:o.position.y,z:r.homes.drawer.z+0.05,duration:0.6,ease:'power2.inOut'},1.25)
            .to(k,{handle:0,duration:0.5,ease:'power2.inOut'},1.85)
            .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},1.85)
            .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},1.85);
          gsap.ticker.wake();return;
        }
        if(id==='pen'){
          const home=r.homes.pen;
          const finish=()=>{o.position.copy(home);o.rotation.set(...PEN_REST);penGrip.k=0;lastInk=null;renderer.domElement.style.cursor='';finishExtra(id);};
          if(reduced){finish();return;}
          startLean();
          action=gsap.timeline({onUpdate(){posePen();leanCamera();invalidate();},onComplete:finish});
          action.to(o.position,{x:home.x,y:home.y+0.06,z:home.z,duration:0.55,ease:'power2.inOut'},0)
            .to(o.rotation,{x:PEN_REST[0],y:PEN_REST[1],duration:0.55,ease:'power2.inOut'},0)
            .to(o.position,{y:home.y,duration:0.2,ease:'power2.inOut'},0.55)
            .to(penGrip,{k:0,duration:0.5,ease:'power2.inOut'},0.75)
            .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},0.75)
            .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},0.75);
          gsap.ticker.wake();return;
        }
        if(id!=='award'){o.position.copy(r.homes[id]);o.rotation.set(0,0,0);r.updateLiquid(0,0);finishExtra(id);return;}
        const k=awardGrip,home=r.homes.award;
        const finish=()=>{o.position.copy(home);o.rotation.set(...AWARD_REST);Object.assign(k,{pick:0,left:0,right:0});finishExtra(id);};
        if(reduced){finish();return;}
        startLean();
        action=gsap.timeline({onUpdate(){poseAward();leanCamera();invalidate();},onComplete:finish});
        action.to(k,{right:0,duration:0.4,ease:'power2.inOut'},0)
          .to(k,{left:0,duration:0.9,ease:'power2.inOut'},0)
          .to(model.hands.lean,{...AWARD_LEAN,duration:0.9,ease:'power2.inOut'},0)
          .to(look,{x:home.x,y:home.y,z:home.z,duration:0.9,ease:'power2.inOut'},0)
          .to(o.position,{x:home.x,y:home.y+0.08,z:home.z,duration:0.9,ease:'power2.inOut'},0)
          .to(o.rotation,{x:AWARD_REST[0],y:AWARD_REST[1],duration:0.9,ease:'power2.inOut'},0)
          .to(o.position,{y:home.y,duration:0.3,ease:'power2.inOut'},0.9)
          .to(k,{pick:0,duration:0.5,ease:'power2.inOut'},1.2)
          .to(model.hands.lean,{...ZERO,duration:0.5,ease:'power2.inOut'},1.2)
          .to(look,{...SEAT_LOOK,duration:0.5,ease:'power2.inOut'},1.2);
        gsap.ticker.wake();
      }
      const BASE_FOV = 40, PUNCH_FOV = 15; // widen near the screen — acceleration, not a dolly
      function fly() {
        tween?.kill(); rig.dispose();
        if (returningPhone || returningNotebook) return;
        if(extraHeld){returnExtra(state.current.reducedMotion);return;}
        if (notebookInHand) { returnNotebook(state.current.reducedMotion); return; }
        if (phoneInHand) { returnPhone(state.current.reducedMotion); return; }
        action?.kill();
        model.setHandsVisible(true);
        const { phase: currentPhase, activeAnchorId: selected, reducedMotion: reduced } = state.current;
        if (currentPhase !== 'entering' && currentPhase !== 'leaving' && !state.current.liveMonitor) {
          callbacks.current.onScreenRect?.(null);
        }
        // Seated travel shares the existing rig. No idle update() is called.
        if (currentPhase === 'room' && state.current.seated) {
          controls.enabled = false; controls.enableDamping = false;
          controls.minDistance = 0.025; controls.maxDistance = 20;
          controls.minPolarAngle = 0.001; controls.maxPolarAngle = Math.PI - 0.001;
          controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
          if(model.roomActions.objects[selected]){roomAction(selected,reduced);return;}
          if(selected==='keyboard'){renderer.domElement.focus();callbacks.current.onAnchorSelect?.('keyboard');return;}
          if (selected === 'phone') { animatePhone(reduced); return; }
          if (selected === 'notebook') { animateNotebook(reduced); return; }
          const view = selected === 'window'
            ? { position: [0.05,1.72,1.16], target: WORKSPACE.anchors.window }
            : selected === 'desk'
            ? { position: [0.05,1.72,1.16], target: WORKSPACE.anchors.desk }
            : selected === 'phone'
            ? { position: [-0.80, 1.72, 0.10], target: WORKSPACE.anchors.phone }
            : selected === 'notebook'
            ? { position: [1.14, 1.99, 0.40], target: WORKSPACE.anchors.notebook }
            : { position: [0.05, reduced ? 1.72 : 1.745, 1.16], target: WORKSPACE.seat.target };
          const startFov = camera.fov;
          const started = performance.now();
          rig.flyTo(view, { reduced, duration: 1.05, onUpdate() {
            const t = reduced ? 1 : Math.min(1, (performance.now() - started) / 1050);
            camera.fov = reduced ? (selected ? 46 : 56) : THREE.MathUtils.lerp(startFov, selected ? 46 : 56, t);
            camera.updateProjectionMatrix(); invalidate();
          }, onComplete() {
            headYaw = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
            headPitch = Math.asin((controls.target.y - camera.position.y) / camera.position.distanceTo(controls.target));
            model.hands.reset(); model.setHandsVisible(true);
            if (!selected && !reduced) {
              action?.kill();
              model.hands.left.fingers[1].rotation.x = -0.12;
              action = gsap.to(model.hands.left.fingers[1].rotation, { x: 0, duration: 0.35, ease: 'power2.out', onUpdate: invalidate });
              gsap.ticker.wake();
            }
            // A small downward landing, then no more frames.
            if (!reduced && !selected) {
              const landing = { y: camera.position.y };
              tween = gsap.to(landing, { y: WORKSPACE.seat.position[1], duration: 0.18, ease: 'power2.out', onUpdate() {
                camera.position.y = landing.y; camera.lookAt(controls.target); invalidate();
              }});
              gsap.ticker.wake();
            }
            invalidate();
          }});
          return;
        }
        controls.enableDamping = !state.current.seated;
        controls.minAzimuthAngle = -0.8; controls.maxAzimuthAngle = 0.85;
        controls.maxDistance = 11;
        camera.fov = BASE_FOV; camera.updateProjectionMatrix();
        let view = currentPhase === 'leaving' && state.current.seated
          ? { position: new THREE.Vector3(...WORKSPACE.seat.position), target: new THREE.Vector3(...WORKSPACE.seat.target) } : home;
        controls.minDistance = 0.025;
        controls.minPolarAngle = currentPhase === 'room' && selected !== 'phone' && selected !== 'notebook' ? Math.PI * 0.2 : 0.01;
        controls.maxPolarAngle = currentPhase === 'room' ? Math.PI * 0.47 : Math.PI - 0.01;
        if (currentPhase === 'entering' || currentPhase === 'inside') {
          // Move perpendicular to the screen; its known physical size defines
          // the end distance. The HTML handoff occurs only at the end of flight.
          const fitHeight = WORKSPACE.screen.height / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)));
          const fitWidth = WORKSPACE.screen.width / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * camera.aspect);
          view = { position: screenCenter.clone().add(new THREE.Vector3(0, 0, Math.min(fitHeight, fitWidth) * 0.94)), target: screenCenter.clone() };
        } else if (currentPhase !== 'leaving' && selected && WORKSPACE.anchors[selected]) {
          const target = new THREE.Vector3(...WORKSPACE.anchors[selected]);
          const offset = selected === 'phone' ? new THREE.Vector3(0, 0.524, 0.13)
            : selected === 'notebook' ? new THREE.Vector3(0.0, 0.78, 0.10)
            : selected === 'monitor' ? new THREE.Vector3(0.2, 0.17, 2.1)
            : new THREE.Vector3(1.15, 0.95, 2.3);
          view = { position: target.clone().add(offset), target };
        }
        if (reduced) {
          place(view); updateMarkers();
          camera.fov = BASE_FOV; camera.updateProjectionMatrix();
          callbacks.current.onScreenRect?.(null);
          callbacks.current.onTravel?.(currentPhase === 'entering' ? 1 : 0, currentPhase === 'entering' ? 'inside' : 'room');
          return;
        }
        const proxy = { x: camera.position.x, y: camera.position.y, z: camera.position.z, tx: controls.target.x, ty: controls.target.y, tz: controls.target.z };
        const isTravel = currentPhase === 'entering' || currentPhase === 'leaving';
        tween = gsap.to(proxy, {
          x: view.position.x, y: view.position.y, z: view.position.z,
          tx: view.target.x, ty: view.target.y, tz: view.target.z,
          duration: currentPhase === 'entering' ? 1.2 : currentPhase === 'leaving' ? 1.0 : 0.9,
          // Entering ramps hard — slow start, violent finish — for a "pulled
          // into the machine" feel. Leaving mirrors it: fast start settling out,
          // as if pulling back out of the screen into the room.
          ease: currentPhase === 'entering' ? 'power4.in' : currentPhase === 'leaving' ? 'power4.out' : 'power2.inOut',
          onUpdate() {
            invalidate(); // GSAP drives the camera directly here, bypassing OrbitControls' own 'change' event
            camera.position.set(proxy.x, proxy.y, proxy.z);
            controls.target.set(proxy.tx, proxy.ty, proxy.tz);
            if (isTravel) {
              const raw = tween.progress(); // linear time fraction, independent of the position easing above
              const t = currentPhase === 'entering' ? raw : 1 - raw;
              const punch = Math.max(0, (t - 0.6) / 0.4);
              camera.fov = BASE_FOV + punch * PUNCH_FOV;
              camera.updateProjectionMatrix();
              callbacks.current.onTravel?.(t, currentPhase);
            }
          },
          onComplete() {
            controls.enabled = false;
            const CLOSE_READ = ['phone','notebook','award','coffee','drawer','headphones'].includes(selected);
            controls.minDistance = currentPhase === 'room' && !CLOSE_READ ? 1.4 : 0.025;
            if (currentPhase === 'entering') {
              callbacks.current.onScreenRect?.(null);
              callbacks.current.onTravel?.(1, 'inside');
            } else if (currentPhase === 'leaving') {
              camera.fov = BASE_FOV; camera.updateProjectionMatrix();
              callbacks.current.onScreenRect?.(null);
              callbacks.current.onTravel?.(0, 'room');
            }
          },
        });
        gsap.ticker.wake();
      }
      function resize() {
        const width = host.clientWidth || 1, height = host.clientHeight || 1;
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); framing();
        if (!state.current.seated && !state.current.activeAnchorId && state.current.phase === 'room') place(home);
        else if (state.current.phase === 'inside') fly();
        if (!state.current.paused) render();
      }
      function hit(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        // Intersect the whole model so a desk/chair cannot be clicked through.
        // Hands rest on the keys; clicks pass through them to whatever is underneath.
        const hands = [model.hands.left, model.hands.right];
        const isHand = o => hands.some(h => o === h.arm || o === h.sleeve || h.hand === o || (() => { for (let p = o.parent; p; p = p.parent) if (p === h.hand) return true; return false; })());
        const result = raycaster.intersectObject(model.root, true).find(r => !isHand(r.object));
        host.dataset.hitKey = result?.object === model.keys ? String(result.instanceId) : '';
        return result?.object.userData.anchorId || null;
      }
      function pointerDown(event) { down = { x: event.clientX, y: event.clientY, lx: event.clientX, ly: event.clientY, moved: false }; if (state.current.seated) renderer.domElement.setPointerCapture(event.pointerId); if (penDrawing()) drawAt(event); }
      const reading = () => !!extraHeld && /-reading$/.test(host.dataset.actionState || '');
      function wheelZoom(event) {
        if (!reading()) return;
        event.preventDefault();
        camera.fov = THREE.MathUtils.clamp(camera.fov + event.deltaY * 0.03, 18, 56); camera.updateProjectionMatrix(); invalidate();
      }
      function pointerMove(event) {
        if (state.current.phase !== 'room') return;
        if (phoneInHand) { renderer.domElement.style.cursor = 'default'; return; }
        if (penDrawing()) { drawAt(event); return; }
        if (reading()) {
          // Zoomed in on a held page: the pointer moves the gaze across it.
          const rect = renderer.domElement.getBoundingClientRect(), zoom = (56 - camera.fov) / 38;
          const nx = (event.clientX - rect.left) / rect.width * 2 - 1, ny = (event.clientY - rect.top) / rect.height * 2 - 1;
          look.set(PAGE_HELD.x + nx * 0.09 * zoom, PAGE_HELD.y - ny * 0.13 * zoom, PAGE_HELD.z);
          camera.lookAt(look); controls.target.copy(look); invalidate(); return;
        }
        if (notebookInHand || extraHeld) return;
        if (down && !phoneInHand && state.current.seated && !state.current.activeAnchorId && !rig.flying && !tween?.isActive()) {
          headYaw -= (event.clientX - down.lx) * 0.005;
          headPitch = THREE.MathUtils.clamp(headPitch - (event.clientY - down.ly) * 0.005, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
          down.moved ||= Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6;
          down.lx = event.clientX; down.ly = event.clientY;
          controls.target.copy(camera.position).add(new THREE.Vector3(-Math.sin(headYaw) * Math.cos(headPitch), Math.sin(headPitch), -Math.cos(headYaw) * Math.cos(headPitch)));
          camera.lookAt(controls.target); invalidate();
        }
        renderer.domElement.style.cursor = hit(event) ? 'pointer' : 'grab';
      }
      function pointerUp(event) {
        if (penDrawing()) { down = null; lastInk = null; return; }
        if (!down || down.moved || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6 || state.current.phase !== 'room') { down = null; return; }
        down = null;
        if (phoneInHand) return;
        const id = hit(event); if (!id) return;
        if (!state.current.seated && id !== 'chair') return;
        if (id === 'keyboard') { const index=Number(host.dataset.hitKey); pressKey(KEY_ROWS[Math.floor(index/12)]?.[index%12] || ' ',index);renderer.domElement.focus();return; }
        if (id === 'chair') { callbacks.current.onSit?.(); return; }
        const marker = markerRefs.current.get(id); marker?.focus();
        if (id === 'monitor' && callbacks.current.onEnterScreen) callbacks.current.onEnterScreen();
        else callbacks.current.onAnchorSelect?.(id === 'window' ? 'windowOpen' : id);
      }
      renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Room keyboard — type while focused');
      renderer.domElement.addEventListener('keydown', physicalKey);
      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointermove', pointerMove);
      renderer.domElement.addEventListener('wheel', wheelZoom, { passive: false });
      renderer.domElement.addEventListener('pointerup', pointerUp);
      document.addEventListener('visibilitychange', refresh);
      resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
      resize(); place(home); render();
      callbacks.current.onProgress?.({ progress: 1 });
      callbacks.current.onReady?.({ splatCount: null });
      let entryPlayed = false;
      function startEntryPower() {
        if (entryPlayed) return;
        entryPlayed = true;
        // Two shallow irregular dips, once when the intro reveals the room.
        if (!state.current.reducedMotion) {
          for (const [ms, power] of [[0, 0.8], [120, 1], [360, 0.72], [470, 0.92], [900, 1]]) {
            entryTimers.push(setTimeout(() => { model.setEntryPower(power); invalidate(); }, ms));
          }
        }
      }
      api.current = { fly, refresh, startEntryPower, showFocusLock, phoneHome, setSky: (s) => model.setSky(s), clearNotes: () => { model.clearNotes(); invalidate(); } };
      if (typeof localStorage !== 'undefined' && localStorage.getItem('v3:test') === '1') {
        const box3 = new THREE.Box3();
        const boxToPlain = (b) => ({ min: b.min.toArray(), max: b.max.toArray() });
        window.__v3test = {
          projectAnchor(id) {
            const point = id === 'chair' ? WORKSPACE.chair : WORKSPACE.anchors[id];
            if (!point) return null;
            const rect = host.getBoundingClientRect();
            projected.set(...point).project(camera);
            return { x: (projected.x * 0.5 + 0.5) * rect.width, y: (-projected.y * 0.5 + 0.5) * rect.height };
          },
          boxOf(name) {
            if (name === 'monitorScreen' || name === 'monitorBezel' || name === 'desk') return boxToPlain(model.staticBoxes[name]);
            if (name === 'phone') return boxToPlain(box3.setFromObject(model.phone));
            if (name === 'coffeeMug') return boxToPlain(box3.setFromObject(model.roomActions.objects.coffee));
            if (name === 'handL') return boxToPlain(box3.setFromObject(model.hands.left.hand));
            if (name === 'handR') return boxToPlain(box3.setFromObject(model.hands.right.hand));
            if (name === 'armL') return boxToPlain(box3.setFromObject(model.hands.left.arm));
            if (name === 'armR') return boxToPlain(box3.setFromObject(model.hands.right.arm));
            if (name === 'held') {
              const held = extraHeld ? model.roomActions.objects[extraHeld]
                : notebookInHand ? model.notebook
                : phoneInHand ? model.phone : null;
              return held ? boxToPlain(box3.setFromObject(held)) : null;
            }
            return null;
          },
          timeline() { return action || null; },
          projectKey(index) {
            const m = new THREE.Matrix4(); model.keys.getMatrixAt(index, m);
            const rect = host.getBoundingClientRect();
            projected.setFromMatrixPosition(m).applyMatrix4(model.keys.matrixWorld).project(camera);
            return { x: (projected.x * 0.5 + 0.5) * rect.width, y: (-projected.y * 0.5 + 0.5) * rect.height };
          },
          inkPixels() {
            const c = model.notes.image, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 80) n++; return n;
          },
          fingerTips() {
            return [model.hands.left, model.hands.right].map(h => h.fingers.map(f => f.localToWorld(f.userData.tip.clone().sub(f.position)).toArray()));
          },
        };
      }
      refresh();
      return () => {
        disposed = true; entryTimers.forEach(clearTimeout); rig?.dispose(); action?.kill(); cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', refresh);
        renderer.domElement.removeEventListener('keydown', physicalKey);
        renderer.domElement.removeEventListener('pointerdown', pointerDown);
        renderer.domElement.removeEventListener('pointermove', pointerMove);
        renderer.domElement.removeEventListener('wheel', wheelZoom);
        renderer.domElement.removeEventListener('pointerup', pointerUp);
        controls.dispose(); model.dispose(); renderer.dispose(); renderer.domElement.remove(); gov.dispose(); api.current = null;
      };
    } catch (error) {
      disposed = true; entryTimers.forEach(clearTimeout); rig?.dispose(); action?.kill(); cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect(); controls?.dispose(); model?.dispose(); renderer?.dispose(); renderer?.domElement?.remove();
      callbacks.current.onError?.(error);
    }
  }, []);

  useEffect(() => { if (entryVisible) api.current?.startEntryPower(); }, [entryVisible]);

  // Restore marker visibility before the parent returns keyboard focus.
  useLayoutEffect(() => { api.current?.refresh(); }, [paused, phase, seated, liveMonitor]);
  useEffect(() => { api.current?.fly(); }, [activeAnchorId, phase, reducedMotion, seated]);

  return (
    <div ref={hostRef} className="stage-root workspace-stage" data-scene="workspace">
      <style>{css}</style>
      <PhoneScreen ref={phoneScreenRef} interactive={phoneLive}
        onOpenApp={() => api.current?.showFocusLock()} onHome={() => api.current?.phoneHome()} />
      <button className="pen-clear" onClick={() => api.current?.clearNotes()}>CLEAR PAGE</button>
      <button ref={el => { if (el) markerRefs.current.set('chair', el); else markerRefs.current.delete('chair'); }}
        className="anchor-marker workspace-marker workspace-sit" data-object="chair" aria-label="Sit in the chair"
        onClick={() => callbacks.current.onSit?.()}><span className="workspace-marker-label">SIT DOWN</span></button>
      {[...anchors, ...[{id:'phone',label:'Phone'},{id:'lamp',label:'Lamp switch'},{id:'coffee',label:'Coffee'},{id:'award',label:'Awards'},{id:'drawer',label:'Resume'},{id:'blinds',label:'Blind cord'},{id:'headphones',label:'Headphones'},{id:'keyboard',label:'Keyboard'},{id:'pen',label:'Pen'}].map(a=>({...a,readout:'Interact'}))].filter(anchor => WORKSPACE.anchors[anchor.id]).map((anchor, index) => (
        <button key={anchor.id} ref={el => { if (el) markerRefs.current.set(anchor.id, el); else markerRefs.current.delete(anchor.id); }}
          className={`anchor-marker workspace-marker${activeAnchorId === anchor.id ? ' is-active' : ''}`}
          data-object={anchor.id} aria-label={`${anchor.label} — ${anchor.readout}`}
          onClick={() => {
            if (!seated) return;
            // The monitor goes straight in; the window only opens/closes (contact
            // info lives on the CONTACT button).
            if (anchor.id === 'monitor' && callbacks.current.onEnterScreen) callbacks.current.onEnterScreen();
            else callbacks.current.onAnchorSelect?.(anchor.id === 'window' ? 'windowOpen' : anchor.id);
          }}>
          <span className="workspace-marker-dot" aria-hidden="true" />
          <span className="workspace-marker-label"><small>0{index + 1}</small>{anchor.label}<span aria-hidden="true">↗</span></span>
        </button>
      ))}
    </div>
  );
}

const css = `
.workspace-stage { position:absolute; inset:0; overflow:hidden; background:#15191b; }
.workspace-stage canvas { display:block; width:100%; height:100%; touch-action:none; }
.workspace-marker { position:absolute; top:0; left:0; display:flex; align-items:center; padding:0; gap:12px; opacity:0; transition:opacity var(--d-feedback) var(--ease); z-index:2; }
.workspace-marker-dot { width:8px; height:8px; border:1px solid var(--bone); border-radius:50%; box-shadow:0 0 0 5px rgba(20,24,25,.18); background:var(--void); }
.workspace-marker-label { display:flex; align-items:center; gap:12px; padding:8px 11px; background:rgba(20,24,25,.92); border:1px solid rgba(232,228,220,.18); color:var(--bone); font:12px var(--font-display); white-space:nowrap; }
.workspace-marker-label small { color:#a4a79c; font:9px var(--font-mono); }
.workspace-marker-label > span { color:var(--signal); }
.workspace-marker:hover .workspace-marker-label,.workspace-marker:focus-visible .workspace-marker-label,.workspace-marker.is-active .workspace-marker-label { border-color:var(--signal); }
.workspace-marker:hover .workspace-marker-dot,.workspace-marker.is-active .workspace-marker-dot { background:var(--signal); border-color:var(--signal); }
.workspace-stage[data-action-state$="-reading"]::after { content:'SCROLL TO ZOOM · MOVE TO READ · ESC TO PUT DOWN'; position:absolute; top:24px; left:50%; translate:-50% 0; padding:8px 14px; background:rgba(20,24,25,.85); color:var(--bone); font:11px var(--font-mono); letter-spacing:.14em; pointer-events:none; z-index:3; }
.workspace-stage[data-action-state="drawing"]::after { content:'DRAG ON THE PAGE TO DRAW · ESC TO PUT THE PEN DOWN'; position:absolute; top:24px; left:50%; translate:-50% 0; padding:8px 14px; background:rgba(20,24,25,.85); color:var(--bone); font:11px var(--font-mono); letter-spacing:.14em; pointer-events:none; z-index:3; }
.pen-clear { display:none; position:absolute; top:64px; left:50%; translate:-50% 0; z-index:3; padding:8px 14px; background:var(--void); color:var(--bone); border:1px solid var(--dim); font:11px var(--font-mono); letter-spacing:.14em; }
.workspace-stage[data-action-state="drawing"] .pen-clear { display:block; }
.workspace-sit .workspace-marker-label { min-height:44px; padding:12px 22px; background:var(--signal); border-color:var(--signal); color:#141819; font:13px var(--font-mono); letter-spacing:.16em; }
.workspace-sit { animation:sit-pulse .9s var(--ease) 1.2s 2; }
@keyframes sit-pulse { 50% { scale:1.06; } }
@media (prefers-reduced-motion:reduce) { .workspace-sit { animation:none; } }
@media (max-width:700px) { .workspace-marker-label { font-size:10px; padding:6px; gap:6px; } }
`;
