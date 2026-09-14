import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','low');window.count=0;window.last=0;const r=requestAnimationFrame;window.requestAnimationFrame=f=>r(t=>{count++;last=performance.now();f(t);});});
const state=()=>page.locator('.workspace-stage').evaluate(e=>({...e.dataset}));
const click=async name=>{await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);};
async function idle(label){await page.waitForFunction(()=>performance.now()-last>700,null,{polling:100});const a=await page.evaluate(()=>count);await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>count),a,label);console.log('PASS idle',label);}
await page.goto(process.env.BASE||'http://127.0.0.1:4174');await page.locator('[data-object="chair"]').click();
await click('LAMP');assert.equal((await state()).lampOn,'0');await idle('lamp off');await page.screenshot({path:'scripts/shots/seven-lamp-off.png'});await click('LAMP');assert.equal((await state()).lampOn,'1');await page.screenshot({path:'scripts/shots/seven-lamp-on.png'});
await click('DRAWER');assert.equal((await state()).drawerOpen,'1');await idle('drawer open');await page.keyboard.press('Escape');
await click('BLINDS');assert.equal((await state()).blindsOpen,'1');await idle('blinds open');await click('BLINDS');assert.equal((await state()).blindsOpen,'0');
await click('WINDOW');assert.equal((await state()).windowOpen,'1');await idle('window open');await page.screenshot({path:'scripts/shots/window-open-night.png'});await click('WINDOW');assert.equal((await state()).windowOpen,'0');await idle('window closed');await page.screenshot({path:'scripts/shots/window-closed-night.png'});
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
