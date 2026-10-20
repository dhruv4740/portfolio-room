// Preload for the suites: node --import ./scripts/_gh-mock.mjs scripts/verify-x.mjs
// Routes GitHub's unauthenticated events API (403 after 60 requests/hour per IP) to a
// fixed response, so a rate limit cannot show up as a console error. Set GH_REAL=1 to
// hit the real API. The app already treats a 403 as "no activity" (githubActivity.js).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const EVENTS = [
  { type: 'PushEvent', created_at: new Date(Date.now() - 2 * 3600e3).toISOString(), repo: { name: 'dhruv4740/portfolio-room' }, payload: { size: 2 } },
  { type: 'CreateEvent', created_at: new Date(Date.now() - 26 * 3600e3).toISOString(), repo: { name: 'dhruv4740/blackout' }, payload: { ref_type: 'branch' } },
];
const handler = route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(EVENTS) });
const wrapContext = async ctx => { await ctx.route('https://api.github.com/**', handler); return ctx; };
if (!process.env.GH_REAL) {
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async (...a) => {
    const b = await launch(...a);
    const newContext = b.newContext.bind(b), newPage = b.newPage.bind(b);
    b.newContext = async (...x) => wrapContext(await newContext(...x));
    b.newPage = async (...x) => { const p = await newPage(...x); await wrapContext(p.context()); return p; };
    return b;
  };
}
