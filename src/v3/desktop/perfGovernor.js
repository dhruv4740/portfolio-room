// ============================================================================
// perfGovernor.js — adaptive performance governor for the desktop workspace
// scene. Integrated-GPU laptops are the primary target, not an edge case.
//
// Owns three things:
//   1. Render-on-demand scheduling (a dirty flag + a 30Hz frame-budget floor).
//   2. An adaptive pixel-ratio ladder driven by a rolling MEDIAN of measured
//      per-frame render cost, with hysteresis + a cooldown so it cannot
//      oscillate, and re-evaluated continuously for the life of the session
//      (a machine that starts fine and thermal-throttles a minute in must
//      still be caught — the tier is not a one-shot startup latch).
//   3. A startup quality tier derived from cheap, static signals (renderer
//      string, core count, device memory, save-data, coarse pointer), used
//      only to pick a conservative starting pixel ratio and whether shadows
//      exist at all on the lowest tier.
//
// Explicitly OUT of scope here, per the concurrent lighting pass owning
// WorkspaceStage.jsx's renderer-config block: toneMapping, exposure, scene
// background/fog, lights, materials, and shadow *quality*. The only runtime
// levers this module pulls on the renderer are `setPixelRatio` and, on the
// lowest tier only, `shadowMap.enabled` (a wholesale on/off, not a retune).
//
// Debug / forcing hook — pin a tier for testing on a real machine:
//   localStorage['v3:perf-tier'] = 'high' | 'mid' | 'low'
//   or  ?perfTier=high|mid|low   in the URL
// ============================================================================

const OVERRIDE_KEY = 'v3:perf-tier';

// Frame pacing counts display vsyncs instead of comparing timestamps. A time floor ("at least
// 15.7 ms since the last render") alternates between 1 and 2 vsyncs whenever the callback
// timestamps jitter, or on any display that is not 60/120 Hz (144 Hz renders every 3rd vsync =
// 48 fps). While anything moves we render every vsync up to ~58 Hz worth, i.e. every
// floor(refresh/58) vsyncs: 60 Hz -> 1, 90 Hz -> 1, 120/144/165 Hz -> 2 (60/72/82 fps).
// After IDLE_MS with no input and no motion the interval doubles (30 Hz on a 60 Hz display);
// any input restores it on the next tick.
const IDLE_MS = 500;
const TARGET_HZ = 58;
const PR_FLOOR = 0.8;
const PR_CEIL_DEFAULT = 1.25;

// Cost thresholds leave headroom under the 33.3ms/frame budget
// before acting, so a downshift happens ahead of visible frame drops rather
// than after.
const DOWNSHIFT_MS = 27;
const UPSHIFT_MS = 14;

const WINDOW = 40;        // rolling sample window, in *rendered* frames (idle frames are never counted)
const PERSIST = 24;       // consecutive samples on the wrong side of a threshold before acting
const COOLDOWN_MS = 2000; // minimum time between pixel-ratio steps
const STEP = 0.15;

function readTierOverride() {
  try {
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('perfTier') : null;
    if (q === 'high' || q === 'mid' || q === 'low') return q;
  } catch { /* ignore */ }
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(OVERRIDE_KEY) : null;
    if (v === 'high' || v === 'mid' || v === 'low') return v;
  } catch { /* private mode etc. */ }
  return null;
}

function median(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Cheap startup signals -> a conservative starting tier. Renderer string is
 * weighted far above core count: a 12-thread mobile CPU paired with a modest
 * integrated GPU (e.g. an AMD Ryzen 5625U / Radeon Vega iGPU) is exactly the
 * case core-count-only heuristics get wrong. Integrated GPUs land 'mid', not
 * 'low' and not 'high' — they still get the full room, never /work.
 */
function detectTier(renderer) {
  const override = readTierOverride();
  if (override) return override;

  let rendererString = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    rendererString = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl.getParameter(gl.RENDERER) || '');
  } catch { /* ignore */ }
  const r = String(rendererString).toLowerCase();

  // Software rasterizers shouldn't reach here — capability.js routes them to
  // /work before the scene mounts — but stay conservative if one slips through.
  if (/swiftshader|llvmpipe|software|basic render/.test(r)) return 'low';

  // Real-world strings vary in spacing/punctuation — e.g. Chromium reports
  // integrated AMD parts as "AMD Radeon (TM) Graphics" (space before "(TM)"),
  // which a naive literal match misses. Allow flexible whitespace around the
  // vendor-suffix tokens instead of asserting an exact substring.
  const isIntegrated = /(intel|iris|uhd graphics|vega|radeon\s*\(tm\)\s*graphics|radeon\s+graphics|apple m\d|apple gpu|mali|adreno|powervr)/.test(r);
  const isDiscrete = /(geforce|rtx|gtx|quadro|radeon\s+rx|radeon\s+pro|firepro)/.test(r);

  const mem = typeof navigator !== 'undefined' && 'deviceMemory' in navigator ? navigator.deviceMemory : null;
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  const saveData = !!(conn && (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || '')));
  const coarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

  if (isDiscrete && !saveData) return 'high';
  if (isIntegrated) return (mem !== null && mem <= 4) || saveData ? 'low' : 'mid';
  if (saveData || coarse || (mem !== null && mem <= 4)) return 'low';
  if (!rendererString) return 'mid'; // unknown string: stay conservative, not optimistic
  return cores >= 8 ? 'high' : 'mid';
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @returns governor handle — see method docs inline.
 */
export function createPerfGovernor(renderer) {
  const tier = detectTier(renderer);
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const ceiling = Math.min(dpr, PR_CEIL_DEFAULT);

  let pixelRatio = tier === 'low' ? Math.min(ceiling, 0.85) : tier === 'mid' ? Math.min(ceiling, 1.1) : ceiling;
  pixelRatio = Math.max(PR_FLOOR, Math.min(ceiling, pixelRatio));
  renderer.setPixelRatio(pixelRatio);

  // Lowest tier only, decided once at startup — a wholesale on/off, never a
  // quality retune. The renderer's canvas has no `image-rendering: pixelated`
  // override anywhere in the stage's CSS, so a lowered pixel ratio upscales
  // through the browser's default (bilinear) canvas scaling — soft, not
  // aliased.
  if (tier === 'low') renderer.shadowMap.enabled = false;

  let pinned = false;
  let dirty = true;
  let lastRenderAt = -Infinity; // never throttle the very first frame
  let lastActivity = -Infinity;
  let motionProbe = null;
  let motionAt = -Infinity;
  let renderCount = 0;
  let lastTick = null;
  const dts = [];
  let vsyncMs = 1000 / 60;
  const touch = () => { lastActivity = performance.now(); };
  const inputEvents = ['pointerdown', 'pointermove', 'pointerup', 'keydown', 'keyup', 'wheel', 'touchstart', 'touchmove'];
  if (typeof window !== 'undefined') for (const e of inputEvents) window.addEventListener(e, touch, { capture: true, passive: true });
  function trackVsync(now) {
    if (lastTick !== null) {
      const dt = now - lastTick;
      if (dt > 3 && dt < 40) { dts.push(dt); if (dts.length > 40) dts.shift(); }
    }
    lastTick = now;
    if (dts.length >= 10) vsyncMs = [...dts].sort((a, b) => a - b)[dts.length >> 2];
  }
  const samples = [];
  let overCount = 0;
  let underCount = 0;
  let lastStepAt = 0;
  let loweredOnce = false; // never raise resolution again after lowering it: each step reallocates the buffer and shows as a hitch
  let lastStats = { tier, pixelRatio, medianMs: null };

  const api = {
    tier,
    // Test-only fixed-resolution measurements must not be silently downscaled.
    pinPixelRatio(value) { pinned = value !== null; if(pinned){pixelRatio=value;renderer.setPixelRatio(value);} samples.length=0; },

    /** Mark the scene dirty. Does not itself schedule a frame — the caller's loop checks isDirty(). */
    markDirty() { dirty = true; },

    /** Whether a frame is pending. False means: stop issuing rAF calls entirely until markDirty() again. */
    isDirty() { return dirty; },

    /**
     * True exactly when the caller should render THIS tick — consumes the
     * dirty flag. False while dirty stays true means "still pending, but
     * throttled to the 60Hz floor" — the caller should requeue, not stop.
     */
    shouldRender(now) {
      if (!dirty) { lastTick = null; return false; }
      trackVsync(now);
      if (motionProbe && motionProbe()) { lastActivity = now; motionAt = now; }
      const base = Math.max(1, Math.floor(1000 / vsyncMs / TARGET_HZ));
      const n = now - lastActivity > IDLE_MS ? base * 2 : base;
      if (Math.round((now - lastRenderAt) / vsyncMs) < n) return false;
      dirty = false;
      lastRenderAt = now;
      renderCount++;
      return true;
    },

    /** fn() -> true while something other than raw input is moving (tweens, camera, held objects). */
    setMotionProbe(fn) { motionProbe = fn; },
    /** Mark the scene active now (restores full rate on the next tick). */
    touch,
    /** Pacing readout for tests and the HUD. */
    getRenderCount() { return renderCount; },
    getPacing() { const base = Math.max(1, Math.floor(1000 / vsyncMs / TARGET_HZ)); return { refreshHz: +(1000 / vsyncMs).toFixed(1), vsyncMs: +vsyncMs.toFixed(2), idle: performance.now() - lastActivity > IDLE_MS, base, sinceMotionMs: Math.round(performance.now() - motionAt) }; },

    /** Feed the measured CPU cost (ms) of the frame just rendered. Adapts pixel ratio off a rolling median. */
    recordFrame(cpuMs, now) {
      samples.push(cpuMs);
      if (samples.length > WINDOW) samples.shift();
      if (samples.length < 8) return; // not enough signal yet
      const m = median(samples);
      lastStats = { tier, pixelRatio, medianMs: m };
      // Persistence counters accumulate regardless of cooldown, so a run of
      // bad (or good) frames during the cooldown window isn't thrown away —
      // it's ready to act the instant the cooldown clears. Only the actual
      // renderer.setPixelRatio() call is gated by cooldown.
      if (m > DOWNSHIFT_MS) { overCount++; underCount = 0; }
      else if (m < UPSHIFT_MS) { underCount++; overCount = 0; }
      else { overCount = 0; underCount = 0; }
      if (pinned) return;
      if (now - lastStepAt < COOLDOWN_MS) return;
      if (overCount >= PERSIST && pixelRatio > PR_FLOOR) {
        pixelRatio = Math.max(PR_FLOOR, +(pixelRatio - STEP).toFixed(3));
        loweredOnce = true;
        renderer.setPixelRatio(pixelRatio);
        lastStepAt = now; overCount = 0; samples.length = 0;
      } else if (!loweredOnce && underCount >= PERSIST && pixelRatio < ceiling) {
        pixelRatio = Math.min(ceiling, +(pixelRatio + STEP).toFixed(3));
        renderer.setPixelRatio(pixelRatio);
        lastStepAt = now; underCount = 0; samples.length = 0;
      }
    },

    /** Snapshot for telemetry / debugging: { tier, pixelRatio, medianMs }. */
    getStats() { return lastStats; },

    dispose() { samples.length = 0; if (typeof window !== 'undefined') for (const e of inputEvents) window.removeEventListener(e, touch, { capture: true }); },
  };

  // Debug/introspection hook only — not read by any app logic. Lets a human
  // (or a headless probe) confirm the ladder is stepping without adding UI.
  try {
    if (typeof window !== 'undefined') window.__perfGovernor = api;
  } catch { /* ignore */ }

  return api;
}
