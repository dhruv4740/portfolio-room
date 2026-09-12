// ============================================================================
// v3 verification harness.
//
// Checks the claims that are easy to assert and easy to get wrong:
//   1. /work never downloads the Spark renderer (the whole point of the split)
//   2. the desktop scan actually paints a splat, not just an empty canvas
//   3. the touch surface serves the deck, not the scan
//   4. no console errors on any surface
//
// Usage: npx vite preview --port 4173   then   node scripts/verify-v3.mjs
// ============================================================================

import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = 'scripts/shots';
mkdirSync(SHOTS, { recursive: true });

const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  // Persist after every assertion so an infrastructure failure still leaves
  // a durable record of the checks that completed before it.
  writeFileSync(`${SHOTS}/v3-results.json`, JSON.stringify(results, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/**
 * Measure how much of the viewport is non-background.
 *
 * Note: reading the WebGL canvas directly with drawImage returns a blank image
 * because the context is created without preserveDrawingBuffer, so the buffer
 * is already released by the time we sample it. Screenshot through the
 * compositor instead, then decode that PNG back inside the page (a normal
 * image, so this path is safe) and sample its pixels.
 */
async function screenCoverage(page) {
  const png = await page.screenshot();
  const b64 = png.toString('base64');
  return page.evaluate(async (data) => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const bmp = await createImageBitmap(blob);
    const off = document.createElement('canvas');
    off.width = 240; off.height = 150;
    const ctx = off.getContext('2d');
    ctx.drawImage(bmp, 0, 0, off.width, off.height);
    const { data: px } = ctx.getImageData(0, 0, off.width, off.height);
    let lit = 0, sum = 0;
    const total = off.width * off.height;
    for (let i = 0; i < px.length; i += 4) {
      const v = (px[i] + px[i + 1] + px[i + 2]) / 3;
      sum += v;
      // --void is #0A0A0B (~10). Anything clearly brighter is rendered content.
      if (px[i] > 26 || px[i + 1] > 26 || px[i + 2] > 28) lit++;
    }
    return { litRatio: lit / total, meanLuma: sum / total };
  }, b64);
}

// Screenshots are diagnostic artifacts, not state-machine assertions. A busy
// WebGL compositor can occasionally miss Playwright's screenshot deadline even
// while DOM interaction is healthy; keep the functional checks running and
// leave a visible warning instead of abandoning the result file.
async function saveScreenshot(page, options) {
  try {
    await page.screenshot({ timeout: 10_000, ...options });
    return true;
  } catch (err) {
    console.warn(`WARN screenshot skipped — ${err.message}`);
    return false;
  }
}

// Headless Chromium reports a SwiftShader renderer, which resolveSurface()
// correctly treats as "software GPU -> serve the static surface". That is the
// behaviour we want in production but it makes the 3D surfaces untestable, so
// the scan/deck contexts below pin the surface override explicitly, and the
// fallback itself is asserted as its own case.
const browser = await chromium.launch();

/** Pin a surface before any app code runs. */
const pinSurface = (page, surface) =>
  page.addInitScript((s) => {
    try {
      localStorage.setItem('v3:surface-override', s);
      localStorage.removeItem('v3:seen-intro');
    } catch {}
  }, surface);

// ---------------------------------------------------------------------------
// 0. capability fallback — software GPU must never get the splat surface
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const stage = await page.locator('.stage-root').count();
  const onWork = page.url().includes('/work');
  record('capability: software GPU falls back to static', stage === 0 && onWork,
    `stage=${stage} url=${page.url().split('#')[1] || '/'}`);
  await ctx.close();
}

// ---------------------------------------------------------------------------
// 1. /work — the fast path
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/#/work`, { waitUntil: 'networkidle' });
  await saveScreenshot(page, { path: `${SHOTS}/v3-work.png`, fullPage: true });

  const pulledSpark = requests.filter((u) => /spark/i.test(u));
  const pulledThree = requests.filter((u) => /\/three-|\/assets\/three/i.test(u));
  const pulledSplat = requests.filter((u) => /\.splat|\.ply|\.spz/i.test(u));

  record('work: does not download Spark', pulledSpark.length === 0,
    pulledSpark.length ? pulledSpark.join(', ') : 'no spark chunk requested');
  record('work: does not download three', pulledThree.length === 0,
    pulledThree.length ? pulledThree.join(', ') : 'no three chunk requested');
  record('work: does not download the capture', pulledSplat.length === 0,
    pulledSplat.length ? pulledSplat.join(', ') : 'no splat requested');

  const jsBytes = await page.evaluate(() =>
    performance.getEntriesByType('resource')
      .filter((r) => r.name.endsWith('.js'))
      .reduce((n, r) => n + (r.encodedBodySize || 0), 0));
  record('work: JS payload under 250KB', jsBytes < 250_000, `${(jsBytes / 1024).toFixed(1)} KB encoded`);

  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  record('work: renders identity', !!h1 && h1.trim().length > 0, h1 || 'no h1');
  record('work: no console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'clean');

  await ctx.close();
}

// ---------------------------------------------------------------------------
// 2. desktop scan
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await pinSurface(page, 'scan');

  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });

  // The capture is ~8.6MB; give the loader real time rather than a token wait.
  const canvasAppeared = await page
    .waitForSelector('.stage-root canvas', { timeout: 30_000 })
    .then(() => true).catch(() => false);
  record('scan: canvas mounts', canvasAppeared);

  await page.waitForTimeout(12_000); // decode + sort + first frames

  const cov = await screenCoverage(page);
  // The instrument chrome alone lights a few percent, so require clearly more.
  // Chrome alone measured 3.3% on an empty scene; a correctly framed capture
  // measures well above 10%. 0.08 sits between the two.
  record('scan: splat actually paints', cov.litRatio > 0.08,
    `${(cov.litRatio * 100).toFixed(1)}% lit, mean luma ${cov.meanLuma.toFixed(1)}`);

  const markers = await page.locator('.anchor-marker').count();
  record('scan: anchor markers present', markers > 0, `${markers} markers`);

  // Depth cueing sets fractional opacity, so test for "shown at all", not "1".
  const visibleMarkers = await page.locator('.anchor-marker').evaluateAll(
    (els) => els.filter((e) => parseFloat(e.style.opacity || '0') > 0.05).length);
  record('scan: markers project on screen', visibleMarkers > 0, `${visibleMarkers} visible`);

  await saveScreenshot(page, { path: `${SHOTS}/v3-scan.png` });

  // Open the first anchor and confirm the panel responds. Focus + Enter keeps
  // this deterministic while the projected marker continues moving every RAF.
  if (visibleMarkers > 0) {
    const monitorMarker = page.locator('.anchor-marker[aria-label^="Monitor"]');
    await monitorMarker.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await saveScreenshot(page, { path: `${SHOTS}/v3-scan-anchor.png` });
    const panel = await page.locator('.anchor-panel-root.is-open').count();
    record('scan: anchor opens a panel', panel > 0, `${panel} dialog(s)`);

    const enterCue = page.locator('[data-testid="enter-screen"]');
    const cueVisible = await enterCue.count();
    record('scan: monitor exposes screen entry', cueVisible === 1, `${cueVisible} entry control(s)`);

    if (cueVisible === 1) {
      await enterCue.focus();
      await page.keyboard.press('Enter');

      const prepared = await page
        .locator('.scan-root[data-entrance-state="preparing"]')
        .count()
        .then((n) => n === 1);
      record('scan: prepares embedded screen', prepared, prepared ? 'preparing' : 'state changed before sample');

      const entered = await page
        .waitForFunction(
          () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
          { timeout: 12_000 },
        )
        .then(() => true)
        .catch(() => false);
      record('scan: camera handoff reaches dhruvOS', entered,
        entered ? 'inside' : `state=${await page.locator('.scan-root').getAttribute('data-entrance-state')}`);

      if (entered) {
        await saveScreenshot(page, { path: `${SHOTS}/v3-scan-inside.png` });
        const osFrame = page.frameLocator('[data-testid="dhruv-os-frame"]');
        const osWindow = await osFrame.locator('.os-window').count().catch(() => 0);
        record('scan: embedded dhruvOS is functional', osWindow > 0, `${osWindow} window(s)`);

        // Decode one real project card, then leave and re-enter. The same
        // iframe should retain that app state rather than booting from zero.
        const firstCard = osFrame.locator('.ql-card').first();
        const cardPresent = await firstCard.count().catch(() => 0);
        let decoded = false;
        if (cardPresent) {
          await firstCard.click();
          decoded = await osFrame
            .locator('.ql-card.ql-decoded')
            .first()
            .waitFor({ timeout: 4_000 })
            .then(() => true)
            .catch(() => false);
        }
        record('scan: embedded project responds', decoded, decoded ? 'project decoded' : 'project card did not decode');

        await page.locator('[data-testid="back-to-room"]').click();
        const returned = await page
          .waitForFunction(
            () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
            { timeout: 6_000 },
          )
          .then(() => true)
          .catch(() => false);
        record('scan: back to room completes', returned,
          returned ? 'room' : `state=${await page.locator('.scan-root').getAttribute('data-entrance-state')}`);
        const returnShot = await saveScreenshot(page, { path: `${SHOTS}/v3-scan-return.png` });
        record('scan: return screenshot captured', returnShot,
          returnShot ? 'v3-scan-return.png' : 'diagnostic screenshot timed out');

        const keptFrame = await page.locator('[data-testid="dhruv-os-frame"]').count();
        record('scan: return keeps the OS instance', keptFrame === 1, `${keptFrame} iframe(s)`);
        const focusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
        record('scan: return restores marker focus', focusLabel.startsWith('Monitor'), focusLabel || 'no labelled focus');

        // Re-enter through the same keyboard path and verify the decoded card
        // survived the round trip.
        await monitorMarker.focus();
        await page.keyboard.press('Enter');
        // The room resumes its render loop during the return flight. Wait for
        // React to commit the reopened panel before looking for its cue; the
        // first entry has a 500 ms settle above, but this path follows a
        // heavier iframe round trip and can take longer on software Chromium.
        await page.locator('.anchor-panel-root.is-open').waitFor({ timeout: 10_000 });
        await page.locator('[data-testid="enter-screen"]').waitFor({ timeout: 10_000 });
        await page.locator('[data-testid="enter-screen"]').focus();
        await page.keyboard.press('Enter');
        const reentered = await page
          .waitForFunction(
            () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
            { timeout: 8_000 },
          )
          .then(() => true)
          .catch(() => false);
        const retained = reentered
          ? await osFrame.locator('.ql-card.ql-decoded').count().catch(() => 0)
          : 0;
        record('scan: repeated entry retains app state', reentered && retained > 0,
          reentered ? `${retained} decoded card(s)` : 'second entry did not reach inside');
        if (reentered) {
          await page.locator('[data-testid="back-to-room"]').click();
          await page.waitForTimeout(1_300);
        }
      }
    }
  }

  record('scan: no console errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  await ctx.close();
}

// ---------------------------------------------------------------------------
// 3. touch surface
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await pinSurface(page, 'deck');

  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const deck = await page.locator('.deck-root').count();
  const stage = await page.locator('.stage-root').count();
  record('touch: serves the deck', deck > 0, `deck=${deck}`);
  record('touch: does NOT serve the scan', stage === 0, `stage=${stage}`);

  await saveScreenshot(page, { path: `${SHOTS}/v3-deck.png` });
  record('touch: no console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'clean');
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
writeFileSync(`${SHOTS}/v3-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((f) => `  - ${f.name}: ${f.detail}`).join('\n'));
  process.exit(1);
}
