// Measures wall luminance and highlight clipping per sky state, seated and orbit.
// Usage: BASE=http://localhost:4174 node scripts/measure-sky.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4174';
// Left wall above the lamp, seated view. Confirmed on sky-seated-day.png.
const RECT = { xMin: 0.05, xMax: 0.22, yMin: 0.30, yMax: 0.55 };
// Keyboard in the seated view, for the screen-spill hot spot.
const KEYBOARD = { xMin: 0.05, xMax: 0.8, yMin: 0.52, yMax: 0.76 };

// Screenshots (compositor output) are analyzed rather than reading the live
// WebGL canvas directly: without preserveDrawingBuffer, getImageData on the
// canvas after presentation can read back blank.
async function measure(page, rect = RECT) {
  const base64 = (await page.screenshot()).toString('base64');
  return page.evaluate(({ dataUrl, rect }) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = img.naturalWidth; off.height = img.naturalHeight;
      const ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const x0 = Math.floor(rect.xMin * off.width), x1 = Math.floor(rect.xMax * off.width);
      const y0 = Math.floor(rect.yMin * off.height), y1 = Math.floor(rect.yMax * off.height);
      const { data } = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
      let lumSum = 0, clipped = 0, total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (data[i] >= 250 || data[i + 1] >= 250 || data[i + 2] >= 250) clipped++;
        total++;
      }
      resolve({ wall: lumSum / total, clipped: clipped / total });
    };
    img.src = dataUrl;
  }), { dataUrl: `data:image/png;base64,${base64}`, rect });
}

async function main() {
  const browser = await chromium.launch();
  const results = {};
  for (const skyState of ['night', 'dusk', 'day']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('v3:surface-override', 'scan');
      localStorage.setItem('v3:seen-intro', '1');
    });
    await page.goto(`${BASE}/?sky=${skyState}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.workspace-stage');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `scripts/shots/sky-orbit-${skyState}.png` });
    await page.locator('[data-object="chair"]').click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `scripts/shots/sky-seated-${skyState}.png` });
    const { wall, clipped } = await measure(page);
    const keyboardClipped = (await measure(page, KEYBOARD)).clipped;
    results[skyState] = { wall, clipped, keyboardClipped };
    console.log(JSON.stringify({ skyState, wall, clipped, keyboardClipped, errors }));
    await page.close();
  }
  await browser.close();
  return results;
}

main().catch((err) => { console.error(err); process.exit(1); });
