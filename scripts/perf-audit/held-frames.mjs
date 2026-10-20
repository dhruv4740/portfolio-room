// Frames of held objects for shadow A/B, one fresh seated session per object.
//   BASE=... OUTPFX=x QS=?sky=night [AB=noshadow] [OBJS=PHONE,NOTEBOOK,RESUME,LAMP] node scripts/perf-audit/held-frames.mjs
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4178', QS = process.env.QS || '', AB = process.env.AB || '', PFX = process.env.OUTPFX || 'h';
const OBJS = (process.env.OBJS || 'PHONE,NOTEBOOK,RESUME,LAMP').split(',');
const OUT = 'scripts/shots/perf/frames'; await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const n of OBJS) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 810 } })).newPage();
  await p.addInitScript(ab => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open'); if (ab) localStorage.setItem('v3:ab', ab); }, AB);
  try {
    await p.goto(BASE + '/' + QS);
    await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1', null, { timeout: 90000 });
    await p.waitForTimeout(2500);
    await p.locator('[data-launchpad-action="explore-room"]').click();
    await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 30000 });
    await p.waitForTimeout(1500);
    if ((await p.locator('.seat-exit-toggle').getAttribute('aria-expanded')) !== 'true') await p.locator('.seat-exit-toggle').click();
    await p.getByRole('button', { name: n, exact: true }).click({ timeout: 5000 });
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `${OUT}/${PFX}-held-${n.toLowerCase()}.png` });
  } catch (e) { console.log('skip', n, String(e).split('\n')[0]); }
  await p.context().close();
}
await b.close();
