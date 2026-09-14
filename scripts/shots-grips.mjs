// Screenshots of each hand grip at fixed timeline times, for eyeballing hand
// placement. Pauses the action timeline and seeks, so frames are deterministic.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); });
await p.goto(BASE); await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(1800);
const button = name => p.getByRole('button', { name, exact: true });
const mark = () => p.evaluate(() => { window.__oldTl = window.__v3test?.timeline(); });
async function frames(name, times) {
  await p.waitForFunction(() => { const tl = window.__v3test?.timeline(); return tl && tl !== window.__oldTl; }, null, { polling: 20 });
  for (const t of times) {
    // Crawl rather than pause: a paused timeline does not keep the render loop awake.
    await p.evaluate(t => { const tl = window.__v3test.timeline(); tl.timeScale(0.02); tl.seek(t); tl.play(); }, t);
    await p.waitForTimeout(250);
    const box = await p.evaluate(() => { const T = window.__v3test; return { handL: T.boxOf('handL'), handR: T.boxOf('handR'), held: T.boxOf('held') }; });
    await p.screenshot({ path: `scripts/shots/grip-${name}-${t}.png` });
    console.log(name, t, JSON.stringify(box));
  }
  await p.evaluate(() => { const tl = window.__v3test.timeline(); tl.timeScale(1); tl.progress(1); });
  await p.waitForTimeout(400);
}
const state = async (k, v) => { await p.waitForFunction(([k, v]) => document.querySelector('.workspace-stage')?.dataset[k] === v, [k, v], { polling: 100 }); await p.waitForTimeout(900); };

await mark(); await button('COFFEE').click(); await frames('coffee', [0.6, 1.3, 2.0]); await state('actionState', 'idle');
await mark(); await button('HEADPHONES').click(); await frames('hpon', [0.7, 1.3]); await state('actionState', 'idle');
await mark(); await button('HEADPHONES').click(); await frames('hpoff', [1.0, 1.4]); await state('actionState', 'idle');
await mark(); await button('PHONE').click(); await frames('phone', [0.7, 1.4]); await state('phoneState', 'zoomed');
await mark(); await p.keyboard.press('Escape'); await p.waitForTimeout(900); await frames('phoneback', [0.8]); await state('phoneState', 'desk');
await mark(); await button('NOTEBOOK').click(); await frames('notebook', [0.65, 1.4]); await state('notebookState', 'reading');
console.log('errors', errors);
await b.close();
