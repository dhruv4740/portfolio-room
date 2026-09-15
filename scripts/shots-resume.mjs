// Frames of the résumé pick-up and put-back, plus the coffee sip for the wrist
// joint. Crawls the live timeline (a paused one does not render).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); });
await p.goto(BASE); await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(1800);
const button = name => p.getByRole('button', { name, exact: true });
const mark = () => p.evaluate(() => { window.__oldTl = window.__v3test?.timeline(); });
const state = async v => { await p.waitForFunction(v => document.querySelector('.workspace-stage')?.dataset.actionState === v, v, { polling: 100 }); await p.waitForTimeout(900); };
async function frames(name, times) {
  await p.waitForFunction(() => { const tl = window.__v3test?.timeline(); return tl && tl !== window.__oldTl; }, null, { polling: 20 });
  for (const t of times) {
    await p.evaluate(t => { const tl = window.__v3test.timeline(); tl.timeScale(0.02); tl.seek(t); tl.play(); }, t);
    await p.waitForTimeout(250);
    await p.screenshot({ path: `scripts/shots/resume-${name}-${t}.png` });
  }
  await p.evaluate(() => { const tl = window.__v3test.timeline(); tl.timeScale(1); tl.play(); });
}
await mark(); await button('RESUME').click(); await frames('open', [0.6, 1.2, 1.7, 2.5]); await state('resume-reading');
await p.screenshot({ path: 'scripts/shots/resume-held.png' });
await mark(); await p.keyboard.press('Escape'); await frames('back', [0.7, 1.5]); await state('idle');
await mark(); await button('COFFEE').click(); await frames('coffee', [2.0]);
await p.evaluate(() => { const tl = window.__v3test.timeline(); tl.timeScale(0.02); tl.seek(2.0); tl.play(); });
await p.waitForTimeout(250); await p.screenshot({ path: 'scripts/shots/resume-wrist-crop.png', clip: { x: 150, y: 450, width: 400, height: 450 } });
await p.evaluate(() => { const tl = window.__v3test.timeline(); tl.timeScale(1); tl.play(); }); await state('idle');
console.log('errors', errors);
await b.close();
