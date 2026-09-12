# Decisions

Each entry: what was decided, why, and what would reverse it. Findings with no
decision attached are trivia and are not recorded here.

## 1. Gaussian splatting as the hero, not a shader scene

**Decided.** A splat capture reads as a real artifact with volume. Shader scenes
read as "someone used three.js." Rarity is the whole point of the flex.

Measured feasibility, not assumed: the 8.6MB / 270k-splat placeholder renders at
**under 1ms/frame even under SwiftShader software rasterization** in headless
Chromium. Real GPUs have enormous headroom.

Reverses if: a licensed capture with a visible laptop can't be sourced (see #7).

## 2. Spark (`@sparkjsdev/spark`) as the renderer

**Decided** at build time. MIT, WebGL2, by World Labs. Peer dep `three >=0.180`.
Reads `.ply / .splat / .spz / .ksplat / .sog`. Crucially it exposes
`objectModifier` / `worldModifier` / the `dyno` shader graph, which is the API
surface a per-splat dissolve or warp effect would need.

Cost: **4.9MB raw / 1.81MB gzip.** Mitigated by dynamic import, not eliminated.

**Open — re-evaluate now.** three.js **r186 shipped 2026-09-08** with a native
splat renderer (PR #33950, merged to `dev` 2026-08-08). `npm view three version`
confirms `0.186.0`. This was a future migration path when the code was written;
it is available today. Nobody has evaluated whether it covers the animation
hooks Spark provides. Do that before building the warp — if native suffices, the
bundle debt disappears and the warp gets built once, not twice.

## 3. Three surfaces, one content source

**Decided.** `src/v3/content/index.js` feeds scan, deck and static. Adding a
project is one edit.

Surface is chosen by **capability, not user-agent sniffing**: WebGL2 presence,
`pointer: coarse`, `WEBGL_debug_renderer_info` GPU tier, `saveData`. UA strings
lie; `navigator.connection.saveData` and a software-renderer string do not.

A software GPU gets `/work`. That is correct and is asserted as its own test
case so nobody "fixes" it.

## 4. Camera framing derived from capture bounds

**Decided after a failure.** The first implementation hardcoded room-scale
camera coordinates and pointed them at an object-scale placeholder: 270,491
splats loaded, frame time 0.7ms, and **0.0% of the frame lit.** The camera was
correctly rendering empty space.

Now: sample splat centres → percentile range per axis (raw min/max is useless,
captures are full of floaters) → bake `matrixWorld` (bounds come out in local
space while the mesh is rotated 180° about X) → derive both the establishing
shot and every anchor position.

Consequence: anchors are authored as normalised `0..1`, so swapping the capture
needs no camera maths.

## 5. Vanilla three.js in `SplatStage.jsx`, not react-three-fiber

**Decided.** Spark hooks the render loop and requires `antialias: false` on the
WebGLRenderer. Fighting R3F's loop for this gains nothing. The rest of the app
is React.

## 6. Design system "Technical Instrument"

**Decided.** No gradients, one accent (`--signal: #FF5F1F`), three durations,
one easing curve. See `docs/DESIGN.md`. The constraint exists because
unconstrained "make it impressive" converges on the same AI-generated gradient
page every time.

## 7. Capture licensing — UNRESOLVED, and it now gates the plan

The plan is to ship a **downloaded** scan, so its licence matters.

- The current placeholder is `cakewalk/splat-data` (`nike.splat`) on HuggingFace.
  **Terms unverified.** It is a dev placeholder and must not ship.
- Community splat galleries are per-creator licensed and frequently
  non-commercial. There is no blanket "public domain room scan" source that a
  web search surfaced.
- The licence of the standard 3DGS benchmark scenes (Mip-NeRF 360: garden,
  bonsai, room, kitchen, bicycle) was **not** established. Searching returned
  paper pages and mirrors, not terms.

**Second problem, independent of licence: recognition risk.** Those benchmark
scenes are instantly recognisable to exactly the graphics audience being
targeted. Shipping `garden` reads as "downloaded the demo," which inverts the
flex.

**Recommendation:** attribute the capture in the telemetry readout. A scan
legitimately has provenance metadata (`capturedOn`, `device`, `method` already
exist in `content/index.js`), so attribution fits the instrument aesthetic
instead of fighting it, and converts "downloaded a demo" into "sourced and
credited an asset."

**What would settle the licence question:** a deep-research pass on
chatgpt.com / claude.ai / gemini.google.com — web search from here returns SEO
farms and paper mirrors, not terms. Ask the user to run it and paste back.

## 8. Documentation targets `AGENTS.md`, not `CLAUDE.md`

**Decided** by the user: the next agent is not Claude. `AGENTS.md` is the
cross-vendor convention. Root `CLAUDE.md` is a one-line pointer to avoid drift.
