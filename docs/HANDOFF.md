# Handoff

The single status document: where the code lives, what is open, what the owner
decided. Commands, invariants and traps are in [AGENTS.md](../AGENTS.md).
Last updated 2026-10-28. Older status text is in
`archive/HANDOFF-2026-09-25.md`, `archive/HANDOFF-OPUS-2026-10-08.md` and
`archive/OVERNIGHT-REPORT-2026-10-08.md` (historical; they hold the detail
behind several open items below).

## Where things are

- **`main` is live.** `main` = `aeffab7` (PRs #1–#4: JSON-LD/SEO, Ask models,
  Ask quota and retrieval, Ask source label) = https://dhruvkothari.pages.dev
  (Cloudflare Pages project `dhruvkothari`, direct upload). Preview alias:
  https://preview.dhruvkothari.pages.dev. Deploy to preview only:
  `npx wrangler pages deploy dist --project-name dhruvkothari --branch preview --commit-dirty=true`.
  Never `--branch main` without a fresh explicit yes from the owner.
- **Working branch: `fix/mobile-ask-polish`** (cut from `main` at `aeffab7`),
  in `C:\Users\hp\pf-release`. Status: "Round 4" at the end. Never commit to
  `main`; remote `origin` is `dhruv4740/portfolio-room`.
- The old stacked branches (`feat/v3`, `feat/true-scale-room`, `feat/relight`,
  `feat/cutscenes`, `feat/recruiter-path`) are merged and deleted. Stray
  commits are kept as tags `archive/feat-v3-overnight-docs` and
  `archive/wip-window-view`.
- The other checkout, `...\random sites\portfolio`, sits on `main`. Don't use it.
- Build with `npx vite build` (not `npm run build`, which rewrites vendor files).
- Never commit `public/os/vendor/*`, line-ending-only diffs of
  `public/os/shell/content.js`, or `tmp-measure/`. `Scan.jsx`, `Deck.jsx`,
  `Work.jsx`, `index.html` and `perfGovernor.js` have CRLF endings: edit with
  newline-preserving tools.
- Every project and where it is surfaced: [PROJECTS-MAP.md](PROJECTS-MAP.md).

## What the site is

Personal portfolio. First job: get a screener to the facts fast (`/work`,
`/resume`, no three.js). Second: let visitors **use the owner's real apps**, on
`/work`, in the room's monitor (dhruvOS) and on the room's phone. Those must
have good UI everywhere. The 3D room (Mumbai, live sky and weather) is the
memorable extra; photoreal realism is not a goal.

## Current focus (2026-10-20): perf/lighten-room

Owner complaint: for a first-time visitor, even on a laptop and worse on
battery saver, the site is slow: first load about 15–20 s (owner's estimate),
look-around lags, typing lags. Round 1 is measurement only
([PERF-AUDIT.md](PERF-AUDIT.md)). **Hard rule: nothing visible is removed or
changed without the owner's explicit permission.** Measure, propose, wait.

## Open problems (one list)

### Performance
1. **First load is slow.** Shader compile on ANGLE D3D11 dominated in the
   2026-09-25 profile (79 programs, ~0.45 s each). The warm-up gate in
   `WorkspaceStage.jsx` hides the canvas, runs `compileAsync`, races a 20 s
   cap, then fades in; at 4× CPU the cap can fire and the room reveals with
   uncompiled programs. Current numbers: PERF-AUDIT.md.
2. **Arrival intro costs ~25 ms/frame** for ~7–8 s, then ~4.5 ms (2026-10-08,
   integrated AMD GPU). Ruled out then: scene size, resolution, shadows, DOM
   overlays, OS iframe, extra passes, main-thread JS. See PERF-AUDIT.md.
3. **First monitor entry** has one ~500 ms GPU-side frame (OS document first
   raster). Option, owner's call: mount the OS iframe in the background.
4. **Window open** is one ~200 ms frame at the click (AudioContext, favicon).
5. A room opened straight into the seat (`/#/room/explore`) draws hands before
   the background warm-up and can hit 150–530 ms frames.
6. The four after-hours GLBs are Draco-compressed (3.16 → 1.34 MB; Round 4).
   Textures are untouched, and no cold-load re-measure was done. Still loaded
   up front: `hands-v1.bin.gz` (1.58 MB, top-level await in `handAssets.js`).
7. Perf governor: `DOWNSHIFT_MS = 27`, `UPSHIFT_MS = 14`, `loweredOnce` latch;
   cutting resolution did not lower cost on the intro.

### Phones and small screens
8. Landscape phone: FocusLock and Projects OS windows leave ~100 px of content
   at 412 px height; the FocusLock phone demo is also cramped. Proposal: route
   desktop-OS apps on touch screens to the phone app or `/work`. Not built.
9. Seated touch look-around in landscape: unverified.
10. The deck has no guided-tour option.

### Interactions (look decisions need the owner, reviewed in motion)
11. Lamp and blinds switch without a hand reach (alternatives: 57 cm lean, move
    the lamp, stand up for the blinds).
12. Not authored: pen writing pose, notebook lift (floats), forearms through
    the desk front edge (16 mm; elbow placement in `seatedHands.js`), phone side
    phase and fanned fingers, awards frame size and fingertips, right wrist 80°
    at drawer put-down. Detail: `archive/HANDOFF-2026-09-25.md`, "Experience sweep".
13. Hands regression (owner's top complaint earlier; see session memory notes):
    restore, then a skin pass.

### Content and product
14. Owner questions: "Fact or Cap" name on the CrisisWatch card; Eco Water facts
    (none on file); Blackout claim, Cellbook year, EFarm text, résumé C++
    mismatch; domain (undecided, staying on pages.dev for now; `public/sitemap.xml`,
    `public/robots.txt`, `.env.production` `VITE_SITE_URL` follow it); delete
    the empty Pages project `dk-dev` (ask first); `/work` visual direction.
15. Dead code: `src/game`, `hooks`, `store`, `data`, `lib`, `lab`, `content`,
    `shaders`, `flagship`, `components`, `index.css` (deletion approved,
    pending). Also dead CSS (`.launchpad-more`, `.fd-note`), dead `aboutOpen`
    panel code in `Scan.jsx`, and the `Scan.jsx:304` `about` focus-target regression.
16. Deferred, unowned: global `--dim` token, launchpad absolute-positioning
    refactor, `user-select`, keyboard-hint restoration, demo overlay dialog
    semantics, deck room button's full reload, `whenSeated` rAF loop deadline,
    stale `/os/index.html` intro, WhatsApp `og.jpg` size.
17. Not built (approved, low priority): monsoon chai cutscene, depth of field,
    bloom (too costly on the iGPU), more sound design, window lean-out,
    `?hands=authored` bake in the true-scale room.

### Tests
18. GitHub's unauthenticated events API returns 403 after 60 requests/hour per
    IP; this fails console-error checks in `verify-v3`, `verify-after-hours`
    and others. Not a visitor bug; confirm the UI handles a 403 quietly.
19. Stale: `verify-mobile.mjs`, the `verify-deeplinks` "Ctrl+K on /work" check,
    `verify-focuslock-app` (times out at friction `breathing`→`delay`),
    `verify-after-hours-audio` 2 of 35 (pre-existing). `verify-held-objects` and
    `verify-reduced-hands` exit 0 but count 0 PASS lines in `run-suites.sh`.
    `verify-deeplinks` has no `/room/<object>` case.
20. Suites check state, not feel. Any hand, camera or timing change needs frames
    reviewed by eye, including wrist angle.

## Owner decisions on record

- Each project runs as its real UI built from its own repo with simulated data;
  phone apps on the phone, web apps on the monitor.
- Room: bare walls, awards on the desk; the notebook is a blank page to draw on.
- Project order: ranked by depth; FocusLock, Expense Tracker, Basket Price lead.
- Copy: Basket Price framed neutrally; CrisisWatch framed around its
  fixed-model constraint. Reddit Growth Copilot must not be shown. The word
  "recruiter" must not appear in visible copy. Never fabricate links or metrics.
- Scoped out: AI chat (paid key), multiplayer presence. Gaussian splats: gone.
- Parked: per-project case-study page.

## Tools

`scripts/measure-gpu.mjs` (GPU ms per tier), `profile-interaction.mjs`,
`record-motion.mjs`, `probe-*.mjs`, and the `__v3test` hooks
(`localStorage['v3:test']='1'`). Run Playwright suites with `GPU=1`.

## Reference docs

[DESIGN.md](DESIGN.md), [ASSET-REGISTER.md](ASSET-REGISTER.md),
[PROJECT-MATERIAL.md](PROJECT-MATERIAL.md), [PROJECTS-MAP.md](PROJECTS-MAP.md),
[PERF-AUDIT.md](PERF-AUDIT.md), `archive/` (historical only).

## Round 3 status (perf/lighten-room)

Done: real-time shadows off (97a4aea), GitHub API mocked in suites (366c06d), booted-OS pre-raster cuts the first-key gap ~480 to ~210 ms (32549af), FocusLock Windows demo scales to narrow /work panels (a8323b7), demo sweep harness `scripts/review-demos.mjs`.
Corrections: `aboutOpen` is live (the `/about` deep link, not dead); the 25 ms arrival-intro interruption did not reproduce; backtick and space keys verified.
Demo sweep (4 viewports, 3 surfaces): no overflow or errors; at 915x412 touch, `/os/*` deep links show the landing deck instead of a window, and the /work demo panel is a ~270 px strip (functional, cramped).
Still open: landscape-phone routing of OS apps, seated touch look-around in landscape, first monitor-entry hitch measurement, Fact-or-Cap naming (owner decision), empty dk-dev Pages project (not deleted), hand/pose authoring items (need frame sheets), phone-basketproof 915x412 shot missing.

Round 3 continued: /work demo panel header readable (6600d03); dhruvOS windows fill the height on landscape phones (`public/os/styles.css`, `DhruvOSScreen.jsx`); seated touch look-around verified by `scripts/verify-touch-look.mjs` (drag turns the head at 915x412 and 412x915); the earlier "503" is the open-meteo weather call (now mocked in `scripts/_gh-mock.mjs`). First monitor entry hitches (~500 ms gaps, wallpaper `toBlob` 377 ms + one program link 300 ms) only when entering within ~8 s of reveal on a cold browser; clean after 20 s and on warm runs. Open: touch deep-link routing (proposal sheet), portrait OS FocusLock window clips on 412 px, hand/pose items (sheet `scripts/shots/hands/sheet-hand-items.png`).

## Round 4 status (fix/mobile-ask-polish, 2026-10-28)

Done (preview only, not on `main`):
- Mobile fixes on `/work` and the room: section ids and headings, demo panel,
  `?room=phone` opens the room on a phone instead of redirecting to `/work`
  (option C; owner-approved). A cold load of `/work/#<id>` now scrolls to the section.
- Ask: rewritten `public/os/shell/ask.js` / `ask-pill.js`. No fake typing,
  lists and bold render, source links open the `/work` section, "Live AI
  answer" vs "Saved answer" label (not the model name), New chat, Retry on
  error (a 500 with an empty body shows the error, not "undefined"), and the close
  animation runs to the end.
- Job title is "Full-stack & AI developer" everywhere (`src/v3/content/index.js`,
  the three HTML heads, Person JSON-LD with `sameAs` GitHub/LinkedIn/Blink and
  `alumniOf`, a ProfilePage node on `/work`). dhruvOS content was regenerated with
  `node scripts/gen-os-content.mjs` (the build doesn't run it).
- Basic SEO: `Disallow: /api/` in robots.txt, sitemap `lastmod`, `/favicon.ico`.
- Load: `/work` self-hosts IBM Plex (latin woff2 in `public/fonts/`, about 75 KB
  total, no Google request). The after-hours GLBs are Draco: re-run
  `npx gltf-transform draco in.glb out.glb` on any re-export. The decoder lives in
  `public/draco/`, copied from `node_modules/three/examples/jsm/libs/draco/gltf/`.
  Re-copy it when three is upgraded. Loaders go through `src/v3/desktop/modelLoader.js`.
  Meshopt was rejected because its quantization breaks the keyboard's shared keycap
  geometry and the lamp merge.

Open:
- **Option A (to do):** a real phone-first room, not the desktop room on a small
  screen.
- **Reddit simulated app:** owner decision pending. A simulation of the real copilot
  would show what `internship/context.md` rule 2 forbids, and anything else would
  be invented.
- Held SEO (domain undecided): Search Console, swapping `/` and `/work`,
  prerendering `/work`, an HTML résumé page, llms.txt.
- Open offers: Ask conversation memory, Turnstile on `/api/ask`.
- Ask open under 4× CPU throttle has long frames, GPU/compositor side; none
  unthrottled. Check on a real phone.
- `og.jpg` still reads "Full-stack developer" (its alt text was left matching).
- `/`, `/resume` and `/os` still load Google Fonts; only `/work` is self-hosted.
- Hands lazy-load deferred: it touches the hands code under the regression
  review (item 13) and needs a motion review.
- The Deck is a 2D duplicate of `/work`.
