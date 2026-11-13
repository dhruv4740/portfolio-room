// Renders public/og.jpg (1200x630) from a real GPU frame of the landing view,
// with the DOM chrome hidden. Run: GPU=1 BASE=http://localhost:4173 node scripts/render-og.mjs
import { chromium } from 'playwright';
if (process.env.GPU !== '1') { console.error('Refusing: OG frame must come from the real GPU (GPU=1).'); process.exit(1); }
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
// The caption tracks the job title in src/v3/content/index.js (identity.role).
const CAPTION = 'Dhruv Kothari — Software engineer';
await p.goto(`${BASE}/room/?sky=night#/`);
// The front door covers the room until a visitor picks it; skip the arrival flight.
await p.locator('#fd-room').click({ timeout: 30000 });
await p.waitForSelector('#front-door', { state: 'detached', timeout: 60000 });
await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
const skip = p.getByRole('button', { name: /skip/i });
if (await skip.count()) await skip.first().click().catch(() => {});
await p.waitForFunction(() => !document.querySelector('.room-load'), null, { timeout: 90000 });
await p.waitForTimeout(2500);
// "Look around yourself" moves to the desk view the image has always used.
await p.getByRole('button', { name: /look around yourself/i }).first().click();
await p.waitForTimeout(4000);
// Only the WebGL frame and the caption: every DOM overlay is hidden.
await p.addStyleTag({ content: 'body *{visibility:hidden!important} canvas,#og-caption{visibility:visible!important}' });
await p.evaluate((text) => {
  const c = document.createElement('div');
  c.id = 'og-caption';
  c.textContent = text;
  c.style.cssText = "position:fixed;left:50px;bottom:34px;z-index:2147483647;font:600 46px 'Segoe UI',system-ui,sans-serif;color:#f2f2f2;white-space:nowrap;text-shadow:0 2px 12px rgba(0,0,0,.65)";
  document.body.appendChild(c);
}, CAPTION);
await p.waitForTimeout(800);
await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 86 });
console.log('wrote public/og.jpg');
await b.close();
