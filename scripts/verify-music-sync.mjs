// scripts/verify-music-sync.mjs
// Verification harness for unified musicPlayer, playhead continuity, output routing,
// and single audio element invariant.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));

await page.addInitScript(() => {
  localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1');
  localStorage.setItem('v3:perf-tier', 'low');
  sessionStorage.setItem('v3:controls', 'open');
  window.__songs = [];
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!window.__songs.includes(this)) window.__songs.push(this);
    return nativePlay.call(this);
  };
});

console.log('[harness] navigating to', BASE);
await page.goto(`${BASE}/#/`);
await page.locator('[data-object="chair"]').waitFor();
await page.locator('[data-object="chair"]').click();
await page.waitForTimeout(1800);

const idle = async () => {
  await page.waitForFunction(
    () => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle',
    null,
    { polling: 100 }
  );
  await page.waitForTimeout(900);
};

// 1. Wear headphones
const headphonesBtn = page.getByRole('button', { name: 'HEADPHONES', exact: true });
await headphonesBtn.click();
await idle();

const outputWorn = await page.evaluate(() => window.__v3Music?.getState()?.output);
assert.equal(outputWorn, 'headphones', `Expected output to be headphones while worn, got: ${outputWorn}`);
console.log('PASS getState().output is headphones while worn');

const isPlayingWorn = await page.evaluate(() => window.__v3Music?.getState()?.playing);
assert.equal(isPlayingWorn, true, 'musicPlayer should be playing while headphones worn');

// Wait 3s to advance the playhead
console.log('[harness] playing for 3s...');
await page.waitForTimeout(3000);

const timeBeforeTakeoff = await page.evaluate(() => window.__v3Music?.getState()?.currentTime);
assert.ok(timeBeforeTakeoff >= 2.5, `Expected currentTime >= 2.5s, got: ${timeBeforeTakeoff}`);

// 2. Take off headphones
await headphonesBtn.click();
await idle();

const outputOff = await page.evaluate(() => window.__v3Music?.getState()?.output);
assert.equal(outputOff, 'speakers', `Expected output to be speakers after removal, got: ${outputOff}`);
console.log('PASS getState().output is speakers otherwise');

const isPausedOff = await page.evaluate(() => window.__v3Music?.getState()?.playing);
assert.equal(isPausedOff, false, 'musicPlayer should be paused after headphones removed');

// 3. Enter the monitor
console.log('[harness] entering monitor...');
const monitorMarker = page.locator('.anchor-marker[data-object="monitor"]').first();
await monitorMarker.waitFor({ timeout: 10000 });
await monitorMarker.focus();
await page.keyboard.press('Enter');

await page.waitForFunction(
  () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
  { timeout: 15000 }
);

const osFrame = page.frameLocator('[data-testid="dhruv-os-frame"]');
await osFrame.locator('.desk-icon').first().waitFor({ timeout: 10000 });
await page.waitForTimeout(800);

// Close windows opened on boot
for (const closeBtn of await osFrame.locator('.os-window [data-close]').all()) {
  await closeBtn.click().catch(() => {});
}
await page.waitForTimeout(400);

// 4. Open Music Player in OS
const musicIcon = osFrame.locator('.desk-icon').filter({ hasText: 'Music Player' }).first();
assert.equal(await musicIcon.count(), 1, 'Music Player desktop icon missing');
await musicIcon.dblclick();

const musicWin = osFrame.locator('.os-window').filter({ hasText: 'Music Player' }).last();
await musicWin.waitFor();

// 5. Press play in Music Player -> assert playhead continuity
const playBtn = musicWin.locator('.music-overlay-play-btn, .res-overlay-play-btn');
await playBtn.click();
await page.waitForTimeout(800);

const resumeTime = await page.evaluate(() => window.__v3Music?.getState()?.currentTime);
assert.ok(resumeTime >= 2.5, `Expected resumed currentTime >= 2.5s (not restarted), got: ${resumeTime}`);
console.log(`PASS playhead continuity: currentTime is ${resumeTime.toFixed(2)}s (>= 2.5s, not restarted)`);

// 6. Test window controls: pause and resume
const winPlayPause = musicWin.locator('.music-play-btn, .res-play-btn');
await winPlayPause.click();
await page.waitForTimeout(200);
assert.equal(await page.evaluate(() => window.__v3Music?.getState()?.playing), false, 'should be paused via window button');

await winPlayPause.click();
await page.waitForTimeout(200);
assert.equal(await page.evaluate(() => window.__v3Music?.getState()?.playing), true, 'should be playing via window button');

// 7. Test menubar toggle
const soundToggle = osFrame.locator('#sound-toggle');
await soundToggle.click();
await page.waitForTimeout(200);
assert.equal(await page.evaluate(() => window.__v3Music?.getState()?.playing), false, 'should be paused via menubar toggle');
assert.equal(await soundToggle.innerText(), '♪ OFF');

await soundToggle.click();
await page.waitForTimeout(200);
assert.equal(await page.evaluate(() => window.__v3Music?.getState()?.playing), true, 'should be playing via menubar toggle');
assert.equal(await soundToggle.innerText(), '♪ ON');
console.log('PASS menubar toggle synchronizes with shared state');

// 8. Leave the monitor (Escape) while playing -> assert still playing
console.log('[harness] leaving monitor via Escape...');
await page.keyboard.press('Escape');
await page.waitForFunction(
  () => document.querySelector('.scan-root')?.dataset.entranceState === 'room',
  { timeout: 15000 }
);
await page.waitForTimeout(500);

const playingAfterEscape = await page.evaluate(() => window.__v3Music?.getState()?.playing);
assert.equal(playingAfterEscape, true, 'musicPlayer should continue playing after leaving monitor');
console.log('PASS leaving monitor (Escape) while playing -> still playing');

// 9. Assert only ONE audio element with /os/audio/song.mp3 exists across page and iframe
const uniqueSongAudios = await page.evaluate(() => {
  const songs = new Set();
  for (const a of document.querySelectorAll('audio')) {
    if (a.src.endsWith('/os/audio/song.mp3')) songs.add(a);
  }
  const iframe = document.querySelector('[data-testid="dhruv-os-frame"]');
  if (iframe?.contentDocument) {
    for (const a of iframe.contentDocument.querySelectorAll('audio')) {
      if (a.src.endsWith('/os/audio/song.mp3')) songs.add(a);
    }
  }
  if (window.__songs) {
    for (const a of window.__songs) {
      if (a.src.endsWith('/os/audio/song.mp3')) songs.add(a);
    }
  }
  return songs.size;
});
assert.equal(uniqueSongAudios, 1, `Expected exactly 1 song audio element, found ${uniqueSongAudios}`);
console.log('PASS only one audio element with src ending /os/audio/song.mp3 exists');

assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join(', ')}`);
console.log('PASS verify-music-sync complete');

await browser.close();
