// node scripts/test-proof.mjs: mocked GitHub; cache hit, stale fallback, empty fallback.
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/proof.js';
const store = new Map(); const KV = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
let calls = 0, fail = false;
globalThis.fetch = async (u) => {
  calls++; if (fail) return new Response('x', { status: 403 });
  u = String(u);
  const body = u.includes('/commits') ? [{ sha: 'abcdef1234', html_url: 'u', commit: { message: 'feat: x\n\nbody', author: { date: '2026-10-01T00:00:00Z' } } }] : { html_url: 'r', stargazers_count: 2, language: 'Kotlin', pushed_at: '2026-10-01T00:00:00Z' };
  return new Response(JSON.stringify(body));
};
const get = (env) => onRequestGet({ env }).then((r) => r.json());
let r = await get({ ASK_KV: KV }); assert.equal(r.repos.length, 4); assert.equal(r.repos[0].commits[0].msg, 'feat: x'); assert.equal(calls, 8);
await get({ ASK_KV: KV }); assert.equal(calls, 8, 'second call served from KV');
store.set('proof:v1', JSON.stringify({ ...JSON.parse(store.get('proof:v1')), updated: '2020-01-01T00:00:00Z' })); fail = true;
r = await get({ ASK_KV: KV }); assert.equal(r.repos.length, 4, 'stale copy served when GitHub fails');
store.clear(); r = await get({ ASK_KV: KV }); assert.deepEqual(r.repos, [], 'empty when nothing cached');
console.log('proof tests passed');
