// Every typeable key pressed at full dip through __v3test.typeProbe: is the
// striking fingertip on that cap, how close the other fingers come to any cap
// (mm; negative is inside), the lift and hand travel, and both wrists.
// BASE=http://localhost:4175 node scripts/probe-typing.mjs [keys]
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const keys = process.argv[2] ? [...process.argv[2]] : [..."`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./", ' ', 'Enter', 'Backspace', 'ArrowLeft', 'ArrowRight'];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => { localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan'); sessionStorage.setItem('v3:arrival-seen', '1'); });
await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.locator('[data-launchpad-action="explore-room"]').click({ timeout: 120000 });
await page.waitForFunction(() => document.querySelector('.scan-root')?.dataset.seated === 'true');
await page.waitForTimeout(2500);
const rows = await page.evaluate((keys) => window.__v3test.typeProbe(keys), keys);
let bad = 0;
for (const r of rows) {
  const flags = [!r.on && 'OFF-CAP', r.othersMm < 0 && 'CLIPS', Math.max(...r.wrist) > 60 && 'WRIST'].filter(Boolean);
  if (flags.length) bad++;
  console.log(`${JSON.stringify(r.key).padEnd(12)} ${r.hand}${r.digit < 0 ? 'T' : r.digit}  tip ${String(r.tipAboveCapMm).padStart(5)} mm  others ${String(r.othersMm).padStart(6)} mm  lift ${String(r.liftMm).padStart(4)}  travel ${String(r.travelMm).padStart(3)} mm  wrist ${r.wrist.join("/")}  cap ${r.capMm}  tip ${r.tipMm}  ${flags.join(" ")}`);
}
console.log(`${rows.length} keys, ${bad} flagged`);
await browser.close();
process.exit(bad ? 1 : 0);
