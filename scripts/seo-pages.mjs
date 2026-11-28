// SEO and AEO output, generated from src/v3/content/index.js at build time (called by scripts/crawlable-html.mjs).
// Nothing here holds hand-copied portfolio text, so the pages, sitemap, JSON-LD and llms files cannot drift.
//
//   /projects/<slug>/index.html   one static page per project that has case-study or what-I-did text (no JavaScript, no React)
//   sitemap.xml, robots.txt, llms.txt, llms-full.txt
//   homeJsonLd(c, site)           the @graph for the home page head
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

// Short title hooks, written once here. Each page title is "<Name>: <hook> | Dhruv Kothari".
const HOOKS = {
  blink: 'outreach, link building and AI-search tracking',
  focuslock: 'screen-time limiter for Android and Windows',
  expense: 'Android app that logs spending from your payment texts',
  basket: 'grocery cart totals after fees',
  darksentinel: 'dark-web traffic monitor, top 5 hackathon finalist',
  hexfence: 'wallet guard against lookalike address scams',
  portfolio3d: 'a studio room that runs live project demos',
  blackout: 'Android app that keeps an OLED screen black while audio plays',
};

const CASE_SECTIONS = [['problem', 'Problem'], ['decisions', 'Decisions'], ['broke', 'What broke'], ['result', 'Result']];

// One normalised entry per project page.
export function projectEntries(c, root) {
  const out = [];
  for (const [id, slug] of Object.entries(c.projectSlugs)) {
    let e;
    if (id === 'blink') {
      const b = c.experience[0];
      e = {
        id, slug, name: 'Blink.new growth tools', year: 2026, lead: b.detail,
        meta: `${b.role} at ${b.org}, ${b.from} to ${b.to}`,
        sections: [
          ['Summary', asList(b.caseStudy?.summary)],
          ...CASE_SECTIONS.map(([k, h]) => [h, asList(b.caseStudy?.[k])]),
          ['The four tools', c.blinkTools.map((t) => `${t.name}. ${t.detail}`)],
          ['Numbers', (b.metrics || []).map((m) => `${m.value} ${m.label}`)],
        ],
        tech: [], links: {}, pdf: Boolean(b.caseStudy?.pdf), github: '',
      };
    } else {
      const p = c.projects.find((x) => x.id === id);
      if (!p) continue;
      const overview = p.summary || (id === 'hexfence' ? p.description : '');
      e = {
        id, slug, name: p.name, year: p.year, lead: p.tagline,
        meta: [p.year, p.badge].filter(Boolean).join(' · '),
        overview: sameText(overview, p.tagline) || String(p.tagline || '').startsWith(overview) ? '' : overview,
        did: c.whatIDid[id],
        sections: CASE_SECTIONS.map(([k, h]) => [h, asList(p.caseStudy?.[k])]),
        tech: p.tech || [], links: p.links || {}, pdf: Boolean(p.caseStudy?.pdf), github: p.links?.github || '',
      };
    }
    e.sections = e.sections.filter(([, items]) => items.length);
    e.title = `${e.name}: ${HOOKS[id]} | ${c.identity.name}`;
    e.desc = (id === 'blink' ? c.experience[0].detail : (c.projects.find((x) => x.id === id).summary || e.lead));
    e.image = existsSync(resolve(root, `public/previews/${id}.jpg`)) ? `/previews/${id}.jpg` : '';
    out.push(e);
  }
  return out;
}

const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const FONT_CSS = "@font-face{font-family:'IBM Plex Sans';font-style:normal;font-weight:400 600;font-stretch:100%;font-display:swap;src:url(/fonts/plex-sans-latin.woff2) format('woff2')}";
const PAGE_CSS = `${FONT_CSS}
:root{--bg:#ece7de;--paper:#fbfaf7;--ink:#17160f;--ink2:#3a3832;--mute:#6b675e;--line:#d8d2c6;--acc:#b53b0a}
*{box-sizing:border-box}html{background:var(--bg)}
body{margin:0;color:var(--ink);font:17px/1.6 'IBM Plex Sans',system-ui,sans-serif;-webkit-text-size-adjust:100%}
a{color:var(--ink);text-underline-offset:3px}a:hover{color:var(--acc)}a:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:2px}
.wrap{max-width:46rem;margin:0 auto;padding:28px 20px 64px}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;margin:0 0 28px;font-size:14px}
.top .crumbs{margin:0}
.top nav{display:flex;gap:16px}
.top nav a{color:var(--ink);font-weight:500}
.crumbs{font-size:14px;color:var(--mute);margin:0 0 28px}
.crumbs a{color:inherit}
h1{font-size:clamp(32px,6vw,46px);line-height:1.1;letter-spacing:-.025em;font-weight:600;margin:0 0 12px}
.lead{font-size:19px;color:var(--ink2);margin:0 0 8px}
.meta{font-size:14px;color:var(--mute);margin:0 0 28px}
h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);font-weight:500;margin:36px 0 10px}
p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:22px}li{margin:0 0 8px}
.shot{display:block;width:100%;height:auto;border-radius:12px;border:1px solid var(--line);margin:32px 0 0;background:var(--paper)}
.tech{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0 0 14px}
.tech li{margin:0;padding:3px 11px;border:1px solid var(--line);border-radius:99px;background:var(--paper);font-size:14px;color:var(--ink2)}
.links{display:flex;flex-wrap:wrap;gap:10px;list-style:none;padding:0;margin:0 0 14px}
.links li{margin:0}.links a{display:inline-block;padding:9px 18px;border:1px solid var(--ink);border-radius:99px;text-decoration:none;font-size:15px}
.links a:hover,.links a:focus-visible{background:var(--ink);color:var(--bg)}
.more{margin-top:44px;padding-top:20px;border-top:1px solid var(--line)}
.more ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}.more li{margin:0}
.back{display:inline-block;margin:0 0 6px;font-weight:500}
@media (max-width:480px){body{font-size:16px}.lead{font-size:18px}.links a{padding:10px 16px}}`;

export function projectPage(e, all, c, site) {
  const url = `${site}/projects/${e.slug}/`;
  const img = e.image ? `${site}${e.image}` : `${site}/og.jpg`;
  const links = [];
  if (e.links.live) links.push([e.links.live.startsWith('/') ? e.links.live : e.links.live, e.links.live === '/room/' ? 'Open the 3D room' : 'Live demo']);
  if (e.links.github) links.push([e.links.github, 'Source code']);
  if (e.links.demo) links.push([e.links.demo, 'Demo video']);
  if (e.pdf) links.push([`/casefiles/${e.id}.pdf`, 'Case file (PDF)']);
  const person = { '@id': `${site}/#person` };
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` },
    { '@type': 'ListItem', position: 2, name: 'Projects', item: `${site}/#work-main` },
    { '@type': 'ListItem', position: 3, name: e.name, item: url },
  ] };
  const thing = e.github
    ? { '@type': 'SoftwareSourceCode', name: e.name, description: e.desc, url, codeRepositoryUrl: e.github, programmingLanguage: e.tech, author: person }
    : { '@type': 'SoftwareApplication', name: e.name, description: e.desc, url, author: person };
  if (e.image) thing.image = img;
  const jsonld = { '@context': 'https://schema.org', '@graph': [crumbs, thing] };
  const others = all.filter((x) => x.id !== e.id);
  const body = `<main class="wrap">
<div class="top"><p class="crumbs"><a href="/">Home</a> / <a href="/#work-main">Projects</a> / ${esc(e.name)}</p><nav aria-label="Contact"><a href="${esc(c.contact.resume)}">Résumé</a><a href="mailto:${esc(c.contact.email)}">Email</a></nav></div>
<h1>${esc(e.name)}</h1>
<p class="lead">${esc(e.lead)}</p>
${e.meta ? `<p class="meta">${esc(e.meta)}</p>` : ''}
${e.overview ? `<h2>Overview</h2><p>${esc(e.overview)}</p>` : ''}
${e.did ? `<h2>What I did</h2><p>${esc(e.did)}</p>` : ''}
${e.sections.map(([h, items]) => `<h2>${esc(h)}</h2>${items.length === 1 ? `<p>${esc(items[0])}</p>` : `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`}`).join('\n')}
${e.tech.length ? `<h2>Built with</h2><ul class="tech">${e.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
${e.image ? `<img class="shot" src="${esc(e.image)}" width="1600" height="1000" alt="${esc(`${e.name} screenshots`)}" loading="lazy">` : ''}
${links.length ? `<h2>Links</h2><ul class="links">${links.map(([h, t]) => `<li><a href="${esc(h)}"${h.startsWith('http') ? ' rel="noopener noreferrer"' : ''}>${esc(t)}</a></li>`).join('')}</ul>` : ''}
<div class="more"><p><a class="back" href="/">Back to ${esc(c.identity.name)}'s portfolio</a></p>
<h2>More projects</h2><ul>${others.map((x) => `<li><a href="/projects/${esc(x.slug)}/">${esc(x.name)}</a></li>`).join('')}</ul></div>
</main>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#ece7de">
<title>${esc(e.title)}</title>
<meta name="description" content="${esc(e.desc)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="text/markdown" href="/llms.txt">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(c.identity.name)}">
<meta property="og:title" content="${esc(e.title)}">
<meta property="og:description" content="${esc(e.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(e.title)}">
<meta name="twitter:description" content="${esc(e.desc)}">
<meta name="twitter:image" content="${esc(img)}">
${ld(jsonld)}
<link rel="preload" href="/fonts/plex-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<style>${PAGE_CSS}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

export function homeJsonLd(c, site, entries) {
  const { identity, contact, education, experience } = c;
  const blink = experience[0];
  const person = {
    '@type': 'Person', '@id': `${site}/#person`, name: identity.name, alternateName: ['dhruv4740'], url: `${site}/`,
    image: `${site}/og.jpg`, jobTitle: identity.role, description: identity.pitch, email: contact.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
    hasOccupation: { '@type': 'Occupation', name: blink.role, description: `${blink.role} at ${blink.org}, ${blink.from} to ${blink.to}. ${blink.detail}` },
    sameAs: [contact.github, contact.linkedin, contact.twitter].filter(Boolean),
    knowsAbout: c.skills.map((s) => s.label),
  };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    person,
    { '@type': 'WebSite', '@id': `${site}/#website`, name: identity.name, url: `${site}/`, publisher: { '@id': `${site}/#person` } },
    { '@type': 'ProfilePage', '@id': `${site}/#profile`, url: `${site}/`, name: `${identity.name}, ${identity.role.toLowerCase()}`, mainEntity: { '@id': `${site}/#person` } },
    { '@type': 'ItemList', name: 'Projects', itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.name, url: `${site}/projects/${e.slug}/` })) },
  ] });
}

export function sitemap(c, site, entries, date) {
  const urls = [`${site}/`, `${site}/room/`, `${site}/resume/`, ...entries.map((e) => `${site}/projects/${e.slug}/`), `${site}${c.contact.resume}`, ...entries.filter((e) => e.pdf).map((e) => `${site}/casefiles/${e.id}.pdf`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${date}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

const BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckAssistBot'];
export function robots(site) {
  const group = (ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /api/\n`;
  return `${['*', ...BOTS].map(group).join('\n')}\nSitemap: ${site}/sitemap.xml\n`;
}

export function llmsTxt(c, site, entries) {
  const { identity, contact, education } = c;
  const line = (e) => `- [${e.name}](${site}/projects/${e.slug}/): ${e.lead}`;
  return `# ${identity.name}

> ${identity.headline} ${identity.now} Based in ${identity.location}. ${education.degree} student at ${education.school}.

## Projects

${entries.map(line).join('\n')}

## Pages

- [Portfolio home](${site}/): projects, Blink.new growth tools with results, experience, education and contact.
- [Résumé](${site}/resume/): the résumé as a page, with the PDF at ${site}${contact.resume}.
- [3D room](${site}/room/): an interactive 3D desk with live project demos (laptop recommended).
- [Full text for AI tools](${site}/llms-full.txt): everything on this site as plain text.

## Contact and profiles

- [Email](mailto:${contact.email}): ${contact.email}
- [GitHub](${contact.github}): code for FocusLock, Expense Tracker, Blackout and more.
- [LinkedIn](${contact.linkedin}): work history.
`;
}

export function llmsFull(c, site, entries) {
  const { identity, contact, education, experience } = c;
  const bullets = (items) => asList(items).map((i) => `- ${i}`).join('\n');
  const caseBlock = (cs) => CASE_SECTIONS.filter(([k]) => asList(cs?.[k]).length).map(([k, h]) => `### ${h}\n\n${bullets(cs[k])}`).join('\n\n');
  const slugOf = (id) => c.projectSlugs[id];
  const proj = (p) => [
    `## ${p.name} (${p.year})`,
    slugOf(p.id) ? `Page: ${site}/projects/${slugOf(p.id)}/` : '',
    p.tagline,
    p.summary && !sameText(p.summary, p.tagline) ? p.summary : '',
    p.description,
    c.whatIDid[p.id] ? `What I did: ${c.whatIDid[p.id]}` : '',
    p.badge ? `Note: ${p.badge}` : '',
    p.tech?.length ? `Built with: ${p.tech.join(', ')}` : '',
    p.links?.github ? `Source: ${p.links.github}` : '',
    p.links?.live && p.links.live !== '/room/' ? `Live: ${p.links.live}` : '',
    p.links?.demo ? `Demo video: ${p.links.demo}` : '',
    caseBlock(p.caseStudy),
  ].filter(Boolean).join('\n\n');
  const listed = c.projects.filter((p) => p.description || p.tagline);
  return `# ${identity.name}: full text

${identity.headline}

${identity.statement}

${identity.now}

Role: ${identity.role}. Location: ${identity.location}. Education: ${education.degree}, ${education.school} (${education.year}).

## About

${c.proofPoints.map((p) => `- ${p.value} ${p.text}`).join('\n')}

# Experience

${experience.map((e) => [`## ${e.role}, ${e.org} (${e.from} to ${e.to})`, e.note, e.detail, bullets(e.bullets), e.metrics ? bullets(e.metrics.map((m) => `${m.value} ${m.label}`)) : '', e.id === 'blink' ? `The four tools\n\n${bullets(c.blinkTools.map((t) => `${t.name}. ${t.detail}`))}` : '', e.id === 'blink' ? `Page: ${site}/projects/${slugOf('blink')}/` : '', caseBlock(e.caseStudy)].filter(Boolean).join('\n\n')).join('\n\n')}

# Projects

${listed.map(proj).join('\n\n')}

# Hackathons and achievements

${bullets(c.achievements.map((a) => `${a.label}: ${a.result} (${a.year})`))}

# Skills

${bullets(c.skills.map((s) => s.label + (s.note ? ` (${s.note})` : '')))}

# Contact

- Email: ${contact.email}
- GitHub: ${contact.github} (dhruv4740)
- LinkedIn: ${contact.linkedin}
- Résumé: ${site}${contact.resume}
`;
}
