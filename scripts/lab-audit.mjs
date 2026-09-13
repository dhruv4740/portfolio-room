import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:4174';
const OUT_DIR = path.resolve('scripts/shots/lab');
fs.mkdirSync(OUT_DIR, { recursive: true });

const demos = [
  'chromatic','corrupted','decoder','drift','fluid','gravity','kinetic',
  'neural','os','particles','portals','raymarch','resonance','singularity',
  'tear','video3d','zoom',
];

async function screenCoverage(page) {
  const png = await page.screenshot();
  const b64 = png.toString('base64');
  return page.evaluate(async (data) => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const bmp = await createImageBitmap(blob);
    const off = document.createElement('canvas');
    off.width = 240; off.height = 150;
    const ctx = off.getContext('2d');
    ctx.drawImage(bmp, 0, 0, off.width, off.height);
    const { data: px } = ctx.getImageData(0, 0, off.width, off.height);
    let lit = 0, sum = 0;
    const total = off.width * off.height;
    for (let i = 0; i < px.length; i += 4) {
      const v = (px[i] + px[i + 1] + px[i + 2]) / 3;
      sum += v;
      if (px[i] > 26 || px[i + 1] > 26 || px[i + 2] > 28) lit++;
    }
    return { litRatio: lit / total, meanLuma: sum / total };
  }, b64);
}

async function testDemo(browser, id, urlPath, interaction) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  const pageErrors = [];
  const failedReqs = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => failedReqs.push(`${req.url()} :: ${req.failure()?.errorText}`));
  page.on('response', (res) => { if (res.status() >= 400) failedReqs.push(`${res.url()} :: HTTP ${res.status()}`); });

  let navError = null;
  try {
    await page.goto(`${BASE}${urlPath}`, { waitUntil: 'load', timeout: 20000 });
  } catch (e) {
    navError = String(e);
  }
  await page.waitForTimeout(6000);

  const before = await screenCoverage(page).catch((e) => ({ litRatio: -1, meanLuma: -1, err: String(e) }));
  await page.screenshot({ path: path.join(OUT_DIR, `${id}.png`), timeout: 10000 }).catch(() => {});

  let interactionChanged = null;
  if (interaction) {
    try {
      await interaction(page);
      await page.waitForTimeout(1500);
      const after = await screenCoverage(page).catch((e) => ({ litRatio: -1 }));
      await page.screenshot({ path: path.join(OUT_DIR, `${id}-after.png`), timeout: 10000 }).catch(() => {});
      interactionChanged = Math.abs(after.litRatio - before.litRatio) > 0.005;
      interactionChanged = { changed: interactionChanged, after };
    } catch (e) {
      interactionChanged = { error: String(e) };
    }
  }

  await page.close();
  return { id, navError, before, consoleErrors: consoleErrors.slice(0, 5), pageErrors: pageErrors.slice(0, 5), failedReqs: [...new Set(failedReqs)].slice(0, 10), interactionChanged };
}

const interactions = {
  fluid: (page) => page.mouse.move(640, 400).then(() => page.mouse.move(700, 300)).then(() => page.mouse.move(500, 500)),
  tear: (page) => page.mouse.move(640, 400).then(() => page.mouse.move(700, 300)),
  zoom: (page) => page.mouse.wheel(0, 800),
  raymarch: (page) => page.mouse.wheel(0, 800),
  kinetic: (page) => page.mouse.wheel(0, 800),
  portals: (page) => page.mouse.click(640, 400),
  drift: (page) => page.mouse.move(640,400).then(()=>page.mouse.down()).then(()=>page.mouse.move(400,300)).then(()=>page.mouse.up()),
  neural: (page) => page.mouse.move(640, 400).then(() => page.mouse.move(700, 350)),
  chromatic: (page) => page.mouse.wheel(0, 600),
  gravity: (page) => page.mouse.click(640, 400),
  particles: (page) => page.mouse.move(640,400).then(()=>page.mouse.move(800,300)),
  decoder: (page) => page.mouse.move(640,400).then(()=>page.mouse.move(800,300)),
  resonance: (page) => page.mouse.click(640, 400),
  singularity: (page) => page.mouse.wheel(0, 400),
  corrupted: (page) => page.mouse.click(640, 400),
  video3d: (page) => page.mouse.wheel(0, 600),
};

const results = [];

const browser = await chromium.launch();

// gallery index page
results.push(await testDemo(browser, '__index', '/lab/index.html', null));

for (const id of demos) {
  const urlPath = id === 'os' ? '/lab/os.html' : `/lab/${id}.html`;
  const r = await testDemo(browser, id, urlPath, interactions[id]);
  results.push(r);
  console.log(`done: ${id}`);
}

// dhruvOS full build
results.push(await testDemo(browser, '__os_full', '/os/index.html', (page) => page.mouse.click(640, 400)));

await browser.close();

fs.writeFileSync(path.resolve('scripts/shots/lab/results.json'), JSON.stringify(results, null, 2));
console.log('ALL DONE');
