// Real project UIs inside dhruvOS: each iframe app opens in a window, its
// document renders from /apps/<name>/, in-app navigation works, and nothing
// leaves the origin (fonts.googleapis excepted) or errors.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const origin = new URL(BASE).origin;
const APPS = [
  // Landing page → manual console → Threat Feed tab: three real screens, two of them fed by the fixture router.
  { icon: 'DarkSentinel', path: '/apps/darksentinel/', ready: 'h1', expectText: /Autonomous Dark Web Threat Intelligence/, steps: [
    { button: 'Launch Manual Mode', expect: /MANUAL INTELLIGENCE CONSOLE/ },
    { button: 'System Status', expect: /PostgreSQL/ }, // fed by the health fixture
  ] },
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], external = [], failed = [];
p.on('pageerror', e => errors.push(e.message));
p.on('requestfailed', r => failed.push(r.url()));
p.on('request', r => { const u = r.url(); if (!u.startsWith(origin) && !u.startsWith('data:') && !/fonts\.g(oogleapis|static)\.com/.test(u)) external.push(u); });
await p.goto(`${BASE}/os/embed.html?embed=1`);
await p.locator('.desk-icon').first().waitFor({ timeout: 15000 }); await p.waitForTimeout(800);
for (const close of await p.locator('.os-window [data-close]').all()) await close.click().catch(() => {});
for (const app of APPS) {
  await p.locator('.desk-icon').filter({ hasText: app.icon }).first().dblclick();
  const win = p.locator('.os-window').filter({ hasText: app.icon }).last(); await win.waitFor();
  const frame = win.locator('iframe'); await frame.waitFor();
  const src = await frame.getAttribute('src'); assert.equal(src, app.path, `${app.icon}: iframe src`);
  const box = await win.boundingBox(); console.log(`[${app.icon}] window ${Math.round(box.width)}x${Math.round(box.height)}`);
  const f = await (await frame.elementHandle()).contentFrame(); // a Frame: evaluate/waitForFunction work on it
  // Headless SwiftShader does not reliably paint a nested iframe, so the checks are on text, not visibility;
  // the visual proof is scripts/shots/real-*.png taken on the real GPU (see docs/HANDOFF.md).
  await f.waitForFunction(re => new RegExp(re).test(document.body.innerText), app.expectText.source, { timeout: 20000, polling: 300 }); // interval polling: rAF may not tick in an unpainted headless iframe
  const text = await f.locator('body').innerText();
  // Static export: the HTML is there before React hydrates; clicks before that do nothing.
  await f.waitForFunction(() => { const b = document.querySelector('button'); return !!b && Object.keys(b).some(k => k.startsWith('__react')); }, null, { timeout: 20000, polling: 300 });
  assert.match(text, app.expectText, `${app.icon}: app text`);
  const minFont = await f.locator('body').evaluate(body => { let min = 99; for (const el of body.querySelectorAll('p,span,a,td,th,li,button,h1,h2,h3,h4,label,div')) { if (!el.textContent.trim() || el.children.length) continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; min = Math.min(min, parseFloat(getComputedStyle(el).fontSize)); } return min; });
  console.log(`[${app.icon}] smallest visible text ${minFont}px`);
  await p.screenshot({ path: `scripts/shots/real-${app.icon.toLowerCase()}-home.png`, clip: box });
  for (const [i, step] of (app.steps || []).entries()) {
    // Real pointer events: some controls are framer-motion buttons that listen to pointer, not click.
    await f.locator('button').filter({ hasText: step.button }).first().click({ force: true });
    try { await f.waitForFunction(re => new RegExp(re).test(document.body.innerText), step.expect.source, { timeout: 10000, polling: 300 }); }
    catch (e) { console.log(`[${app.icon}] after "${step.button}" the frame shows: ${(await f.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 240)}`); throw e; }
    const after = await f.locator('body').innerText(); assert.match(after, step.expect, `${app.icon}: after "${step.button}"`);
    console.log(`[${app.icon}] "${step.button}" ok`);
    await p.screenshot({ path: `scripts/shots/real-${app.icon.toLowerCase()}-step${i + 1}.png`, clip: box });
  }
  await win.locator('[data-close]').click(); await p.waitForTimeout(300);
  assert.equal(await win.count(), 0, `${app.icon}: window closed`);
}
console.log('errors', errors); console.log('failed', failed); console.log('external', external);
assert.equal(errors.length, 0); assert.equal(external.length, 0);
console.log('PASS verify-real-apps'); await b.close();
