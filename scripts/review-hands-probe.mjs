// Two questions the hands comparison left open:
//   1. the authored run logged a 404 the procedural runs did not — did an
//      actual hand texture fail, or is it the unrelated one-off?
//   2. the authored surface is paler and flatter. Is that the topology
//      (31,886 tris vs 75,860) or the colour/normal/roughness maps it also
//      swaps in? Correlation is not cause, and the report should not imply it.
//
//   node scripts/review-hands-probe.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });

for (const hands of ['1', 'procedural']) {
  const page = await ctx.newPage();
  const failed = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => failed.push(`FAILED ${r.url()}`));
  await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=live&view=seated&sky=night&power=1&hands=${hands}`,
    { waitUntil: 'load' });
  await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const skin = await page.evaluate(() => {
    const out = [];
    window.__model.hands?.root?.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (!m) continue;
        out.push({
          mesh: o.name || 'unnamed',
          color: `#${m.color?.getHexString?.() ?? '??'}`,
          roughness: m.roughness,
          map: m.map ? (m.map.image?.src?.split('/').pop() ?? 'set') : null,
          normalMap: m.normalMap ? 'set' : null,
          roughnessMap: m.roughnessMap ? 'set' : null,
        });
      }
    });
    return out;
  });

  console.log(`\n== hands=${hands} ==`);
  console.log('  failed requests:', failed.length ? failed.join('\n    ') : 'none');
  const seen = new Set();
  for (const s of skin) {
    const key = JSON.stringify(s);
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${JSON.stringify(s)}`);
  }
  await page.close();
}

await browser.close();

// 3. Why the whole upper body shifts when you pick something up.
//    seatedHands accumulates `torsoOffset` along the FULL 3D reach vector
//    whenever a wrist is farther than REACH from its shoulder, and
//    buildSeatedFigure.setUpperBodyOffset translates torso vertices by that
//    vector — Y included. Measured at rest, and for each real anchor.
{
  const browser2 = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const ctx2 = await browser2.newContext({ viewport: { width: 800, height: 500 } });
  const page = await ctx2.newPage();
  await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=live&view=seated&sky=night&power=1&hands=procedural`,
    { waitUntil: 'load' });
  await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(800);
  console.log('\n== torso offset, live room ==');
  console.log(await page.evaluate(() => {
    const h = window.__model.hands;
    // Rest positions come off the model rather than a hardcoded copy, so this
    // cannot drift from whatever the builder actually placed.
    const homes = window.__model.roomActions.homes;
    const r = (v) => v.toArray().map((n) => +n.toFixed(3));
    const out = [`  at rest: lean=${r(h.lean)} torsoOffset=${r(h.torsoOffset)}`];
    const REACH = 0.32 + 0.27 - 0.015;
    out.push(`  REACH (upper 0.32 + fore 0.27 - 0.015) = ${REACH} m`);
    out.push('  right shoulder at [0.275, 1.40, 1.23]; dy/dz are what the torso translates by:');
    for (const [name, v] of Object.entries(homes)) {
      const sx = 0.05 + 0.225, sy = 1.40, sz = 1.23;
      const d = Math.hypot(v.x - sx, v.y - sy, v.z - sz);
      if (d <= REACH) { out.push(`  ${name.padEnd(12)} dist=${d.toFixed(3)}  within reach, no torso shift`); continue; }
      const k = (d - REACH) / d;
      out.push(`  ${name.padEnd(12)} dist=${d.toFixed(3)}  over by ${(d - REACH).toFixed(3)}  -> torso dy=${((v.y - sy) * k).toFixed(3)} dz=${((v.z - sz) * k).toFixed(3)}`);
    }
    return out.join(String.fromCharCode(10));
  }));
  await browser2.close();
}
