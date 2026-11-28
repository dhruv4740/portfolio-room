// ============================================================================
// Ask panel motion trace (hero variant on the work page).
// Clicks "Why hire Dhruv?", logs the panel rect every frame for open (2 s) and close via Escape (1 s), then prints
// pass/fail for the two motion rules, the cancelled-animation count and the longest size plateau. Also checks that Back
// closes the panel in one press. Frame rows go to .claude/trace/ as CSV.
//
// Usage: BASE=http://localhost:8811 node scripts/trace-ask-motion.mjs [WxH ...]    (default 1024x768 390x844)
//   DELAY=2000  simulates a slow model answer (POST /api/ask held that long)
//   REDUCED=1   runs with prefers-reduced-motion: reduce (open and close must be quick and instant, Back still works)
//   SHOTS=1     also saves r23b-*.png (mid-open, open, open with "hi", mid-close, just landed) in .claude/shots/
// Row format: [ms, left, top, width, height, cardOpacity, colOpacity, heroTextOpacity, state, heroCardVisible, edgeDistanceToHeroCard]
// ============================================================================
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8811';
const DELAY = +process.env.DELAY || 0;
const SHOTS = !!process.env.SHOTS, REDUCED = !!process.env.REDUCED;
const pageErrors = [];
const sizes = process.argv.slice(2).filter((a) => /^\d+x\d+$/.test(a));
if (!sizes.length) sizes.push('1024x768', '390x844');
const OUT = new URL('../.claude/trace/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SHOT_DIR = new URL('../.claude/shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(OUT, { recursive: true }); mkdirSync(SHOT_DIR, { recursive: true });

let fails = 0;
const verdict = (name, ok, detail = '') => { if (!ok) fails++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`); };

// Counts animations created / cancelled (and cancelled while still running) from page load on.
const INIT = () => {
  window.__an = { created: 0, cancelled: 0, running: 0 };
  const an = Element.prototype.animate; Element.prototype.animate = function (...a) { window.__an.created++; return an.apply(this, a); };
  const c = Animation.prototype.cancel; Animation.prototype.cancel = function () { if (this.playState !== 'idle') { window.__an.cancelled++; if (this.playState === 'running') window.__an.running++; } return c.call(this); };
  window.__rows = []; window.__t0 = 0; window.__rec = true;
  const f = () => {
    if (window.__t0) {
      const card = document.getElementById('ask-card'), col = card?.querySelector('.col');
      if (card && getComputedStyle(card).display !== 'none') {
        const r = card.getBoundingClientRect(), k = document.querySelector('.h-ask')?.firstElementChild, from = document.querySelector('.h-glow'), fr = from.getBoundingClientRect(), fs = getComputedStyle(from);
        const fromVis = fs.visibility === 'hidden' ? 0 : +fs.opacity, dist = Math.max(Math.abs(r.left - fr.left), Math.abs(r.top - fr.top), Math.abs(r.right - fr.right), Math.abs(r.bottom - fr.bottom));
        window.__rows.push([+(performance.now() - window.__t0).toFixed(1), +r.left.toFixed(2), +r.top.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2),
          +(+getComputedStyle(card).opacity).toFixed(3), +(+getComputedStyle(col).opacity).toFixed(3), k ? +(+getComputedStyle(k).opacity).toFixed(3) : -1, card.dataset.heroState || '', fromVis, +dist.toFixed(2)]);
      } else if (window.__rows.length) window.__rows.push([+(performance.now() - window.__t0).toFixed(1), 0, 0, 0, 0, 0, 0, 0, 'gone', 1, 0]);
    }
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};

const chipOf = (page) => page.locator('button.h-chip', { hasText: 'Why hire Dhruv?' });
async function loadPage(browser, w, h) {
  const phone = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(REDUCED ? { reducedMotion: 'reduce' } : {}), ...(phone ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.addInitScript(INIT);
  if (DELAY) await page.route('**/api/ask', async (route) => { if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, DELAY)); await route.continue(); });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await chipOf(page).waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500); // entrance motion + the panel's lazy mount
  return { ctx, page, phone };
}

// Longest stretch inside the open where the box stays within 1 px of where the stretch started (width and height), measured
// between the first and the last frame of the stretch. Only the part between the first real movement and the last real
// movement counts, so the wait before the click lands and the final settle are not plateaus.
function plateau(rows, t0, t1, answerAt) {
  const s = rows.filter((r) => r[0] >= t0 && r[0] <= t1 && r[3] > 0), dev = (a, b) => Math.max(Math.abs(a[3] - b[3]), Math.abs(a[4] - b[4]));
  if (s.length < 3) return { ms: 0, from: 0, to: 0, waitingOnAnswer: false };
  const a = s.findIndex((r) => dev(r, s[0]) > 1), z = s.length - 1 - [...s].reverse().findIndex((r) => dev(r, s.at(-1)) > 1);
  let best = { ms: 0, from: 0, to: 0 };
  for (let i = Math.max(a - 1, 0); i < z; i++) {
    let j = i; while (j + 1 <= z && dev(s[j + 1], s[i]) <= 1) j++;
    if (j > i && s[j][0] - s[i][0] > best.ms) best = { ms: s[j][0] - s[i][0], from: s[i][0], to: s[j][0] };
  }
  return { ...best, waitingOnAnswer: answerAt != null && best.ms > 0 && answerAt >= best.from - 50 && answerAt <= best.to + 150 };
}

// prefers-reduced-motion keeps the instant behaviour: the box is at its open rect within a couple of frames, the close is a 120 ms fade.
async function reducedChecks(page, ctx, openRows, finalH) {
  const flat = openRows.filter((r) => r[3] > 0), tOpen = flat.find((r) => Math.abs(r[3] - flat.at(-1)[3]) < 1 && r[8] === 'open')?.[0];
  if (process.env.DUMP) console.log(flat.slice(0, 14).map((r) => r.slice(0, 9).join(',')).join(String.fromCharCode(10)));
  console.log(`  reduced: open rect reached at ${tOpen} ms, final height ${finalH}`);
  verdict('rule 5: reduced motion opens instantly (<= 100 ms)', tOpen != null && tOpen <= 100, `${tOpen} ms`);
  await page.evaluate(() => { window.__rows.length = 0; window.__t0 = performance.now(); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  const rows = await page.evaluate(() => window.__rows.slice()), gone = rows.find((r) => r[8] === 'gone')?.[0];
  console.log(`  reduced: close finished at ${gone} ms`);
  verdict('rule 5: reduced motion closes in about 120 ms (<= 220 ms)', gone != null && gone <= 220, `${gone} ms`);
  await ctx.close();
}

async function trace(browser, w, h) {
  console.log(`\n== ${w}x${h}${DELAY ? ` (answer delayed ${DELAY} ms)` : ''}`);
  const { ctx, page, phone } = await loadPage(browser, w, h);
  const tag = `${w}x${h}${DELAY ? '-slow' : ''}`;
  await page.evaluate(() => { window.__an.created = window.__an.cancelled = window.__an.running = 0; });
  // Open: stamp t0 on the click itself, so frame 0 is the click.
  await chipOf(page).evaluate((el) => el.addEventListener('click', () => { window.__t0 = performance.now(); window.__rows.length = 0; }, { capture: true, once: true }));
  const clicked = phone ? chipOf(page).tap() : chipOf(page).click();
  await clicked;
  if (SHOTS) { await page.waitForTimeout(110); await page.screenshot({ path: `${SHOT_DIR}r23b-${tag}-1-mid-open.png` }); await page.waitForTimeout(1890 - 110 + DELAY); } else await page.waitForTimeout(2000 + DELAY);
  const open = await page.evaluate(() => ({ rows: window.__rows.slice(), an: { ...window.__an } }));
  const openRows = open.rows;
  const finalH = openRows.at(-1)?.[4];
  if (REDUCED) return reducedChecks(page, ctx, openRows, finalH);
  const pl = plateau(openRows, 0, 2000 + DELAY, DELAY ? DELAY + 120 : null);
  const flat = openRows.filter((r) => r[3] > 0);
  const t = (pred) => flat.find(pred)?.[0];
  const tW = t((r) => Math.abs(r[3] - flat.at(-1)[3]) < 1), tH = t((r) => Math.abs(r[4] - finalH) < 1);
  console.log(`  open: final ${flat.at(-1)?.[3]}x${finalH}, width done ${tW} ms, height done ${tH} ms, frames ${flat.length}`);
  console.log(`  open: animations created ${open.an.created}, cancelled ${open.an.cancelled} (while running ${open.an.running})`);
  console.log(`  open: longest size plateau ${pl.ms.toFixed(0)} ms${pl.ms ? ` (${pl.from.toFixed(0)}-${pl.to.toFixed(0)} ms)` : ''}${pl.waitingOnAnswer ? ' - waiting for the delayed answer' : ''}`);
  verdict('rule 1: open is one continuous motion (no plateau >= 60 ms)', pl.ms < 60 || pl.waitingOnAnswer, pl.waitingOnAnswer ? 'only pause is the wait for the delayed answer' : '');
  verdict('rule 1b: no cancel-and-restart chain (cancelled while running <= 2)', open.an.running <= 2, `${open.an.running} cancelled while running`);
  const fw = flat.at(-1)[3], clipped = flat.filter((r) => r[6] > 0.15 && r[3] < 0.92 * fw);
  verdict('rule 2: text column opacity > 0.15 only once width >= 92% of final', clipped.length === 0, clipped.length ? `${clipped.length} frames, first at ${clipped[0][0]} ms (width ${clipped[0][3]} of ${fw})` : `column first > 0.15 at ${flat.find((r) => r[6] > 0.15)?.[0]} ms`);
  if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}r23b-${tag}-2-open-why-hire.png` });
  writeFileSync(`${OUT}open-${tag}.csv`, 'ms,left,top,width,height,cardOpacity,colOpacity,heroTextOpacity,state,fromVisible,dist\n' + openRows.map((r) => r.join(',')).join('\n'));

  // Close with Escape.
  await page.evaluate(() => { window.__an.created = window.__an.cancelled = window.__an.running = 0; });
  const fromBefore = await page.evaluate(() => document.querySelector('.h-glow').getBoundingClientRect().toJSON());
  await page.evaluate(() => { window.__rows.length = 0; window.__t0 = performance.now(); });
  await page.keyboard.press('Escape');
  if (SHOTS) { await page.waitForTimeout(160); await page.screenshot({ path: `${SHOT_DIR}r23b-${tag}-4-mid-close.png` }); await page.waitForTimeout(80); await page.screenshot({ path: `${SHOT_DIR}r23b-${tag}-5-just-landed.png` }); await page.waitForTimeout(760); } else await page.waitForTimeout(1000);
  const close = await page.evaluate(() => ({ rows: window.__rows.slice(), an: { ...window.__an } }));
  const cr = close.rows.filter((r) => r[8] !== 'gone' && r[3] > 0);
  const both = cr.filter((r) => r[9] > 0.05 && r[5] > 0.05), maxBoth = both.reduce((m, r) => Math.max(m, r[10]), 0);
  const goneAt = close.rows.find((r) => r[8] === 'gone')?.[0];
  const last = cr.at(-1), dx = last ? Math.max(Math.abs(last[1] - fromBefore.x), Math.abs(last[2] - fromBefore.y), Math.abs(last[3] - fromBefore.width), Math.abs(last[4] - fromBefore.height)) : NaN;
  console.log(`  close: frames ${cr.length}, panel gone at ${goneAt} ms, frames with both hero card and panel visible ${both.length} (max edge distance ${maxBoth.toFixed(1)} px), cancelled ${close.an.cancelled}`);
  console.log(`  close: last frame vs hero card rect max delta ${dx.toFixed(1)} px (last frame ${last ? last.slice(0, 5).join(',') : '-'})`);
  verdict('rule 3: one surface (hero card and panel both visible only within 6 px on every edge)', maxBoth <= 6, `${both.length} shared frames, max ${maxBoth.toFixed(1)} px`);
  verdict('rule 3c: close total <= 400 ms (panel gone)' + (SHOTS ? ' [screenshots slow the frames, not enforced]' : ''), SHOTS || (goneAt != null && goneAt <= 400), `${goneAt} ms`);
  verdict('rule 3b: shape lands on the hero card rect (<= 2 px on the last frame)', dx <= 2, `${dx.toFixed(1)} px`);
  writeFileSync(`${OUT}close-${tag}.csv`, 'ms,left,top,width,height,cardOpacity,colOpacity,heroTextOpacity,state,fromVisible,dist\n' + close.rows.map((r) => r.join(',')).join('\n'));
  await ctx.close();
}

// Back: one press closes the panel, the next leaves the page. Escape and the scrim click also close it; Back then leaves.
async function backTest(browser, w, h) {
  console.log(`\n== Back at ${w}x${h}`);
  let bad = 0;
  for (const how of ['back', 'back', 'back', 'escape', 'scrim']) {
    const phone = w < 700, ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(REDUCED ? { reducedMotion: 'reduce' } : {}), ...(phone ? { hasTouch: true, isMobile: true } : {}) });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto('about:blank'); await page.goto(BASE + '/', { waitUntil: 'load' }); await chipOf(page).waitFor({ timeout: 30000 }); await page.waitForTimeout(2000);
    await (phone ? chipOf(page).tap() : chipOf(page).click()); await page.waitForTimeout(1500);
    const st = () => page.evaluate(() => ({ url: location.href, state: document.getElementById('ask-card').dataset.heroState || 'closed', ask: !!history.state?.askOpen }));
    const s0 = await st();
    if (how === 'escape') await page.keyboard.press('Escape'); else if (how === 'scrim') await (phone ? page.touchscreen.tap(3, 3) : page.mouse.click(3, 3));
    else await page.evaluate(() => history.back());
    await page.waitForTimeout(900);
    const s1 = await st();
    let ok = s0.state === 'open' && s1.state === 'closed' && s1.url === s0.url;
    // The next Back must leave the page (back to about:blank), not stay.
    await page.evaluate(() => history.back()).catch(() => {}); await page.waitForTimeout(1200);
    const left = page.url() === 'about:blank';
    ok = ok && left;
    if (!ok) bad++;
    console.log(`  ${how}: before ${s0.state}, after first close ${s1.state}, then Back -> ${page.url()}`);
    await ctx.close();
  }
  verdict('rule 4: one Back closes, the next Back leaves (also Escape and scrim click)', bad === 0, `${bad} bad of 5`);
}

// Gated greeting: after the answer the panel hugs its content (no tall empty band).
async function hiTest(browser, w, h) {
  console.log(`\n== "hi" at ${w}x${h}`);
  const { ctx, page, phone } = await loadPage(browser, w, h);
  await page.locator('#h-ask-q').fill('hi'); await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  const h0 = 0;
  const h1 = (await page.locator('#ask-card').boundingBox()).height, answered = await page.locator('.ask-a').last().innerText();
  const band = await page.evaluate(() => { const t = document.querySelector('#ask-card .ask-thread'), k = t.lastElementChild; return t.clientHeight - (k.offsetTop + k.offsetHeight); });
  console.log(`  panel ${h1.toFixed(0)} px after the greeting answer (floor ${phone ? 320 : 360}); empty band under the last bubble ${band} px; answer: ${answered.slice(0, 40).replace(/\s+/g, ' ')}`);
  verdict('rule 6: after the answer the panel hugs content (empty band under the last bubble <= 24 px)', band <= 24 && h1 >= (phone ? 320 : 360) - 1, `${band} px band, ${h1.toFixed(0)} px tall`);
  if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}r23b-${w}x${h}-3-open-hi.png` });
  await ctx.close();
}

// Turnstile pending (token takes 3 s, widget turns interactive): the question bubble and thinking dots show at once and the note line appears.
async function tokenTest(browser, w, h) {
  console.log(`\n== Turnstile pending at ${w}x${h}`);
  const phone = w < 700;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(phone ? { hasTouch: true, isMobile: true } : {}) });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.route('**/api/ask', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { llm: true, turnstileSiteKey: 'stub' } });
    return route.fulfill({ json: { answer: 'Stub answer.', provider: 'stub' } });
  });
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ contentType: 'text/javascript', body: `
    window.turnstile = { render(el, o) { const d = document.createElement('div'); d.style.cssText = 'width:300px;height:65px;background:#333;margin-top:8px'; d.textContent = 'stub widget'; el.appendChild(d); setTimeout(() => o['before-interactive-callback']?.(), 50); window.__tsT = performance.now(); return 'w1'; },
      getResponse() { return performance.now() - window.__tsT > 3500 ? 'tok' : ''; }, reset() {} };` }));
  await page.goto(BASE + '/', { waitUntil: 'load' }); await chipOf(page).waitFor({ timeout: 30000 }); await page.waitForTimeout(2500);
  await (phone ? chipOf(page).tap() : chipOf(page).click()); await page.waitForTimeout(1200);
  await page.locator('#ask-card input[type=text]').first().fill('Why hire Dhruv?');
  const t0 = Date.now(); await page.keyboard.press('Enter');
  await page.locator('.ask-q').first().waitFor({ timeout: 2000 });
  const dt = Date.now() - t0;
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => { const c = document.getElementById('ask-card').getBoundingClientRect(), b = document.querySelector('.ask-q').getBoundingClientRect(), n = document.querySelector('.ask-note'), dots = !!document.querySelector('.ask-dots');
    return { inside: b.height > 8 && b.top >= c.top && b.bottom <= c.bottom, note: n && !n.hidden && getComputedStyle(n).display !== 'none' ? n.textContent : '', dots, bubble: Math.round(b.height) }; });
  if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}r23b-${w}x${h}-6-token-pending.png` });
  console.log(`  bubble after ${dt} ms, bubble height ${info.bubble}, inside card ${info.inside}, dots ${info.dots}, note "${info.note}"`);
  verdict('rule 7: question bubble within 100 ms of submit while the token is pending', dt <= 100, `${dt} ms`);
  verdict('rule 7b: bubble fully visible inside the card, thinking dots shown', info.inside && info.dots);
  verdict('rule 7c: note line shown', info.note === 'Cloudflare wants a quick check first.', info.note);
  await ctx.close();
}

const browser = await chromium.launch();
try {
  for (const s of sizes) { const [w, h] = s.split('x').map(Number); await trace(browser, w, h); if (!DELAY && !SHOTS && !REDUCED) await backTest(browser, w, h); if (!DELAY && !REDUCED) { await hiTest(browser, w, h); await tokenTest(browser, w, h); } }
} finally { await browser.close(); }
verdict('no page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
