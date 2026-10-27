// Cold first-load audit as a new visitor (fresh profile, no shader disk cache).
//   BASE=http://localhost:4176 [THROTTLE=4] [WAIT=40000] [TAG=x] node scripts/perf-audit/cold.mjs
// Reports: time to launchpad in DOM, to room reveal (data-rooms-revealed), to first
// quiet main thread, long tasks, bytes/requests by type, time blocked inside WebGL
// compile/link calls (patched in the page, measurement only), program count, lights.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4176';
const THROTTLE = +(process.env.THROTTLE || 1);
const WAIT = +(process.env.WAIT || 40000);
const AB = process.env.AB || '';
const QS = process.env.QS || '';
const TAG = process.env.TAG || `cpu${THROTTLE}`;
const OUT = 'scripts/shots/perf'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--disable-gpu-shader-disk-cache'] });
const ctx = await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
await cdp.send('Performance.enable');
if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
const reqs = new Map(); const done = [];
cdp.on('Network.requestWillBeSent', e => reqs.set(e.requestId, { url: e.request.url, t0: e.timestamp, wall: e.wallTime }));
cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) done.push({ url: r.url, bytes: e.encodedDataLength, t0: r.t0, t1: e.timestamp }); });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript((ab) => {
  localStorage.setItem('v3:test', '1'); if (ab) localStorage.setItem('v3:ab', ab); localStorage.setItem('v3:surface-override', 'scan');
  window.__ev = {}; window.__lt = []; window.__lag = []; window.__gl = {};
  const mark = k => { if (!(k in window.__ev)) window.__ev[k] = performance.now(); };
  // time spent blocked inside the WebGL calls that carry shader compile/link cost
  for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
    for (const fn of ['compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'useProgram', 'drawElements', 'drawArrays', 'drawElementsInstanced', 'texImage2D', 'texSubImage2D', 'bufferData', 'readPixels']) {
      const o = C.prototype[fn]; if (!o) continue;
      C.prototype[fn] = function (...a) { const t = performance.now(); const r = o.apply(this, a); const d = performance.now() - t; const g = window.__gl[fn] || (window.__gl[fn] = { n: 0, ms: 0, max: 0 }); g.n++; g.ms += d; if (d > 40) (window.__blk ||= []).push([Math.round(t), fn, Math.round(d)]); if (d > g.max) g.max = d; return r; };
    }
  }
  window.__prog = []; setInterval(() => { try { const n = window.__v3test?.programs?.().length; if (n != null && (!window.__prog.length || window.__prog.at(-1)[1] !== n)) window.__prog.push([Math.round(performance.now()), n, document.querySelector('.workspace-stage')?.dataset.roomRevealed || '']); } catch {} }, 100);
  let last = performance.now();
  setInterval(() => { const n = performance.now(); window.__lag.push([Math.round(n), Math.round(n - last - 50)]); last = n; }, 50);
  const tick = () => { const st = document.querySelector('.workspace-stage');
    if (document.querySelector('[data-launchpad-action="desktop-projects"]')) mark('launchpadInDom');
    if (st) { mark('stage'); for (const k of ['roomMaterials', 'roomBake', 'shadersWarm', 'roomRevealed']) if (st.dataset[k]) mark(k + ':' + st.dataset[k]); }
    const cv = st?.querySelector('canvas'); if (cv && getComputedStyle(cv).opacity !== '0') mark('canvasVisible');
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch {}
}, AB);
const t0 = Date.now();
await p.goto(BASE + '/' + QS);
await p.waitForTimeout(WAIT);
const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
const r = await p.evaluate(() => {
  const ev = Object.fromEntries(Object.entries(window.__ev).map(([k, v]) => [k, Math.round(v)]));
  const t = window.__v3test; const scene = t?.scene; const lights = []; let shadowCasters = 0, meshes = 0;
  scene?.traverse(o => { if (o.isLight) lights.push({ type: o.type, name: o.name, cast: !!o.castShadow, map: o.shadow?.mapSize?.x || 0 }); if (o.isMesh) meshes++; });
  const lt = window.__lt; const lag = window.__lag;
  const quiet = (() => { const ts = (ev['launchpadInDom'] ?? 0); for (let s = ts; s < 1e5; s += 250) { if (!lt.some(([a, d]) => a + d > s && a < s + 1000)) return Math.round(s); } return null; })();
  const lagMax = sec => Math.max(0, ...lag.filter(([n]) => n >= sec * 1000 && n < (sec + 1) * 1000).map(x => x[1]));
  return { ev, firstQuiet1sWindow: quiet, progSeries: window.__prog, longTaskCount: lt.length, longTaskTotalMs: lt.reduce((s, [, d]) => s + d, 0),
    longTasksBefore: ev['canvasVisible'] ? lt.filter(([a]) => a < ev['canvasVisible']).reduce((s, [, d]) => s + d, 0) : null,
    lagMaxPerSec: Array.from({ length: 25 }, (_, i) => lagMax(i)),
    blkPerSec: (() => { const o = {}; for (const [t, , d] of window.__blk || []) { const k = Math.floor(t / 1000); o[k] = (o[k] || 0) + d; } return o; })(), blkCount: (window.__blk || []).length,
    gl: Object.fromEntries(Object.entries(window.__gl).map(([k, v]) => [k, { n: v.n, ms: Math.round(v.ms), max: Math.round(v.max) }])),
    perf: t?.perf?.(), gpuMedLast: (() => { const g = (t?.gpuSamples?.() || []).slice(-120).sort((a, b) => a - b); return g.length ? +g[g.length >> 1].toFixed(2) : null; })(), programs: t?.programs?.().length, programNames: t?.programs?.(), lights, meshes,
    dataset: { ...document.querySelector('.workspace-stage')?.dataset } };
});
const net = {}; for (const d of done) { const k = /\.glb|\.bin/.test(d.url) ? 'glb/bin' : /\.(jpg|webp|png|ktx2)/.test(d.url) ? 'img' : /\.js/.test(d.url) ? 'js' : /\.(mp3|ogg|wav)/.test(d.url) ? 'audio' : /\.css/.test(d.url) ? 'css' : 'other'; const n = net[k] || (net[k] = { n: 0, kb: 0 }); n.n++; n.kb += Math.round(d.bytes / 1024); }
const first = Math.min(...done.map(d => d.t0));
const lastFinish = Object.fromEntries(['glb/bin', 'img', 'js', 'audio'].map(k => [k, Math.round(Math.max(0, ...done.filter(d => (/\.glb|\.bin/.test(d.url) ? 'glb/bin' : /\.(jpg|webp|png|ktx2)/.test(d.url) ? 'img' : /\.js/.test(d.url) ? 'js' : /\.(mp3|ogg|wav)/.test(d.url) ? 'audio' : 'x') === k).map(d => (d.t1 - first) * 1000)))]));
const out = { tag: TAG, ab: AB, qs: QS, throttle: THROTTLE, base: BASE, metrics: { scriptMs: Math.round(m.ScriptDuration * 1000), taskMs: Math.round(m.TaskDuration * 1000), layoutMs: Math.round(m.LayoutDuration * 1000), recalcMs: Math.round(m.RecalcStyleDuration * 1000) }, net, lastFinishMs: lastFinish, ...r, errors };
await writeFile(`${OUT}/audit-cold-${TAG}.json`, JSON.stringify(out, null, 1));
const { programNames, lights, ...brief } = out; console.log(JSON.stringify(brief)); console.log('lights', JSON.stringify(lights)); console.log('programs', programNames?.length);
await b.close();
