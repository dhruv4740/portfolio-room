// Frames from the arrival fly-in, which is the only view that shows the chair
// and the ceiling fixture together. Captures from first paint rather than
// waiting for the room bake, because the arrival finishes before that resolves.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const SKY = process.env.SKY || 'night';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
try {
  const page = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'mid');
    // Deliberately no v3:arrival-seen: the arrival plays.
  });
  await page.goto(`${BASE}/?sky=${SKY}`);
  await page.locator('.workspace-stage').waitFor({ timeout: 30000 });
  await page.addStyleTag({ content: '.telemetry-root{display:none!important}' });
  let last = 0;
  for (const t of [1500, 2600, 3600, 4800, 6500]) {
    await page.waitForTimeout(t - last); last = t;
    await page.screenshot({ path: `scripts/shots/arrival-${SKY}-${t}.png` });
    console.log(t, await page.locator('.workspace-stage').evaluate(e => ({
      lamp: e.dataset.taskLamp, fixture: e.dataset.ceilingFixture, bake: e.dataset.roomBake })));
  }
  console.log('errors', errors);
  if (errors.length) process.exitCode = 1;
} finally {
  await b.close();
}
