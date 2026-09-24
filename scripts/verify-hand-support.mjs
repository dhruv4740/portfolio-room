import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const errors=[],evidence={};
try{
  const page=await browser.newPage({viewport:{width:1536,height:864},deviceScaleFactor:1.25});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('v3:test','1');localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier','mid');sessionStorage.setItem('v3:arrival-seen','1');sessionStorage.setItem('v3:controls','open');});
  await page.goto((process.env.BASE||'http://localhost:4173')+'/?sky=night');
  // The first load can block the page ~30 s on this machine; Playwright's default click timeout is 30 s.
  await page.locator('[data-launchpad-action="explore-room"]').click({timeout:120000});await page.waitForTimeout(3000);
  evidence.rest=await page.evaluate(()=>({contact:__v3test.keyboardSkinContact(),body:__v3test.bodyAttachment(),hand:__v3test.boxOf('handL'),arm:__v3test.boxOf('armL')}));
  assert.notDeepEqual(evidence.rest.hand,evidence.rest.arm,'Arm and hand diagnostics must measure different geometry');
  for(const r of evidence.rest.contact){assert.ok(r.samples>0,'Actual skin must overlap keys for contact test');assert.ok(r.clearance>=.0015,'Resting skin must clear key surfaces');}
  for(const length of evidence.rest.body.upperArmLengths)assert.ok(Math.abs(length-.32)<.005,'Upper arms must preserve 32cm length');
  await page.screenshot({path:'scripts/shots/hand-support-night.png',style:'.seat-exit,.telemetry-root{visibility:hidden!important}'});
  await page.locator('.workspace-stage canvas').focus();
  evidence.typing=[];
  for(const key of ['f','j']){
    await page.keyboard.press(key);await page.waitForTimeout(70);
    const contact=await page.evaluate(()=>__v3test.keyboardSkinContact());evidence.typing.push({key,contact});
    for(const r of contact)assert.ok(r.clearance>=-.001,'Typing skin must not sink through key tops');
    await page.waitForTimeout(200);
  }
  await page.getByRole('button',{name:'COFFEE',exact:true}).click();
  await page.waitForTimeout(150);
  await page.evaluate(()=>{__v3test.timeline().pause().time(2);});await page.waitForTimeout(150);
  evidence.coffee=await page.evaluate(()=>__v3test.bodyAttachment());
  for(const length of evidence.coffee.upperArmLengths)assert.ok(Math.abs(length-.32)<.005,'Coffee pose must not stretch upper arms');
  await page.screenshot({path:'scripts/shots/hand-support-coffee.png',style:'.seat-exit,.telemetry-root{visibility:hidden!important}'});
  assert.deepEqual(errors,[]);console.log('PASS',JSON.stringify(evidence));
}finally{await writeFile('scripts/shots/hand-support.json',JSON.stringify({evidence,errors},null,2));await browser.close();}
