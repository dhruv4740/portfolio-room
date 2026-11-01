// Phone checks for the current site (390x844, touch). Run against a served build:
//   BASE=http://localhost:8788 GPU=1 node scripts/verify-mobile.mjs
// 1. / on a phone lands on /work, no sideways scroll.
// 2. /work: no sideways scroll, the Ask pill is on screen, headings are present.
// 3. /?room=phone opens the room instead of redirecting, and it reveals.
// No page errors anywhere. Exits 1 on any FAIL.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const args = process.env.GPU ? ['--use-angle=d3d11', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ channel: 'chromium', args });
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ` — ${info}` : ''}`); };

async function phonePage() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/api\.github\.com|open-meteo/.test(m.text())) errors.push(m.text().slice(0, 160)); });
  return { ctx, page, errors };
}
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

{
  const { ctx, page, errors } = await phonePage();
  await page.goto(`${BASE}/?notrack=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const where = await page.evaluate(() => ({ path: location.pathname }));
  check('/ on a phone stays on the work page', where.path === '/', JSON.stringify(where));
  check('/ has no sideways scroll', (await overflowX(page)) <= 1, `${await overflowX(page)} px`);
  check('/ no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}

{
  const { ctx, page, errors } = await phonePage();
  await page.goto(`${BASE}/?notrack=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  check('/work has no sideways scroll', (await overflowX(page)) <= 1, `${await overflowX(page)} px`);
  const pill = await page.evaluate(() => { const r = document.querySelector('#ask-pill')?.getBoundingClientRect(); return r && { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width) }; });
  check('/work Ask pill is on screen', !!pill && pill.bottom <= 844 && pill.top >= 0 && pill.w <= 390, JSON.stringify(pill));
  const h2 = await page.locator('main h2').count();
  check('/work has section headings', h2 >= 3, `${h2} h2`);
  await page.screenshot({ path: 'scripts/shots/mobile.png' });
  check('/work no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}

{
  const { ctx, page, errors } = await phonePage();
  await page.goto(`${BASE}/room/?room=phone&notrack=1`);
  await page.waitForTimeout(1500);
  check('/?room=phone stays on the room', page.url().includes('/room/'), page.url().replace(BASE, ''));
  const revealed = await page.locator('.workspace-stage[data-room-revealed="1"]').waitFor({ timeout: 60000 }).then(() => true, () => false);
  check('/?room=phone reveals the room', revealed);
  check('/?room=phone no page errors', !errors.length, errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(fails ? `${fails} FAIL` : 'all passed');
process.exit(fails ? 1 : 0);
