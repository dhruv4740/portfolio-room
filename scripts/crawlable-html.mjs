// Build-time crawlable HTML. A crawler or AI agent that does not run JavaScript
// gets the real content in the served HTML instead of an empty root div or a
// bare PDF <object>. Everything is generated from src/v3/content/index.js, the
// single source of truth; nothing here holds hand-copied text.
//
//   /         static semantic block inside <div id="root">; React's createRoot
//             clears the container on mount, so visitors with JS get the React
//             page exactly as before (see docs/HANDOFF.md, "Crawlable HTML").
//   /resume/  résumé text as a normal visible section below the PDF embed.
//   /llms.txt emitted into dist/.
//   Person JSON-LD knowsAbout comes from the skills list.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;
const list = (items) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '');
const para = (s) => (s ? `<p>${esc(s)}</p>` : '');
const dates = (e) => `${e.from} to ${e.to}`;

function caseStudy(c) {
  if (!c) return '';
  return `<p><b>Problem.</b> ${esc(c.problem)}</p><p><b>Decisions and trade-offs.</b> ${esc(c.decisions)}</p><p><b>Result.</b> ${esc(c.result)}</p>`;
}

function projectBlock(p, c, site) {
  const links = [];
  if (p.links?.live) links.push(link(p.links.live.startsWith('/') ? site + p.links.live : p.links.live, 'Live'));
  if (p.links?.github) links.push(link(p.links.github, 'Source'));
  return `<article id="p-${esc(p.id)}"><h3>${esc(p.name)} (${esc(p.year)})</h3>`
    + para(p.tagline)
    + (p.summary || p.description ? para(p.summary || p.description) : '')
    + (c.whatIDid[p.id] ? `<p><b>What I did.</b> ${esc(c.whatIDid[p.id])}</p>` : '')
    + (p.note ? para(p.note) : '')
    + (p.badge || p.label ? para(p.badge || p.label) : '')
    + (p.tech?.length ? `<p>Tech: ${esc(p.tech.join(', '))}</p>` : '')
    + caseStudy(p.caseStudy)
    + (links.length ? `<p>${links.join(' · ')}</p>` : '')
    + '</article>';
}

function experienceBlock(c) {
  return c.experience.map((e) => `<article><h3>${esc(e.role)}, ${esc(e.org)}</h3><p>${esc(dates(e))}${e.note ? ` · ${esc(e.note)}` : ''}</p>`
    + para(e.detail)
    + (e.bullets ? list(e.bullets.map(esc)) : '')
    + (e.metrics ? list(e.metrics.map((m) => `<b>${esc(m.value)}</b> ${esc(m.label)}`)) : '')
    + caseStudy(e.caseStudy)
    + '</article>').join('');
}

function workHtml(c, site) {
  const { identity, contact, education } = c;
  const listed = c.projects.filter((p) => p.description || p.tagline);
  const pick = (ids) => ids.map((id) => listed.find((p) => p.id === id)).filter(Boolean);
  const group = (title, ids) => `<h2>${title}</h2>${pick(ids).map((p) => projectBlock(p, c, site)).join('')}`;
  const blink = c.experience[0];
  return `<div class="ssr-work"><style>body{background:#ece7de;margin:0}.ssr-work{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 4rem;font:16px/1.55 system-ui,sans-serif;color:#17160f}.ssr-work a{color:#17160f}</style>`
    + `<main><h1>${esc(identity.name)}</h1><p>${esc(identity.headline)}</p><p>${esc(identity.now)}</p><p>${esc(identity.role)} · ${esc(identity.location)}</p>`
    + `<p>${[link('/resume/', 'Résumé'), link(contact.resume, 'Résumé (PDF)'), link(contact.github, contact.githubLabel), link(contact.linkedin, 'LinkedIn'), link('/room/', '3D room (laptop)')].join(' · ')}</p>`
    + `<h2>Proof</h2>${list(c.proofPoints.map((p) => `<b>${esc(p.value)}</b> ${esc(p.text)}`))}`
    + group('Featured', c.featuredProjectIds)
    + `<h2>At ${esc(blink.org)} (internship)</h2>${para(blink.detail)}${list(c.blinkTools.map((t) => `<b>${esc(t.name)}.</b> ${esc(t.detail)}`))}`
    + list((blink.metrics || []).map((m) => `<b>${esc(m.value)}</b> ${esc(m.label)}`))
    + group('Personal projects', c.personalProjectIds)
    + group('Hackathon projects', c.hackathonProjectIds)
    + `<h2>Achievements</h2>${list(c.achievements.map((a) => `${esc(a.label)}: ${esc(a.result)} (${esc(a.year)})`))}`
    + `<h2>Experience</h2>${experienceBlock(c)}`
    + `<h2>Education</h2><p>${esc(education.degree)}, ${esc(education.school)} (${esc(education.year)})</p>`
    + `<h2>Skills</h2>${list(c.skills.map((s) => esc(s.label + (s.note ? ` (${s.note})` : ''))))}`
    + `<h2>Contact</h2><p>${esc(identity.now)} Email ${link('mailto:' + contact.email, contact.email)}. ${link(contact.github, contact.githubLabel)} · ${link(contact.linkedin, 'LinkedIn')}</p>`
    + `</main></div>`;
}

function resumeHtml(c, site) {
  const { identity, contact, education } = c;
  const all = c.projects.filter((p) => p.description || p.tagline);
  const ids = [...c.featuredProjectIds, ...c.personalProjectIds, ...c.hackathonProjectIds];
  const projects = ids.map((id) => all.find((p) => p.id === id)).filter(Boolean);
  return `<section id="resume-text" aria-label="Résumé text"><h2>Résumé (text version)</h2>`
    + `<p>${esc(identity.name)}, ${esc(identity.role)}, ${esc(identity.location)}. ${esc(identity.now)}</p>`
    + `<h3>Experience</h3>${experienceBlock(c)}`
    + `<h3>Education</h3><p>${esc(education.degree)}, ${esc(education.school)} (${esc(education.year)})</p>`
    + `<h3>Skills</h3>${list(c.skills.map((s) => esc(s.label + (s.note ? ` (${s.note})` : ''))))}`
    + `<h3>Achievements</h3>${list(c.achievements.map((a) => `${esc(a.label)}: ${esc(a.result)} (${esc(a.year)})`))}`
    + `<h3>Projects</h3>${list(projects.map((p) => `<b>${esc(p.name)}</b> (${esc(p.year)}): ${esc(p.tagline || p.description)}${p.tech?.length ? ` Tech: ${esc(p.tech.join(', '))}.` : ''}`))}`
    + `<p>${link('mailto:' + contact.email, contact.email)} · ${link(contact.github, contact.githubLabel)} · ${link(contact.linkedin, 'LinkedIn')}</p></section>`;
}

function llmsTxt(c, site) {
  const { identity, contact, education } = c;
  return `# ${identity.name}

> ${identity.headline} ${identity.now} Based in ${identity.location}; ${education.degree} student at ${education.school}.

## Pages

- [Work](${site}/): projects, Blink.new growth tools with results, experience, education, contact.
- [Résumé](${site}/resume/): the résumé as a page, with the PDF at ${site}/resume.pdf.
- [3D room](${site}/room/): an interactive 3D desk with live project demos (laptop recommended).

## Contact

- Email: ${contact.email}
- GitHub: ${contact.github}
- LinkedIn: ${contact.linkedin}
`;
}

export default function crawlableHtml() {
  let site = 'https://dhruvkothari.com';
  let content;
  const load = async () => (content ??= await import(pathToFileURL(resolve(import.meta.dirname, '../src/v3/content/index.js')).href));
  return {
    name: 'crawlable-html',
    configResolved(config) { site = (config.env.VITE_SITE_URL || site).replace(/\/$/, ''); },
    async transformIndexHtml(html, ctx) {
      const c = await load();
      const skills = JSON.stringify(c.skills.map((s) => s.label));
      let out = html
        .replace(/"knowsAbout":\[[^\]]*\]/, `"knowsAbout":${skills}`)
        .replace(/"sameAs":\[[^\]]*\]/, `"sameAs":${JSON.stringify([c.contact.linkedin, c.contact.github])}`)
        .replace(/("alumniOf":\{[^}]*\})/, `$1,"affiliation":{"@type":"CollegeOrUniversity","name":${JSON.stringify(c.education.school)}}`);
      const path = ctx.path || '';
      if (path === '/index.html' || path === '/') out = out.replace('<div id="root"></div>', () => `<div id="root">${workHtml(c, site)}</div>`);
      else if (path === '/resume/index.html') out = out.replace('<!--RESUME_TEXT-->', () => resumeHtml(c, site));
      return out;
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt(await load(), site) });
    },
  };
}
