// Bounded acceptance checks for the After Hours arrival contract, asset budget,
// and static fallback. This deliberately does not duplicate the existing room,
// hand, studio, or real-project suites.
//
// Usage:
//   BASE=http://localhost:4173 node scripts/verify-after-hours.mjs
//   GPU=1 BASE=http://localhost:4173 node scripts/verify-after-hours.mjs

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = 'scripts/shots';
const INITIAL_BUDGET = 15 * 1024 * 1024;
const OPTIONAL_BUDGET = 15 * 1024 * 1024;
mkdirSync(SHOTS, { recursive: true });

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  writeFileSync(`${SHOTS}/after-hours-results.json`, JSON.stringify(results, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function launchOptions() {
  return process.env.GPU === '1'
    ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
    : {};
}

function pinScan(page, { reduced = false, skipArrival = false } = {}) {
  return page.addInitScript(({ reducedMotion, skipArrival: shouldSkipArrival }) => {
    localStorage.setItem('v3:test', '1');
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:perf-tier', 'low');
    sessionStorage.setItem('v3:controls', 'open');
    if (shouldSkipArrival) sessionStorage.setItem('v3:arrival-seen', '1');
    else sessionStorage.removeItem('v3:arrival-seen');
    if (reducedMotion) {
      // Playwright's reducedMotion context is the source of truth. This marker
      // is only useful to app-side diagnostics and does not replace the media query.
      window.__afterHoursReducedMotion = true;
    }
  }, { reducedMotion: reduced, skipArrival });
}

function visible(locator) {
  return locator.isVisible().catch(() => false);
}

async function waitFor(page, fn, arg, timeout = 10_000) {
  return page.waitForFunction(fn, arg, { timeout, polling: 50 })
    .then(() => true)
    .catch(() => false);
}

// The UI selectors are authoritative. arrivalAPI is a diagnostic bridge for
// the same state machine, when present; this keeps the harness useful while a
// scene implementation is being integrated and prevents a hidden API from
// passing without its visible cue being updated.
async function arrivalSnapshot(page) {
  return page.evaluate(() => {
    const api = window.__v3test?.arrivalAPI || window.__v3test?.arrival || window.arrivalAPI;
    let apiState = null;
    try {
      if (typeof api === 'function') apiState = api();
      else if (api?.state && typeof api.state === 'function') apiState = api.state();
      else if (api?.state && typeof api.state === 'object') apiState = api.state;
      else if (api && typeof api === 'object') apiState = api;
    } catch (error) {
      apiState = { error: String(error) };
    }
    const cue = document.querySelector('[data-testid="arrival-cue"], .arrival-cue');
    const root = document.querySelector('.scan-root');
    const cueVisible = !!cue && getComputedStyle(cue).display !== 'none'
      && getComputedStyle(cue).visibility !== 'hidden';
    return {
      cueVisible,
      cueText: cue?.textContent?.trim() || '',
      phase: root?.dataset.arrivalState || root?.dataset.arrivalPhase || '',
      api: apiState,
    };
  });
}

async function waitArrivalVisible(page, timeout = 12_000) {
  return waitFor(page, () => {
    const cue = document.querySelector('[data-testid="arrival-cue"], .arrival-cue');
    if (!cue) return false;
    const style = getComputedStyle(cue);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }, undefined, timeout);
}

async function waitArrivalSettled(page, timeout = 10_000) {
  return waitFor(page, () => {
    const cue = document.querySelector('[data-testid="arrival-cue"], .arrival-cue');
    if (cue && getComputedStyle(cue).display !== 'none' && getComputedStyle(cue).visibility !== 'hidden') return false;
    const api = window.__v3test?.arrivalAPI || window.__v3test?.arrival || window.arrivalAPI;
    try {
      const state = typeof api === 'function' ? api() : api?.state && typeof api.state === 'function' ? api.state() : api?.state || api;
      if (state?.active === true || /running|active|arriving/i.test(state?.phase || '')) return false;
    } catch {}
    const phase = document.querySelector('.scan-root')?.dataset.arrivalState
      || document.querySelector('.scan-root')?.dataset.arrivalPhase;
    return !phase || /settled|complete|idle|done/i.test(phase);
  }, undefined, timeout);
}

async function cancelArrival(page, key = 'skip') {
  const before = await arrivalSnapshot(page);
  const skip = page.locator('[data-testid="arrival-skip"], .arrival-skip');
  try {
    if (await visible(skip)) await skip.click({ timeout: 2000 });
    else await page.keyboard.press('Escape');
  } catch {
    await page.keyboard.press('Escape').catch(() => {});
  }
  const settled = await waitArrivalSettled(page);
  const exercised = before.cueVisible || before.api?.active === true || /running|active|arriving/i.test(before.api?.phase || '');
  record(`arrival: ${key} interruption settles`, exercised && settled,
    `exercised=${exercised} before=${JSON.stringify(before)} after=${JSON.stringify(await arrivalSnapshot(page))}`);
  return settled;
}

async function openObjects(page) {
  const toggle = page.locator('.seat-exit-toggle');
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}

async function runArrivalChecks(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await pinScan(page);
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    const initialActive = await waitArrivalVisible(page);
    record('arrival: first-session cue is visible', initialActive, JSON.stringify(await arrivalSnapshot(page)));
    if (initialActive) await cancelArrival(page, 'start');
    const overview = await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    record('arrival: overview remains available while scene loads', overview);

    // WORK is a direct navigation during the arrival window and must stay usable.
    await page.reload({ waitUntil: 'domcontentloaded' });
    const workArrival = await waitArrivalVisible(page);
    const workLink = page.locator('[data-testid="room-overview"] a[href*="/work"], .launchpad-links a').first();
    const workClickable = workArrival && await visible(workLink);
    if (workClickable) await workLink.click();
    const workReached = workClickable && await page.waitForURL(/#\/work|\/work/, { timeout: 8_000 }).then(() => true).catch(() => false);
    record('arrival: WORK navigation cancels loading and reaches static route', workReached,
      `active=${workArrival} url=${page.url()}`);

    // Replay uses the direct seated control, then exercises middle interruption
    // and natural completion. The end interruption is covered by the final
    // Escape just before the reported duration when the API exposes one.
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="room-overview"]').waitFor();
    await page.locator('[data-launchpad-action="explore-room"]').click();
    await waitFor(page, () => document.querySelector('.scan-root')?.dataset.seated === 'true'
      && document.querySelector('.scan-root')?.dataset.overview === 'false');
    await openObjects(page);
    const replay = page.locator('[data-testid="replay-arrival"], button', { hasText: 'REPLAY ARRIVAL' }).first();
    const replayAvailable = await replay.count() > 0 && await visible(replay);
    record('arrival: seated replay control is available', replayAvailable);
    if (replayAvailable) {
      await replay.click();
      const replayActive = await waitArrivalVisible(page);
      record('arrival: replay enters the same visible cue', replayActive, JSON.stringify(await arrivalSnapshot(page)));
      if (replayActive) {
        await page.waitForTimeout(550);
        await cancelArrival(page, 'middle');
      } else record('arrival: middle interruption starts while arrival is active', false, JSON.stringify(await arrivalSnapshot(page)));
      const returnedToOverview = await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 4_000 }).then(() => true).catch(() => false);
      record('arrival: interrupted replay returns to overview', returnedToOverview,
        `overview=${returnedToOverview} state=${await page.locator('.scan-root').getAttribute('data-overview').catch(() => '')}`);
      if (returnedToOverview) {
        await page.locator('[data-launchpad-action="explore-room"]').click();
        const reseated = await waitFor(page, () => document.querySelector('.scan-root')?.dataset.seated === 'true'
          && document.querySelector('.scan-root')?.dataset.overview === 'false');
        record('arrival: replay can be started again after interruption', reseated);
        await openObjects(page);
      }
      const replayAgain = page.locator('[data-testid="replay-arrival"], button', { hasText: 'REPLAY ARRIVAL' }).first();
      const replayAgainAvailable = returnedToOverview && await visible(replayAgain);
      record('arrival: end-interruption replay control is available', replayAgainAvailable);
      if (replayAgainAvailable) {
        await replayAgain.click();
        const activeAgain = await waitArrivalVisible(page);
        const duration = await page.evaluate(() => {
          const api = window.__v3test?.arrivalAPI || window.__v3test?.arrival;
          return Number(api?.durationMs || api?.state?.durationMs || 0);
        });
        const nearEndWait = Math.max(150, Math.min(4_800, (duration || 5_000) * 0.9));
        if (activeAgain) await page.waitForTimeout(nearEndWait);
        if (activeAgain) await cancelArrival(page, 'end');
        else record('arrival: end interruption starts while arrival is active', false, JSON.stringify(await arrivalSnapshot(page)));
      } else record('arrival: end interruption starts after replay re-entry', false, 'replay control unavailable after middle interruption');
    } else {
      record('arrival: middle interruption starts while arrival is active', false, 'seated replay control unavailable');
      record('arrival: end interruption starts after replay re-entry', false, 'seated replay control unavailable');
    }
    record('arrival: no page or console errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } finally {
    await ctx.close();
  }
}

async function runReducedMotion(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await pinScan(page, { reduced: true });
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    const overview = await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    await page.waitForTimeout(1_200);
    const initialCue = await visible(page.locator('[data-testid="arrival-cue"], .arrival-cue'));
    record('arrival: reduced motion starts settled without cue', overview && !initialCue,
      `overview=${overview} cue=${initialCue}`);
    if (overview) {
      await page.locator('[data-launchpad-action="explore-room"]').click();
      const seated = await waitFor(page, () => document.querySelector('.scan-root')?.dataset.seated === 'true'
        && document.querySelector('.scan-root')?.dataset.overview === 'false', undefined, 2_000);
      await openObjects(page);
      const replay = page.locator('[data-testid="replay-arrival"], button', { hasText: 'REPLAY ARRIVAL' }).first();
      const replayAvailable = await visible(replay);
      record('arrival: reduced motion replay control is available', replayAvailable);
      if (replayAvailable) await replay.click();
      await page.waitForTimeout(250);
      const replayCue = await visible(page.locator('[data-testid="arrival-cue"], .arrival-cue'));
      record('arrival: reduced motion replay remains settled', seated && replayAvailable && !replayCue,
        `seated=${seated} cue=${replayCue}`);
    }
    record('reduced motion: no page or console errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } finally {
    await ctx.close();
  }
}

async function readBudget(page) {
  return page.evaluate(() => {
    const manifest = window.__v3test?.assetManifest
      || window.__afterHoursAssetManifest
      || null;
    const entries = performance.getEntriesByType('resource')
      .filter((entry) => !/^(data:|blob:)/i.test(entry.name));
    const bytes = (entry) => Number(entry.transferSize || entry.encodedBodySize || 0);
    const relevant = entries.filter((entry) => {
      const pathname = new URL(entry.name).pathname;
      return /\/(assets|models|materials)\//i.test(pathname)
        && !/\/(os|apps)\//i.test(pathname);
    });
    const enhancement = relevant.filter((entry) => /\/after-hours\//i.test(new URL(entry.name).pathname));
    const core = relevant.filter((entry) => !/\/after-hours\//i.test(new URL(entry.name).pathname));
    const manifestGroups = manifest?.required && manifest?.optional
      ? {
          required: manifest.required.reduce((sum, item) => sum + Number(item.bytes || item.transferBytes || 0), 0),
          optional: manifest.optional.reduce((sum, item) => sum + Number(item.bytes || item.transferBytes || 0), 0),
        }
      : null;
    return {
      manifest,
      resourceCount: entries.length,
      coreBytes: core.reduce((sum, entry) => sum + bytes(entry), 0),
      enhancementBytes: enhancement.reduce((sum, entry) => sum + bytes(entry), 0),
      modelResources: relevant.map((entry) => ({ url: entry.name, bytes: bytes(entry) })),
      manifestGroups,
    };
  });
}

async function runAssetBudget(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await pinScan(page, { skipArrival: true });
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 });
    const readiness = await waitFor(page, () => {
      const stage = document.querySelector('.workspace-stage');
      return stage?.dataset.winterCity === 'ready'
        && stage?.dataset.roomMaterials === 'ready'
        && stage?.dataset.roomBake === 'ready';
    }, undefined, 20_000);
    const readinessState = await page.locator('.workspace-stage').evaluate((el) => ({
      city: el.dataset.winterCity, materials: el.dataset.roomMaterials, bake: el.dataset.roomBake,
    })).catch(() => ({}));
    record('assets: winter city, room materials, and bake reach ready state', readiness,
      JSON.stringify(readinessState));
    await page.waitForTimeout(200);
    const budget = await readBudget(page);
    const groups = budget.manifestGroups;
    const required = groups?.required ?? budget.coreBytes;
    const optional = groups?.optional ?? budget.enhancementBytes;
    record('assets: manifest is exposed or measurable model resources exist', !!budget.manifest || budget.modelResources.length > 0,
      budget.manifest ? 'window.__v3test.assetManifest' : `resources=${budget.modelResources.length}`);
    record('assets: required transfer is within 15MB', required <= INITIAL_BUDGET,
      `${required} bytes${groups ? ' (manifest)' : ' (resource timing estimate)'}`);
    record('assets: optional transfer is within 15MB', optional <= OPTIONAL_BUDGET,
      `${optional} bytes${groups ? ' (manifest)' : '(/after-hours/ resource timing)'}`);
    const external = requests.filter((url) => !url.startsWith(BASE)
      && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(url));
    record('assets: runtime requests stay same-origin/local', external.length === 0,
      external.slice(0, 3).join(' | ') || 'local requests only (Google font CSS/font files allowed)');
  } finally {
    await ctx.close();
  }
}

async function runAssetFallback(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/models/after-hours/**', (route) => route.abort());
  await ctx.route('**/materials/after-hours/**', (route) => route.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await pinScan(page, { skipArrival: true });
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    const overview = await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    await waitFor(page, () => {
      const state = document.querySelector('.workspace-stage')?.dataset || {};
      return [state.winterCity, state.roomMaterials, state.roomBake].every((value) => value && value !== 'loading');
    }, undefined, 8_000);
    const stageState = await page.locator('.workspace-stage').evaluate((el) => ({
      city: el.dataset.winterCity, materials: el.dataset.roomMaterials, bake: el.dataset.roomBake,
    })).catch(() => ({}));
    await page.locator('[data-launchpad-action="explore-room"]').click().catch(() => {});
    const seated = await waitFor(page, () => document.querySelector('.scan-root')?.dataset.seated === 'true'
      && document.querySelector('.seat-exit-toggle'), undefined, 8_000);
    record('assets: missing optional files retain usable scene controls', overview && seated,
      `overview=${overview} seated=${seated} state=${JSON.stringify(stageState)}`);
    record('assets: missing optional files report fallback status', /fallback/.test(Object.values(stageState).join(' ')),
      JSON.stringify(stageState));
    const unexpectedErrors = errors.filter((message) => !/Failed to load resource: net::ERR_FAILED/i.test(message));
    record('assets fallback: no unexpected page or console errors', unexpectedErrors.length === 0,
      unexpectedErrors.slice(0, 3).join(' | ') || 'only intentional aborted optional asset requests');
  } finally {
    await ctx.close();
  }
}

async function runStaticFallback(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_200);
    const stage = await page.locator('.workspace-stage').count();
    const work = /#\/work|\/work/.test(page.url());
    const three = requests.filter((url) => /three|spark|\.splat|\.ply|\.spz/i.test(url));
    record('fallback: software-capable browser reaches /work', work && stage === 0,
      `work=${work} stage=${stage} url=${page.url()}`);
    record('fallback: /work does not request 3D runtime or capture assets', three.length === 0,
      three.join(' | ') || 'no three/spark/capture requests');
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch(launchOptions());
try {
  await runArrivalChecks(browser);
  await runReducedMotion(browser);
  await runAssetBudget(browser);
  await runAssetFallback(browser);
} finally {
  await browser.close();
}

// The software fallback must use a browser without the explicit scan override;
// keep it in its own launch so the scan context cannot contaminate it.
const fallbackBrowser = await chromium.launch();
try {
  await runStaticFallback(fallbackBrowser);
} finally {
  await fallbackBrowser.close();
}

const failed = results.filter((item) => !item.pass);
writeFileSync(`${SHOTS}/after-hours-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((item) => `  - ${item.name}: ${item.detail}`).join('\n'));
  process.exit(1);
}
