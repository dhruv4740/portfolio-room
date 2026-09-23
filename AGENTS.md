# AGENTS.md

Operational guide for any coding agent in this repo. Setup, commands,
invariants, traps. Narrative and rationale live in `docs/`.

**Start with [docs/HANDOFF.md](docs/HANDOFF.md)**: status, branches, open
problems and owner decisions. It is the only status document; don't add
another one. Update it at the end of a session.

**Who works here.** One agent (Claude) owns the whole repo: code, 3D, tests,
docs. There are no file reservations and no GPU-slot protocol. Subagents are
allowed for exploration (Sonnet or Haiku). An optional offline Gemini lane
exists for menial, well-specified work: write a self-contained prompt (template
`docs/archive/PROMPT-GEMINI-WORKHORSE.md`), the owner
forwards it, and nothing blocks on it. Old team, ownership and prompt documents
are in `docs/archive/` and are historical only.

**Direction.** GTA V/RDR2-feeling physical realism for one room is the
owner-approved target, not an achieved claim. The room is set in Mumbai: the sky
follows IST and the weather is live (never snow).

## What this is

A personal portfolio (Dhruv Kothari). Its first job is to impress other
builders; its second is to get an internship screener to the facts fast. One
content source drives three surfaces chosen at runtime by device capability:

| Surface  | Route   | Who gets it                                       | Source            |
|----------|---------|---------------------------------------------------|-------------------|
| `scan`   | `/`     | desktop + real GPU                                | `src/v3/desktop/` |
| `deck`   | `/`     | touch devices                                     | `src/v3/mobile/`  |
| `static` | `/work` | software GPU, saveData, or anyone who clicks WORK | `src/v3/work/`    |

The desktop surface is an **authored three.js room** — desk, monitor, keyboard,
notebook, chair, lamp, window — with an interior launchpad and seated exploration. Clicking the monitor travels the
camera into the screen and hands off to **dhruvOS**, a real OS-like environment
the user built, which keeps its state across visits.

`src/v3/` is the live app. Everything outside it is dead — see Traps.

Stack: Vite 8 (rolldown), React 19, react-router-dom v7 (HashRouter), GSAP,
three.js, Playwright for verification.

## Setup

```bash
npm install
npm run dev
```

That's it. No asset download step. **If you find instructions anywhere telling
you to `curl` a `.splat` file, they are stale — ignore them.**

## Commands

```bash
npm run build     # production build
npm run dev       # dev server (port 4173 via .claude/launch.json)
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
GPU=1 BASE=http://localhost:4173 node scripts/verify-v3.mjs
GPU=1 BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
GPU=1 BASE=http://localhost:4173 node scripts/verify-deeplinks.mjs
GPU=1 BASE=http://localhost:4173 node scripts/verify-tour.mjs
GPU=1 node scripts/report-frames.mjs <prefix>   # landing, seated, hands, window frames
BASE=http://localhost:4175 sh scripts/run-suites.sh   # the ten GPU regression suites, one line each
node scripts/build-apps.mjs darksentinel   # rebuild a real project UI into public/apps/
```

Invoke Vite's bin directly for preview — `npm run preview` strips arguments on
this machine. There is **no lint and no test script**; `npm run build` plus the
Playwright harness is the entire quality signal.

The verification scripts default to `http://localhost:4173`; keep the preview
and `BASE` on that same origin so a run cannot silently test another server.
**Run Playwright suites with `GPU=1`** (real AMD iGPU through ANGLE D3D11).
Without it, software rendering starves input and clicks hang. Never trust a
SwiftShader frame for a visual claim. The dev server has run every suite so far;
also check a production build (`npm run build`, then preview) before claiming a
release works, because the two use different JSX transform paths.

## Invariants

**The desktop scene is authored geometry, not photogrammetry.**
`cinematicLayout.js` exports `WORKSPACE` (built by `buildCinematicWorkspace.js`;
the old-room `buildWorkspace.js` still supplies textures and sky configs) with world-space `anchors` and `screen`
dimensions. Content anchors in `src/v3/content/index.js` stay normalised and map
onto it. Do not write raw world coordinates into the content file.

**`WORKSPACE.screen` is load-bearing.** The camera-travel target and the
monitor's clickable plane both derive from it. Changing the monitor's geometry
means changing `screen` in the same edit.

**Shadows are static on purpose.** `shadowMap.autoUpdate = false` with a
one-time `needsUpdate`. Furniture and lights don't move, so camera motion must
not re-render the shadow map. Preserve this when adding lights.

**Vanilla three.js, not react-three-fiber.** `WorkspaceStage.jsx` owns its own
renderer and loop. Don't "modernise" it.

**One accent, no gradients.** `--signal: #FF5F1F`, used for exactly one thing
per view. `src/v3/tokens.css` has no `--gradient-*` token, deliberately. The
*room* is warm and naturalistic — that contrast against the `--void` background
is intended. Don't recolour the room to match the UI chrome.

**dhruvOS state persists.** `DhruvOSScreen.jsx` holds a same-origin iframe
bridge that survives exit and re-entry. Don't remount it on phase change.

**Real project UIs are built from their repos, not redrawn.** `apps/<name>/` is
a copy of the project's source with a mock layer replacing its backend (each
has a `PORTFOLIO.md` listing every changed file); `node scripts/build-apps.mjs`
writes the static output to `public/apps/<name>/`, which is committed so the
portfolio build never needs the app's toolchain. A window is
`iframeApp({...})` from `public/os/shell/iframeApp.js`. Recipe and readability
floor: `docs/archive/PROMPT-R8-GEMINI.md`. Never edit the source repos.

**Android browser demos may be faithful reconstructions** (owner-approved).
Keep them close to the original UI and label them honestly. The phone's
readable stage uses a 390px CSS width, while its projected surface remains
540×1200. The 3D loop pauses while the stage is open. See
`docs/archive/CINEMATIC-STUDIO.md` for presentation and manual app-refresh details.

**Hand meshes are generated assets.** After changing topology or the neutral
bind pose, run `node scripts/build-hand-assets.mjs` and commit both local
`public/models/hands-v1.bin*` files. Browser startup normally loads the binary,
not the procedural fallback.

**Keep `/work` lightweight.** It must never pull three.js or the 3D scene.
`verify-v3.mjs` asserts this.

## Traps

- **Headless Chromium reports a SwiftShader software GPU**, so
  `resolveSurface()` correctly routes it to `/work`. To test the 3D scene you
  must set `localStorage['v3:surface-override'] = 'scan'` via `addInitScript`
  *before* page load. If a surface test "fails," check the pin before touching
  `src/v3/lib/capability.js` — the fallback is intended and is asserted as its
  own case.
- **Clicking a projected `.anchor-marker` button is not the same as clicking the
  monitor mesh.** Both paths must work. Tests that only exercise the button
  prove less than they appear to.
- **rAF cadence is not GPU frame time.** The telemetry readout measures
  submission interval. Under software rendering it will look terrible and mean
  nothing. Do not convert it into an FPS claim. **Real-GPU headless runs are
  possible on this machine**: `chromium.launch({ channel: 'chromium', args:
  ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })` reports the AMD iGPU and
  exposes the GL timer query; `scripts/measure-gpu.mjs` and `GPU=1 node
  scripts/shots-hands.mjs` use it. The HUD's GPU MS row is the number to trust.
- **Headless Chromium does not reliably paint a nested iframe** (a real project
  UI inside a dhruvOS window). Assert on frame text, not visibility, and take
  visual proof on the GPU path or in a real browser.
- **Static exports hydrate late in headless.** The HTML is there before React
  is; a click before hydration does nothing. `verify-real-apps.mjs` waits for it.
- **Dead v1/v2 code**: `src/game`, `src/hooks`, `src/store`, `src/data`,
  `src/lib`, `src/lab`, `src/content`, `src/shaders`, `src/index.css`,
  `src/flagship`, `src/components`. Unreferenced (deletion approved, pending).
  Do not repair or import. Their npm dependencies are already removed.
  Precedent: a stale `manualChunks` entry was force-emitting a dead 514KB chunk.
  The former lab gallery and its HTML files are removed. The four retained
  sketches are dependency-free OS apps in `public/os/apps/` and are registered
  in `public/os/shell/registry.js`.
- **The Gaussian-splat direction is gone** (the placeholder was a shoe and the
  owner rejected it). Do not restore it; capture/splat rules in archived docs
  do not apply.
- **The seated figure's head is invisible but real geometry.** Raycasts must
  skip `model.figure.root` or every click from the seat hits the hair.
- **Gravity in the embedded OS needs Matter.js** and is unavailable on the
  dependency-free embedded path. Known, not a bug to chase.

## Git

- Never commit to `main`/`master`, never merge to main. Current work is on
  `feat/v3`; big bets get their own branch.
- Conventional Commits, subject under 72 chars, no trailing period.
- Commit per logical unit and push. Remote `origin` is the private
  `dhruv4740/portfolio-room` (not the unrelated `dhruv4740/portfolio`).
- No attribution or co-author lines.

## Working style the user expects

- Conclusion first. No filler, no flattery, no restating the request.
- Smallest change that achieves the goal. No speculative abstractions.
- **Do not overstate verification.** The user has called this out before. Say
  what passed, what failed, and what you did not test. A partial run is not a
  passing suite.
- State what is measured vs. inferred. "I don't know" is a complete answer.
- Anything skipped or stubbed gets a named line in the final report.
- The user dislikes long waits, redundant checks and heavy delegation. One clean
  verification run, fix, one confirming run — not a probe loop.
- Never fabricate project links, metrics or evidence. Those come from the user.
- **Green suites don't prove an interaction feels right.** The suites check
  state. Any change to a hand grip, camera move, timing or held object needs a
  frame sequence or recording reviewed by eye before it's called done.
- The owner is present. Work in small reviewed steps, not long autonomous runs.

## Map

```
src/v3/
  App.jsx               HashRouter; / resolves by capability, /work always available
  tokens.css            design system — every other file pulls from here
  content/index.js      single source of truth for all three surfaces
  lib/capability.js     resolveSurface(), override + intro-seen localStorage keys
  desktop/
    Scan.jsx            composes stage + chrome; owns phase machine
                        (room / preparing / entering / inside / leaving)
    WorkspaceStage.jsx  renderer, orbit, raycast, projected markers, camera travel
    cinematicLayout.js  true-scale room: every dimension, WORKSPACE anchors + screen
    buildCinematicWorkspace.js  builds the room from cinematicLayout.js
    afterHours.js       materials, baked lighting, rain, steam, dust, probes
    sceneDirector.js    the cold open (arrival shot)
    seatedHands.js      first-person hand rig: palm, jointed fingers and thumb,
                        forearm; POSES and HAND_REST drive grips in WorkspaceStage
    DhruvOSScreen.jsx   persistent same-origin iframe bridge to dhruvOS
    cameraRig.js        flyTo (GSAP power3.inOut), idle drift, project()
    musicPlayer.js      the one shared song player (room, headphones, monitor)
    cinematicRoomInteractions.js  movable desk objects: lamp, coffee, awards,
                        drawer, pen, blinds, headphones, window
    (buildWorkspace.js, buildRoomInteractions.js: the old room; only its
                        textures and sky configs are still imported)
  (public/os/apps/*.js  monitor apps: one per project, Skills, Music Player;
                        darksentinel.js is an iframeApp() entry for the real UI)
  (public/os/shell/iframeApp.js  window wrapper for a built project UI)
apps/<name>/            copied project source + mock layer + PORTFOLIO.md
public/apps/<name>/     its static build (committed; scripts/build-apps.mjs)
  mobile/Deck.jsx       100dvh scroll-snap + gyro
  work/Work.jsx         static recruiter page, no WebGL
  ui/                   Telemetry, AnchorPanel, ScanIntro, CommandPalette (Ctrl/Cmd+K)
  lib/loadProgress.js   real load progress (boot bar, room-detail bar)
  lib/mumbai.js         IST sky + Open-Meteo weather (?sky=, ?weather= overrides)
  lib/githubActivity.js public GitHub events on the monitor idle screen
docs/                   HANDOFF (status), DESIGN, ASSET-REGISTER, PROJECT-MATERIAL
docs/archive/           superseded prompts, team docs and handoffs (historical)
scripts/verify-v3.mjs   Playwright harness
scripts/shots-hands.mjs every hand grip as a frame + wrist angles (GPU=1 for the real GPU)
scripts/verify-reduced-hands.mjs  reduced-motion: each action lands held at once
scripts/verify-real-apps.mjs  each real project UI opens, renders and navigates in its window
scripts/measure-gpu.mjs real-GPU frame cost per tier, standing/seated, hands on/off, DPR sweep
scripts/shots-void.mjs  standing-view frames for the void decision (?void=studio|block)
scripts/probe-phone-scale.mjs  rendered size of the held phone's 540-px surface
scripts/build-apps.mjs  builds apps/<name>/ into public/apps/<name>/
```
