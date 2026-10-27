// UI review sweep of every project demo, in all three places, at four viewports.
//   BASE=http://localhost:4173 [ONLY=work|os|phone] [VP=1536x864,412x915] [OUT=scripts/shots/demos] node scripts/review-demos.mjs
// Writes <OUT>/<surface>-<id>-<viewport>.png and prints one metrics line per shot
// (page overflow, controls outside the viewport, console errors) as JSON.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173', OUT = process.env.OUT || 'scripts/shots/demos';
const ONLY = (process.env.ONLY || 'work,os,phone').split(',');
const VPS = (process.env.VP || '1536x864,1280x720,412x915,915x412').split(',').map(s => s.split('x').map(Number));
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const WORK = ['focuslock', 'expense', 'basket', 'darksentinel', 'crisiswatch', 'fraud'];
const OS = ['focuslock', 'darksentinel', 'crisiswatch', 'fraud'];
const PHONE = ['focuslock', 'expense', 'basketproof'];
async function ctxFor([w, h]) {
  const touch = w < 700 || h < 500;
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch });
  await c.addInitScript(([override]) => { localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open'); if (override) localStorage.setItem('v3:surface-override', 'scan'); }, [true]);
  return c;
}
const scan = (scope) => {
  const vw = innerWidth, bad = [];
  for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role=button]')) {
    if (scope && !el.closest(scope)) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (r.right > vw + 1 || r.left < -1) bad.push((el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 24) + `@${Math.round(r.left)}-${Math.round(r.right)}`);
  }
  return { vw, overflowX: document.documentElement.scrollWidth - vw, hClipped: bad.length, sample: bad.slice(0, 4) };
};
// Horizontal overflow and horizontally clipped controls, in the page chrome (scope) and in any same-origin iframe.
const metrics = async (p, scope) => {
  const top = await p.evaluate(`(${scan.toString()})(${JSON.stringify(scope || null)})`);
  const frames = [];
  for (const f of p.frames().slice(1)) { try { frames.push({ url: f.url().replace(/^.*\/\/[^/]+/, '').slice(0, 40), ...(await f.evaluate(`(${scan.toString()})(null)`)) }); } catch {} }
  return { chrome: top, frames };
};
async function shot(p, name, vp, errors, scope) {
  await p.waitForTimeout(3500);
  const m = await metrics(p, scope).catch(() => ({}));
  await p.screenshot({ path: `${OUT}/${name}-${vp.join('x')}.png` });
  console.log(JSON.stringify({ shot: name, vp: vp.join('x'), ...m, errors: errors.splice(0).slice(0, 3) }));
}
for (const vp of VPS) {
  if (ONLY.includes('work')) for (const id of WORK) {
    const c = await ctxFor(vp), p = await c.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    try {
      await p.goto(`${BASE}/work/`); await p.waitForSelector('.w-act, .w-go', { timeout: 20000 });
      const name = { focuslock: 'FocusLock', expense: 'Expense Tracker', basket: 'Basket', darksentinel: 'DarkSentinel', crisiswatch: 'CrisisWatch', fraud: 'F-Shield' }[id];
      const card = p.locator('.w-card, .w-row').filter({ hasText: new RegExp(name, 'i') }).first();
      await card.getByRole('button', { name: /try it/i }).first().click({ timeout: 8000 });
      await p.waitForSelector('[data-testid="work-demo"]', { timeout: 10000 });
      await shot(p, `work-${id}`, vp, errors, '.work-demo');
    } catch (e) { console.log(JSON.stringify({ shot: `work-${id}`, vp: vp.join('x'), fail: String(e).split('\n')[0].slice(0, 120) })); }
    await c.close();
  }
  for (const [kind, ids, route] of [['os', OS, a => `/#/os/${a}`], ['phone', PHONE, a => `/#/phone/${a}`]]) {
    if (!ONLY.includes(kind)) continue;
    for (const id of ids) {
      const c = await ctxFor(vp), p = await c.newPage(), errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
      try {
        await p.goto(BASE + route(id));
        await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1' || document.querySelector('[data-testid="deck"], .deck'), null, { timeout: 90000 }).catch(() => {});
        await shot(p, `${kind}-${id}`, vp, errors, kind === 'os' ? '.dhruv-os-screen' : '.phone-screen, .phone-presentation'); await p.waitForTimeout(kind === 'phone' ? 4000 : 2500);
        await p.screenshot({ path: `${OUT}/${kind}-${id}-${vp.join('x')}.png` });
      } catch (e) { console.log(JSON.stringify({ shot: `${kind}-${id}`, vp: vp.join('x'), fail: String(e).split('\n')[0].slice(0, 120) })); }
      await c.close();
    }
  }
}
await b.close();
