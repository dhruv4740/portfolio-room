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
import { computeSplatBounds, frameBounds, resolveAnchor } from './splatBounds.js';

// Fallback only. The real establishing shot is derived from the capture's
// bounds once it loads — see the onLoad handler. Hardcoding a camera for a
// specific capture is how you end up framing empty space.
export const FALLBACK_VIEW = {
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
  expectedBytes = 0,
  reducedMotion = false,
  paused = false,
}) {
  const hostRef = useRef(null);
  const markerRefs = useRef(new Map());
  const apiRef = useRef(null);
  // Anchors resolved from normalised coords into this capture's world space,
  // and the establishing shot derived from its bounds. Both are only known
  // after the capture loads, so they live in refs the render loop reads.
  // Starts empty: content anchors carry normalised `at`, not world positions,
  // so nothing can be projected until bounds exist.
  const resolvedRef = useRef([]);
  const homeRef = useRef(FALLBACK_VIEW);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

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

    // Keep presentation cadence separate from CPU submission work. The
    // renderer timer ends when commands have been submitted; it says nothing
    // about when the GPU finishes or when the browser presents a frame.
    const MAX_CADENCE_GAP_MS = 250;
    let cadenceAccum = 0;
    let cadenceCount = 0;
    let cpuAccum = 0;
    let cpuCount = 0;
    let lastRafAt = null;
    let lastEmitAt = null;

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
      camera.position.set(...FALLBACK_VIEW.position);

      spark = new SparkRenderer({ renderer });
      scene.add(spark);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.target.set(...FALLBACK_VIEW.target);
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
          const loaded = e?.loaded || 0;
          // Some static hosts omit Content-Length (or send it compressed), so
          // e.total is 0. Fall back to the size recorded alongside the capture
          // so the loader still tracks real bytes rather than sitting at 0%
          // and snapping to 100%. Never invent a value beyond that.
          const total = e?.total || expectedBytes || 0;
          cb.current.onProgress?.({
            progress: total ? Math.min(loaded / total, 1) : 0,
            loadedMB: loaded / 1048576,
            totalMB: total ? total / 1048576 : undefined,
          });
        },
        onLoad: () => {
          if (disposed) return;
          cb.current.onProgress?.({ progress: 1 });

          // Derive framing from the capture rather than trusting authored
          // coordinates. Percentile bounds reject the floater noise that every
          // splat reconstruction carries.
          const bounds = computeSplatBounds(splat);

          if (bounds) {
            const home = frameBounds(bounds, camera);
            homeRef.current = home;

            // Scale the orbit limits to the capture so the visitor can neither
            // clip inside the geometry nor drift off into the void.
            controls.minDistance = home.distance * 0.18;
            controls.maxDistance = home.distance * 2.6;

            resolvedRef.current = anchors.map((a) => resolveAnchor(a, bounds, camera));
            rig.flyTo(home, { reduced: true }); // snap: nothing is visible yet
          } else {
            // Bounds unavailable (older Spark shape): fall back rather than
            // leaving the camera pointed at nothing. Anchors still resolve, but
            // against a synthetic unit box, so they will be approximate.
            homeRef.current = FALLBACK_VIEW;
            const unit = {
              box: new THREE.Box3(
                new THREE.Vector3(-1, -1, -1),
                new THREE.Vector3(1, 1, 1),
              ),
              center: new THREE.Vector3(0, 0, 0),
              size: new THREE.Vector3(2, 2, 2),
              radius: 1.73,
              count: 0,
            };
            resolvedRef.current = anchors.map((a) => resolveAnchor(a, unit, camera));
            rig.flyTo(FALLBACK_VIEW, { reduced: true });
          }

          cb.current.onReady?.({
            splatCount: readSplatCount(splat) ?? bounds?.count ?? null,
            bounds: bounds
              ? {
                  center: bounds.center.toArray(),
                  size: bounds.size.toArray(),
                  radius: bounds.radius,
                }
              : null,
          });
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
      const resetTiming = () => {
        cadenceAccum = 0;
        cadenceCount = 0;
        cpuAccum = 0;
        cpuCount = 0;
        lastRafAt = null;
        lastEmitAt = null;
      };

      const emitTimingReset = () => {
        cb.current.onStats?.({
          frameMs: undefined,
          cpuMs: undefined,
          gpuMs: null,
          cameraPos: camera
            ? [camera.position.x, camera.position.y, camera.position.z]
            : undefined,
        });
      };

      // A hidden tab pauses or throttles rAF. Clear the sample window so the
      // first visible callback establishes a fresh baseline instead of
      // turning the background pause into a fake low-FPS frame.
      const onVisibilityChange = () => {
        resetTiming();
        cb.current.onStats?.({
          frameMs: undefined,
          cpuMs: undefined,
          gpuMs: null,
          cameraPos: camera
            ? [camera.position.x, camera.position.y, camera.position.z]
            : undefined,
        });
      };
      document.addEventListener('visibilitychange', onVisibilityChange);

      const tick = (rafTimestamp) => {
        if (disposed) return;
        if (pausedRef.current) {
          raf = 0;
          resetTiming();
          emitTimingReset();
          return;
        }
        raf = requestAnimationFrame(tick);

        // The rAF timestamp is the browser's presentation-clock sample. Use
        // performance.now only as a fallback for test shims that omit it.
        const now = Number.isFinite(rafTimestamp) ? rafTimestamp : performance.now();
        const hadPreviousRaf = lastRafAt !== null;
        const cadenceMs = hadPreviousRaf ? now - lastRafAt : 0;
        const cadenceValid =
          hadPreviousRaf && cadenceMs > 0 && cadenceMs <= MAX_CADENCE_GAP_MS;

        if (!hadPreviousRaf) {
          lastEmitAt = now;
        } else if (!cadenceValid) {
          // A long gap means the page was backgrounded or the main thread was
          // paused. Discard both aggregates and restart from this callback.
          resetTiming();
          lastEmitAt = now;
        }
        lastRafAt = now;

        const dt = Math.min(clock.getDelta(), 0.1);
        const cpuStart = performance.now();

        rig.update(dt);
        renderer.render(scene, camera);

        // This is CPU-side submission work only, not GPU duration.
        if (!hadPreviousRaf || cadenceValid) {
          cpuAccum += performance.now() - cpuStart;
          cpuCount++;
        }
        if (cadenceValid) {
          cadenceAccum += cadenceMs;
          cadenceCount++;
        }

        // Position anchor markers in screen space. Done imperatively rather
        // than through React state — this runs 60x/sec and re-rendering the
        // tree that often would cost more than the whole scene.
        const rect = host.getBoundingClientRect();
        for (const a of resolvedRef.current) {
          const el = markerRefs.current.get(a.id);
          if (!el || !a.position) continue;
          const p = rig.project(a.position, rect.width, rect.height);
          if (!p) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            continue;
          }
          // Depth cueing: markers deeper into the capture recede. Keeps the
          // foreground one legible when several project near each other, and
          // reads as spatial rather than as a flat HUD.
          const near = 1 - Math.min(Math.max((p.depth + 1) * 0.5, 0), 1);
          const fade = 0.42 + near * 0.58;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${0.9 + near * 0.1})`;
          el.style.opacity = fade.toFixed(3);
          el.style.zIndex = String(Math.round(near * 100));
          el.style.pointerEvents = 'auto';
        }

        // Emit telemetry ~5x/sec. Faster than that and the digits are unreadable.
        if (lastEmitAt !== null && now - lastEmitAt > 200 && cadenceCount) {
          const frameMs = cadenceAccum / cadenceCount;
          cb.current.onStats?.({
            // Average time between browser rAF callbacks. Telemetry derives
            // cadence FPS from this value, independently of CPU work.
            frameMs,
            cpuMs: cpuCount ? cpuAccum / cpuCount : undefined,
            // No timer query is active here, so GPU duration is unavailable.
            gpuMs: null,
            cameraPos: [camera.position.x, camera.position.y, camera.position.z],
          });
          cadenceAccum = 0;
          cadenceCount = 0;
          cpuAccum = 0;
          cpuCount = 0;
          lastEmitAt = now;
        }
      };

      // Pausing is used while the destination iframe prepares and while it
      // owns the viewport. Stopping scheduling releases the main thread for
      // the child document; resuming starts a fresh timing window.
      apiRef.current.pause = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        resetTiming();
        emitTimingReset();
      };
      apiRef.current.resume = () => {
        if (disposed || pausedRef.current || raf) return;
        resetTiming();
        raf = requestAnimationFrame(tick);
      };

      if (!pausedRef.current) raf = requestAnimationFrame(tick);

      // ---- teardown ------------------------------------------------------
      apiRef.current.cleanup = () => {
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        resetTiming();
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

  // Keep pause outside the expensive scene effect. If the prop changes before
  // Spark finishes importing, pausedRef is still read when the loop is built.
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    if (paused) api.pause?.();
    else api.resume?.();
  }, [paused]);

  // ---- fly to the active anchor -----------------------------------------
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const a = resolvedRef.current.find((x) => x.id === activeAnchorId);
    api.rig.flyTo(a ? a.view : homeRef.current, { reduced: reducedMotion });
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
