// Desk fixes: flat ceiling and bare walls (orbit), awards frame pick-up, coffee
// refill after four sips, zoomed résumé reading, mug interior, and keyboard
// clicks on keys away from the hands.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); });
await p.goto(BASE + '/?sky=day'); await p.waitForTimeout(3000);
await p.screenshot({ path: 'scripts/shots/desk-orbit.png' });
await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(2500);
const stage = p.locator('.workspace-stage');
const state = v => p.waitForFunction(v => document.querySelector('.workspace-stage')?.dataset.actionState === v, v, { polling: 100, timeout: 20000 });
const button = name => p.getByRole('button', { name, exact: true });

// Keyboard: click the projected centre of keys away from the resting hands.
await p.evaluate(() => { window.__typed = []; const el = document.querySelector('.workspace-stage canvas'); });
// 5 and 11 are open keys; 32 and 43 sit under the resting hands.
for (const index of [5, 11, 32, 43]) {
  const { x, y } = await p.evaluate(i => window.__v3test.projectKey(i), index);
  await p.mouse.click(x, y); await p.waitForTimeout(300);
  console.log('keyboard click', { index, x: Math.round(x), y: Math.round(y), hitKey: await stage.evaluate(e => e.dataset.hitKey), actionState: await stage.evaluate(e => e.dataset.actionState), phone: await stage.evaluate(e => e.dataset.phoneState) });
}
await p.screenshot({ path: 'scripts/shots/desk-keyboard-after-clicks.png' });

// Awards frame.
await button('AWARD').click(); await p.waitForTimeout(700); await p.screenshot({ path: 'scripts/shots/award-reach.png' });
await state('award-reading'); await p.waitForTimeout(500); await p.screenshot({ path: 'scripts/shots/award-held.png' });
await p.keyboard.press('Escape'); await state('idle'); await p.waitForTimeout(600);
await p.screenshot({ path: 'scripts/shots/award-back.png' });

// Coffee: drink until empty, then the button offers a refill.
for (let i = 0; i < 4; i++) { await button('COFFEE').click(); await state('idle'); await p.waitForTimeout(400); }
assert.equal(await stage.evaluate(e => e.dataset.coffeeLevel), '0');
await p.screenshot({ path: 'scripts/shots/mug-empty.png' });
await button('REFILL COFFEE').click(); await state('idle');
assert.equal(await stage.evaluate(e => e.dataset.coffeeLevel), '1');
assert.equal(await button('COFFEE').count(), 1, 'label returns to COFFEE');
console.log('PASS coffee refill');

// Résumé zoomed in.
await button('RESUME').click(); await state('resume-reading'); await p.waitForTimeout(500);
await p.screenshot({ path: 'scripts/shots/resume-read-default.png' });
await p.mouse.move(720, 450);
for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(60); }
await p.mouse.move(720, 250); await p.waitForTimeout(400);
await p.screenshot({ path: 'scripts/shots/resume-read-zoomed.png' });
const top = await p.evaluate(() => { const el = document.elementFromPoint(720, 120); return el ? `${el.tagName}.${el.className}` : null; });
console.log('element at top centre while reading', top);
await p.keyboard.press('Escape'); await state('idle');
console.log('errors', errors);
await b.close();
