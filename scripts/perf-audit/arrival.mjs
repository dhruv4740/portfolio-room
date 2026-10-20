// Per-second frame cost for the first seconds after the room reveals, with the arrival
// intro enabled (SEEN=0, default) or suppressed (SEEN=1). Click "explore-room" after
// 2 s to start the seated arrival. Reports per 1 s bucket: fps, rAF gap max, GPU median.
//   BASE=http://localhost:4176 [SEEN=1] [THROTTLE=4] [AB=pr=1.25] [TAG=x] node scripts/perf-audit/arrival.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4176';
const SEEN = process.env.SEEN === '1', THROTTLE = +(process.env.THROTTLE || 1);
const AB = process.env.AB || '', TAG = process.env.TAG || (SEEN ? 'arr_seen' : 'arr_fresh');
const OUT = 'scripts/shots/perf'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await p.addInitScript(([ab, seen]) => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1');
  if (seen) sessionStorage.setItem('v3:arrival-seen', '1');
  if (ab) localStorage.setItem('v3:ab', ab);
  window.__raf = []; const f = t => { window.__raf.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f);
}, [AB, SEEN]);
await p.goto(BASE + '/');
await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1', null, { timeout: 90000 });
await p.evaluate(() => { window.__t0 = performance.now(); window.__raf.length = 0; window.__v3test.gpuSamples(true); });
const marks = {};
const t0 = Date.now();
await p.waitForTimeout(2000);
await p.locator('[data-launchpad-action="explore-room"]').click().catch(() => { marks.noLaunchpad = true; });
marks.clickAtMs = Date.now() - t0;
await p.waitForTimeout(12000);
marks.cue = await p.evaluate(() => !!document.querySelector('.arrival-cue'));
marks.seated = await p.evaluate(() => document.querySelector('.scan-root')?.dataset.seated);
const r = await p.evaluate(() => ({ raf: window.__raf.slice(), t0: window.__t0, gpu: window.__v3test.gpuSamples(), pr: window.__v3test.perf().pixelRatio }));
const sec = [];
for (let s = 0; s < 14; s++) {
  const t = r.raf.filter(x => x - r.t0 >= s * 1000 && x - r.t0 < (s + 1) * 1000);
  const gaps = t.slice(1).map((x, i) => x - t[i]);
  sec.push({ s, fps: t.length, gapMax: Math.round(Math.max(0, ...gaps)) });
}
const g = [...r.gpu].sort((a, c) => a - c);
const out = { tag: TAG, seen: SEEN, throttle: THROTTLE, ab: AB, marks, gpuMedOverall: +(g[g.length >> 1] || 0).toFixed(2), gpuP95: +(g[Math.floor(g.length * .95)] || 0).toFixed(2), gpuMax: +(g[g.length - 1] || 0).toFixed(1), pr: r.pr, perSecond: sec };
await writeFile(`${OUT}/audit-arrival-${TAG}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await b.close();
