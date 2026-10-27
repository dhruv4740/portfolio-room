// Seated touch look-around in landscape: a one-finger drag on the canvas must turn the head.
//   BASE=http://localhost:4173 node scripts/verify-touch-look.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
let fails = 0;
const ok = (name, pass, info = '') => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`); if (!pass) fails++; };
for (const [w, h] of [[915, 412], [412, 915]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await c.addInitScript(() => { localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); sessionStorage.setItem('v3:arrival-seen', '1'); });
  const p = await c.newPage(), cdp = await c.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const tap = async (x, y) => { await touch('touchStart', x, y); await touch('touchEnd'); };
  await p.goto(BASE + '/#/room/explore'); await p.waitForFunction(() => window.__v3test, null, { timeout: 60000 }); await p.waitForTimeout(8000);
  const seated = () => p.evaluate(() => document.querySelector('.scan-root')?.dataset.seated);
  await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(3000);
  const s = await seated();
  const dir = () => p.evaluate(() => window.__v3test.camera.quaternion.toArray());
  const before = await dir();
  await touch('touchStart', w * 0.5, h * 0.5);
  for (let i = 1; i <= 12; i++) { await touch('touchMove', w * 0.5 + i * 12, h * 0.5); await p.waitForTimeout(16); }
  await touch('touchEnd'); await p.waitForTimeout(400);
  const after = await dir();
  const delta = Math.hypot(...after.map((v, i) => v - before[i]));
  ok(`${w}x${h} /room/explore seats (seated=${s})`, s === 'true');
  ok(`${w}x${h} one-finger drag turns the head`, delta > 0.05, `delta ${delta.toFixed(3)}`);
  await c.close();
}
await b.close();
process.exit(fails ? 1 : 0);
