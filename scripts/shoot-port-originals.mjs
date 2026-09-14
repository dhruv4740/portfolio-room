import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(import.meta.url), '../..');

const apps = [
  {
    id: 'corrupted',
    file: 'corrupted.html',
    async interact(page) {
      await page.locator('#save-header').click();
    },
  },
  {
    id: 'fluid',
    file: 'fluid.html',
    async interact(page) {
      // The mouse move already stirs it.
    },
  },
  {
    id: 'kinetic',
    file: 'kinetic.html',
    async interact(page) {
      await page.mouse.wheel(0, 900);
      await page.evaluate(() => window.scrollBy(0, 900));
    },
  },
  {
    id: 'tear',
    file: 'tear.html',
    async interact(page) {
      await page.mouse.move(150, 320);
      await page.mouse.down();
      await page.mouse.move(750, 320, { steps: 25 });
      await page.mouse.up();
    },
  },
];

const browser = await chromium.launch();

for (const app of apps) {
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
  const filePath = resolve(root, 'docs/port-source', app.file).replace(/\\/g, '/');
  const url = `file:///${filePath}`;

  console.log(`[shoot-orig] loading ${app.id} from ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' }).catch(async () => {
    // Fallback if networkidle times out
    await page.waitForLoadState('domcontentloaded');
  });

  await page.waitForTimeout(2000);
  await page.mouse.move(200, 200);
  await page.mouse.move(700, 450, { steps: 20 });

  await app.interact(page);
  await page.waitForTimeout(800);

  const shotPath = `scripts/shots/orig-${app.id}.png`;
  await page.screenshot({ path: shotPath });
  console.log(`[shoot-orig] saved ${shotPath}`);

  await page.close();
}

await browser.close();
console.log('[shoot-orig] done');
