// CPU profile, rAF frame gaps and long tasks around one interaction on the real GPU.
//   BASE=http://localhost:4175 node scripts/profile-interaction.mjs <window|enter|leave|tour|tour-cold> [tag]
// "tour-cold" starts the tour as soon as the room appears (what verify-tour does);
// every other scenario first waits for the first-load stall to settle.
// Writes scripts/shots/perf/<scenario>-<tag>.json (summary) and .cpuprofile (open in DevTools).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [scenario = 'window', tag = 'now'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = 'scripts/shots/perf'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1');
  sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  // Frame and long-task log from the very first frame.
  window.__f = []; window.__lt = [];
  const tick = t => { window.__f.push(t); requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch {}
});
const t0 = Date.now(); await p.goto(BASE + '/');
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 90000 });
const roomAt = await p.evaluate(() => performance.now());
const ds = (sel, k) => p.evaluate(([sel, k]) => document.querySelector(sel)?.dataset[k], [sel, k]);
const until = (sel, k, v, timeout = 60000) => p.waitForFunction(([sel, k, v]) => document.querySelector(sel)?.dataset[k] === v, [sel, k, v], { polling: 50, timeout });
// Settled: 30 consecutive frames under 50 ms.
const settle = () => p.evaluate(() => new Promise(r => { let n = 0, last = performance.now(); const f = t => { n = t - last < 50 ? n + 1 : 0; last = t; if (n >= 30) r(t); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
const cdp = await p.context().newCDPSession(p);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
async function measure(name, act, done, tail = 1500) {
  const start = await p.evaluate(() => performance.now());
  await cdp.send('Profiler.start');
  await act(); await done(); await p.waitForTimeout(tail);
  const { profile } = await cdp.send('Profiler.stop');
  const end = await p.evaluate(() => performance.now());
  const { frames, lt } = await p.evaluate(([s, e]) => ({ frames: window.__f.filter(t => t >= s && t <= e), lt: window.__lt.filter(([t]) => t >= s && t <= e) }), [start, end]);
  const gaps = frames.slice(1).map((t, i) => [Math.round(frames[i] - start), Math.round(t - frames[i])]);
  const d = gaps.map(g => g[1]).sort((a, b) => a - b), pct = q => d[Math.min(d.length - 1, Math.floor(d.length * q))];
  // Self time per function from the sampled profile.
  const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = profile.timeDeltas; profile.samples.forEach((id, i) => { const n = byId.get(id), c = n.callFrame; const key = `${c.functionName || '(anon)'} ${c.url.split('/').pop().split('?')[0]}:${c.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000); });
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, ms]) => [k, Math.round(ms)]);
  const summary = { name, ms: Math.round(end - start), frames: frames.length, p50: pct(.5), p95: pct(.95), max: d.at(-1), over50: d.filter(x => x > 50).length, over100: d.filter(x => x > 100).length,
    worst: gaps.filter(g => g[1] > 50).sort((a, b) => b[1] - a[1]).slice(0, 10), longTasksMs: Math.round(lt.reduce((s, [, x]) => s + x, 0)), longTasks: lt.length, top };
  await writeFile(`${OUT}/${scenario}-${tag}-${name}.cpuprofile`, JSON.stringify(profile));
  console.log(JSON.stringify(summary));
  return summary;
}
const results = [];
if (scenario !== 'tour-cold' && !process.env.COLD) {
  const settledAt = await settle();
  console.log(JSON.stringify({ firstLoadSettleMs: Math.round(settledAt - roomAt), sinceNavMs: Date.now() - t0 }));
}
if (scenario === 'window') {
  await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500); if (!process.env.COLD) await settle();
  results.push(await measure('open', () => p.getByRole('button', { name: 'WINDOW', exact: true }).click(), () => until('.workspace-stage', 'windowOpen', '1')));
  await until('.workspace-stage', 'actionState', 'idle'); await settle();
  results.push(await measure('close', () => p.getByRole('button', { name: 'WINDOW', exact: true }).click(), () => until('.workspace-stage', 'windowOpen', '0')));
} else if (scenario === 'sit') {
  console.log(JSON.stringify({ parallelCompile: await p.evaluate(() => !!document.querySelector('.workspace-stage canvas').getContext('webgl2').getExtension('KHR_parallel_shader_compile')) }));
  // The background shader warm-up starts once the load settles; log when it finishes.
  const w0 = Date.now(); await until('.workspace-stage', 'shadersWarm', 'ready', 30000).then(() => console.log(JSON.stringify({ shadersWarmMs: Date.now() - w0 })), () => console.log(JSON.stringify({ shadersWarm: 'not ready after 30 s' })));
  const before = await p.evaluate(() => window.__v3test.programs());
  results.push(await measure('sit', () => p.locator('[data-launchpad-action="explore-room"]').click(), () => until('.scan-root', 'seated', 'true'), 3000));
  const after = await p.evaluate(() => window.__v3test.programs()); if (process.env.FULL) console.log(JSON.stringify(await p.evaluate(b => window.__v3test.programs(true).filter(x => !b.some(y => x.startsWith(y + ' '))), before)));
  console.log(JSON.stringify({ newPrograms: after.filter(x => !before.includes(x)), total: after.length }));
} else if (scenario === 'enter' || scenario === 'leave') {
  const enter = () => measure('enter', () => p.locator('[data-launchpad-action="desktop-projects"]').click(), () => until('.scan-root', 'entranceState', 'inside'), 2500);
  const leave = () => measure('leave', async () => { await p.evaluate(() => document.activeElement?.blur()); await p.keyboard.press('Escape'); }, () => p.waitForFunction(() => { const s = document.querySelector('.scan-root')?.dataset.entranceState; return s && s !== 'inside' && s !== 'leaving'; }, null, { polling: 50, timeout: 30000 }), 2500);
  // New shader programs each step compiled (three.js compiles on first use).
  await until('.workspace-stage', 'shadersWarm', 'ready', 30000).catch(() => console.log('shaders not warm after 30 s'));
  let seen = await p.evaluate(() => window.__v3test.programs());
  const fresh = async label => { const now = await p.evaluate(() => window.__v3test.programs()); const add = now.filter(x => !seen.includes(x)); seen = now; console.log(JSON.stringify({ programsAfter: label, total: now.length, new: add })); results.at(-1).newPrograms = add; };
  results.push(await enter()); await fresh('enter'); await settle(); results.push(await leave()); await fresh('leave'); await settle();
  results.push(await enter()); await fresh('enter2'); await settle(); results.push(await leave()); await fresh('leave2');
} else if (scenario === 'tour' || scenario === 'tour-cold') {
  // Beat log: which tour step, OS windows and phone app, sampled every 250 ms.
  await p.evaluate(() => { const s = performance.now(); window.__beats = []; setInterval(() => { const f = document.querySelector('iframe')?.contentDocument;
    window.__beats.push([Math.round(performance.now() - s), document.querySelector('[data-testid="tour-caption"] p')?.textContent?.slice(0, 24) || (document.querySelector('[data-testid="tour-end"]') ? 'END' : null),
      document.querySelector('.scan-root')?.dataset.entranceState, [...(f?.querySelectorAll('[id^=win-body-]') || [])].map(e => e.id.slice(9)).join(','), document.querySelector('.phone-screen')?.dataset.app || null]); }, 250); });
  results.push(await measure('tour', () => p.keyboard.press('4'), () => p.locator('[data-testid="tour-end"]').waitFor({ timeout: 90000 }), 500));
  const beats = await p.evaluate(() => window.__beats);
  // Only the changes.
  const changes = beats.filter((x, i) => !i || JSON.stringify(x.slice(1)) !== JSON.stringify(beats[i - 1].slice(1)));
  for (const c of changes) console.log('beat', JSON.stringify(c));
  results.at(-1).beats = changes;
} else throw new Error('unknown scenario ' + scenario);
await writeFile(`${OUT}/${scenario}-${tag}.json`, JSON.stringify({ scenario, tag, BASE, results, errors }, null, 1));
console.log(JSON.stringify({ errors }));
await b.close();
