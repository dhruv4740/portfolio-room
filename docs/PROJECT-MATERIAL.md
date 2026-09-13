# Project material — research notes for portfolio copy

Compiled by reading source code, git history, and docs directly (not by trusting READMEs).
Every claim below is marked **VERIFIED** (read in code/commits/docs) or **CLAIMED**
(README/owner says so, not independently confirmed). Where no real engineering "Decision" or
"What broke" story exists in the evidence, that is stated explicitly rather than invented —
these are interview topics and fabricated war stories would be worse than a blank field.

A methodology note first: `C:\Users\hp` is itself a git repository (the user's home-directory
dotfiles/scratch repo). Running `git -C <folder> remote -v` inside any subfolder that is **not**
its own git repo silently returns the home repo's remotes (`dhruv4740/visionwebsite` /
`dhruv4740/geosvg-maps-demo`) instead of erroring. Nine folders below hit this trap; their
apparent "remote" was discarded as noise and they're marked "not a git repo" in the table.

---

## Part 1 — Triage of every folder scanned

### Originally-briefed set (deep-dived in Part 2)

| Folder | What it is | Maps to | Show in portfolio? | Last touched |
|---|---|---|---|---|
| `new-focuslock` | FocusLock — cross-device screen-time enforcer, Android + Windows | `dhruv4740/focuslock` (VERIFIED — matches local repo content) | **Yes** | 2026-07-28 (local); GitHub mirror pushed 2026-07-17 |
| `comparison` | BasketProof/basketprice — grocery price comparison across Blinkit/Zepto/Instamart | no GitHub match found in the provided repo list; local-only git repo | **Yes**, with caveats (see Part 2) | 2026-09-13 |
| `comparison-blinkit-reliability` | **Same repo as `comparison`** — a git *worktree* (`.git` file points to `comparison/.git/worktrees/comparison-blinkit-reliability`), checked out for a Blinkit-connector reliability audit | same as `comparison` | Not a separate project — fold into the `comparison` entry | 2026-09-11 |
| GitHub `expense-tracker` | Android expense tracker, SMS/notification capture, local SQLite | `dhruv4740/expense-tracker` (VERIFIED, public) | **Yes** | pushed 2026-09-03 |
| GitHub `crisiswatch` + `crisiswatch-web` | "Fact or Cap" — AI misinformation fact-checker, hackathon project | `dhruv4740/crisiswatch`, `dhruv4740/crisiswatch-web` (VERIFIED, public) | **Yes**, flag as stale (see Part 2) | pushed 2025-11-29 (both) |

### Additional folders scanned this pass (scope expansion)

| Folder | What it is | Maps to | Show in portfolio? | Last touched |
|---|---|---|---|---|
| `aqi` | "Air Quality Intelligence Platform" — planned ISRO + hackathon submission | No remote configured (`git config` has no `[remote]` section) — never pushed anywhere | **No** — Phase 0 scaffold only; README's own checklist shows Phases 1–4 (the actual pipeline, model, dashboard) unbuilt | 2026-06-27, one commit |
| `autoscroll` | Reddit automation via AdsPower browser profiles — FastAPI + Playwright, Windows-first, proxy/profile quarantine system, bot-challenge detection | `dhruv4740/internship_automation` (VERIFIED remote) + second remote `blink-new/autoscroll_reddit.git` (employer org) | **Maybe — flag for owner**, see confidentiality note in Part 2 | 2026-08-10 |
| `linkbuilding` | Automated link-building: prospect discovery → contact extraction → LLM-drafted outreach → human-approved Gmail send | `dhruv4740/linkbuilding` (VERIFIED) | **Maybe — flag for owner** | 2026-07-19 |
| `outreach` | Affiliate-recruitment cold-email pipeline for Blink.new (Dhruv's internship employer) | `dhruv4740/blink_email_automation` (VERIFIED) | **Maybe — flag for owner**, employer-confidential numbers redacted below | 2026-08-06 |
| `quizitt` | NDA, offer letter, internship certificate, a competitor spreadsheet — HR/internship paperwork | none — not code | **No** — not a project | Aug 2025 |
| `New folder` | College lab/tutorial zip files (C++, web programming experiments) | none | **No** — coursework scratch | Feb–Apr 2026 |
| `random files` | Resume, ID scans, screenshots, personal audio | none | **No** — personal files | scattered |
| `random sites/aiusecasewebsite` | A single `design.md` file | not a git repo (home-repo remote is noise) | **No** — not started | — |
| `random sites/artemis` | Empty `create-next-app` template, zero commits (`branch 'master' does not have any commits yet`) | none | **No** — never built | — |
| `random sites/hackathons` | Loose hackathon assets (certificate image, a 3D model, datasets) | not a git repo | **No** — not a project, just artifacts | Feb 2026 |
| `random sites/my-portfolio` | An **earlier version of Dhruv's own portfolio site** (vanilla HTML/CSS/JS) | `dhruv4740/portfolio` (VERIFIED) | **No** — superseded by the v3 portfolio currently being built in this same repo family | last commit 2025-01-28 |
| `random sites/new-website` | Small vanilla-JS "General Knowledge Quiz" app + a `quiz-arcade/` subfolder | not a git repo | **No** — scratch experiment | — |
| `random sites/portfolio2` | Another old portfolio scratch copy, contains stray `tempCodeRunnerFile.c/.cpp/.exe` (VS Code Code Runner artifacts) | not a git repo | **No** — abandoned duplicate | — |
| `random sites/rasfinalwebsite` | Official website for the Robotics Automation Society (RAS) at K.J. Somaiya College of Engineering — Next.js 15, React 19, Tailwind 4, Three.js | `dhruv4740/raswebsite` (VERIFIED) | **Yes**, if a college-org site fits the portfolio's scope — real, actively maintained | 2026-02-28 |
| `random sites/test` | An **earlier prototype snapshot of FocusLock**, dated May 2026, running the old HTTP-backend architecture (`POST /devices/:userId/register`, e2e tests against a device-registration API) | not a standalone repo — a copy | **No** as a separate project, but **important evidence** — see FocusLock's Decision section | May 2026 |
| `random sites/uipexpt` | UI prototyping scratch (`design.md`, `aiusecase.md`, a static `app.js`) | not a git repo | **No** — experiment | — |
| `random sites/valentines` | A small Valentine's Day interactive web page | `dhruv4740/valentines` (VERIFIED) | **No** — novelty page, not deep enough for the deep-dive treatment; may work as a small portfolio "fun" entry if the site wants one | 2026-02-08 |
| `random sites/vision new website` | `visionfinalwebsite` — README is a bare title, no further content read | `dhruv4740/visionfinalwebsite` (VERIFIED) | **Unclear — needs owner** to say which "Vision" site (see below) is current | 2025-06-27 |
| `random sites/vision website` | Another "Vision" site copy | not a git repo (home-repo remote is noise) | **No** — appears to be one of several duplicate/iterative attempts; owner should clarify | — |
| `random sites/vision-website` | Yet another "Vision" site copy | not a git repo (home-repo remote is noise) | **No** — same as above | — |
| `random sites/wp2expt` | A single `expt 1/` folder — reads as a "Web Programming" course lab experiment | not a git repo | **No** — coursework | — |

**Repos from the orchestrator's target list that no local folder mapped to** — not investigated
this pass: `sih2026`, `blink_growth`, `claudechat-clone`, `humantext-editor`,
`reliability-intelligence-platform`, `geosvg-maps-demo`, `kerabeaute-desktop-homepage`,
`factorcap`, `axon-peer-boost`, `elements`, `reddit-growth-copilot`. One unverified hypothesis
worth flagging: `factorcap` is plausibly the same product as `crisiswatch`/`crisiswatch-web` —
both READMEs brand the product "Fact or Cap" — but this was not fetched or confirmed, so treat
it as a guess, not a fact.

There are three "Vision [something] website" folders/repos (`visionwebsite`, `visionfinalwebsite`,
and the RAS site which itself mentions fixing "vision refs" in a commit) — this reads like
several iterations of the same student-org rebrand. Not disentangled here; ask the owner which
one is live/current before using any of them in copy.

---

## Part 2 — Deep dives

## FocusLock

### What it is
- Cross-device screen-time enforcer: an Android app and a Windows desktop agent that share one
  daily usage limit, pulled from one Firebase Firestore backend. VERIFIED — `README.md`,
  `docs/architecture.md`.

### Stack
- Android: Kotlin, no XML-layout evidence beyond standard Android project files; Material 3
  theme (commit `27eb4a4`). VERIFIED — `android/app/src/main/java/com/focuslock/**`, 24 main
  source files + 12 test files.
- Windows agent: Electron (Node/JS), `active-win` for foreground-window polling, `electron-builder`
  (NSIS) for the installer, `electron-updater` for self-update. VERIFIED —
  `windows-agent/src/agent.js`, `windows-agent/package.json` presence, `windows-agent/dist/*.exe`.
- Backend: Firebase Firestore only — **no application server**. VERIFIED — `firebase.json`
  (`{"firestore": {"rules": "firestore.rules"}}`), and the explicit "no separate backend server
  and no browser extension" line in both `README.md` and `docs/architecture.md`.
- GitHub language breakdown (public mirror, `dhruv4740/focuslock`): Kotlin 207,638 bytes,
  JavaScript 85,175, CSS 16,942, HTML 12,498, PowerShell 7,000, Batchfile 1,246, NSIS 363.
  VERIFIED via GitHub API.

### Architecture
- **Android detection**: an Accessibility service (`FocusAccessibilityService.kt`) reacts to
  foreground-app-change events only — event-driven, not polling. It reads window content, but
  **only** inside Instagram/YouTube to match specific view IDs for reel/short detection
  (`clips_viewer_view_pager`, `reel_recycler`, etc.) — not a general screen-reader. VERIFIED —
  `docs/architecture.md`, corroborated by file list (`surface/SurfaceDetector.kt`,
  `surface/SurfaceBlocker.kt`).
- **Windows enforcement**: the Electron agent polls the active window via `active-win`, matches
  process names/browser URLs against policy, and closes tabs or kills processes. VERIFIED —
  `docs/architecture.md`.
- **Pairing / sync codes**: a user-chosen string, normalized identically on both platforms
  (lowercased, non-alphanumerics → `-`), selects the Firestore subtree `users/<syncId>/…` both
  clients read/write. VERIFIED — `README.md`.
- **Firestore schema** (VERIFIED, `docs/architecture.md` + `firestore.rules`):
  - `users/{userId}/policy/global` — limits, target apps, block windows, `blockedSurfaces`,
    `reelDailyLimit`.
  - `users/{userId}/usage_days/{local-date}` — `usedMinutes`, `opensToday`,
    `extensionsUsedToday`, `reelCounts`.
  - `users/{userId}/focus_session/current` — active flag + `endsAt`, blocks all targets on every
    device.
  - `users/{userId}/events`, `.../streak/current`, `.../todos`.
  - `profiles/{uid}` and `friendships/{pairId}` — a separate, uid-keyed identity layer added
    later for a friend-leaderboard feature, independent of the sync-code tree.
- **Security rules** (VERIFIED, `firestore.rules`, read in full): both apps authenticate via
  Firebase Anonymous Auth, then access to a sync code's tree is gated on membership in a
  `members` allowlist on that tree's document — not just "any authenticated client." A client
  joins by adding its own uid (one at a time, capped at 10 members — raised from an original cap
  of 5 because anonymous auth mints a new uid per reinstall). The rules file's own comment states
  the honest threat model: "the sync code itself is still the pairing secret... matching the
  'you + one trusted person' trust model this app targets, not full multi-tenant isolation."
- **Reel/Shorts detection** is its own documented subsystem: counting and enforcement are
  independent pipelines over the same accessibility-event stream; modded YouTube builds (which
  rename the Android `applicationId`) are handled via a layered package-resolution strategy
  (known set → learned aliases → heuristic), auto-learning new package bindings at runtime.
  VERIFIED — `docs/architecture.md`.

### Decision
**Firestore-direct sync over a self-hosted HTTP backend — the strongest-evidenced decision in
this whole research pass.** FocusLock did not start with the current architecture; a rejected
prior design is preserved as a physical artifact:
- `random sites/test/COMPLETION_SUMMARY.md` (dated May 20, 2026) documents a working prototype
  built around a custom TypeScript HTTP backend with a device-registration API
  (`POST /devices/:userId/register`, `GET /devices/:userId`), its own e2e test suite
  (`test-e2e.js`, 8/8 passing), and in-memory storage.
- Commit `bc9c005` ("docs: rewrite README for current Firestore architecture + sync code")
  states directly: *"The old README described a removed TypeScript HTTP backend, a browser
  extension, and in-memory storage."*
- Commit `9a03eb2` ("refactor(windows): remove dead local-server/firewall subsystem") deletes the
  Windows agent's local HTTP server, its `getLocalIpAddress`/firewall-rule code, and associated
  IPC — 115 lines removed, with the message: *"The agent talks to Firestore directly; the local
  HTTP server it used to expose is gone."*
- Commit `fe305b6` ("chore: remove legacy HTTP-backend CLIs and dev test scratch") removes the
  remaining CLI tooling built for that backend.

So the real fork in the road was: keep a self-hosted server (with its own device-registration
API, local network/firewall traversal, and a browser extension to intercept desktop tabs) versus
move to Firestore as shared state with a native Electron agent replacing the browser extension.
The team chose Firestore + Electron — cutting an entire server, its deployment, and its firewall
problem, at the cost of the "known limitation" the README now states outright: *"Firestore web
API keys are public by design; data isolation between sync codes is functional, not
access-controlled... Add Firestore Security Rules if you need real access control"* — which is
exactly what the later `firestore.rules` membership-allowlist rewrite (see Architecture) went
back and fixed.

### What broke
- **Ctrl+W didn't actually close the tab.** Commit `f717a4a`: *"The agent logged 'closed tab' but
  the tab stayed open. PostMessage of WM_KEYDOWN VK_CONTROL never updates global key state, so
  Chromium read the synthetic 'W' with Ctrl not held and treated it as a plain keypress."* Fixed
  by switching from `PostMessage` to `SendInput` (real input injection that updates key state),
  plus re-asserting the foreground window first. This is a real, verified, technically specific
  Windows API bug — good interview material. **Note: this commit carries
  `Co-Authored-By: Claude Opus 4.8`** — record that if asked whether this was AI-assisted.
- **Blocked apps kept playing audio.** Commit `7fb53ac`: the Android lock screen was a
  `TYPE_APPLICATION_OVERLAY` drawn *over* the blocked app, but the app underneath stayed
  `RESUMED` and kept playing (e.g. Instagram Reels audio) behind the lock. Fixed by having the
  accessibility service fire `GLOBAL_ACTION_HOME` the instant the lock engages, pushing the app
  off the foreground so playback actually stops. **Also carries
  `Co-Authored-By: Claude Opus 4.8`.**
- **Reel/Shorts view-ID matching is inherently fragile.** `docs/architecture.md`, in the team's
  own words: these internal view IDs "are not a public API and silently stop matching after a
  redesign — failure is fail-open (no detection), never a wrong-app block." This is a documented,
  accepted limitation rather than a fixed bug, but it's an honest one worth stating as-is.
- **Sideloaded installs get their Accessibility toggle greyed out** on Android 13+ ("Allow
  restricted settings" workaround) — a platform-imposed constraint, not a FocusLock bug, but
  real friction the team had to document and work around (`docs/UPDATES.md`).

### Status
- Actively developed. Local repo's most recent commit: `9a13ab4`, "bump version to 0.7.1"
  (2026-07-28). 72 total commits. VERIFIED via `git log`.
- Release signing, code-signing for the Windows installer, and GitHub Actions CI are all
  explicitly deferred (`docs/UPDATES.md`: "Decision deferred by the maintainer: manual releases
  for now"). Windows installer is unsigned (SmartScreen warning on first run) — an accepted
  cost/benefit tradeoff, documented as such.
- Public GitHub mirror (`dhruv4740/focuslock`) is behind the local tree — last pushed
  2026-07-17, local work continued after that. Note this discrepancy if the portfolio links to
  GitHub directly.

### Links
- GitHub: `github.com/dhruv4740/focuslock` (VERIFIED public, 79 files on `main`).
- No deployed/hosted URL — this is a locally-built, sideloaded Android APK + a distributed
  Windows installer via GitHub Releases, not a hosted web service. CLAIMED release process
  documented in `docs/UPDATES.md`; no evidence of a live release fetched this pass.

---

## BasketProof / basketprice

*(covers both `comparison` and `comparison-blinkit-reliability` — the latter is a git worktree of
the former, not a separate project; same `.git` directory, confirmed via the `comparison-blinkit-reliability/.git`
file's `gitdir:` pointer.)*

### What it is
- A **private, not-for-release** grocery price comparison and cart-sync tool built for the
  owner's own family, comparing Blinkit, Zepto, and Swiggy Instamart. VERIFIED — `README.md`:
  *"BasketProof is a private grocery comparison prototype for an Indian family."*
- Its own stated design principle, repeated throughout the docs: **"UNKNOWN is better than
  WRONG"** — the system is built to refuse to state a price/total unless it has verified evidence,
  rather than guess. VERIFIED, `README.md` and `docs/architecture.md`.
- Not on the public GitHub list this task was given — it appears to be a local-only git repo (no
  `origin` remote was checked/confirmed; not pursued further since it was explicitly out of the
  public-repo scope).

### Stack
- Backend: Python, FastAPI, PostgreSQL 18, `curl_cffi` (Chrome TLS/JA3 impersonation for the
  Blinkit connector), Alembic migrations. VERIFIED — `pyproject.toml`, `alembic.ini`,
  `requirements.lock`, `PROJECT.md`.
- Android: Kotlin, Jetpack Compose. VERIFIED — `PROJECT.md` code-layout section, `android/`
  present.
- Test infrastructure is unusually heavy for a personal project: `TEST_INFRA.md` (15KB),
  multiple `.test-tmp*` scratch directories visible in the working tree, a dedicated
  `tests/test_e2e_suite.py`. VERIFIED by directory listing.

### Architecture
- **Three very different provider integrations, by necessity, not choice**:
  - **Blinkit**: no official API. Reverse-engineered via `curl_cffi` Chrome TLS/JA3
    impersonation against `api2.grofers.com`/`api.blinkit.com`, 2-step phone OTP login. VERIFIED
    — `backend/basketproof/blinkit_shopping.py` referenced throughout `docs/HANDOFF.md`,
    `docs/blinkit-reliability.md`.
  - **Zepto & Instamart**: official first-party MCP (Model Context Protocol) tool servers with
    OAuth PKCE. VERIFIED — `docs/HANDOFF.md`: "Official first-party MCP tools with OAuth PKCE."
- **Hybrid data architecture** (VERIFIED, `docs/architecture.md`, "Hybrid data architecture
  (decision 2026-09-06)" section, read in full): the account-bound path (OAuth/MCP, encrypted
  credentials, per-user) is the sole source of *authoritative* optimizer input. A second,
  unauthenticated "public price" layer was added on top of it to read location-keyed prices from
  public storefronts without login, because none of the three platforms exposes what's actually
  needed while authenticated: Blinkit has no consumer OAuth at all, Zepto's MCP tool set only has
  4 of 23 tools with a declared `outputSchema` (all catalogue-only, no delivery fees), and
  Swiggy/Instamart doesn't document its price currency units. The public layer is explicitly
  lower-confidence, walled off from the optimizer, and labelled as such wherever shown.
- **Credential security**: `CredentialCipher` — AES-GCM-256 with context AAD binding (platform,
  user, account, purpose). VERIFIED — `PROJECT.md`.
- **Cart mutation safety**: PostgreSQL session-level advisory locks (`account_operation_lock`)
  serialize cart writes per platform connection; every mutation is re-read and compared
  field-by-field afterward, with `unavailable_checks`/`conflicts` surfaced rather than silently
  treated as success. VERIFIED — `docs/architecture.md` ("Cart integrity" section).

### Decision
- **Hybrid architecture, documented above** — the clearest "why" in this whole codebase, dated
  and reasoned in the doc itself. It's also the project's most interview-risky decision: the
  same document states, in its own words, *"Accepted risk: public storefront fetching likely
  violates platform terms of service. The user accepted this tradeoff explicitly for a private
  non-commercial family application."* **NOT FOR PUBLICATION as public-facing website copy** —
  fine as research material and fine for the owner to discuss verbally with context, but a public
  portfolio page stating "scrapes competitors' storefronts against their likely ToS" is a bad
  idea for a project tied to his real name. Flagging for the owner's call.
- **Cart-restore/snapshot-undo was deliberately removed**, not left unbuilt. `docs/HANDOFF.md`,
  dated 2026-09-13: *"cart-restore/snapshot-undo ('undo my last cart add') was removed entirely
  by owner decision on 2026-09-13. Cart add now overwrites the provider-side cart with no undo."*
  Confirmed by two commits the same day: `8538bae` ("delete the unreachable cart recovery
  system") and `dbfc553` ("remove cart snapshot and restore entirely"). This is a genuine,
  deliberate scope-cut, not an abandoned feature — worth stating as "we built undo, then decided
  the complexity/risk wasn't worth it for a private tool," which is a legitimate engineering
  story in its own right.

### What broke
- **Cloudflare 403s were being treated as session revocation, wiping valid credentials.**
  Documented in detail in `docs/blinkit-reliability.md` (an audit produced from the
  `comparison-blinkit-reliability` worktree): Blinkit's connector code checked
  `if resp.status_code in (401, 403): raise BlinkitAuthError`, which meant a Cloudflare
  bot-mitigation block (403) was indistinguishable from an actually-expired login, and the fix
  path (`_mark_blinkit_session_expired`) permanently deleted the stored encrypted token
  (`credential_blob = None`) on either case — creating a possible lockout loop where re-login
  from the same blocked IP would also 403. This was found and fixed: commit `c82b65d`,
  "fix(blinkit): classify Cloudflare 403 as block without session wipe." A real, specific,
  verified bug with a real fix — good interview material.
- **Zepto's cart response has no fee/tax/total section at all** — confirmed by live,
  owner-authorized capture (one item added and removed on a real account, 2026-09-07), not
  assumed. `docs/HANDOFF.md` states this makes the fail-closed behavior of
  `extract_zepto_cart_bill` "correct and permanent, not a pending gap" — i.e., a real platform
  limitation the team hit and had to design around, not a bug in their own code.
- **Instamart's `get_cart` endpoint is intermittently failing server-side** — ~13 consecutive
  failures were observed live across all saved addresses before it recovered on its own
  (`docs/HANDOFF.md`, 2026-09-07 entry) — the team's response was to require any implementation
  to fail a single call to `UNKNOWN` rather than retry-block or trust a stale result.
- **A dead button that could never have worked**: `docs/HANDOFF.md` notes the deep-link "Open in
  app" fix "also fixed a bug, not just added a feature — `ApiClient.platforms()`/
  `PlatformBlocker` existed in the Android client already but were never called from anywhere, so
  no button could ever have appeared even with a populated template."

### Status
- Actively developed — 191 commits, most recent `dbfc553` (2026-09-13, same day as this research
  pass). Explicitly **not production-deployed**: `docs/architecture.md` states plainly, "This
  repository is a local development build... No production service has been deployed." Scope is
  deliberately narrowed to "family-only Android, with WhatsApp and iOS planned... A large
  release, ads and Play Store monetization are deferred" (`docs/HANDOFF.md`, 2026-09-10 audit).
- No live delivered-basket comparison has passed the strict admission bar yet — it always returns
  `UNKNOWN` for that path by design (README, verified — this is stated as current behavior, not a
  bug).

### Links
- No GitHub repo confirmed for this project in the researched scope (not in the provided public
  repo list; local-only git history examined).
- No deployed/live URL — explicitly local-only per the architecture doc.

---

## Expense Tracker

### What it is
- A personal Android expense tracker that intercepts SMS and banking/UPI-app notifications,
  parses transaction data locally, and stores it in on-device SQLite. No backend, no accounts, no
  cloud sync. VERIFIED — GitHub README (`raw.githubusercontent.com/dhruv4740/expense-tracker/main/README.md`).

### Stack
- React Native 0.86 (bare workflow, TypeScript, **New Architecture on**). VERIFIED — `CLAUDE.md`
  in the repo.
- Kotlin native modules for SMS interception (`SmsReceiver.kt`/`SmsModule.kt`) and notification
  access (`NotificationService.kt`/`NotificationModule.kt`) — required because neither capability
  is reachable from JS. VERIFIED — `CLAUDE.md`.
- SQLite via `@op-engineering/op-sqlite` — explicitly chosen as the maintained, New-Architecture-
  ready successor to the deprecated `react-native-quick-sqlite`, by the same author. VERIFIED —
  `CLAUDE.md`.
- GitHub language breakdown: TypeScript 392,237 bytes, Kotlin 43,599, JavaScript 880, Ruby 520
  (the Ruby is almost certainly CocoaPods/Fastlane scaffolding from RN's bare template, not
  hand-written — not independently confirmed).

### Architecture
- **Battery-first split between capture and processing** — this is the single best-documented
  architecture decision in the whole research pass, and it's VERIFIED in detail via
  `RULES.md §1` (read in full):
  - Capture (native Kotlin, always-on, no RN bridge, no wake lock): a manifest-registered
    `BroadcastReceiver` for SMS, and a `NotificationListenerService` for notifications. Both
    write raw, unparsed events to a shared `SharedPreferences`-backed ring buffer
    (`EventBuffer`, capped ~500 entries) and return immediately — no threads, no timers, no DB
    writes, no JS bridge crossing.
  - Processing (TypeScript, only runs when the app is open): on app open/foreground, JS drains
    the buffer, runs it through `parser.ts`, dedupes, and writes to SQLite via `db.ts`.
  - While the app is open, the same native modules *also* emit live events for instant UI
    updates, through the identical parser+dedup path (not a separate code path).
- **Why the split exists, in the team's own words** (`RULES.md`): *"The naive 'native emits event
  → JS parses → JS inserts' path only works while a JS context is alive. When the app is swiped
  away the event is dropped, and forcing JS awake per event drains battery."*
- **Notification allowlist has three states, not two** (`RULES.md`): key absent → a
  `DEFAULT_ALLOWLIST`; key present but an empty array → capture is *intentionally* off (this is
  how unchecking every app in Settings actually disables capture, distinct from "not configured
  yet"); key present with entries → that exact set.
- **SMS pre-filter runs before the buffer, not after**: a single pre-compiled regex for a
  currency amount (`(?i)(?:rs\.?|inr|₹)\s*[\d,]`) gates what gets buffered at all, so OTPs and
  personal texts never enter storage — cheaper writes, no ring-buffer eviction of real bank SMS
  on chatty days, and less sensitive data sitting in `SharedPreferences`.

### Decision
- **`peek`+`ack` over `drain`, deliberately, after `drain` was found unsafe.** `RULES.md`: *"JS
  should prefer `peek`+`ack` (`SmsModule.peekBuffer()` / `ackBuffer(count)`): drain-then-process
  can lose events if processing crashes mid-loop; peek-then-ack only marks events as consumed
  after they were actually looped over."* `drain` (peek+ack-all in one call) is kept only as a
  legacy fallback. This is a real, specific, correctness-motivated API design decision with a
  clear tradeoff stated.
- **In-memory single-JSON-array buffer over per-event keys** — `RULES.md` calls out that a
  per-event-key rewrite "was skipped" (see "known risks" in the same file, not independently
  re-read this pass, but the decision is stated as deliberate rather than an oversight).

### What broke
- **Refund-direction parsing bug, real and shipped-then-fixed.** Commit
  `2026-07-26T10:35:25Z fix(parser): stop inverting refunds and misfiling on SMS boilerplate` —
  a verified, dated bug-fix commit in the public GitHub history (`dhruv4740/expense-tracker`,
  59 commits total). The parser was flipping refund direction and/or filing boilerplate SMS text
  as real transactions.
- **Dedup timestamp race**: `RULES.md` documents that the buffered event and the live-emitted
  event for the same SMS/notification deliberately share a single timestamp read, "because dedup
  keys bucket by minute, and two separate `System.currentTimeMillis()` calls can straddle a
  minute boundary" — a subtly real race condition the team anticipated and designed around rather
  than discovered via a bug report, worth stating as such rather than as a "we hit a bug"
  narrative.
- Commit history (59 commits, spanning 2026-07 through 2026-09-03) shows ordinary iterative
  feature work (Uber-ride reimbursement tracking, settlement/netting, chart tooltips) alongside
  the parser fix above — a real, lived-in codebase, not a single squashed import.

### Status
- Public GitHub repo, most recent push 2026-09-03, commit message
  "chore: sanitize paths, strengthen gitignore, and prepare repository for public release" — i.e.
  it was deliberately cleaned up for publication, which is itself a useful data point (the owner
  cared enough to prep it for public viewing).
- Backups are explicit and manual only: `allowBackup=false` in the Android manifest ("financial
  data must stay on-device" — CLAIMED, README), with an in-app CSV/JSON export/import as the only
  backup path.

### Links
- GitHub: `github.com/dhruv4740/expense-tracker` (VERIFIED public).
- No deployed URL — this is a sideloaded Android APK (release build, package `com.expensetracker`),
  not a hosted service. No app-store listing found or expected (README explicitly frames it as a
  personal tool).

---

## CrisisWatch / "Fact or Cap"

*(covers both `dhruv4740/crisiswatch` — backend — and `dhruv4740/crisiswatch-web` — frontend)*

### What it is
- An AI-powered fact-checking tool, built for a hackathon: paste a claim, it searches multiple
  sources and LLM-synthesizes a verdict (TRUE/FALSE/MIXED/etc.) with confidence score, evidence,
  and bilingual (English/Hindi) explanation. VERIFIED — both repos' READMEs; branded "Fact or
  Cap" / "No cap. Just facts." CLAIMED: "Built for the CrisisWatch Hackathon 2025 - Misinformation
  Track" (both READMEs state this).

### Stack
- Backend: Python 3.11+, FastAPI, LangGraph (agentic workflow), Google Gemini 2.0 Flash, with
  Tavily/NewsAPI/Wikipedia/Google Fact Check as search tools. VERIFIED — `requirements.txt`.
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, deployed to Vercel.
  VERIFIED — README + `package.json` presence in the file tree.
- GitHub language breakdown: backend is 100% Python (295,731 bytes); frontend is TypeScript
  243,401 bytes / CSS 4,599 / JS 258.

### Architecture
- Backend pipeline (VERIFIED, `graph/nodes.py` read directly): claim extraction → parallel
  multi-source search (Tavily web search, an *extended* secondary Tavily pass, Google Fact
  Check, NewsAPI, Wikipedia, plus an "AggregatedFactCheckTool" covering Snopes/PolitiFact/Full
  Fact/AFP/Reuters) → domain-based deduplication (max 2 results per domain) → evidence synthesis
  → verdict + bilingual explanation generation, with reliability scoring and confidence
  calibration as separate service modules (`services/reliability.py`, `services/confidence.py`,
  referenced in `graph/nodes.py`'s imports).
- Real-time delivery via Server-Sent Events (`/api/check/stream`), not just a blocking POST.
  VERIFIED — README endpoint table + a dedicated `app/api/check/stream/route.ts` in the frontend.
- **Frontend proxies to backend, and has a documented graceful-degradation path for when the
  backend is unreachable.** VERIFIED, `app/api/check/route.ts` (read in full): it calls
  `${BACKEND_URL}/api/check` (hardcoded default `https://crisiswatch-uoj4.onrender.com`), and on
  a fetch-level `TypeError` (the signature of a dead/unreachable backend) it explicitly returns
  `{"error": "Backend service unavailable", "fallback": true}` rather than crashing.
- **A separate, more aggressive fallback exists at the UI layer, not just the API route.** The
  active `app/components/sections/live-demo.tsx` component (confirmed live — not just the
  similarly-named backup file, both contain the same pattern, 21 references to "fallback" in the
  live file) hardcodes canned demo results (verdict, confidence %, source count, timing) for three
  preset claims, used "only if the API call times out after 20 seconds." This is a real,
  deliberate design response to backend unreliability (see What broke) — worth describing as "the
  live demo has a 20-second-timeout fallback to pre-baked results for its example claims," which
  is both true and a reasonable thing to build for a hackathon demo.
- A `crisiswatch-extension/` browser extension exists in the frontend repo (per its README) — not
  independently fetched/verified this pass.
- CLAIMED (README only, not independently tested): a WhatsApp integration exists, gated behind a
  webhook. This is corroborated indirectly by commit messages (see What broke) but the feature's
  current working state was not tested live.

### Decision
Not found — needs the owner. No document in either repo states an alternative that was
considered and rejected (e.g., why LangGraph over a simpler prompt chain, why Gemini over another
LLM). The stack choices read as reasonable hackathon defaults, but nothing here confirms they were
a considered decision rather than "the tools the team already knew."

### What broke
- **A real, dated debugging session on the WhatsApp integration**, visible in the commit log
  (all same day, 2025-11-29, in this order): "Add skip_cache parameter to SSE endpoint" →
  "Add current date/time context to all prompts" → "Require specific dates in explanations, not
  vague '2025'" → "Fix WhatsApp webhook: add GET endpoint and better logging" → "Fix WhatsApp:
  parse form data properly (Twilio sends form-urlencoded)" → "Fix missing Request import" →
  "Fix WhatsApp webhook: add python-multipart and fix WhatsAppGatewayTool" → "Fix WhatsApp
  image/audio processing - better content type detection and logging." This is a genuine,
  verifiable "what broke" story: a WhatsApp (Twilio) webhook integration that required several
  rounds of fixes for form-encoding, missing imports, and content-type detection before working —
  16 total commits, all in one day, reading like a single focused integration push. Good,
  honest interview material: "the WhatsApp bridge took several iterations to get right — wrong
  content-type assumptions, a missing FastAPI import, and Twilio's form-encoded (not JSON)
  webhook payload all bit us in the same session."
- **The 20-second frontend fallback (above) is itself evidence of a real reliability problem**:
  building a timeout-triggered fallback to pre-baked demo answers is exactly what you do when a
  free-tier backend (Render) has slow/unreliable cold starts. This wasn't found in a commit
  message explaining *why*, so treat the mechanism as VERIFIED but its underlying motivation as a
  reasonable CLAIM/inference, not a confirmed quote.

### Status — stale, confirmed this pass
- Both repos' last push: **2025-11-29** — roughly 9-10 months before this research (today is
  2026-09-13).
- **Live check performed this pass**: the frontend (`crisiswatch-web.vercel.app`) responds
  **HTTP 200** — still up. The backend (`crisiswatch-uoj4.onrender.com`, both `/docs` and
  `/health`) **failed to connect at all** (curl exit code 28, connection timeout) — consistent
  with a spun-down free-tier Render service that never woke up, or a fully decommissioned
  backend. **The live demo advertised in both READMEs is very likely non-functional right now**
  beyond the three hardcoded fallback claims baked into the frontend. This should be verified by
  the owner before any portfolio copy claims "try it live."

### Links
- GitHub: `github.com/dhruv4740/crisiswatch` (backend), `github.com/dhruv4740/crisiswatch-web`
  (frontend) — both VERIFIED public.
- Claimed live URLs (frontend confirmed reachable, backend confirmed unreachable as of this
  research): `crisiswatch-web.vercel.app`, `crisiswatch-uoj4.onrender.com`.

---

## wp2lab

### What it is
- Despite the name suggesting "web programming lab" coursework (there's a sibling local folder,
  `wp2expt`, containing an `expt 1/` — reading as the same course), this repo's actual content is
  a small **client-only mock dashboard** for a satellite ground-station downlink scheduler.
  `package.json` names it `somaiyasat-ai-dashboard` (K.J. Somaiya being the owner's college) —
  this is very likely a course assignment or club project artifact, not a personal product.
  VERIFIED — package.json name field, source read directly.

### Stack
- React 18 + Vite, no backend, no routing library, two dependencies total (`react`, `react-dom`
  at runtime). VERIFIED — `package.json`.

### Architecture
- Single-page React app (`App.jsx`) with a form for battery %, link quality, available
  communication time, and a payload queue; a "scheduler" recommends what to transmit.
- **Important honesty flag: this is not an AI system.** `src/services/api.js` (read in full) is
  entirely client-side JavaScript: `getInitialTelemetry()` and `runAiScheduler()` both return
  hardcoded/computed values wrapped in a `Promise` + `setTimeout` (200ms delay) purely to *look*
  like a network call. The "scheduler" itself is a deterministic if/else rule ladder
  (battery-threshold checks, a fixed `priorityWeights` map, a greedy time-budget packer) — there
  is no model, no LLM call, no backend, despite the package name containing "AI." **Do not
  describe this as an AI project in portfolio copy** — that would be a factually false claim the
  owner could not defend if asked to explain the "AI."

### Decision
Not found — needs the owner. Two commits total, both same day (2026-08-21, "Initial commit" then
"Add SomaiyaSat AI telemetry dashboard") — this is a single build session, not an evolving
project with documented tradeoffs.

### What broke
Not found — needs the owner. Two-commit history gives no bug-fix trail to draw from.

### Status
- Small, complete-as-scoped prototype/demo. Not under active development (single day of commits,
  2026-08-21, most recent GitHub activity in the six repos surveyed).
- Likely course/club deliverable rather than a standalone portfolio piece; if it is used, the
  copy must not claim real AI/ML behavior.

### Links
- GitHub: `github.com/dhruv4740/wp2lab` (VERIFIED public, default branch `master`, notably not
  `main`). No README in the repo (raw fetch returns 404). No deployed URL found or claimed.

---

## Growth automation tools (Blink.new internship) — `autoscroll`, `linkbuilding`, `outreach`

Grouped together because all three were built during Dhruv's growth-engineering internship at
Blink.new (a YC-backed AI app-builder startup) and share a domain (marketing/growth automation
with a human-approval safety rail). **Confidentiality flag, NOT FOR PUBLICATION as-is**: these
touch a specific employer's business data (commission structures, lead databases, internal
metrics). The write-up below deliberately omits commission rates, revenue percentages, and
per-status lead-database breakdowns found in the source docs — describe capabilities, not
business numbers, and have the owner confirm what Blink.new is comfortable seeing on a public
portfolio before using any of this publicly.

### What they are
- **`autoscroll`** (`dhruv4740/internship_automation`, also present under the employer's own
  `blink-new/autoscroll_reddit` org repo as a second git remote): Reddit engagement automation
  driven through AdsPower anti-detect browser profiles — one real, OS-foreground browser at a
  time browses Reddit, navigates, reads/scrolls, types/submits, then rotates profiles. VERIFIED —
  `README.md`, `pyproject.toml`.
- **`linkbuilding`** (`dhruv4740/linkbuilding`): discovers link-building prospects, extracts
  contacts, drafts personalized LLM outreach, and — only after **per-email human approval** —
  sends via Gmail on a rate-limited schedule, then tracks replies and verifies placed links.
  VERIFIED — `README.md`.
- **`outreach`** (`dhruv4740/blink_email_automation`): an affiliate-recruitment cold-email
  pipeline — finds creators, drafts personalized outreach, sends/follows-up from Gmail, tracks
  replies — again gated on human approval before send. VERIFIED — `CLAUDE.md`.

### Stack
- All three: Python, Flask (web dashboards), Google API Python Client + `google-auth-oauthlib`
  for Gmail send/read, `dnspython` for pre-send deliverability (MX-record) checks,
  `python-dotenv`. VERIFIED — `requirements.txt`/`pyproject.toml` for each.
- `autoscroll` additionally: FastAPI + Vue (per README) or possibly a different split — README
  says "FastAPI + Vue web dashboard" while `pyproject.toml` lists `playwright`, `pynput`,
  `psutil`, `fastapi`, `uvicorn` as deps (no Vue-related JS deps visible in the Python manifest,
  which is expected if the frontend is a separate package — not independently confirmed this
  pass). Uses Playwright for browser control and integrates with AdsPower's Local API.
- `linkbuilding` additionally: BeautifulSoup4 (scraping), `tzdata` (explicitly required because
  "Windows ships no system tz database" and the scheduler maps country-TLDs to IANA timezones —
  a real, specific cross-platform gotcha called out in the dependency comments).

### Architecture
- All three follow the same shape: a persistent local database (SQLite, inferred from
  `linkbuilding.db` being referenced directly in docs) tracking prospects/leads through an
  explicit status state machine, a Flask/FastAPI dashboard for human review, and a rate-limited
  send step (linkbuilding: hard cap on emails/day; outreach: described the same way) that never
  fires without a human clicking approve on that specific email.
- `autoscroll`'s architecture is the most operationally sophisticated of the three: a supervisor
  process that distinguishes real crashes from deliberate shutdowns, per-profile "quarantine"
  when a proxy/profile repeatedly fails to launch, geo-IP-change detection tolerant of normal
  residential-proxy rotation, and bot-challenge detection with a manual "Clear Bot-Challenge"
  override that explicitly does not claim the account is actually safe with Reddit — the UI
  copy itself warns the human to verify manually first.

### Decision
- **Human-approval gate before any send, in all three tools** — this is stated as a hard rule in
  `linkbuilding/CLAUDE.md` ("Decision rule inherited from prior sessions, in priority order:
  safety rails (approval gate, 20/day cap, REJECT rule) > status-machine integrity >
  deliverability > email coverage > new features. When in doubt, the smallest change that
  preserves the rails wins.") and echoed in `outreach`'s design ("only after per-email human
  approval," README). This is a genuine, deliberate, safety-motivated architectural decision —
  automate discovery/drafting fully, but keep a human in the loop for anything that leaves the
  system — worth describing honestly as exactly that.
- **`autoscroll`'s IANA-timezone dependency choice** (`tzdata>=2024.1`) is a small but real,
  documented platform-compatibility decision, not a speculative one: the comment explaining it
  states Windows has no system tz database and the scheduler needs one for ccTLD-to-timezone
  mapping.

### What broke
- **`linkbuilding`: follow-up emails never threaded, so reply detection silently failed for
  them.** VERIFIED, `KNOWN_ISSUES.md` read in full, root-caused to file:line
  (`pipeline/send.py:76`, `pipeline/db.py:503` and `:1119`): the initial send captured a Gmail
  `threadId`, but follow-up sends never passed it (no `threadId` in the send body, no
  `In-Reply-To`/`References` headers), so every follow-up started a *new* Gmail thread. Reply
  polling (`replies.check_replies()`) only ever checked the *original* thread ID stored on the
  prospect row — so a reply to a follow-up email landed somewhere the system never looked,
  meaning follow-ups kept sending to people who had already replied. Root cause and a ranked fix
  (pass `threadId` on follow-up sends) are both documented; not confirmed whether the fix has
  shipped.
- **`outreach`: non-YouTube leads were drafted using YouTube-specific prompt language.** VERIFIED,
  fixed per commit reference in `KNOWN_ISSUES.md` — as the pipeline expanded beyond YouTube
  creators to Hacker News/Dev.to/newsletter leads, the drafting code still hardcoded
  "YouTube creator"/"recent videos" phrasing. Fixed by adding a `_SOURCE_FRAMING` map keyed by
  source type, plus a dedicated short-prompt path for leads with no video titles at all (to stop
  looping on REJECT for those). Fixed 2026-07-11.
- **`autoscroll`: a supervisor mis-diagnosed ordinary user-initiated shutdowns as crashes.**
  VERIFIED, `KNOWN_ISSUES.md` read in full with a real cross-referenced Windows Event Log
  investigation (matching `service.log` exit timestamps against Event ID 1074 "initiated by
  user" entries to the second) — the supervisor used a `TickCount`-based timer that couldn't run
  during shutdown, so uptime always computed as "0 seconds," which made every deliberate
  Start-menu shutdown/restart look like a rapid crash loop, which in turn triggered a
  `LockWorkStation` "protective" response. Fixed 2026-07-25. This is an unusually well-documented
  debugging narrative — real root-cause chain, real correction of an earlier wrong diagnosis
  (explicitly noted: *"It was diagnosed that way once... corrected by the owner"*), good
  interview material if the confidentiality concerns above are cleared.

### Status
- All three under active-ish development as of their last commits: `autoscroll` 2026-08-10,
  `linkbuilding` 2026-07-19, `outreach` 2026-08-06 — all mid-2026, all with substantial
  operational documentation (`KNOWN_ISSUES.md`, `LESSONS.md`, `HANDOFF.md` in each repo,
  suggesting real day-to-day operational use, not toy projects).
- **NOT FOR PUBLICATION as-is**: `autoscroll` is multi-profile browser automation with
  bot-challenge detection and proxy quarantine — describing this publicly as "automating
  engagement on Reddit while evading its bot detection" is reputationally risky regardless of
  employer sign-off. Flag for the owner explicitly before any public copy is written about it.

### Links
- GitHub: `github.com/dhruv4740/internship_automation` (autoscroll's personal-account remote;
  a second remote points to the employer org, `blink-new/autoscroll_reddit`, not confirmed public
  or private), `github.com/dhruv4740/linkbuilding`, `github.com/dhruv4740/blink_email_automation`.
  None of these three were checked against the GitHub API for public/private status this pass —
  do that before assuming any are linkable from a public portfolio.
- No deployed URLs — these are locally-run operational tools (`start.bat` + a localhost
  dashboard), not hosted services.

---

## RAS Website (Robotics Automation Society)

Lighter-touch entry — found during the expanded scan, not in the original brief, but real and
current.

### What it is
The official website for the Robotics Automation Society at K.J. Somaiya College of Engineering.
VERIFIED — `README.md`: *"The official website for the Robotics Automation Society (RAS) at K.J.
Somaiya College of Engineering."*

### Stack
Next.js 15, React 19, Tailwind CSS 4, Three.js. VERIFIED — `README.md`.

### Status
Actively maintained — most recent commit `2026-02-28`, message "overhaul: redesign hero, about,
events, team sections; fix tab lag; clean vision refs" (the "clean vision refs" phrase suggests
this site may have replaced or absorbed content from one of the "Vision" site attempts noted in
Part 1 — not confirmed).

### Decision / What broke
Not found — needs the owner. Only the README and one commit message were read; no docs directory
or issue tracker equivalent was found in this folder to mine further, and going deeper wasn't
justified given this wasn't part of the original brief.

### Links
GitHub: `github.com/dhruv4740/raswebsite` (VERIFIED via local git remote). No deployed URL
confirmed this pass.
