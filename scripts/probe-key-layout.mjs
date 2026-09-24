// Every key instance's cap box (mm, world), sorted into rows by depth, so a
// special key's index can be read off by position.
// BASE=http://localhost:4175 node scripts/probe-key-layout.mjs
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); sessionStorage.setItem('v3:arrival-seen', '1'); });
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => window.__v3test?.keyBoxes, null, { timeout: 120000 });
const boxes = await page.evaluate(() => window.__v3test.keyBoxes());
const rows = new Map();
boxes.forEach((b, i) => { if (!b) return; const c = [(b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2].map(v => Math.round(v * 1000)); const w = Math.round((b.max[0] - b.min[0]) * 1000); const r = Math.round(c[1] / 8); (rows.get(r) || rows.set(r, []).get(r)).push(`${i}@${c[0]}(w${w})`); });
for (const [r, ks] of [...rows].sort((a, b) => a[0] - b[0])) console.log(`z~${r * 8}: ${ks.sort((a, b) => +a.split('@')[1].split('(')[0] - +b.split('@')[1].split('(')[0]).join(' ')}`);
await browser.close();
