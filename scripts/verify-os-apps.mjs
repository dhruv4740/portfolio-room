import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const promoted = [
  { id: 'corrupted', title: 'Corrupted', mode: 'minimize' },
  { id: 'fluid', title: 'Flux', mode: 'close' },
  { id: 'kinetic', title: 'Kinetic', mode: 'close' },
  { id: 'tear', title: 'Reality Tear', mode: 'close' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const pageErrors = [];
const failedRequests = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || 'failed'}`));

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
  await page.waitForTimeout(350);
  const running = await page.evaluate(() => window.__rafCallbacks);
  await page.waitForTimeout(250);
  assert.ok((await page.evaluate(() => window.__rafCallbacks)) > running, `${app.title}: rAF did not start while visible`);

  if (app.mode === 'minimize') {
    await win.locator('[data-minimize]').click();
    const before = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} minimize`, before);

    await page.locator('.taskbar-btn').filter({ hasText: app.title }).click();
    await page.waitForTimeout(150);
    await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'leave' }, location.origin));
    const leftBefore = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} parent leave`, leftBefore);
    await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'enter' }, location.origin));
    await page.waitForTimeout(100);
    await win.locator('[data-close]').click();
  } else {
    await win.locator('[data-close]').click();
    const before = await page.evaluate(() => window.__rafCallbacks);
    await stopDelta(`${app.title} close`, before);
  }
}

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

assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
console.log('PASS no page errors or failed network requests');
console.log(`[harness] ${promoted.length}/4 promoted apps verified`);
await browser.close();
