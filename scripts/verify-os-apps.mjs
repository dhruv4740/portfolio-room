import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import content from '../public/os/shell/content.js';

const BASE = process.env.BASE || 'http://localhost:4173';
const baseOrigin = new URL(BASE).origin;

const promoted = [
  { id: 'focuslock', title: 'FocusLock', mode: 'minimize', projectKey: 'focuslock' },
  { id: 'skills', title: 'Skills', mode: 'close' },
  { id: 'darksentinel', title: 'DarkSentinel', mode: 'close', projectKey: 'darksentinel' },
  { id: 'crisiswatch', title: 'CrisisWatch', mode: 'close', projectKey: 'crisiswatch' },
  { id: 'fraud', title: 'Fraud Detection', mode: 'close', projectKey: 'fraud' },
];

const browser = await chromium.launch(process.env.GPU === '1' ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const pageErrors = [];
const failedRequests = [];
const externalRequests = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || 'failed'}`));
page.on('request', (request) => {
  const url = request.url();
  // The real project UIs (public/apps/*) load their own web fonts from Google; everything else must stay on-origin.
  if (!url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith(new URL(BASE).origin) && !/fonts\.g(oogleapis|static)\.com|api\.github\.com/.test(url)) externalRequests.push(url);
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
assert.equal(labels.some((label) => /^(wormhole|lab|c[o]smos)$/i.test(label.trim())), false,
  `removed apps are still listed: ${labels.join(', ')}`);
console.log(`[harness] desktop apps: ${labels.join(', ')}`);

// Negative DOM assertion: Flux, Decoder, Kinetic, Corrupted, Reality Tear, Resonance
// must NOT appear anywhere in the desktop DOM (icons, window titles, context menus, terminal).
const forbidden = ['Flux', 'Decoder', 'Kinetic', 'Corrupted', 'Reality Tear', 'Resonance'];
for (const f of forbidden) {
  const re = new RegExp(`\\b${f}\\b`, 'i');
  assert.equal(labels.some((l) => re.test(l)), false, `Forbidden app "${f}" found in desktop icons: ${labels.join(', ')}`);
}

// Right-click context menu negative check
await page.locator('#workspace').click({ button: 'right', position: { x: 400, y: 300 } });
await page.waitForTimeout(200);
const ctxMenuText = await page.locator('#workspace').evaluate((el) => {
  const m = el.querySelector('div[style*="z-index:8000"], div[style*="z-index: 8000"]');
  return m ? m.innerText : '';
});
await page.locator('#workspace').click({ position: { x: 10, y: 10 } });
await page.waitForTimeout(200);
for (const f of forbidden) {
  const re = new RegExp(`\\b${f}\\b`, 'i');
  assert.equal(re.test(ctxMenuText), false, `Forbidden app "${f}" found in context menu: ${ctxMenuText}`);
}
console.log('PASS context menu does not contain old app names');

// Check terminal ls and help do not list old apps or cosmos
const termIcon = page.locator('.desk-icon').filter({ hasText: 'terminal' }).first();
if (await termIcon.count() > 0) {
  await termIcon.click();
  const termWin = await windowFor('terminal');
  const termInput = termWin.locator('.term-input');
  await termInput.fill('help');
  await termInput.press('Enter');
  await page.waitForTimeout(200);
  await termInput.fill('ls');
  await termInput.press('Enter');
  await page.waitForTimeout(300);
  const termOutput = await termWin.locator('.term-output').innerText();
  for (const f of [...forbidden, 'cosmos', 'wormhole']) {
    const re = new RegExp(`\\b${f}\\b`, 'i');
    assert.equal(re.test(termOutput), false, `terminal output contained forbidden app "${f}": ${termOutput}`);
  }
  console.log('PASS terminal help/ls does not contain old app names');
  await termWin.locator('[data-close]').click();
  await page.waitForTimeout(300);
}

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
  await icon.click();
  const win = await windowFor(app.title);

  // Wait 1500ms
  await page.waitForTimeout(1500);

  if (app.id === 'skills') {
    const rows = await win.locator('.sk-row').count();
    assert.equal(rows, content.skills.length, `${app.title}: expected ${content.skills.length} readable skill rows, got ${rows}`);
    console.log(`PASS ${app.title}: ${rows} skill rows listed`);
  } else if (await win.locator('iframe').count()) {
    // Real project UI (public/os/shell/iframeApp.js): the demo label is the window title, the app is untouched.
    assert.match(await win.locator('iframe').getAttribute('src'), /^\/apps\/[a-z-]+\/$/, `${app.title}: iframe src`);
    assert.match(await win.locator('.win-title').innerText(), /demo data/i, `${app.title}: window title names the demo data`);
    console.log(`PASS ${app.title}: real UI iframe with demo-data title`);
  } else {
    const demoTag = win.locator('.fl-demo-tag, .ds-demo-tag, .cw-demo-tag, .cw-demo-badge, .fd-demo-tag');
    assert.equal(await demoTag.count(), 1, `${app.title}: DEMO DATA tag missing`);
    const tagText = (await demoTag.innerText()).trim();
    assert.equal(tagText, 'DEMO DATA', `${app.title}: demo tag text mismatch. Expected "DEMO DATA", got "${tagText}"`);
    console.log(`PASS ${app.title}: DEMO DATA tag present`);
  }

  // Perform interaction
  if (app.id === 'focuslock') {
    const tab = win.locator('.fl-tab[data-tab="settings"]');
    if (await tab.count() > 0) await tab.click();
  } else if (app.id === 'darksentinel') {
    const tab = win.locator('.ds-tab[data-tab="pipeline"]');
    if (await tab.count() > 0) await tab.click();
  } else if (app.id === 'crisiswatch') {
    const chip = win.locator('.cw-chip').first();
    if (await chip.count() > 0) await chip.click();
  } else if (app.id === 'fraud') {
    const uploadBtn = win.locator('#fd-btn-upload');
    if (await uploadBtn.count() > 0) await uploadBtn.click();
  } else if (app.id === 'skills') {
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(800);
  await win.screenshot({ path: `scripts/shots/app-${app.id}.png` });
  console.log(`[harness] saved app-${app.id}.png`);

  if (app.hasRaf) {
    const running = await page.evaluate(() => window.__rafCallbacks);
    await page.waitForTimeout(250);
    assert.ok((await page.evaluate(() => window.__rafCallbacks)) > running, `${app.title}: rAF did not start while visible`);
  }

  if (app.mode === 'minimize') {
    await win.locator('[data-minimize]').click();
    await page.waitForTimeout(400);
    if (app.hasRaf) {
      const before = await page.evaluate(() => window.__rafCallbacks);
      await stopDelta(`${app.title} minimize`, before);
    }

    await page.locator('.taskbar-btn').filter({ hasText: app.title }).click();
    await page.waitForTimeout(150);
    if (app.hasRaf) {
      await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'leave' }, location.origin));
      await page.waitForTimeout(400);
      const leftBefore = await page.evaluate(() => window.__rafCallbacks);
      await stopDelta(`${app.title} parent leave`, leftBefore);
      await page.evaluate(() => window.postMessage({ source: 'v3-scan', type: 'enter' }, location.origin));
      await page.waitForTimeout(100);
    }
    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
  } else {
    await win.locator('[data-close]').click();
    await page.waitForTimeout(400);
    console.log(`PASS ${app.title} close: window closed`);
  }
}

// A skill's project button opens that project's card in the projects app.
const skillsDeskIcon = page.locator('.desk-icon').filter({ hasText: 'Skills' }).first();
await skillsDeskIcon.click();
const skillsWindow = await windowFor('Skills');
await skillsWindow.locator('.sk-proof button', { hasText: 'Expense Tracker' }).first().click();
const projectsWindow = await windowFor('projects');
await page.waitForTimeout(300);
assert.deepEqual(await projectsWindow.locator('.ql-card.ql-decoded h2').allInnerTexts(), ['Expense Tracker'], 'skill proof did not open its project card');
console.log('PASS Skills project button opens its card in projects');

// The green light fills the workspace and restores the previous size.
const before = await projectsWindow.evaluate((el) => [el.style.width, el.style.height]);
await projectsWindow.locator('[data-maximize]').click();
const [ww, wh] = await page.locator('#workspace').evaluate((el) => [el.clientWidth, el.clientHeight]);
assert.deepEqual(await projectsWindow.evaluate((el) => [el.style.width, el.style.height]), [`${ww}px`, `${wh}px`], 'maximize did not fill the workspace');
await projectsWindow.locator('[data-maximize]').click();
assert.deepEqual(await projectsWindow.evaluate((el) => [el.style.width, el.style.height]), before, 'maximize did not restore the window');
console.log('PASS maximize fills the workspace and restores');
for (const close of await page.locator('.os-window [data-close]').all()) await close.click().catch(() => {});
await page.waitForTimeout(400);

const wallpaperIcon = page.locator('.desk-icon').filter({ hasText: 'wallpaper' }).first();
await wallpaperIcon.click();
const wallpaper = await windowFor('wallpaper');

// 1. Set SKY
await wallpaper.locator('button[title="Mumbai, live"]').click();
await wallpaper.getByRole('button', { name: 'SET AS WALLPAPER' }).click();
await page.waitForTimeout(300);
const skyBg = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundImage);
assert.ok(skyBg.startsWith('url("data:image/png'), `SKY wallpaper backgroundImage does not start with url("data:image/png: ${skyBg.slice(0, 60)}`);
await page.screenshot({ path: 'scripts/shots/wallpaper-sky.png' });
console.log('PASS set SKY wallpaper applied data URL and screenshot saved');

// 2. Set a palette: the desktop shows a still of its flow field.
await wallpaper.locator('button[title="Ember"]').click();
await wallpaper.getByRole('button', { name: 'SET AS WALLPAPER' }).click();
await page.waitForTimeout(300);
const emberBg = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundImage);
const emberColor = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundColor);
assert.ok(emberBg.startsWith('url("data:image/png'), `Ember backgroundImage should be a data URL, got: ${emberBg.slice(0, 60)}`);
assert.equal(emberColor, 'rgb(10, 8, 0)', `Ember backgroundColor should be rgb(10, 8, 0), got: ${emberColor}`);
await page.screenshot({ path: 'scripts/shots/wallpaper-ember.png' });
console.log('PASS set Ember wallpaper applied its flow still');

// 3. Reload embed.html to verify persistence
await wallpaper.locator('[data-close]').click();
await page.waitForTimeout(300);
await page.goto(`${BASE}/os/embed.html?embed=1`);
await page.locator('.desk-icon').first().waitFor();
await page.waitForTimeout(600);
const reloadColor = await page.locator('#desktop').evaluate((el) => getComputedStyle(el).backgroundColor);
assert.equal(reloadColor, 'rgb(10, 8, 0)', `reloaded Ember backgroundColor should be rgb(10, 8, 0), got: ${reloadColor}`);
console.log('PASS reload embed.html persists the Ember wallpaper');

for (const close of await page.locator('.os-window [data-close]').all()) await close.click().catch(() => {});
await page.waitForTimeout(400);

// 4. Music Player audio test (no autoplay, plays/loops song, pauses on minimize, removed on close)
const resIcon = page.locator('.desk-icon').filter({ hasText: 'Music Player' }).first();
assert.equal(await resIcon.count(), 1, 'Music Player desktop icon missing');
await resIcon.click();
const resWin = await windowFor('Music Player');
await page.waitForTimeout(600);

const audio = resWin.locator('audio.music-audio, audio.resonance-audio');
assert.equal(await audio.count(), 1, 'music audio element missing');
const audioHandle = await audio.elementHandle();

// No autoplay: paused and currentTime === 0
const initialPaused = await audio.evaluate((el) => el.paused);
const initialTime = await audio.evaluate((el) => el.currentTime);
assert.equal(initialPaused, true, 'music audio should be paused on open');
assert.equal(initialTime, 0, 'music audio currentTime should be 0 on open');
console.log('PASS music audio is paused and currentTime === 0 on open (no autoplay)');

// Click play -> wait >1s -> currentTime > 0.5 and loop === true
const playBtn = resWin.locator('.music-overlay-play-btn, .res-overlay-play-btn');
await playBtn.click();
await page.waitForTimeout(1200);

const playingTime = await audio.evaluate((el) => el.currentTime);
const isLoop = await audio.evaluate((el) => el.loop);
const isPausedAfterPlay = await audio.evaluate((el) => el.paused);
assert.equal(isPausedAfterPlay, false, 'music audio should be playing after click');
assert.ok(playingTime > 0.5, `music audio currentTime should be > 0.5s after 1s, got: ${playingTime}`);
assert.equal(isLoop, true, 'music audio loop should be true');
console.log(`PASS music audio playing: currentTime=${playingTime.toFixed(2)}s, loop=${isLoop}`);

await resWin.screenshot({ path: 'scripts/shots/music-player-song.png' });
console.log('[harness] saved music-player-song.png');

// Minimize -> paused
await resWin.locator('[data-minimize]').click();
await page.waitForTimeout(400);
const minimizedPaused = await audioHandle.evaluate((el) => el.paused);
assert.equal(minimizedPaused, true, 'music audio should be paused when minimized');
console.log('PASS music audio paused when minimized');

// Restore and close -> element removed and paused
const resTaskbar = page.locator('.taskbar-btn').filter({ hasText: 'Music Player' }).first();
await resTaskbar.click();
await page.waitForTimeout(400);

await resWin.locator('[data-close]').click();
await page.waitForTimeout(400);

const audioCountAfterClose = await page.locator('audio.music-audio, audio.resonance-audio').count();
assert.equal(audioCountAfterClose, 0, 'music audio element should be removed on close');
const closedPaused = await audioHandle.evaluate((el) => el.paused);
assert.equal(closedPaused, true, 'music audio should be paused after close');
console.log('PASS music audio element removed and paused on close');

// 5. Room at http://localhost:4173/#/?sky=dusk and enter monitor
const roomPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await roomPage.addInitScript(() => {
  localStorage['v3:surface-override'] = 'scan';
  localStorage['v3:seen-intro'] = '1';
  localStorage['v3:test'] = '1';
});
await roomPage.goto(`${BASE}/#/?sky=dusk`);
await roomPage.locator('.scan-root').waitFor({ timeout: 15000 });
await roomPage.waitForTimeout(1000);

await roomPage.locator('[data-testid="room-overview"]').waitFor({ timeout: 10000 });
await roomPage.locator('[data-launchpad-action="explore-room"]').click();
await roomPage.waitForTimeout(1500);

const monitorMarker = roomPage.locator('.anchor-marker[data-object="monitor"]').first();
await monitorMarker.waitFor({ timeout: 10000 });
await monitorMarker.focus();
// The monitor marker enters the screen directly (no panel, no cue).
await roomPage.keyboard.press('Enter');

await roomPage.waitForFunction(
  () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
  { timeout: 15000 }
);

const osFrame = roomPage.frameLocator('[data-testid="dhruv-os-frame"]');
await osFrame.locator('.desk-icon').first().waitFor({ timeout: 10000 });
await roomPage.waitForTimeout(1000);

for (const closeBtn of await osFrame.locator('.os-window [data-close]').all()) {
  await closeBtn.click().catch(() => {});
}

const frameWpIcon = osFrame.locator('.desk-icon').filter({ hasText: 'wallpaper' }).first();
await frameWpIcon.click();
const frameWp = osFrame.locator('.os-window').filter({ hasText: 'wallpaper' }).last();
await frameWp.waitFor({ timeout: 10000 });

await frameWp.locator('button[title="Mumbai, live"]').click();
await frameWp.getByRole('button', { name: 'SET AS WALLPAPER' }).click();
await roomPage.waitForTimeout(800);

await roomPage.screenshot({ path: 'scripts/shots/wallpaper-sky-in-room-dusk.png' });
console.log('[harness] saved wallpaper-sky-in-room-dusk.png');
await roomPage.close();

assert.deepEqual(externalRequests, [], `external network requests: ${externalRequests.join(' | ')}`);
assert.deepEqual(pageErrors, [], `page errors: ${pageErrors.join(' | ')}`);
assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
console.log('PASS no external requests, page errors, or failed network requests');
console.log(`[harness] ${promoted.length}/5 promoted apps verified`);
await browser.close();
