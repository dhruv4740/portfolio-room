// Try providers in order. Falls through on timeout, 429, 5xx or an empty answer; any other error too, since a
// dead provider must never surface to the visitor. Returns { text, provider, tried } or { text: null, tried }.
export async function runChain(providers, env, system, q, { fetchImpl = fetch, timeoutMs = 6000 } = {}) {
  const tried = [];
  for (const p of providers) {
    if (!p.enabled(env)) continue;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    const t0 = Date.now();
    try {
      const text = await p.call({ env, system, q, signal: ctl.signal, fetchImpl });
      clearTimeout(timer);
      return { text: String(text).trim(), provider: p.name, tried, ms: Date.now() - t0 };
    } catch (e) {
      clearTimeout(timer);
      tried.push({ provider: p.name, reason: ctl.signal.aborted ? 'timeout' : (e.status ? String(e.status) : 'error') });
    }
  }
  return { text: null, provider: null, tried };
}
