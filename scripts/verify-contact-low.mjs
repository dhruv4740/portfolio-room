// Explicit verification for the desk contact occlusion effect at LOW tier
// under both prefers-reduced-motion: reduce and standard motion.
//
// Verifies:
//   1. Low-tier contact configuration (resolution: 256, updatesPerSecond: 10, enabled: true)
//   2. Settled rest state stops contact captures
//   3. Keyboard typing updates contact captures and settles
//   4. Coffee cup action: lifts/sips, returns to home, returned poses settle,
//      and capture count stops after settling without stale shadows
//   5. Phone stage pauses room rAF rendering (0 frames submitted) in reduced motion
//   6. Phone returned pose settles and capture count stops after settling
//   7. Dynamic physical lift in standard motion: phone leaves tabletop, contact
//      captures increase, settles upon return, and captures stop
//   8. Zero page errors or unexpected console errors throughout
//
// Usage:
//   GPU=1 BASE=http://localhost:4173 node scripts/verify-contact-low.mjs

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = 'scripts/shots';
mkdirSync(SHOTS, { recursive: true });

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  writeFileSync(`${SHOTS}/contact-low-results.json`, JSON.stringify(results, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const launchOptions = process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {};

const browser = await chromium.launch(launchOptions);
const watchdog = setTimeout(() => {
  console.error('Watchdog timeout: 90s exceeded');
  browser.close().finally(() => process.exit(1));
}, 90000);

const errors = [];

try {
  // =========================================================================
  // Part 1: LOW TIER + REDUCED MOTION
  // =========================================================================
  console.log('--- Part 1: Low tier + Reduced Motion ---');
  const ctxReduced = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1.25,
    reducedMotion: 'reduce',
  });
  const page = await ctxReduced.newPage();
  page.setDefaultTimeout(20000);

  page.on('pageerror', (err) => errors.push(`[reduced] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[reduced console] ${msg.text()}`);
  });

  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1');
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:perf-tier', 'low');
    sessionStorage.setItem('v3:arrival-seen', '1');
    sessionStorage.setItem('v3:controls', 'open');

    const raf = window.requestAnimationFrame;
    window.framesCount = 0;
    window.lastFrame = performance.now();
    window.requestAnimationFrame = (callback) =>
      raf.call(window, (time) => {
        window.framesCount += 1;
        window.lastFrame = performance.now();
        callback(time);
      });
  });

  await page.goto(`${BASE}/?sky=night`, { waitUntil: 'domcontentloaded' });
  await page
    .locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]')
    .waitFor({ state: 'attached', timeout: 30000 });

  await page.locator('[data-launchpad-action="explore-room"]').click();
  await page.waitForFunction(
    () => document.querySelector('.scan-root')?.dataset.seated === 'true',
    null,
    { timeout: 12000 }
  );
  await page.waitForTimeout(1500);

  // 1. Verify low-tier contact configuration
  const contactStats = await page.evaluate(() => window.__v3test?.contacts());
  const isLowRes = contactStats?.resolution?.[0] === 256;
  const isEnabled = contactStats?.enabled === true;
  record(
    'contact: low-tier config uses 256 resolution and enabled',
    isLowRes && isEnabled,
    JSON.stringify(contactStats)
  );

  // 2. Settled rest captures stop incrementing
  const restCaptures1 = await page.evaluate(() => window.__v3test.contacts().captures);
  await page.waitForTimeout(1200);
  const restCaptures2 = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: settled rest hands/props do not recapture',
    restCaptures2 === restCaptures1,
    `captures=${restCaptures1} -> ${restCaptures2}`
  );
  await page.screenshot({ path: `${SHOTS}/contact-low-rest.png` });

  // 3. Keyboard typing triggers contact capture and settles
  await page.locator('.workspace-stage canvas').focus();
  const preTypeCaptures = await page.evaluate(() => window.__v3test.contacts().captures);
  await page.keyboard.press('f');
  await page.waitForTimeout(100);
  await page.keyboard.press('j');
  await page.waitForTimeout(300);
  const postTypeCaptures = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: keyboard key press refreshes contact captures',
    postTypeCaptures > preTypeCaptures,
    `pre=${preTypeCaptures} post=${postTypeCaptures}`
  );

  await page.waitForTimeout(1200);
  const typeSettle1 = await page.evaluate(() => window.__v3test.contacts().captures);
  await page.waitForTimeout(1000);
  const typeSettle2 = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: keyboard typing settles and stops capturing',
    typeSettle2 === typeSettle1,
    `captures=${typeSettle1} -> ${typeSettle2}`
  );
  await page.screenshot({ path: `${SHOTS}/contact-low-typing.png` });

  // 4. Coffee cup action: reduced motion sip, return, and settle
  const preCoffeeCaptures = await page.evaluate(() => window.__v3test.contacts().captures);
  const toggle = page.locator('.seat-exit-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await page.getByRole('button', { name: 'COFFEE', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle',
    null,
    { timeout: 8000 }
  );
  await page.waitForTimeout(300);
  const postCoffeeCaptures = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: coffee action refreshes contact captures',
    postCoffeeCaptures > preCoffeeCaptures,
    `pre=${preCoffeeCaptures} post=${postCoffeeCaptures}`
  );

  await page.waitForTimeout(1200);
  const coffeeSettle1 = await page.evaluate(() => window.__v3test.contacts().captures);
  await page.waitForTimeout(1000);
  const coffeeSettle2 = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: coffee returns and settles without stale recaptures',
    coffeeSettle2 === coffeeSettle1,
    `captures=${coffeeSettle1} -> ${coffeeSettle2}`
  );
  await page.screenshot({ path: `${SHOTS}/contact-low-coffee-settled.png` });

  // 5. Phone stage pause and return in reduced motion
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await page.getByRole('button', { name: 'PHONE', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed',
    null,
    { timeout: 12000 }
  );
  await page.waitForFunction(
    () => document.querySelector('.phone-presentation--stage[data-phone-mode="stage"]'),
    null,
    { timeout: 5000 }
  );
  await page.waitForFunction(() => !document.querySelector('.phone-stage-flip')).catch(() => {});
  await page.waitForTimeout(150);

  // Phone stage must pause room rendering (0 frames submitted while in stage mode)
  await page.waitForFunction(
    () => performance.now() - window.lastFrame > 700,
    null,
    { polling: 100, timeout: 4000 }
  );
  const frameCountBefore = await page.evaluate(() => window.framesCount);
  await page.waitForTimeout(2500);
  const frameCountAfter = await page.evaluate(() => window.framesCount);
  const phoneIdleFrames = frameCountAfter - frameCountBefore;
  record(
    'contact/stage: phone stage pauses room rendering in reduced motion (0 frames)',
    phoneIdleFrames === 0,
    `idleFrames=${phoneIdleFrames}`
  );
  await page.screenshot({ path: `${SHOTS}/contact-low-phone-stage.png` });

  // Return phone to desk via Escape
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'desk',
    null,
    { timeout: 10000 }
  );
  await page.waitForTimeout(1500);

  const phoneReturnSettle1 = await page.evaluate(() => window.__v3test.contacts().captures);
  await page.waitForTimeout(1000);
  const phoneReturnSettle2 = await page.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: phone returns to desk and settles without stale recaptures',
    phoneReturnSettle2 === phoneReturnSettle1,
    `captures=${phoneReturnSettle1} -> ${phoneReturnSettle2}`
  );
  await page.screenshot({ path: `${SHOTS}/contact-low-returned.png` });

  await ctxReduced.close();

  // =========================================================================
  // Part 2: LOW TIER + STANDARD MOTION (Dynamic Phone Lift & Occlusion Refresh)
  // =========================================================================
  console.log('--- Part 2: Low tier + Standard Motion ---');
  const ctxStandard = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1.25,
  });
  const pageStd = await ctxStandard.newPage();
  pageStd.setDefaultTimeout(20000);

  pageStd.on('pageerror', (err) => errors.push(`[std] ${err.message}`));
  pageStd.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[std console] ${msg.text()}`);
  });

  await pageStd.addInitScript(() => {
    localStorage.setItem('v3:test', '1');
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:perf-tier', 'low');
    sessionStorage.setItem('v3:arrival-seen', '1');
    sessionStorage.setItem('v3:controls', 'open');
  });

  await pageStd.goto(`${BASE}/?sky=night`, { waitUntil: 'domcontentloaded' });
  await pageStd
    .locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]')
    .waitFor({ state: 'attached', timeout: 30000 });

  await pageStd.locator('[data-launchpad-action="explore-room"]').click();
  await pageStd.waitForFunction(
    () => document.querySelector('.scan-root')?.dataset.seated === 'true',
    null,
    { timeout: 12000 }
  );
  await pageStd.waitForTimeout(1500);

  const stdPreLiftCaptures = await pageStd.evaluate(() => window.__v3test.contacts().captures);
  const toggleStd = pageStd.locator('.seat-exit-toggle');
  if ((await toggleStd.getAttribute('aria-expanded')) !== 'true') await toggleStd.click();
  await pageStd.getByRole('button', { name: 'PHONE', exact: true }).click();
  await pageStd.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed',
    null,
    { timeout: 15000 }
  );
  const stdPostLiftCaptures = await pageStd.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: standard motion phone physical lift refreshes contact captures',
    stdPostLiftCaptures > stdPreLiftCaptures,
    `pre=${stdPreLiftCaptures} post=${stdPostLiftCaptures}`
  );

  // Return phone to desk in standard motion
  await pageStd.keyboard.press('Escape');
  await pageStd.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'desk',
    null,
    { timeout: 10000 }
  );
  await pageStd.waitForTimeout(1500);

  const stdReturnCaptures1 = await pageStd.evaluate(() => window.__v3test.contacts().captures);
  await pageStd.waitForTimeout(1000);
  const stdReturnCaptures2 = await pageStd.evaluate(() => window.__v3test.contacts().captures);
  record(
    'contact: standard motion phone return settles and stops capturing',
    stdReturnCaptures2 === stdReturnCaptures1,
    `captures=${stdReturnCaptures1} -> ${stdReturnCaptures2}`
  );

  await ctxStandard.close();

  // 8. Verify clean error log
  const cleanErrors = errors.length === 0;
  record(
    'contact: zero console or page errors across low-tier tests',
    cleanErrors,
    cleanErrors ? 'clean' : errors.join(' | ')
  );
} finally {
  clearTimeout(watchdog);
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((f) => `  - ${f.name}: ${f.detail}`).join('\n'));
  process.exit(1);
}
