// Cloudflare Pages Function: stores one anonymous visit event in D1 (binding DB).
// Stores path, referrer host, device class, country/city from request.cf. Never the IP.
// Guards: same-origin only (Origin, else Referer host must equal the request host) and a
// per-visitor daily cap kept in D1 (table hit_rate, key = salted SHA-256 of IP + UTC day).
// The limiter fails open: a missing table or D1 error still records the hit.
const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };

async function overCap(request, env) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.ASK_SALT || 'hit'}|${day}|${ip}`));
    const k = [...new Uint8Array(buf)].slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('');
    const cap = Number(env.HIT_VISITOR_CAP) > 0 ? Number(env.HIT_VISITOR_CAP) : 60;
    const row = await env.DB.prepare('INSERT INTO hit_rate (k, day, n) VALUES (?, ?, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n')
      .bind(k, day).first();
    if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM hit_rate WHERE day < ?').bind(day).run();
    return Number(row?.n) > cap;
  } catch { return false; }
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  // Production host only: preview and per-deploy URLs never count toward the owner's numbers.
  if (url.hostname !== 'dhruvkothari.pages.dev') return new Response(null, { status: 204 });
  const origin = request.headers.get('Origin');
  const from = origin ? hostOf(origin) : hostOf(request.headers.get('Referer'));
  if (from !== url.host) return new Response(null, { status: 403 });
  let b;
  try { b = JSON.parse(await request.text()); } catch { return new Response(null, { status: 204 }); }
  if (await overCap(request, env)) return new Response(null, { status: 429 });
  const s = (v, n) => String(v ?? '').slice(0, n);
  const cf = request.cf || {};
  await env.DB.prepare('INSERT INTO hits (ts, kind, path, ref, dev, country, city, secs) VALUES (?,?,?,?,?,?,?,?)')
    .bind(Date.now(), b.t === 'end' ? 'end' : 'view', s(b.path, 200), s(b.ref, 100), s(b.dev, 10), s(cf.country, 4), s(cf.city, 60), Number(b.secs) || 0)
    .run();
  return new Response(null, { status: 204 });
}
