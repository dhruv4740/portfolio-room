/**
 * verify.mjs — Headless WebGL/R3F runtime verification harness
 *
 * Usage:
 *   node scripts/verify.mjs [--port 4173] [--timeout 30000]
 *
 * What it does:
 *  1. Spawns `npx vite preview` on the given port
 *  2. Waits until the port responds (HTTP 200)
 *  3. Launches Chromium headless with software WebGL (SwiftShader/ANGLE)
 *  4. Registers console/error/request-failure listeners
 *  5. Navigates to localhost and captures timed screenshots
 *  6. Evaluates a canvas pixel probe to check WebGL output
 *  7. Prints a structured summary
 *  8. Kills the preview server and closes the browser
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// ---------------------------------------------------------------------------
// Config (override via env vars for CI parameterization)
// ---------------------------------------------------------------------------
const PORT        = parseInt(process.env.VERIFY_PORT    ?? '4173', 10);
const TIMEOUT_MS  = parseInt(process.env.VERIFY_TIMEOUT ?? '120000', 10);
const BASE_URL    = `http://localhost:${PORT}`;

const __dirname   = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR   = join(__dirname, 'shots');

mkdirSync(SHOTS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait up to maxMs for the server to reply with any HTTP response. */
function waitForPort(port, maxMs = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    function probe() {
      http.get(`http://localhost:${port}/`, (res) => {
        res.destroy();
        resolve();
      }).on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server on port ${port} never responded within ${maxMs}ms`));
        } else {
          setTimeout(probe, 400);
        }
      });
    }
    probe();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function dedupeMessages(messages) {
  const counts = new Map();
  for (const m of messages) {
    const key = `[${m.type}] ${m.text}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) =>
    count > 1 ? `${key}  (x${count})` : key
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Hard overall timeout
  const hardTimeout = setTimeout(() => {
    console.error('FATAL: Hard timeout reached. Exiting.');
    process.exit(2);
  }, TIMEOUT_MS);
  hardTimeout.unref();

  // 1. Start vite preview
  console.log(`[harness] Starting vite preview on port ${PORT}...`);
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT)],
    {
      cwd: join(__dirname, '..'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  preview.stdout.on('data', d => process.stdout.write(`[vite] ${d}`));
  preview.stderr.on('data', d => process.stderr.write(`[vite:err] ${d}`));

  try {
    await waitForPort(PORT, 25000);
    console.log(`[harness] Server ready at ${BASE_URL}`);
  } catch (err) {
    console.error('[harness] Server failed to start:', err.message);
    preview.kill();
    process.exit(1);
  }

  // 2. Launch Chromium headless with software WebGL
  console.log('[harness] Launching Chromium headless...');
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

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // 3. Register listeners BEFORE navigation
  const consoleMessages = [];
  const pageErrors      = [];
  const failedRequests  = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`);
  });

  // 4. Navigate
  console.log(`[harness] Navigating to ${BASE_URL}...`);
  // Use 'commit' so we don't stall waiting for all resources (R3F loads async)
  await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 15000 });

  // 5. Timed screenshots
  const savedShots = [];

  async function shot(filename) {
    const p = join(SHOTS_DIR, filename);
    await page.screenshot({ path: p, fullPage: false });
    savedShots.push(p);
    console.log(`[harness] Screenshot saved: ${p}`);
  }

  const navTime = Date.now();

  // 01-boot at ~1.2s
  await sleep(1200);
  await shot('01-boot.png');

  // Glitch burst: every 250ms from 6.5s to 9.5s (relative to navigation start)
  const burstStart = 6500;
  const burstEnd   = 9500;
  const burstStep  = 250;
  for (let ms = burstStart; ms <= burstEnd; ms += burstStep) {
    const targetTime = navTime + ms;
    const waitMs = targetTime - Date.now();
    if (waitMs > 0) await sleep(waitMs);
    await shot(`glitch-${ms}.png`);
  }

  // 02-settled at ~12s (give a bit of extra room)
  const settledTarget = navTime + 12000;
  const waitSettled = settledTarget - Date.now();
  if (waitSettled > 0) await sleep(waitSettled);
  await shot('02-settled.png');

  // 6. Canvas pixel probe
  const canvasCheck = await page.evaluate(() => {
    const result = {
      webglContextExists: typeof window.WebGLRenderingContext !== 'undefined',
      webgl2ContextExists: typeof window.WebGL2RenderingContext !== 'undefined',
      canvasFound: false,
      canvasCount: 0,
      width: 0,
      height: 0,
      allBlack: null,
      samplePixels: [],
      error: null,
    };

    try {
      const canvases = document.querySelectorAll('canvas');
      result.canvasCount = canvases.length;

      if (canvases.length === 0) {
        result.error = 'No <canvas> elements found in DOM';
        return result;
      }

      // Use the first (largest) canvas
      let target = canvases[0];
      for (const c of canvases) {
        if (c.width * c.height > target.width * target.height) target = c;
      }

      result.canvasFound = true;
      result.width  = target.width;
      result.height = target.height;

      if (target.width === 0 || target.height === 0) {
        result.error = 'Canvas has zero dimensions';
        return result;
      }

      // Copy WebGL canvas onto a 2D canvas to read pixels
      const offscreen = document.createElement('canvas');
      offscreen.width  = target.width;
      offscreen.height = target.height;
      const ctx2d = offscreen.getContext('2d');
      ctx2d.drawImage(target, 0, 0);

      // Sample a grid of 5x5 points
      const pts = [];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const x = Math.floor((target.width  / 6) * (i + 1));
          const y = Math.floor((target.height / 6) * (j + 1));
          const px = ctx2d.getImageData(x, y, 1, 1).data;
          pts.push([px[0], px[1], px[2], px[3]]);
        }
      }

      result.samplePixels = pts;

      const allBlack = pts.every(([r, g, b, a]) => r === 0 && g === 0 && b === 0);
      const allTransparent = pts.every(([r, g, b, a]) => a === 0);
      result.allBlack = allBlack || allTransparent;

    } catch (e) {
      result.error = e.message;
    }

    return result;
  });

  // 7. Structured summary
  console.log('\n' + '='.repeat(70));
  console.log('=== CONSOLE MESSAGES ===');
  const deduped = dedupeMessages(consoleMessages);
  if (deduped.length === 0) {
    console.log('  (none)');
  } else {
    deduped.forEach(m => console.log(' ', m));
  }

  console.log('\n=== PAGE ERRORS ===');
  if (pageErrors.length === 0) {
    console.log('  (none)');
  } else {
    pageErrors.forEach(e => console.log(' ', e));
  }

  console.log('\n=== FAILED REQUESTS ===');
  if (failedRequests.length === 0) {
    console.log('  (none)');
  } else {
    failedRequests.forEach(r => console.log(' ', r));
  }

  console.log('\n=== CANVAS CHECK ===');
  console.log('  WebGLRenderingContext  :', canvasCheck.webglContextExists);
  console.log('  WebGL2RenderingContext :', canvasCheck.webgl2ContextExists);
  console.log('  Canvas elements found  :', canvasCheck.canvasCount);
  if (canvasCheck.canvasFound) {
    console.log('  Canvas dimensions      :', `${canvasCheck.width}x${canvasCheck.height}`);
    console.log('  All-black/transparent  :', canvasCheck.allBlack);
    if (!canvasCheck.allBlack) {
      // Show a few non-black pixels to prove color
      const nonBlack = canvasCheck.samplePixels.filter(([r,g,b,a]) => r>0||g>0||b>0);
      console.log(`  Non-black pixels (${nonBlack.length}/25) :`, JSON.stringify(nonBlack.slice(0,5)));
    }
  }
  if (canvasCheck.error) {
    console.log('  Error                  :', canvasCheck.error);
  }

  console.log('\n=== SCREENSHOTS ===');
  savedShots.forEach(p => console.log(' ', p));
  console.log('='.repeat(70) + '\n');

  // 8. Cleanup — kill preview server first, then close browser
  preview.kill('SIGTERM');
  try { preview.kill('SIGKILL'); } catch (_) {}

  // Close browser with a short race-timeout so a hang doesn't block us
  await Promise.race([
    browser.close(),
    sleep(5000),
  ]);

  clearTimeout(hardTimeout);
  console.log('[harness] Done.');
  // Force exit to avoid any lingering async handles
  process.exit(0);
}

main().catch(err => {
  console.error('[harness] Fatal error:', err);
  process.exit(1);
});
