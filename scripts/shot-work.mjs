// Full-page frames of /work. BASE=... node scripts/shot-work.mjs [tag]
import {chromium} from 'playwright';
const BASE=process.env.BASE||'http://localhost:4176', tag=process.argv[2]||'now';
const b=await chromium.launch({channel:'chromium'});
for(const [n,w,h] of [['desktop',1440,900],['phone',390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto(`${BASE}/#/work`);await p.waitForSelector('.work-root');await p.waitForTimeout(800);
  await p.screenshot({path:`scripts/shots/work-${tag}-${n}.png`,fullPage:true});
  console.log(n,await p.evaluate(()=>document.documentElement.scrollHeight));await p.close();
}
await b.close();
