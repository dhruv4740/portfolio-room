// Screens and console errors for everything outside the desk objects, on the real GPU:
// loading and the cold open (a first visit), the launchpad and About, every dhruvOS app,
// deep links, the Ctrl/Cmd+K palette and /work.
//   BASE=http://localhost:4175 node scripts/sweep-surfaces.mjs [tag] [section,...]
// Output: scripts/shots/surfaces/<tag>-<name>.png, plus a JSON line of errors per section.
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const [tag = 'now', only] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:4173', OUT = 'scripts/shots/surfaces';
await mkdir(OUT, { recursive: true });
const want = s => !only || only.split(',').includes(s);
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const OS_APPS = ['about', 'terminal', 'projects', 'gallery', 'focuslock', 'darksentinel', 'crisiswatch', 'fraud', 'wallpaper', 'contact', 'skills', 'music'];
async function page({ firstVisit = false } = {}) {
  const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  const errors = [];
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  await p.addInitScript(first => {
    localStorage.setItem('v3:surface-override', 'scan');
    if (!first) { localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); }
  }, firstVisit);
  return { p, errors };
}
const shot = (p, name) => p.screenshot({ path: `${OUT}/${tag}-${name}.png` });
const report = (section, errors, extra = {}) => console.log(JSON.stringify({ section, errors, ...extra }));

if (want('coldopen')) {
  // A first visit: loading, intro, then the 7.2 s arrival. One frame every 700 ms from navigation.
  const { p, errors } = await page({ firstVisit: true });
  const t0 = Date.now(); await p.goto(BASE + '/');
  for (let i = 0; i < 40; i++) { await shot(p, `coldopen-${String(i).padStart(2, '0')}-${Math.round((Date.now() - t0) / 100) / 10}s`); await p.waitForTimeout(700); }
  report('coldopen', errors); await p.close();
}
if (want('launchpad')) {
  const { p, errors } = await page();
  await p.goto(BASE + '/'); await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 90000 }); await p.waitForTimeout(1500);
  await shot(p, 'launchpad');
  await p.locator('[data-launchpad-action="about"]').click(); await p.waitForTimeout(800); await shot(p, 'about');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k'); await p.waitForTimeout(600); await shot(p, 'palette');
  await p.keyboard.type('res'); await p.waitForTimeout(400); await shot(p, 'palette-res');
  await p.keyboard.press('Escape');
  report('launchpad', errors); await p.close();
}
if (want('os')) {
  const { p, errors } = await page();
  await p.goto(BASE + '/'); await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 90000 }); await p.waitForTimeout(1000);
  await p.locator('[data-launchpad-action="desktop-projects"]').click();
  await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.entranceState === 'inside', null, { timeout: 60000 });
  await p.waitForTimeout(1500); await shot(p, 'os-inside');
  const opened = {};
  for (const app of OS_APPS) {
    // The same bridge the host uses for deep links.
    await p.evaluate(app => { const f = document.querySelector('iframe'); f.contentWindow.postMessage({ source: 'v3-scan', type: 'open-app', app }, location.origin); }, app);
    await p.waitForTimeout(app === 'darksentinel' || app === 'crisiswatch' || app === 'fraud' ? 3500 : 1500);
    opened[app] = await p.evaluate(app => { const d = document.querySelector('iframe').contentDocument, body = d.getElementById('win-body-' + app);
      return body ? { chars: body.innerText.trim().length, frames: body.querySelectorAll('iframe').length } : null; }, app);
    await shot(p, `os-${app}`);
  }
  report('os', errors, { opened });
  await p.keyboard.press('Escape'); await p.waitForTimeout(2500); await shot(p, 'os-left');
  await p.close();
}
if (want('deeplinks')) {
  const all = [];
  for (const link of ['/about', '/contact', '/room/lamp', '/room/drawer', '/room/window', '/phone/expense', '/os/crisiswatch']) {
    const { p, errors } = await page();
    await p.goto(BASE + '/#' + link); await p.waitForTimeout(link.startsWith('/os') ? 14000 : 10000);
    await shot(p, 'link' + link.replaceAll('/', '-'));
    all.push({ link, hash: await p.evaluate(() => location.hash), errors }); await p.close();
  }
  report('deeplinks', [], { all });
}
if (want('work')) {
  const { p, errors } = await page();
  const scripts = []; p.on('request', r => { if (r.resourceType() === 'script') scripts.push(r.url().split('/').pop()); });
  await p.goto(BASE + '/#/work'); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/${tag}-work.png`, fullPage: true });
  report('work', errors, { threeLoaded: scripts.some(s => /three/i.test(s)), height: await p.evaluate(() => document.documentElement.scrollHeight) });
  await p.close();
}
await b.close();
