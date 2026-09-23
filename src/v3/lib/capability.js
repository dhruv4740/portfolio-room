// ============================================================================
// Capability detection — never user-agent sniffing.
// A touch laptop, an iPad and a low-end Android all differ; UA strings lie,
// and "request desktop site" breaks UA checks entirely. Query what the device
// can actually DO, and always let the user override.
// ============================================================================

const OVERRIDE_KEY = 'v3:surface-override';

/** @returns {'coarse'|'fine'} primary pointer type */
export function pointerType() {
  if (typeof window === 'undefined') return 'fine';
  return window.matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine';
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** WebGL2 is the floor for Spark. Below it we serve the static surface. */
export function hasWebGL2() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/** Rough GPU tier via renderer string. Heuristic — treat as a hint, not truth. */
export function gpuHint() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { tier: 'none', renderer: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    const soft = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    return { tier: soft ? 'software' : 'hardware', renderer };
  } catch {
    return { tier: 'unknown', renderer: '' };
  }
}

/** Device memory in GB where exposed (Chromium only). null when unknown. */
export function deviceMemory() {
  return typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? navigator.deviceMemory
    : null;
}

export function saveData() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  return !!(c && (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || '')));
}

/**
 * Which surface should render.
 *  'scan'   — desktop 3D room
 *  'deck'   — mobile vertical deck with gyro
 *  'static' — no WebGL2, software GPU, or data-saver: the fast /work page
 */
export function resolveSurface() {
  const override = readOverride();
  if (override) return override;

  if (!hasWebGL2() || gpuHint().tier === 'software' || saveData()) return 'static';
  return pointerType() === 'coarse' ? 'deck' : 'scan';
}

export function readOverride() {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    return v === 'scan' || v === 'deck' || v === 'static' ? v : null;
  } catch {
    return null;
  }
}

export function setOverride(surface) {
  try {
    if (surface) localStorage.setItem(OVERRIDE_KEY, surface);
    else localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    /* private mode — override simply won't persist */
  }
}

/** True on the visitor's first ever load; used to skip the intro on return. */
const SEEN_KEY = 'v3:seen-intro';
export function hasSeenIntro() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
export function markIntroSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* no-op */
  }
}
