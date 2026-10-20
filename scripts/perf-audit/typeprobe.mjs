// Pose-identity check for typing: runs __v3test.typeProbe over a key list on two builds
// and compares the unrounded hand offsets, fingertip positions and wrist angles.
//   A=http://localhost:4177 B=http://localhost:4176 node scripts/perf-audit/typeprobe.mjs
import { chromium } from 'playwright';
const A = process.env.A || 'http://localhost:4177', B = process.env.B || 'http://localhost:4176';
const keys = [...'qwertyuiopasdfghjklzxcvbnm1234567890', ' ', ',', '.', ';', '/'];
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
async function run(base) {
  const p = await (await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 })).newPage();
  await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); });
  await p.goto(base + '/');
  await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1', null, { timeout: 90000 });
  await p.waitForTimeout(1500);
  await p.locator('[data-launchpad-action="explore-room"]').click();
  await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  const t0 = Date.now(); const out = await p.evaluate(k => window.__v3test.typeProbe(k), keys); const ms = Date.now() - t0;
  await p.close(); return { out, ms };
}
const ra = await run(A), rb = await run(B);
let maxMm = 0, maxDeg = 0, maxDip = 0, n = 0;
ra.out.forEach((x, i) => { const y = rb.out[i]; if (!x.raw || !y.raw) return; n++;
  for (let c = 0; c < 3; c++) { maxMm = Math.max(maxMm, 1000 * Math.abs(x.raw.to[c] - y.raw.to[c]), 1000 * Math.abs(x.raw.tip[c] - y.raw.tip[c])); }
  maxMm = Math.max(maxMm, 1000 * Math.abs(x.raw.others - y.raw.others) || 0);
  maxDip = Math.max(maxDip, Math.abs(x.raw.dip - y.raw.dip) * 180 / Math.PI);
  for (let c = 0; c < 2; c++) maxDeg = Math.max(maxDeg, Math.abs(x.raw.wristDeg[c] - y.raw.wristDeg[c])); });
console.log(JSON.stringify({ keys: n, maxMm: +maxMm.toFixed(4), maxWristDeg: +maxDeg.toFixed(4), maxFingerDipDeg: +maxDip.toFixed(4), probeMs: { A: ra.ms, B: rb.ms } }));
await b.close();
