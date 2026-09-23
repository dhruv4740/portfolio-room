// Frame sequence of a whole interaction on the real GPU, plus one contact
// sheet per phase. Seeks the live timeline at even steps, so every beat of the
// motion is sampled regardless of frame rate.
//   GPU=1 BASE=http://localhost:4175 node scripts/record-motion.mjs resume [tag]
// Output: scripts/shots/motion/<action>-<tag>-<phase>-sheet.png (+ single frames).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [action = 'resume', tag = 'now'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4173';
const t0 = Date.now(), log = m => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', m);
const OUT = 'scripts/shots/motion'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1');
  sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
});
await p.goto(BASE + '/?sky=day');
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 60000 });
await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
const HIDE = '.seat-exit,.telemetry-root{visibility:hidden!important}';
const stage = k => p.evaluate(k => document.querySelector('.workspace-stage')?.dataset[k], k);
const until = (k, v) => p.waitForFunction(([k, v]) => document.querySelector('.workspace-stage')?.dataset[k] === v, [k, v], { polling: 50, timeout: 20000 });
const mark = () => p.evaluate(() => { window.__oldTl = window.__v3test.timeline(); });
const fresh = () => p.waitForFunction(() => { const t = window.__v3test.timeline(); return t && t !== window.__oldTl; }, null, { polling: 10 });

// Slows the new timeline to a crawl (a paused one stops the render loop), steps it through `n` evenly spaced times, then lets it finish.
// `probe` names a __v3test method whose result is logged and captioned per frame.
async function sweep(phase, n = 16, probe = null) {
  await fresh(); log(phase + ' timeline');
  const duration = await p.evaluate(() => { const t = window.__v3test.timeline(); t.timeScale(0.02); return t.duration(); });
  const frames = [];
  for (let i = 0; i < n; i++) {
    // The last sample stops short of the end: seeking onto it would swallow onComplete.
    const time = +(Math.min(duration * i / (n - 1), duration - 0.02)).toFixed(3);
    await p.evaluate(t => { window.__v3test.timeline().seek(t).play(); }, time); await p.waitForTimeout(150);
    const buf = await p.screenshot({ style: HIDE });
    const data = probe ? await p.evaluate(m => window.__v3test[m](), probe) : null;
    const name = `${action}-${tag}-${phase}-${String(i).padStart(2, '0')}`;
    await writeFile(`${OUT}/${name}.png`, buf); frames.push({ time, buf, data }); log(name + (data ? ' ' + JSON.stringify(data) : ''));
  }
  await p.evaluate(() => { window.__v3test.timeline().timeScale(1).play(); });
  await sheet(phase, frames, duration);
}
async function sheet(phase, frames, duration) {
  const s = await b.newPage({ viewport: { width: 1600, height: 400 } });
  const cells = frames.map(f => `<figure><img src="data:image/png;base64,${f.buf.toString('base64')}"><figcaption>${f.time.toFixed(2)} s${f.data ? ' · ' + JSON.stringify(f.data) : ''}</figcaption></figure>`).join('');
  await s.setContent(`<style>body{margin:0;background:#111;color:#ddd;font:13px system-ui}h1{font-size:15px;margin:8px}
    main{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px}figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 4px}</style>
    <h1>${action} · ${phase} · ${tag} · ${duration.toFixed(2)} s timeline · ${BASE}</h1><main>${cells}</main>`);
  await s.screenshot({ path: `${OUT}/${action}-${tag}-${phase}-sheet.png`, fullPage: true }); await s.close();
}
const button = name => p.getByRole('button', { name, exact: true });

if (action === 'resume') {
  await mark(); await button('RESUME').click(); await sweep('pickup', 16, 'drawerClip');
  await until('actionState', 'resume-reading'); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${action}-${tag}-held.png`, style: HIDE });
  // Reading zoom: wheel in fully, pointer at the page's top-left third.
  await p.mouse.move(600, 330); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(40); }
  await p.mouse.move(560, 300); await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${action}-${tag}-zoomed.png`, style: HIDE });
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(40); }
  await mark(); await p.keyboard.press('Escape'); await sweep('putdown', 16, 'drawerClip');
  await until('actionState', 'idle');
  // A second cycle: the page must come back out at the same size and place.
  await button('RESUME').click(); await until('actionState', 'resume-reading'); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${action}-${tag}-held-again.png`, style: HIDE });
} else if (action === 'phone') {
  // Pick-up timeline, then (after the zoom in and out flights) the put-down timeline.
  await mark(); await button('PHONE').click(); await sweep('pickup', 16, 'phoneGap');
  await until('phoneState', 'zoomed'); await p.waitForTimeout(600);
  await mark(); await p.keyboard.press('Escape'); await sweep('putdown', 16, 'phoneGap');
  await until('phoneState', 'desk');
} else throw new Error(`unknown action ${action}`);
console.log(JSON.stringify({ action, tag, errors }));
await b.close();
