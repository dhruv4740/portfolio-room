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
await click('BLINDS');assert.equal((await state()).blindsOpen,'1');await idle('blinds open');await click('BLINDS');assert.equal((await state()).blindsOpen,'0');
await click('HEADPHONES');assert.equal((await state()).headphonesOn,'true');await idle('headphones on');await click('HEADPHONES');assert.equal((await state()).headphonesOn,'false');
for(let i=0;i<5&&(await page.getByRole('button',{name:'COFFEE',exact:true}).count());i++)await click('COFFEE');await idle('coffee empty');assert.equal((await state()).coffeeLevel,'0');
await click('REFILL COFFEE');await page.waitForFunction(()=>document.querySelector('.workspace-stage').dataset.coffeeLevel==='1'&&document.querySelector('.workspace-stage').dataset.actionState==='idle',null,{polling:100});await idle('coffee refilled');assert.equal((await state()).coffeeLevel,'1');
await click('AWARD');assert.equal((await state()).actionState,'award-reading');await idle('award reading');await page.keyboard.press('Escape');
await click('KEYBOARD');await page.waitForTimeout(300);await page.keyboard.type('hello');const input=page.frameLocator('[data-testid="dhruv-os-frame"]').locator('.term-input');await input.waitFor();await page.waitForTimeout(300);assert.equal(await input.inputValue(),'hello');await page.locator('canvas').focus();await page.keyboard.press('Backspace');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hell');await page.waitForTimeout(3000);await idle('live monitor typing');
await click('MONITOR');await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='inside',null,{polling:100});assert.equal(await input.inputValue(),'hell');await page.locator('[data-testid="back-to-room"]').click();await page.waitForFunction(()=>document.querySelector('.scan-root').dataset.entranceState==='room',null,{polling:100});await click('KEYBOARD');await page.waitForTimeout(200);await page.keyboard.type('o');await page.waitForTimeout(100);assert.equal(await input.inputValue(),'hello');
assert.deepEqual(errors,[]);console.log('PASS all room controls, depletion, cold/warm keyboard, no page errors');
await page.close();

} finally {
  await browser.close();
}
