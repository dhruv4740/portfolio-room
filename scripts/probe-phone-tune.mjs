// Phone grip sweep on the real GPU: gap (mm), skin vertices inside the phone and
// wrist bend for the left hand at grip blends 0..1, with the phone held.
//   BASE=http://localhost:4175 node scripts/probe-phone-tune.mjs ['{"side":[...],"back":[...]}'] [steps]
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const opts = JSON.parse(process.argv[2] || '{}'), steps = +(process.argv[3] || 20);
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
await p.addInitScript(() => { localStorage.setItem('v3:test','1'); localStorage.setItem('v3:surface-override','scan'); localStorage.setItem('v3:seen-intro','1'); sessionStorage.setItem('v3:arrival-seen','1'); sessionStorage.setItem('v3:controls','open'); });
await p.goto(BASE + '/?sky=day');
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 90000 });
await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
await p.getByRole('button', { name: 'PHONE', exact: true }).click();
await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed', null, { timeout: 30000 });
// An array of option sets: one compact line per set (gap mm / inside at each step).
if (Array.isArray(opts)) {
  for (const o of opts) {
    const r = await p.evaluate(([o, n]) => { const r = []; for (let i = 0; i <= n; i++) r.push(window.__v3test.tunePhone(o, i / n)); return r; }, [o, steps]);
    console.log(JSON.stringify(o), r.map(x => x.inside ? `X${x.inside}` : x.gapMm).join(' '), 'wrist', r.map(x => x.wrist).join(','));
  }
  await b.close(); process.exit(0);
}
// DP=1: pick every knot's push together (clip-free candidates on a 0.5 mm grid) minimising
// squared knot-to-knot change (mm) plus 0.5 × squared gap error from GAP; a gap over 4 mm is only allowed where nothing closer is clip-free.
if (process.env.DP) {
  const target = +(process.env.GAP || 0.8), K = +(process.env.KNOTS || 40);
  const res = await p.evaluate(([o, target, K]) => {
    const t = window.__v3test, d = Array(K + 1).fill(0), vals = []; for (let m = -30; m <= 30; m += 0.5) vals.push(m);
    const cand = [];
    for (let k = 0; k <= K; k++) { const c = [];
      for (const v of vals) { d.fill(v / 1000); const r = t.tunePhone({ ...o, push: d }, k / K); if (!r.inside) c.push([v, r.gapMm]); }
      const close = c.filter(x => x[1] <= 4); cand.push(close.length ? close : c); }
    const cost = [cand[0].map(([, g]) => [0.5 * (g - target) ** 2, -1])];
    for (let k = 1; k <= K; k++) cost.push(cand[k].map(([v, g]) => { let best = [Infinity, -1];
      cand[k - 1].forEach(([u], j) => { const c = cost[k - 1][j][0] + (v - u) ** 2; if (c < best[0]) best = [c, j]; });
      return [best[0] + 0.5 * (g - target) ** 2, best[1]]; }));
    let j = cost[K].reduce((b, c, i) => c[0] < cost[K][b][0] ? i : b, 0); const out = Array(K + 1);
    for (let k = K; k >= 0; k--) { out[k] = +(cand[k][j][0] / 1000).toFixed(4); j = cost[k][j][1]; }
    return out; }, [opts, target, K]);
  console.log('PUSH ' + JSON.stringify(res)); opts.push = res;
}
// SOLVE=1: bisect the palm-normal push at each knot (grip k/20) for a GAP mm gap (default 1.5) with no skin inside.
if (process.env.SOLVE) {
  const target = +(process.env.GAP || 1.5);
  const res = await p.evaluate(([o, target, K]) => { const t = window.__v3test, d = Array(K + 1).fill(0), out = [];
    for (let k = 0; k <= K; k++) { let lo = -0.03, hi = 0.03;
      // Larger push = deeper into the phone.
      for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; d[k] = m; const r = t.tunePhone({ ...o, push: d }, k / K);
        if (r.inside > 0 || r.gapMm < target) hi = m; else lo = m; }
      d[k] = +lo.toFixed(4);
      // No push reaches the target without clipping (e.g. fingers wrapped round the far edge): take the clip-free push nearest it.
      let r = t.tunePhone({ ...o, push: d }, k / K);
      if (r.inside > 0 || r.gapMm < target - 0.2) { let best = null;
        for (let m = -0.03; m <= 0.03; m += 0.0005) { d[k] = m; r = t.tunePhone({ ...o, push: d }, k / K);
          if (!r.inside && (!best || Math.abs(r.gapMm - target) < best[1])) best = [m, Math.abs(r.gapMm - target)]; }
        d[k] = best ? +best[0].toFixed(4) : 0; }
      out.push({ k, push: d[k], ...t.tunePhone({ ...o, push: d }, k / K) }); }
    return { d, out }; }, [opts, target, +(process.env.KNOTS || 40)]);
  for (const r of res.out) console.log(JSON.stringify(r)); console.log('PUSH ' + JSON.stringify(res.d)); opts.push = res.d;
}
const rows = await p.evaluate(([o, n]) => { const r = []; for (let i = 0; i <= n; i++) { const g = +(i / n).toFixed(3); r.push({ g, ...window.__v3test.tunePhone(o, g) }); } return r; }, [opts, steps]);
for (const r of rows) console.log(JSON.stringify(r));
await b.close();
