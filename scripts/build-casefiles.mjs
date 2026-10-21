// One-page case-file PDFs from the case-study text in src/v3/content/index.js -> public/casefiles/<id>.pdf.
// Runs as part of `npm run build`. Uses Playwright's Chromium to print; if that is unavailable (for example a CI image
// without browsers) it logs and exits 0, leaving the committed PDFs in place.
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = 'public/casefiles';
const IDS = ['blink', 'focuslock', 'darksentinel', 'blackout', 'portfolio3d'];
const SHOTS = { focuslock: 'public/previews/focuslock.jpg', darksentinel: 'public/previews/darksentinel.jpg', portfolio3d: 'public/og.jpg' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const { experience, projects, contact } = await import(pathToFileURL('src/v3/content/index.js').href);

const entry = (id) => {
  if (id === 'blink') {
    const e = experience[0];
    return { id, name: 'Blink.new growth tools', line: `${e.role}, ${e.org} · ${e.from} to ${e.to}`, cs: e.caseStudy, tech: ['Python', 'SQLite', 'Flask', 'YouTube Data API', 'Gmail API'], facts: e.metrics.map((m) => `${m.value} ${m.label}`), links: [] };
  }
  const p = projects.find((x) => x.id === id);
  return { id, name: p.name, line: p.tagline, cs: p.caseStudy, tech: p.tech || [], facts: [p.badge].filter(Boolean), broke: p.broke, links: [p.links?.github, p.links?.live && p.links.live !== '/' ? p.links.live : ''].filter(Boolean) };
};

async function html(id) {
  const e = entry(id);
  const shot = SHOTS[id] && existsSync(SHOTS[id]) ? `data:image/jpeg;base64,${(await readFile(SHOTS[id])).toString('base64')}` : '';
  const sec = (h, t) => (t ? `<h2>${h}</h2><p>${esc(t)}</p>` : '');
  return `<!doctype html><meta charset="utf-8"><style>
@page{size:A4;margin:16mm 17mm}
body{font:11pt/1.5 system-ui,'Segoe UI',sans-serif;color:#17160f;margin:0}
.k{font:600 8.5pt/1 ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#0f6b52;margin:0 0 6pt}
h1{font-size:24pt;line-height:1.15;margin:0 0 4pt;letter-spacing:-.02em}
.line{color:#5b584d;margin:0 0 12pt}
h2{font:600 8.5pt/1 ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#6b685d;margin:16pt 0 4pt}
p{margin:0}
img{width:100%;max-height:70mm;object-fit:cover;border-radius:6pt;margin:10pt 0 0;display:block}
.chips{margin-top:14pt;color:#5b584d;font-size:9.5pt}
.facts{margin:10pt 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4pt 14pt;font-size:9.5pt;color:#17160f}
footer{margin-top:20pt;padding-top:8pt;border-top:1pt solid #d8d2c6;font-size:9.5pt;color:#5b584d}
</style>
<p class="k">Case file</p><h1>${esc(e.name)}</h1><p class="line">${esc(e.line)}</p>
${sec('Problem', e.cs.problem)}${sec('Decisions', e.cs.decisions)}${sec('Result', e.cs.result)}${sec('What broke', e.broke)}
${shot ? `<img src="${shot}" alt="">` : ''}
${e.facts.length ? `<ul class="facts">${e.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
<p class="chips">${esc(e.tech.join(' · '))}</p>
<footer>${esc(contact.email)} · ${esc(contact.githubLabel || contact.github)}${e.links.length ? ` · ${esc(e.links.join(' · '))}` : ''} · dhruvkothari.pages.dev</footer>`;
}

let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.log('casefiles: playwright missing, keeping committed PDFs'); process.exit(0); }
let browser;
try { browser = await chromium.launch(); } catch (err) { console.log('casefiles: no browser, keeping committed PDFs'); process.exit(0); }
await mkdir(OUT, { recursive: true });
const page = await browser.newPage();
for (const id of IDS) {
  await page.setContent(await html(id), { waitUntil: 'load' });
  await page.pdf({ path: `${OUT}/${id}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('casefile', id);
}
await browser.close();
