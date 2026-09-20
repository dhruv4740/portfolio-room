// The chair sits behind/below every default camera, so confirm it loaded and
// then drag the view around to actually look at it.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
try {
  const page = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const assets = [];
  page.on('response', r => {
    if (/\.glb(\?|$)/.test(r.url())) assets.push({ url: r.url().split('/').pop(), status: r.status() });
  });
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'mid');
    sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  });
  await page.goto(`${BASE}/?sky=day`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.addStyleTag({ content: '.telemetry-root{display:none!important}' });
  console.log('glb responses', assets);

  // Look at the chair from the doorway side, then from the desk side.
  const views = {
    'chair-behind': [[1.35, 1.35, 2.35], [0.05, 0.55, 1.20]],
    'chair-side':   [[-1.25, 0.95, 1.85], [0.05, 0.55, 1.20]],
    'chair-front':  [[0.05, 1.15, -0.30], [0.05, 0.55, 1.20]],
  };
  for (const [name, [pos, target]] of Object.entries(views)) {
    await page.evaluate(([p, t]) => window.__v3test.lookFrom(p, t), [pos, target]);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `scripts/shots/${name}.png` });
  }
  console.log('errors', errors);
} finally {
  await b.close();
}
