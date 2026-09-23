// Real-GPU frame cost on this machine: new headless Chromium on ANGLE D3D11 at
// the owner's laptop size (1536x864 @ 1.25). Prints the HUD's FPS and GPU MS
// while dragging to look (continuous renders), standing and seated, with the
// hand rig shown and hidden, for each perf tier. Headless SwiftShader numbers
// are meaningless; this path is not.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const TIERS = (process.env.TIERS || 'auto,high,mid,low').split(',');
const DPR = +(process.env.DPR || 1.25);
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
async function session(tier) {
  const ctx = await b.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: DPR });
  const p = await ctx.newPage();
  await p.addInitScript(t => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); if (t === 'auto') localStorage.removeItem('v3:perf-tier'); else localStorage.setItem('v3:perf-tier', t); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open'); }, tier);
  await p.goto(BASE + '/');
  await p.waitForFunction(() => {
    const stage = document.querySelector('.workspace-stage');
    // The true-scale room skips the old window's city GLB and lightmap bake.
    const done = (v) => v === 'ready' || v === 'skipped';
    return done(stage?.dataset.winterCity)
      && stage?.dataset.roomMaterials === 'ready'
      && done(stage?.dataset.roomBake);
  }, null, { timeout: 20000 });
  // Let the freshly loaded city/material/bake path submit a warm frame before
  // the first timed drag. The readiness gate replaces the old fixed delay.
  await p.waitForTimeout(500);
  console.log('Renderer', await p.evaluate(() => { const gl=document.querySelector('.workspace-stage canvas').getContext('webgl2'); const ext=gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }));
  const hud = () => p.evaluate(() => document.querySelector('.telemetry-root')?.innerText.replace(/\s+/g, ' '));
  const drag = async (ms) => { const c = p.locator('.workspace-stage canvas'); const box = await c.boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2; await p.mouse.move(cx, cy); await p.mouse.down(); const t0 = Date.now(); let i = 0; while (Date.now() - t0 < ms) { await p.mouse.move(cx + Math.sin(i / 20) * 8, cy + Math.cos(i / 25) * 8); i++; await p.waitForTimeout(16); } await p.mouse.move(cx, cy); await p.mouse.up(); };
  const perf = async () => JSON.stringify(await p.evaluate(() => window.__v3test.perf()));
  await drag(3000); console.log(`[${tier}] standing drag   ${await hud()}  ${await perf()}`);
  await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
  await drag(3000); console.log(`[${tier}] seated drag     ${await hud()}  ${await perf()}`);
  await p.evaluate(() => window.__v3test.showHands(false)); await drag(3000); console.log(`[${tier}] seated no-hands ${await hud()}  ${await perf()}`);
  await p.evaluate(() => window.__v3test.showHands(true));
  // Pixel-ratio sweep: does the seated cost scale with pixels (fill rate) or not (fixed cost)?
  for (const pr of (process.env.SWEEP || '').split(',').filter(Boolean).map(Number)) {
    await p.evaluate(v => window.__v3test.setPixelRatio(v), pr);
    await drag(600); // warm the changed DPR before clearing its samples
    await p.evaluate(() => window.__v3test.gpuSamples(true));
    await drag(3000);
    const samples = await p.evaluate(() => window.__v3test.gpuSamples().sort((a,b)=>a-b));
    const percentile = p => samples[Math.min(samples.length-1,Math.floor(samples.length*p))];
    console.log(`[${tier}] seated pr=${pr} ${await perf()} GPU ${JSON.stringify({samples:samples.length,median:percentile(.5),p95:percentile(.95)})}`);
  }
  await ctx.close();
}
try {
  for (const t of TIERS) await session(t);
} finally {
  await b.close();
}
