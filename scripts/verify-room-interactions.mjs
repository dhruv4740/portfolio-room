import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch(process.env.GPU === '1' ? {channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']} : {});
try {
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','low');localStorage.setItem('v3:test','1');sessionStorage.setItem('v3:arrival-seen','1');window.count=0;window.last=0;const r=requestAnimationFrame;window.requestAnimationFrame=f=>r(t=>{count++;last=performance.now();f(t);});});
const state=()=>page.locator('.workspace-stage').evaluate(e=>({...e.dataset}));
const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);};
const openObjects=async onPage=>{const toggle=onPage.locator('.seat-exit-toggle');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();};
async function idle(label){await page.waitForFunction(()=>performance.now()-last>700,null,{polling:100});const a=await page.evaluate(()=>count);await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>count),a,label);console.log('PASS idle',label);}
await page.goto((process.env.BASE||'http://localhost:4173')+'/?sky=night');await page.locator('[data-testid="room-overview"]').waitFor();await page.locator('[data-launchpad-action="explore-room"]').click();
await openObjects(page);
await click('LAMP');assert.equal((await state()).lampOn,'0');await idle('lamp off');await page.screenshot({path:'scripts/shots/seven-lamp-off.png'});await click('LAMP');assert.equal((await state()).lampOn,'1');await page.screenshot({path:'scripts/shots/seven-lamp-on.png'});
await click('RESUME');await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.actionState==='resume-reading',null,{polling:100});
assert.equal((await state()).drawerOpen,'1');await idle('resume held');await page.screenshot({path:'scripts/shots/resume-in-hand.png'});
assert.equal(await page.locator('.resume-link').count(),0,'no separate resume page link');
await page.keyboard.press('Escape');
await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.actionState==='idle',null,{polling:100});
assert.equal((await state()).drawerOpen,'0');
console.log('PASS resume page lifted from the drawer, put back and drawer closed on Escape');
await click('BLINDS');assert.equal((await state()).blindsOpen,'1');await idle('blinds open');await click('BLINDS');assert.equal((await state()).blindsOpen,'0');

// The sash is behind the closed blinds, so opening the window with the
// blinds down must raise them first (round 4 Job 1) — otherwise the sash
// slide is invisible from the seat. Closing the window does not lower them.
await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle('window open (auto-raise)');
assert.ok(Number((await state()).blindsOpen) > 0.5, `opening the window must raise closed blinds, got blindsOpen=${(await state()).blindsOpen}`);
console.log('PASS opening the window raises closed blinds');
await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('window closed (blinds stay up)');
assert.ok(Number((await state()).blindsOpen) > 0.5, 'closing the window must not lower the blinds');
console.log('PASS closing the window leaves the blinds up');
await click('BLINDS');assert.equal((await state()).blindsOpen,'0');await idle('blinds reset closed');

// Window visibility: opening must produce a measurable change in the window
// region of the seated frame, not just a state flag flip. Markers/labels are
// hidden via an injected !important stylesheet rule (an inline style would be
// overwritten by updateMarkers() on the next render frame).
// .anchor-marker's visibility is reassigned every render frame by
// updateMarkers() via a plain (non-important) inline style, so only a
// stylesheet !important rule survives across frames; .seat-exit is a static
// React panel untouched by the render loop, so a direct toggle is enough —
// but it must be shown again before the next WINDOW click or the button is
// unclickable.
await page.addStyleTag({ content: '.v3-hide-overlay .anchor-marker{visibility:hidden!important}' });
// A style/layout recalc lag was observed: getComputedStyle can still report
// the pre-change value for one frame after the assignment, so a short wait
// is required before the screenshot actually reflects the hidden state.
async function hideSeatExit(onPage) { await onPage.evaluate(() => { document.documentElement.classList.add('v3-hide-overlay'); const e = document.querySelector('.seat-exit'); if (e) e.style.visibility = 'hidden'; }); await onPage.waitForTimeout(80); }
async function showSeatExit(onPage) { await onPage.evaluate(() => { document.documentElement.classList.remove('v3-hide-overlay'); const e = document.querySelector('.seat-exit'); if (e) e.style.visibility = ''; }); await onPage.waitForTimeout(80); }
async function screenshotBase64() { return (await page.screenshot()).toString('base64'); }
async function regionDiffShare(beforeB64, afterB64, region) { return regionDiffShareOn(page, beforeB64, afterB64, region); }
async function regionDiffShareOn(onPage, beforeB64, afterB64, region) {
  return onPage.evaluate(({ before, after, region }) => new Promise((resolve) => {
    const load = (src) => new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.src = src; });
    Promise.all([load(`data:image/png;base64,${before}`), load(`data:image/png;base64,${after}`)]).then(([imgA, imgB]) => {
      const w = imgA.naturalWidth, h = imgA.naturalHeight;
      const canvasA = document.createElement('canvas'); canvasA.width = w; canvasA.height = h;
      const canvasB = document.createElement('canvas'); canvasB.width = w; canvasB.height = h;
      const ctxA = canvasA.getContext('2d'); const ctxB = canvasB.getContext('2d');
      ctxA.drawImage(imgA, 0, 0); ctxB.drawImage(imgB, 0, 0);
      const xMin = Math.max(0, Math.floor(region.xMin)), xMax = Math.min(w, Math.ceil(region.xMax));
      const yMin = Math.max(0, Math.floor(region.yMin)), yMax = Math.min(h, Math.ceil(region.yMax));
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
  }), { before: beforeB64, after: afterB64, region });
}
async function cropRegion(pngPath, region, outPath) {
  const buf = (await import('node:fs/promises')).readFile(pngPath);
  const b64 = (await buf).toString('base64');
  const cropped = await page.evaluate(({ dataUrl, region }) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = region.xMax - region.xMin; c.height = region.yMax - region.yMin;
      c.getContext('2d').drawImage(img, region.xMin, region.yMin, c.width, c.height, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png').split(',')[1]);
    };
    img.src = dataUrl;
  }), { dataUrl: `data:image/png;base64,${b64}`, region });
  await (await import('node:fs/promises')).writeFile(outPath, Buffer.from(cropped, 'base64'));
}
async function windowVisibilityCheck(label, suffix) {
  // Isolate the sash: raise the blinds first so both shots share the same
  // blinds state and only the sash slide can move pixels in the region.
  await click('BLINDS');assert.equal((await state()).blindsOpen,'1');await idle(`blinds raised for isolation (${label})`);
  const anchor = await page.evaluate(() => window.__v3test.projectAnchor('windowOpen'));
  const vp = page.viewportSize();
  const marginX = vp.width * 0.12, marginY = vp.height * 0.12;
  const region = { xMin: anchor.x - marginX, xMax: anchor.x + marginX, yMin: anchor.y - marginY, yMax: anchor.y + marginY };
  await hideSeatExit(page);
  await page.screenshot({path:`scripts/shots/window-closed-${suffix}.png`});
  const closedB64 = await screenshotBase64();
  await showSeatExit(page);
  await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle(`window open (${label})`);
  await hideSeatExit(page);
  await page.screenshot({path:`scripts/shots/window-open-${suffix}.png`});
  const openB64 = await screenshotBase64();
  await showSeatExit(page);
  const diffShare = await regionDiffShare(closedB64, openB64, region);
  assert.ok(diffShare >= 0.03, `window open/closed pixel diff share ${diffShare} < 0.03 (${label})`);
  console.log(`PASS window visibility diff share (${label})`, diffShare);
  if (suffix === 'night') {
    await cropRegion(`scripts/shots/window-closed-${suffix}.png`, region, `scripts/shots/window-crop-closed-${suffix}.png`);
    await cropRegion(`scripts/shots/window-open-${suffix}.png`, region, `scripts/shots/window-crop-open-${suffix}.png`);
  }
  await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle(`window closed (${label})`);
  await click('BLINDS');assert.equal((await state()).blindsOpen,'0');await idle(`blinds reset closed (${label})`);
}
await windowVisibilityCheck('night', 'night');

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
await page.locator('[data-testid="room-overview"]').waitFor();await page.locator('[data-launchpad-action="explore-room"]').click();
await page.waitForTimeout(200);
assert.equal(await playing(), true, 'sitting back down with the window open must restart audio');
console.log('PASS audio test 4b: sit -> playing');
await openObjects(page);
await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('audio test cleanup: window closed');
assert.equal(await playing(), false);

await click('HEADPHONES');assert.equal((await state()).headphonesOn,'true');await idle('headphones on');await click('HEADPHONES');assert.equal((await state()).headphonesOn,'false');
for(let i=0;i<5&&(await page.getByRole('button',{name:'COFFEE',exact:true}).count());i++)await click('COFFEE');await idle('coffee empty');assert.equal((await state()).coffeeLevel,'0');
await click('REFILL COFFEE');await page.waitForFunction(()=>document.querySelector('.workspace-stage').dataset.coffeeLevel==='1'&&document.querySelector('.workspace-stage').dataset.actionState==='idle',null,{polling:100});await idle('coffee refilled');assert.equal((await state()).coffeeLevel,'1');
await click('AWARD');assert.equal((await state()).actionState,'award-reading');await idle('award reading');await page.keyboard.press('Escape');
await click('KEYBOARD');await page.waitForTimeout(300);await page.keyboard.type('hello');const input=page.frameLocator('[data-testid="dhruv-os-frame"]').locator('.term-input');await input.waitFor();await page.waitForTimeout(300);assert.equal(await input.inputValue(),'hello');await page.locator('canvas').focus();await page.keyboard.press('Backspace');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hell');await page.waitForTimeout(3000);await idle('live monitor typing');
await click('MONITOR');await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='inside',null,{polling:100});assert.equal(await input.inputValue(),'hell');await page.locator('[data-testid="back-to-room"]').click();await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='room',null,{polling:100});await click('KEYBOARD');await page.waitForTimeout(200);await page.keyboard.type('o');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hello');
assert.deepEqual(errors,[]);console.log('PASS all room controls, depletion, cold/warm keyboard, no page errors');
await page.close();

// Window visibility must also hold in daytime, where the skyline-through-the-
// gap contrast against the closed glass is smaller than at night.
{
  const dayPage = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const dayErrors=[];dayPage.on('pageerror',e=>dayErrors.push(e.message));
  await dayPage.addInitScript(()=>{localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','low');localStorage.setItem('v3:test','1');sessionStorage.setItem('v3:arrival-seen','1');});
  await dayPage.goto((process.env.BASE||'http://localhost:4173')+'/?sky=day');
  await dayPage.locator('[data-testid="room-overview"]').waitFor();
  await dayPage.locator('[data-launchpad-action="explore-room"]').click();
  await dayPage.waitForTimeout(600);
  await openObjects(dayPage);
  await dayPage.addStyleTag({content:'.v3-hide-overlay .anchor-marker{visibility:hidden!important}'});
  const dayClick=async name=>{await dayPage.getByRole('button',{name,exact:true}).click();await dayPage.waitForTimeout(100);};
  const dayState=()=>dayPage.locator('.workspace-stage').evaluate(e=>({...e.dataset}));
  await dayClick('BLINDS');assert.equal((await dayState()).blindsOpen,'1');await dayPage.waitForTimeout(900);
  const anchor=await dayPage.evaluate(()=>window.__v3test.projectAnchor('windowOpen'));
  const vp=dayPage.viewportSize();const marginX=vp.width*0.12,marginY=vp.height*0.12;
  const region={xMin:anchor.x-marginX,xMax:anchor.x+marginX,yMin:anchor.y-marginY,yMax:anchor.y+marginY};
  await hideSeatExit(dayPage);
  await dayPage.screenshot({path:'scripts/shots/window-closed-day.png'});
  const closedB64=(await dayPage.screenshot()).toString('base64');
  await showSeatExit(dayPage);
  await dayClick('WINDOW');assert.equal((await dayState()).windowOpen,'1');await dayPage.waitForTimeout(900);
  await hideSeatExit(dayPage);
  await dayPage.screenshot({path:'scripts/shots/window-open-day.png'});
  const openB64=(await dayPage.screenshot()).toString('base64');
  await showSeatExit(dayPage);
  const diffShare=await regionDiffShareOn(dayPage,closedB64,openB64,region);
  assert.ok(diffShare>=0.03,`window open/closed pixel diff share ${diffShare} < 0.03 (day)`);
  console.log('PASS window visibility diff share (day)',diffShare);
  assert.deepEqual(dayErrors,[]);
  await dayPage.close();
}

for (const sky of ['day', 'dusk', 'night']) {
  const skyPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const skyErrors = [];
  skyPage.on('pageerror', e => skyErrors.push(e.message));
  await skyPage.addInitScript(() => {
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    sessionStorage.setItem('v3:arrival-seen', '1');
  });
  await skyPage.goto(`${process.env.BASE || 'http://localhost:4173'}?sky=${sky}`);
  await skyPage.waitForSelector('.workspace-stage');
  assert.equal(await skyPage.locator('.workspace-stage').evaluate(e => e.dataset.skyState), sky);
  await skyPage.waitForTimeout(1200);
  await skyPage.screenshot({ path: `scripts/shots/sky-orbit-${sky}.png` });
  await skyPage.locator('[data-testid="room-overview"]').waitFor();
  await skyPage.locator('[data-launchpad-action="explore-room"]').click();
  await skyPage.waitForTimeout(1500);
  await skyPage.screenshot({ path: `scripts/shots/sky-seated-${sky}.png` });
  assert.deepEqual(skyErrors, [], `No page errors for sky=${sky}`);
  console.log(`PASS sky=${sky} loaded without page errors`);
  await skyPage.close();
}

} finally {
  await browser.close();
}
