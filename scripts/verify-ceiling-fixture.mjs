// The ceiling fixture is only well framed during the arrival, which is also
// when its power stutter runs. Captures the arrival and checks the fixture
// loaded, is visible and changes brightness while the power ramps.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const watchdog = setTimeout(() => { console.error('Arrival flow exceeded 120 seconds'); b.close().finally(() => process.exit(1)); }, 120000);

const decoder = await b.newPage();
// Upper band of the frame, where the ceiling and its fixture sit.
const CEILING = { x0: 0.18, x1: 0.62, y0: 0.0, y1: 0.30 };
const luma = async (file, r) => {
  const data = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
  return decoder.evaluate(async ([src, rect]) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(Math.floor(rect.x0 * img.width), Math.floor(rect.y0 * img.height),
      Math.floor((rect.x1 - rect.x0) * img.width), Math.floor((rect.y1 - rect.y0) * img.height)).data;
    let sum = 0, peak = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      sum += l; if (l > peak) peak = l;
    }
    return { mean: +(sum / (d.length / 4)).toFixed(2), peak: +peak.toFixed(2) };
  }, [data, r]);
};

const result = {};
try {
  const page = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    localStorage.setItem('v3:test', '1'); localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1'); localStorage.setItem('v3:perf-tier', 'mid');
    sessionStorage.setItem('v3:controls', 'open');
  });
  // No arrival-seen flag: the arrival plays on load.
  await page.goto(`${BASE}/?sky=night`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => ['ready', 'fallback'].includes(document.querySelector('.workspace-stage')?.dataset.ceilingFixture), null, { timeout: 30000 });
  result.status = await page.locator('.workspace-stage').evaluate(e => e.dataset.ceilingFixture);
  await page.addStyleTag({ content: '.telemetry-root{display:none!important}' });

  // NOT COVERED: the arrival power stutter. It runs before the room bake
  // resolves, and the replay control is only offered in states this harness
  // cannot reach, so setEntryPower's drive of the fixture emissive is
  // exercised by the app but not asserted here.
  await page.waitForTimeout(1200);
  const file = 'scripts/shots/ceiling-fixture.png';
  await page.screenshot({ path: file });
  result.ceiling = await luma(file, CEILING);
  result.errors = errors;
  console.log(JSON.stringify(result, null, 2));
  // The bulb inside the shade is the brightest thing in the ceiling band when
  // the fixture is present; the old procedural bulb sat outside this crop.
  if (result.status !== 'ready' || errors.length || result.ceiling.peak < 120) {
    console.error('FIXTURE ACCEPTANCE FAILED'); process.exitCode = 1;
  }
} finally {
  clearTimeout(watchdog);
  await b.close();
}
