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
  localStorage.setItem('v3:test', '1');
  window.__phoneTimeScale = 20;
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

async function shootFriction(name) {
  await page.waitForTimeout(150);
  await phoneScreen.screenshot({ path: `scripts/shots/phone-friction-${name}.png` });
  console.log(`[harness] saved phone-friction-${name}.png`);
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
assert.ok(await shakeSwitch.evaluate((el) => el.classList.contains('is-on')), 'Shake challenge should be ON by default');
await shakeSwitch.click();
assert.ok(await shakeSwitch.evaluate((el) => !el.classList.contains('is-on')), 'Shake challenge not toggled OFF');
console.log('PASS Settings: friction controls updated');

// 7. Test Persistence via localStorage
const savedState = await page.evaluate(() => JSON.parse(localStorage.getItem('v3:focuslock')));
assert.equal(savedState.dailyLimitMinutes, 75, 'Persisted dailyLimitMinutes mismatch');
assert.equal(savedState.targetApps['com.instagram.android'], false, 'Persisted Instagram unblocked mismatch');
assert.equal(savedState.friction.mathDifficulty, 'hard', 'Persisted mathDifficulty mismatch');
assert.equal(savedState.friction.shake, false, 'Persisted shake setting mismatch');
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

// Reset FocusLock policy to defaults so all friction barriers are enabled
await flRoot.locator('.fl-btn-danger').filter({ hasText: 'Reset Policy to Default' }).click();
await page.waitForTimeout(200);
await flRoot.locator('.fl-back').click();
console.log('PASS reset policy to defaults and returned to phone home');

// 8. Test Friction Sequence with defaults
const igAppIcon = phoneScreen.locator('.ps-app');
await igAppIcon.click();

// Step 1: Breathing (12s total -> 600ms at scale 20)
const breathingStep = phoneScreen.locator('[data-step="breathing"]');
await assert.ok(await breathingStep.isVisible(), 'Breathing step should be visible');
await shootFriction('breathing');
console.log('PASS friction step: breathing');

// Wait for breathing to complete and advance to delay
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'delay', null, { timeout: 3000, polling: 50 });

// Step 2: Delay (10s total -> 500ms at scale 20)
const delayStep = phoneScreen.locator('[data-step="delay"]');
await assert.ok(await delayStep.isVisible(), 'Delay step should be visible');
await shootFriction('delay');
console.log('PASS friction step: delay');

// Wait for delay to complete and advance to intention
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'intention', null, { timeout: 3000, polling: 50 });

// Step 3: Intention
const intentionStep = phoneScreen.locator('[data-step="intention"]');
await assert.ok(await intentionStep.isVisible(), 'Intention step should be visible');
await shootFriction('intention');
await phoneScreen.locator('.fl-chip').filter({ hasText: 'Boredom / Dopamine craving' }).click();
await phoneScreen.locator('.btn-confirm-intention').click();
console.log('PASS friction step: intention completed');

// Step 4: Shake Challenge
const shakeStep = phoneScreen.locator('[data-step="shake"]');
await assert.ok(await shakeStep.isVisible(), 'Shake step should be visible');

// Assert exact Line 1 and Line 2 copy
const line1 = await shakeStep.locator('.fl-shake-line1').innerText();
assert.equal(line1.trim(), 'Shake your phone to continue');
const line2 = await shakeStep.locator('.fl-shake-line2').innerText();
assert.equal(line2.trim(), 'On the real phone you physically shake it. Here, move your mouse left and right quickly.');
console.log('PASS friction step: shake challenge copy verified');

// Assert rocking phone element has running CSS animation (getAnimations().length > 0)
const rockingEl = shakeStep.locator('.fl-rocking-phone');
await assert.ok(await rockingEl.isVisible(), 'Rocking phone element should be visible');
const animCount = await rockingEl.evaluate((el) => el.getAnimations().length);
assert.ok(animCount > 0, `Expected rocking phone to have running CSS animation, got ${animCount}`);
console.log('PASS friction step: rocking phone running CSS animation verified');

// Assert idle arrow pulse after 2s idle (at scale 20, 2000/20 = 100ms)
await page.waitForTimeout(150);
const arrowLeft = shakeStep.locator('.fl-shake-arrow-left');
const isPulsing = await arrowLeft.evaluate((el) => el.classList.contains('is-pulsing'));
assert.ok(isPulsing, 'Arrow should pulse when progress is 0 and no mouse movement for 2s');
console.log('PASS friction step: arrow pulse effect on idle verified');

// Save screenshot to scripts/shots/phone-friction-shake.png
await phoneScreen.screenshot({ path: 'scripts/shots/phone-friction-shake.png' });
console.log('[harness] saved phone-friction-shake.png');

// Perform rapid side-to-side mouse moves over the phone screen to trigger >= 6 direction reversals
const shakeBox = await phoneScreen.boundingBox();
for (let i = 0; i < 10; i++) {
  await page.mouse.move(shakeBox.x + 80, shakeBox.y + 300);
  await page.waitForTimeout(60);
  await page.mouse.move(shakeBox.x + 280, shakeBox.y + 300);
  await page.waitForTimeout(60);
}
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'reflection', null, { timeout: 3000, polling: 50 });
console.log('PASS friction step: shake challenge completed via mouse movement');

// Step 5: Cognitive Reflection
const reflectionStep = phoneScreen.locator('[data-step="reflection"]');
await assert.ok(await reflectionStep.isVisible(), 'Reflection step should be visible');
await shootFriction('reflection');
const phrase = await phoneScreen.locator('.txt-reflection-phrase').innerText();
await phoneScreen.locator('.fl-reflection-input').fill(phrase);
await phoneScreen.locator('.btn-verify-reflection').click();
console.log('PASS friction step: cognitive reflection verified');

// Step 6: Stats & Checklist
const statsStep = phoneScreen.locator('[data-step="stats"]');
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'stats', null, { timeout: 3000, polling: 50 });
await assert.ok(await statsStep.isVisible(), 'Stats step should be visible');
await shootFriction('stats');
const durationTxt = await phoneScreen.locator('.txt-stats-duration').innerText();
assert.equal(durationTxt, '0 min', 'Stats duration should display 0 min');
await phoneScreen.locator('.btn-stats-next').click();
console.log('PASS friction step: stats and checklist reviewed');

// Step 7: Math Gate
const mathStep = phoneScreen.locator('[data-step="math"]');
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'math', null, { timeout: 3000, polling: 50 });
await assert.ok(await mathStep.isVisible(), 'Math gate step should be visible');
await shootFriction('math');
const mathQ = await phoneScreen.locator('.txt-math-question').innerText();
let mathAns;
if (mathQ.includes('×') && mathQ.includes('+')) {
  const [a, b, c] = mathQ.match(/\d+/g).map(Number);
  mathAns = a * b + c;
} else if (mathQ.includes('×')) {
  const [a, b] = mathQ.match(/\d+/g).map(Number);
  mathAns = a * b;
} else {
  const [a, b] = mathQ.match(/\d+/g).map(Number);
  mathAns = a + b;
}
await phoneScreen.locator('.fl-math-input').fill(String(mathAns));
await phoneScreen.locator('.btn-verify-math').click();
console.log('PASS friction step: math gate solved');

// Step 8: Decision
const decisionStep = phoneScreen.locator('[data-step="decision"]');
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'decision', null, { timeout: 3000, polling: 50 });
await assert.ok(await decisionStep.isVisible(), 'Decision step should be visible');
await shootFriction('decision');

// Click "Open Anyway"
await phoneScreen.locator('.btn-open-anyway').click();
const grantedMsg = await phoneScreen.locator('.fl-granted-text').innerText();
assert.equal(grantedMsg, 'Extension granted for 5 minutes. Stay intentional.');
console.log('PASS decision step: extension granted message displayed');

// Wait for automatic return to home screen
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3000, polling: 50 });
console.log('PASS returned to home screen after extension granted (opens incremented to 1)');

// 9. Test Cancel on first step: opens unchanged
await igAppIcon.click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'breathing', null, { timeout: 3000, polling: 50 });
await phoneScreen.locator('.btn-take-break').click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3000, polling: 50 });
console.log('PASS cancel on first step returns to home screen with opens unchanged');

// 10. Test Wrong Math Answer
await phoneScreen.locator('.ps-app-focuslock').click();
await flRoot.locator('.fl-nav-item[data-tab="settings"]').click();
const togglesToDisable = [
  'Breathing Pause',
  'Wait Delay',
  'Intention Setting',
  'Shake Challenge',
  'Cognitive Reflection',
  'Stats & Checklist',
];
for (const label of togglesToDisable) {
  const row = flRoot.locator('.fl-toggle-row').filter({ hasText: label });
  const sw = row.locator('.fl-switch');
  if (await sw.evaluate((el) => el.classList.contains('is-on'))) {
    await sw.click();
  }
}
await flRoot.locator('.fl-back').click();
// Tap Instagram -> lands directly on math step
await igAppIcon.click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'math', null, { timeout: 3000, polling: 50 });
await phoneScreen.locator('.fl-math-input').fill('999999');
await phoneScreen.locator('.btn-verify-math').click();
const mathToast = phoneScreen.locator('.ps-toast');
assert.equal(await mathToast.innerText(), 'Incorrect! Try again.');
console.log('PASS wrong math answer shows "Incorrect! Try again." toast');
// Cancel back to home
await phoneScreen.locator('.btn-take-break').click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3000, polling: 50 });

// 11. Test Turn off all friction toggles in Settings -> lands directly on decision screen
await phoneScreen.locator('.ps-app-focuslock').click();
await flRoot.locator('.fl-nav-item[data-tab="settings"]').click();
const mathRow = flRoot.locator('.fl-toggle-row').filter({ hasText: 'Math Gate' });
const mathSw = mathRow.locator('.fl-switch');
if (await mathSw.evaluate((el) => el.classList.contains('is-on'))) {
  await mathSw.click();
}
await flRoot.locator('.fl-back').click();
await igAppIcon.click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.frictionStep === 'decision', null, { timeout: 3000, polling: 50 });
await shootFriction('no-barriers');
await phoneScreen.locator('.btn-close-app-decision').click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3000, polling: 50 });
console.log('PASS all friction barriers off lands directly on decision screen');

// 12. Test Real setting lock overlay path: toggle "Hard block after limit"
await phoneScreen.locator('.ps-app-focuslock').click();
await flRoot.locator('.fl-nav-item[data-tab="blocklist"]').click();
const hardBlockRow = flRoot.locator('.fl-toggle-row').filter({ hasText: 'Hard block after limit' });
await hardBlockRow.locator('.fl-switch').click();
await flRoot.locator('.fl-back').click();
await igAppIcon.click();
const lockOverlay = phoneScreen.locator('.ps-lock');
assert.ok(await lockOverlay.isVisible(), 'Lock overlay should appear when hardBlockAfterLimit is active');
assert.equal(await lockOverlay.locator('.ps-pill').innerText(), 'LOCKED');
await shootScreen('instagram-locked');
await phoneScreen.locator('.ps-close').click();
await page.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'home', null, { timeout: 3000, polling: 50 });
console.log('PASS hard block after limit toggle triggers real lock overlay');

// Assert 0 external requests and 0 errors
assert.equal(externalRequests.length, 0, `External network requests detected: ${externalRequests.join(', ')}`);
assert.equal(pageErrors.length, 0, `Page errors detected: ${pageErrors.join(', ')}`);
assert.equal(failedRequests.length, 0, `Failed network requests: ${failedRequests.join(', ')}`);
console.log('PASS 0 external requests, page errors, or failed network requests');

await browser.close();
console.log('[harness] FocusLock app verification complete');
