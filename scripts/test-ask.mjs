// Ask API tests with mocked providers: node scripts/test-ask.mjs
import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/ask.js';
import { runChain } from '../functions/_ask/chain.js';
import { PROVIDERS } from '../functions/_ask/providers.js';
import { cannedAnswer, systemPrompt } from '../functions/_ask/knowledge.js';

const kvStore = new Map();
const KV = { get: async (k) => kvStore.get(k) ?? null, put: async (k, v) => { kvStore.set(k, v); } };
const ok = (text) => new Response(JSON.stringify({ choices: [{ message: { content: text } }], candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const hang = (_u, o) => new Promise((_, rej) => o.signal.addEventListener('abort', () => rej(new Error('aborted'))));
const status = (n) => async () => new Response('x', { status: n });

let handlers = {};
const realFetch = globalThis.fetch;
globalThis.fetch = (url, o) => {
  const u = String(url);
  if (u.includes('turnstile')) return Promise.resolve(new Response(JSON.stringify({ success: o.body.get('response') === 'good' })));
  const host = u.includes('groq') ? 'groq' : u.includes('generativelanguage') ? 'gemini' : 'openrouter';
  calls.push(host);
  return handlers[host](u, o);
};
let calls = [];
const env = (extra = {}) => ({ ASK_KV: KV, TURNSTILE_SECRET: 's', GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm', OPENROUTER_API_KEY: 'o', ...extra });
const ask = (e, q = 'What did he build at Blink?', token = 'good') => onRequestPost({ env: e, request: new Request('https://dhruvkothari.pages.dev/api/ask', { method: 'POST', headers: { 'CF-Connecting-IP': '1.2.3.4' }, body: JSON.stringify({ q, token }) }) }).then((r) => r.json());
const t = async (name, fn) => { kvStore.clear(); calls = []; handlers = {}; await fn(); console.log('ok  ', name); };

await t('groq answers first, with source parsed', async () => {
  handlers.groq = async () => ok('He built four growth tools. (Source: Experience: Blink.new)');
  const r = await ask(env());
  assert.equal(r.provider, 'groq'); assert.equal(r.source, 'Experience: Blink.new'); assert.deepEqual(calls, ['groq']);
});
await t('groq timeout -> gemini 429 -> openrouter answers', async () => {
  handlers.groq = hang; handlers.gemini = status(429); handlers.openrouter = async () => ok('Four tools. (Source: Blink growth tools)');
  const orig = PROVIDERS.slice(); // keep real timeout path short: run chain directly with a 200 ms timeout
  const c = await runChain(PROVIDERS, env(), 's', 'q', { timeoutMs: 200 });
  assert.equal(c.provider, 'openrouter'); assert.deepEqual(c.tried, [{ provider: 'groq', reason: 'timeout' }, { provider: 'gemini', reason: '429' }]);
  assert.equal(orig.length, 3);
});
await t('groq 500 -> gemini answers', async () => {
  handlers.groq = status(500); handlers.gemini = async () => ok('ok (Source: About Dhruv)');
  const r = await ask(env());
  assert.equal(r.provider, 'gemini'); assert.deepEqual(calls, ['groq', 'gemini']);
});
await t('all providers fail -> canned, never an error', async () => {
  handlers.groq = status(429); handlers.gemini = status(503); handlers.openrouter = async () => { throw new Error('net'); };
  const r = await ask(env());
  assert.equal(r.provider, 'canned'); assert.ok(r.answer.length > 20); assert.match(r.answer, /Blink|growth/i);
});
await t('no provider keys / no KV -> canned, providers never called', async () => {
  for (const e of [{ ASK_KV: KV, TURNSTILE_SECRET: 's' }, env({ ASK_KV: undefined })]) { const r = await ask(e); assert.equal(r.provider, 'canned'); }
  assert.deepEqual(calls, []);
  assert.equal((await onRequestGet({ env: {} }).then((r) => r.json())).llm, false);
});
await t('no Turnstile secret -> check skipped, KV caps still apply', async () => {
  handlers.groq = async () => ok('a (Source: About Dhruv)');
  const e = env({ TURNSTILE_SECRET: undefined, ASK_VISITOR_CAP: '1' });
  assert.equal((await ask(e, 'What did he build at Blink?', '')).provider, 'groq');
  assert.equal((await ask(e, 'What did he build at Blink?', '')).provider, 'canned');
  assert.equal((await onRequestGet({ env: e }).then((r) => r.json())).llm, true);
});
await t('only providers with secrets are tried', async () => {
  handlers.gemini = async () => ok('hi (Source: About Dhruv)');
  const r = await ask(env({ GROQ_API_KEY: undefined, OPENROUTER_API_KEY: undefined }));
  assert.equal(r.provider, 'gemini'); assert.deepEqual(calls, ['gemini']);
});
await t('bad turnstile token -> canned, providers not called', async () => {
  const r = await ask(env(), 'What did he build at Blink?', 'bad'); assert.equal(r.provider, 'canned'); assert.deepEqual(calls, []);
});
await t('per-visitor cap then canned', async () => {
  handlers.groq = async () => ok('a (Source: About Dhruv)');
  const e = env({ ASK_VISITOR_CAP: '2' });
  assert.equal((await ask(e)).provider, 'groq'); assert.equal((await ask(e)).provider, 'groq');
  const r = await ask(e); assert.equal(r.provider, 'canned'); assert.match(r.note, /limit/);
});
await t('global cap then canned', async () => {
  handlers.groq = async () => ok('a (Source: About Dhruv)');
  const e = env({ ASK_GLOBAL_CAP: '1' });
  assert.equal((await ask(e)).provider, 'groq'); assert.equal((await ask(e)).provider, 'canned');
});
await t('openrouter only tries :free models', async () => {
  const seen = [];
  handlers.openrouter = async (_u, o) => { seen.push(JSON.parse(o.body).model); return ok('x (Source: About Dhruv)'); };
  await ask(env({ GROQ_API_KEY: undefined, GEMINI_API_KEY: undefined, OPENROUTER_MODELS: 'paid/model,good/model:free' }));
  assert.deepEqual(seen, ['good/model:free']);
});
await t('canned FAQ: on-topic, off-topic, input limits', async () => {
  assert.match(cannedAnswer('how can I contact him?').answer, /@/);
  assert.match(cannedAnswer('what is the capital of France').answer, /only answer questions about Dhruv/);
  assert.equal((await onRequestPost({ env: env(), request: new Request('https://x.test/api/ask', { method: 'POST', body: JSON.stringify({ q: 'hi' }) }) })).status, 400);
  const sp = systemPrompt(); assert.match(sp, /FACTS START/); assert.ok(!/GROQ|sk-/.test(sp));
});
globalThis.fetch = realFetch;
console.log('ask tests passed');
