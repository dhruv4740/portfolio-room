// Deep links and the Ctrl+K palette. GPU=1 BASE=http://localhost:4173 node scripts/verify-deeplinks.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(process.env.GPU === '1' ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] } : {});
let failed = 0;
const record = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failed++; };
async function fresh(hash) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
  await p.goto(`${BASE}/#${hash}`);
  return { p, ctx, errors };
}
const osWindow = (p, app) => p.waitForFunction((app) => {
  const f = document.querySelector('iframe'); const d = f?.contentDocument;
  return document.querySelector('.scan-root')?.dataset.entranceState === 'inside' && !!d?.querySelector(`#win-${app}, [data-app-id="${app}"], #win-body-${app}`);
}, app, { timeout: 30000 }).then(() => true, () => false);

{ const { p, ctx, errors } = await fresh('/os/fraud');
  record('/os/fraud opens the OS with the fraud window', await osWindow(p, 'fraud'));
  record('/os/fraud URL returns to /', await p.evaluate(() => location.hash) === '#/');
  record('/os/fraud no page errors', !errors.length, errors.join('; ')); await ctx.close(); }
{ const { p, ctx, errors } = await fresh('/phone/expense');
  const ok = await p.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'expense', null, { timeout: 30000 }).then(() => true, () => false);
  record('/phone/expense opens the Expense app on the phone', ok);
  record('/phone/expense no page errors', !errors.length, errors.join('; ')); await ctx.close(); }
{ const { p, ctx, errors } = await fresh('/os/projects');
  record('/os/projects opens the projects window', await osWindow(p, 'projects'));
  await p.frameLocator('[data-testid="dhruv-os-frame"]').locator('.ql-card', { hasText: 'Expense Tracker' }).locator('.ql-demo').click();
  const ok = await p.waitForFunction(() => document.querySelector('.phone-screen')?.dataset.app === 'expense', null, { timeout: 30000 }).then(() => true, () => false);
  record('projects "Open on the phone" leaves the OS and opens Expense on the phone', ok);
  record('projects → phone no page errors', !errors.length, errors.join('; ')); await ctx.close(); }
{ const { p, ctx } = await fresh('/about');
  record('/about opens the About panel', await p.locator('[data-testid="about-panel"]').waitFor({ timeout: 30000 }).then(() => true, () => false)); await ctx.close(); }
{ const { p, ctx } = await fresh('/contact');
  record('/contact opens the contact panel', await p.waitForFunction(() => !!document.querySelector('.anchor-marker.is-active[data-object="window"]') || /contact/i.test(document.querySelector('[role="dialog"], .anchor-panel')?.textContent || ''), null, { timeout: 30000 }).then(() => true, () => false)); await ctx.close(); }
{ const { p, ctx, errors } = await fresh('/');
  await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
  await p.keyboard.press('Control+k');
  const opened = await p.locator('[data-testid="command-palette"]').waitFor({ timeout: 5000 }).then(() => true, () => false);
  record('Ctrl+K opens the palette', opened);
  await p.keyboard.type('crisis');
  await p.keyboard.press('Enter');
  record('palette "crisis" + Enter opens CrisisWatch', await osWindow(p, 'crisiswatch'));
  record('palette run no page errors', !errors.length, errors.join('; '));
  await ctx.close(); }
await b.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
