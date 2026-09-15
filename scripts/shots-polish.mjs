// Polish screenshots: SIT DOWN call to action, collapsed/expanded seat controls,
// framed poster from the seat, and seated look-around at 0/90/180/270 degrees
// with the share of pure-black pixels (the void behind the room).
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); });
await p.goto(BASE + '/?sky=night'); await p.waitForTimeout(3000);
await p.screenshot({ path: 'scripts/shots/sit-cta.png' });
await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(2500);
const toggle = p.locator('.seat-exit-toggle');
assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'controls start collapsed');
assert.equal(await p.getByRole('button', { name: 'NOTEBOOK', exact: true }).count(), 0);
assert.ok(await p.getByRole('button', { name: 'STAND UP / ESC' }).isVisible(), 'stand up visible when collapsed');
assert.equal(await p.locator('.scan-head').evaluate(e => getComputedStyle(e).opacity), '0', 'masthead hidden while seated');
await p.screenshot({ path: 'scripts/shots/controls-collapsed.png' });
await toggle.click(); await p.waitForTimeout(200);
assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
assert.equal(await p.evaluate(() => sessionStorage.getItem('v3:controls')), 'open');
await p.screenshot({ path: 'scripts/shots/controls-expanded.png' });
await toggle.click(); await p.waitForTimeout(200);
const canvas = await p.locator('.workspace-stage canvas').boundingBox();
// Start drags left of centre so no marker button swallows the pointer.
const cx = canvas.x + canvas.width / 2, cy = canvas.y + canvas.height * 0.62;
async function look(dx, dy = 0) {
  await p.mouse.move(cx, cy); await p.mouse.down();
  for (let i = 1; i <= 12; i++) { await p.mouse.move(cx + dx * i / 12, cy + dy * i / 12); await p.waitForTimeout(30); }
  await p.mouse.up(); await p.waitForTimeout(700);
}
const blackShare = async path => {
  const buf = await p.screenshot({ path });
  return p.evaluate(async src => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 12) n++;
    return +(n / (d.length / 4) * 100).toFixed(2);
  }, buf.toString('base64'));
};
await look(-230, -130); await p.screenshot({ path: 'scripts/shots/poster-seated.png' }); await look(230, 130);
const results = {};
for (const deg of [0, 90, 180, 270]) {
  results[deg] = await blackShare(`scripts/shots/look-${deg}.png`);
  await look(-314);
}
console.log('black % by yaw', results);
console.log('errors', errors);
await b.close();
