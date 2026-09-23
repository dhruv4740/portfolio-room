// Every desk object from the seat, on the real GPU: the action timeline swept at
// even steps (slowed, not paused, so the render loop keeps running), the held
// state, and the return. Each frame is captioned with __v3test.handsProbe():
// per hand, deepest skin / sleeve vertex inside the desk top (mm), vertices inside the held object's
// mesh boxes (loose), and wrist bend; T is the reach clamp's torso shift (cm).
//   BASE=http://localhost:4175 node scripts/sweep-objects.mjs [tag] [lamp,coffee,...]
// Output: scripts/shots/motion/obj-<id>-<tag>-<phase>-sheet.png (+ single frames).
// Camera flights (rig.flyTo) run outside the action timeline, so a seeked frame
// can show the camera slightly ahead of or behind the hands.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [tag = 'now', only] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4173', FRAMES = +(process.env.FRAMES || 12);
const OBJECTS = [['lamp', 'LAMP'], ['coffee', 'COFFEE'], ['award', 'AWARD'], ['notebook', 'NOTEBOOK'], ['pen', 'PEN'], ['blinds', 'BLINDS'],
  ['windowOpen', 'WINDOW'], ['headphones', 'HEADPHONES'], ['keyboard', 'KEYBOARD'], ['phone', 'PHONE'], ['drawer', 'RESUME']]
  .filter(([id]) => !only || only.split(',').includes(id));
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
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 90000 });
await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.shadersWarm === 'ready', null, { timeout: 90000 }).catch(() => log('shaders not warm'));
await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(3000);
const HIDE = '.seat-exit,.telemetry-root{visibility:hidden!important}';
const stage = k => p.evaluate(k => document.querySelector('.workspace-stage')?.dataset[k], k);
const idle = () => p.waitForFunction(() => { const s = document.querySelector('.workspace-stage')?.dataset.actionState; return !s || s === 'idle'; }, null, { polling: 100, timeout: 20000 }).catch(() => log('not idle after 20 s'));
const mark = () => p.evaluate(() => { window.__oldTl = window.__v3test.timeline(); });
const fresh = () => p.waitForFunction(() => { const t = window.__v3test.timeline(); return t && t !== window.__oldTl; }, null, { polling: 10, timeout: 3000 }).then(() => true, () => false);
const probe = () => p.evaluate(() => window.__v3test.handsProbe());
async function sheet(name, frames, title) {
  const s = await b.newPage({ viewport: { width: 1600, height: 400 } });
  const cells = frames.map(f => `<figure><img src="data:image/png;base64,${f.buf.toString('base64')}"><figcaption>${f.label} · ${JSON.stringify(f.data)}</figcaption></figure>`).join('');
  await s.setContent(`<style>body{margin:0;background:#111;color:#ddd;font:13px system-ui}h1{font-size:15px;margin:8px}
    main{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px}figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 4px}</style>
    <h1>${title} · ${BASE}</h1><main>${cells}</main>`);
  await s.screenshot({ path: `${OUT}/${name}-sheet.png`, fullPage: true }); await s.close();
}
// Sweeps the timeline that just started, or (no timeline) samples wall-clock time.
async function capture(id, phase) {
  const frames = [], name = `obj-${id}-${tag}-${phase}`;
  if (await fresh()) {
    const duration = await p.evaluate(() => { const t = window.__v3test.timeline(); t.timeScale(0.02); return t.duration(); });
    for (let i = 0; i < FRAMES; i++) {
      const time = +(Math.min(duration * i / (FRAMES - 1), duration - 0.02)).toFixed(3);
      await p.evaluate(t => { window.__v3test.timeline().seek(t).play(); }, time); await p.waitForTimeout(150);
      frames.push({ label: time.toFixed(2) + ' s', buf: await p.screenshot({ style: HIDE }), data: await probe() });
    }
    await p.evaluate(() => { window.__v3test.timeline().timeScale(1).play(); });
  } else {
    for (const ms of [150, 400, 800, 1300, 2000, 3000]) {
      await p.waitForTimeout(ms - (frames.length ? [150, 400, 800, 1300, 2000, 3000][frames.length - 1] : 0));
      frames.push({ label: `+${ms} ms (no timeline)`, buf: await p.screenshot({ style: HIDE }), data: await probe() });
    }
  }
  for (const f of frames) log(`${name} ${f.label} ${JSON.stringify(f.data)}`);
  frames.forEach((f, i) => writeFile(`${OUT}/${name}-${String(i).padStart(2, '0')}.png`, f.buf));
  await sheet(name, frames, `${id} · ${phase} · ${tag}`);
  return frames;
}
const summary = [];
for (const [id, label] of OBJECTS) {
  await idle(); await p.waitForTimeout(600);
  await mark(); await p.getByRole('button', { name: label, exact: true }).click();
  const go = await capture(id, 'action');
  await p.waitForTimeout(1500);
  const heldBuf = await p.screenshot({ style: HIDE }); await writeFile(`${OUT}/obj-${id}-${tag}-held.png`, heldBuf);
  const held = await probe(); log(`obj-${id} held ${JSON.stringify(held)} actionState=${await stage('actionState')}`);
  await mark();
  const back = p.getByRole('button', { name: 'BACK TO SEAT', exact: true });
  // Held objects return with BACK TO SEAT; switches (lamp, blinds, window) toggle back with a second click.
  // Escape with nothing held would stand the visitor up.
  if (id === 'phone') await p.keyboard.press('Escape'); // the phone stage owns Escape
  else if (await back.isVisible().catch(() => false)) await back.click();
  else if (['lamp', 'blinds', 'windowOpen'].includes(id)) { await idle(); await mark(); await p.getByRole('button', { name: label, exact: true }).click(); }
  else log(`obj-${id}: no return control`);
  const ret = await capture(id, 'return');
  if (id === 'phone') await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.phoneState === 'desk', null, { timeout: 20000 }).catch(() => log('phone not back on the desk'));
  const all = [...go, { data: held }, ...ret].map(f => f.data);
  const max = f => Math.max(...all.map(f));
  summary.push({ id, skinInDeskMm: max(d => Math.max(d.L[0], d.R[0])), sleeveInDeskMm: max(d => Math.max(d.L[1], d.R[1])), heldVerts: max(d => Math.max(d.L[2], d.R[2])),
    wristL: max(d => d.L[3]), wristR: max(d => d.R[3]), torsoCm: Math.round(max(d => Math.hypot(...d.T))) });
}
await idle();
for (const s of summary) console.log(JSON.stringify(s));
console.log(JSON.stringify({ tag, errors }));
await b.close();
