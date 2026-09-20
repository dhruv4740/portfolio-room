// Why does clicking the overview launchpad hang? Reports what element is
// actually on top at the button's centre. Throwaway diagnostic.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
try {
  const page = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    sessionStorage.setItem('v3:arrival-seen', '1');
  });
  await page.goto(`${BASE}/?sky=night`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log(JSON.stringify(await page.evaluate(() => {
    const el = document.querySelector('[data-launchpad-action="desktop-projects"]');
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    const describe = n => n && `${n.tagName}.${n.className}${n.dataset?.launchpadAction ? `[${n.dataset.launchpadAction}]` : ''}`;
    return {
      found: true,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      topAtCentre: describe(top),
      isSelfOrChild: !!(top && el.contains(top)),
      stack: document.elementsFromPoint(cx, cy).slice(0, 4).map(describe),
      pointerEvents: getComputedStyle(el).pointerEvents,
      disabled: el.disabled,
      entranceState: document.querySelector('.scan-root')?.dataset.entranceState,
    };
  }), null, 2));
  const t0 = Date.now();
  await page.locator('[data-launchpad-action="desktop-projects"]').click({ timeout: 20000 })
    .then(() => console.log('CLICK OK in', Date.now() - t0, 'ms'))
    .catch(e => console.log('CLICK FAILED after', Date.now() - t0, 'ms:', e.message.slice(0, 80)));
  const inside = await page.waitForFunction(
    () => document.querySelector('.scan-root')?.dataset.entranceState === 'inside',
    { timeout: 15000 }).then(() => true).catch(() => false);
  console.log('reached inside:', inside,
    'state =', await page.locator('.scan-root').getAttribute('data-entrance-state'));
} finally {
  await b.close();
}
