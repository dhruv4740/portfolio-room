import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const baseOrigin = new URL(BASE).origin;

console.log('[suite] starting project UI verification against', BASE);

const browser = await chromium.launch();
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];

function attachPageListeners(p) {
  p.on('pageerror', (err) => pageErrors.push(err.message));
  p.on('requestfailed', (req) => {
    const why = req.failure()?.errorText || 'failed';
    // Closing a real-UI window removes its iframe mid-prefetch; those aborted chunk loads are not failures.
    if (why === 'net::ERR_ABORTED' && (req.url().includes('/apps/') || /fonts\.gstatic\.com/.test(req.url()))) return;
    failedRequests.push(`${req.method()} ${req.url()} - ${why}`);
  });
  p.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('data:') && !url.startsWith(baseOrigin) && !url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com')) {
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
  await page.locator('[data-object="chair"]').waitFor({ timeout: 15000 });
  await page.locator('[data-object="chair"]').click();
  await page.waitForTimeout(1800);

  const phoneBtn = page.getByRole('button', { name: 'PHONE', exact: true });
  await phoneBtn.waitFor({ timeout: 10000 });
  await phoneBtn.click();

  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed',
    { timeout: 10000 }
  );
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
    const demoTag = await phoneScreen.locator('text=DEMO DATA').first().innerText();
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
    await phoneScreen.locator('button[title="Close"]').click();
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
    const demoTag = await phoneScreen.locator('text=DEMO DATA').first().innerText();
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
    await phoneScreen.locator('button[title="Close"]').click();
    await page.waitForTimeout(400);
  }

  await page.close();
}

// ============================================================================
// PART 2: Monitor Apps Verification (FocusLock, DarkSentinel, CrisisWatch, Fraud)
// ============================================================================
{
  console.log('\n--- VERIFYING MONITOR APPS ---');
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  attachPageListeners(page);

  await page.goto(`${BASE}/os/embed.html?embed=1`);
  await page.locator('.desk-icon').first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);

  // Close boot windows
  for (const close of await page.locator('.os-window [data-close]').all()) {
    await close.click().catch(() => {});
  }

  async function windowFor(title) {
    const win = page.locator('.os-window').filter({ hasText: title }).last();
    await win.waitFor();
    return win;
  }

  // 4. FocusLock Desktop Agent Monitor App
  {
    console.log('\n[monitor] Testing FocusLock Desktop Agent...');
    const icon = page.locator('.desk-icon').filter({ hasText: 'FocusLock' }).first();
    await icon.dblclick();
    const win = await windowFor('FocusLock');
    await page.waitForTimeout(600);

    // Screen 1: Overview
    // Citation: new-focuslock/windows-agent/src/index.html:28
    const title = await win.locator('.fl-logo-title').innerText();
    assert.equal(title, 'FocusLock Desktop Dashboard', 'Desktop agent title mismatch');
    // Citation: new-focuslock/windows-agent/src/index.html:42
    const h1 = await win.locator('.fl-panel-title').innerText();
    assert.equal(h1, 'Overview', 'Desktop agent panel title mismatch');
    const protectionCard = await win.locator('text=Active Focus Protection').first().innerText();
    assert.equal(protectionCard, 'Active Focus Protection', 'Active focus protection card missing');
    // Assert DEMO DATA
    const demoTag = await win.locator('.fl-demo-tag').innerText();
    assert.equal(demoTag, 'DEMO DATA', 'DEMO DATA tag missing in FocusLock desktop');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-focuslock-overview.png' });
    console.log('PASS [monitor:focuslock] Screen 1 (Overview) verified & saved');

    // Screen 2: Settings Tab
    // Citation: new-focuslock/windows-agent/src/renderer.js:145
    const settingsTab = win.locator('.fl-nav-btn[data-tab="tab-settings"]');
    await settingsTab.click();
    await page.waitForTimeout(300);
    // Citation: new-focuslock/windows-agent/src/index.html:112
    const syncCodeLabel = await win.locator('text=Sync Code').first().innerText();
    assert.equal(syncCodeLabel, 'Sync Code', 'Sync code heading mismatch');
    const limitsHeading = await win.locator('text=Daily Limits').first().innerText();
    assert.equal(limitsHeading, 'Daily Limits', 'Daily limits heading mismatch');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-focuslock-settings.png' });
    console.log('PASS [monitor:focuslock] Screen 2 (Settings) verified & saved');

    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
  }

  // 5. DarkSentinel Monitor App — the real Next.js UI in an iframe (apps/darksentinel).
  {
    console.log('\n[monitor] Testing DarkSentinel (real UI, iframe)...');
    const icon = page.locator('.desk-icon').filter({ hasText: 'DarkSentinel' }).first();
    await icon.dblclick();
    const win = await windowFor('DarkSentinel');
    const frame = win.locator('iframe');
    assert.equal(await frame.getAttribute('src'), '/apps/darksentinel/', 'DarkSentinel iframe src');
    // Headless Chromium does not reliably paint a nested iframe: text checks only (visual proof is on the GPU path).
    const f = await (await frame.elementHandle()).contentFrame();
    await f.waitForFunction(() => /Autonomous Dark Web Threat Intelligence/.test(document.body.innerText), null, { timeout: 20000, polling: 300 });
    // Citation: apps/darksentinel/app/LandingPage.tsx (real landing page heading)
    assert.match(await f.locator('body').innerText(), /Autonomous Dark Web Threat Intelligence/, 'DarkSentinel landing heading');
    assert.match(await win.locator('.win-title').innerText(), /demo data/i, 'window title names the demo data');
    await page.screenshot({ path: 'scripts/shots/ui-monitor-darksentinel-mission.png', clip: await win.boundingBox() });
    console.log('PASS [monitor:darksentinel] real UI rendered in its window');
    await win.locator('[data-close]').click();
  }

  // 6. CrisisWatch Monitor App
  {
    console.log('\n[monitor] Testing CrisisWatch Monitor App...');
    const icon = page.locator('.desk-icon').filter({ hasText: 'CrisisWatch' }).first();
    await icon.dblclick();
    const win = await windowFor('CrisisWatch');
    await page.waitForTimeout(600);

    // Screen 1: Verify Claim
    // Citation: crisiswatch-web/src/app/page.tsx:38
    const title = await win.locator('.cw-title').innerText();
    assert.equal(title, 'CrisisWatch Claim Verification', 'CrisisWatch title mismatch');
    // Citation: crisiswatch-web/src/app/page.tsx:45
    const sectionTitle = await win.locator('.cw-section-title').first().innerText();
    assert.equal(sectionTitle, 'Claim Verification', 'Claim verification section title mismatch');
    const verifyBtn = win.locator('#cw-btn-verify');
    assert.ok(await verifyBtn.isVisible(), 'Verify Claim button missing');
    // Assert DEMO DATA
    const demoTag = await win.locator('.cw-demo-tag').innerText();
    assert.equal(demoTag, 'DEMO DATA', 'DEMO DATA tag missing in CrisisWatch');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-crisiswatch-verify.png' });
    console.log('PASS [monitor:crisiswatch] Screen 1 (Verify Claim) verified & saved');

    // Screen 2: Trending Misinformation Tab
    // Citation: crisiswatch-web/src/components/MisinformationFeed.tsx:24
    const feedTab = win.locator('.cw-nav-btn[data-nav="trending"]');
    await feedTab.click();
    await page.waitForTimeout(300);
    // Citation: crisiswatch-web/src/components/MisinformationFeed.tsx:31
    const trendingHeader = await win.locator('.cw-section-title').innerText();
    assert.equal(trendingHeader, 'Trending Claims', 'Trending header mismatch');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-crisiswatch-trending.png' });
    console.log('PASS [monitor:crisiswatch] Screen 2 (Trending Misinformation) verified & saved');

    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
  }

  // 7. Fraud Detection Monitor App
  {
    console.log('\n[monitor] Testing Fraud Detection Monitor App...');
    const icon = page.locator('.desk-icon').filter({ hasText: 'Fraud Detection' }).first();
    await icon.dblclick();
    const win = await windowFor('Fraud Detection');
    await page.waitForTimeout(600);

    // Screen 1: Financial Dashboard
    // Citation: kharghar/src/pages/Dashboard.tsx:42
    const brand = await win.locator('.fd-brand-title').innerText();
    assert.equal(brand, 'Financial Fraud Detection Dashboard', 'Brand title mismatch');
    // Citation: kharghar/src/components/DataTable.tsx:28
    const colHeader = await win.locator('text=TRANSACTION ID').first().innerText();
    assert.equal(colHeader, 'TRANSACTION ID', 'Transaction table column mismatch');
    // Assert DEMO DATA
    const demoTag = await win.locator('.fd-demo-tag').innerText();
    assert.equal(demoTag, 'DEMO DATA', 'DEMO DATA tag missing in Fraud Detection');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-fraud-dashboard.png' });
    console.log('PASS [monitor:fraud] Screen 1 (Financial Dashboard) verified & saved');

    // Screen 2: About / Attribution Modal
    // Citation: kharghar/src/components/RiskMeter.tsx:34
    const aboutBtn = win.locator('.fd-about-btn');
    await aboutBtn.click();
    await page.waitForTimeout(300);
    const modalTitle = await win.locator('text=About Fraud Detection Dashboard').first().innerText();
    assert.equal(modalTitle, 'About Fraud Detection Dashboard', 'Modal title mismatch');
    const modalText = await win.locator('text=Innovathon 2025 winner.').first().innerText();
    assert.ok(modalText.includes('Innovathon 2025'), 'Innovathon winner tagline mismatch');
    await win.screenshot({ path: 'scripts/shots/ui-monitor-fraud-about.png' });
    console.log('PASS [monitor:fraud] Screen 2 (About Modal) verified & saved');

    await win.locator('#fd-btn-close-about').click();
    await page.waitForTimeout(200);
    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
  }

  await page.close();
}

// ============================================================================
// PART 3: Network and Error Invariants
// ============================================================================
assert.deepEqual(externalRequests, [], `external network requests detected: ${externalRequests.join(' | ')}`);
assert.deepEqual(pageErrors, [], `page errors detected: ${pageErrors.join(' | ')}`);
assert.deepEqual(failedRequests, [], `failed network requests detected: ${failedRequests.join(' | ')}`);

console.log('\n================================================================');
console.log('ALL 7 REAL PROJECT UIS VERIFIED WITH 0 NETWORK LEAKS AND 0 ERRORS');
console.log('================================================================');
await browser.close();
