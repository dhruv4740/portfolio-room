import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const results=[],errors=[];
try{
  const page=await browser.newPage({viewport:{width:1536,height:864},deviceScaleFactor:1.25});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('v3:test','1');localStorage.setItem('v3:surface-override','scan');
    localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','low');
    sessionStorage.setItem('v3:arrival-seen','1');sessionStorage.setItem('v3:controls','open');
  });
  await page.goto((process.env.BASE||'http://localhost:4173')+'/?sky=day');
  await page.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({state:'attached',timeout:30000});
  await page.locator('[data-launchpad-action="explore-room"]').click();await page.waitForTimeout(1800);
  await page.getByRole('button',{name:'PHONE',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.phoneState==='reaching');
  // Sampled by fraction of the pick-up so a retime still covers the reach, the lift and the whole roll.
  const duration=await page.evaluate(()=>window.__v3test.timeline().duration());
  for(const time of Array.from({length:28},(_,i)=>duration*(0.12+i*0.88/27))){
    await page.evaluate(t=>{window.__v3test.timeline().pause().time(t);},time);await page.waitForTimeout(100);
    const contact=await page.evaluate(()=>window.__v3test.phoneGripGeometry());
    results.push({time,...contact});
  }
  await page.screenshot({path:'scripts/shots/phone-grip-final.png',style:'.seat-exit,.telemetry-root{visibility:hidden!important}'});
  await page.evaluate(()=>{window.__v3test.timeline().play();});
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.phoneState==='zoomed');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.phoneState==='desk');
  console.log(JSON.stringify(results));
  await writeFile('scripts/shots/phone-grip-results.json',JSON.stringify({results,errors},null,2));
  assert.deepEqual(errors,[]);
  assert.ok(results.every(r=>r.inside===0),'Sampled skin vertices must remain outside the case interior');
}finally{await browser.close();}
