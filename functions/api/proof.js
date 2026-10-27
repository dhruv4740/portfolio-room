// Live proof from the public GitHub REST API (no token, no secrets). One KV entry holds the result for 6 h, so the
// 60 requests/hour unauthenticated limit is never the visitor's problem; on any failure the last good copy is served.
const REPOS = ['focuslock', 'blackout', 'expense-tracker', 'portfolio-room'];
const OWNER = 'dhruv4740', KEY = 'proof:v1', FRESH_MS = 6 * 3600e3;
const H = { accept: 'application/vnd.github+json', 'user-agent': 'dhruvkothari-portfolio' };
const reply = (body, cache) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'cache-control': cache } });

async function gh(path) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: H, signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

// Only a complete result (every repo, each with commits) may reach the cache.
export const complete = (d) => Array.isArray(d?.repos) && d.repos.length === REPOS.length && d.repos.every((r) => r.name && r.url && r.commits?.length);

export async function build() {
  const repos = await Promise.all(REPOS.map(async (name) => {
    const [info, commits] = await Promise.all([gh(`repos/${OWNER}/${name}`), gh(`repos/${OWNER}/${name}/commits?per_page=3`)]);
    return {
      name, url: info.html_url, stars: info.stargazers_count, language: info.language, pushed: info.pushed_at,
      commits: commits.map((c) => ({ sha: c.sha.slice(0, 7), url: c.html_url, msg: String(c.commit.message).split('\n')[0].slice(0, 90), date: c.commit.author?.date })),
    };
  }));
  return { updated: new Date().toISOString(), repos };
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
    return complete(cached) ? reply(cached, 'public, max-age=300') : reply({ updated: null, repos: [], error: String(e).slice(0, 80) }, 'no-store');
  }
}
