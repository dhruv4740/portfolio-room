// scripts/_v2.mjs — Playwright smoke test for the Portfolio v2 shell.
// Serves the production build (dist/) and visits each React route, collecting
// console errors and per-route screenshots. Run `npm run build` first.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, 'mockups', 'shots');
mkdirSync(SHOTS, { recursive: true });
const MIME = {
  '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// SPA static server: serve dist file if it exists, else fall back to index.html
const server = createServer(async (req, res) => {
  try {
    const rel = (req.url === '/' ? '/index.html' : req.url).split('?')[0].split('#')[0];
    let p = normalize(join(DIST, rel));
    if (!p.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    let buf;
    try { buf = await readFile(p); }
    catch { p = join(DIST, 'index.html'); buf = await readFile(p); }
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(4183, r));
const BASE = 'http://localhost:4183';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: [
  '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist',
  '--enable-unsafe-swiftshader', '--enable-webgl', '--enable-webgl2',
  '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage' ] });
const page = await browser.newPage();
await page.setViewportSize({ width: 1366, height: 860 });

let route = 'init';
const msgs = [];
const tag = (s) => `[${route}] ${s}`;
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(tag(`${m.type()}: ${m.text()}`)); });
page.on('pageerror', (e) => msgs.push(tag(`pageerror: ${e.message}`)));
page.on('requestfailed', (r) => {
  const u = r.url();
  if (u.endsWith('favicon.ico') || u.endsWith('favicon.svg')) return;
  msgs.push(tag(`reqfail: ${u.split('/').slice(-2).join('/')}`));
});

async function goRoute(hash) { await page.evaluate((h) => { window.location.hash = h; }, hash); await sleep(1500); }
async function shot(name) {
  try { await page.screenshot({ path: join(SHOTS, name), animations: 'disabled', caret: 'hide', timeout: 8000 }); }
  catch (e) { msgs.push(`__info: shot-skip ${name} (${e.name})`); }
}

// ── boot the shell ──
try { await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch (e) { msgs.push('nav: ' + e.message); }
await sleep(1800);

// ── / (Flagship) ──
route = 'flagship';
await goRoute('#/');
await sleep(1200);
await shot('v2-01-flagship.png');

// ── /lab (gallery) ──
route = 'lab';
await goRoute('#/lab');
try { await page.waitForFunction(() => document.querySelectorAll('a[href*="#/lab/"]').length > 4, { timeout: 6000 }); } catch {}
const cardCount = await page.evaluate(() => document.querySelectorAll('a[href*="#/lab/"]').length);
msgs.push(`__info: lab-cards=${cardCount}`);
await shot('v2-02-lab.png');

// ── /anthology ──
route = 'anthology';
await goRoute('#/anthology');
await sleep(1500);
await shot('v2-03-anthology.png');

// ── /lab/:id (iframe entry) ──
route = 'lab-entry';
await goRoute('#/lab/particles');
await sleep(1500);
const hasIframe = await page.evaluate(() => document.querySelectorAll('iframe').length);
msgs.push(`__info: lab-entry-iframes=${hasIframe}`);
await shot('v2-04-lab-entry.png');

console.log('==== PORTFOLIO v2 SMOKE ====');
const errs = msgs.filter((m) => !m.includes('__info'));
msgs.filter((m) => m.includes('__info')).forEach((m) => console.log(m.replace(/.*__info: /, 'INFO ')));
if (errs.length === 0) console.log('NO console errors / warnings / failed requests');
else { console.log(`${errs.length} issue(s):`); errs.forEach((e) => console.log('  ' + e)); }
console.log('shots: v2-01-flagship / v2-02-lab / v2-03-anthology / v2-04-lab-entry');
await browser.close();
server.close();
process.exit(0);
