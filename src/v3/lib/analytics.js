// First-party visit log. No cookies, no IP, no fingerprinting: one beacon per
// page view/route change plus one on pagehide with dwell time. Production hosts
// only; skipped for the owner (localStorage v3:no-track) and test runs (v3:test).
const ok = () => {
  try {
    return ['dhruvkothari.pages.dev','dhruvkothari.com','www.dhruvkothari.com'].includes(location.hostname)
      && !localStorage.getItem('v3:no-track') && !localStorage.getItem('v3:test');
  } catch { return false; }
};
const start = Date.now();
const seen = new Set();
// Visit source: ?from=<slug> (a-z 0-9 -, max 24) is kept in sessionStorage so later pages of the visit carry it.
const source = () => {
  try {
    const f = (new URLSearchParams(location.search).get('from') || '').toLowerCase();
    if (/^[a-z0-9-]{1,24}$/.test(f)) sessionStorage.setItem('v3:src', f);
    return sessionStorage.getItem('v3:src') || undefined;
  } catch { return undefined; }
};
const send = (body) => {
  try { navigator.sendBeacon('/api/hit', new Blob([JSON.stringify({ ...body, src: source() })], { type: 'text/plain' })); } catch { /* ignore */ }
};
const device = () => (matchMedia('(pointer:coarse)').matches ? (innerWidth < 700 ? 'phone' : 'tablet') : 'desktop');
function trackRoute(path = location.pathname + location.hash) {
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
