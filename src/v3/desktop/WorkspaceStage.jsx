import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { createRig } from './cameraRig.js';
import { buildWorkspace, WORKSPACE } from './buildWorkspace.js';
import { createPerfGovernor } from './perfGovernor.js';

export default function WorkspaceStage({
  anchors = [], activeAnchorId = null, onAnchorSelect, onEnterScreen,
  onProgress, onReady, onStats, onError, onScreenRect, onTravel, reducedMotion = false,
  paused = false, phase = 'room', seated = false, onSit, entryVisible = true,
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const api = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onAnchorSelect, onEnterScreen, onProgress, onReady, onStats, onError, onScreenRect, onTravel, onSit };
  const state = useRef({ paused, phase, reducedMotion, activeAnchorId, seated });
  state.current = { paused, phase, reducedMotion, activeAnchorId, seated };

  useEffect(() => {
    const host = hostRef.current;
    let renderer, controls, model, resizeObserver, tween, rig, action;
    let phoneInHand = false, returningPhone = false;
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
      model = buildWorkspace(scene);
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
          const visible = state.current.phase === 'room' && (id !== 'phone' || (state.current.seated && state.current.activeAnchorId !== 'phone')) && (!state.current.seated || id === 'notebook' || id === 'monitor' || id === 'phone') && projected.z < 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.88;
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
      ];
      function updateScreenAlign() {
        const p = state.current.phase;
        if (p !== 'entering' && p !== 'leaving') return;
        if (state.current.reducedMotion) return;
        const rect = host.getBoundingClientRect();
        const W = rect.width || 1, H = rect.height || 1;
        const pts = corners.map((pt) => {
          projected.set(...pt).project(camera);
          return { x: (projected.x * 0.5 + 0.5) * W, y: (-projected.y * 0.5 + 0.5) * H, z: projected.z };
        });
        if (pts.some((pt) => pt.z > 1)) { callbacks.current.onScreenRect?.(null); return; }
        const [tl, tr, bl] = pts;
        const a = (tr.x - tl.x) / W, b = (tr.y - tl.y) / W;
        const c = (bl.x - tl.x) / H, d = (bl.y - tl.y) / H;
        callbacks.current.onScreenRect?.({ matrix: [a, b, c, d, tl.x, tl.y], width: W, height: H });
      }
      function render() { if (!state.current.seated || state.current.phase !== 'room') controls.update(); renderer.render(scene, camera); updateMarkers(); updateScreenAlign(); }
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
        controls.enabled = state.current.phase === 'room' && !state.current.paused && !state.current.seated && !rig.flying;
        updateMarkers();
        gov.markDirty();
        if (!state.current.paused && !document.hidden) raf = requestAnimationFrame(tick);
        else callbacks.current.onStats?.({ frameMs: null, cpuMs: null, gpuMs: null, cameraPos: camera.position.toArray() });
      }
      function markPhone(beat) { host.dataset.phoneState = beat; }
      function followPhone() {
        const right = model.hands.right;
        right.hand.position.set(0.10, -0.025, 0.025).applyEuler(model.phone.rotation).add(model.phone.position);
        right.hand.rotation.copy(model.phone.rotation);
        right.thumb.position.y = 0.045; right.thumb.scale.x = 0.6;
        right.fingers.forEach(f => { f.rotation.x = -1.15; });
      }
      function animatePhone(reduced) {
        action?.kill(); phoneInHand = true;
        model.resetPhone(); model.hands.reset(); model.setHandsVisible(true);
        const right = model.hands.right.hand, left = model.hands.left.hand;
        // Keep the eye at the seat. Only its gaze changes to the held device.
        rig.flyTo({ position: WORKSPACE.seat.position, target: [0.08, 1.51, 0.58] }, {
          reduced, duration: 0.65, onUpdate() { camera.fov = 56; camera.updateProjectionMatrix(); invalidate(); },
        });
        const held = { x: 0.08, y: 1.53, z: 0.59 };
        const leftRotation = new THREE.Euler(1.15, 0, -0.65);
        const tip = new THREE.Vector3(-0.016, -0.028, -0.129).applyEuler(leftRotation);
        const tapPosition = new THREE.Vector3(0.08, 1.543, 0.616).sub(tip);
        let gripping = false;
        const update = () => { if (gripping) followPhone(); model.hands.update(); invalidate(); };
        if (reduced) {
          model.phone.position.set(held.x, held.y, held.z); model.phone.rotation.x = 1.15;
          followPhone(); left.position.copy(tapPosition).add(new THREE.Vector3(-0.13, -0.12, 0.04)); left.rotation.copy(leftRotation);
          [0,2,3].forEach(i => { model.hands.left.fingers[i].rotation.x = -1.1; });
          model.setPhoneScreen('focuslock'); model.phoneGlow.color.set('#b6d8ff'); model.phoneGlow.intensity = 0.14;
          model.hands.update(); markPhone('focuslock'); invalidate(); return;
        }
        action = gsap.timeline({ onUpdate: update, onComplete() { markPhone('focuslock'); invalidate(); } });
        markPhone('reaching');
        action.to(right.position, { x: -0.15, y: 1.46, z: 0.32, duration: 0.4, ease: 'power2.inOut' }, 0)
          .to(right.position, { x: -0.70, y: 1.23, z: -0.005, duration: 0.4, ease: 'power2.inOut' }, 0.4)
          .call(() => { gripping = true; markPhone('lifting'); }, [], 0.8)
          .to(model.phone.position, { ...held, duration: 0.85, ease: 'power2.inOut' }, 0.8)
          .to(model.phone.rotation, { x: 1.15, duration: 0.85, ease: 'power2.inOut' }, 0.8)
          .call(() => markPhone('home'), [], 1.65)
          .to(left.position, { x: tapPosition.x, y: tapPosition.y, z: tapPosition.z, duration: 0.55, ease: 'power2.inOut' }, 1.65)
          .to(left.rotation, { x: leftRotation.x, z: leftRotation.z, duration: 0.55 }, 1.65)
          .to(model.hands.left.fingers[0].rotation, { x: -1.1, duration: 0.3 }, 1.8)
          .to(model.hands.left.fingers[2].rotation, { x: -1.1, duration: 0.3 }, 1.8)
          .to(model.hands.left.fingers[3].rotation, { x: -1.1, duration: 0.3 }, 1.8)
          .call(() => markPhone('tap'), [], 2.2)
          .to(left.position, { y: tapPosition.y - 0.009, z: tapPosition.z - 0.020, duration: 0.12, ease: 'power2.in' }, 2.2)
          .to(left.position, { y: tapPosition.y, z: tapPosition.z, duration: 0.12, ease: 'power2.out' }, 2.32)
          .call(() => markPhone('hesitation'), [], 2.44)
          .to(left.position, { x: tapPosition.x - 0.13, y: tapPosition.y - 0.12, z: tapPosition.z + 0.04, duration: 0.3, ease: 'power2.out' }, 2.44)
          .call(() => { model.setPhoneScreen('focuslock'); markPhone('takeover'); }, [], 2.9)
          .to(model.phoneGlow.color, { r: new THREE.Color('#b6d8ff').r, g: new THREE.Color('#b6d8ff').g, b: new THREE.Color('#b6d8ff').b, duration: 0.3 }, 2.9)
          .to(model.phoneGlow, { intensity: 0.14, duration: 0.3 }, 2.9);
        gsap.ticker.wake();
      }
      function returnPhone(reduced) {
        action?.kill(); rig.dispose(); returningPhone = true; markPhone('returning');
        const finish = () => {
          phoneInHand = false; returningPhone = false; model.resetPhone(); model.hands.reset();
          markPhone('desk'); fly(); invalidate();
        };
        if (reduced) { finish(); return; }
        if (model.phone.position.distanceTo(new THREE.Vector3(...WORKSPACE.anchors.phone)) < 0.002) {
          action = gsap.to(model.hands.right.hand.position, { x: 0.27, y: 1.301, z: 0.405, duration: 0.5,
            onUpdate() { model.hands.update(); invalidate(); }, onComplete: finish });
          gsap.ticker.wake(); return;
        }
        let attached = true;
        action = gsap.timeline({ onUpdate() { if (attached) followPhone(); model.hands.update(); invalidate(); }, onComplete: finish });
        action.to(model.phone.position, { x: -0.45, y: 1.43, z: 0.10, duration: 0.55, ease: 'power2.inOut' }, 0)
          .to(model.phone.rotation, { x: 0, y: 0, z: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
          .to(model.phone.position, { x: WORKSPACE.anchors.phone[0], y: WORKSPACE.anchors.phone[1], z: WORKSPACE.anchors.phone[2], duration: 0.4, ease: 'power2.out' }, 0.55)
          .to(model.hands.left.hand.position, { x: -0.27, y: 1.301, z: 0.405, duration: 0.65 }, 0)
          .to(model.hands.left.hand.rotation, { x: 0, y: 0, z: 0, duration: 0.65 }, 0)
          .call(() => { attached = false; }, [], 0.95)
          .to(model.hands.right.hand.position, { x: 0.27, y: 1.301, z: 0.405, duration: 0.4, ease: 'power2.inOut' }, 0.95)
          .to(model.hands.right.hand.rotation, { x: 0, y: 0, z: 0, duration: 0.4 }, 0.95);
        for (const finger of model.hands.left.fingers) action.to(finger.rotation, { x: 0, duration: 0.65 }, 0);
        gsap.ticker.wake();
      }
      const BASE_FOV = 40, PUNCH_FOV = 15; // widen near the screen — acceleration, not a dolly
      function fly() {
        tween?.kill(); rig.dispose();
        if (returningPhone) return;
        if (phoneInHand) { returnPhone(state.current.reducedMotion); return; }
        action?.kill();
        model.setHandsVisible(model.hands.root.visible && state.current.seated && state.current.phase === 'room' && !state.current.activeAnchorId);
        const { phase: currentPhase, activeAnchorId: selected, reducedMotion: reduced } = state.current;
        if (currentPhase !== 'entering' && currentPhase !== 'leaving') {
          callbacks.current.onScreenRect?.(null);
        }
        // Seated travel shares the existing rig. No idle update() is called.
        if (currentPhase === 'room' && state.current.seated) {
          controls.enabled = false; controls.enableDamping = false;
          controls.minDistance = 0.025; controls.maxDistance = 20;
          controls.minPolarAngle = 0.001; controls.maxPolarAngle = Math.PI - 0.001;
          controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
          if (selected === 'phone') { animatePhone(reduced); return; }
          const view = selected === 'phone'
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
            model.hands.reset(); model.setHandsVisible(!selected);
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
            controls.enabled = state.current.phase === 'room' && !state.current.seated;
            const CLOSE_READ = selected === 'phone' || selected === 'notebook';
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
        const result = raycaster.intersectObject(model.root, true)[0];
        return result?.object.userData.anchorId || null;
      }
      function pointerDown(event) { down = { x: event.clientX, y: event.clientY, lx: event.clientX, ly: event.clientY, moved: false }; if (state.current.seated) renderer.domElement.setPointerCapture(event.pointerId); }
      function pointerMove(event) {
        if (state.current.phase !== 'room') return;
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
        if (!down || down.moved || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6 || state.current.phase !== 'room') { down = null; return; }
        down = null; const id = hit(event); if (!id) return;
        if (state.current.seated && !['monitor', 'notebook', 'phone'].includes(id)) return;
        if (id === 'chair') { callbacks.current.onSit?.(); return; }
        const marker = markerRefs.current.get(id); marker?.focus();
        if (id === 'monitor' && callbacks.current.onEnterScreen) callbacks.current.onEnterScreen();
        else callbacks.current.onAnchorSelect?.(id);
      }
      renderer.domElement.addEventListener('pointerdown', pointerDown);
      renderer.domElement.addEventListener('pointermove', pointerMove);
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
      api.current = { fly, refresh, startEntryPower };
      refresh();
      return () => {
        disposed = true; entryTimers.forEach(clearTimeout); rig?.dispose(); action?.kill(); cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', refresh);
        renderer.domElement.removeEventListener('pointerdown', pointerDown);
        renderer.domElement.removeEventListener('pointermove', pointerMove);
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
  useLayoutEffect(() => { api.current?.refresh(); }, [paused, phase, seated]);
  useEffect(() => { api.current?.fly(); }, [activeAnchorId, phase, reducedMotion, seated]);

  return (
    <div ref={hostRef} className="stage-root workspace-stage" data-scene="workspace">
      <style>{css}</style>
      <button ref={el => { if (el) markerRefs.current.set('chair', el); else markerRefs.current.delete('chair'); }}
        className="anchor-marker workspace-marker" data-object="chair" aria-label="Sit in the chair"
        onClick={() => callbacks.current.onSit?.()}><span className="workspace-marker-label">SIT</span></button>
      {[...anchors, { id: 'phone', label: 'Phone', readout: 'FocusLock / screen placeholder' }].filter(anchor => WORKSPACE.anchors[anchor.id]).map((anchor, index) => (
        <button key={anchor.id} ref={el => { if (el) markerRefs.current.set(anchor.id, el); else markerRefs.current.delete(anchor.id); }}
          className={`anchor-marker workspace-marker${activeAnchorId === anchor.id ? ' is-active' : ''}`}
          data-object={anchor.id} aria-label={`${anchor.label} — ${anchor.readout}`}
          onClick={() => seated && anchor.id === 'monitor' ? callbacks.current.onEnterScreen?.() : callbacks.current.onAnchorSelect?.(anchor.id)}>
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
@media (max-width:700px) { .workspace-marker-label { font-size:10px; padding:6px; gap:6px; } }
`;
