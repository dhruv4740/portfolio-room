# Fable's notes — overhaul, research, and everything I noticed

Written 2026-09-17 by Fable 5.1, whose access ends in two days. `IDEAS.md` is
the ranked product list. This file is the rest: how I would overhaul the
codebase, what I measured, what I would research, and small things I saw and
did not fix because they were out of scope. Nothing here is a decision.

## 1. What I know now that the repo did not

**Real-GPU measurement is possible on this machine, headless.** Playwright with
`channel: 'chromium'` and `--use-angle=d3d11` reports the AMD Radeon iGPU and
exposes `EXT_disjoint_timer_query_webgl2`. `scripts/measure-gpu.mjs`,
`shots-hands.mjs GPU=1`, `shots-void.mjs`, `probe-phone-scale.mjs` all use
it. Every "unmeasured on real hardware" note in older handoffs is now
measurable without the owner. The built-in browser pane of the desktop app is
the same GPU.

**The FPS problem, measured.** Seated, at the owner's 1536×864 @ 1.25 DPR,
the GPU took 22–28 ms per frame on every quality tier, so the room ran at
20–30 fps. Standing view: 3–7 ms. The pixel-ratio sweep showed the seated
cost is fill-rate: 3.8 ms at 0.5×, 6.6 at 0.75×, 10.7 at 1.0×, 13.4 at 1.25×
looking at a wall. The governor never lowered the pixel ratio because it fed
on CPU submission time (1–3 ms) and read every frame as cheap. It now feeds
on GPU time where the timer extension exists; seated it settles at 0.8–0.95×
and 10–16 ms. The hand rig is about 3 ms of that (46 draw calls).

**What is still expensive**: five point lights and one shadowed directional
light evaluated per pixel on MeshStandardMaterial across a full-screen desk.
That is the next fix if the owner wants 60 fps at native resolution: bake the
static light into a lightmap or vertex colours, keep the lamp and the screen
glow live, drop the rest (IDEAS #11).

## 2. Overhaul: what I would change if I had the repo for a month

### 2.1 Content and truth
- `src/v3/content/index.js` is the single source of truth and it is half
  empty: `links.live`, `links.github`, `decision`, `broke` are empty strings on
  every project. The site's honesty rules are good; the fields to be honest
  with are missing. This is the first thing to fill (owner only).
- Generate evidence instead of typing it: a build step that reads each local
  repo with `git log --format=%an` and writes `proof.json` (commits by author,
  test files, last commit). Render it on `/work` and in each app window title.
  It answers the DarkSentinel and Fraud ownership questions with a number.

### 2.2 Architecture
- `WorkspaceStage.jsx` is 1,200 lines with all choreography inline. Split by
  object: `actions/pen.js`, `actions/coffee.js`, each exporting `start(ctx)`
  and using the shared `hold/snapshot/gripPose`. The stage keeps the loop,
  raycast and camera. Tests would not change.
- The projected DOM markers, the phone surface and the OS overlay all solve
  the same "quad in world → CSS matrix3d" problem three ways
  (`updateMarkers`, `updatePhoneAlign`, `updateScreenAlign`). One
  `projectQuad(mesh) → matrix` helper.
- `public/os/` is a second app with its own conventions (vanilla modules, no
  build). It works and it is what makes the OS feel real. Keep it vanilla; do
  not fold it into Vite. The `iframeApp` pattern means project UIs never
  touch it again.
- `apps/` is now the home of copied project sources. Each has a
  `PORTFOLIO.md`. If this grows past three apps, add a root
  `apps/README.md` with the table from `PROMPT-R8-GEMINI.md`.

### 2.3 Rendering
- Pixel ratio: the governor's ceiling is 1.5; on a 4K laptop that is
  2880×1620 render targets for a room whose detail does not need it. Cap the
  ceiling at 1.25 and let the governor step down from there.
- Shadows: the moon is the only caster, static. Fine. The lamp pool is a
  texture. Fine. Do not add casters.
- The hands: the procedural rig is at its ceiling. The proportions are now
  anatomical (palm 13.5 cm × 9.5 cm × 3 cm, bones 32/27 cm, shoulder yields
  when the reach exceeds the arm) and the cuff hides the wrist seam. What is
  left is what geometry cannot give: skin shading, knuckles, tendons. A
  skinned GLB with the same seven pose scalars mapped to its bones is a
  two-day job once the asset exists; the `POSES` table, `hold()` and the
  grips would survive unchanged because they drive scalars, not meshes.
- Antialiasing: `antialias: true` gives MSAA on the default framebuffer; at
  0.8× pixel ratio the edges will start to show. If the bake lands and the
  ratio can go back to 1.0×, keep MSAA; otherwise consider FXAA in a
  post-pass (cheaper than 4× MSAA at this resolution).

### 2.4 Testing
- The harness is the whole quality signal. Two things would make it
  stronger: run the GPU variants in a nightly-style script the owner can run
  in one command (`npm run verify:gpu`), and make every suite default to
  `http://localhost:4173` (two still default to 4174; a suite that cannot
  connect reads as a failure that is not one).
- Headless Chromium does not paint nested iframes reliably; the real-app
  test is text-based for that reason. Screenshots for review come from the
  GPU path.
- `verify-project-uis.mjs` still asserts round-7 hand-drawn markup for
  CrisisWatch, Fraud and FocusLock desktop. Each will need the iframe form
  when its real UI lands (the DarkSentinel block is the template).

### 2.5 Deployment (nothing exists yet)
- Static host; no server code anywhere. Cloudflare Pages or Vercel with
  `npm run build` → `dist/`. `public/apps/*` are plain files. Set headers:
  `Cross-Origin-Opener-Policy` is not needed; do not set COEP (it would
  break the same-origin iframes' fonts).
- `.txt` RSC payload files from the Next export live next to the pages; any
  static host serves them. `trailingSlash: true` means `/apps/darksentinel/threats/`
  resolves to `index.html` on every host, including Vite preview.
- The Google Fonts `<link>` in the DarkSentinel layout is the only external
  request in the real-UI path. Offline it falls back; online it fetches from
  Google. If the owner wants zero third-party requests, self-host Sora,
  Manrope and JetBrains Mono under `public/apps/darksentinel/fonts/`.

## 3. Research I would do next (and how)

1. **react-native-web for Expense Tracker.** Spike: a Vite project with
   `react-native` aliased to `react-native-web`, `.web.tsx` first in
   `resolve.extensions`, `@op-engineering/op-sqlite` aliased to an in-memory
   module, the three native modules stubbed. Measure: does `DashboardScreen`
   render, do `react-native-gifted-charts` and `@react-navigation/native-stack`
   run. Stop after four hours if not; the answer decides OPEN-QUESTIONS 6.
2. **Compose Multiplatform wasm** for BasketProof. Read the Android module's
   dependency list first; every Android-only dependency is an `expect/actual`.
   If the count is over ten, option (a) in OPEN-QUESTIONS 5 is not worth it.
3. **Lightmap bake in three.js without Blender.** Options: (i) render the
   static lighting once into a texture per large surface using a UV2
   unwrap generated at build (`THREE.LightProbe` does not do this; a small
   raster pass per face does); (ii) vertex-colour bake: sample the lights at
   each vertex once, store as `color` attribute, use `vertexColors` with a
   flat-lit material. (ii) is a day and gets most of the win for the walls,
   desk and floor, which are the pixels.
4. **A DOM→texture path for the monitor** was rejected correctly (no browser
   API). But `OffscreenCanvas` + the OS drawn to a canvas is not possible
   either because the OS is DOM. The live-iframe-during-flight solution is
   the right one; keep it.
5. **Presence** (IDEAS #19): Cloudflare Durable Objects with a 20-byte
   position message per visitor; render others as a translucent chair or a
   cursor. A weekend, needs hosting first.

## 4. Small things I saw and left alone (out of scope)

- `docs/HANDOFF.md` says "Both hands/forearms total 19,392 triangles in 16
  draw parts" in an older section; the rig is now ~46 draw calls when
  visible. The top section is current; the older ones are history.
- `Telemetry.jsx` shows `FPS — MS · —` in the standing view because cadence
  is only accumulated in some states; harmless, but "—" reads as broken.
- The `.claude/launch.json` is untracked and machine-specific; fine.
- `scripts/probe-seated*.mjs` and `probe-walls-fps.mjs` are untracked
  leftovers from earlier rounds; delete or commit, the owner's call.
- The DarkSentinel landing page shows real-looking service states ("n8n
  online", "pg rows: 24"). They come from the health fixture; the window
  title says demo data, the page itself does not. If a screener could read
  those as live, a one-line "DEMO DATA" badge in `AppShell.tsx` is the fix
  (one edit in the copy, listed in `PORTFOLIO.md`).
- `public/os/apps/darksentinel.js` used to hold a 300-line rebuild with a
  "83 features" claim; both are gone with the iframe entry.
- Windows + OneDrive: writes through some tools lag or get re-synced. Twice a
  file edit did not land until done with the editor tool. If a change looks
  ignored, check the bytes before assuming logic.

## 5. If I had one more day

Morning: vertex-colour light bake, measure with `measure-gpu.mjs`, expect
seated GPU under 8 ms at 1.0×. Afternoon: the guided tour (IDEAS #8), because
it turns the room from a toy for people who click into a demo for people who
do not. Evening: CrisisWatch through the recipe, the second proof that it is
a recipe and not a one-off.
