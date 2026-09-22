// Boot timeline: progress text, launchpad arrival, and which heavy assets load
// before the visitor does anything. GPU=1 for real rendering.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
const t0 = Date.now();
await p.goto(BASE + '/#/');
const samples = [];
for (let i = 0; i < 60; i++) {
  const s = await p.evaluate(() => ({
    boot: document.querySelector('.boot-root p')?.textContent || null,
    room: document.querySelector('.room-load span')?.textContent || null,
    launchpad: !!document.querySelector('[data-testid="room-overview"]'),
  })).catch(() => null);
  if (s) samples.push({ ms: Date.now() - t0, ...s });
  if (i === 3) await p.screenshot({ path: 'scripts/shots/boot-early.png' });
  if (s?.launchpad && !s.room) break;
  await p.waitForTimeout(250);
}
await p.screenshot({ path: 'scripts/shots/boot-launchpad.png' });
const firstLaunch = samples.find(s => s.launchpad);
console.log(samples.filter((s, i) => i === 0 || JSON.stringify({ ...s, ms: 0 }) !== JSON.stringify({ ...samples[i - 1], ms: 0 })));
console.log('launchpad at', firstLaunch?.ms, 'ms');
const res = await p.evaluate(() => performance.getEntriesByType('resource').map(e => e.name.split('/').pop()));
console.log('song loaded early:', res.some(n => n.startsWith('song')), '| PhoneScreen loaded:', res.some(n => /PhoneScreen/.test(n)));
console.log('errors:', errors);
await b.close();
