// ============================================================================
// SplatStage — renders the Gaussian-splat capture and the anchor markers.
//
// Vanilla three.js rather than R3F on purpose: Spark needs to hook the render
// loop itself and requires `antialias: false` (WebGL MSAA does nothing for
// splats and costs a lot of fill rate). Owning the loop directly is simpler
// than fighting R3F's for it, and keeps drei out of this route's bundle.
//
// Spark is dynamically imported so its ~5MB module never loads on /work.
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createRig } from './cameraRig.js';

// Wide establishing shot the scene opens on and returns to.
export const HOME_VIEW = {
  position: [1.6, 0.75, 2.1],
  target: [0, 0.15, -0.3],
};

export default function SplatStage({
  src,
  anchors = [],
  activeAnchorId = null,
  onAnchorSelect,
  onProgress,
  onReady,
  onStats,
  onError,
  reducedMotion = false,
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const apiRef = useRef(null);

  // Keep the latest callbacks without retriggering the (expensive) scene effect.
  const cb = useRef({});
  cb.current = { onProgress, onReady, onStats, onAnchorSelect, onError };

  const setMarkerRef = useCallback((id, el) => {
    if (el) markerRefs.current.set(id, el);
    else markerRefs.current.delete(id);
  }, []);

  // ---- scene lifecycle ---------------------------------------------------
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let renderer, scene, camera, controls, rig, spark, splat;
    const clock = new THREE.Clock();

    // Rolling frame-time average — a single frame's dt is far too noisy to show.
    let frameAccum = 0;
    let frameCount = 0;
    let lastEmit = 0;

    (async () => {
      let Spark;
      try {
        Spark = await import('@sparkjsdev/spark');
      } catch (err) {
        cb.current.onError?.(new Error(`Spark failed to load: ${err.message}`));
        return;
      }
      if (disposed) return;

      const { SparkRenderer, SplatMesh } = Spark;

      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;

      renderer = new THREE.WebGLRenderer({
        antialias: false, // required by Spark: MSAA does nothing for splats
        alpha: false,
        powerPreference: 'high-performance',
      });
      // Cap DPR. Splats are fill-rate bound; a 3x retina buffer will halve FPS
      // for a difference nobody can see through the Gaussian falloff.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h);
      renderer.setClearColor(0x0a0a0b, 1);
      host.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(52, w / h, 0.05, 200);
      camera.position.set(...HOME_VIEW.position);

      spark = new SparkRenderer({ renderer });
      scene.add(spark);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.target.set(...HOME_VIEW.target);
      controls.minDistance = 0.4;
      controls.maxDistance = 6;
      // Stop the visitor orbiting under the floor into the capture's null space,
      // which is where a splat looks most obviously broken.
      controls.maxPolarAngle = Math.PI * 0.52;
      controls.enablePan = false;
      controls.update();

      rig = createRig(camera, controls);

      splat = new SplatMesh({
        url: src,
        onProgress: (e) => {
          if (disposed) return;
          const total = e?.total || 0;
          const loaded = e?.loaded || 0;
          cb.current.onProgress?.({
            progress: total ? Math.min(loaded / total, 1) : 0,
            loadedMB: loaded / 1048576,
            totalMB: total / 1048576,
          });
        },
        onLoad: () => {
          if (disposed) return;
          cb.current.onProgress?.({ progress: 1 });
          cb.current.onReady?.({ splatCount: readSplatCount(splat) });
        },
      });

      // Most .splat/.ply captures are stored Y-down relative to three's frame;
      // this quaternion is a 180° rotation about X that puts the room upright.
      // If a future capture loads upside down, this is the line to flip.
      splat.quaternion.set(1, 0, 0, 0);
      scene.add(splat);

      apiRef.current = { rig, camera, controls, splat, renderer };

      // ---- resize --------------------------------------------------------
      const ro = new ResizeObserver(() => {
        if (disposed || !renderer) return;
        const nw = host.clientWidth || 1;
        const nh = host.clientHeight || 1;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      });
      ro.observe(host);

      // ---- loop ----------------------------------------------------------
      const tick = () => {
        if (disposed) return;
        raf = requestAnimationFrame(tick);

        const dt = Math.min(clock.getDelta(), 0.1);
        const t0 = performance.now();

        rig.update(dt);
        renderer.render(scene, camera);

        frameAccum += performance.now() - t0;
        frameCount++;

        // Position anchor markers in screen space. Done imperatively rather
        // than through React state — this runs 60x/sec and re-rendering the
        // tree that often would cost more than the whole scene.
        const rect = host.getBoundingClientRect();
        for (const a of anchors) {
          const el = markerRefs.current.get(a.id);
          if (!el) continue;
          const p = rig.project(a.position, rect.width, rect.height);
          if (!p) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            continue;
          }
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
        }

        // Emit telemetry ~5x/sec. Faster than that and the digits are unreadable.
        const now = performance.now();
        if (now - lastEmit > 200 && frameCount) {
          cb.current.onStats?.({
            frameMs: frameAccum / frameCount,
            cameraPos: [camera.position.x, camera.position.y, camera.position.z],
          });
          frameAccum = 0;
          frameCount = 0;
          lastEmit = now;
        }
      };
      raf = requestAnimationFrame(tick);

      // ---- teardown ------------------------------------------------------
      apiRef.current.cleanup = () => {
        ro.disconnect();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      apiRef.current?.cleanup?.();
      rig?.dispose();
      controls?.dispose();
      splat?.dispose?.();
      spark?.dispose?.();
      renderer?.dispose();
      if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      apiRef.current = null;
    };
    // `anchors` is read inside the loop via closure; it is static content data.
  }, [src, anchors]);

  // ---- fly to the active anchor -----------------------------------------
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const a = anchors.find((x) => x.id === activeAnchorId);
    api.rig.flyTo(a ? a.view : HOME_VIEW, { reduced: reducedMotion });
  }, [activeAnchorId, anchors, reducedMotion]);

  return (
    <div className="stage-root" ref={hostRef}>
      <style>{css}</style>
      {anchors.map((a) => (
        <button
          key={a.id}
          ref={(el) => setMarkerRef(a.id, el)}
          className={`anchor-marker${activeAnchorId === a.id ? ' is-active' : ''}`}
          onClick={() => cb.current.onAnchorSelect?.(a.id)}
          aria-label={`${a.label} — ${a.readout}`}
          style={{ opacity: 0 }}
        >
          <span className="anchor-tick" aria-hidden="true" />
          <span className="anchor-text">
            <span className="anchor-label">{a.label}</span>
            <span className="anchor-readout">{a.readout}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Spark exposes the count in a few shapes across versions; probe defensively. */
function readSplatCount(mesh) {
  return (
    mesh?.numSplats ??
    mesh?.packedSplats?.numSplats ??
    mesh?.splats?.getNumSplats?.() ??
    null
  );
}

const css = `
.stage-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--void);
  z-index: var(--z-scene);
}
.stage-root canvas { display: block; width: 100%; height: 100%; }

/* Anchor markers: a crosshair tick with a leader line to a mono label.
   Instrument annotation, not a map pin. */
.anchor-marker {
  position: absolute;
  top: 0; left: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  transition: opacity var(--d-transition) var(--ease);
  transform-origin: left center;
  will-change: transform, opacity;
}
.anchor-tick {
  position: relative;
  width: 11px; height: 11px;
  flex: none;
  border: var(--hair) solid var(--bone);
  transform: rotate(45deg);
  transition: border-color var(--d-feedback) var(--ease),
              background-color var(--d-feedback) var(--ease);
}
.anchor-marker:hover .anchor-tick,
.anchor-marker.is-active .anchor-tick {
  border-color: var(--signal);
  background: var(--signal);
}
.anchor-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  text-align: left;
  /* Leader line from tick to label. */
  padding-left: 0.55rem;
  border-left: var(--hair) solid var(--faint);
}
.anchor-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--bone);
}
.anchor-readout {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  white-space: nowrap;
}
.anchor-marker:hover .anchor-readout,
.anchor-marker.is-active .anchor-readout { color: var(--signal); }
`;
