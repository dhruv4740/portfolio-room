// Acceptance for the authored keyboard: the GLB loads, the InstancedMesh it
// swaps into keeps its identity and count, clicking a cap resolves to the
// keyboard anchor with the right instance index, and setKey still depresses
// that instance. Also captures the seated view and the failed-load fallback.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });

async function open(block) {
  const page = await browser.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const assets = [];
  page.on('response', r => { if (/keyboard\.glb/.test(r.url())) assets.push(r.status()); });
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'mid');
    sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  });
  if (block) await page.route('**/models/after-hours/keyboard.glb', r => r.abort());
  await page.goto(`${BASE}/?sky=day`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: '.telemetry-root{display:none!important}' });
  return { page, errors, assets };
}

const report = {};
try {
  const { page, errors, assets } = await open(false);
  report.glbStatus = assets;

  // explore-room seats you; pressKey only fires while seated.
  await page.locator('[data-launchpad-action="explore-room"]').click();
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__v3test.lookFrom([0.11, 1.62, 0.95], [0.02, 1.20, 0.29]));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scripts/shots/keyboard-seated.png' });
  report.seated = await page.locator('.workspace-stage').evaluate(e => ({ seated: e.dataset.seated, phase: e.dataset.phase, action: e.dataset.actionState }));
  // Straight down, so the ray through a cap centre cannot graze a nearer cap.
  await page.evaluate(() => window.__v3test.lookFrom([0.0, 1.95, 0.281], [0.0, 1.21, 0.28]));
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'scripts/shots/keyboard-top.png' });

  report.keyboard = await page.evaluate(() => window.__v3test.keyboard());

  // Click a known cap through the real hit path and confirm it resolves to the
  // right instance, then that the press animation actually moves that instance.
  report.click = await page.evaluate(async () => {
    const at = window.__v3test.projectKey(17);              // KEY_ROWS[1][5] = 'y'
    const host = document.querySelector('.workspace-stage');
    const canvas = host.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const opts = { clientX: rect.left + at.x, clientY: rect.top + at.y, bubbles: true, pointerId: 1 };
    canvas.dispatchEvent(new PointerEvent('pointerdown', opts));
    canvas.dispatchEvent(new PointerEvent('pointerup', opts));
    await new Promise(r => setTimeout(r, 70));
    const dipped = window.__v3test.keyY(17);
    await new Promise(r => setTimeout(r, 300));
    return { hitKey: host.dataset.hitKey, rest: +window.__v3test.keyY(17).toFixed(5), dipped: +dipped.toFixed(5) };
  });

  report.capTops = await page.evaluate(() => [0, 17, 35, 59, 91].map(i => +window.__v3test.keyY(i).toFixed(4)));

  report.errors = errors;
  await page.close();

  const blocked = await open(true);
  report.blockedStatus = await blocked.page.evaluate(() => window.__v3test.keyboard().status);
  report.blockedErrors = blocked.errors.filter(e => !/keyboard\.glb|Failed to load|ERR_FAILED/i.test(e));
  await blocked.page.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
