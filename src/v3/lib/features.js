// One switch for the "use my real apps" push: a primary "Try my live apps" option on the room overview and a
// row of one-tap live-demo links at the top of /work. Set false to restore the previous overview and /work.
export const LIVE_APPS_HERO = true;

// Night only: skip the prefiltered room environment probe (a cubemap render + PMREM at load). Default OFF = probe runs as before.
// Measurement override: add ?skipprobe=1 to the URL (or ?skipprobe=0), or set localStorage v3:skip-probe to 1.
export const NIGHT_SKIP_PROBE = false;
export function skipNightProbe() {
  try {
    const q = new URLSearchParams(location.search).get('skipprobe');
    if (q === '1') return true;
    if (q === '0') return false;
    if (localStorage.getItem('v3:skip-probe') === '1') return true;
  } catch {}
  return NIGHT_SKIP_PROBE;
}
