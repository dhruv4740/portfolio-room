// Renders public/og.jpg (1200x630) from a real GPU frame of the landing view,
// with the DOM chrome hidden. Run: GPU=1 BASE=http://localhost:4173 node scripts/render-og.mjs
import { chromium } from 'playwright';
if (process.env.GPU !== '1') { console.error('Refusing: OG frame must come from the real GPU (GPU=1).'); process.exit(1); }
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
await p.goto(`${BASE}/#/`);
await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
await p.waitForFunction(() => !document.querySelector('.room-load'), null, { timeout: 90000 });
await p.waitForTimeout(3000);
await p.addStyleTag({ content: '.launchpad,.anchor-marker,.workspace-marker,.telemetry,.room-load,.scan-hint,[class*="hud"]{display:none!important}' });
await p.waitForTimeout(800);
await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 86 });
console.log('wrote public/og.jpg');
await b.close();
