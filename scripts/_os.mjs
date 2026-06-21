import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OS = join(dirname(fileURLToPath(import.meta.url)), '..', 'os');
const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'mockups', 'shots');
mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json' };

const server = createServer(async (req, res) => {
  try {
    const rel = (req.url === '/' ? '/index.html' : req.url).split('?')[0];
    const p = normalize(join(OS, rel));
    if (!p.startsWith(OS)) { res.writeHead(403); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(4182, r));

const race = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: [
  '--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader',
  '--enable-webgl','--enable-webgl2','--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage' ] });
const page = await browser.newPage();
await page.setViewportSize({ width: 1366, height: 860 });
const msgs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => { if (!r.url().endsWith('favicon.ico')) msgs.push(`reqfail: ${r.url().split('/').slice(-2).join('/')}`); });

try { await race(page.goto('http://localhost:4182/index.html', { waitUntil: 'domcontentloaded', timeout: 12000 }), 13000); } catch (e) { msgs.push('nav: ' + e.message); }

// Wait for intro to be ready (listener attached after registry finishes loading)
try { await page.waitForSelector('#intro-skip:visible', { timeout: 8000 }); } catch {}
await sleep(400);
await page.screenshot({ path: join(SHOTS, 'os-01-intro.png') });

// skip intro → boot → desktop
try { await page.click('#intro-skip', { timeout: 3000 }); } catch {}
// wait for boot screen to become active (GSAP fade takes ~650ms)
try { await page.waitForSelector('#boot.active', { timeout: 4000 }); } catch { await sleep(900); }
await sleep(200);
try { await page.click('#boot', { timeout: 2000 }); } catch {}
// wait for at least one desk-icon to appear
try { await page.waitForSelector('.desk-icon', { timeout: 5000 }); } catch { await sleep(1800); }
await sleep(400);
await page.screenshot({ path: join(SHOTS, 'os-02-desktop.png') });

const iconCount = await page.evaluate(() => document.querySelectorAll('.desk-icon').length);
msgs.push(`__info: desk-icons=${iconCount}`);

// open every app
const ids = await page.evaluate(() => [...document.querySelectorAll('.desk-icon .icon-label')].map(e => e.textContent));
for (let i = 0; i < iconCount; i++) {
  try { await page.click(`.desk-icon:nth-child(${i + 1})`, { timeout: 1500 }); } catch {}
  await sleep(1600);
}
await sleep(1500);
await page.screenshot({ path: join(SHOTS, 'os-03-apps.png') });
const winCount = await page.evaluate(() => document.querySelectorAll('.os-window').length);
msgs.push(`__info: open-windows=${winCount}; labels=${JSON.stringify(ids)}`);

console.log('==== dhruvOS INTEGRATION ====');
const errs = msgs.filter(m => !m.startsWith('__info'));
msgs.filter(m => m.startsWith('__info')).forEach(m => console.log(m.replace('__info: ', 'INFO ')));
if (errs.length === 0) console.log('NO console errors / warnings / failed requests');
else { console.log(`${errs.length} issue(s):`); errs.forEach(e => console.log('  ' + e)); }
console.log('shots: os-01-intro / os-02-desktop / os-03-apps');
process.exit(0);
