// Warms the 3D room's assets while a visitor reads /work/, so the "back to the
// 3D room" full-page navigation starts from a warm cache. Never runs for a
// visitor who stays on /work/ inside the first 8 seconds after load.

const MANIFEST = '/manifest.json';
const DELAY_MS = 8000;
// Startup models the room loads (src/v3/desktop/authored*.js). Hand models are
// excluded on purpose; the room fetches those separately.
const MODELS = ['ceiling-fixture.glb', 'desk-lamp.glb', 'keyboard.glb', 'mouse.glb'];

let done = false;

const saveData = () => !!navigator.connection?.saveData;

function allowedIdle() {
  const effective = navigator.connection?.effectiveType;
  if (saveData()) return false;
  if (effective !== undefined && effective !== '4g') return false;
  if (matchMedia('(pointer: coarse)').matches) return false;
  return true;
}

function hint(href, as) {
  if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  if (as !== 'style') link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.append(link);
}

// Every chunk and CSS file reachable from one manifest key via static imports.
function closure(manifest, root, seen = new Set()) {
  const visit = (key) => {
    if (seen.has(key) || !manifest[key]) return;
    seen.add(key);
    for (const next of manifest[key].imports || []) visit(next);
  };
  visit(root);
  return seen;
}

// Scan chunk plus its static imports (three, shared react pieces). Files the
// /work/ entry already imports are skipped.
function scanHints(manifest) {
  const scanKey = manifest['index.html']?.dynamicImports?.find((k) => /desktop\/Scan\.jsx$/.test(k));
  if (!scanKey) return [];
  const onWork = closure(manifest, 'work/index.html');
  const hints = [];
  for (const key of closure(manifest, scanKey)) {
    if (onWork.has(key)) continue;
    const chunk = manifest[key];
    hints.push([`/${chunk.file}`, 'script']);
    for (const css of chunk.css || []) hints.push([`/${css}`, 'style']);
  }
  return hints;
}

async function run() {
  if (done || saveData()) return;
  done = true;
  const hints = [];
  try {
    const manifest = await fetch(MANIFEST).then((r) => (r.ok ? r.json() : null));
    if (manifest) hints.push(...scanHints(manifest));
  } catch {
    // No manifest: skip the scan chunks, still warm the models.
  }
  for (const name of MODELS) hints.push([`${import.meta.env.BASE_URL}models/after-hours/${name}`, 'fetch']);
  for (const [href, as] of hints) hint(href, as);
}

function startIdle() {
  const later = () => setTimeout(runIfAllowed, DELAY_MS);
  if ('requestIdleCallback' in window) requestIdleCallback(later);
  else setTimeout(later, 0);
}

function runIfAllowed() {
  if (done) return;
  if (document.hidden) {
    document.addEventListener('visibilitychange', function again() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', again);
      runIfAllowed();
    });
    return;
  }
  if (allowedIdle()) run();
}

function onIntent(event) {
  if (done || !event.target?.closest?.('.work-back')) return;
  if (saveData() || matchMedia('(pointer: coarse)').matches) return;
  run();
}

export function prefetchRoom() {
  if (done) return;
  addEventListener('load', startIdle, { once: true });
  for (const type of ['pointerenter', 'focusin', 'touchstart']) {
    document.addEventListener(type, onIntent, { capture: true, passive: true });
  }
}
