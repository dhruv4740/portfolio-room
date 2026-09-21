// Shoot the cinematic seated frame once per sky state, to check that the
// per-state key light in cinematicLayout.KEY_LIGHTS actually moves the light.
//
// The live SKY_CONFIGS carries key positions in live-room coordinates, which
// the cinematic builder ignores. Without this, "dusk and day have their own key
// now" would be an assertion about a code path nothing had executed.
//
//   node scripts/review-cinematic-room-sky.mjs        (BASE defaults to :4173)
//
// Real ANGLE D3D11 is mandatory: a SwiftShader frame is shadowless, and the
// whole point here is where the key light throws its shadows.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = 'scripts/shots/cinematic-room';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });

for (const sky of ['night', 'dusk', 'day']) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=cinematic&view=seated&sky=${sky}&power=1`,
    { waitUntil: 'load' });
  await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(900);

  // Read the key light back out of the scene rather than trusting the config.
  const key = await page.evaluate(() => {
    const lights = [];
    window.__scene.traverse((o) => {
      if (o.isDirectionalLight) lights.push({
        position: o.position.toArray().map((v) => +v.toFixed(3)),
        target: o.target.position.toArray().map((v) => +v.toFixed(3)),
        intensity: +o.intensity.toFixed(3),
        color: `#${o.color.getHexString()}`,
      });
    });
    return lights;
  });
  console.log(`${sky.padEnd(6)} keys=${JSON.stringify(key)}`);
  await page.screenshot({ path: `${OUT}/cinematic-seated-${sky}.png` });
  await page.close();
}

await browser.close();
console.log(`wrote 3 frames to ${OUT}/`);
