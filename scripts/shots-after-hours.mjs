import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chromium',args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
const watchdog=setTimeout(()=>{console.error('Screenshot flow exceeded 90 seconds');b.close().finally(()=>process.exit(1));},90000);
const BASE=process.env.BASE||'http://localhost:4173';
try {
  const page=await b.newPage({viewport:{width:1536,height:864},deviceScaleFactor:1.25});
  page.setDefaultTimeout(15000);
  const tier=process.env.TIER||'mid';
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(t=>{localStorage.setItem('v3:test','1');localStorage.setItem('v3:surface-override','scan');localStorage.setItem('v3:seen-intro','1');localStorage.setItem('v3:perf-tier',t);sessionStorage.setItem('v3:arrival-seen','1');sessionStorage.setItem('v3:controls','open');},tier);
  await page.goto(`${BASE}/?sky=night`);
  await page.locator('.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]').waitFor({timeout:30000});
  await page.waitForTimeout(1800);
  await page.addStyleTag({content:'.telemetry-root{display:none!important}'});
  await page.screenshot({path:`scripts/shots/after-hours-${tier}-overview.png`});
  await page.locator('[data-launchpad-action="explore-room"]').click();await page.waitForTimeout(1600);
  await page.screenshot({path:`scripts/shots/after-hours-${tier}-seat.png`});
  console.log('seated',await page.evaluate(()=>window.__v3test.perf()));
  await page.getByRole('button',{name:'WINDOW',exact:true}).click();await page.waitForTimeout(2200);
  await page.screenshot({path:`scripts/shots/after-hours-${tier}-window.png`});
  console.log('window',await page.evaluate(()=>window.__v3test.perf()));
  await page.getByRole('button',{name:'BACK TO SEAT',exact:true}).click();await page.waitForTimeout(1500);
  console.log('returned',await page.locator('.workspace-stage').evaluate(e=>({...e.dataset})));
  await page.getByRole('button',{name:'COFFEE',exact:true}).click();
  console.log('coffee selected',await page.locator('.workspace-stage').evaluate(e=>({...e.dataset})));
  await page.waitForFunction(()=>document.querySelector('.workspace-stage')?.dataset.actionState==='coffee',null,{timeout:10000});
  // GSAP timelines are thenables: never return a paused timeline to Playwright.
  await page.evaluate(()=>{window.__v3test.timeline().pause().time(2);});await page.waitForTimeout(200);
  await page.screenshot({path:`scripts/shots/after-hours-${tier}-coffee.png`});
  await page.evaluate(()=>{window.__v3test.timeline().play();});
  console.log('errors',errors);
  if(errors.length)process.exitCode=1;
} finally {
  clearTimeout(watchdog);
  await b.close();
}
