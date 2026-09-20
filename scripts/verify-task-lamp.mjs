// Focused acceptance for the authored task lamp: switch on/off, failed-load
// fallback and unmount. shots-after-hours covers none of these.
// Measures mean luminance of the desk region under the lamp from real frames;
// it is a pixel check, not a photometric one.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const watchdog = setTimeout(() => { console.error('Lamp flow exceeded 120 seconds'); b.close().finally(() => process.exit(1)); }, 120000);

// Desk left of the keyboard, under the lamp, in the seated framing
// (fractions of the frame). FRAME is the whole image, as a control.
const POOL = { x0: 0.02, x1: 0.22, y0: 0.55, y1: 0.80 };
const FRAME = { x0: 0, x1: 1, y0: 0, y1: 1 };
// Right of the mat, out of the 0.55 m spot cone: cancels idle camera drift,
// which moves whole-frame luminance by a few levels between captures.
const CONTROL = { x0: 0.76, x1: 0.94, y0: 0.55, y1: 0.80 };
// No image decoder is installed; decode the PNG in a blank browser page.
const decoder = await b.newPage();
const luma = async (file, r) => {
  const data = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
  return decoder.evaluate(async ([src, rect]) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const x0 = Math.floor(rect.x0 * img.width), y0 = Math.floor(rect.y0 * img.height);
    const w = Math.floor((rect.x1 - rect.x0) * img.width), h = Math.floor((rect.y1 - rect.y0) * img.height);
    const d = ctx.getImageData(x0, y0, w, h).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return +(sum / (d.length / 4)).toFixed(2);
  }, [data, r]);
};

// Where does the lamp actually change pixels? Bounding box of pixels that
// differ by more than `tol` levels, as fractions of the frame.
const diffBox = async (fileA, fileB, tol = 6) => {
  const a = `data:image/png;base64,${fs.readFileSync(fileA).toString('base64')}`;
  const b2 = `data:image/png;base64,${fs.readFileSync(fileB).toString('base64')}`;
  return decoder.evaluate(async ([srcA, srcB, t]) => {
    const load = async src => { const i = new Image(); i.src = src; await i.decode(); return i; };
    const [ia, ib] = [await load(srcA), await load(srcB)];
    const px = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const [da, db] = [px(ia), px(ib)];
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d <= t) continue;
      const p = i >> 2, x = p % ia.width, y = (p / ia.width) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; n++;
    }
    if (n === 0) return { changed: 0 };
    return { changed: n, pct: +(100 * n / (da.length / 4)).toFixed(2),
      x0: +(x0 / ia.width).toFixed(3), x1: +(x1 / ia.width).toFixed(3),
      y0: +(y0 / ia.height).toFixed(3), y1: +(y1 / ia.height).toFixed(3) };
  }, [a, b2, tol]);
};

const open = async (block) => {
  const page = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  if (block) await page.route('**/models/after-hours/desk-lamp.glb', r => r.abort());
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'mid');
    sessionStorage.setItem('v3:arrival-seen', '1'); sessionStorage.setItem('v3:controls', 'open');
  });
  await page.goto(`${BASE}/?sky=night`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => ['ready', 'fallback'].includes(document.querySelector('.workspace-stage')?.dataset.taskLamp), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '.telemetry-root{display:none!important}' });
  return { page, errors };
};

const result = {};
try {
  // 1. Authored lamp, switch on then off.
  {
    const { page, errors } = await open(false);
    result.status = await page.locator('.workspace-stage').evaluate(e => e.dataset.taskLamp);
    await page.screenshot({ path: 'scripts/shots/lamp-overview-on.png' });
    // The LAMP switch lives on the seated object bar.
    await page.locator('[data-launchpad-action="explore-room"]').click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'scripts/shots/lamp-on.png' });
    await page.getByRole('button', { name: 'LAMP', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.lampOn === '0', null, { timeout: 10000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: 'scripts/shots/lamp-off.png' });
    await page.getByRole('button', { name: 'LAMP', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.lampOn === '1', null, { timeout: 10000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: 'scripts/shots/lamp-back-on.png' });
    result.on = await luma('scripts/shots/lamp-on.png', POOL);
    result.off = await luma('scripts/shots/lamp-off.png', POOL);
    result.backOn = await luma('scripts/shots/lamp-back-on.png', POOL);
    result.frameOn = await luma('scripts/shots/lamp-on.png', FRAME);
    result.frameOff = await luma('scripts/shots/lamp-off.png', FRAME);
    // Drift-corrected: pool region minus an unlit control region.
    const rel = async f => +((await luma(f, POOL)) - (await luma(f, CONTROL))).toFixed(2);
    result.relOn = await rel('scripts/shots/lamp-on.png');
    result.relOff = await rel('scripts/shots/lamp-off.png');
    result.relBackOn = await rel('scripts/shots/lamp-back-on.png');
    result.lampAffects = await diffBox('scripts/shots/lamp-on.png', 'scripts/shots/lamp-off.png', 30);
    // 3. Unmount: WORK tears the stage down; dispose() must not throw.
    await page.evaluate(() => { location.hash = '#/work'; });
    await page.waitForTimeout(1500);
    result.afterUnmount = await page.evaluate(() => !!document.querySelector('.workspace-stage'));
    result.errors = errors;
    await page.close();
  }
  // 2. Failed load: fallback lamp and the additive pool decal must come back.
  {
    const { page, errors } = await open(true);
    result.blockedStatus = await page.locator('.workspace-stage').evaluate(e => e.dataset.taskLamp);
    await page.locator('[data-launchpad-action="explore-room"]').click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'scripts/shots/lamp-fallback.png' });
    result.fallbackLuma = await luma('scripts/shots/lamp-fallback.png', POOL);
    // A warn is expected here; only real errors count.
    result.blockedErrors = errors.filter(e => !/desk-lamp\.glb|ERR_FAILED|Failed to load resource/i.test(e));
    await page.close();
  }
  console.log(JSON.stringify(result, null, 2));
  const bad = result.status !== 'ready' || result.blockedStatus !== 'fallback'
    || result.errors.length || result.blockedErrors.length
    || !(result.relOn > result.relOff + 2) || !(result.relBackOn > result.relOff + 2) || result.afterUnmount;
  if (bad) { console.error('LAMP ACCEPTANCE FAILED'); process.exitCode = 1; }
} finally {
  clearTimeout(watchdog);
  await b.close();
}
