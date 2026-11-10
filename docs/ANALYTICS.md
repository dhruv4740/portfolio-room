# Analytics

Two layers, production hosts only (`dhruvkothari.pages.dev`, `dhruvkothari.com`, `www.dhruvkothari.com`; preview and per-deploy URLs are excluded):

1. **Cloudflare Web Analytics** beacon, injected from `index.html`.
2. **First-party visit log**: `src/v3/lib/analytics.js` (and an inline snippet in `resume/index.html`)
   `sendBeacon`s to `functions/api/hit.js`, stored in D1 `dhruvkothari-analytics` (binding `DB`,
   schema `migrations/0001_hits.sql`).

Logged per event: time, kind (view/end), path incl. hash route, referrer host, device class
(phone/tablet/desktop), country and city from `request.cf`, dwell seconds (on `pagehide`).
Not logged: IP, cookies, fingerprints, user agent. Visit source: links tagged `?from=<slug>` (lowercase a-z, 0-9, `-`, max 24 chars; anything else is ignored) store the slug in `hits.src`. The client keeps it in `sessionStorage` so later pages of the same visit carry it; the server re-validates and stores null for bad values. Tags in use: `linkedin`, `github`, `resume`. Untagged visits show as `(untagged)` in the "By source" table on `/stats`. Needs migration `0003_hits_src.sql`; until it is applied remotely, hits are still stored, just without `src`.
Surfaces reached show up as paths (`/`, `/resume/`, `/resume/pdf-click`, `/room/#/...`).

**Path change:** the work page moved from `/work/` to `/` (room: `/` to `/room/`). Visits
before 2026-11-01 are recorded under `/work/` (work page) and `/` (room); visits after
under `/` (work page) and `/room/` (room). `/work` and `/work/` 301 to `/`, so they no
longer log. When comparing dates, add `/work/` and `/` for the old period.
OS-app opens inside the iframe are not logged yet.

**Excluded:** `localStorage['v3:no-track']='1'` (set once per browser you use: open any page with `?notrack=1`, e.g. `https://dhruvkothari.pages.dev/?notrack=1`, which sets it and shows the toast "This browser won't be counted"; `?notrack=0` undoes it) and `v3:test` (all test runs);
localhost never reports.

**Stats:** `/stats?token=<STATS_TOKEN>`; the secret is a Pages secret (production and preview).
Rotate: `wrangler pages secret put STATS_TOKEN --project-name dhruvkothari [--env preview]`.
