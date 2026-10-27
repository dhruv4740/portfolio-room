// Records the app's own guided tour (~50 s) as the muted room tour for /work: node scripts/record-tour.mjs  (BASE=http://localhost:4173)
// -> tmp-measure/tour/tour.webm + poster.jpg. Frames come from a CDP screencast piped into Playwright's bundled ffmpeg
// (it has VP9 encode and MJPEG decode only, so Playwright's own recordVideo VP8 output cannot be re-encoded).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
const BASE = process.env.BASE || 'http://localhost:4173', DIR = 'tmp-measure/tour';
await mkdir(DIR, { recursive: true });
const root = join(homedir(), 'AppData/Local/ms-playwright');
const ffDir = (await readdir(root)).filter((d) => d.startsWith('ffmpeg-')).sort().at(-1);
const ff = spawn(join(root, ffDir, 'ffmpeg-win64.exe'), ['-hide_banner', '-loglevel', 'error', '-y', '-use_wallclock_as_timestamps', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', 'pipe:0',
  '-an', '-r', '20', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', process.env.CRF || '38', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-f', 'webm', `${DIR}/tour.webm`], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((r) => ff.on('close', r));
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
await p.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); localStorage.setItem('v3:seen-intro', '1'); sessionStorage.setItem('v3:arrival-seen', '1'); });
await p.goto(BASE + '/#/room/explore');
await p.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true', null, { timeout: 90000 });
await p.waitForFunction(() => !document.querySelector('.room-load'), null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(3000);
await p.keyboard.press('Escape');
await p.waitForSelector('[data-launchpad-action=tour]', { timeout: 20000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${DIR}/poster.jpg`, type: 'jpeg', quality: 70 });
const cdp = await p.context().newCDPSession(p);
cdp.on('Page.screencastFrame', ({ data, sessionId }) => { ff.stdin.write(Buffer.from(data, 'base64')); cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 960, maxHeight: 540, everyNthFrame: 1 });
await p.waitForTimeout(1500);
await p.click('[data-launchpad-action=tour]');
await p.waitForSelector('[data-testid=tour-end]', { timeout: 100000 }).catch(() => {});
await p.waitForTimeout(800);
await cdp.send('Page.stopScreencast'); ff.stdin.end(); await done; await b.close();
console.log('ok');
