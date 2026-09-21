// Shoot the LIVE room's seated hands in both surface modes, so "the authored
// hands look worse than the procedural ones" can be looked at rather than
// argued about.
//
//   node scripts/review-hands-compare.mjs        (BASE defaults to :4173)
//
// handSurface.js picks its surface from the same `hands` query parameter the
// review page uses for figure visibility:
//     hands=authored    the authored BAMEN retarget (opt-in)
//     hands=procedural  the procedural rig — and what the app now shows with
//                       no parameter at all, restored 2026-09-21
//     hands=v1          resolves to the same asset as 'procedural'
//
// Real ANGLE D3D11 is mandatory; a SwiftShader frame is shadowless and flat.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || 'scripts/shots/hands';
await mkdir(OUT, { recursive: true });

const MODES = [
  { name: 'hands-authored', hands: 'authored', note: 'authored BAMEN retarget, opt-in' },
  { name: 'hands-procedural', hands: 'procedural', note: 'procedural — the restored default' },
  // 'v1' and 'procedural' both resolve to hands-v1, so they are one mode, not
  // two; shooting the default path instead is the check that actually matters.
  { name: 'hands-default', hands: '1', note: "no meaningful value: exercises the app's default path" },
];

const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });

for (const mode of MODES) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=live&view=seated&sky=night&power=1&hands=${mode.hands}`,
    { waitUntil: 'load' });
  await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const stats = await page.evaluate(() => {
    let skinned = 0, tris = 0, visible = false;
    const names = [];
    window.__model.hands?.root?.traverse((o) => {
      if (!o.isMesh) return;
      if (o.isSkinnedMesh) skinned++;
      names.push(o.name || o.type);
      const g = o.geometry;
      if (g?.index) tris += g.index.count / 3; else if (g?.attributes?.position) tris += g.attributes.position.count / 3;
    });
    visible = !!window.__model.hands?.root?.visible;
    return { skinned, tris: Math.round(tris), visible, parts: names.length };
  });
  console.log(`${mode.name.padEnd(18)} visible=${stats.visible} skinnedMeshes=${stats.skinned} parts=${stats.parts} tris=${stats.tris}  (${mode.note})`);
  for (const e of errors.slice(0, 3)) console.log(`    ! ${e}`);

  await page.screenshot({ path: `${OUT}/${mode.name}.png` });
  await page.close();
}

await browser.close();
console.log(`wrote ${MODES.length} frames to ${OUT}/`);
