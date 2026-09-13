// Screenshot the 3D scene. Usage: node scripts/shot.mjs [outfile] [waitMs]
//
// Headless Chromium reports a software GPU, so resolveSurface() sends it to
// /work. The override pin below is what gets you into the scene at all.
import { chromium } from 'playwright';

const out = process.argv[2] || 'scripts/shots/scene.png';
const wait = Number(process.argv[3] || 9000);
const BASE = process.env.BASE || 'http://127.0.0.1:4174';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
  } catch {}
});
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(wait);
await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}`);
