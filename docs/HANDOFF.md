# Handoff

The single status document. Commands, invariants and traps: [AGENTS.md](../AGENTS.md).
Last updated 2026-11-08. The previous version, with the history behind older items, is
[archive/HANDOFF-2026-11-01.md](archive/HANDOFF-2026-11-01.md).

## Where things are

- **`main` is live**: `071176d` (PR #6) = https://dhruvkothari.pages.dev. Repo
  `dhruv4740/portfolio-room`. No open PRs. Never commit to `main`; branch, PR, merge.
- **Hosting:** Cloudflare Pages project `dhruvkothari`, direct upload (no Git
  integration, so deployments cannot be retried; every change needs a fresh deploy).
  - Preview: `npx wrangler pages deploy dist --project-name dhruvkothari --branch preview --commit-dirty=true`
    → https://preview.dhruvkothari.pages.dev
  - Production: same with `--branch main`, **only after a fresh explicit yes from the owner**.
  - Build production from a clean worktree at `origin/main` with its own `npm ci`. Never
    junction `node_modules` into a worktree: `git worktree remove --force` deletes the target.
- **No Cloudflare zone.** The account owns no domain; the site is only on `pages.dev`.
  Zone features (Bot Fight Mode, WAF custom rules, rate-limiting rules, Transform rules)
  are unavailable until the owner adds a domain. Domain: undecided.
- **Pages variables** (all stored as `secret_text`, production): `GROQ_API_KEY`,
  `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `STATS_TOKEN`, `ASK_SALT`,
  `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`. Preview has `STATS_TOKEN`, `ASK_SALT` and the two
  Turnstile ones (no AI keys, so preview Ask always gives saved answers).
  **Trap:** `wrangler.toml` is the config source of truth, so every deploy deletes
  dashboard/API `plain_text` variables. Store new ones as `secret_text` or add `[vars]`.
- **Turnstile** widget "dhruvkothari.pages.dev Ask" (managed mode, covers subdomains) guards
  `/api/ask` since 2026-11-02. Verified 3/3 in a visible Chrome (Groq answered). A hidden or
  non-painting browser pane fails it. Analytics so far: 2 challenges on 2026-11-06, neither
  solved; too few to judge. Off switch: delete `TURNSTILE_SECRET` and redeploy.
- **Checkouts:** `C:\Users\hp\pf-truescale` (this one), `pf-release`, `pf-roomspeed` and
  `pf-docs` are worktrees of the same repo; branches in them are merged. The Desktop checkout
  `...\random sites\portfolio` is 88 commits behind with the owner's untracked art candidates
  and `resume/resume.tex`: don't use it, don't clean it.
- **Routes:** `/` work page (root `index.html`, `src/v3/work/entry.jsx`, no three.js);
  `/room/` 3D room (`room/index.html`, HashRouter `src/v3/App.jsx`); `/resume/`;
  `/work*` 301 → `/`; old room links (`/?tour=1`, `/#/...`) forwarded to `/room/` by the
  root head script. Phones go to `/` unless `?room=phone`. Analytics paths split on
  2026-11-01 ([ANALYTICS.md](ANALYTICS.md)).
- **Build:** `npm run build` regenerates `public/os/vendor/*`, `public/os/shell/content.js`
  (both git-ignored) and the case-file PDFs (tracked; commit only when text changed).
  Never commit `tmp-measure/`. CRLF files: `Scan.jsx`, `Deck.jsx`, `Work.jsx`, `index.html`,
  `perfGovernor.js`.
- Every project and where it shows: [PROJECTS-MAP.md](PROJECTS-MAP.md).

## Approved work queue (owner, 2026-11-08)

1. **Security** (from the 2026-11-01 audit):
   - `/api/hit` has no rate limit or origin check. No zone, so do it in the Function
     (KV counter like `/api/ask`, plus an `Origin`/`Referer` check).
   - Contact form: Resend's test sender may only deliver to the Resend account owner.
     Do a real test send to the owner's own address and report whether it arrives; a real
     sender needs a verified domain, which needs the domain decision.
   - No CSP, X-Frame-Options or HSTS. Add them in `public/_headers` (it already sets
     `nosniff` and `Referrer-Policy`). The CSP must allow Turnstile
     (`challenges.cloudflare.com`), the Web Analytics beacon, open-meteo, the GitHub API,
     blob/worker use by three.js and the dhruvOS iframe (`frame-ancestors 'self'`, not `DENY`).
     Test every page and the room on preview with the console open before production.
   - Room markers' `aria-label`s don't match their visible text (Monitor, Phone).
2. **Résumé PDF.** `public/resume.pdf` still has the old citation-comparison clause in the
   Blink bullet (the owner never wants that finding shown). Sources are in
   `C:\Users\hp\OneDrive\Desktop\internship\resume\` (`mine.tex`, `resume_internship.tex`,
   `resume_linkedin.tex`, `src/resume_faangpath.tex`); work out which one the public PDF
   comes from by comparing text. Tectonic is installed:
   `C:\Users\hp\AppData\Local\Programs\tectonic\tectonic.exe`. The public PDF must not
   contain a phone number. Show the owner the rebuilt PDF before it goes live.
3. **Option A: a real phone room.** Same room on phones with fixed viewpoints: tap an
   object and the camera glides there, no drag-to-look, no hands, lighter models and
   textures. Today phones get `/` with an opt-in `?room=phone` (option C, shipped).
   Measure on a real phone; show the owner frames/recordings in motion before shipping.

## Still the owner's call (ask once, only these)

- **Cellbook year:** the site says 2026, guessed from the repo creation date; the résumé gives none.
- **Blackout claim:** the site and résumé say the black screen lifts for calls and alarms;
  never verified on the owner's phone.
- **Domain:** unlocks zone security features, a real Resend sender and the held SEO work
  (Search Console, HTML résumé, llms.txt).
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
  Growth Copilot never shown. The word "recruiter" never in visible copy. Never fabricate
  links or metrics. The AEO citation-comparison finding is never shown.
- Scoped out: multiplayer, Gaussian splats. Parked: per-project case-study page.
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

Serve a build with `npx wrangler pages dev dist --port 8799`, then `BASE=http://localhost:8799`
for the suites: `verify-v3` (45), `verify-mobile`, `verify-recruiter` (44), `verify-deeplinks`
(13, needs `GPU=1`), `verify-keyboard`, `verify-os-apps` (5), `test-ask`. Suites check state,
not feel: camera, timing and interaction changes need frames reviewed by eye.

## Reference docs

[DESIGN.md](DESIGN.md), [ASSET-REGISTER.md](ASSET-REGISTER.md),
[PROJECT-MATERIAL.md](PROJECT-MATERIAL.md), [PROJECTS-MAP.md](PROJECTS-MAP.md),
[PERF-AUDIT.md](PERF-AUDIT.md), [ASK.md](ASK.md), [CONTACT.md](CONTACT.md), `archive/` (historical).
