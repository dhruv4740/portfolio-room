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
  await p.goto(`${BASE}/#/`);
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
}));
{
  const { p, errors } = await open();
  await p.keyboard.press('6');
  const seen = [];
  for (let t = 0; t < 62; t += 2) { await p.waitForTimeout(2000); seen.push({ t, ...(await state(p)) }); }
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
  record('a click interrupts the tour', !after.caption && !after.end, JSON.stringify(after));
  await p.close();
}
await b.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
