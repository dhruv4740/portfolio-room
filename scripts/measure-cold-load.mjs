// Cold first-load profile on the real GPU: fresh browser profile, no shader disk cache.
//   BASE=http://localhost:4176 node scripts/measure-cold-load.mjs [tag]
// Reports when the launchpad is clickable, the frame gaps in the first seconds,
// the worst frames, program count, and the time until shaders report warm.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const tag = process.argv[2] || 'now';
const BASE = process.env.BASE || 'http://localhost:4176';
const OUT = 'scripts/shots/perf'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-gpu-shader-disk-cache'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
  window.__f = []; window.__lt = []; window.__ev = {};
  const mark = (k) => { if (!(k in window.__ev)) window.__ev[k] = performance.now(); };
  const tick = t => { window.__f.push(t); requestAnimationFrame(tick);
    const lp = document.querySelector('[data-launchpad-action="desktop-projects"]'); if (lp) mark('launchpadInDom');
    const st = document.querySelector('.workspace-stage'); if (st) { mark('stage'); for (const k of ['winterCity', 'shadersWarm', 'roomBake', 'roomRevealed']) if (st.dataset[k]) mark(k + ':' + st.dataset[k]); }
  }; requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch {}
});
await p.goto(BASE + '/');
await p.waitForTimeout(Number(process.env.WAIT || 30000));
const r = await p.evaluate(() => {
  const f = window.__f, gaps = f.slice(1).map((t, i) => [Math.round(f[i]), Math.round(t - f[i])]);
  const win = (a, z) => gaps.filter(g => g[0] >= a && g[0] < z).map(g => g[1]);
  const stat = a => a.length ? { n: a.length, max: Math.max(...a), over100: a.filter(x => x > 100).length, sumOver50: a.filter(x => x > 50).reduce((s, x) => s + x, 0) } : null;
  const st = document.querySelector('.workspace-stage');
  return { ev: Object.fromEntries(Object.entries(window.__ev).map(([k, v]) => [k, Math.round(v)])),
    worst: gaps.sort((a, b) => b[1] - a[1]).slice(0, 8), longTasksMs: Math.round(window.__lt.reduce((s, [, x]) => s + x, 0)),
    first4s: stat(win(0, 4000)), s4to10: stat(win(4000, 10000)), s10to20: stat(win(10000, 20000)), after20: stat(win(20000, 1e9)),
    dataset: st ? { ...st.dataset } : null };
});
await writeFile(`${OUT}/cold-${tag}.json`, JSON.stringify({ ...r, errors }, null, 1));
console.log(JSON.stringify({ ...r, errors }));
await b.close();
