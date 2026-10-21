# Ask about Dhruv

An always-visible "Ask about Dhruv" pill (bottom right) on every surface: /work, the room, the mobile deck. It opens a
side sheet (wide screens) or bottom sheet (narrow) with a short chat thread and four suggested questions
(`public/os/shell/ask-pill.js`, body in `ask.js`, mounted from `src/main.jsx` and `src/v3/work/entry.jsx`). There are no
inline boxes any more. It answers from the résumé, project and case-study text in `src/v3/content/index.js` only.

The model prompt (`systemPrompt()` in `functions/_ask/knowledge.js`) carries a knowledge brief (summary, what he is
looking for, why hire, strongest project by area, hackathons, experience overview) plus every project, internship and
case study. It may summarise, compare and give grounded opinions, answers 3 to 6 sentences (about 200 words for a
summary), and declines only clearly unrelated or private questions. The canned path (no keys) handles comparisons,
summaries, private questions and off-topic ones the same way, tested in `scripts/test-ask.mjs`.

Without any setup it already works on canned answers (keyword-matched sections, labelled "answered by quick FAQ").
Model answers switch on when the `ASK_KV` binding (already in `wrangler.toml`, namespace id
`882512127d404b9f93285e3248c067f1`) and at least one provider key exist. Turnstile is optional. Missing keys fall back
to canned, never an error.

## Owner step (one, free)

Workers & Pages → dhruvkothari → Settings → Variables and Secrets → Add, type **Secret**, in both Production and
Preview, then redeploy:

- `GROQ_API_KEY`: console.groq.com → API Keys → Create. Free, no card.
- `GEMINI_API_KEY`: aistudio.google.com/apikey → Create API key. Free tier, no card.
- `OPENROUTER_API_KEY`: openrouter.ai/keys → Create key. Only `:free` models are ever called (about 50 requests a day
  on the free tier).

Any subset works; the order is Groq → Gemini → OpenRouter → canned. Keys never reach the browser or the repo.

Optional: Turnstile. Add a widget for `dhruvkothari.pages.dev`, then secret `TURNSTILE_SECRET` and plain variable
`TURNSTILE_SITE_KEY`. When `TURNSTILE_SECRET` is set the token is required; when unset the check is skipped and the KV
caps are the only abuse control. Other optional variables: `ASK_VISITOR_CAP` (default 10 questions per visitor per UTC
day), `ASK_GLOBAL_CAP` (default 300 model answers a day, site-wide), `ASK_SALT`, `GROQ_MODEL`, `GEMINI_MODEL`,
`OPENROUTER_MODELS` (comma list; entries not ending in `:free` are ignored). Model names change often; if a provider
starts failing, set these to a current free model.

Check it: open `https://dhruvkothari.pages.dev/api/ask`. `"llm":true` means model answers are on.

## How it works

- `functions/api/ask.js`: `POST {q, token}` → `{answer, source, provider, ms, left}`; `GET` → client config.
  Question 3 to 300 characters, same-origin only.
- Order of checks: Turnstile token verified server-side (only if `TURNSTILE_SECRET` is set) → per-visitor KV counter (hash of IP + day + salt, raw IP is
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
