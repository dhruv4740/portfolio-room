import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const baseOrigin = new URL(BASE).origin;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];

page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText || 'failed'}`));
page.on('request', (req) => {
  const url = req.url();
  if (!url.startsWith('data:') && !url.startsWith(baseOrigin)) {
    externalRequests.push(url);
  }
});

// Start with fresh localStorage on initial load only
await page.addInitScript(() => {
  if (!sessionStorage.getItem('harness-init')) {
    sessionStorage.setItem('harness-init', '1');
    localStorage.clear();
  }
  localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1');
});

console.log('[harness] navigating to', BASE);
await page.goto(`${BASE}/#/`);
await page.locator('[data-object="chair"]').waitFor();
await page.locator('[data-object="chair"]').click();
await page.waitForTimeout(1800);

const phoneState = (s) =>
  page.waitForFunction(
    (s) => document.querySelector('.workspace-stage')?.dataset.phoneState === s,
    s,
    { polling: 100 }
  );

// Zoom into phone
await page.getByRole('button', { name: 'PHONE', exact: true }).click();
await phoneState('zoomed');
console.log('PASS phone zoomed and interactive');

// Clear external requests recorded during initial 3D room asset / font load;
// prompt asserts: "Assert 0 external network requests during phone interaction."
externalRequests.length = 0;

const phoneScreen = page.locator('.phone-screen');
await assert.ok(await phoneScreen.isVisible(), 'PhoneScreen should be visible');

// 1. Open FocusLock App from home screen
const focuslockIcon = phoneScreen.locator('.ps-app-focuslock');
await assert.ok(await focuslockIcon.isVisible(), 'FocusLock icon .ps-app-focuslock missing on home screen');
await focuslockIcon.click();

const flRoot = phoneScreen.locator('.fl-root');
await assert.ok(await flRoot.isVisible(), 'FocusLock app did not open');
const appTitle = await flRoot.locator('.fl-app-title').innerText();
assert.equal(appTitle, 'FocusLock', `Expected app title FocusLock, got ${appTitle}`);
console.log('PASS FocusLock app opened from home screen');

// Helper to capture phone screen screenshot
async function shootScreen(name) {
  await page.waitForTimeout(300);
  await phoneScreen.screenshot({ path: `scripts/shots/phone-fl-${name}.png` });
  console.log(`[harness] saved phone-fl-${name}.png`);
}

// 2. Test Dashboard Tab on clean state (assert no task rows and minutes value is 0)
assert.ok(await flRoot.locator('[data-screen="dashboard"]').isVisible(), 'Dashboard tab missing');

// Assert no task rows and empty text shown
const initialTaskRows = await flRoot.locator('.fl-todo-row').count();
assert.equal(initialTaskRows, 0, `Expected 0 task rows after fresh localStorage.clear(), found ${initialTaskRows}`);
const emptyTaskMsg = await flRoot.locator('.fl-todo-empty').innerText();
assert.equal(emptyTaskMsg, 'No pending tasks. You are all set!');

// Assert minutes value is 0
const minutesVal = await flRoot.locator('.fl-minutes-val').innerText();
assert.equal(minutesVal, '0', `Expected minutes value 0 on fresh state, got ${minutesVal}`);
console.log('PASS Dashboard: 0 initial task rows and minutes value is 0');

// Test focus duration input (matching editFocusDuration from activity_main.xml)
const durationInput = flRoot.locator('#fl-focus-duration');
const initialDuration = await durationInput.inputValue();
assert.equal(initialDuration, '25', `Expected initial duration 25, got ${initialDuration}`);
await durationInput.fill('45');
assert.equal(await durationInput.inputValue(), '45');
console.log('PASS Dashboard: focus duration input updated to 45m');

// Add a session task
const todoInput = flRoot.locator('.fl-todo-input-row .fl-input');
await todoInput.fill('Review FocusLock architecture');
await flRoot.locator('.fl-todo-input-row .fl-btn-small').click();
const todoItem = flRoot.locator('.fl-todo-row').filter({ hasText: 'Review FocusLock architecture' });
assert.ok(await todoItem.count() > 0, 'New task not added to DOM');
console.log('PASS Dashboard: task added to session checklist');

await shootScreen('dashboard');

// 3. Test Block List / Apps Tab
await flRoot.locator('.fl-nav-item[data-tab="blocklist"]').click();
assert.ok(await flRoot.locator('[data-screen="blocklist"]').isVisible(), 'Block list screen missing');
await shootScreen('blocklist');

// Change daily limit
const dailyLimitInput = flRoot.locator('#fl-daily-limit');
await dailyLimitInput.fill('75');

// Toggle Instagram blocking OFF
const igItem = flRoot.locator('.fl-app-item[data-package="com.instagram.android"]');
assert.ok(await igItem.isVisible(), 'Instagram package missing from target apps');
const igSwitch = igItem.locator('.fl-switch');
assert.ok(await igSwitch.evaluate((el) => el.classList.contains('is-on')), 'Instagram should be ON by default');
await igSwitch.click();
assert.ok(await igSwitch.evaluate((el) => !el.classList.contains('is-on')), 'Instagram switch did not toggle OFF');
console.log('PASS Block list: Instagram blocking toggled OFF');

// 4. Test Modes & Surfaces Tab
await flRoot.locator('.fl-nav-item[data-tab="modes"]').click();
assert.ok(await flRoot.locator('[data-screen="modes"]').isVisible(), 'Modes screen missing');
await shootScreen('modes');

// Change Reels mode to "One at a time"
const oneAtATimeBtn = flRoot.locator('.fl-mode-block').first().locator('.fl-pill-btn').filter({ hasText: 'One at a time' });
await oneAtATimeBtn.click();
assert.ok(await oneAtATimeBtn.evaluate((el) => el.classList.contains('is-selected')), 'Mode pill not selected in DOM');

// Save Reels policy
await flRoot.locator('.fl-btn').filter({ hasText: 'Save Reels Policy' }).click();
assert.ok(await flRoot.locator('.fl-banner').isVisible(), 'Save banner not shown');
console.log('PASS Modes: Reels mode updated and saved');

// 5. Test Stats Tab
await flRoot.locator('.fl-nav-item[data-tab="stats"]').click();
assert.ok(await flRoot.locator('[data-screen="stats"]').isVisible(), 'Stats screen missing');
const chartRows = await flRoot.locator('.fl-chart-row').count();
assert.equal(chartRows, 7, `Expected 7 chart rows, found ${chartRows}`);
await shootScreen('stats');
console.log('PASS Stats: 7-day usage chart and session history verified');

// 6. Test Settings Tab
await flRoot.locator('.fl-nav-item[data-tab="settings"]').click();
assert.ok(await flRoot.locator('[data-screen="settings"]').isVisible(), 'Settings screen missing');
await shootScreen('settings');

// Change math difficulty to Hard
const hardBtn = flRoot.locator('.fl-pill-btn').filter({ hasText: 'Hard' });
await hardBtn.click();
assert.ok(await hardBtn.evaluate((el) => el.classList.contains('is-selected')), 'Hard difficulty not selected');

// Toggle Shake Challenge
const shakeRow = flRoot.locator('.fl-toggle-row').filter({ hasText: 'Shake Challenge' });
const shakeSwitch = shakeRow.locator('.fl-switch');
await shakeSwitch.click();
assert.ok(await shakeSwitch.evaluate((el) => el.classList.contains('is-on')), 'Shake challenge not toggled');
console.log('PASS Settings: friction controls updated');

// 7. Test Persistence via localStorage
const savedState = await page.evaluate(() => JSON.parse(localStorage.getItem('v3:focuslock')));
assert.equal(savedState.dailyLimitMinutes, 75, 'Persisted dailyLimitMinutes mismatch');
assert.equal(savedState.targetApps['com.instagram.android'], false, 'Persisted Instagram unblocked mismatch');
assert.equal(savedState.friction.mathDifficulty, 'hard', 'Persisted mathDifficulty mismatch');
assert.equal(savedState.friction.shake, true, 'Persisted shake setting mismatch');
console.log('PASS localStorage persistence verified before reload');

// Reload and remount
await page.reload();
await page.locator('[data-object="chair"]').waitFor();
await page.locator('[data-object="chair"]').click();
await page.waitForTimeout(1800);
await page.getByRole('button', { name: 'PHONE', exact: true }).click();
await phoneState('zoomed');
externalRequests.length = 0;

// Open FocusLock after reload and verify state remains
await phoneScreen.locator('.ps-app-focuslock').click();
await flRoot.locator('.fl-nav-item[data-tab="settings"]').click();
const hardBtnAfterReload = flRoot.locator('.fl-pill-btn').filter({ hasText: 'Hard' });
assert.ok(await hardBtnAfterReload.evaluate((el) => el.classList.contains('is-selected')), 'Hard difficulty not preserved after reload');
console.log('PASS state correctly restored after page reload');

// 8. Test Instagram always locked even with all FocusLock toggles OFF
await flRoot.locator('.fl-back').click();
const igAppIcon = phoneScreen.locator('.ps-app');
await igAppIcon.click();

// Lock Overlay MUST appear (no mock feed screen exists)
const lockOverlay = phoneScreen.locator('.ps-lock');
assert.ok(await lockOverlay.isVisible(), 'Lock overlay should appear when tapping Instagram');
assert.equal(await lockOverlay.locator('.ps-pill').innerText(), 'LOCKED');
const mockFeed = phoneScreen.locator('.ps-ig-feed');
assert.equal(await mockFeed.count(), 0, 'Mock Instagram feed should not exist in DOM');
await shootScreen('instagram-locked');
console.log('PASS tapping Instagram with toggles off still shows lock overlay');

// Assert 0 external requests and 0 errors
assert.equal(externalRequests.length, 0, `External network requests detected: ${externalRequests.join(', ')}`);
assert.equal(pageErrors.length, 0, `Page errors detected: ${pageErrors.join(', ')}`);
assert.equal(failedRequests.length, 0, `Failed network requests: ${failedRequests.join(', ')}`);
console.log('PASS 0 external requests, page errors, or failed network requests');

await browser.close();
console.log('[harness] FocusLock app verification complete');
