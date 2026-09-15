// Typing: fingertip height against the keycap top (1.2625) at rest and at the
// bottom of a key press, plus a screenshot mid-press.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); });
await p.goto(BASE); await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(2500);
const tips = () => p.evaluate(() => window.__v3test.fingerTips().map(h => h.map(t => +t[1].toFixed(4))));
console.log('rest tip y [left, right]', await tips());
await p.locator('.workspace-stage canvas').focus();
for (const key of ['f', 'j', 'a', 'p']) {
  const lowest = p.evaluate(() => new Promise(res => { let min = 9; const t0 = performance.now(); const step = () => { for (const h of window.__v3test.fingerTips()) for (const t of h) min = Math.min(min, t[1]); if (performance.now() - t0 < 1500) requestAnimationFrame(step); else res(+min.toFixed(4)); }; step(); }));
  await p.keyboard.press(key);
  if (key === 'j') { await p.waitForTimeout(40); await p.screenshot({ path: 'scripts/shots/typing-press.png' }); }
  console.log('key', key, 'lowest tip y during press', await lowest);
  await p.waitForTimeout(300);
}
console.log('errors', errors);
await b.close();
