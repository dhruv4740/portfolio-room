// SEO/AEO check against a running Pages server on the built dist:
//   npx wrangler pages dev dist --port 8799   then   BASE=http://localhost:8799 node scripts/verify-seo.mjs
// Plain fetch only, so everything it reads is what a crawler without JavaScript sees.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = (process.env.BASE || 'http://localhost:8799').replace(/\/$/, '');
const SITE = 'https://dhruvkothari.com';
const c = await import(pathToFileURL(join(import.meta.dirname, '../src/v3/content/index.js')).href);
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL  ' + msg); } };
const get = async (path) => { const r = await fetch(BASE + path, { redirect: 'manual' }); return { r, status: r.status, text: /text|json|xml/.test(r.headers.get('content-type') || '') ? await r.text() : '' }; };
const text = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const jsonld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

// Sitemap: every URL (mapped to the local server) answers 200.
const sm = await get('/sitemap.xml');
ok(sm.status === 200, 'sitemap.xml status ' + sm.status);
const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(urls.length >= 10, `sitemap has ${urls.length} urls`);
ok(urls.includes(`${SITE}/`) && urls.includes(`${SITE}${c.contact.resume}`), 'sitemap has home and resume pdf');
ok(/<lastmod>\d{4}-\d\d-\d\d<\/lastmod>/.test(sm.text), 'sitemap has lastmod');
for (const u of urls) { const r = await fetch(BASE + u.replace(SITE, '')); ok(r.status === 200, `${u} -> ${r.status}`); await r.arrayBuffer(); }

// Project pages.
const titles = new Set();
const pages = urls.filter((u) => u.includes('/projects/')).map((u) => u.replace(SITE, ''));
ok(pages.length === Object.keys(c.projectSlugs).length, `${pages.length} project pages in sitemap`);
for (const path of pages) {
  const slug = path.split('/')[2];
  const { text: html, status } = await get(path);
  ok(status === 200, `${path} status`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  ok(title && !titles.has(title), `${path} unique title`); titles.add(title);
  ok((html.match(/<h1[ >]/g) || []).length === 1, `${path} has exactly one h1`);
  ok(html.includes(`<link rel="canonical" href="${SITE}${path}">`), `${path} canonical`);
  ok(/<meta name="description" content="[^"]{20,}"/.test(html), `${path} meta description`);
  ok(html.includes('property="og:image"') && html.includes('name="twitter:card"'), `${path} og and twitter tags`);
  let blocks = []; try { blocks = jsonld(html); } catch { ok(false, `${path} JSON-LD parses`); }
  const g = blocks[0]?.['@graph'] || [];
  ok(g.some((n) => n['@type'] === 'BreadcrumbList' && n.itemListElement.length === 3), `${path} BreadcrumbList`);
  ok(g.some((n) => /^Software/.test(n['@type']) && n.author?.['@id'] === `${SITE}/#person`), `${path} Software* with author @id`);
  ok(html.includes('Back to Dhruv Kothari') && html.includes('href="/"'), `${path} back link`);
  ok(!/<script[^>]+src=/.test(html), `${path} loads no scripts`);
  // Case-study text is in the raw HTML (no JS).
  const readable = text(html);
  const isBlink = slug === c.projectSlugs.blink;
  const entry = isBlink ? c.experience[0] : c.projects.find((p) => c.projectSlugs[p.id] === slug);
  const cs = entry.caseStudy; const probes = [];
  for (const k of ['summary', 'problem', 'decisions', 'broke', 'result']) if (cs?.[k]?.length) probes.push(cs[k][0], cs[k][cs[k].length - 1]);
  const id = isBlink ? 'blink' : entry.id;
  if (c.whatIDid[id]) probes.push(c.whatIDid[id]);
  ok(probes.length > 0, `${path} has text to probe`);
  probes.forEach((s) => ok(readable.includes(s), `${path} raw HTML contains "${s.slice(0, 50)}"`));
  // The path without the trailing slash resolves (directly or by redirect to the slash form).
  const bare = await get(path.replace(/\/$/, ''));
  const final = bare.status >= 300 && bare.status < 400 ? await fetch(new URL(bare.r.headers.get('location'), BASE + path)) : null;
  ok(bare.status === 200 || (final && final.status === 200), `${path.replace(/\/$/, '')} resolves (${bare.status}${final ? ' -> ' + final.status : ''})`);
}

// Home page: JSON-LD, handle, links in the raw HTML.
const home = (await get('/')).text;
let hb = []; try { hb = jsonld(home); } catch { ok(false, 'home JSON-LD parses'); }
const hg = hb[0]?.['@graph'] || [];
const person = hg.find((n) => n['@type'] === 'Person');
ok(person?.['@id'] === `${SITE}/#person` && person.alternateName.includes('dhruv4740'), 'home Person @id and alternateName dhruv4740');
ok(person?.email === 'hello@dhruvkothari.com', 'home email is the hello@ address');
ok(['WebSite', 'ProfilePage', 'ItemList'].every((t) => hg.some((n) => n['@type'] === t)), 'home has WebSite, ProfilePage, ItemList');
ok(hg.find((n) => n['@type'] === 'ItemList')?.itemListElement.length === pages.length, 'ItemList lists every project page');
ok(!/gmail\.com/i.test(JSON.stringify(hb)), 'home JSON-LD has no gmail address');
ok(/<meta\s+name="description"\s+content="[^"]*dhruv4740/.test(home), 'home meta description has dhruv4740');
ok(home.includes('<title>Dhruv Kothari, software engineer. Projects and résumé</title>'), 'home title unchanged');
ok(home.includes('rel="alternate" type="text/markdown" href="/llms.txt"'), 'home links llms.txt');
for (const slug of Object.values(c.projectSlugs)) ok(home.includes(`href="/projects/${slug}/"`), `home raw HTML links /projects/${slug}/`);

// robots.txt, llms files.
const rb = (await get('/robots.txt')).text;
for (const ua of ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot', 'Applebot-Extended', 'DuckAssistBot']) ok(rb.replace(/\r/g, '').includes(`User-agent: ${ua}\nAllow: /`), `robots allows ${ua}`);
ok(rb.includes(`Sitemap: ${SITE}/sitemap.xml`), 'robots has Sitemap line');
const llms = (await get('/llms.txt')).text, full = (await get('/llms-full.txt')).text;
ok(llms.startsWith('# Dhruv Kothari\n\n> '), 'llms.txt h1 and blockquote');
Object.values(c.projectSlugs).forEach((s) => ok(llms.includes(`/projects/${s}/`), `llms.txt links ${s}`));
ok(full.includes('# Skills') && full.includes('# Hackathons') && full.includes(c.projects.find((p) => p.id === 'focuslock').caseStudy.result[0]), 'llms-full.txt has skills, hackathons and case study text');

// Banned strings in every generated file (teammate name, em dash, gmail address).
const files = [];
const skip = ['apps', 'assets', 'os', 'models', 'draco', 'media', 'sounds', 'materials', 'fonts', 'mockups'];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!skip.includes(f)) walk(p); } else if (/\.(html|txt|xml)$/.test(f) && f !== '404.html') files.push(p); } };
walk(join(import.meta.dirname, '../dist'));
const DIST = join(import.meta.dirname, '../dist');
const generated = files.filter((f) => /^(sitemap\.xml|robots\.txt|llms(-full)?\.txt|index\.html|projects\/.*index\.html)$/.test(relative(DIST, f).replace(/\\/g, '/')));
ok(generated.length >= 12, `${generated.length} generated files scanned`);
for (const f of generated) {
  const s = readFileSync(f, 'utf8');
  ok(!/\bdeven\b/i.test(s), `${f} has no teammate name (deven1305 repo URLs are not matched)`);
  ok(!s.includes('—'), `${f} has no em dash`);
  ok(!/gmail\.com/i.test(s), `${f} has no gmail address`);
}

// Icons: every page links the set and every icon URL answers 200.
const ICONS = ['/favicon.ico', '/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/site.webmanifest'];
for (const path of ['/', '/resume/', '/room/', ...pages]) {
  const h = (await get(path)).text;
  for (const i of ICONS) ok(h.includes(`href="${i}"`), `${path} links ${i}`);
}
const manifest = JSON.parse((await get('/site.webmanifest')).text);
for (const u of [...ICONS, '/favicon-16.png', '/favicon-48.png', ...manifest.icons.map((i) => i.src)]) {
  const r = await fetch(BASE + u); ok(r.status === 200, `${u} -> ${r.status}`); await r.arrayBuffer();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
