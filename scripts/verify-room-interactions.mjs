import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','low');localStorage.setItem('v3:test','1');window.count=0;window.last=0;const r=requestAnimationFrame;window.requestAnimationFrame=f=>r(t=>{count++;last=performance.now();f(t);});});
const state=()=>page.locator('.workspace-stage').evaluate(e=>({...e.dataset}));
const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);};
async function idle(label){await page.waitForFunction(()=>performance.now()-last>700,null,{polling:100});const a=await page.evaluate(()=>count);await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>count),a,label);console.log('PASS idle',label);}
await page.goto(process.env.BASE||'http://127.0.0.1:4174');await page.locator('[data-object="chair"]').click();
await click('LAMP');assert.equal((await state()).lampOn,'0');await idle('lamp off');await page.screenshot({path:'scripts/shots/seven-lamp-off.png'});await click('LAMP');assert.equal((await state()).lampOn,'1');await page.screenshot({path:'scripts/shots/seven-lamp-on.png'});
await click('DRAWER');assert.equal((await state()).drawerOpen,'1');await idle('drawer open');await page.keyboard.press('Escape');
await click('BLINDS');assert.equal((await state()).blindsOpen,'1');await idle('blinds open');await click('BLINDS');assert.equal((await state()).blindsOpen,'0');

// Window visibility: opening must produce a measurable change in the window
// region of the seated frame, not just a state flag flip.
async function screenshotBase64() { return (await page.screenshot()).toString('base64'); }
async function regionDiffShare(beforeB64, afterB64) {
  return page.evaluate(({ before, after }) => new Promise((resolve) => {
    const load = (src) => new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.src = src; });
    Promise.all([load(`data:image/png;base64,${before}`), load(`data:image/png;base64,${after}`)]).then(([imgA, imgB]) => {
      const w = imgA.naturalWidth, h = imgA.naturalHeight;
      const canvasA = document.createElement('canvas'); canvasA.width = w; canvasA.height = h;
      const canvasB = document.createElement('canvas'); canvasB.width = w; canvasB.height = h;
      const ctxA = canvasA.getContext('2d'); const ctxB = canvasB.getContext('2d');
      ctxA.drawImage(imgA, 0, 0); ctxB.drawImage(imgB, 0, 0);
      // Window/blind region in the default seated frame, right side of the desk.
      const xMin = Math.floor(w * 0.78), xMax = Math.floor(w * 1.0);
      const yMin = Math.floor(h * 0.0), yMax = Math.floor(h * 0.62);
      const dataA = ctxA.getImageData(xMin, yMin, xMax - xMin, yMax - yMin).data;
      const dataB = ctxB.getImageData(xMin, yMin, xMax - xMin, yMax - yMin).data;
      let changed = 0, total = 0;
      for (let i = 0; i < dataA.length; i += 4) {
        const diff = Math.max(
          Math.abs(dataA[i] - dataB[i]),
          Math.abs(dataA[i + 1] - dataB[i + 1]),
          Math.abs(dataA[i + 2] - dataB[i + 2]),
        );
        if (diff > 12) changed++;
        total++;
      }
      resolve(changed / total);
    });
  }), { before: beforeB64, after: afterB64 });
}
await page.screenshot({path:'scripts/shots/window-closed-night.png'});
const windowClosedB64 = await screenshotBase64();
await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle('window open');
await page.screenshot({path:'scripts/shots/window-open-night.png'});
const windowOpenB64 = await screenshotBase64();
const windowDiffShare = await regionDiffShare(windowClosedB64, windowOpenB64);
assert.ok(windowDiffShare >= 0.03, `window open/closed pixel diff share ${windowDiffShare} < 0.03`);
console.log('PASS window visibility diff share', windowDiffShare);
await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('window closed');

// Audio sync (Job 3): city ambience must always match the window's state.
const playing = () => page.evaluate(() => window.__cityAmbience?.playing());

await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle('audio test 1: window open');
assert.equal(await playing(), true, 'audio should be playing once the window is open');
console.log('PASS audio test 1: open -> playing');

await click('WINDOW');
await page.waitForTimeout(80);
await click('WINDOW');
await idle('audio test 2: settle after rapid double-click');
{
  const open = (await state()).windowOpen === '1';
  const isPlaying = await playing();
  assert.equal(isPlaying, open, `audio (${isPlaying}) must match window state (${open}) after a rapid double-click`);
  console.log('PASS audio test 2: double-click settles consistent — windowOpen=', open, 'playing=', isPlaying);
}

if ((await state()).windowOpen !== '1') { await click('WINDOW'); await idle('audio test 3: re-open before close'); }
await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('audio test 3: window closed');
assert.equal(await playing(), false, 'audio should be silent once the window is closed');
console.log('PASS audio test 3: close -> silent');

await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle('audio test 4: window open before stand/sit');
assert.equal(await playing(), true);
await click('STAND UP / ESC');
await page.waitForTimeout(200);
assert.equal(await playing(), false, 'standing must stop audio');
console.log('PASS audio test 4a: stand up -> silent');
await page.locator('[data-object="chair"]').click();
await page.waitForTimeout(200);
assert.equal(await playing(), true, 'sitting back down with the window open must restart audio');
console.log('PASS audio test 4b: sit -> playing');
await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('audio test cleanup: window closed');
assert.equal(await playing(), false);

await click('HEADPHONES');assert.equal((await state()).headphonesOn,'true');await idle('headphones on');await click('HEADPHONES');assert.equal((await state()).headphonesOn,'false');
for(let i=0;i<5;i++)await click('COFFEE');assert.equal((await state()).coffeeLevel,'0');await idle('coffee empty');
await click('AWARD');assert.equal((await state()).actionState,'award-reading');await idle('award reading');await page.keyboard.press('Escape');
await click('KEYBOARD');await page.waitForTimeout(300);await page.keyboard.type('hello');const input=page.frameLocator('[data-testid="dhruv-os-frame"]').locator('.term-input');await input.waitFor();await page.waitForTimeout(300);assert.equal(await input.inputValue(),'hello');await page.locator('canvas').focus();await page.keyboard.press('Backspace');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hell');await page.waitForTimeout(3000);await idle('live monitor typing');
await click('MONITOR');await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='inside',null,{polling:100});assert.equal(await input.inputValue(),'hell');await page.locator('[data-testid="back-to-room"]').click();await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='room',null,{polling:100});await click('KEYBOARD');await page.waitForTimeout(200);await page.keyboard.type('o');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hello');
assert.deepEqual(errors,[]);console.log('PASS all room controls, depletion, cold/warm keyboard, no page errors');
await page.close();

for (const sky of ['day', 'dusk', 'night']) {
  const skyPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const skyErrors = [];
  skyPage.on('pageerror', e => skyErrors.push(e.message));
  await skyPage.addInitScript(() => {
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
  });
  await skyPage.goto(`${process.env.BASE || 'http://127.0.0.1:4174'}?sky=${sky}`);
  await skyPage.waitForSelector('.workspace-stage');
  assert.equal(await skyPage.locator('.workspace-stage').evaluate(e => e.dataset.skyState), sky);
  await skyPage.waitForTimeout(1200);
  await skyPage.screenshot({ path: `scripts/shots/sky-orbit-${sky}.png` });
  await skyPage.locator('[data-object="chair"]').click();
  await skyPage.waitForTimeout(1500);
  await skyPage.screenshot({ path: `scripts/shots/sky-seated-${sky}.png` });
  assert.deepEqual(skyErrors, [], `No page errors for sky=${sky}`);
  console.log(`PASS sky=${sky} loaded without page errors`);
  await skyPage.close();
}

await browser.close();
