import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { createRig } from './cameraRig.js';
import { buildWorkspace, WORKSPACE } from './buildWorkspace.js';
import PhoneScreen, { PHONE_SCREEN } from './PhoneScreen.jsx';
import { KEY_ROWS } from './buildRoomInteractions.js';
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
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const api = useRef(null);
  const phoneScreenRef = useRef(null);
  const [phoneLive, setPhoneLive] = useState(false);
  const callbacks = useRef({});
  callbacks.current = { onAnchorSelect, onEnterScreen, onProgress, onReady, onStats, onError, onScreenRect, onTravel, onSit, onTypeKey };
  const state = useRef({ paused, phase, reducedMotion, activeAnchorId, seated, liveMonitor });
  state.current = { paused, phase, reducedMotion, activeAnchorId, seated, liveMonitor };

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
          const visible = state.current.phase === 'room' && (!['phone','notebook','award','coffee'].includes(state.current.activeAnchorId)) && (state.current.seated ? id !== 'chair' && id !== state.current.activeAnchorId : id === 'chair') && projected.z < 1 && Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.88;
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
      function followPhone() {
        const holding = model.hands.left;
        holding.hand.position.set(-0.035, -0.061, 0.025).applyEuler(model.phone.rotation).add(model.phone.position);
        holding.hand.rotation.copy(model.phone.rotation);
        holding.thumb.scale.set(0.65, 0.8, 0.8);
      }
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
        model.resetPhone(); model.hands.reset(); model.hands.grip(model.hands.left); model.hands.grip(model.hands.right, true); model.setHandsVisible(true);
        const holding = model.hands.left.hand;
        rig.flyTo({ position: WORKSPACE.seat.position, target: [0.08, 1.51, 0.58] }, {
          reduced, duration: 0.65, onUpdate() { camera.fov = 56; camera.updateProjectionMatrix(); invalidate(); },
        });
        const held = new THREE.Vector3(0.08, 1.53, 0.59);
        let gripping = false;
        const update = () => { if (gripping) followPhone(); model.hands.update(); invalidate(); };
        if (reduced) {
          model.phone.position.copy(held); model.phone.rotation.x = 1.15;
          followPhone();

          model.hands.update(); zoomPhone(true); return;
        }
        action = gsap.timeline({ onUpdate: update, onComplete() { zoomPhone(false); } });
        markPhone('reaching');
        action.to(holding.position, { x: -0.55, y: 1.44, z: 0.25, duration: 0.4, ease: 'power2.inOut' }, 0)
          .to(holding.position, { x: -0.90, y: 1.23, z: -0.005, duration: 0.4, ease: 'power2.inOut' }, 0.4)
          .call(() => { gripping = true; markPhone('lifting'); }, [], 0.8)
          .to(model.phone.position, { y:1.58,duration:0.35,ease:'power2.out' },0.8)
          .to(model.phone.position, { x: held.x, y: held.y, z: held.z, duration: 0.85, ease: 'power2.inOut' }, 1.15)
          .to(model.phone.rotation, { x: 1.15, duration: 0.85, ease: 'power2.inOut' }, 1.15)
          .call(() => markPhone('home'), [], 2.0);

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
        if (model.phone.position.distanceTo(new THREE.Vector3(...WORKSPACE.anchors.phone)) < 0.002) {
          action = gsap.to(model.hands.left.hand.position, { x: -0.27, y: 1.28, z: 0.405, duration: 0.5,
            onUpdate() { model.hands.update(); invalidate(); }, onComplete: finish });
          gsap.ticker.wake(); return;
        }
        action = gsap.timeline({onUpdate(){followPhone();model.hands.update();invalidate();},onComplete:finish});
        action.to(model.phone.position,{y:1.60,duration:0.25,ease:'power2.out'},0)
          .to(model.phone.position,{x:WORKSPACE.anchors.phone[0],z:WORKSPACE.anchors.phone[2],duration:0.60,ease:'power2.inOut'},0.25)
          .to(model.phone.rotation,{x:0,y:0,z:0,duration:0.55},0.25)
          .to(model.phone.position,{y:WORKSPACE.anchors.phone[1],duration:0.4,ease:'power2.inOut'},0.85);
        gsap.ticker.wake();
      }
      function followNotebook() {
        const h = model.hands.right;
        h.hand.position.set(0.12,-0.075,0.15).applyEuler(model.notebook.rotation).add(model.notebook.position);
        h.hand.rotation.copy(model.notebook.rotation); model.hands.update();
      }
      function animateNotebook(reduced) {
        action?.kill(); notebookInHand = true; model.resetNotebook(); model.hands.reset();
        model.hands.grip(model.hands.right); model.setHandsVisible(true);

        const held = { x:0.05,y:1.60,z:0.61 };
        rig.flyTo({position:WORKSPACE.seat.position,target:[0.05,1.60,0.61]}, {
          reduced,duration:0.8,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}
        });
        const finish=()=>{host.dataset.notebookState='reading';followNotebook();invalidate();};
        if(reduced){ model.notebook.position.set(held.x,held.y,held.z);model.notebook.rotation.x=1.39;finish();return; }
        host.dataset.notebookState='lifting';
        action=gsap.timeline({onUpdate(){followNotebook();invalidate();},onComplete:finish});
        action.to(model.notebook.position,{y:1.72,duration:0.40,ease:'power2.out'},0)
          .to(model.notebook.position,{...held,duration:0.85,ease:'power2.inOut'},0.40)
          .to(model.notebook.rotation,{x:1.39,duration:0.85,ease:'power2.inOut'},0.40);
        gsap.ticker.wake();
      }
      function returnNotebook(reduced) {
        action?.kill();rig.dispose();returningNotebook=true;host.dataset.notebookState='returning';
        const finish=()=>{notebookInHand=false;returningNotebook=false;model.resetNotebook();model.hands.reset();host.dataset.notebookState='desk';fly();invalidate();};
        if(reduced){finish();return;}
        const [x,y,z]=WORKSPACE.anchors.notebook;
        action=gsap.timeline({onUpdate(){followNotebook();invalidate();},onComplete:finish});
        action.to(model.notebook.position,{y:1.75,duration:0.25},0)
          .to(model.notebook.position,{x,z,duration:0.6,ease:'power2.inOut'},0.25)
          .to(model.notebook.rotation,{x:0,y:0,z:0,duration:0.55},0.25)
          .to(model.notebook.position,{y,duration:0.4,ease:'power2.inOut'},0.85);
        gsap.ticker.wake();
      }
      function pressKey(key,index) {
        if(!state.current.seated || state.current.phase !== 'room' || state.current.activeAnchorId) return;
        callbacks.current.onTypeKey?.(key);
        const depression={y:0};gsap.to(depression,{y:0.009,duration:0.07,repeat:1,yoyo:true,
          onUpdate(){model.roomActions.setKey(index,depression.y);invalidate();},onComplete(){model.roomActions.setKey(index,0);invalidate();}});
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
        action?.kill();model.hands.reset();model.setHandsVisible(true);model.hands.grip(h,id==='lamp');extraHeld=id;host.dataset.actionState=id;
        controls.enabled=false;
        const update=()=>{r.apply();host.dataset.lampOn=String(r.state.lamp);host.dataset.blindsOpen=String(r.state.blinds);host.dataset.drawerOpen=String(r.state.drawer);host.dataset.windowOpen=String(r.state.windowOpen);model.hands.update();invalidate();};
        const follow=()=>{h.hand.position.copy(o.position).add(new THREE.Vector3(id==='coffee'?-0.085:0.12,-0.075,id==='award'?-0.075:id==='coffee'?-0.09:0.055));h.hand.rotation.copy(o.rotation);if(id==='coffee')h.hand.rotation.x+=1.15;update();};
        const end=()=>{if(id==='drawer'&&r.state.drawer>0.5){extraHeld=null;model.hands.reset();host.dataset.actionState='drawer-open';invalidate();}else finishExtra(id);};
        if(id==='windowOpen') {
          rig.flyTo({position:WORKSPACE.seat.position,target:o.position.toArray()},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          const target=1-r.state.windowOpen;
          if(reduced){r.state.windowOpen=target;update();end();return;}
          action=gsap.timeline({onUpdate:update,onComplete:end});
          action.to(r.state,{windowOpen:target,duration:0.65,ease:'power2.inOut'});
          gsap.ticker.wake();return;
        }
        if(['lamp','drawer','blinds'].includes(id)) {
          rig.flyTo({position:WORKSPACE.seat.position,target:o.position.toArray()},{reduced,duration:0.45,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          const target=1-r.state[id];
          if(reduced){r.state[id]=target;update();end();return;}
          action=gsap.timeline({onUpdate:update,onComplete:end});
          action.to(h.hand.position,{x:o.position.x,y:o.position.y+0.08,z:o.position.z+0.08,duration:0.5,ease:'power2.inOut'})
            .to(r.state,{[id]:target,duration:id==='lamp'?0.12:0.65,ease:'power2.inOut'})
            .to(h.hand.position,{x:h===model.hands.left?-0.27:0.27,y:1.28,z:0.405,duration:0.5});
          gsap.ticker.wake();return;
        }
        if(id==='award') {
          rig.flyTo({position:WORKSPACE.seat.position,target:[0.05,1.60,0.59]},{reduced,duration:0.7,onUpdate(){camera.fov=56;camera.updateProjectionMatrix();invalidate();}});
          if(reduced){o.position.set(0.05,1.60,0.59);follow();host.dataset.actionState='award-reading';return;}
          action=gsap.timeline({onUpdate:follow,onComplete(){host.dataset.actionState='award-reading';invalidate();}});
          action.to(o.position,{y:2.20,z:-1.0,duration:0.35}).to(o.position,{x:0.05,y:1.60,z:0.59,duration:0.9,ease:'power2.inOut'});gsap.ticker.wake();return;
        }
        if(id==='headphones') {
          const wear=!r.state.headphones; r.state.headphones=Number(wear);host.dataset.headphonesOn=String(wear);
          window.dispatchEvent(new CustomEvent('workspace:headphones',{detail:{on:wear}}));o.visible=true;o.rotation.x=wear?Math.PI/2:0;
          const target=wear?new THREE.Vector3(0.05,1.76,1.16):r.homes.headphones;
          if(reduced){o.position.copy(target);o.visible=!wear;end();return;}
          action=gsap.timeline({onUpdate:follow,onComplete(){o.visible=!wear;end();}});
          action.to(o.position,{y:1.6,duration:0.4}).to(o.position,{x:target.x,y:target.y,z:target.z,duration:0.65,ease:'power2.inOut'});gsap.ticker.wake();return;
        }
        if(id==='coffee') {
          const level=Math.max(0,r.state.coffeeLevel-0.25),clock={t:0,energy:1};
          const finish=()=>{r.state.coffeeLevel=level;o.position.copy(r.homes.coffee);o.rotation.set(0,0,0);r.updateLiquid(0,0);host.dataset.coffeeLevel=String(level);end();};
          if(reduced){finish();return;}
          action=gsap.timeline({onUpdate(){r.updateLiquid(clock.t,clock.energy);follow();},onComplete:finish});
          action.to(o.position,{y:1.55,duration:0.45,ease:'power2.out'},0)
            .to(o.position,{x:-0.10,y:1.52,z:0.78,duration:0.65,ease:'power2.inOut'},0.45)
            .to(o.rotation,{x:0.35,duration:0.55},1.1).to(r.state,{coffeeLevel:level,duration:0.5},1.2)
            .to(o.rotation,{x:0,duration:0.4},1.8)
            .to(o.position,{x:r.homes.coffee.x,y:1.55,z:r.homes.coffee.z,duration:0.6},2.2)
            .to(o.position,{y:r.homes.coffee.y,duration:0.45},2.8)
            .to(clock,{t:3.25,duration:3.25,ease:'none'},0).to(clock,{energy:0,duration:0.75},2.5);
          gsap.ticker.wake();return;
        }
      }
      function returnExtra(reduced) {
        const id=extraHeld,r=model.roomActions,o=r.objects[id];action?.kill();rig.dispose();
        if(id==='windowOpen'){finishExtra(id);return;}
        if(id!=='award'){o.position.copy(r.homes[id]);o.rotation.set(0,0,0);r.updateLiquid(0,0);finishExtra(id);return;}
        const finish=()=>{o.position.copy(r.homes[id]);finishExtra(id);};
        if(reduced){finish();return;}
        action=gsap.timeline({onUpdate(){model.hands.right.hand.position.copy(o.position).add(new THREE.Vector3(0.12,-0.075,0.055));model.hands.update();invalidate();},onComplete:finish});
        action.to(o.position,{y:2.20,z:-1.0,duration:0.65}).to(o.position,{x:r.homes[id].x,y:r.homes[id].y,z:r.homes[id].z,duration:0.45});gsap.ticker.wake();
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
        const result = raycaster.intersectObject(model.root, true)[0];
        host.dataset.hitKey = result?.object === model.keys ? String(result.instanceId) : '';
        return result?.object.userData.anchorId || null;
      }
      function pointerDown(event) { down = { x: event.clientX, y: event.clientY, lx: event.clientX, ly: event.clientY, moved: false }; if (state.current.seated) renderer.domElement.setPointerCapture(event.pointerId); }
      function pointerMove(event) {
        if (state.current.phase !== 'room') return;
        if (phoneInHand) { renderer.domElement.style.cursor = 'default'; return; }
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
        if (!down || down.moved || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6 || state.current.phase !== 'room') { down = null; return; }
        down = null;
        if (phoneInHand) return;
        const id = hit(event); if (!id) return;
        if (!state.current.seated && id !== 'chair') return;
        if (id === 'keyboard') { const index=Number(host.dataset.hitKey); pressKey(KEY_ROWS[Math.floor(index/12)]?.[index%12] || ' ',index);renderer.domElement.focus();return; }
        if (id === 'chair') { callbacks.current.onSit?.(); return; }
        const marker = markerRefs.current.get(id); marker?.focus();
        if (id === 'monitor' && callbacks.current.onEnterScreen) callbacks.current.onEnterScreen();
        else callbacks.current.onAnchorSelect?.(id);
      }
      renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Room keyboard — type while focused');
      renderer.domElement.addEventListener('keydown', physicalKey);
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
      api.current = { fly, refresh, startEntryPower, showFocusLock, phoneHome, setSky: (s) => model.setSky(s) };
      refresh();
      return () => {
        disposed = true; entryTimers.forEach(clearTimeout); rig?.dispose(); action?.kill(); cancelAnimationFrame(raf); tween?.kill(); resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', refresh);
        renderer.domElement.removeEventListener('keydown', physicalKey);
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
  useLayoutEffect(() => { api.current?.refresh(); }, [paused, phase, seated, liveMonitor]);
  useEffect(() => { api.current?.fly(); }, [activeAnchorId, phase, reducedMotion, seated]);

  return (
    <div ref={hostRef} className="stage-root workspace-stage" data-scene="workspace">
      <style>{css}</style>
      <PhoneScreen ref={phoneScreenRef} interactive={phoneLive}
        onOpenApp={() => api.current?.showFocusLock()} onHome={() => api.current?.phoneHome()} />
      <button ref={el => { if (el) markerRefs.current.set('chair', el); else markerRefs.current.delete('chair'); }}
        className="anchor-marker workspace-marker" data-object="chair" aria-label="Sit in the chair"
        onClick={() => callbacks.current.onSit?.()}><span className="workspace-marker-label">SIT</span></button>
      {[...anchors, ...[{id:'phone',label:'Phone'},{id:'lamp',label:'Lamp switch'},{id:'coffee',label:'Coffee'},{id:'award',label:'Awards'},{id:'drawer',label:'Drawer'},{id:'blinds',label:'Blind cord'},{id:'headphones',label:'Headphones'},{id:'keyboard',label:'Keyboard'}].map(a=>({...a,readout:'Interact'}))].filter(anchor => WORKSPACE.anchors[anchor.id]).map((anchor, index) => (
        <button key={anchor.id} ref={el => { if (el) markerRefs.current.set(anchor.id, el); else markerRefs.current.delete(anchor.id); }}
          className={`anchor-marker workspace-marker${activeAnchorId === anchor.id ? ' is-active' : ''}`}
          data-object={anchor.id} aria-label={`${anchor.label} — ${anchor.readout}`}
          onClick={() => seated && callbacks.current.onAnchorSelect?.(anchor.id)}>
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
