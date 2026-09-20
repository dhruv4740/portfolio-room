// ============================================================================
// v3 verification harness.
//
// Checks the claims that are easy to assert and easy to get wrong:
//   1. /work stays a small static route with no 3D dependencies or capture
//   2. the desktop scan mounts and paints the authored workspace geometry
//   3. workspace objects expose real, keyboard-operable anchor buttons
//   4. the monitor enters dhruvOS, returns, and retains app state
//   5. the touch surface serves the deck, not the desktop workspace
//   6. no console errors on any surface
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
const browser = await chromium.launch(process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {});
const fallbackBrowser = await chromium.launch();

/** Pin a surface before any app code runs. */
const pinSurface = (page, surface) =>
  page.addInitScript((s) => {
    try {
      localStorage.setItem('v3:surface-override', s);
      localStorage.removeItem('v3:seen-intro');
      sessionStorage.setItem('v3:arrival-seen', '1');
      sessionStorage.setItem('v3:controls', 'open');
    } catch {}
  }, surface);

try {
// ---------------------------------------------------------------------------
// 0. capability fallback — software GPU must never get the 3D surface
// ---------------------------------------------------------------------------
{
  const ctx = await fallbackBrowser.newContext({ viewport: { width: 1440, height: 900 } });
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
  const pulledCapture = requests.filter((u) => /\.splat|\.ply|\.spz/i.test(u));

  record('work: does not download Spark', pulledSpark.length === 0,
    pulledSpark.length ? pulledSpark.join(', ') : 'no spark chunk requested');
  record('work: does not download three', pulledThree.length === 0,
    pulledThree.length ? pulledThree.join(', ') : 'no three chunk requested');
  record('work: does not download the capture', pulledCapture.length === 0,
    pulledCapture.length ? pulledCapture.join(', ') : 'no capture requested');

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
  const requests = [];
  const errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await pinSurface(page, 'scan');

  await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });

  // The authored workspace is local geometry, so it should mount promptly and
  // never wait on a capture decoder or Spark's dynamic import.
  const canvasAppeared = await page
    .waitForSelector('.stage-root[data-scene="workspace"] canvas', { timeout: 15_000 })
    .then(() => true).catch(() => false);
  record('scan: authored workspace mounts', canvasAppeared);

  const pulledSpark = requests.filter((u) => /spark/i.test(u));
  const pulledCapture = requests.filter((u) => /\.splat|\.ply|\.spz/i.test(u));
  record('scan: does not download Spark', pulledSpark.length === 0,
    pulledSpark.length ? pulledSpark.join(', ') : 'no Spark chunk requested');
  record('scan: does not download a capture', pulledCapture.length === 0,
    pulledCapture.length ? pulledCapture.join(', ') : 'no splat asset requested');

  const cov = await screenCoverage(page);
  // The instrument chrome alone lights a few percent, so require clearly more
  // than the empty stage. The threshold keeps the old paint signal while
  // naming the thing it now verifies: modeled workspace geometry.
  record('scan: workspace actually paints', cov.litRatio > 0.08,
    `${(cov.litRatio * 100).toFixed(1)}% lit, mean luma ${cov.meanLuma.toFixed(1)}`);

  // The first room view is a launchpad. It must provide the three primary
  // routes directly, before a visitor has to sit down or discover a marker.
  const overview = page.locator('[data-testid="room-overview"]');
  const overviewVisible = await overview.waitFor({ timeout: 15_000 })
    .then(() => overview.isVisible())
    .catch(() => false);
  record('scan: room overview is visible', overviewVisible,
    overviewVisible ? 'launchpad visible' : 'room overview missing');
  const overviewActions = await overview.locator('[data-launchpad-action]').evaluateAll((els) =>
    els.filter((el) => ['desktop-projects', 'mobile-projects', 'explore-room'].includes(el.dataset.launchpadAction))
      .map((el) => ({ action: el.dataset.launchpadAction, text: el.innerText.trim(), enabled: !el.disabled }))
  ).catch(() => []);
  const directRoutes = ['desktop-projects', 'mobile-projects', 'explore-room'].every((action) =>
    overviewActions.some((item) => item.action === action && item.enabled && item.text.length > 0));
  record('scan: overview exposes desktop, mobile, and room routes', directRoutes,
    directRoutes ? overviewActions.map((item) => item.action).join(', ') : JSON.stringify(overviewActions));

  // Exercise the direct desktop route from the overview. Escape is sent to the
  // nested OS document itself so the postMessage request-leave bridge remains
  // covered in addition to the host-level Escape path below.
  let directDesktopInside = false;
  if (overviewVisible && directRoutes) {
    await page.locator('[data-launchpad-action="desktop-projects"]').click();
    directDesktopInside = await page.waitForFunction(
      () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
      { timeout: 15_000 },
    ).then(() => true).catch(() => false);
  }
  record('scan: overview desktop route reaches dhruvOS', directDesktopInside,
    directDesktopInside ? 'inside' : `state=${await page.locator('.scan-root').getAttribute('data-entrance-state')}`);
  let nestedEscapeReturned = false;
  if (directDesktopInside) {
    const directOS = page.frameLocator('[data-testid="dhruv-os-frame"]');
    nestedEscapeReturned = await directOS.locator('body').press('Escape')
      .then(async () => page.waitForFunction(
        () => document.querySelector('.scan-root')?.dataset.entranceState === 'room'
          && document.querySelector('.scan-root')?.dataset.overview === 'true',
        { timeout: 8_000 },
      ).then(() => true).catch(() => false))
      .catch(() => false);
  }
  record('scan: nested OS Escape returns to overview', nestedEscapeReturned,
    nestedEscapeReturned ? 'iframe Escape bridge' : 'nested Escape did not restore overview');

  // Continue the original room/anchor checks through the explicit Explore
  // route. This keeps the marker and modeled-mesh paths independent of the
  // overview actions above.
  if (directDesktopInside && !nestedEscapeReturned) {
    // Keep the remaining diagnostics independent from a bridge failure while
    // preserving the failed nested-Escape result above.
    await page.locator('[data-testid="back-to-room"]').click().catch(() => {});
    await page.waitForFunction(
      () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
      { timeout: 8_000 },
    ).catch(() => {});
  }
  if (await page.locator('[data-launchpad-action="explore-room"]').count()) {
    await page.locator('[data-launchpad-action="explore-room"]').click();
  }
  const seatedFromOverview = await page.waitForFunction(
    () => document.querySelector('.scan-root')?.dataset.seated === 'true'
      && document.querySelector('.scan-root')?.dataset.overview === 'false',
    { timeout: 4_000 },
  ).then(() => true).catch(() => false);
  record('scan: Explore the room seats the visitor', seatedFromOverview,
    seatedFromOverview ? 'seated' : 'overview did not transition to the seat');
  await page.waitForTimeout(1600);
  const objectsToggle = page.locator('.seat-exit-toggle');
  const objectsText = await objectsToggle.innerText().catch(() => '');
  record('scan: seated menu is named Objects', /^OBJECTS\s/.test(objectsText) && !/CONTROLS/i.test(objectsText),
    objectsText || 'Objects menu missing');
  if (await objectsToggle.getAttribute('aria-expanded') !== 'true') await objectsToggle.click();
  const expectedObjects = [
    ['monitor', 'Monitor'],
    ['notebook', 'Notebook'],
    ['window', 'Window'],
  ];
  const objectReports = await page.locator('.anchor-marker').evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute('data-object') || '',
      label: el.getAttribute('aria-label') || '',
      tag: el.tagName.toLowerCase(),
      enabled: !el.disabled,
    })));
  const objectButtons = expectedObjects.every(([id, label]) =>
    objectReports.some((item) => item.id === id && item.label.startsWith(label) && item.tag === 'button' && item.enabled));
  record('scan: workspace objects expose anchor buttons', objectButtons,
    objectButtons ? expectedObjects.map(([, label]) => label).join(', ') : JSON.stringify(objectReports));
  const labelsPresent = expectedObjects.every(([id, label]) =>
    objectReports.some((item) => item.id === id && item.label.toLowerCase().includes(label.toLowerCase())));
  record('scan: modeled anchors keep accessible labels', labelsPresent,
    labelsPresent ? expectedObjects.map(([, label]) => label).join(', ') : JSON.stringify(objectReports));

  // Depth cueing sets fractional opacity, so test for "shown at all", not "1".
  const visibleMarkers = await page.locator('.anchor-marker').evaluateAll(
    (els) => els.filter((e) => parseFloat(e.style.opacity || '0') > 0.05).length);
  record('scan: workspace anchors project on screen', visibleMarkers > 0, `${visibleMarkers} visible`);

  // First-pass visual artifact for scene iteration at the fixed 1440x900
  // viewport; keep this before the interaction checks mutate the screen.
  await saveScreenshot(page, { path: `${SHOTS}/v3-workspace.png` });
  const monitorMarker = page.locator('.anchor-marker[data-object="monitor"]').first();

  // Exercise every authored object through the same keyboard path a visitor
  // can use. This catches markers that merely look like labels but are not
  // wired to the shared anchor-selection callback.
  for (const [id, label] of expectedObjects) {
    // Monitor uses the projected marker; notebook and contact use the
    // visible Objects-menu buttons so the keyboard path remains operable even
    // when their depth-cued labels are visually collapsed.
    const marker = id === 'monitor'
      ? monitorMarker
      : page.getByRole('button', { name: id === 'notebook' ? 'NOTEBOOK' : 'CONTACT', exact: true });
    let activated = false;
    try {
      await marker.focus();
      await page.keyboard.press('Enter');
      activated = await page
        .locator(`.anchor-marker.is-active[data-object="${id}"]`)
        .waitFor({ state: 'attached', timeout: 3_000 })
        .then(() => true)
        .catch(() => false);
    } catch {}
    record(`scan: ${label.toLowerCase()} anchor activates`, activated,
      activated ? 'active' : 'button did not activate');
    if (activated) {
      // The camera flies toward the selected object. Return through the same
      // Escape path a visitor has before trying the next object, otherwise a
      // close-up can legitimately hide the other projected markers.
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () => !document.querySelector('.anchor-marker.is-active'),
        { timeout: 3_000 },
      ).catch(() => {});
      await page.waitForFunction(
        () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
        { timeout: 5_000 },
      ).catch(() => {});
      await page.waitForTimeout(id === 'notebook' ? 2400 : 1400);
    }
  }

  // Verify the modeled monitor itself is clickable, in addition to its DOM
  // marker. The marker's left edge is the projected screen center; a point a
  // little to its left lands on the display while avoiding the overlay.
  const monitorBox = await monitorMarker.boundingBox().catch(() => null);
  const canvasBox = await page.locator('.workspace-stage canvas').boundingBox().catch(() => null);
  let meshEntered = false;
  if (monitorBox && canvasBox) {
    const x = monitorBox.x - 25;
    const y = monitorBox.y + 4;
    if (x >= canvasBox.x && x <= canvasBox.x + canvasBox.width && y >= canvasBox.y && y <= canvasBox.y + canvasBox.height) {
      await page.mouse.click(x, y);
      meshEntered = await page.waitForFunction(
        () => ['preparing', 'entering', 'inside'].includes(document.querySelector('.scan-root')?.dataset.entranceState),
        { timeout: 3_000 },
      ).then(() => true).catch(() => false);
    }
  }
  record('scan: monitor mesh click starts entry', meshEntered,
    meshEntered ? 'canvas raycast entered screen flow' : 'monitor surface did not start entry');
  if (meshEntered) {
    const meshInside = await page.waitForFunction(
      () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
      { timeout: 12_000 },
    ).then(() => true).catch(() => false);
    record('scan: monitor mesh click reaches screen', meshInside,
      meshInside ? 'inside' : `state=${await page.locator('.scan-root').getAttribute('data-entrance-state')}`);
    const back = page.locator('[data-testid="back-to-room"]');
    if (await back.count()) {
      await back.click();
      await page.waitForFunction(
        () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
        { timeout: 6_000 },
      ).catch(() => {});
    }
  }

  // Open the monitor anchor and confirm the panel responds. Focus + Enter
  // keeps this deterministic while the projected marker continues moving.
  const monitorAvailable = visibleMarkers > 0 && await monitorMarker.count() === 1 && await monitorMarker.isEnabled().catch(() => false);
  if (monitorAvailable) {
    await monitorMarker.focus();
    await page.keyboard.press('Enter');
    await saveScreenshot(page, { path: `${SHOTS}/v3-scan-anchor.png` });
    // The monitor marker enters the screen directly: no side panel, no cue.
    const panel = await page.locator('.anchor-panel-root.is-open').count();
    record('scan: monitor marker opens no panel', panel === 0, `${panel} dialog(s)`);

    {

      // The mesh-click check above already loaded and readied the OS iframe,
      // so this cue click takes the WARM path: Scan.jsx reads osReady=true and
      // sets phase straight to 'entering' (or 'inside' under reduced motion),
      // never visiting 'preparing' at all (Scan.jsx ~line 89). The cold
      // preparing->entering path is exercised by the earlier mesh-click check
      // instead. Assert the warm branch here rather than the state this click
      // can no longer produce.
      const prepared = await page
        .locator('.scan-root[data-entrance-state="entering"], .scan-root[data-entrance-state="inside"]')
        .count()
        .then((n) => n === 1);
      record('scan: cue re-entry skips preparing when OS already warm', prepared,
        prepared ? 'entering/inside directly (osReady was already true)' : 'unexpected state before sample');

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
          await firstCard.locator('.ql-detail-toggle').click();
          decoded = await osFrame
            .locator('.ql-card.ql-decoded')
            .first()
            .waitFor({ timeout: 4_000 })
            .then(() => true)
            .catch(() => false);
        }
        record('scan: embedded project responds', decoded, decoded ? 'project details expanded' : 'project details did not expand');

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
          reentered ? `${retained} expanded card(s)` : 'second entry did not reach inside');

        // Exercise the OTHER exit: Escape, not the Back button. All prior
        // exits in this suite click [data-testid="back-to-room"]; this is the
        // only Escape-from-inside coverage, per the task's explicit ask for
        // "exit via Escape and via any Back affordance".
        if (reentered) {
          await page.keyboard.press('Escape');
          const escReturned = await page
            .waitForFunction(
              () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
              { timeout: 6_000 },
            )
            .then(() => true)
            .catch(() => false);
          record('scan: escape from inside returns to room', escReturned,
            escReturned ? 'room' : `state=${await page.locator('.scan-root').getAttribute('data-entrance-state')}`);
          const escFocusLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
          record('scan: escape exit restores marker focus', escFocusLabel.startsWith('Monitor'),
            escFocusLabel || 'no labelled focus');
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

} finally {
  await browser.close();
  await fallbackBrowser.close();
}

const failed = results.filter((r) => !r.pass);
writeFileSync(`${SHOTS}/v3-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((f) => `  - ${f.name}: ${f.detail}`).join('\n'));
  process.exit(1);
}
