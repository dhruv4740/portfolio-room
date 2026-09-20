// Three follow-up checks the first render pass left open:
//   1. is the sill + snow ledge actually in frame from the seated camera?
//   2. does the near parapet read from the OVERVIEW camera, as the offline
//      study claimed? (it was only measured against the seated frame)
//   3. does the ceiling fixture's emissive actually respond to setEntryPower?
//      `update()` iterates a material list that is empty until the GLB lands,
//      so the call the harness makes right after build cannot reach it.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5174';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });

async function open(view, extra = '') {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=cinematic&view=${view}&sky=night&power=1${extra}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(600);
  return page;
}

const seated = await open('seated');
console.log('== sill and snow, seated frame (1600x900) ==');
console.log(await seated.evaluate(() => {
  const s = window.__scene, R = window.__review;
  // The sill and snow are merged into the batched architecture mesh, so they
  // are not findable by name. Project their authored world extents instead.
  const p = (x, y, z) => { const q = R.project([x, y, z]); return `${Math.round(q.x)},${Math.round(q.y)}`; };
  return ['  built as named meshes before batching: ' +
    (window.__model ? 'merged into "Workspace architecture" (see builder, "Window sill" / "Sill snow")' : '?'),
  '  snow ledge top, left end   ' + p(0.62, 0.9605, -0.84),
  '  snow ledge top, right end  ' + p(1.50, 0.9605, -0.84)].join('\n');
}));

console.log('\n== near parapet, OVERVIEW frame ==');
const over = await open('overview');
console.log(await over.evaluate(() => {
  const R = window.__review;
  const p = (x, y, z) => { const q = R.project([x, y, z]); return { x: Math.round(q.x), y: Math.round(q.y), z: +q.z.toFixed(3) }; };
  const corners = [p(0.20, 0.62, -2.25), p(2.60, 0.62, -2.25), p(0.20, -0.42, -2.25), p(2.60, -0.42, -2.25)];
  const onScreen = corners.some(c => c.x >= 0 && c.x <= 1600 && c.y >= 0 && c.y <= 900 && c.z > -1 && c.z < 1);
  return '  front-face corners ' + JSON.stringify(corners) +
    '\n  any corner inside the 1600x900 frame: ' + onScreen;
}));

console.log('\n== ceiling fixture emissive vs setEntryPower ==');
console.log(await seated.evaluate(async () => {
  const model = window.__model;
  const read = () => {
    const out = [];
    model.ceilingFixture.mount.traverse(o => {
      if (!o.isMesh) return;
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (m?.emissiveMap) out.push(+m.emissiveIntensity.toFixed(4));
      }
    });
    return out;
  };
  const before = read();
  model.setEntryPower(0.2);
  const at02 = read();
  model.setEntryPower(1);
  const at1 = read();
  return `  emissive materials found: ${before.length}\n  as shot (power=1 called before the GLB landed): ${JSON.stringify(before)}\n  after an explicit setEntryPower(0.2): ${JSON.stringify(at02)}\n  after setEntryPower(1): ${JSON.stringify(at1)}`;
}));

await browser.close();
