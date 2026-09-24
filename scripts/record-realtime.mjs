// Real-time clips of an interaction on the real GPU, for judging speed and
// feel (record-motion.mjs slows the timeline, so it can't show pace).
// BASE=http://localhost:4175 node scripts/record-realtime.mjs <launchpad-phone|phone|keyboard> [tag]
// Writes scripts/shots/clips/<action>-<tag>.webm
import { chromium } from 'playwright';
import { mkdirSync, renameSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const [action = 'phone', tag = 'now'] = process.argv.slice(2);
const dir = 'scripts/shots/clips';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } } });
const page = await context.newPage();
const keyCam = action === 'keyboard' && process.env.KEYCAM !== '0';
await page.addInitScript((test) => { sessionStorage.setItem('v3:arrival-seen', '1'); localStorage.setItem('v3:surface-override', 'scan'); if (test) localStorage.setItem('v3:test', '1'); }, keyCam);
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 90000 });
// Let the first-load stall and the background shader warm-up finish first,
// so the clip shows the interaction, not the compile.
await page.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.shadersWarm === 'ready', null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(1500);

const seat = async () => {
  await page.locator('[data-launchpad-action="explore-room"]').click();
  await page.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 20000 });
  await page.waitForTimeout(2500);
};
const mark = (label) => page.evaluate((l) => console.log(`[clip] ${l} ${Math.round(performance.now())}`), label);
page.on('console', (m) => { if (m.text().startsWith('[clip]')) console.log(m.text()); });

if (action === 'launchpad-phone') {
  await mark('click');
  await page.locator('[data-launchpad-action="mobile-projects"]').click();
  await page.waitForTimeout(7000);
  await mark('escape');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(4000);
} else if (action === 'phone') {
  await seat();
  await mark('click');
  // The deep link takes the same select path as clicking the phone while seated.
  await page.evaluate(() => { location.hash = '#/phone'; });
  await page.waitForTimeout(6000);
  await mark('escape');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(4000);
} else if (action === 'keyboard') {
  await seat();
  // The seated view frames the monitor; look down at the keys so the clip
  // shows the fingers (KEYCAM=0 keeps the seated view).
  if (keyCam) await page.evaluate(() => window.__v3test.lookFrom([0, 1.12, 0.58], [0, 0.74, 0.16]));
  await page.locator('.workspace-stage canvas').focus();
  await mark('type');
  await page.keyboard.type(process.env.TEXT || 'the quick brown fox jumps over the lazy dog', { delay: Number(process.env.DELAY || 180) });
  await page.waitForTimeout(2000);
}

const video = page.video();
await context.close();
const out = `${dir}/${action}-${tag}.webm`;
renameSync(await video.path(), out);
await browser.close();
console.log(out);
