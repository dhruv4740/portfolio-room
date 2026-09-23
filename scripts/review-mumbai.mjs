// Rain vs clear Mumbai night through the open window. GPU=1 node scripts/review-mumbai.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
for (const weather of ['rain', 'clear']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); localStorage.setItem('v3:test', '1'); });
  await p.goto(`${BASE}/?sky=night&weather=${weather}#/`);
  await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
  await p.locator('[data-launchpad-action="explore-room"]').click();
  await p.waitForTimeout(1500);
  const toggle = p.locator('.seat-exit-toggle');
  if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  for (const name of ['BLINDS', 'WINDOW']) { await p.getByRole('button', { name, exact: true }).click(); await p.waitForTimeout(2600); }
  await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
  const c = await p.locator('.workspace-stage canvas').boundingBox();
  await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await p.mouse.down();
  await p.mouse.move(c.x + c.width / 2 + 150, c.y + c.height / 2 - 40, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `scripts/shots/mumbai-${weather}.png` });
  console.log(weather, await p.evaluate(() => [document.querySelector('.workspace-stage')?.dataset.weather, document.querySelector('[data-testid="mumbai-readout"]')?.textContent]), errors);
  await p.close();
}
await b.close();
