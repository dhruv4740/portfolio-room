import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const baseOrigin = new URL(BASE).origin;

console.log('[suite] starting project UI verification against', BASE);

const browser = await chromium.launch(process.env.GPU === '1' ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] } : {});
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];

function attachPageListeners(p) {
  p.on('pageerror', (err) => pageErrors.push(err.message));
  p.on('requestfailed', (req) => {
    const why = req.failure()?.errorText || 'failed';
    // Closing a real-UI window removes its iframe mid-prefetch; those aborted chunk loads are not failures.
    if (why === 'net::ERR_ABORTED' && (req.url().includes('/apps/') || /fonts\.(gstatic|googleapis)\.com/.test(req.url()))) return;
    failedRequests.push(`${req.method()} ${req.url()} - ${why}`);
  });
  p.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith(baseOrigin) && !url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com') && !url.includes('api.github.com') && !url.includes('api.open-meteo.com')) {
      externalRequests.push(url);
    }
  });
}

// ============================================================================
// PART 1: Phone Apps Verification (FocusLock, Expense Tracker, BasketProof)
// ============================================================================
{
  console.log('\n--- VERIFYING PHONE APPS ---');
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  attachPageListeners(page);

  await page.addInitScript(() => {
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:test', '1');
    window.__phoneTimeScale = 20;
  });

  await page.goto(`${BASE}/#/`);
  await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15000 });
  await page.locator('[data-launchpad-action="explore-room"]').click();
  await page.waitForTimeout(1800);
  // The arrival collapses the Objects menu; expand it before using its buttons.
  const objectsToggle = page.locator('.seat-exit-toggle');
  if (await objectsToggle.getAttribute('aria-expanded') === 'false') await objectsToggle.click();

  const phoneBtn = page.getByRole('button', { name: 'PHONE', exact: true });
  await phoneBtn.waitFor({ timeout: 10000 });
  await phoneBtn.click();

  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed',
    { timeout: 10000 }
  );
  await page.locator('.phone-presentation--stage[data-phone-mode="stage"]').waitFor({ timeout: 10000 });
  console.log('PASS phone zoomed and interactive');

  const phoneScreen = page.locator('.phone-screen');
  assert.ok(await phoneScreen.isVisible(), 'PhoneScreen should be visible');

  // 1. FocusLock Phone App
  {
    console.log('\n[phone] Testing FocusLock Phone App...');
    const flIcon = phoneScreen.locator('.ps-app-focuslock');
    assert.ok(await flIcon.isVisible(), 'FocusLock icon missing');
    await flIcon.click();
    await page.waitForTimeout(400);

    const flRoot = phoneScreen.locator('.fl-root');
    assert.ok(await flRoot.isVisible(), 'FocusLock root missing');

    // Screen 1: Dashboard
    // Citation: focuslock/app/src/main/res/values/strings.xml:12
    const appTitle = await flRoot.locator('.fl-app-title').innerText();
    assert.equal(appTitle, 'FocusLock', 'FocusLock title mismatch');
    // Citation: focuslock/app/src/main/res/values/strings.xml:24
    const emptyMsg = await flRoot.locator('.fl-todo-empty').innerText();
    assert.equal(emptyMsg, 'No pending tasks. You are all set!', 'Empty tasks string mismatch');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-focuslock-dashboard.png' });
    console.log('PASS [phone:focuslock] Screen 1 (Dashboard) verified & saved');

    // Screen 2: Block list Tab
    // Citation: focuslock/app/src/main/res/values/strings.xml:58
    await flRoot.locator('.fl-nav-item[data-tab="blocklist"]').click();
    await page.waitForTimeout(300);
    assert.ok(await flRoot.locator('[data-screen="blocklist"]').isVisible(), 'Block list screen missing');
    // Citation: focuslock/app/src/main/res/values/strings.xml:62
    const igItem = flRoot.locator('.fl-app-item[data-package="com.instagram.android"]');
    assert.ok(await igItem.isVisible(), 'Instagram package missing from target apps');
    const appItemName = await igItem.locator('.fl-app-item-name').innerText();
    assert.equal(appItemName, 'Instagram', 'App item name mismatch');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-focuslock-limits.png' });
    console.log('PASS [phone:focuslock] Screen 2 (Block list) verified & saved');

    // Close back to phone home
    await flRoot.locator('.fl-back').click();
    await page.waitForTimeout(400);
  }

  // 2. Expense Tracker Phone App
  {
    console.log('\n[phone] Testing Expense Tracker Phone App...');
    const expIcon = phoneScreen.locator('.ps-app-expense');
    assert.ok(await expIcon.isVisible(), 'Expense Tracker icon missing');
    await expIcon.click();
    await page.waitForTimeout(400);

    // Screen 1: Dashboard
    // Citation: expense-tracker/src/screens/DashboardScreen.tsx:48
    const heroTitle = await phoneScreen.locator('text=Total Spent This Month').first().innerText();
    assert.equal(heroTitle, 'TOTAL SPENT THIS MONTH', 'Hero title mismatch');
    // Citation: expense-tracker/src/screens/DashboardScreen.tsx:72
    const netSavings = await phoneScreen.locator('text=Net Savings').first().innerText();
    assert.equal(netSavings, 'Net Savings', 'Net savings label mismatch');
    // Assert DEMO DATA tag
    const demoTag = await phoneScreen.locator('.ps-full-app.is-active').locator('text=DEMO DATA').first().innerText();
    assert.equal(demoTag, 'DEMO DATA', 'DEMO DATA tag missing in Expense Tracker');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-expense-dashboard.png' });
    console.log('PASS [phone:expense] Screen 1 (Dashboard) verified & saved');

    // Screen 2: Uber Splits Tab
    // Citation: expense-tracker/src/screens/UberScreen.tsx:32
    await phoneScreen.locator('nav button:has-text("Uber")').click();
    await page.waitForTimeout(300);
    // Citation: expense-tracker/src/screens/UberScreen.tsx:64
    const uberHeader = await phoneScreen.locator('text=Uber Rides & Split Calculator').first().innerText();
    assert.equal(uberHeader, 'Uber Rides & Split Calculator', 'Uber header mismatch');
    // Citation: expense-tracker/src/screens/UberScreen.tsx:88
    const rideItem = await phoneScreen.locator('text=Uber Ride — BKC to Bandra').first().innerText();
    assert.equal(rideItem, 'Uber Ride — BKC to Bandra', 'Uber ride item missing');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-expense-uber.png' });
    console.log('PASS [phone:expense] Screen 2 (Uber Splits) verified & saved');

    // Close back to phone home
    await phoneScreen.locator('.ps-full-app.is-active button[title="Close"]').click();
    await page.waitForTimeout(400);
  }

  // 3. BasketProof Phone App
  {
    console.log('\n[phone] Testing BasketProof Phone App...');
    const basketIcon = phoneScreen.locator('.ps-app-basket');
    assert.ok(await basketIcon.isVisible(), 'BasketProof icon missing');
    await basketIcon.click();
    await page.waitForTimeout(400);

    // Screen 1: Shopping List
    // Citation: comparison/android/app/src/main/java/com/basketcompare/ui/BasketCompareScreens.kt:45
    const shoppingTitle = await phoneScreen.locator('text=Shopping list').first().innerText();
    assert.equal(shoppingTitle, 'Shopping list', 'Shopping list title mismatch');
    // Citation: comparison/android/app/src/main/java/com/basketcompare/ui/BasketCompareScreens.kt:52
    const subtext = await phoneScreen.locator('text=Add the items you want to compare, then Compare.').first().innerText();
    assert.ok(subtext.includes('Nothing is picked for you'), 'Shopping list subtext mismatch');
    // Assert DEMO DATA tag
    const demoTag = await phoneScreen.locator('.ps-full-app.is-active').locator('text=DEMO DATA').first().innerText();
    assert.equal(demoTag, 'DEMO DATA', 'DEMO DATA tag missing in BasketProof');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-basket-shopping.png' });
    console.log('PASS [phone:basket] Screen 1 (Shopping List) verified & saved');

    // Screen 2: Pick Your Products / Resolution Screen
    // Citation: comparison/android/app/src/main/java/com/basketcompare/ui/BasketCompareScreens.kt:133
    await phoneScreen.locator('button:has-text("Compare across 3 platforms")').click();
    await page.waitForTimeout(300);
    const pickHeading = await phoneScreen.locator('text=Pick your products').first().innerText();
    assert.equal(pickHeading, 'Pick your products', 'Pick your products heading mismatch');
    // Citation: comparison/android/app/src/main/java/com/basketcompare/ui/BasketCompareScreens.kt:320
    const ruleNotice = await phoneScreen.locator('text=UNKNOWN is better than WRONG').first().innerText();
    assert.ok(ruleNotice.includes('UNKNOWN is better than WRONG'), 'Core UNKNOWN rule explanation mismatch');
    await phoneScreen.screenshot({ path: 'scripts/shots/ui-phone-basket-resolution.png' });
    console.log('PASS [phone:basket] Screen 2 (Resolution) verified & saved');

    // Close back to phone home
    await phoneScreen.locator('.ps-full-app.is-active button[title="Close"]').click();
    await page.waitForTimeout(400);
  }

  await page.close();
}

// ============================================================================
// PART 2: Desktop real-app shell verification.
// Deep iframe rendering and in-app navigation live in verify-real-apps.mjs.
{
  console.log('\n--- VERIFYING DESKTOP REAL-APP SHELL ---');
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  attachPageListeners(page);

  await page.goto(BASE + '/os/embed.html?embed=1');
  await page.locator('.desk-icon').first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);

  // Close boot windows.
  for (const close of await page.locator('.os-window [data-close]').all()) {
    await close.click().catch(() => {});
  }

  async function windowFor(title) {
    const win = page.locator('.os-window').filter({ hasText: title }).last();
    await win.waitFor();
    return win;
  }

  const apps = [
    { icon: 'FocusLock', src: '/apps/focuslock/' },
    { icon: 'DarkSentinel', src: '/apps/darksentinel/' },
    { icon: 'CrisisWatch', src: '/apps/crisiswatch/' },
    { icon: 'Fraud Detection', src: '/apps/fraud/' },
  ];
  for (const app of apps) {
    console.log('\n[desktop] Testing ' + app.icon + ' iframe shell...');
    const icon = page.locator('.desk-icon').filter({ hasText: app.icon }).first();
    await icon.click();
    const win = await windowFor(app.icon);
    const frame = win.locator('iframe');
    assert.equal(await frame.getAttribute('src'), app.src, app.icon + ': iframe src');
    assert.match(await win.locator('.win-title').innerText(), /demo data/i, app.icon + ': demo title');
    await win.locator('[data-close]').click();
    await page.waitForTimeout(300);
    assert.equal(await win.count(), 0, app.icon + ': window closed');
    console.log('PASS [desktop:' + app.icon + '] iframe shell opened and closed');
  }

  await page.close();
}
// PART 3: Network and Error Invariants
// ============================================================================
assert.deepEqual(externalRequests, [], `external network requests detected: ${externalRequests.join(' | ')}`);
assert.deepEqual(pageErrors, [], `page errors detected: ${pageErrors.join(' | ')}`);
assert.deepEqual(failedRequests, [], `failed network requests detected: ${failedRequests.join(' | ')}`);

console.log('\n================================================================');
console.log('PHONE NATIVE UIS + DESKTOP REAL-APP SHELL VERIFIED WITH 0 NETWORK LEAKS AND 0 ERRORS');
console.log('================================================================');
await browser.close();
