// node scripts/test-redirect.mjs: the pages.dev -> custom domain middleware, called with five hostnames.
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const run = async (url, method = 'GET') => {
  let passed = false;
  const res = await onRequest({ request: new Request(url, { method }), next: async () => { passed = true; return new Response('ok'); } });
  return { res, passed };
};
const t = (n) => console.log('ok  ', n);

let r = await run('https://dhruvkothari.pages.dev/');
assert.equal(r.res.status, 301); assert.equal(r.res.headers.get('location'), 'https://dhruvkothari.com/'); assert.equal(r.passed, false); t('exact pages.dev host -> 301 to the .com root');
r = await run('https://dhruvkothari.pages.dev/resume/?x=1');
assert.equal(r.res.status, 301); assert.equal(r.res.headers.get('location'), 'https://dhruvkothari.com/resume/?x=1'); t('path and query are kept');
r = await run('https://dhruvkothari.pages.dev/api/proof');
assert.equal(r.res.status, 301); assert.equal(r.res.headers.get('location'), 'https://dhruvkothari.com/api/proof'); t('/api routes on pages.dev redirect too');
for (const host of ['preview.dhruvkothari.pages.dev', 'abc123.dhruvkothari.pages.dev', 'dhruvkothari.com', 'localhost:8811']) {
  r = await run(`https://${host}/api/proof`);
  assert.equal(r.passed, true); assert.equal(r.res.status, 200); t(`${host} passes through`);
}
console.log('redirect tests passed');
