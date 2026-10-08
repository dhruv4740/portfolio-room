# Handoff to Opus: phone performance and entry flow

Written 2026-10-08. Paste the prompt below into Opus, started inside the worktree.

## Prompt to paste

You are taking over a three.js first-person portfolio for Dhruv Kothari, who has just finished a Blink.new growth internship and wants a remote internship in AI engineering or growth engineering. Work only in the worktree `C:\Users\hp\pf-truescale` on branch `feat/recruiter-path`. The checkout at `...\random sites\portfolio` is on a stale branch; do not touch it. The shell cwd resets, so start every command with `cd /c/Users/hp/pf-truescale`. Read `AGENTS.md` and `~/.claude/CLAUDE.md` first; their rules apply (never commit to main or master, Conventional Commits, stage only files you changed, no unrequested refactors).

Your job, in order:

1. **Find why the 3D room's arrival intro costs about 25 ms per frame and fix it.** Evidence is in "Open problem" below. The owner reports the intro is laggy on a OnePlus 13R (Snapdragon 8 Gen 3, 120 Hz) and expects 60 or 120 fps. You cannot test on that phone, so use instruments, not guesses, and report each fix with a before/after number.
2. **Make the app usable on a landscape phone.** The desktop-OS windows (`public/os`) and the FocusLock phone demo are cramped at 412 px and 300 px viewport height.
3. Keep everything else working. Run the suites listed under "Verification" before and after.

Hard constraints:
- Production is `https://dhruvkothari.pages.dev` (Cloudflare Pages project `dhruvkothari`, direct upload). The preview alias is `https://preview.dhruvkothari.pages.dev`. Deploy to preview only: `npx wrangler pages deploy dist --project-name dhruvkothari --branch preview --commit-dirty=true`. Never deploy with `--branch main` without a fresh explicit yes from the owner in this session. Never change the domain.
- Build with `npx vite build`, not `npm run build` (that rewrites vendor files).
- Do not commit: `public/os/vendor/*` or `public/os/shell/content.js` line-ending diffs, `src/v3/desktop/seatedHands.js`, anything under `tmp-measure/`.
- Windows traps: `Scan.jsx`, `Deck.jsx`, `Work.jsx`, `index.html` and `perfGovernor.js` have CRLF endings. A multi-line Python string replace silently fails unless you use the file's own newline; edit with `encoding='utf-8', newline=''` and write to a temp file then `os.replace`. Bash heredocs with tricky quoting have failed; use script files. Run `git diff --stat` before every commit.
- Owner preferences: conclusion first; say what is known versus guessed; no flattery; the word "recruiter" must not appear in visible copy; keep the site simple (the plain `/work` page is the default quick path). If you are unsure about a mechanism you cannot verify, give the owner an exact question to paste into a deep-research tool instead of guessing.
- Use Haiku subagents for read-only or mechanical work (running scripts, screenshots). Give them the exact environment each script's header requires (see below); a past brief that omitted `GPU=1` produced false failures.

## Current state

Production already has: the two-choice front door (Quick view → `/work`, 3D room walkthrough), real load progress with ETA, the in-page résumé reader and Download PDF on `/work`, touch devices skipping the door, no status line on `/work`, short-landscape launchpad fit.

Preview only (not yet in production, owner has not approved):
- `perf(deck)`: gyro tilt via CSS variables `--gyro-x/--gyro-y` instead of React state (`src/v3/mobile/useGyro.js`, `Deck.jsx`). Idle script cost 138 → 21 ms/s at 4× CPU throttle.
- `perf(room)`: `src/v3/desktop/perfGovernor.js` render cap raised from 30 Hz to 60 Hz (`FRAME_BUDGET_MS`), plus a `loweredOnce` latch so resolution is never raised after being lowered (it was pumping 3 times in 20 s, each reallocating the drawing buffer). Thresholds `DOWNSHIFT_MS = 27` and `UPSHIFT_MS = 14` are the original values and were deliberately left alone: cutting resolution did not reduce cost, so tighter thresholds only blurred the image.
- `public/os/styles.css`: `.iframe-banner` text hidden when height ≤ 520 px.

## Open problem: the intro frame cost

Measured on this PC (integrated AMD GPU, headless Chromium with `--use-angle=d3d11`), Pixel 7 profile, 915×412, touch, surface override `scan`:
- The governor's median frame cost is about 25 ms for the roughly 7 to 8 seconds of the arrival intro, then 4.5 ms afterwards. `medianMs` comes from `window.__perfGovernor.getStats()`; it is `max(cpuMs, lastGpu)` from `WorkspaceStage.jsx` `tick` (about line 293 to 298), with `lastGpu` from an `EXT_disjoint_timer_query_webgl2` poll (about line 106 to 115).
- Ruled out: scene size (about 80 to 108 draw calls and 80k to 103k triangles at all times; read with `localStorage['v3:test']='1'` then `window.__v3test.renderer.info`), canvas resolution (cost 25.5 → 24.6 ms as pixel ratio dropped 1.25 → 0.8), shadows (the forced low tier, `localStorage['v3:perf-tier']='low'`, gives about 24 ms), DOM overlays (hiding everything but the canvas gives the same cost), the OS iframe (no iframe exists during the intro), and extra render passes (WebGL `clear` count is one per frame).
- CPU profile over 6 s after reveal at 1× shows the main thread 76% idle, so the cost is not main-thread JS. The top self-time item was `WebGLRenderer.setSize` (61 ms, caused by the governor's pixel-ratio changes).
- Unexplained. Candidates not yet tested: `deskContactShadows.js` capture passes (only dirty-triggered; hands and bones may be dirty during the intro), `afterHours.js` cube probes (`CubeCamera`, `PMREMGenerator`), the arrival director's per-frame work, texture uploads (`CanvasTexture` `needsUpdate` in `buildCinematicWorkspace.js`), and the timer query itself reporting stalls. A GPU capture or per-pass timer queries are the likely way to settle it.
- With the 60 Hz cap, this machine averaged 32 to 39 Hz in the intro (it was exactly 30 Hz before). Page rAF dropped to about 31 fps in some runs, which suggests GPU-bound. Real phone GPUs will differ. A deeper, device-independent fix (fewer passes during the intro, or lower intro cost) is preferable to cap tuning.
- The shader warm-up reveal takes about 13 to 16 s cold here, about 22 s at 4× CPU throttle (the 20 s cap fires, so the room can reveal with uncompiled programs; no mitigation built).

## Other known issues and deferrals

- Landscape phone: FocusLock and Projects OS windows leave about 100 px of content at 412 px height (the shell chrome was built for ≥600 px). Proposal: on touch screens, route desktop-OS apps to the phone app or `/work` instead of OS windows. Not built. The FocusLock phone demo (`/phone/focuslock`) is also cramped at 412 px height.
- The GitHub activity API (`api.github.com/users/dhruv4740/events/public`) returns 403 when rate-limited, which fails console-error checks in `verify-v3`, `verify-after-hours` and others. Not a regression. Check that the UI handles a 403 quietly for real visitors.
- Stale tests, not caused by recent work: `verify-mobile.mjs` (asserts a banner that no longer exists, and starts its own dev server), `verify-deeplinks` check "Ctrl+K works on /work" (`/work` is a static page outside the app).
- `verify-after-hours-audio`: 2 of 35 failures are pre-existing.
- Deferred and unowned: global `--dim` token change, launchpad absolute-positioning refactor, `user-select`, keyboard-hint restoration, dead CSS (`.launchpad-more`, `.fd-note`), hand assets, the deck room button's full reload, `whenSeated` rAF loop deadline, `Scan.jsx:304` `about` focus-target regression, demo overlay dialog semantics, model compression, seated touch look-around (unverified), the Blackout claim, Cellbook year, EFarm/Eco Water text, résumé C++ mismatch, 29.85 vs 29.82, stale `/os/index.html` intro, WhatsApp `og.jpg` size.
- The deck has no guided-tour option (the tour has no deep link).
- Domain-dependent URLs (`public/sitemap.xml`, `public/robots.txt`, `.env.production` `VITE_SITE_URL`) wait on the owner's domain decision.
- Owner questions still open: promote the phone fixes to production; merge `feat/recruiter-path` into git `main` and/or push to GitHub; confirm the "Fact or Cap" name for the CrisisWatch card; delete the empty Pages project `dk-dev` (ask first).

## Architecture notes

- Vite multi-page: `index.html`, `work/index.html`, `resume/index.html`, `appType: 'mpa'`. `/work` must not load 3D in its initial load (an idle prefetch via `src/v3/work/prefetchRoom.js` is deliberate).
- `resolveSurface()` in `src/v3/lib/capability.js`: the `v3:surface-override` key first; otherwise `static` (no WebGL2, software GPU or saveData → redirect to `/work`), `deck` (coarse pointer), `scan` (desktop 3D room).
- Perf tier (`perfGovernor.js` `detectTier()`): low for software renderer, coarse pointer, saveData or deviceMemory ≤4; integrated GPU is mid; discrete is high. A touch phone is therefore tier low (pixel ratio start 0.85, shadows off). Override with `v3:perf-tier`.
- Front door: plain HTML in `index.html`; `src/v3/lib/frontDoor.js` drives progress and dismissal; `loadProgress.js` weights the tasks. A head script adds `no-door` for coarse pointers.
- Shader warm-up gate: `WorkspaceStage.jsx` around line 1340 hides the canvas, runs `compileAsync` and a per-material hidden render, races a 20 s cap, fades the room in, then dispatches `workspace:revealed`.

## Verification

Each script needs its own server on `http://localhost:4173` serving `dist` (`npx vite preview --port 4173`) unless noted.
- `node scripts/verify-v3.mjs` (45 checks; includes Pixel 7 deck checks).
- `BASE=http://localhost:4173 node scripts/verify-recruiter.mjs` (22).
- `node scripts/verify-tour.mjs`, `node scripts/verify-studio.mjs` (23).
- `GPU=1 node scripts/verify-after-hours.mjs` (26) and `GPU=1 node scripts/verify-deeplinks.mjs`. Without `GPU=1`, headless counts as a software GPU and redirects to `/work`, which produces false failures.
- Instruments used this session live in the untracked `tmp-measure/` (`phone-intro.mjs`, `render-rate.mjs`, `pr-trace.mjs`, `gov.mjs`, `info.mjs`, `intro-prof.mjs`, `deck-cpu.mjs`, `phone-apps.mjs`). They are not committed; recreate what you need. The pattern: `chromium.launch({channel:'chromium', args:['--use-angle=d3d11','--ignore-gpu-blocklist']})`, `devices['Pixel 7']` with a 915×412 viewport, `isMobile`, `hasTouch`, `localStorage['v3:surface-override']='scan'`, CDP `Emulation.setCPUThrottlingRate`.
- Headless Chromium cannot render PDFs; the résumé reader was verified in the built-in browser pane instead.
- All measurements so far are one machine, headless, single runs, rough. State that caveat in any report.
