import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const PORT = 4173;
const __dirname = dirname(fileURLToPath(import.meta.url));

function waitForPort(port, maxMs = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    function probe() {
      http.get(`http://localhost:${port}/`, (res) => { res.destroy(); resolve(); }).on('error', () => {
        if (Date.now() > deadline) reject(new Error(`Server failed`));
        else setTimeout(probe, 400);
      });
    }
    probe();
  });
}

(async () => {
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: join(__dirname, '..'), shell: true, stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForPort(PORT, 25000);
  console.log('[check] Server ready');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => {
    console.error('[PAGEERROR]', err.toString());
    errors.push(err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[CONSOLE ERROR]', msg.text());
      errors.push(msg.text());
    }
  });

  try {
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'commit', timeout: 15000 });
    console.log('[check] Page loaded');
    
    await new Promise(r => setTimeout(r, 1000));
    
    const title = await page.title();
    console.log('[check] Title:', title);
    
    if (errors.length > 0) {
      console.log('[check] ERRORS FOUND:');
      errors.forEach(e => console.log('  -', e));
    } else {
      console.log('[check] No errors!');
    }
  } catch (e) {
    console.error('[check] Exception:', e.message);
  }

  preview.kill('SIGTERM');
  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
})();
