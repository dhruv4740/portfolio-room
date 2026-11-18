// node scripts/test-proof.mjs: mocked GitHub; latest commits across repos, contribution count, cache hit, stale fallback, empty fallback.
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/proof.js';
const store = new Map(); const KV = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
let calls = 0, fail = false, contribHtml = '<h2>\n 6,035\n contributions\n in the last year\n</h2>';
const events = [{ type: 'WatchEvent', repo: { name: 'dhruv4740/x' }, payload: {} }, ...Array.from({ length: 9 }, (_, i) => ({ type: 'PushEvent', created_at: `2026-11-1${i}T00:00:00Z`, repo: { name: `dhruv4740/repo${i % 3}` }, payload: { head: `${i === 1 ? 'merge' : 'abcdef'}${i}00000` } }))];
globalThis.fetch = async (u) => {
  calls++; if (fail) return new Response('x', { status: 403 });
  u = String(u);
  if (u.startsWith('https://github.com/users/')) return new Response(contribHtml);
  if (u.includes('/events/public')) return new Response(JSON.stringify(events));
  const sha = u.split('/commits/')[1];
  return new Response(JSON.stringify({ sha, html_url: `https://github.com/c/${sha}`, commit: { message: sha.startsWith('merge') ? 'Merge pull request #4 from dhruv4740/x' : 'feat: x\n\nbody', author: { date: '2026-11-10T00:00:00Z' } } }));
};
const get = (env) => onRequestGet({ env }).then((r) => r.json());
let r = await get({ ASK_KV: KV });
assert.equal(r.commits.length, 6); assert.equal(r.commits[0].msg, 'feat: x', 'first line only'); assert.equal(r.commits[0].repo, 'repo0');
assert.ok(!r.commits.some((c) => c.sha.startsWith('merge')), 'merge commits are dropped'); assert.equal(r.contributions, 6035);
const n = calls; await get({ ASK_KV: KV }); assert.equal(calls, n, 'second call served from KV');
store.set('proof:v3', JSON.stringify({ ...JSON.parse(store.get('proof:v3')), updated: '2020-01-01T00:00:00Z' })); fail = true;
r = await get({ ASK_KV: KV }); assert.equal(r.commits.length, 6, 'stale copy served when GitHub fails');
store.clear(); r = await get({ ASK_KV: KV }); assert.deepEqual(r.commits, [], 'empty when nothing cached');
fail = false; contribHtml = 'nothing here'; r = await get({ ASK_KV: KV }); assert.equal(r.commits.length, 6); assert.ok(!('contributions' in r), 'no count line when it cannot be parsed');
store.clear(); const real = globalThis.fetch;
globalThis.fetch = async (u) => (String(u).includes('/events/public') ? new Response('[]') : real(u));
r = await get({ ASK_KV: KV }); assert.deepEqual(r.commits, [], 'fewer than six commits are not served'); assert.equal(store.size, 0, 'incomplete result never cached');
console.log('proof tests passed');
