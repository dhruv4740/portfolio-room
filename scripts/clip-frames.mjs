// Contact sheet from a recorded clip: seeks the video in a browser and draws
// evenly spaced frames with their timestamps.
// node scripts/clip-frames.mjs <clip.webm> [from s] [to s] [count] [cols]
import { chromium } from 'playwright';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [file, from = '0', to = '', count = '16', cols = '4'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
// A file:// page, so the file:// video is same-origin.
await page.goto(pathToFileURL(resolve(dirname(file))).href + '/');
await page.evaluate(() => { document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#111'; });
const out = file.replace(/\.webm$/, `-sheet-${from}-${to || 'end'}.png`);
const size = await page.evaluate(async ({ src, from, to, count, cols }) => {
  const video = document.createElement('video');
  video.src = src; video.muted = true; video.preload = 'auto';
  await new Promise((r, e) => { video.onloadeddata = r; video.onerror = () => e(new Error('video failed to load')); });
  // WebM from MediaRecorder-style writers can report Infinity until seeked to the end.
  if (!Number.isFinite(video.duration)) { video.currentTime = 1e6; await new Promise((r) => { video.onseeked = r; }); }
  const end = to ? Number(to) : video.duration, start = Number(from);
  const w = 400, h = Math.round(w * video.videoHeight / video.videoWidth), rows = Math.ceil(count / cols);
  const canvas = document.createElement('canvas'); canvas.width = w * cols; canvas.height = (h + 18) * rows;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '13px monospace'; ctx.fillStyle = '#ddd';
  for (let i = 0; i < count; i++) {
    const t = start + (end - start) * (count === 1 ? 0 : i / (count - 1));
    video.currentTime = Math.min(t, video.duration - 0.01);
    await new Promise((r) => { video.onseeked = r; });
    const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 18);
    ctx.drawImage(video, x, y + 18, w, h);
    ctx.fillText(`${t.toFixed(2)} s`, x + 6, y + 14);
  }
  document.body.appendChild(canvas);
  return { width: canvas.width, height: canvas.height };
}, { src: pathToFileURL(resolve(file)).href, from, to, count: Number(count), cols: Number(cols) });
await page.setViewportSize(size);
await page.locator('canvas').screenshot({ path: out });
await browser.close();
console.log(out);
