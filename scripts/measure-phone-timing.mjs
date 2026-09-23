// Wall-clock phone pick-up vs put-down on the real GPU, first and repeat visit:
// click → phoneState 'zoomed' (pick-up incl. zoom) and Escape → 'desk' (put-down incl. zoom-out).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
await p.addInitScript(() => { localStorage.setItem('v3:test','1'); localStorage.setItem('v3:surface-override','scan'); localStorage.setItem('v3:seen-intro','1'); sessionStorage.setItem('v3:arrival-seen','1'); sessionStorage.setItem('v3:controls','open'); });
await p.goto(BASE + '/?sky=day');
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 90000 });
await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
// Timestamps are taken in the page on every phoneState change, so Playwright polling adds no error.
await p.evaluate(() => { window.__phoneLog = []; const el = document.querySelector('.workspace-stage');
  new MutationObserver(() => window.__phoneLog.push([el.dataset.phoneState, performance.now()])).observe(el, { attributes: true, attributeFilter: ['data-phone-state'] }); });
const until = v => p.waitForFunction(v => document.querySelector('.workspace-stage')?.dataset.phoneState === v, v, { timeout: 30000 });
const rows = [];
for (const visit of ['first', 'repeat']) {
  const t0 = await p.evaluate(() => performance.now()); await p.getByRole('button', { name: 'PHONE', exact: true }).click(); await until('zoomed');
  await p.waitForTimeout(800);
  const t1 = await p.evaluate(() => performance.now()); await p.keyboard.press('Escape'); await until('desk'); await p.waitForTimeout(300);
  const log = await p.evaluate(() => window.__phoneLog.splice(0));
  const at = (s, from) => { const e = log.find(([k, t]) => k === s && t >= from); return e ? Math.round(e[1] - from) : null; };
  rows.push({ visit, pickupMs: at('zoomed', t0), putdownMs: at('desk', t1), beats: log.map(([k, t]) => `${k}@${Math.round(t - t0)}`).join(' ') });
  await p.waitForTimeout(1200);
}
console.log(JSON.stringify(rows, null, 1));
await b.close();
