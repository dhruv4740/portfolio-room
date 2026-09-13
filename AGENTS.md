# AGENTS.md

> CURRENT HANDOFF (2026-09-13): Read [docs/HANDOFF.md](docs/HANDOFF.md) first.
> The user replaced the shoe-scan direction with an authored modeled workspace.
> Live desktop: `WorkspaceStage.jsx` + `buildWorkspace.js`, not `SplatStage.jsx`.
> The room changes are uncommitted; HEAD `1912627` is the older prototype.
> Capture setup and normalized-capture rules below are historical for the
> unused splat renderer. Do not download/restore the shoe. Claude is explicitly
> authorized to continue; the old subagent-model preference below is superseded
> by the user's current instructions. See the handoff for exact test limits.

Operational guide for any coding agent working in this repo. Narrative and
rationale live in `docs/`; this file is setup, commands, invariants and traps.

Read `docs/VISION.md` before changing anything user-facing — the current
direction changed recently and the code has not caught up yet.

## What this is

A personal portfolio (Dhruv Kothari). One content source drives three surfaces
chosen at runtime by device capability:

| Surface  | Route    | Who gets it                   | Source            |
|----------|----------|-------------------------------|-------------------|
| `scan`   | `/`      | desktop + real GPU            | `src/v3/desktop/` |
| `deck`   | `/`      | touch devices                 | `src/v3/mobile/`  |
| `static` | `/work`  | software GPU, saveData, or anyone who clicks WORK | `src/v3/work/` |

`src/v3/` is the live app. Everything outside it is dead — see Traps.

Stack: Vite 8 (rolldown), React 19, react-router-dom v7 (HashRouter), GSAP,
three.js, `@sparkjsdev/spark` for Gaussian splats, Playwright for verification.

## Setup

```bash
npm install
curl -sL -o public/splats/dev-room.splat https://huggingface.co/cakewalk/splat-data/resolve/main/nike.splat
npm run dev
```

**The second line is not optional.** `public/splats/*.splat` is gitignored, so a
fresh clone has no capture and `/` renders `SCAN FAILED TO LOAD`. That is
missing data, not a bug — do not debug the loader.

## Commands

```bash
npm run dev       # vite dev server
npm run build     # production build
npm run preview   # serve dist
```

There is **no lint and no test script.** The entire quality signal is
`npm run build` plus the verification harness below.

### Verification

Three steps, in order. Skipping either prerequisite gives a confusing error.

```bash
npx playwright install chromium
npx vite preview --port 4173 &
node scripts/verify-v3.mjs
```

16 checks across all three surfaces. `scripts/shots/` gets screenshots and
`v3-results.json`. The check that matters most after touching the capture or
the camera is `scan: splat actually paints` — it measures what fraction of the
frame is lit, which is the only thing that catches a camera framing empty space.

## Invariants

**Anchors are normalised, not world coordinates.** `at: [x, y, z]` in
`src/v3/content/index.js` is `0..1` within the capture's bounding box — `0` is
the box minimum, `1` the maximum. World positions and camera viewpoints are
derived at runtime in `src/v3/desktop/splatBounds.js`. This is the least
guessable thing in the codebase. Never write world coordinates into content.

**Spark must stay dynamically imported.** It is 4.9MB raw / 1.81MB gzip. It is
`await import()`ed inside `SplatStage.jsx` so `/work` never pays for it. If
spark, three, or a `.splat` ever appears on the `/work` request list that is a
regression, and `verify-v3.mjs` fails on it.

**Camera framing is derived, never hardcoded.** Every capture trains at a
different scale, origin and orientation. `computeSplatBounds()` samples splat
centres, takes a percentile range per axis (rejecting reconstruction floaters),
and bakes the mesh world matrix in. Hardcoding a camera position is how this
broke before.

**One accent colour, no gradients.** See `docs/DESIGN.md`. `src/v3/tokens.css`
deliberately has no `--gradient-*` token.

## Traps

- **Headless Chromium reports a SwiftShader renderer**, so `resolveSurface()`
  correctly routes it to `/work`. That makes scan and deck untestable by
  default. `verify-v3.mjs` pins `localStorage['v3:surface-override']` via
  `addInitScript` to reach them. If a surface test "fails," check the pin
  before touching `src/v3/lib/capability.js` — the fallback is intended
  behaviour and is asserted as its own case.
- **If a capture loads upside down**, there is exactly one line:
  `splat.quaternion.set(1, 0, 0, 0)` in `src/v3/desktop/SplatStage.jsx` (180°
  about X). Use `(0, 0, 0, 1)` for no rotation. Trainers disagree on up-axis
  convention; this is the only place it matters.
- **Dead v1/v2 code**: `src/App.jsx`, `src/Shell.jsx`, `src/routes/`,
  `src/flagship/`, `src/components/`. Unreferenced by `src/main.jsx`. Do not
  repair, refactor or import them. Precedent: a stale `manualChunks` entry in
  `vite.config.js` was force-emitting a dead 514KB postprocessing chunk.
  Exception: `src/lab/registry.js` and `public/lab/*.html` are **live** —
  `LabScreen.jsx` iframes them.
- **`SplatStage.jsx` is vanilla three.js, not R3F**, because Spark hooks the
  render loop and requires `antialias: false`. Don't "modernise" it to
  react-three-fiber.
- **The progress denominator is `capture.bytes`**, because the splat host omits
  `Content-Length` and `ProgressEvent.total` comes back `0`. Telemetry shows
  `—` when total is genuinely unknown rather than `0.0 MB`.

## Git

- Never commit to `main` or `master`. Branch: `feat/`, `fix/`, `chore/`,
  `docs/`. Current work is on `feat/v3`.
- Conventional Commits, subject under 72 chars, no trailing period.
- **Do not push.** The user has not supplied a remote yet; commit locally after
  each logical unit of completed work.
- No attribution or co-author lines in commit messages.

## Working style the user expects

- Conclusion first. No filler, no flattery, no restating the request.
- Smallest change that achieves the goal. No speculative abstractions.
- State what is measured vs. inferred. "I don't know" is acceptable; a
  confident guess that gets walked back is not.
- Anything skipped, stubbed or deferred gets a named line in the final report.
- Subagents on Sonnet, or Haiku for read-only exploration. Never Opus.

## Map

```
src/v3/
  App.jsx              HashRouter; / resolves by capability, /work always available
  tokens.css           design system — every other file pulls from here
  content/index.js     SINGLE source of truth for all three surfaces
  lib/capability.js    resolveSurface(), override + intro-seen localStorage keys
  desktop/
    Scan.jsx           composes stage + chrome
    SplatStage.jsx     vanilla three.js + Spark; dynamic import lives here
    splatBounds.js     percentile bounds, frameBounds(), resolveAnchor()
    cameraRig.js       flyTo (GSAP power3.inOut), idle drift, project()
    LabScreen.jsx      sandboxed iframe over public/lab/*.html
  mobile/Deck.jsx      100dvh scroll-snap + gyro
  mobile/useGyro.js    lerped in RAF, decoupled from event frequency
  work/Work.jsx        static recruiter page, no WebGL
  ui/                  Telemetry, AnchorPanel, ScanIntro
docs/                  vision, decisions, state, roadmap, design, capture
scripts/verify-v3.mjs  16-check Playwright harness
```
