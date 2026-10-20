// Private stats page: /stats?token=<STATS_TOKEN env secret>.
export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.STATS_TOKEN || token !== env.STATS_TOKEN) return new Response('Not found', { status: 404 });
  const q = async (sql) => (await env.DB.prepare(sql).all()).results;
  const [total, paths, refs, places, recent] = await Promise.all([
    q("SELECT COUNT(*) n, MIN(ts) first, MAX(ts) last, ROUND(AVG(CASE WHEN kind='end' THEN secs END)) avg_secs FROM hits"),
    q("SELECT path, COUNT(*) n FROM hits WHERE kind='view' GROUP BY path ORDER BY n DESC LIMIT 30"),
    q("SELECT COALESCE(NULLIF(ref,''),'(direct)') ref, COUNT(*) n FROM hits WHERE kind='view' GROUP BY 1 ORDER BY n DESC LIMIT 20"),
    q("SELECT country, dev, COUNT(*) n FROM hits WHERE kind='view' GROUP BY 1,2 ORDER BY n DESC LIMIT 20"),
    q("SELECT datetime(ts/1000,'unixepoch') at, kind, path, ref, dev, country, city, secs FROM hits ORDER BY ts DESC LIMIT 50"),
  ]);
  const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const tbl = (rows) => '<table border=1 cellpadding=4>' + rows.map((r) => '<tr>' + Object.values(r).map((v) => `<td>${esc(v)}</td>`).join('') + '</tr>').join('') + '</table>';
  const html = `<meta name=robots content=noindex><body style="font:14px monospace"><h3>Totals</h3>${tbl(total)}<h3>Paths</h3>${tbl(paths)}<h3>Referrers</h3>${tbl(refs)}<h3>Country / device</h3>${tbl(places)}<h3>Recent</h3>${tbl(recent)}`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
