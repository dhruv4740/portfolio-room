// How big the 540x1200 phone DOM surface actually renders when the phone is
// held (the readability floor for phone apps depends on this). Real GPU.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const [w, h] of [[1536, 864], [1920, 1080], [1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:controls', 'open'); });
  await p.goto(BASE + '/'); await p.waitForTimeout(2500);
  await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'PHONE', exact: true }).click();
  await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.phoneState === 'zoomed', null, { polling: 100, timeout: 20000 });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => getComputedStyle(e).width === '540px' && getComputedStyle(e).height === '1200px'); const b = el.getBoundingClientRect(); return { w: +b.width.toFixed(0), h: +b.height.toFixed(0), scale: +(b.width / 540).toFixed(3) }; });
  console.log(`${w}x${h}: phone surface renders ${r.w}x${r.h} css px, scale ${r.scale} → a 16px app font shows at ${(16 * r.scale).toFixed(1)}px`);
  await p.close();
}
await b.close();
