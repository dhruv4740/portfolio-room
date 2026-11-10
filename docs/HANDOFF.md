# Handoff

The single status document. Commands, invariants and traps: [AGENTS.md](../AGENTS.md).
Last updated 2026-11-11. The previous version, with the history behind older items, is
[archive/HANDOFF-2026-11-01.md](archive/HANDOFF-2026-11-01.md).

## Where things are

- **Team:** an Opus lead (decisions, review, no code changes) plus one Sonnet worker session
  (all changes). The worker commits and pushes to branches; `main` is merged only after the
  owner says yes; the owner reviews visual changes on the preview URL after being told what
  changed and what to look for.
- **`main` is live**: `a369674` (PR #9, docs-only on top of `370d9ff`, PR #8) =
  https://dhruvkothari.pages.dev. Repo `dhruv4740/portfolio-room` (public). Never commit to
  `main`; branch, then merge after the owner's yes.
- **Hosting:** Cloudflare Pages project `dhruvkothari`, direct upload (no Git
  integration, so deployments cannot be retried; every change needs a fresh deploy).
  - Preview: `npx wrangler pages deploy dist --project-name dhruvkothari --branch preview --commit-dirty=true`
    → https://preview.dhruvkothari.pages.dev
  - Production: same with `--branch main`, **only after a fresh explicit yes from the owner**.
  - Build production from a clean worktree at `origin/main` with its own `npm ci`. Never
    junction `node_modules` into a worktree: `git worktree remove --force` deletes the target.
- **Domain:** the owner bought `dhruvkothari.com` on Cloudflare Registrar on 2026-11-11 (zone
  `e42ac34366ff8e326ea6b2da2c474bf0`, Free plan, active, Cloudflare nameservers). On 2026-11-11
  (owner-approved) `dhruvkothari.com` and `www.dhruvkothari.com` were attached as custom
  domains on the Pages project via the API (certificate authority Google). The API created no DNS
  records, so two proxied CNAMEs were added to the zone the same day, `dhruvkothari.com` and
  `www`, both → `dhruvkothari.pages.dev` (the records the dashboard flow would create). Both
  domains then went `active` (HTTP validation) and serve 200 over TLS; they currently serve the
  last production deploy, whose canonicals still say `pages.dev`. The Turnstile widget "dhruvkothari.pages.dev Ask" now lists `dhruvkothari.pages.dev`,
  `dhruvkothari.com` and `www.dhruvkothari.com`. Not done on purpose: redirects, email routing,
  WAF/bot settings, deploys, remote D1 migration. Zone Bot settings are all off (AI bot
  protection, managed robots.txt, Bot Fight Mode); Security Level is `medium`. On the branch
  `claude/docs-and-source-tracking-7dff75` the analytics/host checks accept all three hosts and
  `dhruvkothari.com` (apex) is the canonical/OG/sitemap/robots URL (`.env.production`); the
  live site only serves it after the next production deploy.
- **Pages variables** (all stored as `secret_text`, production): `GROQ_API_KEY`,
  `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `STATS_TOKEN`, `ASK_SALT`,
  `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`; optional `HIT_VISITOR_CAP` (per-visitor daily
  `/api/hit` cap, default 60). Preview has `STATS_TOKEN`, `ASK_SALT` and the two
  Turnstile ones (no AI keys, so preview Ask always gives saved answers).
  **Trap:** `wrangler.toml` is the config source of truth, so every deploy deletes
  dashboard/API `plain_text` variables. Store new ones as `secret_text` or add `[vars]`.
- **Turnstile** widget "dhruvkothari.pages.dev Ask" (managed mode, covers subdomains) guards
  `/api/ask` since 2026-11-02. Verified 3/3 in a visible Chrome (Groq answered). A hidden or
  non-painting browser pane fails it. Analytics so far: 2 challenges on 2026-11-06, neither
  solved; too few to judge. Off switch: delete `TURNSTILE_SECRET` and redeploy.
- **D1** `dhruvkothari-analytics` (binding `DB`): `hits` and `hit_rate` (the `/api/hit`
  limiter, `migrations/0002_hit_rate.sql`, applied to remote 2026-11-08).
- **Checkouts:** the Desktop checkout `...\random sites\portfolio` is current with
  `origin/main` and is the lead's checkout; its untracked owner files (art candidates, an old
  `resume/resume.tex` draft) must not be cleaned. That `resume.tex` is an old untracked draft,
  not the source of `public/resume.pdf` (that is `resume_linkedin.tex`, see work queue 2).
  The worker uses its own worktree under `.claude/worktrees/`. `pf-docs` and `pf-roomspeed`
  were removed 2026-11-10; `pf-release` is pending removal by the owner; `pf-truescale` is
  detached and still holds owner files (mockups/redesign, HANDOFF-PROMPT, PNGs): don't clean it.
- **Routes:** `/` work page (root `index.html`, `src/v3/work/entry.jsx`, no three.js);
  `/room/` 3D room (`room/index.html`, HashRouter `src/v3/App.jsx`); `/resume/`;
  `/work*` 301 → `/`; old room links (`/?tour=1`, `/#/...`) forwarded to `/room/` by the
  root head script. Phones go to `/` unless `?room=phone`. Analytics paths split on
  2026-11-01 ([ANALYTICS.md](ANALYTICS.md)).
- **Build:** `npm run build` regenerates `public/os/vendor/*`, `public/os/shell/content.js`
  (both git-ignored) and the case-file PDFs (tracked; commit only when text changed).
  Never commit `tmp-measure/`. CRLF files: `Scan.jsx`, `Work.jsx`, `index.html`,
  `perfGovernor.js`, and in practice most tracked source and docs (check with `file` before
  editing).
- Every project and where it shows: [PROJECTS-MAP.md](PROJECTS-MAP.md).

## Approved work queue (owner, 2026-11-08)

1. **Security** (from the 2026-11-01 audit): shipped 2026-11-08 (PR #8).
   - `/api/hit`: same-origin check (Origin, else Referer) plus a per-visitor daily cap in D1
     (not KV: the KV free plan allows 1,000 writes/day, shared with Ask). Fails open.
   - Enforcing CSP, `X-Frame-Options: SAMEORIGIN` and HSTS (no preload) in `public/_headers`.
     `script-src` keeps `'unsafe-inline'` (inline scripts in the pages and ~190 in the static
     app exports), so it limits sources, not injection. Functions responses don't get `_headers`.
   - Room markers' `aria-label`s now match their visible text.
   - **Contact:** 3 real sends on 2026-11-08 were saved to KV but Resend returned 403, so
     nothing was emailed. `contact.js` now logs Resend's error body. Cause unconfirmed (likely
     the Resend account address differs from `CONTACT_TO`); owner to check. A real sender
     needs a verified domain.
2. **Résumé PDF.** Rebuilt without the citation-comparison clause or a phone number from
   `resume_linkedin.tex` (the source of the public PDF) in `C:\Users\hp\pf-resume-build\`.
   Font is TeX Gyre Termes: Times New Roman breaks `;` text extraction. Awaiting the owner's
   approval before it replaces `public/resume.pdf`. Tectonic:
   `C:\Users\hp\AppData\Local\Programs\tectonic\tectonic.exe`.
3. **Option A (phone room): dropped for now.** Revisit with real traffic data. Phones get `/`
   with an opt-in `?room=phone` (option C, shipped).
4. **Multi-page recruiter path with software-engineering positioning** (home, 3-4 case-study
   pages, résumé). Approved, not started. Target role is software engineering.
5. **Room frozen:** stays live, no new development.
6. **Cellbook demo:** planned.
7. **Eco Water card removal:** proposed by the lead, not yet confirmed by the owner. Do not
   remove it until the owner says yes.
8. **`?from=` visit-source tracking:** on branch `claude/docs-and-source-tracking-7dff75`,
   awaiting review. Migration `0003_hits_src.sql` must be applied to remote D1 on merge;
   until then hits are still stored, without `src`. Tags in use: `linkedin`, `github`,
   `resume`.

## Still the owner's call (ask once, only these)

- **Using `dhruvkothari.com`** (bought 2026-11-11, attached to Pages, see Domain above):
  unlocks zone security features, a real Resend sender and the held SEO work (Search Console,
  HTML résumé, llms.txt). Still open: 301 `pages.dev` production host to the apex (documented
  option: account-level Bulk Redirect; `www` to apex via a Single Redirect), email routing,
  and checking the Web Analytics site hostnames.
- Behaviour-changing speed work (below).

## Owner decisions on record (never re-ask)

- Hands are not a concern. Don't list hand regressions, poses or hand checks as open items.
- `dk-dev` Pages project: deleted long ago.
- "Fact or Cap" stays as the CrisisWatch card name. Eco Water / EFarm (same college project)
  stay as they are, including its C++ chip.
- Each project runs as its real UI with simulated data; phone apps on the phone, web apps on the monitor.
- Room: bare walls, awards on the desk, notebook is a blank page. Night only.
- Project order by depth: FocusLock, Expense Tracker, Basket Price lead.
- Copy: Basket Price neutral; CrisisWatch framed around its fixed-model constraint. Reddit
  Growth Copilot never shown (**conflicts with the live page, pending owner**: the work page
  shows a "Reddit growth copilot" row: `blinkTools` entry `reddit` at
  `src/v3/content/index.js:330`, rendered in the Blink tools list in `src/v3/work/Work.jsx`;
  Reddit is also named in `content/index.js` lines 24, 55 and 73). The word "recruiter" never in visible copy. Never fabricate
  links or metrics. The AEO citation-comparison finding is never shown.
- Scoped out: multiplayer, Gaussian splats. Parked: per-project case-study page.
- Cellbook is 2026 (owner, 2026-11-08). The Blackout calls-and-alarms claim is treated as
  verified (owner, 2026-11-08).
- Nothing visible is removed or changed without the owner's permission.

## Open problems (not approved; propose, don't start)

- **Room load on slow networks.** On Chrome's "Slow 4G" preset (≈1.4–1.6 Mbps, ≈560 ms
  latency, closer to bad 3G) the room appears after 30.7 s; ~5 MB at that speed is ~25–28 s
  of transfer alone. At 10 Mbps it's 6.6 s, on a fast line 4.4 s. The work page at `/` is
  light. `handSurface.js` awaits the 1.58 MB hand binary at module scope; deferring it would
  save ~7 s on Slow 4G but changes behaviour (needs the owner's OK).
- **Shader compile stall** on first load (ANGLE D3D11); longest pause now 0.6–1.1 s around
  23–24%. Arrival intro ~25 ms/frame for 7–8 s on an integrated GPU. First monitor entry has
  one ~500 ms frame (option: mount the OS iframe in the background; owner's call).
- **Phones:** landscape OS windows are cramped (FocusLock, Projects); Ask panel opening had
  long frames at 4× CPU throttle; Turnstile not tested on a real phone.
- Tried and dropped (measured 2026-11-01): KTX2 textures (bigger), parallel room fetches
  beside the hand file (no gain), shrinking the lamp/fixture GLBs (already Draco; never
  meshopt them).

## Housekeeping (no decision needed)

- Dead code deletion was approved and is still pending: `src/game`, `hooks`, `store`, `data`,
  `lib`, `lab`, `content`, `shaders`, `flagship`, `components`, `index.css`, CSS
  `.launchpad-more`, `.fd-note`. Check imports before deleting (`npx knip`).
- Stale suites: `verify-focuslock-app` times out at `breathing`→`delay`;
  `verify-held-objects` and `verify-reduced-hands` exit 0 with 0 PASS lines;
  `verify-deeplinks` has no `/room/<object>` case. GitHub's unauthenticated API 403s after
  60 requests/hour and fails console-error checks (not a visitor bug).
- Remove merged worktrees/branches and `dist-ab/`, `dist-old/`, the garbled-name file in
  `pf-truescale` once nothing needs them.

## Testing

Serve a build with `npx wrangler pages dev dist --port 8799` (the only test server), then
`BASE=http://localhost:8799` for the suites: `verify-v3` (45), `verify-mobile`, `verify-recruiter` (44), `verify-deeplinks`
(13, needs `GPU=1`), `verify-keyboard`, `verify-os-apps` (5), `test-ask`, `test-hit` (plain `node scripts/test-hit.mjs`).
Suites check state,
not feel: camera, timing and interaction changes need frames reviewed by eye. CSP violations
do not reach Playwright console events or the Chrome extension console: check them with a
`securitypolicyviolation` listener added via `addInitScript`.

## Reference docs

[DESIGN.md](DESIGN.md), [ASSET-REGISTER.md](ASSET-REGISTER.md),
[PROJECT-MATERIAL.md](PROJECT-MATERIAL.md), [PROJECTS-MAP.md](PROJECTS-MAP.md),
[PERF-AUDIT.md](PERF-AUDIT.md), [ASK.md](ASK.md), [CONTACT.md](CONTACT.md), `archive/` (historical).
