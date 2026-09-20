// Render the cinematic room candidate and the live room from their own fixed
// cameras, for the comparison frames PROMPT-OPUS-ROOM-COMPOSITION.md asks for.
//
// Usage:  npm run dev   (in another terminal, or set BASE to a preview server)
//         node scripts/review-cinematic-room-shots.mjs
//
// Real ANGLE D3D11 is mandatory, not an optimisation: headless Chromium's
// software rasteriser makes perfGovernor rate the machine 'low' and the repo's
// own scripts document that shadows then disappear. A SwiftShader frame is
// shadowless and flat, so every lighting defect read off one is an artifact of
// the harness. See TEAM-COORDINATION.md, "Evidence and communication".
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const OUT = 'scripts/shots/cinematic-room';
const WIDTH = Number(process.env.WIDTH || 1600);
const HEIGHT = Number(process.env.HEIGHT || 900);

const SHOTS = [
  { name: 'cinematic-seated-night', builder: 'cinematic', view: 'seated' },
  { name: 'cinematic-seated-night-blinds-open', builder: 'cinematic', view: 'seated', blinds: 1 },
  { name: 'cinematic-overview-night', builder: 'cinematic', view: 'overview' },
  { name: 'live-seated-night', builder: 'live', view: 'seated' },
  { name: 'live-overview-night', builder: 'live', view: 'overview' },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(String(e)));

const results = [];
for (const shot of SHOTS) {
  consoleErrors.length = 0;
  const url = `${BASE}/scripts/review-cinematic-room.html?builder=${shot.builder}&view=${shot.view}&sky=night&power=1`
    + (shot.blinds === undefined ? '' : `&blinds=${shot.blinds}`);
  await page.goto(url, { waitUntil: 'load' });

  // Poll the asset states rather than sleeping: a fixed timeout photographs
  // fallback boxes on a slow load and calls them defects.
  let assets = null;
  try {
    await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 });
  } catch {
    // fall through and record what actually landed
  }
  assets = await page.evaluate(() => window.__review?.assets?.() ?? null);

  // Two settled frames after the last asset swap, so the shadow map that was
  // invalidated by onShadowNeedsUpdate has actually been re-rendered.
  await page.waitForTimeout(1200);

  const stats = await page.evaluate(() => window.__review?.stats?.() ?? null);
  const probe = await page.evaluate(() => {
    const r = window.__review;
    if (!r || r.builder !== 'cinematic' || r.view !== 'seated') return null;
    // Where the window aperture lands in the frame, in pixels.
    return {
      apertureLeftBottom: r.project([0.62, 0.95, -0.90]),
      apertureRightTop: r.project([1.50, 2.10, -0.90]),
      screenCentre: r.project([0, 1.085, -0.30]),
      deskFrontEdge: r.project([0, 0.74, 0.35]),
    };
  });

  const path = `${OUT}/${shot.name}.png`;
  await page.screenshot({ path });
  results.push({ ...shot, path, assets, stats, probe, errors: [...consoleErrors] });
  console.log(`${shot.name}  assets=${JSON.stringify(assets)}  calls=${stats?.calls} tris=${stats?.triangles}${consoleErrors.length ? `  ERRORS=${consoleErrors.length}` : ''}`);
  if (consoleErrors.length) for (const e of consoleErrors.slice(0, 5)) console.log(`    ! ${e}`);
  if (probe) console.log(`    aperture px: LB ${probe.apertureLeftBottom.x.toFixed(0)},${probe.apertureLeftBottom.y.toFixed(0)}  RT ${probe.apertureRightTop.x.toFixed(0)},${probe.apertureRightTop.y.toFixed(0)}  (frame ${WIDTH}x${HEIGHT})`);
}

await browser.close();
console.log(`\nwrote ${results.length} frames to ${OUT}/`);
