// Table of cold-load results: node scripts/perf-audit/summarize.mjs m1   (tag prefix)
import { readdirSync, readFileSync } from 'node:fs';
const dir = 'scripts/shots/perf', pre = `audit-cold-${process.argv[2] || ''}`;
console.log('tag | reveal s | canvas s | programs@reveal | programs final | long-task s before / after canvas | first quiet s');
for (const f of readdirSync(dir).filter(f => f.startsWith(pre)).sort()) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')), s = x => x == null ? '-' : (x / 1000).toFixed(1);
  const ser = d.progSeries || [], at = ser.find(x => x[2] === '1');
  const cv = d.ev.canvasVisible, tot = d.longTaskTotalMs, bef = d.longTasksBefore;
  console.log([d.tag, s(d.ev['roomRevealed:1']), s(cv), at ? at[1] : '-', d.programs, `${s(bef)} / ${bef == null ? '-' : s(tot - bef)}`, s(d.firstQuiet1sWindow)].join(' | '));
}
