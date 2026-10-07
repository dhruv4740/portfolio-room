// ============================================================================
// Recruiter-path verification: /work/, /resume/, resume.pdf, and page weight.
//
// Usage: cd pf-truescale; BASE=http://localhost:4176 node scripts/verify-recruiter.mjs
// ============================================================================

import { chromium } from 'playwright';
import { statSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4176';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const FORBIDDEN = /three|\.glb|\.bin|\.mp3|\/materials\/|\.frag|\.vert|\/models\//i;
const FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/;

let passed = 0;
let total = 0;
const check = (name, ok, detail = '') => {
  total++;
  if (ok) passed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/** Sum transferred bytes: content-length header first, else the body length. */
async function transferBytes(responses) {
  let bytes = 0;
  let unsized = 0;
  for (const r of responses) {
    const cl = r.headers()['content-length'];
    if (cl) { bytes += Number(cl); continue; }
    try { bytes += (await r.body()).length; } catch { unsized++; }
  }
  return { bytes, unsized };
}

const browser = await chromium.launch({
  args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();
let reqs = [];
let resps = [];
page.on('request', (r) => reqs.push(r.url()));
page.on('response', (r) => resps.push(r));

try {
  // 1. WebGL off (checked on the first /work/ load; the request window starts here).
  reqs = []; resps = [];
  await page.goto(`${BASE}/work/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.work-root', { timeout: 15_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const workReqs = [...reqs];
  const workResps = [...resps];
  const noWebgl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return c.getContext('webgl2') === null && c.getContext('webgl') === null;
  });
  check('WebGL is unavailable in this browser', noWebgl);

  // 2. Trailing-slash routing and identity heading.
  await page.goto(`${BASE}/work`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.work-root', { timeout: 15_000 });
  check('/work resolves to /work/', page.url().endsWith('/work/'), page.url());
  const nameH1 = await page.locator('h1', { hasText: 'Dhruv Kothari' }).count();
  check('/work page has h1 "Dhruv Kothari"', nameH1 > 0, `${nameH1} match(es)`);

  // 3. Identity and the three action links.
  await page.goto(`${BASE}/work/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.work-root', { timeout: 15_000 });
  const h1Visible = await page.getByRole('heading', { level: 1, name: 'Dhruv Kothari' }).isVisible().catch(() => false);
  check('h1 "Dhruv Kothari" is visible', h1Visible);
  const actions = page.locator('.work-actions a');
  // textContent, not innerText: the site uppercases these via CSS, and innerText reports the rendered case.
  const actionTexts = await actions.evaluateAll((els) => els.map((e) => e.textContent || ''));
  const wanted = [/Résumé/, /GitHub/, /LinkedIn/];
  const actionsOk = actionTexts.length === 3 && wanted.every((re) => actionTexts.some((t) => re.test(t)));
  let actionsVisible = actionsOk;
  for (let i = 0; i < actionTexts.length && actionsVisible; i++) actionsVisible = await actions.nth(i).isVisible();
  check('three action links: Résumé, GitHub, LinkedIn — visible', actionsOk && actionsVisible,
    actionTexts.map((t) => t.trim()).join(' | ') || 'none');

  // 4. Featured and more-projects sections.
  const featured = page.locator('#work-projects-heading').locator('xpath=ancestor::section[1]').locator('.work-project');
  const featuredNames = (await featured.locator('.work-project-name').allInnerTexts()).map((s) => s.trim());
  const expectedNames = ['FocusLock', '3D Portfolio', 'DarkSentinel', 'Blackout'];
  check('exactly four featured cards in order', featuredNames.length === 4
    && expectedNames.every((n, i) => featuredNames[i] === n), featuredNames.join(' | ') || 'none');
  let featuredVisible = true;
  for (let i = 0; i < await featured.count(); i++) {
    await featured.nth(i).scrollIntoViewIfNeeded();
    if (!(await featured.nth(i).isVisible())) featuredVisible = false;
  }
  check('featured cards are visible after scrolling', featuredVisible && featuredNames.length === 4);
  const moreHeading = (await page.locator('#work-more-projects-heading').innerText().catch(() => '')).trim();
  const moreCount = await page.locator('#work-more-projects-heading').locator('xpath=ancestor::section[1]')
    .locator('.work-project').count();
  check('"More projects" section has at least one project', /More projects/i.test(moreHeading) && moreCount >= 1,
    `heading "${moreHeading}", ${moreCount} card(s)`);

  // 5. Blink metrics.
  const blinkText = await page.locator('.work-job').first().innerText().catch(() => '');
  const metrics = ['650', '489', '18%', '14', '676', '29.85%'];
  const missing = metrics.filter((m) => !blinkText.includes(m));
  check('Blink job shows all metrics', missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : metrics.join(', '));

  // 6. Every outbound http(s) link on /work/.
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  const urls = [...new Set(hrefs.filter(Boolean).map((h) => new URL(h, page.url()).href))]
    .filter((u) => /^https?:/.test(u));
  for (const url of urls) {
    let status;
    try {
      const res = await context.request.get(url, {
        maxRedirects: 5, timeout: 20_000, failOnStatusCode: false, headers: { 'User-Agent': UA },
      });
      status = res.status();
    } catch (e) {
      status = `ERR ${e.message.split('\n')[0]}`;
    }
    if (status === 999 && new URL(url).hostname.endsWith('linkedin.com')) {
      console.log(`UNVERIFIABLE (999)  ${url}`);
      continue;
    }
    check(`link ${url}`, status === 200, `status ${status}`);
  }

  // 7a. resume.pdf served directly.
  const pdf = await context.request.get(`${BASE}/resume.pdf`, { failOnStatusCode: false });
  const pdfType = pdf.headers()['content-type'] || '';
  const pdfBody = await pdf.body();
  check('resume.pdf is a PDF', pdf.status() === 200 && pdfType.includes('pdf') && pdfBody.subarray(0, 4).toString('latin1') === '%PDF',
    `status ${pdf.status()}, ${pdfType}`);

  // 9. /resume/ page, then 7b the download. Request window for this load.
  reqs = []; resps = [];
  await page.goto(`${BASE}/resume/`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  const resumeReqs = [...reqs];
  const resumeResps = [...resps];
  const resumeH1 = await page.getByRole('heading', { level: 1, name: 'Dhruv Kothari' }).isVisible().catch(() => false);
  check('/resume/ h1 "Dhruv Kothari" is visible', resumeH1);
  const dl = page.getByRole('link', { name: 'Download résumé (PDF)' });
  const dlVisible = await dl.isVisible().catch(() => false);
  check('/resume/ download link is visible', dlVisible);

  let downloadOk = false;
  let downloadDetail = 'no download event';
  if (dlVisible) {
    try {
      const [download] = await Promise.all([page.waitForEvent('download', { timeout: 20_000 }), dl.click()]);
      const fname = download.suggestedFilename();
      const size = statSync(await download.path()).size;
      downloadOk = fname.endsWith('.pdf') && size > 10_000;
      downloadDetail = `${fname}, ${size} bytes`;
    } catch (e) {
      downloadDetail = e.message.split('\n')[0];
    }
  }
  check('download résumé PDF (> 10 KB)', downloadOk, downloadDetail);
  console.log('SKIP  phone check skipped — no PDF text parser in this script');

  // 8 and 9. Weight: forbidden request patterns and transfer totals per load.
  for (const [label, list, responses] of [['/work/', workReqs, workResps], ['/resume/', resumeReqs, resumeResps]]) {
    const forbidden = list.filter((u) => !FONT_HOSTS.test(u) && FORBIDDEN.test(u));
    const fonts = list.filter((u) => FONT_HOSTS.test(u));
    const { bytes, unsized } = await transferBytes(responses);
    check(`${label} load requests no 3D, model, audio, or shader assets`, forbidden.length === 0,
      forbidden.slice(0, 3).join(', ') || `${list.length} requests`);
    console.log(`      ${label}: ${list.length} requests, ${(bytes / 1024).toFixed(1)} KB transferred${unsized ? `, ${unsized} unsized` : ''}`);
    console.log(`      ${label} font requests (excluded above): ${fonts.join(', ') || 'none'}`);
  }
} catch (e) {
  check('script ran to completion', false, e.message.split('\n')[0]);
} finally {
  await browser.close();
}

console.log(`\n${passed}/${total} passed`);
if (passed < total) process.exit(1);
