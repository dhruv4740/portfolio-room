// One adapter per provider, tried in order. Each is enabled only if its secret exists.
// Models are defaults; override with GROQ_MODEL / GEMINI_MODEL / OPENROUTER_MODELS (comma list, ":free" only).
const json = (body) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const MAX_TOKENS = 220;

async function chatCompletions(url, headers, model, system, q, signal, fetchImpl, extra = {}) {
  const r = await fetchImpl(url, { ...json({ model, max_tokens: MAX_TOKENS, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: q }], ...extra }), headers: { 'content-type': 'application/json', ...headers }, signal });
  if (!r.ok) throw Object.assign(new Error(`http ${r.status}`), { status: r.status });
  const d = await r.json();
  const text = d?.choices?.[0]?.message?.content;
  if (!text) throw new Error('empty');
  return text;
}

export const PROVIDERS = [
  {
    name: 'groq',
    enabled: (env) => !!env.GROQ_API_KEY,
    // llama-3.3-70b-versatile shut down 2026-08-16; Groq's named replacement. gpt-oss reasons
    // before answering and those tokens count against max_tokens, so keep effort low and allow room.
    call: ({ env, system, q, signal, fetchImpl }) => chatCompletions('https://api.groq.com/openai/v1/chat/completions', { authorization: `Bearer ${env.GROQ_API_KEY}` }, env.GROQ_MODEL || 'openai/gpt-oss-120b', system, q, signal, fetchImpl, { reasoning_effort: 'low', max_tokens: 700 }),
  },
  {
    name: 'gemini',
    enabled: (env) => !!env.GEMINI_API_KEY,
    async call({ env, system, q, signal, fetchImpl }) {
      const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite'; // 2.5 is limited to accounts that already used it (404 here)
      const r = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        ...json({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: q }] }], generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.2 } }),
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, signal,
      });
      if (!r.ok) throw Object.assign(new Error(`http ${r.status}`), { status: r.status });
      const d = await r.json();
      const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
      if (!text) throw new Error('empty');
      return text;
    },
  },
  {
    name: 'openrouter',
    enabled: (env) => !!env.OPENROUTER_API_KEY,
    async call({ env, system, q, signal, fetchImpl }) {
      const models = (env.OPENROUTER_MODELS || 'google/gemma-4-31b-it:free,nvidia/nemotron-3-super-120b-a12b:free').split(',').map((s) => s.trim()).filter((m) => m.endsWith(':free'));
      let last;
      for (const m of models) {
        try { return await chatCompletions('https://openrouter.ai/api/v1/chat/completions', { authorization: `Bearer ${env.OPENROUTER_API_KEY}` }, m, system, q, signal, fetchImpl); }
        catch (e) { last = e; if (signal.aborted) break; }
      }
      throw last || new Error('no free model configured');
    },
  },
];
