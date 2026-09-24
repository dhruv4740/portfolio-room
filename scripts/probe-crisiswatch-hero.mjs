// Frame cost of the CrisisWatch hero, with suspect effects switched off one at
// a time through injected CSS. Real GPU, 1.25 zoom like the OS window.
// BASE=http://localhost:4175 node scripts/probe-crisiswatch-hero.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';
const VARIANTS = {
  baseline: '',
  'no-blur-orbs': '[class*="blur-["] { filter: none !important; --tw-blur: ; opacity: 0 !important; }',
  'no-blend-noise': '.mix-blend-overlay { display: none !important; }',
  'no-backdrop': '[class*="backdrop-blur"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
  'no-clip-noise': '[style*="feTurbulence"] { display: none !important; }',
  'static-orbs': '[class*="blur-["] { transform: none !important; will-change: auto !important; }',
  'no-headlines': '[style*="clip-path"], [style*="clipPath"] { display: none !important; }',
  'all-off': '[class*="blur-["] { opacity: 0 !important; } .mix-blend-overlay, [style*="feTurbulence"] { display: none !important; } [class*="backdrop-blur"] { backdrop-filter: none !important; }',
  'empty': 'body { display: none !important; }',
  'orbs+blend': '[class*="blur-["] { opacity: 0 !important; } .mix-blend-overlay { display: none !important; }',
  'orbs+turb': '[class*="blur-["] { opacity: 0 !important; } [style*="feTurbulence"] { display: none !important; }',
  'orbs+blend+turb': '[class*="blur-["] { opacity: 0 !important; } .mix-blend-overlay, [style*="feTurbulence"] { display: none !important; }',
};

const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const only = process.argv.slice(2);
for (const [name, css] of Object.entries(VARIANTS).filter(([n]) => !only.length || only.includes(n))) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 780 } });
  await page.goto(`${BASE}/apps/crisiswatch/`);
  await page.waitForTimeout(2500);
  await page.evaluate((css) => {
    document.documentElement.style.zoom = '1.25';
    if (css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  }, css);
  await page.waitForTimeout(1500);
  const gaps = await page.evaluate(() => new Promise((done) => {
    const out = []; let last = performance.now(); const end = last + 6000;
    const tick = (now) => { out.push(now - last); last = now; if (now < end) requestAnimationFrame(tick); else done(out); };
    requestAnimationFrame(tick);
  }));
  gaps.sort((a, b) => a - b);
  const q = (p) => gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * p))].toFixed(1);
  console.log(`${name.padEnd(15)} frames ${String(gaps.length).padStart(4)}  p50 ${q(0.5)} ms  p95 ${q(0.95)} ms  max ${gaps.at(-1).toFixed(1)} ms  >33ms ${gaps.filter((g) => g > 33).length}`);
  await page.close();
}
await browser.close();
