// Diagnostic (not a suite): verify-tour's first block with a 250 ms state log, repeated until CrisisWatch is missed.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173', RUNS = +(process.env.RUNS || 5);
for (let run = 1; run <= RUNS; run++) {
  const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('v3:arrival-seen', '1'); });
  await p.goto(`${BASE}/#/`);
  await p.locator('[data-testid="room-overview"]').waitFor({ timeout: 60000 });
  await p.waitForTimeout(1000);
  await p.evaluate(() => { const s = performance.now(); window.__log = []; const f = () => { const fr = document.querySelector('iframe'), d = fr?.contentDocument, r = document.querySelector('.scan-root');
    window.__log.push([Math.round(performance.now() - s), location.hash, r?.dataset.entranceState, r?.dataset.seated, r?.dataset.overview, fr ? (fr.dataset.ready || 'mounted') : '-', [...(d?.querySelectorAll('[id^=win-body-]') || [])].map(e => e.id.slice(9)).join(','), document.querySelector('[data-testid="tour-caption"] p')?.textContent?.slice(0, 18) || (document.querySelector('[data-testid="tour-end"]') ? 'END' : '')]); };
    setInterval(f, 250); });
  await p.keyboard.press('4');
  await p.waitForTimeout(62000);
  const log = await p.evaluate(() => window.__log);
  const ok = log.some(x => x[2] === 'inside' && x[6].includes('crisiswatch')) && log.some(x => x[6].includes('fraud'));
  const changes = log.filter((x, i) => !i || JSON.stringify(x.slice(1)) !== JSON.stringify(log[i - 1].slice(1)));
  console.log(`run ${run} crisiswatch+fraud ${ok ? 'seen' : 'MISSED'} errors ${JSON.stringify(errors)}`);
  if (!ok || process.env.ALL) for (const c of changes) console.log('  ', JSON.stringify(c));
  await p.close(); await b.close();
  if (!ok && !process.env.ALL) break;
}
