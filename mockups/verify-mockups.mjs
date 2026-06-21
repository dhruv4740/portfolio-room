/**
 * verify-mockups.mjs — Console-error + screenshot harness for the concept gallery.
 *
 * Usage: node mockups/verify-mockups.mjs
 *
 * Serves the mockups/ directory on a local port, opens each demo in headless
 * Chromium (software WebGL via SwiftShader), records console errors + page
 * errors, and screenshots each page to mockups/shots/.
 *
 * NOTE: SwiftShader cannot run GPGPU float-texture FBOs or heavy raymarch
 * shaders, so particles/raymarch/fluid pixels may render BLACK here — that is
 * EXPECTED. The job of this harness is catching JS/console/network errors and
 * truthfully screenshotting the DOM/CSS demos (index/os/kinetic). Final visual
 * judgment of the GPU demos is done LIVE in a real browser.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = parseInt(process.env.MOCKUP_PORT ?? '4178', 10);
const SHOTS = join(ROOT, 'shots');
mkdirSync(SHOTS, { recursive: true });

const PAGES = ['index.html', 'particles.html', 'os.html', 'raymarch.html', 'kinetic.html', 'fluid.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
        const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
        const filePath = normalize(join(ROOT, rel));
        if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
        const body = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404); res.end('not found');
      }
    });
    server.listen(PORT, () => resolve(server));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const server = await startServer();
  console.log(`[harness] serving mockups/ at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--enable-webgl2',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const results = [];

  for (const pageName of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const errors = [];

    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Ignore favicon noise; report real failures (esp. CDN imports).
      if (!url.endsWith('favicon.ico')) errors.push(`requestfailed: ${url} — ${req.failure()?.errorText ?? '?'}`);
    });

    try {
      await page.goto(`http://localhost:${PORT}/${pageName}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch (e) {
      errors.push(`navigation: ${e.message}`);
    }
    await sleep(3500);
    // Nudge scroll-driven demos so they paint past the hero.
    try { await page.mouse.wheel(0, 1200); await page.mouse.move(640, 400); } catch {}
    await sleep(800);

    const shotPath = join(SHOTS, pageName.replace('.html', '.png'));
    try { await page.screenshot({ path: shotPath }); } catch (e) { errors.push(`screenshot: ${e.message}`); }

    results.push({ pageName, errors });
    await context.close();
  }

  await browser.close();
  server.close();

  console.log('\n' + '='.repeat(64));
  let anyErrors = false;
  for (const { pageName, errors } of results) {
    if (errors.length === 0) {
      console.log(`PASS  ${pageName}  (0 errors)`);
    } else {
      anyErrors = true;
      console.log(`FAIL  ${pageName}  (${errors.length} errors)`);
      for (const e of errors) console.log(`        ${e}`);
    }
  }
  console.log('='.repeat(64));
  console.log(`Screenshots → ${SHOTS}`);
  process.exitCode = anyErrors ? 1 : 0;
}

main().catch((err) => { console.error('[harness] fatal:', err); process.exit(2); });
