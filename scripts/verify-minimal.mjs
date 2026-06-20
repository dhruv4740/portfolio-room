import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const PORT = 4173;
const TIMEOUT_MS = 60000;
const BASE_URL = `http://localhost:${PORT}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = join(__dirname, 'shots');

mkdirSync(SHOTS_DIR, { recursive: true });

function waitForPort(port, maxMs = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    function probe() {
      http.get(`http://localhost:${port}/`, (res) => {
        res.destroy();
        resolve();
      }).on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server on port ${port} never responded`));
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

async function main() {
  const hardTimeout = setTimeout(() => {
    console.error('FATAL: Hard timeout reached.');
    process.exit(2);
  }, TIMEOUT_MS);

  console.log(`[minimal] Starting vite preview...`);
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT)],
    {
      cwd: join(__dirname, '..'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  preview.stdout.on('data', d => console.log(`[vite] ${d}`));

  try {
    await waitForPort(PORT, 25000);
    console.log(`[minimal] Server ready`);
  } catch (err) {
    console.error('[minimal] Server failed:', err.message);
    preview.kill();
    process.exit(1);
  }

  console.log('[minimal] Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-gpu-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('pageerror', err => {
    console.error('[pageerror]', err.message);
  });

  console.log(`[minimal] Navigating...`);
  await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 15000 });

  console.log('[minimal] Waiting for 12s, then taking screenshot...');
  const navTime = Date.now();
  const settledTime = navTime + 12000;
  const waitMs = settledTime - Date.now();
  if (waitMs > 0) await sleep(waitMs);

  const shotPath = join(SHOTS_DIR, '02-settled.png');
  await page.screenshot({ path: shotPath });
  console.log(`[minimal] Screenshot saved: ${shotPath}`);

  preview.kill('SIGTERM');
  try { preview.kill('SIGKILL'); } catch (_) {}
  
  await Promise.race([
    browser.close(),
    sleep(5000),
  ]);

  clearTimeout(hardTimeout);
  console.log('[minimal] Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('[minimal] Fatal:', err);
  process.exit(1);
});
