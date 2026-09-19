// prefers-reduced-motion: every hand action must land in its held state at
// once, and Escape must return it, with no page errors.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {});
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open'); });
await p.goto(BASE + '/?sky=day'); await p.waitForTimeout(2000);
await p.locator('[data-testid="room-overview"]').waitFor(); await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(1500);
const data = (k, v) => p.waitForFunction(([k, v]) => document.querySelector('.workspace-stage')?.dataset[k] === v, [k, v], { polling: 50, timeout: 4000 });
const button = name => p.getByRole('button', { name, exact: true });
for (const [name, key, held, idle] of [['PEN', 'actionState', 'drawing', 'idle'], ['AWARD', 'actionState', 'award-reading', 'idle'], ['RESUME', 'actionState', 'resume-reading', 'idle'], ['COFFEE', 'actionState', 'idle', 'idle'], ['LAMP', 'actionState', 'idle', 'idle'], ['HEADPHONES', 'actionState', 'idle', 'idle'], ['NOTEBOOK', 'notebookState', 'reading', 'desk'], ['PHONE', 'phoneState', 'zoomed', 'desk']]) {
  const t0 = Date.now(); await button(name).click(); await data(key, held); const ms = Date.now() - t0;
  const hands = await p.evaluate(() => window.__v3test.hands());
  console.log(name, 'held in', ms, 'ms', 'wrist', hands.map(h => h.wristDeg).join('/'));
  if (held !== idle) { await p.keyboard.press('Escape'); await data(key, idle); }
  if (name === 'HEADPHONES') { await button('HEADPHONES').click(); await data(key, idle); }
  await p.waitForTimeout(200);
}
assert.deepEqual(errors, []);
console.log('reduced-motion hands passed');
await b.close();
