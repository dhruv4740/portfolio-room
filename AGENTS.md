# AGENTS.md

Operational guide for any coding agent in this repo. Setup, commands,
invariants, traps. Narrative and rationale live in `docs/`.

**Start with [docs/HANDOFF.md](docs/HANDOFF.md)** — it records the live state
and what is genuinely unverified.

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
notebook, chair, lamp, window — that you orbit. Clicking the monitor travels the
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
npm run dev       # dev server
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
BASE=http://localhost:4173 node scripts/verify-v3.mjs
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
```

Invoke Vite's bin directly for preview — `npm run preview` strips arguments on
this machine. There is **no lint and no test script**; `npm run build` plus the
Playwright harness is the entire quality signal.

The verification scripts default to `http://localhost:4173`; keep the preview
and `BASE` on that same origin so a run cannot silently test another server.

## Invariants

**The desktop scene is authored geometry, not photogrammetry.**
`buildWorkspace.js` exports `WORKSPACE` with world-space `anchors` and `screen`
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
  nothing. Do not convert it into an FPS claim.
- **Dead v1/v2 code**: `src/App.jsx`, `src/Shell.jsx`, `src/routes/`,
  `src/flagship/`, `src/components/`. Unreferenced. Do not repair or import.
  Precedent: a stale `manualChunks` entry was force-emitting a dead 514KB chunk.
  The former lab gallery and its HTML files are removed. The four retained
  sketches are dependency-free OS apps in `public/os/apps/` and are registered
  in `public/os/shell/registry.js`.
- **`SplatStage.jsx`, `splatBounds.js` and `@sparkjsdev/spark` are historical.**
  The Gaussian-splat direction was abandoned — the placeholder was a shoe and
  the user rejected it. Nothing imports them. Do not restore the shoe, do not
  re-source a capture, and treat any capture/normalised-bounds rules in older
  docs as applying only to that dead renderer.
- **Gravity in the embedded OS needs Matter.js** and is unavailable on the
  dependency-free embedded path. Known, not a bug to chase.

## Git

- Never commit to `main`/`master`. Current work is on `feat/v3`.
- Conventional Commits, subject under 72 chars, no trailing period.
- Commit locally per logical unit. **Do not push** — no remote is configured.
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
    buildWorkspace.js   geometry, materials, WORKSPACE anchors + screen dims
    seatedHands.js      first-person hand rig: palm, jointed fingers and thumb,
                        forearm; POSES and HAND_REST drive grips in WorkspaceStage
    DhruvOSScreen.jsx   persistent same-origin iframe bridge to dhruvOS
    cameraRig.js        flyTo (GSAP power3.inOut), idle drift, project()
    musicPlayer.js      the one shared song player (room, headphones, monitor)
    buildRoomInteractions.js  movable desk objects: lamp, coffee, awards, drawer,
                        pen, blinds, headphones, window
  (public/os/apps/*.js  monitor apps: one per project, Skills, Music Player)
    SplatStage.jsx      DEAD — historical splat renderer, unimported
    splatBounds.js      DEAD — supports SplatStage only
  mobile/Deck.jsx       100dvh scroll-snap + gyro
  work/Work.jsx         static recruiter page, no WebGL
  ui/                   Telemetry, AnchorPanel, ScanIntro
docs/                   HANDOFF first, then VISION, DECISIONS, STATE, ROADMAP, DESIGN
scripts/verify-v3.mjs   Playwright harness
scripts/shots-hands.mjs every hand grip as a frame + wrist angles (tuning aid)
scripts/verify-reduced-hands.mjs  reduced-motion: each action lands held at once
```
