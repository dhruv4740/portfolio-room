// Steady-state frame cost on the real GPU: standing idle / look-around, seated idle /
// look-around, typing on the in-room keyboard. Per scenario: rAF gap p50/p95/max,
// render() CPU ms, GPU ms (EXT_disjoint_timer_query), main-thread busy %.
//   BASE=http://localhost:4176 [THROTTLE=4] [AB=pr=1.25,nocontact] [QS=?sky=night] [TAG=x] [ONLY=typing] node scripts/perf-audit/steady.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4176';
const THROTTLE = +(process.env.THROTTLE || 1);
const AB = process.env.AB || '', QS = process.env.QS || '';
const TAG = process.env.TAG || 'steady';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const OUT = 'scripts/shots/perf'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', headless: !process.env.HEADED, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', ...(process.env.HEADED ? ['--window-position=-2400,0','--window-size=1600,950','--disable-features=CalculateNativeWinOcclusion','--disable-renderer-backgrounding','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows'] : [])] });
const ctx = await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Performance.enable');
if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await p.addInitScript(ab => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  if (ab) localStorage.setItem('v3:ab', ab);
  window.__raf = []; window.__lt = []; window.__keys = [];
  const f = t => { window.__raf.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch {}
  // keydown handler duration: capture-phase start on window, end at a bubble listener on window
  addEventListener('keydown', () => { window.__k0 = performance.now(); }, true);
  addEventListener('keydown', () => { window.__keys.push(performance.now() - window.__k0); });
}, AB);
await p.goto(BASE + '/' + QS);
await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1', null, { timeout: 90000 });
await p.waitForTimeout(3000);
const vis = await p.evaluate(async () => { const n0 = window.__raf.length; await new Promise(r => setTimeout(r, 1000)); return { state: document.visibilityState, rafHz: window.__raf.length - n0 }; });
console.log('window check', JSON.stringify(vis)); if (vis.state !== 'visible' || vis.rafHz < 50) { console.log('DISCARD: window hidden or rAF throttled'); process.exit(2); }
// wrap render() to time CPU submission per frame
await p.evaluate(() => {
  const r = window.__v3test.renderer, o = r.render.bind(r); window.__rc = []; window.__rt = [];
  r.render = (s, c) => { const t = performance.now(); o(s, c); window.__rc.push(performance.now() - t); window.__rt.push(t); };
});
const pct = (a, q) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * q))].toFixed(2); };
const busy = async () => (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'TaskDuration').value;
const drag = async ms => { const box = await p.locator('.workspace-stage canvas').boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2; await p.mouse.move(cx, cy); await p.mouse.down(); const t0 = Date.now(); let i = 0; while (Date.now() - t0 < ms) { await p.mouse.move(cx + Math.sin(i / 20) * 40, cy + Math.cos(i / 25) * 25); i++; await p.waitForTimeout(16); } await p.mouse.move(cx, cy); await p.mouse.up(); };
const results = {};
async function scenario(name, fn, ms = 4000) {
  if (ONLY.length && !ONLY.includes(name)) return;
  await p.evaluate(() => { window.__raf.length = 0; window.__rc.length = 0; window.__rt.length = 0; window.__lt.length = 0; window.__keys.length = 0; window.__v3test.gpuSamples(true); });
  const b0 = await busy(), t0 = Date.now();
  await fn(ms);
  const wall = (Date.now() - t0) / 1000, b1 = await busy();
  const r = await p.evaluate(() => ({ raf: window.__raf.slice(), rc: window.__rc.slice(), rt: window.__rt.slice(), lt: window.__lt.slice(), keys: window.__keys.slice(), gpu: window.__v3test.gpuSamples(), perf: window.__v3test.perf() }));
  const gaps = r.raf.slice(1).map((t, i) => t - r.raf[i]);
  const rg = r.rt.slice(1).map((t, i) => t - r.rt[i]), edges = [0, 10, 14, 18, 25, 35, 50, 1e9], hist = {}; edges.slice(0, -1).forEach((e, i) => { hist[`${e}-${edges[i + 1] > 1e8 ? 'inf' : edges[i + 1]}`] = rg.filter(g => g >= e && g < edges[i + 1]).length; });
  results[name] = { renderFps: +(r.rt.length / wall).toFixed(1), renderGapHist: hist, frames: r.raf.length, fps: +(r.raf.length / wall).toFixed(1), gapP50: pct(gaps, .5), gapP95: pct(gaps, .95), gapMax: pct(gaps, 1),
    renders: r.rc.length, cpuMed: pct(r.rc, .5), cpuP95: pct(r.rc, .95), gpuMed: pct(r.gpu, .5), gpuP95: pct(r.gpu, .95), gpuN: r.gpu.length,
    mainBusyPct: +(100 * (b1 - b0) / wall).toFixed(0), longTasks: r.lt.length, longTaskMs: Math.round(r.lt.reduce((s, [, d]) => s + d, 0)), longestTask: Math.round(Math.max(0, ...r.lt.map(x => x[1]))),
    keyHandlerMs: r.keys.length ? { n: r.keys.length, med: pct(r.keys, .5), max: pct(r.keys, 1), first: +r.keys[0].toFixed(1) } : undefined, pr: r.perf.pixelRatio, programs: r.perf.programs, lights: r.perf.lights };
  console.log(name, JSON.stringify(results[name]));
}
await scenario('standing-idle', ms => p.waitForTimeout(ms));
await scenario('standing-look', drag);
await p.locator('[data-launchpad-action="explore-room"]').click();
await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 30000 });
await p.waitForTimeout(3000);
await scenario('seated-idle', ms => p.waitForTimeout(ms));
await scenario('seated-look', drag);
await p.locator('.workspace-stage canvas').focus();
const typeKeys = async ms => { const letters = 'asdfjkl;ghqweruiop'; const t0 = Date.now(); let i = 0; while (Date.now() - t0 < ms) { await p.keyboard.press(letters[i++ % letters.length]); await p.waitForTimeout(120); } };
if (process.env.PROFILE1) await cdp.send('Profiler.enable'), await cdp.send('Profiler.start');
await scenario('typing-first-key', async () => { await p.keyboard.press('a'); await p.waitForTimeout(1500); }, 1500);
if (process.env.PROFILE1) {
  const { profile } = await cdp.send('Profiler.stop'); const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = profile.timeDeltas; profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
  console.log('FIRST-KEY TOP SELF (ms):', JSON.stringify([...self].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, Math.round(v / 1000)])));
}
if (process.env.PROFILE) await scenario('typing-warmup', typeKeys, 4000);
if (process.env.PROFILE) await cdp.send('Profiler.enable'), await cdp.send('Profiler.start');
await scenario('typing', typeKeys, 6000);
if (process.env.PROFILE) {
  const { profile } = await cdp.send('Profiler.stop'); const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = profile.timeDeltas; profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
  console.log('TOP SELF (ms):', JSON.stringify([...self].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, Math.round(v / 1000)])));
}
await writeFile(`${OUT}/audit-steady-${TAG}.json`, JSON.stringify({ tag: TAG, ab: AB, qs: QS, throttle: THROTTLE, results }, null, 1));
await b.close();
