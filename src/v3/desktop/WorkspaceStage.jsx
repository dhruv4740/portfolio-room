import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { buildWorkspace, WORKSPACE } from './buildWorkspace.js';

export default function WorkspaceStage({
  anchors = [], activeAnchorId = null, onAnchorSelect, onEnterScreen,
  onProgress, onReady, onStats, onError, onScreenRect, onTravel, reducedMotion = false,
  paused = false, phase = 'room',
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const api = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onAnchorSelect, onEnterScreen, onProgress, onReady, onStats, onError, onScreenRect, onTravel };
  const state = useRef({ paused, phase, reducedMotion, activeAnchorId });
  state.current = { paused, phase, reducedMotion, activeAnchorId };

  useEffect(() => {
    const host = hostRef.current;
    let renderer, controls, model, resizeObserver, tween;
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
      renderer.toneMappingExposure = 1.2;
      host.appendChild(renderer.domElement);
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
          const point = WORKSPACE.anchors[id]; if (!point || !el) continue;
          projected.set(...point).project(camera);
          const visible = state.current.phase === 'room' && projected.z < 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.88;
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
      function render() { controls.update(); renderer.render(scene, camera); updateMarkers(); updateScreenAlign(); }
      function resetTiming() { last = null; cadenceSum = 0; cpuSum = 0; count = 0; }
      function tick(now) {
        raf = 0;
        if (disposed || state.current.paused || document.hidden) return;
        const start = performance.now(); render(); const cpu = performance.now() - start;
        const delta = last === null ? null : now - last;
        if (delta !== null && delta > 0 && delta < 250) { cadenceSum += delta; cpuSum += cpu; count++; }
        else { cadenceSum = 0; cpuSum = 0; count = 0; }
        last = now;
        if (now - emitted > 300) {
          callbacks.current.onStats?.({ frameMs: count ? cadenceSum / count : null, cpuMs: count ? cpuSum / count : null, gpuMs: null, cameraPos: camera.position.toArray() });
          cadenceSum = 0; cpuSum = 0; count = 0; emitted = now;
        }
        raf = requestAnimationFrame(tick);
      }
      function refresh() {
        cancelAnimationFrame(raf); raf = 0; resetTiming();
        controls.enabled = state.current.phase === 'room' && !state.current.paused;
        updateMarkers();
        if (!state.current.paused && !document.hidden) raf = requestAnimationFrame(tick);
        else callbacks.current.onStats?.({ frameMs: null, cpuMs: null, gpuMs: null, cameraPos: camera.position.toArray() });
      }
      const BASE_FOV = 40, PUNCH_FOV = 15; // widen near the screen — acceleration, not a dolly
      function fly() {
        tween?.kill();
        const { phase: currentPhase, activeAnchorId: selected, reducedMotion: reduced } = state.current;
        if (currentPhase !== 'entering' && currentPhase !== 'leaving') {
          callbacks.current.onScreenRect?.(null);
        }
        let view = home;
        controls.minDistance = 0.025;
        controls.minPolarAngle = currentPhase === 'room' ? Math.PI * 0.2 : 0.01;
        controls.maxPolarAngle = currentPhase === 'room' ? Math.PI * 0.47 : Math.PI - 0.01;
        if (currentPhase === 'entering' || currentPhase === 'inside') {
          // Move perpendicular to the screen; its known physical size defines
          // the end distance. The HTML handoff occurs only at the end of flight.
          const fitHeight = WORKSPACE.screen.height / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)));
          const fitWidth = WORKSPACE.screen.width / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * camera.aspect);
          view = { position: screenCenter.clone().add(new THREE.Vector3(0, 0, Math.min(fitHeight, fitWidth) * 0.94)), target: screenCenter.clone() };
        } else if (currentPhase !== 'leaving' && selected && WORKSPACE.anchors[selected]) {
          const target = new THREE.Vector3(...WORKSPACE.anchors[selected]);
          const offset = selected === 'monitor' ? new THREE.Vector3(0.2, 0.17, 2.1) : new THREE.Vector3(1.15, 0.95, 2.3);
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
            controls.minDistance = currentPhase === 'room' ? 1.4 : 0.025;
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
      }
      function resize() {
        const width = host.clientWidth || 1, height = host.clientHeight || 1;
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); framing();
        if (!state.current.activeAnchorId && state.current.phase === 'room') place(home);
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
      function pointerDown(event) { down = { x: event.clientX, y: event.clientY }; }
      function pointerMove(event) {
        if (state.current.phase !== 'room') return;
        renderer.domElement.style.cursor = hit(event) ? 'pointer' : 'grab';
      }
      function pointerUp(event) {
        if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6 || state.current.phase !== 'room') { down = null; return; }
        down = null; const id = hit(event); if (!id) return;
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
      api.current = { fly, refresh };
      refresh();
      return () => {
        disposed = true; cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', refresh);
        renderer.domElement.removeEventListener('pointerdown', pointerDown);
        renderer.domElement.removeEventListener('pointermove', pointerMove);
        renderer.domElement.removeEventListener('pointerup', pointerUp);
        controls.dispose(); model.dispose(); renderer.dispose(); renderer.domElement.remove(); api.current = null;
      };
    } catch (error) {
      disposed = true; cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect(); controls?.dispose(); model?.dispose(); renderer?.dispose(); renderer?.domElement?.remove();
      callbacks.current.onError?.(error);
    }
  }, []);

  // Restore marker visibility before the parent returns keyboard focus.
  useLayoutEffect(() => { api.current?.refresh(); }, [paused, phase]);
  useEffect(() => { api.current?.fly(); }, [activeAnchorId, phase, reducedMotion]);

  return (
    <div ref={hostRef} className="stage-root workspace-stage" data-scene="workspace">
      <style>{css}</style>
      {anchors.filter(anchor => WORKSPACE.anchors[anchor.id]).map((anchor, index) => (
        <button key={anchor.id} ref={el => { if (el) markerRefs.current.set(anchor.id, el); else markerRefs.current.delete(anchor.id); }}
          className={`anchor-marker workspace-marker${activeAnchorId === anchor.id ? ' is-active' : ''}`}
          data-object={anchor.id} aria-label={`${anchor.label} — ${anchor.readout}`}
          onClick={() => callbacks.current.onAnchorSelect?.(anchor.id)}>
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
