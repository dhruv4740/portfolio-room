// Focused acceptance checks for the overview launchpad and the mobile-project
// stage. This intentionally uses one browser page and one preview origin: the
// phone is a persistent component and these checks cover its room -> stage ->
// room lifecycle rather than booting a fresh page for every assertion.
//
// Usage: node scripts/verify-studio.mjs
//        BASE=http://localhost:4173 node scripts/verify-studio.mjs

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = 'scripts/shots';
mkdirSync(SHOTS, { recursive: true });

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  writeFileSync(`${SHOTS}/studio-results.json`, JSON.stringify(results, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitFor(page, fn, arg, timeout = 8_000) {
  return page.waitForFunction(fn, arg, { timeout, polling: 100 })
    .then(() => true)
    .catch(() => false);
}

async function phoneMetrics(page) {
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
    } else if (transform.startsWith('matrix3d(')) {
      const values = transform.slice(9, -1).split(',').map(Number);
      sx = Math.hypot(values[0] || 0, values[1] || 0, values[2] || 0);
      sy = Math.hypot(values[4] || 0, values[5] || 0, values[6] || 0);
    }
    const zoom = style.zoom === 'normal' ? 1 : Number.parseFloat(style.zoom || '1');
    const label = el.querySelector('.ps-label');
    return {
      mode: el.closest('[data-phone-presentation]')?.dataset.phonePresentation || '',
      transform,
      zoom: Number.isFinite(zoom) ? zoom : 1,
      sx,
      sy,
      width: rect.width,
      height: rect.height,
      labelFontPx: label ? Number.parseFloat(getComputedStyle(label).fontSize) : 0,
    };
  });
}

function pinScan(page) {
  return page.addInitScript(() => {
    localStorage.setItem('v3:test', '1');
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:perf-tier', 'low');
    localStorage.removeItem('v3:focuslock');
    sessionStorage.setItem('v3:arrival-seen', '1');
    sessionStorage.setItem('v3:controls', 'closed');
  });
}

async function waitPhoneState(page, state, timeout = 8_000) {
  return waitFor(page,
    (expected) => document.querySelector('.workspace-stage')?.dataset.phoneState === expected,
    state,
    timeout);
}

async function openObjects(page) {
  const toggle = page.locator('.seat-exit-toggle');
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  return toggle;
}

const browser = await chromium.launch(process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await pinScan(page);

try {
  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
  const overview = page.locator('[data-testid="room-overview"]');
  const overviewReady = await overview.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  record('overview: launchpad mounts', overviewReady);

  const routes = await overview.locator('[data-launchpad-action]').evaluateAll((els) =>
    els.map((el) => ({ action: el.dataset.launchpadAction, text: el.innerText.trim(), disabled: el.disabled }))
  ).catch(() => []);
  const expectedRoutes = ['desktop-projects', 'mobile-projects', 'explore-room'];
  const routesPresent = expectedRoutes.every((action) => routes.some((item) => item.action === action && item.text && !item.disabled));
  record('overview: desktop, mobile, and explore routes are direct actions', routesPresent,
    routesPresent ? expectedRoutes.join(', ') : JSON.stringify(routes));

  // Mobile Projects opens the stage directly from the overview.
  await page.locator('[data-launchpad-action="mobile-projects"]').click();
  const mobileZoomed = await waitFor(page,
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed'
      && document.querySelector('.phone-presentation--stage[data-phone-mode="stage"]'),
    undefined,
    12_000);
  record('mobile: overview route reaches the zoomed phone stage', mobileZoomed,
    mobileZoomed ? 'zoomed + stage' : `phone=${await page.locator('.workspace-stage').getAttribute('data-phone-state')}`);

  const stage = page.locator('.phone-presentation--stage[data-phone-mode="stage"]');
  const stageVisible = await stage.isVisible().catch(() => false);
  record('mobile: stage presentation is visible', stageVisible,
    stageVisible ? 'visible' : 'stage presentation missing');
  record('mobile: stage uses the stage phone surface', await stage.locator('.phone-screen--stage').count() === 1,
    'phone-screen--stage');
  if (stageVisible) {
    await page.waitForFunction(() => !document.querySelector('.phone-stage-flip'), null, { timeout: 3_000 }).catch(() => {});
    await page.waitForTimeout(60);
  }
  const metrics = stageVisible ? await phoneMetrics(page).catch(() => null) : null;
  const readable = !!metrics
    && metrics.mode === 'stage'
    && (metrics.transform === 'none' || (metrics.sx >= 0.999 && metrics.sy >= 0.999))
    && metrics.zoom >= 0.999
    && metrics.width >= 280
    && metrics.labelFontPx >= 13;
  record('mobile: stage uses readable CSS without sub-1 scaling', readable,
    metrics ? JSON.stringify(metrics) : 'phone metrics unavailable');
  record('mobile: stage chrome exposes room exit', await stage.locator('[data-phone-stage-control="exit"]').count() === 1,
    'Back to room control');

  // Escape is owned by the phone stage first: it closes FocusLock back to the
  // phone home while keeping the stage and phone state alive.
  const screen = stage.locator('.phone-screen');
  await screen.locator('[aria-label="Open FocusLock"]').click();
  const focusLockOpen = await waitFor(page,
    () => document.querySelector('.phone-screen')?.dataset.app === 'focuslock',
    undefined);
  record('mobile: FocusLock opens inside the stage', focusLockOpen,
    focusLockOpen ? 'focuslock' : 'app did not open');
  const focusLockBeat = focusLockOpen
    && await page.locator('.workspace-stage').getAttribute('data-phone-state') === 'focuslock';
  record('mobile: stage retains FocusLock phone state', focusLockBeat,
    focusLockBeat ? 'phoneState=focuslock' : `phoneState=${await page.locator('.workspace-stage').getAttribute('data-phone-state')}`);
  if (focusLockOpen) {
    await screen.locator('[data-tab="settings"]').click();
    const settingsSelected = await waitFor(page,
      () => document.querySelector('.phone-screen')?.dataset.flTab === 'settings',
      undefined);
    record('mobile: app navigation state is retained in stage', settingsSelected,
      settingsSelected ? 'settings tab' : 'settings tab did not activate');
    await screen.press('Escape');
    const appEscape = await waitFor(page,
      () => document.querySelector('.phone-screen')?.dataset.app === 'home'
        && document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed',
      undefined);
    record('mobile: nested Escape returns FocusLock to phone home', appEscape,
      appEscape ? 'stage remains open' : 'stage Escape closed the wrong level');
  }

  // The stage exit must leave the held-phone state cleanly and return to the
  // overview when Mobile Projects was launched from the overview.
  await stage.locator('[data-phone-stage-control="exit"]').click();
  const overviewReturned = await waitFor(page,
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'desk'
      && document.querySelector('.scan-root')?.dataset.entranceState === 'room'
      && document.querySelector('.scan-root')?.dataset.overview === 'true',
    undefined,
    10_000);
  record('mobile: stage exit returns to overview', overviewReturned,
    overviewReturned ? 'desk + overview' : `phone=${await page.locator('.workspace-stage').getAttribute('data-phone-state')}`);

  // Enter the room and verify the renamed Objects menu. Handle either initial
  // state because the test flag can leave the menu open for harnesses.
  await page.locator('[data-launchpad-action="explore-room"]').click();
  const seated = await waitFor(page,
    () => document.querySelector('.scan-root')?.dataset.seated === 'true'
      && document.querySelector('.scan-root')?.dataset.overview === 'false',
    undefined);
  record('room: Explore route enters the seat', seated, seated ? 'seated' : 'not seated');
  const toggle = page.locator('.seat-exit-toggle');
  const toggleBefore = await toggle.innerText().catch(() => '');
  record('room: Objects replaces Controls', /^OBJECTS\s/.test(toggleBefore) && !/CONTROLS/i.test(toggleBefore), toggleBefore || 'toggle missing');
  await openObjects(page);
  const objectsOpen = await page.locator('.seat-exit').getAttribute('data-open');
  record('room: Objects menu opens', objectsOpen === 'true' && await page.getByRole('button', { name: 'PHONE', exact: true }).count() === 1,
    objectsOpen === 'true' ? 'phone action visible' : `data-open=${objectsOpen}`);

  // Cancel several phone pickups while the camera is still moving. A failed
  // cancellation leaves phoneInHand/activeId stuck and makes the next click
  // impossible, so repeat it before testing resize and persistence.
  for (let i = 0; i < 2; i += 1) {
    await page.getByRole('button', { name: 'PHONE', exact: true }).click();
    await page.keyboard.press('Escape');
    const cancelled = await waitFor(page,
      () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'desk'
        && document.querySelector('.scan-root')?.dataset.entranceState === 'room',
      undefined,
      8_000);
    record(`room: phone pickup cancel ${i + 1} returns to desk`, cancelled,
      cancelled ? 'desk' : `phone=${await page.locator('.workspace-stage').getAttribute('data-phone-state')}`);
    if (!cancelled) break;
    // The Escape event reaches both the stage and Scan listeners; Scan clears
    // the selected phone anchor while the stage returns it to the desk. Keep
    // the seat and reopen Objects only if the menu is currently collapsed.
    await openObjects(page);
  }

  // The menu is collapsed after each cancel; reopen it and test that viewport
  // changes do not reapply the projected affine transform to stage mode.
  await openObjects(page);
  await page.getByRole('button', { name: 'PHONE', exact: true }).click();
  const resizedPhone = await waitFor(page,
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed'
      && document.querySelector('.phone-presentation--stage[data-phone-mode="stage"]'),
    undefined,
    12_000);
  record('room: phone reaches stage after repeated cancels', resizedPhone,
    resizedPhone ? 'zoomed + stage' : 'phone did not settle');
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(180);
    const afterResize = await phoneMetrics(page).catch(() => null);
    const resizeKeepsStage = !!afterResize
      && afterResize.mode === 'stage'
      && (afterResize.transform === 'none' || (afterResize.sx >= 0.999 && afterResize.sy >= 0.999))
      && afterResize.zoom >= 0.999
      && afterResize.width >= 280;
    record(`room: phone stage survives resize ${viewport.width}x${viewport.height}`, resizeKeepsStage,
      afterResize ? JSON.stringify(afterResize) : 'phone metrics unavailable');
  }

  // App state must survive leaving and picking the phone up again. Settings is
  // a visible state marker that is independent of the animation timeline.
  const stageScreen = page.locator('.phone-presentation--stage[data-phone-mode="stage"] .phone-screen--stage');
  if (await stageScreen.count()) {
    await stageScreen.press('Escape');
    await waitPhoneState(page, 'desk', 10_000);
    await page.waitForTimeout(300);
  }
  const toggleAfterReturn = page.locator('.seat-exit-toggle');
  if ((await toggleAfterReturn.getAttribute('aria-expanded')) !== 'true') await toggleAfterReturn.click();
  await page.getByRole('button', { name: 'PHONE', exact: true }).click();
  const reopened = await waitFor(page,
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed'
      && document.querySelector('.phone-screen')?.dataset.app === 'home',
    undefined,
    12_000);
  const persistedTab = reopened && await page.locator('.phone-screen').getAttribute('data-fl-tab') === 'settings';
  record('mobile: phone app state survives a room round trip', persistedTab,
    reopened ? `tab=${await page.locator('.phone-screen').getAttribute('data-fl-tab')}` : 'phone did not reopen');
  await page.keyboard.press('Escape');
  await waitPhoneState(page, 'desk', 10_000);
} finally {
  record('surface: no console or page errors', errors.length === 0,
    errors.slice(0, 4).join(' | ') || 'clean');
  await ctx.close();
  await browser.close();
}

const failed = results.filter((item) => !item.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((item) => `  - ${item.name}: ${item.detail}`).join('\n'));
  process.exit(1);
}
