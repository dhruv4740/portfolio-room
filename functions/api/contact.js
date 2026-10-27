// Phone contact form. POST {name, email, message, website} -> {ok, via}. No secrets in the client.
// Always stored in KV (ASK_KV, key msg:<ts>, 90 days); forwarded by email only when RESEND_API_KEY is set
// (free tier; its sandbox sender works for the account owner's own address). With neither, answers 503 and the
// page falls back to a mailto link. Honeypot field + per-visitor cap (CONTACT_VISITOR_CAP, default 3 a day).
import { contact } from '../../src/v3/content/index.js';

const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const day = () => new Date().toISOString().slice(0, 10);
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

export async function onRequestPost({ request, env }) {
  let b;
  try { b = JSON.parse(await request.text()); } catch { return reply({ error: 'bad request' }, 400); }
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply({ error: 'forbidden' }, 403);
  if (b.website) return reply({ ok: true, via: 'saved' }); // honeypot: pretend success
  const name = clean(b.name, 80), email = clean(b.email, 120), message = clean(b.message, 1000);
  if (message.length < 5) return reply({ error: 'Write a short message (5 to 1000 characters).' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply({ error: 'Add an email address so he can reply.' }, 400);
  if (!env.ASK_KV && !env.RESEND_API_KEY) return reply({ error: 'unavailable' }, 503);

  const kv = env.ASK_KV;
  if (kv) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.ASK_SALT || 'ask'}|c|${day()}|${ip}`));
    const key = 'c:' + [...new Uint8Array(buf)].slice(0, 10).map((x) => x.toString(16).padStart(2, '0')).join('');
    const cap = +env.CONTACT_VISITOR_CAP > 0 ? +env.CONTACT_VISITOR_CAP : 3;
    const n = parseInt(await kv.get(key), 10) || 0;
    if (n >= cap) return reply({ error: 'That is the daily message limit. Email him directly instead.' }, 429);
    await kv.put(key, String(n + 1), { expirationTtl: 100000 });
    await kv.put(`msg:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, JSON.stringify({ name, email, message, at: new Date().toISOString() }), { expirationTtl: 90 * 86400 });
  }

  let via = 'saved';
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(6000),
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.CONTACT_FROM || 'Portfolio phone <onboarding@resend.dev>', to: [env.CONTACT_TO || contact.email], reply_to: email,
          subject: `Message from ${name || email} via the portfolio phone`,
          html: `<p><b>${esc(name || '(no name)')}</b> &lt;${esc(email)}&gt;</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
        }),
      });
      if (r.ok) via = 'email'; else console.log(JSON.stringify({ contact: 'resend failed', status: r.status }));
    } catch (e) { console.log(JSON.stringify({ contact: 'resend error', err: String(e) })); }
  }
  if (via === 'saved' && !kv) return reply({ error: 'unavailable' }, 503);
  return reply({ ok: true, via });
}
