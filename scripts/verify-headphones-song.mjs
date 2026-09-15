// Wearing the headphones must loop /os/audio/song.mp3; taking them off pauses it.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => {
  localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'low'); sessionStorage.setItem('v3:controls', 'open');
  window.__songs = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { if (!window.__songs.includes(this)) window.__songs.push(this); return play.call(this); };
});
await p.goto(BASE); await p.locator('[data-object="chair"]').click(); await p.waitForTimeout(1800);
const idle = async () => { await p.waitForFunction(() => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle', null, { polling: 100 }); await p.waitForTimeout(900); };
const song = () => p.evaluate(() => { const a = window.__songs.find(s => s.src.endsWith('/os/audio/song.mp3')); return a ? { paused: a.paused, loop: a.loop, t: a.currentTime } : null; });
await p.getByRole('button', { name: 'HEADPHONES', exact: true }).click(); await idle();
const on = await song(); console.log('on', on);
assert.ok(on && !on.paused && on.loop && on.t > 0, 'song plays looped while wearing');
await p.getByRole('button', { name: 'HEADPHONES', exact: true }).click(); await idle();
const off = await song(); console.log('off', off);
assert.ok(off.paused, 'song pauses when taken off');
assert.deepEqual(errors, []);
console.log('headphones song passed');
await b.close();
