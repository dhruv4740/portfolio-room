import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.error('[PAGEERROR]', err.message);
  });
  
  console.log('[test] Navigating...');
  await page.goto('http://localhost:4173', { waitUntil: 'commit', timeout: 15000 });
  
  console.log('[test] Waiting 3s...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('[test] Checking DOM...');
  const info = await page.evaluate(() => {
    return {
      title: document.title,
      loaders: document.querySelectorAll('[style*="position: fixed"]').length,
      canvases: document.querySelectorAll('canvas').length,
      hasErrors: !!window.__errors,
    };
  });
  
  console.log('[test] DOM info:', info);
  
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('[test] Fatal:', err);
  process.exit(1);
});
