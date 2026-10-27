// node scripts/test-contact.mjs: contact function with fake KV and mocked Resend.
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

const store = new Map();
const KV = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
let sent = [], resendStatus = 200;
globalThis.fetch = async (u, o) => { sent.push(JSON.parse(o.body)); return new Response('{}', { status: resendStatus }); };
const post = (env, body, origin) => onRequestPost({ env, request: new Request('https://dhruvkothari.pages.dev/api/contact', { method: 'POST', headers: { 'CF-Connecting-IP': '9.9.9.9', ...(origin ? { origin } : {}) }, body: JSON.stringify(body) }) }).then(async (r) => ({ s: r.status, ...(await r.json()) }));
const ok = { name: 'Ana', email: 'ana@example.com', message: 'Hello there, loved the room.' };
const t = (n) => console.log('ok  ', n);

let r = await post({ ASK_KV: KV }, ok); assert.equal(r.via, 'saved'); assert.equal([...store.keys()].filter((k) => k.startsWith('msg:')).length, 1); t('saved to KV without Resend');
r = await post({ ASK_KV: KV, RESEND_API_KEY: 'k' }, ok); assert.equal(r.via, 'email'); assert.equal(sent[0].reply_to, 'ana@example.com'); assert.match(sent[0].to[0], /@/); t('forwarded by Resend with reply_to');
resendStatus = 500; store.clear(); r = await post({ ASK_KV: KV, RESEND_API_KEY: 'k' }, ok); assert.equal(r.via, 'saved'); t('Resend failure still saved');
resendStatus = 200; store.clear(); r = await post({}, ok); assert.equal(r.s, 503); t('no KV and no key -> 503 (UI shows mailto)');
r = await post({ ASK_KV: KV }, { ...ok, email: 'nope' }); assert.equal(r.s, 400);
r = await post({ ASK_KV: KV }, { ...ok, message: 'hi' }); assert.equal(r.s, 400); t('validation');
store.clear(); sent = []; r = await post({ ASK_KV: KV }, { ...ok, website: 'http://spam' }); assert.equal(r.ok, true); assert.equal(store.size, 0); t('honeypot stores nothing');
store.clear(); for (let i = 0; i < 3; i++) await post({ ASK_KV: KV }, ok); r = await post({ ASK_KV: KV }, ok); assert.equal(r.s, 429); t('per-visitor cap');
r = await post({ ASK_KV: KV }, ok, 'https://evil.example'); assert.equal(r.s, 403); t('cross-origin refused');
sent = []; store.clear(); await post({ ASK_KV: KV, RESEND_API_KEY: 'k' }, { ...ok, message: '<script>alert(1)</script>' }); assert.ok(!sent[0].html.includes('<script>')); t('html escaped in the email');
console.log('contact tests passed');
