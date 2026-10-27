# Analytics

Two layers, production hosts only (`*.dhruvkothari.pages.dev`):

1. **Cloudflare Web Analytics** beacon, injected from `index.html`.
2. **First-party visit log**: `src/v3/lib/analytics.js` (and an inline snippet in `resume/index.html`)
   `sendBeacon`s to `functions/api/hit.js`, stored in D1 `dhruvkothari-analytics` (binding `DB`,
   schema `migrations/0001_hits.sql`).

Logged per event: time, kind (view/end), path incl. hash route, referrer host, device class
(phone/tablet/desktop), country and city from `request.cf`, dwell seconds (on `pagehide`).
Not logged: IP, cookies, fingerprints, user agent. No `?r=` tags; every visit is logged untagged.
Surfaces reached show up as paths (`/work/`, `/resume/`, `/resume/pdf-click`, `/#/room/...`, `/#/os/...`).
OS-app opens inside the iframe are not logged yet.

**Excluded:** `localStorage['v3:no-track']='1'` (set once per browser you use: open any page with `?notrack=1`, e.g. `https://dhruvkothari.pages.dev/?notrack=1`, which sets it and shows the toast "This browser won't be counted"; `?notrack=0` undoes it) and `v3:test` (all test runs);
localhost never reports.

**Stats:** `/stats?token=<STATS_TOKEN>`; the secret is a Pages secret (production and preview).
Rotate: `wrangler pages secret put STATS_TOKEN --project-name dhruvkothari [--env preview]`.
