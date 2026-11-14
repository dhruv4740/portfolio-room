// Live proof from public GitHub data (no token, no secrets): his latest commits across all public repos, plus the
// contribution count. One KV entry holds the result for 6 h, so the 60 requests/hour unauthenticated limit is never the
// visitor's problem; on any failure the last good copy is served.
const OWNER = 'dhruv4740', KEY = 'proof:v3', FRESH_MS = 6 * 3600e3, WANT = 6;
const H = { accept: 'application/vnd.github+json', 'user-agent': 'dhruvkothari-portfolio' };
const reply = (body, cache) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': cache } });

async function gh(path) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: H, signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

// "6,035 contributions in the last year" from the public contributions fragment. null when it cannot be read.
export async function contributions() {
  try {
    const r = await fetch(`https://github.com/users/${OWNER}/contributions`, { headers: { 'user-agent': H['user-agent'], accept: 'text/html' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const m = /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i.exec((await r.text()).replace(/\s+/g, ' '));
    const n = m ? Number(m[1].replace(/,/g, '')) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

// Only a complete result (six commits) may reach the cache. A missing contribution count does not make it incomplete.
export const complete = (d) => Array.isArray(d?.commits) && d.commits.length === WANT && d.commits.every((c) => c.repo && c.url && c.msg && c.date);

export async function build() {
  // The events feed no longer lists commits inside a push, only the head sha, so each push costs one commit lookup.
  const events = await gh(`users/${OWNER}/events/public?per_page=50`);
  const pushes = events.filter((e) => e.type === 'PushEvent' && e.payload?.head).slice(0, 12);
  const [looked, count] = await Promise.all([
    Promise.all(pushes.map((e) => gh(`repos/${e.repo.name}/commits/${e.payload.head}`).then((c) => ({ e, c })).catch(() => null))),
    contributions(),
  ]);
  const seen = new Set();
  const commits = looked.filter(Boolean)
    // Merge commits ("Merge pull request #4 from …") say nothing about the work.
    .filter(({ c }) => !/^Merge\b/.test(c.commit.message) && !seen.has(c.sha) && seen.add(c.sha))
    .map(({ e, c }) => ({ repo: e.repo.name.split('/').pop(), sha: c.sha.slice(0, 7), url: c.html_url, msg: String(c.commit.message).split('\n')[0].slice(0, 90), date: c.commit.author?.date || e.created_at }))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, WANT);
  return { updated: new Date().toISOString(), ...(count != null ? { contributions: count } : {}), commits };
}

export async function onRequestGet({ env }) {
  const kv = env.ASK_KV;
  let cached = null;
  try { cached = kv ? JSON.parse(await kv.get(KEY)) : null; } catch { cached = null; }
  if (complete(cached) && Date.now() - Date.parse(cached.updated) < FRESH_MS) return reply(cached, 'public, max-age=900');
  try {
    const fresh = await build();
    if (!complete(fresh)) throw new Error('incomplete result');
    if (kv) await kv.put(KEY, JSON.stringify(fresh), { expirationTtl: 7 * 86400 }).catch(() => {});
    return reply(fresh, 'public, max-age=900');
  } catch (e) {
    console.log(JSON.stringify({ proof: 'github fetch failed', err: String(e) }));
    return complete(cached) ? reply(cached, 'public, max-age=300') : reply({ updated: null, commits: [], error: String(e).slice(0, 80) }, 'no-store');
  }
}
