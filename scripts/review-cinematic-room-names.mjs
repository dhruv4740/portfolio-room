// List every named object in a built room, with its world box. Used to confirm
// that things the report claims exist (sill, snow ledge, parapet, speakers)
// are actually in the scene and where.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:5174';
const which = process.argv[2] || 'cinematic';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=${which}&view=seated&sky=night&power=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
const names = await page.evaluate(() => window.__review.names(''));
console.log(`${which}: ${names.length} named objects`);
console.log([...new Set(names)].sort().join('\n'));
await browser.close();
