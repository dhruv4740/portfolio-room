// Measure the cinematic room in the browser: world bounding boxes for the
// objects the rendered frames put in question, plus contact gaps against the
// desk top. Numbers, so the defect report is measured rather than eyeballed.
//
// Usage: node scripts/review-cinematic-room-probe.mjs [cinematic|live]
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5174';
const which = process.argv[2] || 'cinematic';
const DESK_TOP = which === 'live' ? 1.165 : 0.740;

const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
const missing = [];
page.on('response', (r) => { if (r.status() === 404) missing.push(r.url()); });
await page.goto(`${BASE}/scripts/review-cinematic-room.html?builder=${which}&view=seated&sky=night&power=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__review?.ready?.(), null, { timeout: 45000 }).catch(() => {});
await page.waitForTimeout(800);

const NEEDLES = ['award', 'frame', 'speaker', 'pendant', 'ceiling', 'sill', 'snow', 'parapet', 'blind', 'mug', 'coffee', 'chair', 'notebook', 'headphone', 'drawer', 'wall', 'floor'];
const boxes = await page.evaluate((needles) => {
  const r = window.__review;
  const out = {};
  for (const n of needles) out[n] = r.box(n);
  out['_model.ceilingFixture'] = r.modelBox('ceilingFixture');
  out['_model.taskLamp'] = r.modelBox('taskLamp');
  out['_model.mouse'] = r.modelBox('mouse');
  out['_model.keyboard'] = r.modelBox('keyboard');
  return out;
}, NEEDLES);

console.log(`builder=${which}  desk top y=${DESK_TOP}`);
for (const [k, v] of Object.entries(boxes)) {
  if (!v) { console.log(`  ${k.padEnd(22)} (no object)`); continue; }
  if (v.empty) { console.log(`  ${k.padEnd(22)} ${v.name ?? ''} (empty box)`); continue; }
  const gap = v.min[1] - DESK_TOP;
  console.log(`  ${k.padEnd(22)} ${String(v.name ?? '').padEnd(26)} size ${v.size.join(' x ')}  minY ${v.min[1]}  gapToDesk ${gap >= 0 ? '+' : ''}${gap.toFixed(4)}`);
}
if (missing.length) { console.log('\n404s:'); for (const u of new Set(missing)) console.log('  ' + u); }
await browser.close();
