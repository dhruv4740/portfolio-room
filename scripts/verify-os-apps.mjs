import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const baseOrigin = new URL(BASE).origin;

const promoted = [
  { id: 'corrupted', title: 'Corrupted', mode: 'minimize', webgl: false },
  { id: 'fluid', title: 'Flux', mode: 'close', webgl: true },
  { id: 'kinetic', title: 'Kinetic', mode: 'close', webgl: true },
  { id: 'tear', title: 'Reality Tear', mode: 'close', webgl: true },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || 'failed'}`));
page.on('request', (request) => {
  const url = request.url();
  if (!url.startsWith('data:') && !url.startsWith(baseOrigin)) {
    externalRequests.push(url);
  }
});

await page.addInitScript(() => {
  const nativeRaf = window.requestAnimationFrame.bind(window);
  window.__rafCallbacks = 0;
  window.requestAnimationFrame = (callback) => nativeRaf((time) => {
    window.__rafCallbacks += 1;
    callback(time);
  });
});

await page.goto(`${BASE}/os/embed.html?embed=1`);
await page.locator('.desk-icon').first().waitFor();
// The OS opens windows on boot; they sit over the desktop icons.
await page.waitForTimeout(800);
for (const close of await page.locator('.os-window [data-close]').all()) await close.click().catch(() => {});

const labels = await page.locator('.desk-icon .icon-label').allTextContents();
assert.equal(labels.some((label) => /^(wormhole|lab)$/i.test(label.trim())), false,
  `removed apps are still listed: ${labels.join(', ')}`);
console.log(`[harness] desktop apps: ${labels.join(', ')}`);

async function windowFor(title) {
  const win = page.locator('.os-window').filter({ hasText: title }).last();
  await win.waitFor();
  return win;
}

async function stopDelta(label, before) {
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.__rafCallbacks);
  assert.equal(after, before, `${label}: rAF continued (${before} -> ${after})`);
  console.log(`PASS ${label}: rAF stopped at ${after}`);
}

for (const app of promoted) {
  const icon = page.locator('.desk-icon').filter({ hasText: app.title }).first();
  assert.equal(await icon.count(), 1, `${app.title} desktop icon missing`);
  await icon.dblclick();
  const win = await windowFor(app.title);

  // Wait 1500ms
  await page.waitForTimeout(1500);

  // Perform interaction scaled into window's body rect
  const bodyBox = await win.locator('.win-body').boundingBox();
  assert.ok(bodyBox, `${app.title} body rect missing`);
  const scaleX = (x) => bodyBox.x + (x / 900) * bodyBox.width;
  const scaleY = (y) => bodyBox.y + (y / 640) * bodyBox.height;

  await page.mouse.move(scaleX(200), scaleY(200));
  await page.mouse.move(scaleX(700), scaleY(450), { steps: 20 });

  if (app.id === 'corrupted') {
    await win.locator('#save-header').click();
  } else if (app.id === 'fluid') {
    // Mouse move already stirred it
  } else if (app.id === 'kinetic') {
    const container = win.locator('.app-kinetic');
    const scrollHeight = await container.evaluate((el) => el.scrollHeight - el.clientHeight);
    for (let step = 1; step <= 6; step++) {
      const targetY = (scrollHeight / 6) * step;
      await container.evaluate((el, y) => { el.scrollTop = y; }, targetY);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(800);

    const titles = await container.locator('.pmeta h3').evaluateAll((els) =>
      els.map((el) => ({
        text: el.innerText.trim(),
        opacity: parseFloat(window.getComputedStyle(el).opacity),
      }))
    );
    for (const t of titles) {
      assert.ok(t.text.length > 0, `Kinetic project title is empty`);
      assert.ok(t.opacity >= 0.99, `Kinetic project "${t.text}" opacity ${t.opacity} < 0.99`);
    }
    console.log(`PASS Kinetic: all ${titles.length} project titles have opacity >= 0.99 and non-empty text`);

    const proj2Top = await container.locator('.proj').nth(1).evaluate((el) => el.offsetTop);
    await container.evaluate((el, y) => { el.scrollTop = y - 40; }, proj2Top);
    await page.waitForTimeout(500);
    await win.screenshot({ path: 'scripts/shots/port-kinetic-02.png' });
    console.log('[harness] saved port-kinetic-02.png');
  } else if (app.id === 'tear') {
    await page.mouse.move(scaleX(150), scaleY(320));
    await page.mouse.down();
    await page.mouse.move(scaleX(750), scaleY(320), { steps: 25 });
    await page.mouse.up();
  }

  await page.waitForTimeout(800);
  await win.screenshot({ path: `scripts/shots/port-${app.id}.png` });
  console.log(`[harness] saved port-${app.id}.png`);

  const running = await page.evaluate(() => window.__rafCallbacks);
  await page.waitForTimeout(250);
  assert.ok((await page.evaluate(() => window.__rafCallbacks)) > running, `${app.title}: rAF did not start while visible`);

  if (app.mode === 'minimize') {
    await win.locator('[data-minimize]').click();
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} minimize`, before);

    await page.locator('.taskbar-btn').filter({ hasText: app.title }).click();
    await page.waitForTimeout(150);
    await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'leave' }, location.origin));
    await page.waitForTimeout(400);
    const leftBefore = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} parent leave`, leftBefore);
    await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'enter' }, location.origin));
    await page.waitForTimeout(100);
    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
  } else {
    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} close`, before);
  }

  // Allow close animation to complete, then assert DOM cleanup for WebGL apps
  await page.waitForTimeout(300);
  if (app.webgl) {
    const remaining = await page.evaluate((id) => document.querySelectorAll(`.app-${id}`).length, app.id);
    assert.equal(remaining, 0, `after closing ${app.title}, .app-${app.id} still exists in DOM`);
    console.log(`PASS ${app.title}: .app-${app.id} fully removed from DOM`);
  }
}

// Assert other sketches keep animating after Kinetic closes
const fluxDeskIcon = page.locator('.desk-icon').filter({ hasText: 'Flux' }).first();
await fluxDeskIcon.dispatchEvent('dblclick');
const fluxWindow = await windowFor('Flux');
await page.waitForTimeout(500);

const kineticDeskIcon = page.locator('.desk-icon').filter({ hasText: 'Kinetic' }).first();
await kineticDeskIcon.dispatchEvent('dblclick');
const kineticWindow = await windowFor('Kinetic');
await page.waitForTimeout(500);

await kineticWindow.locator('[data-close]').click();
await page.waitForTimeout(400);

const fluxRunningBefore = await page.evaluate(() => window.__rafCallbacks);
await page.waitForTimeout(250);
const fluxRunningAfter = await page.evaluate(() => window.__rafCallbacks);
assert.ok(fluxRunningAfter > fluxRunningBefore, `Flux stopped animating after Kinetic closed (${fluxRunningBefore} -> ${fluxRunningAfter})`);
console.log('PASS other sketches keep animating after Kinetic closes');

await fluxWindow.locator('[data-close]').click();
await page.waitForTimeout(400);

const terminalIcon = page.locator('.desk-icon').filter({ hasText: 'terminal' }).first();
await terminalIcon.dblclick();
const terminal = await windowFor('terminal');
const terminalInput = terminal.locator('.term-input');
await terminalInput.fill('ls');
await terminalInput.press('Enter');
await page.waitForTimeout(100);
const terminalText = await terminal.locator('.term-output').innerText();
assert.equal(/wormhole|\blab\b/i.test(terminalText), false, `removed apps remain in terminal: ${terminalText}`);
await terminal.locator('[data-close]').click();
console.log('PASS removed apps are not launchable from desktop or terminal');

const wallpaperIcon = page.locator('.desk-icon').filter({ hasText: 'wallpaper' }).first();
await wallpaperIcon.dblclick();
const wallpaper = await windowFor('wallpaper');
const beforeWallpaper = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundColor + getComputedStyle(el).backgroundImage);
await wallpaper.locator('button[title="AMB"]').click();
await wallpaper.getByRole('button', { name: 'SET AS WALLPAPER' }).click();
await page.waitForTimeout(100);
const afterWallpaper = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundColor + getComputedStyle(el).backgroundImage);
assert.notEqual(afterWallpaper, beforeWallpaper, 'setting a wallpaper did not change the desktop');
await wallpaper.locator('[data-close]').click();
console.log('PASS set as wallpaper changes the desktop');

assert.deepEqual(externalRequests, [], `external network requests: ${externalRequests.join(' | ')}`);
assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
console.log('PASS no external requests, page errors, or failed network requests');
console.log(`[harness] ${promoted.length}/4 promoted apps verified`);
await browser.close();
