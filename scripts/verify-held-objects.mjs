// Held-object lifecycle checks. The phone is now a persistent stage surface;
// this keeps the original idle and FocusLock assertions while checking that a
// room pickup uses readable CSS and returns cleanly before the notebook path.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  localStorage.setItem('v3:test', '1');
  localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1');
  localStorage.setItem('v3:perf-tier', 'low');
  sessionStorage.setItem('v3:controls', 'open');
  localStorage.setItem('v3:focuslock', JSON.stringify({ hardBlockAfterLimit: true }));
  const raf = window.requestAnimationFrame;
  window.framesCount = 0;
  window.lastFrame = performance.now();
  window.requestAnimationFrame = (callback) => raf.call(window, (time) => {
    window.framesCount += 1;
    window.lastFrame = performance.now();
    callback(time);
  });
});

const waitState = (key, value, timeout = 10_000) => page.waitForFunction(
  ([expectedKey, expectedValue]) => document.querySelector('.workspace-stage')?.dataset[expectedKey] === expectedValue,
  [key, value],
  { polling: 100, timeout },
);
const phoneState = (value, timeout = 10_000) => waitState('phoneState', value, timeout);
const button = (name) => page.getByRole('button', { name, exact: true });

function openObjects() {
  return page.locator('.seat-exit-toggle').getAttribute('aria-expanded').then((expanded) => {
    if (expanded !== 'true') return page.locator('.seat-exit-toggle').click();
    return undefined;
  });
}

async function phoneMetrics() {
  return page.locator('.phone-screen').evaluate((el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const transform = style.transform;
    let sx = 1;
    let sy = 1;
    if (transform.startsWith('matrix(')) {
      const values = transform.slice(7, -1).split(',').map(Number);
      sx = Math.hypot(values[0] || 0, values[1] || 0);
      sy = Math.hypot(values[2] || 0, values[3] || 0);
    }
    return {
      mode: el.closest('[data-phone-presentation]')?.dataset.phonePresentation || '',
      transform,
      zoom: style.zoom === 'normal' ? 1 : Number.parseFloat(style.zoom || '1'),
      sx,
      sy,
      width: rect.width,
      labelFontPx: Number.parseFloat(getComputedStyle(el.querySelector('.ps-label'))?.fontSize || '0'),
    };
  });
}

await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded' });
await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 });
await page.locator('[data-launchpad-action="explore-room"]').click();
await page.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 5_000 });
await openObjects();

await button('PHONE').click();
await phoneState('zoomed');
await page.waitForFunction(
  () => document.querySelector('.phone-presentation--stage[data-phone-mode="stage"]'),
  null,
  { timeout: 5_000 },
);
await page.waitForFunction(() => !document.querySelector('.phone-stage-flip'), null, { timeout: 3_000 }).catch(() => {});
await page.waitForTimeout(60);
await page.screenshot({ path: 'scripts/shots/phone-home-stage.png' });

const stageMetrics = await phoneMetrics();
assert.equal(stageMetrics.mode, 'stage', 'phone should use stage mode while held');
assert.ok(stageMetrics.transform === 'none' || (stageMetrics.sx >= 0.999 && stageMetrics.sy >= 0.999),
  `phone stage transform should not scale below 1: ${JSON.stringify(stageMetrics)}`);
assert.ok(stageMetrics.zoom >= 0.999, `phone stage CSS zoom should be >= 1: ${JSON.stringify(stageMetrics)}`);
assert.ok(stageMetrics.width >= 280, `phone stage should be a readable portrait viewport: ${JSON.stringify(stageMetrics)}`);
assert.ok(stageMetrics.labelFontPx >= 13, `phone labels should use stage CSS sizing: ${JSON.stringify(stageMetrics)}`);
console.log('phone stage metrics', stageMetrics);

// Once the camera and DOM handoff settle, the scene must stop submitting
// frames while the phone remains open.
await page.waitForFunction(() => performance.now() - window.lastFrame > 700, null, { polling: 100, timeout: 4_000 });
let frameCount = await page.evaluate(() => window.framesCount);
await page.waitForTimeout(3_000);
const phoneIdle = await page.evaluate((before) => window.framesCount - before, frameCount);
assert.equal(phoneIdle, 0, `phone should be idle after stage settle, got ${phoneIdle} frames`);
console.log('phone idle', phoneIdle);

// Keep the historical FocusLock friction path. The app is still interactive
// in stage mode and should return to its home screen after a correct answer.
await page.locator('.phone-screen .ps-app').click();
await phoneState('focuslock');
await page.waitForTimeout(700);
assert.match(await page.locator('.ps-stats').innerText(), /^1 opens • 0 min spent today$/);
await page.screenshot({ path: 'scripts/shots/phone-focuslock-stage.png' });
console.log('focuslock passed');

await button('Request 5 Minute Extension').click();
const question = await page.locator('.ps-math-q').innerText();
const [a, b] = question.match(/\d+/g).map(Number);
await page.getByLabel('Answer').fill(String(a + b));
await button('Submit').click();
await page.waitForFunction(
  () => document.querySelector('.ps-status')?.textContent.startsWith('Extension granted'),
  null,
  { polling: 100, timeout: 5_000 },
);
await phoneState('zoomed');
console.log('extension passed');

// The granted-extension effect returns FocusLock to phone home before this
// check; one stage Escape then leaves the held phone for the room.
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3_000 });
await page.locator('.phone-screen').press('Escape');
const phoneReturned = await phoneState('desk', 10_000).then(() => true).catch(() => false);
if (!phoneReturned) {
  console.log('phone exit state', await page.evaluate(() => ({
    phoneState: document.querySelector('.workspace-stage')?.dataset.phoneState,
    phoneMode: document.querySelector('.phone-presentation')?.dataset.phoneMode,
    app: document.querySelector('.phone-screen')?.dataset.app,
    entrance: document.querySelector('.scan-root')?.dataset.entranceState,
    seated: document.querySelector('.scan-root')?.dataset.seated,
    overview: document.querySelector('.scan-root')?.dataset.overview,
  })));
  throw new Error('phone Escape did not return to desk');
}

if (await page.locator('[data-testid="room-overview"]').count()) {
  await page.locator('[data-launchpad-action="explore-room"]').click();
  await page.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 5_000 });
}
await openObjects();
await button('NOTEBOOK').click();
await waitState('notebookState', 'reading');
await page.screenshot({ path: 'scripts/shots/notebook-held.png' });
await page.waitForFunction(() => performance.now() - window.lastFrame > 700, null, { polling: 100, timeout: 4_000 });
frameCount = await page.evaluate(() => window.framesCount);
await page.waitForTimeout(3_000);
const notebookIdle = await page.evaluate((before) => window.framesCount - before, frameCount);
assert.equal(notebookIdle, 0, `notebook should be idle after settle, got ${notebookIdle} frames`);
console.log('notebook idle', notebookIdle);
await page.keyboard.press('Escape');
await waitState('notebookState', 'desk');
assert.deepEqual(errors, []);
console.log('notebook returned', errors);
await browser.close();
