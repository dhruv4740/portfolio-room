# Ask about Dhruv

A question box on `/work` and in the room (notepad window, "Ask about Dhruv" tab). It answers from the résumé, project
and case-study text in `src/v3/content/index.js` only.

Without any setup it already works on canned answers (keyword-matched sections, labelled "answered by quick FAQ").
Model answers switch on only when **all three** of these exist: a Turnstile secret, the `ASK_KV` binding, and at least
one provider key. Missing any one of them falls back to canned, never an error.

## Owner steps (all free, all in the Cloudflare dashboard)

Everything below is under **Workers & Pages → dhruvkothari → Settings**. Add each secret to **both** Production and
Preview, then redeploy (secrets apply on the next deployment).

1. **Provider keys** → Variables and Secrets → Add → type **Secret** (encrypted):
   - `GROQ_API_KEY`: console.groq.com → API Keys → Create. Free, no card.
   - `GEMINI_API_KEY`: aistudio.google.com/apikey → Create API key. Free tier, no card.
   - `OPENROUTER_API_KEY`: openrouter.ai/keys → Create key. Only `:free` models are ever called (about 50 requests a
     day on the free tier).
   Any subset works; the order is Groq → Gemini → OpenRouter → canned. Keys never reach the browser or the repo.
2. **KV for the limits**: Storage & Databases → KV → Create namespace (e.g. `dhruvkothari-ask`). Then Settings →
   Bindings → Add → KV namespace → variable name **`ASK_KV`** → pick it.
3. **Turnstile**: Turnstile → Add widget → hostnames `dhruvkothari.pages.dev` and `preview.dhruvkothari.pages.dev` →
   mode Managed. Add the **secret key** as secret `TURNSTILE_SECRET` and the **site key** as plain variable
   `TURNSTILE_SITE_KEY` (the site key is public).
4. Optional variables: `ASK_VISITOR_CAP` (default 10 questions per visitor per UTC day), `ASK_GLOBAL_CAP` (default 300
   model answers per day for the whole site), `ASK_SALT` (any string; salts the visitor hash), `GROQ_MODEL`,
   `GEMINI_MODEL`, `OPENROUTER_MODELS` (comma list, entries not ending in `:free` are ignored). Model names change
   often; if a provider starts failing, set these to a current free model.

Check it: open `https://dhruvkothari.pages.dev/api/ask` — `"llm":true` means model answers are on.

## How it works

- `functions/api/ask.js`: `POST {q, token}` → `{answer, source, provider, ms, left}`; `GET` → client config.
  Question 3 to 300 characters, same-origin only.
- Order of checks: Turnstile token verified server-side → per-visitor KV counter (hash of IP + day + salt, raw IP is
  never stored) → global KV counter → provider chain. Over a cap or failed Turnstile returns a canned answer with a
  short note.
- `functions/_ask/chain.js` + `providers.js`: one adapter per provider; each is skipped unless its secret exists; a
  timeout (6 s), 429, 5xx, empty answer or any error falls through to the next.
- `functions/_ask/knowledge.js`: builds the system prompt from the content file (so new facts and case studies flow in
  automatically) and the canned FAQ. Prompt rules: only those facts, 2 to 4 sentences, refuse off-topic, never invent
  numbers, end with `(Source: <section>)`.
- UI: `public/os/shell/ask.js` is shared by the notepad tab and the `/work` box. It shows "Source · answered by
  <provider>".
- Logging: one JSON line per request (`provider`, `ms`, which providers failed and why). The question text is never
  logged or stored. KV also keeps `p:<date>:<provider>` counters so you can see fallback working.
- KV counters are read then written, so two simultaneous requests can both slip under a cap by one. Acceptable here.

## Tests

`node scripts/test-ask.mjs` — mocked providers: Groq timeout → Gemini 429 → OpenRouter answers; 5xx fall-through;
all fail → canned; no keys/KV/Turnstile → canned with no provider call; bad token; visitor and global caps; only
`:free` OpenRouter models; canned on-topic, off-topic and input limits.
