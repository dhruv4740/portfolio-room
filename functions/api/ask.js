// Ask about Dhruv. POST {q, token} -> {answer, source, provider, ms, left}. GET -> client config.
// The model is only used when Turnstile + KV + at least one provider key are all configured; otherwise the
// canned FAQ answers, so the endpoint never errors. Secrets stay in env; question text is never logged.
import { runChain } from '../_ask/chain.js';
import { PROVIDERS } from '../_ask/providers.js';
import { systemPrompt, cannedAnswer, splitSource } from '../_ask/knowledge.js';

const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const day = () => new Date().toISOString().slice(0, 10);
const num = (v, d) => (Number.isFinite(+v) && +v > 0 ? +v : d);

async function visitorKey(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.ASK_SALT || 'ask'}|${day()}|${ip}`));
  return 'v:' + [...new Uint8Array(buf)].slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function bump(kv, key, ttl = 100000) {
  const n = (parseInt(await kv.get(key), 10) || 0) + 1;
  await kv.put(key, String(n), { expirationTtl: ttl });
  return n;
}

async function turnstileOk(env, token, ip) {
  if (!token) return false;
  const form = new FormData(); form.append('secret', env.TURNSTILE_SECRET); form.append('response', token); if (ip) form.append('remoteip', ip);
  try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }); return !!(await r.json()).success; }
  catch { return false; }
}

// Turnstile is optional: with no TURNSTILE_SECRET the KV caps are the only abuse control.
const llmReady = (env) => !!(env.ASK_KV && PROVIDERS.some((p) => p.enabled(env)));

export async function onRequestGet({ env }) {
  return reply({ turnstileSiteKey: llmReady(env) && env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY || null : null, llm: llmReady(env) });
}

export async function onRequestPost({ request, env }) {
  const t0 = Date.now();
  let b;
  try { b = JSON.parse(await request.text()); } catch { return reply({ error: 'bad request' }, 400); }
  const q = String(b?.q ?? '').trim();
  if (q.length < 3 || q.length > 300) return reply({ error: 'Ask a question between 3 and 300 characters.' }, 400);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply({ error: 'forbidden' }, 403);

  const canned = (note, tried = []) => {
    const c = cannedAnswer(q);
    console.log(JSON.stringify({ ask: 1, provider: 'canned', ms: Date.now() - t0, tried, note }));
    return reply({ ...c, provider: 'canned', ms: Date.now() - t0, note });
  };

  if (!llmReady(env)) return canned('');
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.TURNSTILE_SECRET && !(await turnstileOk(env, b.token, ip))) return canned('verification failed, showing a quick answer');

  const kv = env.ASK_KV, vKey = await visitorKey(request, env), gKey = `g:${day()}`;
  const vCap = num(env.ASK_VISITOR_CAP, 10), gCap = num(env.ASK_GLOBAL_CAP, 300);
  const [v, g] = await Promise.all([kv.get(vKey), kv.get(gKey)]);
  if ((parseInt(v, 10) || 0) >= vCap) return canned('daily question limit reached, showing a quick answer');
  if ((parseInt(g, 10) || 0) >= gCap) return canned('the site-wide daily limit is reached, showing a quick answer');
  const used = await bump(kv, vKey); await bump(kv, gKey);

  const r = await runChain(PROVIDERS, env, systemPrompt(), q);
  if (!r.text) return canned('all providers busy, showing a quick answer', r.tried);
  const { answer, source } = splitSource(r.text, q);
  const ms = Date.now() - t0;
  console.log(JSON.stringify({ ask: 1, provider: r.provider, ms, tried: r.tried }));
  bump(kv, `p:${day()}:${r.provider}`).catch(() => {});
  return reply({ answer, source, provider: r.provider, ms, left: Math.max(0, vCap - used) });
}
