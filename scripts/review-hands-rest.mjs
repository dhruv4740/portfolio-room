// Seated hands on the real GPU: rest frame, tight crop and placement numbers.
// BASE=http://localhost:4173 NAME=label node scripts/review-hands-rest.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const BASE = process.env.BASE || 'http://localhost:4173';
const NAME = process.env.NAME || 'rest';
const DIR = 'scripts/shots/hands-rest';
await mkdir(DIR, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addInitScript(() => {
  localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1');
  localStorage.setItem('v3:test', '1');
  sessionStorage.setItem('v3:arrival-seen', '1');
});
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', e => errors.push(e.message));
await p.goto(`${BASE}/?sky=night`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__v3test, null, { timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('[data-launchpad-action="explore-room"]').click();
await p.waitForTimeout(5000);
await p.mouse.move(800, 450);
await p.waitForTimeout(600);
const facts = await p.evaluate(() => {
  const t = window.__v3test, k = t.keyBoxes();
  const c = (bx) => bx.min.map((v, i) => (v + bx.max[i]) / 2);
  const F = c(k[27]), J = c(k[30]);
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    keyPitch: r(Math.hypot(c(k[28])[0] - F[0], c(k[28])[2] - F[2])),
    F: F.map(r), J: J.map(r),
    handL: t.boxOf('handL'), handR: t.boxOf('handR'),
    body: t.bodyAttachment(), contact: t.keyboardSkinContact().map(x => ({ lift: r(x.restLift), clear: r(x.clearance) })),
  };
});
const w = (bx) => Math.round((bx.max[0] - bx.min[0]) * 1000);
console.log(NAME, JSON.stringify({ keyPitch: facts.keyPitch, F: facts.F, J: facts.J,
  handL_x: [facts.handL.min[0], facts.handL.max[0]].map(v => +v.toFixed(3)), handR_x: [facts.handR.min[0], facts.handR.max[0]].map(v => +v.toFixed(3)),
  handWidths_mm: [w(facts.handL), w(facts.handR)], torso: facts.body.torsoOffset.map(v => +v.toFixed(3)), contact: facts.contact }));
await p.addStyleTag({ content: '.seat-exit,.scan-hint,.anchor-marker{display:none!important}' });
await p.waitForTimeout(200);
await p.screenshot({ path: `${DIR}/${NAME}-full.png` });
await p.screenshot({ path: `${DIR}/${NAME}-crop.png`, clip: { x: 400, y: 480, width: 800, height: 420 } });
// Close-up from just above and behind the right hand, same night lighting.
await p.evaluate(({ F, J }) => { const x = (F[0] + J[0]) / 2; window.__v3test.lookFrom([x + 0.02, 1.43, 0.58], [x, 1.25, 0.30]); }, facts);
await p.waitForTimeout(800);
await p.screenshot({ path: `${DIR}/${NAME}-close.png`, clip: { x: 200, y: 150, width: 1200, height: 700 } });
if (errors.length) console.log('page errors:', errors.join(' | '));
await b.close();
