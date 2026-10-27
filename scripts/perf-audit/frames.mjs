// Comparable frames for before/after sheets: standing, sit-down sequence, seated, looking at the keys, typing sequence.
//   BASE=http://localhost:4176 OUTPFX=new QS=?sky=dusk [AB=noshadow] node scripts/perf-audit/frames.mjs
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4176', QS = process.env.QS || '', AB = process.env.AB || '';
const PFX = process.env.OUTPFX || 'f', OUT = 'scripts/shots/perf/frames'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.addInitScript(ab => {
  localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
  localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  if (ab) localStorage.setItem('v3:ab', ab);
}, AB);
await p.goto(BASE + '/' + QS);
await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1', null, { timeout: 90000 });
await p.waitForTimeout(3500);
const shot = n => p.screenshot({ path: `${OUT}/${PFX}-${n}.png` });
await shot('1-standing');
await p.locator('[data-launchpad-action="explore-room"]').click();
for (let i = 0; i < 5; i++) { await p.waitForTimeout(400); await shot(`2-sit${i}`); }
await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 30000 });
await p.waitForTimeout(2500);
await shot('3-seated');
const c = p.locator('.workspace-stage canvas'), box = await c.boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy + 110, { steps: 8 }); await p.mouse.up();
await p.waitForTimeout(1500);
await shot('4-keys');
await c.focus();
let i = 0;
for (const k of ['a', 's', 'd', 'j']) { await p.keyboard.press(k); await p.waitForTimeout(60); await shot(`5-type${i++}`); await p.waitForTimeout(500); }
await b.close();
