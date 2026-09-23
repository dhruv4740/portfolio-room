// Tuning probe for the résumé/drawer grips: wrist bend and drawer clipping
// across the pick-up timeline for candidate grip parameters (tuneDrawerHandle).
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
await p.addInitScript(() => { localStorage.setItem('v3:test','1'); localStorage.setItem('v3:surface-override','scan'); localStorage.setItem('v3:seen-intro','1'); sessionStorage.setItem('v3:arrival-seen','1'); sessionStorage.setItem('v3:controls','open'); });
await p.goto((process.env.BASE||'http://localhost:4175')+'/?sky=day');
await p.locator('.workspace-stage:is([data-winter-city="ready"],[data-winter-city="skipped"])').waitFor({ state: 'attached', timeout: 90000 });
await p.locator('[data-launchpad-action="explore-room"]').click(); await p.waitForTimeout(2500);
await p.getByRole('button',{name:'RESUME',exact:true}).click();
await p.evaluate(()=>{window.__v3test.timeline().timeScale(0.0001);});
const at=(t,c={})=>p.evaluate(([t,c])=>{window.__v3test.timeline().seek(t);const r=window.__v3test.tuneDrawerHandle(c);return {desk:r.desk,clip:r.skin.split(' ')[0].split('/').map(Number).reduce((a,x)=>a+x,0)+r.desk,wrist:Math.max(r.wristDeg,r.wristL),wR:r.wristDeg,wL:r.wristL,gap:+r.handleGapMm.toFixed(1)};},[t,c]);
const mode=process.argv[2]||'timeline';
if(mode==='timeline'){const out=[];for(let t=0;t<=3.0;t+=0.2)out.push(t.toFixed(1)+':'+JSON.stringify(await at(t)));console.log(out.join('\n'));}
else {
  const [t,grid]=[+process.argv[3],JSON.parse(process.argv[4])];
  const keys=Object.keys(grid);const combos=keys.reduce((acc,k)=>acc.flatMap(c=>grid[k].map(v=>({...c,[k]:v}))),[{}]);
  const rows=[];for(const c of combos)rows.push({...c,...await at(t,c)});
  console.log(rows.filter(r=>r.clip===0).sort((a,b)=>a.wrist-b.wrist).slice(0,8).map(r=>JSON.stringify(r)).join('\n'));
}
await b.close();
