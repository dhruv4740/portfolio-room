// Finger-wrap sweep for the phone grips: for each option set and grip value,
// the gap and skin inside the phone (phoneGap), how much of the hand is
// actually on the case (vertices within 3 mm), and both wrists.
// BASE=http://localhost:4175 node scripts/probe-phone-wrap.mjs '[{"backPose":{"c0":0.5}}]' [grips]
// Options are tunePhone's (top, side, back, backCurl, follow, push) plus
// topPose / sidePose / backPose: partial POSES objects merged into that grip.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const sets = JSON.parse(process.argv[2] || '[{}]');
const grips = (process.argv[3] || '0,0.25,0.5,0.75,1').split(',').map(Number);
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); sessionStorage.setItem('v3:arrival-seen', '1'); });
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.locator('[data-launchpad-action="explore-room"]').click({ timeout: 120000 });
await page.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true');
await page.waitForTimeout(2500);
for (const opts of sets) {
  const rows = await page.evaluate(({ opts, grips }) => grips.map((g) => ({ g, ...window.__v3test.tunePhone(opts, g) })), { opts, grips });
  console.log(JSON.stringify(opts));
  for (const r of rows) console.log(`  grip ${r.g.toFixed(2)}  gap ${String(r.gapMm).padStart(5)} mm  inside ${String(r.inside).padStart(4)}  on-case ${String(r.near3).padStart(5)} (fingers ${String(r.nearFingers).padStart(4)})  wrist L ${r.wrist}°`);
}
await browser.close();
