// Standing-view frames for the black-void decision: ?void=studio | block vs the
// default black, on the real GPU (see shots-hands.mjs GPU mode). Writes
// scripts/shots/void-<mode>.png for the owner to compare.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const mode of ['black', 'studio', 'block']) {
  const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  await p.addInitScript(() => { localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); });
  await p.goto(BASE + (mode === 'black' ? '/' : `/?void=${mode}`)); await p.waitForTimeout(3000);
  await p.screenshot({ path: `scripts/shots/void-${mode}.png` }); console.log('void', mode);
  await p.close();
}
await b.close();
