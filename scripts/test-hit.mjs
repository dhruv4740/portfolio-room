// node scripts/test-hit.mjs: hit function with a mocked D1 (hits + hit_rate).
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/hit.js';

let inserts = [], counts = new Map(), rateThrows = false, insertThrows = false, noSrcCol = false;
const DB = {
  prepare: (sql) => ({
    bind: (...a) => ({
      first: async () => {
        if (rateThrows) throw new Error('no such table: hit_rate');
        const n = (counts.get(a[0]) || 0) + 1; counts.set(a[0], n); return { n };
      },
      run: async () => { if (/INSERT INTO hits/.test(sql)) { if (insertThrows) throw new Error('x'); if (noSrcCol && /src/.test(sql)) throw new Error('no such column: src'); inserts.push(a); } return {}; },
    }),
  }),
};
const post = (headers = {}, host = 'dhruvkothari.pages.dev', env = {}, extra = {}) =>
  onRequestPost({ env: { DB, ...env }, request: new Request(`https://${host}/api/hit`, { method: 'POST', headers: { 'CF-Connecting-IP': '9.9.9.9', ...headers }, body: JSON.stringify({ t: 'view', path: '/', ...extra }) }) }).then((r) => r.status);
const same = { origin: 'https://dhruvkothari.pages.dev' };
const t = (n) => console.log('ok  ', n);
const reset = () => { inserts = []; counts.clear(); rateThrows = false; insertThrows = false; noSrcCol = false; };

reset(); assert.equal(await post(same), 204); assert.equal(inserts.length, 1); t('same-origin recorded');
reset(); assert.equal(await post({ origin: 'https://evil.example' }), 403); assert.equal(inserts.length, 0); t('cross-origin 403, no write');
reset(); assert.equal(await post({}), 403); assert.equal(inserts.length, 0); t('no origin and no referer 403');
reset(); assert.equal(await post({ referer: 'https://dhruvkothari.pages.dev/room/' }), 204); assert.equal(inserts.length, 1); t('referer fallback recorded');
reset(); assert.equal(await post({ referer: 'https://evil.example/x' }), 403); t('cross-origin referer 403');
reset(); for (let i = 0; i < 60; i++) assert.equal(await post(same), 204);
assert.equal(await post(same), 429); assert.equal(inserts.length, 60); t('61st hit -> 429, no insert');
reset(); for (let i = 0; i < 3; i++) await post(same, undefined, { HIT_VISITOR_CAP: '2' }); assert.equal(inserts.length, 2); t('HIT_VISITOR_CAP override');
reset(); rateThrows = true; assert.equal(await post(same), 204); assert.equal(inserts.length, 1); t('limiter D1 error fails open');
reset(); assert.equal(await post(same, 'abc123.dhruvkothari.pages.dev'), 204); assert.equal(inserts.length, 0); t('non-production host -> 204, no write');
reset(); await post(same, undefined, {}, { src: 'LinkedIn' }); assert.equal(inserts[0][8], 'linkedin'); t('src stored, lowercased');
reset(); for (const bad of ['a b', 'x'.repeat(25), '<script>', '', 5, null]) await post(same, undefined, {}, { src: bad }); assert.ok(inserts.length === 6 && inserts.every((r) => r[8] === null)); t('bad src -> null');
reset(); noSrcCol = true; assert.equal(await post(same, undefined, {}, { src: 'github' }), 204); assert.equal(inserts.length, 1); assert.equal(inserts[0].length, 8); t('missing src column: hit stored without src');
console.log('hit tests passed');
