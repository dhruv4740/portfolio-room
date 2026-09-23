// Latest public GitHub activity for the monitor's idle screen. Unauthenticated
// API (60 requests/hour per IP), cached for 30 minutes, and any failure
// resolves to null so the screen simply stays as it was.
const USER = 'dhruv4740';
const KEY = 'v3:github-activity';
const TTL = 30 * 60 * 1000;

function ago(iso) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function describe(event) {
  const repo = event.repo?.name?.split('/')[1] || 'a repo';
  switch (event.type) {
    case 'PushEvent': {
      const n = event.payload?.size ?? event.payload?.commits?.length ?? 1;
      return `pushed ${n} commit${n === 1 ? '' : 's'} to ${repo}`;
    }
    case 'CreateEvent': return event.payload?.ref_type === 'repository' ? `created ${repo}` : `created a ${event.payload?.ref_type || 'branch'} in ${repo}`;
    case 'PullRequestEvent': return `${event.payload?.action || 'updated'} a pull request in ${repo}`;
    case 'IssuesEvent': return `${event.payload?.action || 'updated'} an issue in ${repo}`;
    case 'WatchEvent': return `starred ${event.repo?.name || repo}`;
    case 'ReleaseEvent': return `released ${repo}`;
    default: return null;
  }
}

export async function fetchGithubActivity() {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < TTL) return cached.items;
  } catch { /* private mode */ }
  try {
    const response = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=20`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return null;
    const events = await response.json();
    const items = events
      .map(e => ({ text: describe(e), at: e.created_at }))
      .filter(e => e.text)
      .slice(0, 2);
    try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), items })); } catch { /* quota */ }
    return items;
  } catch {
    return null;
  }
}

export function formatActivity(item) {
  return `${item.text} · ${ago(item.at)}`;
}
