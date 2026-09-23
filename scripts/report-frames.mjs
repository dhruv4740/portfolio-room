// Key frames for review: landing, seated desk view, hands at rest, window/city.
// GPU=1 BASE=http://localhost:4173 [QUERY='?sky=night&weather=rain'] node scripts/report-frames.mjs [prefix]
import { chromium } from 'playwright';
if (process.env.GPU !== '1') { console.error('Run with GPU=1; software frames are not evidence.'); process.exit(1); }
const BASE = process.env.BASE || 'http://localhost:4173';
const prefix = process.argv[2] || 'report';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
await p.goto(`${BASE}/${process.env.QUERY || ''}#/`);
await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('.room-load'), null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(2500);
await p.screenshot({ path: `scripts/shots/${prefix}-landing.png` });
await p.locator('[data-launchpad-action="explore-room"]').click();
await p.waitForTimeout(2500);
await p.screenshot({ path: `scripts/shots/${prefix}-seated.png` });
// Look down at the keyboard: drag the head pitch down.
const c = p.locator('.workspace-stage canvas');
const box = await c.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 110, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(1200);
await p.screenshot({ path: `scripts/shots/${prefix}-hands.png` });
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + box.width / 2 + 170, box.y + box.height / 2 - 160, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(1200);
await p.screenshot({ path: `scripts/shots/${prefix}-window.png` });
console.log('frames written; page errors:', errors);
await b.close();
