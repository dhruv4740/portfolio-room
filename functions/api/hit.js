// Cloudflare Pages Function: stores one anonymous visit event in D1 (binding DB).
// Stores path, referrer host, device class, country/city from request.cf. Never the IP.
export async function onRequestPost({ request, env }) {
  let b;
  try { b = JSON.parse(await request.text()); } catch { return new Response(null, { status: 204 }); }
  const s = (v, n) => String(v ?? '').slice(0, n);
  const cf = request.cf || {};
  await env.DB.prepare('INSERT INTO hits (ts, kind, path, ref, dev, country, city, secs) VALUES (?,?,?,?,?,?,?,?)')
    .bind(Date.now(), b.t === 'end' ? 'end' : 'view', s(b.path, 200), s(b.ref, 100), s(b.dev, 10), s(cf.country, 4), s(cf.city, 60), Number(b.secs) || 0)
    .run();
  return new Response(null, { status: 204 });
}
