// Frames of the open-window view. BASE=... node scripts/shot-window.mjs [tag] ; env SKIES=day,night
import {chromium} from 'playwright';
const BASE=process.env.BASE||'http://localhost:4176', tag=process.argv[2]||'now';
const b=await chromium.launch({channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
for(const sky of (process.env.SKIES||'day,night').split(',')){
  const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:test','1');sessionStorage.setItem('v3:arrival-seen','1');localStorage.setItem('v3:arrival-seen','1');});
  await p.goto(`${BASE}/?sky=${sky}`);await p.locator('[data-launchpad-action="explore-room"]').click();
  await p.waitForFunction(()=>document.querySelector('.scan-root')?.dataset.seated==='true',null,{timeout:60000});
  await p.waitForTimeout(2500);
  const t=p.locator('.seat-exit-toggle');if(await t.getAttribute('aria-expanded')!=='true')await t.click();
  await p.getByRole('button',{name:'WINDOW',exact:true}).click();
  await p.waitForTimeout(4000);
  const t0=Date.now();await p.screenshot({path:`scripts/shots/window-${tag}-${sky}.png`,timeout:90000});console.log('shot ms',Date.now()-t0);
  console.log(sky,JSON.stringify(await p.locator('.workspace-stage').evaluate(e=>({...e.dataset}))).slice(0,200),errs);
  await p.close();
}
await b.close();
