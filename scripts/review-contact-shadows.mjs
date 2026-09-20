// Codex-owned visual/debug check for the contact pass; not a full regression.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const watchdog=setTimeout(()=>{browser.close().finally(()=>process.exit(1));},90000);
let page;const errors=[];
try{
  page=await browser.newPage({viewport:{width:1536,height:864},deviceScaleFactor:1.25});
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')console.log('warning',m.text());});
  page.on('requestfailed',r=>console.log('request failed',r.url(),r.failure()));
  await page.addInitScript(()=>{
    localStorage.setItem('v3:test','1');localStorage.setItem('v3:surface-override','scan');
    localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','mid');
    sessionStorage.setItem('v3:arrival-seen','1');sessionStorage.setItem('v3:controls','open');
  });
  await page.goto('http://localhost:4173/?sky=night');
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({state:'attached',timeout:30000});
  await page.locator('[data-launchpad-action="explore-room"]').click();await page.waitForTimeout(2000);
  await page.addStyleTag({content:'.telemetry-root{display:none!important}'});
  console.log('contact state',await page.evaluate(()=>window.__v3test.contacts()));
  const count=await page.evaluate(()=>window.__v3test.contacts().captures);
  await page.waitForTimeout(1000);
  const idle=await page.evaluate(()=>window.__v3test.contacts().captures);
  assert.equal(idle,count,'Settled hands must not recapture contact shadows');
  await page.screenshot({path:'scripts/shots/contact-seat-on.png'});
  await page.evaluate(()=>{window.__v3test.setContactsEnabled(false);});await page.waitForTimeout(200);
  await page.screenshot({path:'scripts/shots/contact-seat-off.png'});
  await page.evaluate(()=>{window.__v3test.setContactsEnabled(true);});await page.waitForTimeout(200);
  await page.getByRole('button',{name:'COFFEE',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.actionState==='coffee');
  await page.evaluate(()=>{window.__v3test.timeline().pause().time(1.2);});await page.waitForTimeout(250);
  await page.screenshot({path:'scripts/shots/contact-coffee-lift.png'});
  assert.ok((await page.evaluate(()=>window.__v3test.contacts().captures))>count,'Moving hand/cup must refresh contacts');
  await page.evaluate(()=>{window.__v3test.timeline().play();});
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.actionState==='idle');
  await page.waitForTimeout(800);
  await page.screenshot({path:'scripts/shots/contact-coffee-return.png'});
  await page.evaluate(()=>{window.__v3test.setPixelRatio(1.25);});
  for(const enabled of [false,true]){
    await page.evaluate(value=>{window.__v3test.setContactsEnabled(value);},enabled);
    await page.waitForTimeout(1000);await page.evaluate(()=>{window.__v3test.gpuSamples(true);});
    await page.waitForTimeout(2500);
    console.log('fixed seat',enabled,await page.evaluate(()=>{
      const samples=window.__v3test.gpuSamples().sort((a,b)=>a-b);
      return {samples:samples.length,median:samples[Math.floor(samples.length*.5)],p95:samples[Math.floor(samples.length*.95)],perf:window.__v3test.perf(),contacts:window.__v3test.contacts()};
    }));
  }
  console.log('errors',errors);assert.deepEqual(errors,[]);
}catch(error){console.error('diagnostic',errors,await page?.locator('.workspace-stage').evaluate(e=>({...e.dataset})).catch(()=>null),await page?.locator('body').innerText({timeout:3000}).catch(()=>''));throw error;}
finally{clearTimeout(watchdog);await browser.close();}
