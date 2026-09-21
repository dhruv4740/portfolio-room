// Tight crop on the hands, so the surface can be judged at the size the
// defect actually appears at. OUT names the file; the rest matches
// review-hands-compare.mjs.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const BASE = process.env.BASE || 'http://localhost:4173';
const NAME = process.env.NAME || 'crop';
await mkdir('scripts/shots/hands', { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
await p.goto(`${BASE}/scripts/review-cinematic-room.html?builder=live&view=seated&sky=night&power=1&hands=${process.env.HANDS || 'procedural'}`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
await p.waitForTimeout(1000);
const tris = await p.evaluate(() => { let t = 0; window.__model.hands.root.traverse(o => { if (o.isMesh && o.geometry?.index) t += o.geometry.index.count / 3; }); return Math.round(t); });
await p.screenshot({ path: `scripts/shots/hands/${NAME}.png`, clip: { x: 560, y: 640, width: 500, height: 260 } });
console.log(NAME, 'tris', tris);
await b.close();
