# Round 3 — Gemini: OS fixes, remove the OS name, skyline wallpaper, real FocusLock app

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt and will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. Where this
prompt makes a decision, follow it. If a step is impossible as written, skip
only that step, finish the rest, and explain it under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Parallel work — read first

The other agent (Sonnet) is fixing the 3D room at the same time.

| Owner | Paths you may create, edit, delete or stage |
|---|---|
| **You** | `public/os/**`, `src/v3/content/index.js`, `src/v3/desktop/PhoneScreen.jsx`, `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs` (new), `docs/review/gemini-round3.md` |
| Sonnet | every other file under `src/v3/desktop/**`, `scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs` |

- Never edit, stage, revert or delete outside your row. Needed changes elsewhere
  go under "Requests for the orchestrator" with exact text.
- Stage by explicit path. Never `git add -A`, `git add .`, `git commit -a`,
  `git stash`, `git reset`, `git checkout -- <path>`, or `git commit --amend`.
  (Round 2 you amended; do not.) One commit per job, in the order below.
- Git lock: if `.git/index.lock` exists, wait 10 s and retry, up to 6 times.
  Never delete it.
- Build and serve: `npm run build` (it now vendors libs and regenerates
  `public/os/shell/content.js`), preview at `http://localhost:4173`. A preview
  may already be running on 4173; `vite preview` serves from disk, so rebuild
  and rerun — do not kill it. Never use port 4174 or `dist-sonnet/`.
- Do not create debug files anywhere (`_dbg.mjs` etc.).

## Job 1 — remove the rAF test hack (commit: `fix(os): stop sketch apps without pausing the shared gsap ticker`)

In `public/os/apps/kinetic.js` and `public/os/apps/tear.js` you added, on hide
and cleanup, `gsap.ticker.sleep()` and `window.gsap = undefined` with a 50 ms
`setTimeout` restore, and `ScrollTrigger.disable()`. These are global: they can
freeze every other GSAP animation on the page. Delete all of them:

1. Remove every `window.gsap = undefined` / `setTimeout(() => { window.gsap = g; }, 50)`.
2. Remove every `gsap.ticker.sleep()`.
3. Remove `ScrollTrigger.disable(...)`. Keep killing **only this app's own**
   ScrollTriggers (create them with a unique `id` prefix like `kinetic-` and on
   cleanup kill those whose `vars.id` starts with the prefix — never
   `ScrollTrigger.getAll()` unfiltered) and pausing/killing only this app's own
   tweens in `gsapTweens`.
4. Fix the test instead: in `scripts/verify-os-apps.mjs` `stopDelta`, the
   "before" count is taken immediately after the close/minimize click, so the
   window close animation's frames are counted. Change both call sites so the
   sequence is: click → `waitForTimeout(400)` → read `before` → `waitForTimeout(500)`
   → read `after` → assert equal.
5. Add a test in the same file: open Flux, then open Kinetic, close Kinetic,
   wait 400 ms, and assert Flux's rAF is still running (callbacks increase over
   250 ms while Flux is visible). Print `PASS other sketches keep animating after Kinetic closes`.

## Job 2 — Kinetic project 02 is blank (commit: `fix(os): render every Kinetic project entry`)

In `scripts/shots/port-kinetic.png`, the entry numbered 02 shows the number but
no title, description or tags. Find why (likely the reveal animation's start
state never gets triggered inside the window's scroll container, or the content
mapping is missing a field). Fix the cause. Acceptance: extend the Kinetic
section of `verify-os-apps.mjs` to scroll the `.app-kinetic` container through
its full height in 6 steps (250 ms apart) and then assert every project entry's
title element has computed `opacity >= 0.99` and non-empty text. Save
`scripts/shots/port-kinetic-02.png` with entry 02 in view.

## Job 3 — the OS has no name (commit: `feat(os): drop the dhruvOS name from everything visitors see`)

The owner decided the OS is not named anywhere a visitor can see. Replace these
strings exactly. Internal identifiers stay unchanged (the `source: 'dhruvOS'`
postMessage field, the `dhruvos.v1` storage key, file names, code comments) —
changing them would break the bridge or wipe saved state.

| File | Current | New |
|---|---|---|
| `public/os/index.html` `<title>` | `dhruvOS — Dhruv Kothari` | `Dhruv Kothari` |
| `public/os/index.html` menubar | `◆ dhruvOS` | `◆` |
| `public/os/embed.html` `<title>` | `dhruvOS — embedded` | `Dhruv Kothari` |
| `public/os/embed.html` menubar | `◆ dhruvOS` | `◆` |
| `public/os/main.js` boot line | `dhruvOS v2.0 — BIOS POST` | `BIOS POST` |
| `public/os/main.js` boot line | `Starting dhruvOS desktop environment...` | `Starting desktop environment...` |
| `public/os/apps/terminal.js` prompt (both places) | `dhruv@dhruvOS` | `dhruv@desk` |
| `public/os/apps/terminal.js` banner | `dhruvOS terminal v2.0 — type 'help' for commands` | `terminal — type 'help' for commands` |
| `src/v3/content/index.js` skill `three` note | `Three.js sketches inside dhruvOS: Flux, Kinetic, Reality Tear` | `Three.js sketches on the desk computer: Flux, Kinetic, Reality Tear` |
| `src/v3/content/index.js` monitor anchor `readout` | `FOUR SKETCHES · READY` | `READY` |
| `src/v3/content/index.js` monitor anchor `body` | `Four interactive sketches are available inside dhruvOS.` | `Apps, sketches and projects, running live on the desk computer.` |

Then run `npm run build` and grep: `rg -i "dhruv ?os" public/os src/v3/content dist --glob "!**/*.md" --glob "!**/OFL.txt"`.
Every remaining hit must be one of the internal identifiers above or a code
comment. Paste the grep output in the report with a one-word reason per line.

## Job 4 — two new wallpapers (commit: `feat(os): skyline and plain wallpapers`)

In `public/os/apps/wallpaper.js`, add two choices after the existing four
palette swatches, same 28×28 button style, titles `SKY` and `PLN`:

1. **SKY — skyline that follows the room's sky.**
   - Sky state source: if `window.parent !== window`, read
     `window.parent.document.querySelector('.workspace-stage')?.dataset.skyState`
     (`'day' | 'dusk' | 'night'`; same origin, wrap in try/catch). If that is
     missing, fall back to the local hour: 7–16 day, 5–6 and 17–18 dusk, else night.
   - Watch for changes with a `MutationObserver` on that element's
     `data-sky-state` attribute; disconnect it in cleanup and when another
     wallpaper is set.
   - Draw once per state change onto an offscreen canvas at the `#desktop`
     size × `min(devicePixelRatio, 1.5)`: vertical sky gradient
     (day `#9cc3e6`→`#dfeaf2`, dusk `#2b2f55`→`#e0875a`, night `#070b16`→`#1a2238`),
     then a seeded (fixed seed `1306`) skyline of 28 rectangles covering the
     bottom 38% of the height, building colour day `#6d7f93`, dusk `#2a2438`,
     night `#0d1119`, with a seeded window grid lit at 10% (day), 35% (dusk),
     55% (night) using `#ffd98a`. No animation, no rAF.
   - Apply with `desktop.style.backgroundImage = url(<canvas.toDataURL('image/png')>)`,
     `backgroundSize: cover`, and the same on `#workspace`.
2. **PLN — plain.** `backgroundColor #0b0d10`, `backgroundImage none`.

Persist the choice with `store.set('wallpaper.palette', 'sky' | 'plain')` like
the palettes, and restore it on OS boot the same way the palettes are restored
(find where the stored palette is applied at boot and extend it). The existing
flow-field preview canvas in the app keeps working for the four palettes; for
SKY and PLN, the preview shows the static result instead of particles and the
rAF loop is stopped.

Acceptance, in `verify-os-apps.mjs`: set SKY → assert `#desktop`
`backgroundImage` starts with `url("data:image/png`; set PLN → assert
`backgroundImage` is `none` and colour is `rgb(11, 13, 16)`; reload
`embed.html` → PLN is still applied. Screenshots `scripts/shots/wallpaper-sky.png`,
`wallpaper-plain.png`. Also load the room at `http://localhost:4173/#/?sky=dusk`,
enter the monitor the way `scripts/verify-v3.mjs` does, set SKY, and save
`scripts/shots/wallpaper-sky-in-room-dusk.png`.

## Job 5 — the real FocusLock app on the phone (commit: `feat(phone): FocusLock app screens from the real Android app`)

The phone currently has a home screen and FocusLock's lock overlay (triggered by
the Instagram icon). The owner says the full FocusLock app — its main screens
and settings — is missing. Build it from the real source. **Do not invent
screens, labels, settings or numbers.**

Source: the public repo `dhruv4740/focuslock`. Read it without cloning:
- file list: `curl -sL "https://api.github.com/repos/dhruv4740/focuslock/git/trees/HEAD?recursive=1"`
- a file: `curl -sL https://raw.githubusercontent.com/dhruv4740/focuslock/HEAD/<path>`

Steps:
1. List every file under `android/app/src/main/res/layout/`,
   `android/app/src/main/res/values/` (colors, strings, themes, dimens), and every
   Activity/Fragment/Compose screen under `android/app/src/main/java/`. Also check
   for a navigation graph or bottom-nav menu under `res/navigation` and `res/menu`.
2. Build the screen inventory: for each user-facing screen, its source file(s),
   its title, and every control (label text, control type, default value).
   Skip only onboarding/permission-grant screens that ask for Android system
   permissions; list them as skipped.
3. In `src/v3/desktop/PhoneScreen.jsx`:
   - Add a **FocusLock** icon on the home screen next to the Instagram icon, as a
     DOM element with class `ps-app-focuslock`. Keep the Instagram icon's
     existing `.ps-app` class and behaviour exactly as they are (Sonnet's test
     clicks `.phone-screen .ps-app`). Use the app's real launcher icon colours
     from `res/mipmap*` / `res/drawable` XML or `colors.xml`; if the icon is a PNG
     only, draw a simple rounded square in its primary colour with the letter F
     and say so in the report.
   - Tapping it opens the FocusLock main screen. Recreate each inventoried screen
     as DOM at the phone's 540×1200 surface, using the real strings, colours,
     spacing (dp → px ×1.5), control types and navigation (bottom nav / back
     button in a top bar / list rows), in the same scoped CSS style the lock
     screen already uses.
   - State is local only: toggles, sliders, pickers and lists change in-memory
     state, persisted to `localStorage['v3:focuslock']`. Nothing blocks real
     apps. Any statistic shown uses the visitor's own counts that already exist
     (Instagram opens) or `0`; never a made-up number.
   - A top-bar back control (or the app's own back control) returns to the
     previous screen; from the main screen it returns home.
   - The existing lock overlay flow is unchanged.
4. New `scripts/verify-focuslock-app.mjs` (Playwright, same page flow as
   `scripts/verify-held-objects.mjs` up to the zoomed phone): tap
   `.ps-app-focuslock`, then visit every screen through the UI only (no direct
   state setting), change one control per screen, reload the page, return to that
   screen and assert the change persisted; screenshot each screen to
   `scripts/shots/phone-fl-<screen-id>.png`; assert no page errors and zero
   external requests from the phone; then return home and click `.ps-app` to
   confirm the lock overlay still appears.

## Verification you must run and paste (last 8 lines each)

```
npm run build
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
BASE=http://localhost:4173 node scripts/verify-focuslock-app.mjs
BASE=http://localhost:4173 node scripts/verify-v3.mjs
```

If `verify-v3` or Sonnet's scripts fail because of Sonnet's in-progress work,
say so; do not edit their files.

## Report — `docs/review/gemini-round3.md`, committed last (`docs: gemini round 3 report`)

```
# Gemini round 3 report
## Commits                 (hash — subject)
## Files changed           (path — purpose)
## Commands run            (command + last 8 lines verbatim)
## Job 1 hack removal      (grep proving no ticker.sleep / window.gsap = / ScrollTrigger.disable remain)
## Job 2 Kinetic cause     (root cause in one paragraph + fix)
## Job 3 rename grep       (grep output + reason per remaining hit)
## Job 4 wallpapers        (screenshot paths)
## Job 5 FocusLock inventory (table: screen id | source files | controls ported | skipped + why)
## Screenshots to review   (every path, one line each, what to look for)
## Deviations
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted.
