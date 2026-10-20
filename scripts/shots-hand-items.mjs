// Frame sheets for the open hand/pose items: pen, notebook lift, forearms/desk edge, phone grip, awards.
// Seeks each action's timeline (slow crawl so the render loop stays awake), screenshots the seated view and
// logs per-hand wristDeg plus desk penetration (handsProbe: [skin mm, sleeve mm, verts, wristDeg]).
//   BASE=http://localhost:4173 node scripts/shots-hand-items.mjs   -> scripts/shots/hands/<item>-<t>.png + hands.json
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173', OUT = 'scripts/shots/hands';
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); });
await p.goto(BASE + '/#/room/explore');
await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('.room-load'), null, { timeout: 90000 }).catch(() => {}); await p.waitForTimeout(6000);
const log = [];
const probe = () => p.evaluate(() => ({ hands: window.__v3test.hands().map(h => h.wristDeg), probe: window.__v3test.handsProbe() }));
async function snap(name, t) {
  await p.waitForTimeout(250);
  const m = await probe();
  await p.screenshot({ path: `${OUT}/${name}-${t}.png` });
  log.push({ item: name, t, wristL: m.hands[0], wristR: m.hands[1], probe: m.probe });
  console.log(name, t, JSON.stringify(m));
}
const button = name => p.getByRole('button', { name: new RegExp(name, 'i') }).first();
async function frames(name, label, times, ready) {
  await p.evaluate(() => { window.__oldTl = window.__v3test.timeline(); });
  await p.evaluate(l => document.querySelector(`.anchor-marker[aria-label^="${l}"]`).click(), label);
  await p.waitForFunction(() => { const tl = window.__v3test.timeline(); return tl && tl !== window.__oldTl; }, null, { polling: 20, timeout: 8000 }).catch(() => {});
  for (const t of times) {
    await p.evaluate(t => { const tl = window.__v3test.timeline(); if (!tl) return; tl.timeScale(0.02); tl.seek(t); tl.play(); }, t);
    await snap(name, t);
  }
  await p.evaluate(() => { const tl = window.__v3test.timeline(); if (tl) { tl.timeScale(1); tl.progress(1); } });
  await p.waitForTimeout(1200);
  if (ready) await ready();
}
await snap('rest', 0);
await frames('notebook', 'Notebook', [0.4, 0.8, 1.2, 1.6]);
await p.keyboard.press('Escape'); await p.waitForTimeout(3500);
await snap('notebook-put-down', 0);
await frames('phone', 'Phone', [0.5, 0.9, 1.4]);
await p.keyboard.press('Escape'); await p.waitForTimeout(3500);
await frames('award', 'Awards', [0.5, 1.0, 1.5]);
await p.keyboard.press('Escape'); await p.waitForTimeout(3500);
await frames('pen', 'Pen', [0.5, 1.0, 1.5]);
await writeFile(`${OUT}/hands.json`, JSON.stringify(log, null, 1));
await b.close();
