// Rebuilds public/previews/focuslock.jpg and expense.jpg (1600x1000, 16:10) from the live demos.
// Needs a server with the built site: npm run build && npx vite preview --port 4199, then
//   BASE=http://localhost:4199 node scripts/capture-previews.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:4199';
const W = 1600, H = 1000, BG = '#ece7de';

const roundMask = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
// A screenshot (buffer) resized to width w, with rounded corners and a soft shadow, as { input, left, top } layers.
async function card(buf, w, h, r, left, top) {
  const body = await sharp(buf).resize(w, h, { fit: 'cover' }).composite([{ input: roundMask(w, h, r), blend: 'dest-in' }]).png().toBuffer();
  const pad = 60;
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}"><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter><rect x="${pad}" y="${pad + 14}" width="${w}" height="${h}" rx="${r}" fill="rgb(40,30,15)" fill-opacity="0.28" filter="url(#b)"/></svg>`);
  return [{ input: shadow, left: left - pad, top: top - pad }, { input: body, left, top }];
}
const backdrop = () => sharp({ create: { width: W, height: H, channels: 3, background: BG } });
const out = (img, name) => img.jpeg({ quality: 85, mozjpeg: true }).toFile(`public/previews/${name}.jpg`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// A phone screen from the work page's own demo panel.
async function openPhone(id, app) {
  await page.goto(`${BASE}/`); await page.waitForTimeout(1200);
  await page.locator(`#p-${id}`).scrollIntoViewIfNeeded();
  await page.locator(`#p-${id} button`, { hasText: 'Try it' }).first().click();
  await page.locator('.phone-screen').first().waitFor();
  if (app) await page.evaluate((a) => window.dispatchEvent(new CustomEvent('phone:open-app', { detail: { app: a } })), app);
  await page.waitForTimeout(2200);
}
const phoneShot = () => page.locator('.phone-screen').first().screenshot();

// FocusLock: desktop window (left) + Android screen (bottom right).
const desk = await (async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await p.goto(`${BASE}/apps/focuslock/`); await p.waitForTimeout(2500);
  const b = await p.screenshot(); await p.close(); return b;
})();
await openPhone('expense', 'focuslock');
const flPhone = await phoneShot();
{
  const dw = Math.round(W * 0.78), dh = Math.round(dw * 800 / 1280), ph = 560, pw = Math.round(ph * 390 / 772);
  const layers = [
    ...(await card(desk, dw, dh, 12, 56, Math.round((H - dh) / 2) - 30)),
    ...(await card(flPhone, pw, ph, 34, W - pw - 56, H - ph - 44)),
  ];
  await out(backdrop().composite(layers), 'focuslock');
}

// Expense Tracker: dashboard and transactions, side by side.
await openPhone('expense');
const exDash = await phoneShot();
await page.locator('.ps-full-app.is-active').getByText('Feed', { exact: true }).click(); await page.waitForTimeout(900);
const exTx = await phoneShot();
{
  const ph = Math.round(H * 0.85), pw = Math.round(ph * 390 / 772), gap = 70, left = Math.round((W - (pw * 2 + gap)) / 2), top = Math.round((H - ph) / 2);
  const layers = [...(await card(exDash, pw, ph, 36, left, top)), ...(await card(exTx, pw, ph, 36, left + pw + gap, top))];
  await out(backdrop().composite(layers), 'expense');
}
await browser.close();
