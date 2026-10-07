// Guided tour: full autopilot run and interruption. GPU=1 node scripts/verify-tour.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(process.env.GPU === '1' ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] } : {});
let failed = 0;
const record = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failed++; };
async function open() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
  await p.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
  await p.waitForTimeout(1000);
  return { p, errors };
}
const state = (p) => p.evaluate(() => ({
  caption: document.querySelector('[data-testid="tour-caption"] p')?.textContent || null,
  entrance: document.querySelector('.scan-root')?.dataset.entranceState,
  seated: document.querySelector('.scan-root')?.dataset.seated,
  phone: document.querySelector('.workspace-stage')?.dataset.phoneState,
  app: document.querySelector('.phone-screen')?.dataset.app,
  osWindows: [...(document.querySelector('iframe')?.contentDocument?.querySelectorAll('[id^=win-body-]') || [])].map(e => e.id.slice(9)).join(','),
  end: !!document.querySelector('[data-testid="tour-end"]'),
  step: document.querySelector('[data-testid="tour-caption"]')?.dataset.step ?? null,
  paused: document.querySelector('[data-testid="tour-caption"]')?.dataset.paused === 'true',
}));
{
  const { p, errors } = await open();
  await p.keyboard.press('4');
  const seen = [];
  // Each step's hold starts once its scene is in place, so a slow load
  // stretches the tour; sample until it ends.
  for (let t = 0; t < 110; t += 2) { await p.waitForTimeout(2000); seen.push({ t, ...(await state(p)) }); if (seen.at(-1).end) break; }
  const at = (fn) => seen.some(fn);
  record('tour seats the visitor', at(s => s.seated === 'true'));
  record('tour opens CrisisWatch in the OS', at(s => s.entrance === 'inside' && s.osWindows.includes('crisiswatch')));
  record('tour opens Fraud in the OS', at(s => s.osWindows.includes('fraud')));
  record('tour opens FocusLock on the phone', at(s => s.app === 'focuslock'));
  record('tour opens Expense on the phone', at(s => s.app === 'expense'));
  record('tour ends on Résumé · Contact · Recruiter', seen.at(-1).end, JSON.stringify(seen.at(-1)));
  await p.screenshot({ path: 'scripts/shots/tour-end.png' });
  record('tour no page errors', !errors.length, errors.join('; '));
  await p.close();
}
{
  const { p } = await open();
  await p.locator('[data-launchpad-action="tour"]').click();
  await p.waitForTimeout(9000);
  const before = await state(p);
  await p.screenshot({ path: 'scripts/shots/tour-caption.png' });
  await p.mouse.click(1300, 450);
  await p.waitForTimeout(9000);
  const after = await state(p);
  record('tour caption shows while running', !!before.caption, before.caption || '');
  record('a click pauses the tour on its step', after.paused && after.step === before.step && !after.end, JSON.stringify(after));
  await p.screenshot({ path: 'scripts/shots/tour-paused.png' });
  await p.locator('[data-testid="tour-pause"]').click();
  const resumed = await p.waitForFunction((from) => Number(document.querySelector('[data-testid="tour-caption"]')?.dataset.step) > Number(from), before.step, { timeout: 30000 }).then(() => true, () => false);
  record('resume carries on to the next step', resumed, JSON.stringify(await state(p)));
  await p.close();
}
{
  const { p } = await open();
  await p.locator('[data-launchpad-action="tour"]').click();
  await p.waitForTimeout(3000);
  await p.keyboard.press('Alt');
  await p.waitForTimeout(500);
  record('Alt (as in Alt-Tab) does not pause or end the tour', !(await state(p)).paused && !!(await state(p)).caption, JSON.stringify(await state(p)));
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(300);
  const hidden = await state(p);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(300);
  const shown = await state(p);
  record('a hidden page pauses the tour and showing it resumes', hidden.paused && !shown.paused, JSON.stringify({ hidden: hidden.paused, shown: shown.paused }));
  const from = Number(shown.step);
  await p.getByRole('button', { name: 'Next step' }).click();
  const next = await p.waitForFunction((n) => Number(document.querySelector('[data-testid="tour-caption"]')?.dataset.step) === n, from + 1, { timeout: 10000 }).then(() => true, () => false);
  await p.getByRole('button', { name: 'Previous step' }).click();
  const prev = await p.waitForFunction((n) => Number(document.querySelector('[data-testid="tour-caption"]')?.dataset.step) === n, from, { timeout: 10000 }).then(() => true, () => false);
  record('Next and Previous move one step', next && prev, JSON.stringify(await state(p)));
  await p.getByRole('button', { name: 'Exit tour' }).click();
  record('Exit ends the tour', !(await state(p)).caption);
  await p.close();
}
await b.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
