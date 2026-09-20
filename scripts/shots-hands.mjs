// Every hand grip in one session: rest, each held state, and a mid-reach frame,
// with wrist bend and pose printed for tuning. Writes scripts/shots/hands-*.png.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const ONLY = process.argv.slice(2);
// GPU=1 runs on the machine's real GPU (new headless + ANGLE D3D11) at the owner's 1536x864@1.25 laptop size.
const GPU = process.env.GPU === '1';
const b = await chromium.launch(GPU ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] } : {});
try {
  const p = await b.newPage(GPU ? { viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 } : { viewport: { width: 1440, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open'); });
  await p.goto(BASE + '/?sky=day'); await p.waitForTimeout(2500);
  await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
  const stage = () => p.locator('.workspace-stage');
const diag = async label => console.log(label, JSON.stringify(await p.evaluate(() => window.__v3test.hands())));
const shot = async name => { await p.waitForTimeout(150); await p.screenshot({ path: `scripts/shots/hands-${GPU ? 'gpu-' : ''}${name}.png` }); await diag(name); };
const button = name => p.getByRole('button', { name, exact: true });
const data = (k, v) => p.waitForFunction(([k, v]) => document.querySelector('.workspace-stage')?.dataset[k] === v, [k, v], { polling: 100, timeout: 20000 });
const mark = () => p.evaluate(() => { window.__oldTl = window.__v3test?.timeline(); });
// Crawl the action timeline to a fixed time for a deterministic mid-reach frame.
async function at(name, t) {
  await p.waitForFunction(() => { const tl = window.__v3test?.timeline(); return tl && tl !== window.__oldTl; }, null, { polling: 20 });
  await p.evaluate(t => { const tl = window.__v3test.timeline(); tl.timeScale(0.02); tl.seek(t); tl.play(); }, t);
  await p.waitForTimeout(250); await shot(name);
  await p.evaluate(() => { const tl = window.__v3test.timeline(); tl.timeScale(1); });
}
const want = n => !ONLY.length || ONLY.includes(n);
await shot('rest');
if (want('phone')) { await mark(); await button('PHONE').click(); await at('phone-reach', 0.5); await at('phone-lift', 1.6); await data('phoneState', 'zoomed'); await shot('phone-held'); await p.keyboard.press('Escape'); await data('phoneState', 'desk'); }
if (want('notebook')) { await mark(); await button('NOTEBOOK').click(); await at('notebook-pick', 0.65); await data('notebookState', 'reading'); await shot('notebook-held'); await p.keyboard.press('Escape'); await data('notebookState', 'desk'); }
if (want('pen')) {
  await mark(); await button('PEN').click(); await at('pen-pick', 0.6); await data('actionState', 'drawing'); await p.waitForTimeout(300);
  const c = await p.evaluate(() => window.__v3test.projectAnchor('notebook'));
  await p.mouse.move(c.x - 60, c.y - 30); await p.mouse.down(); for (let i = 0; i <= 12; i++) await p.mouse.move(c.x - 60 + i * 8, c.y - 30 + Math.sin(i / 2) * 20); await p.mouse.up();
  await shot('pen-drawing'); await p.keyboard.press('Escape'); await data('actionState', 'idle');
}
if (want('coffee')) { await mark(); await button('COFFEE').click(); await at('coffee-grab', 0.6); await at('coffee-sip', 2.0); await data('actionState', 'idle'); }

if (want('headphones')) { await mark(); await button('HEADPHONES').click(); await at('headphones-grab', 0.7); await data('actionState', 'idle'); await button('HEADPHONES').click(); await data('actionState', 'idle'); }
if (want('award')) { await mark(); await button('AWARD').click(); await at('award-pick', 0.6); await data('actionState', 'award-reading'); await shot('award-held'); await p.keyboard.press('Escape'); await data('actionState', 'idle'); }
if (want('resume')) { await mark(); await button('RESUME').click(); await at('resume-handle', 0.6); await at('resume-pick', 1.7); await data('actionState', 'resume-reading'); await shot('resume-held'); await p.keyboard.press('Escape'); await data('actionState', 'idle'); }
// The lamp's own camera fly races a timeline seek, so sample it on the clock instead.
if (want('lamp')) { await button('LAMP').click(); await p.waitForTimeout(1000); await shot('lamp-press'); await data('actionState', 'idle'); await button('LAMP').click(); await data('actionState', 'idle'); }
if (want('typing')) { await p.locator('.workspace-stage canvas').focus(); await p.keyboard.down('j'); await p.waitForTimeout(60); await shot('typing-press'); await p.keyboard.up('j'); }
console.log('errors', errors);
} finally {
  await b.close();
}
