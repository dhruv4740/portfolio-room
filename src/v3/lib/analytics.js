// First-party visit log. No cookies, no IP, no fingerprinting: one beacon per
// page view/route change plus one on pagehide with dwell time. Production hosts
// only; skipped for the owner (localStorage v3:no-track) and test runs (v3:test).
const ok = () => {
  try {
    return location.hostname==='dhruvkothari.pages.dev'
      && !localStorage.getItem('v3:no-track') && !localStorage.getItem('v3:test');
  } catch { return false; }
};
const start = Date.now();
const seen = new Set();
const send = (body) => {
  try { navigator.sendBeacon('/api/hit', new Blob([JSON.stringify(body)], { type: 'text/plain' })); } catch { /* ignore */ }
};
const device = () => (matchMedia('(pointer:coarse)').matches ? (innerWidth < 700 ? 'phone' : 'tablet') : 'desktop');
export function trackRoute(path = location.pathname + location.hash) {
  if (!ok() || seen.has(path)) return;
  seen.add(path);
  let ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* ignore */ }
  send({ t: 'view', path, ref: ref === location.hostname ? '' : ref, dev: device() });
}
export function initAnalytics() {
  if (!ok()) return;
  trackRoute();
  addEventListener('hashchange', () => trackRoute());
  addEventListener('pagehide', () => send({ t: 'end', path: location.pathname + location.hash, secs: Math.round((Date.now() - start) / 1000) }));
}
