# Current update — 2026-09-20, cinematic studio

This entry supersedes the presentation and hand implementation described below.
Branch `feat/v3`; local work only. Design and refresh details:
[docs/CINEMATIC-STUDIO.md](CINEMATIC-STUDIO.md).

## Changes

- Interior night launchpad with direct Desktop projects, Mobile projects,
  Explore the room, Work and Contact paths. Computer iframe state survives
  exit/re-entry. Project launchers are keyboard buttons and open with one click.
- Rebuilt wall boundaries, real window opening, recessed doorway, ceiling and
  world-depth city layers. Opening the window now gives a deliberate close-up.
  Static shadow updates are preserved; two weak point lights were removed.
- Continuous skinned hands replace individual palm/finger/wrist pieces. Each
  hand and sleeve pair uses two draws. Cuff rim is closed and thumb shortened.
  Regenerate binary geometry with `node scripts/build-hand-assets.mjs` after
  changing geometry or neutral bone transforms.
- Phone pickup hands off to a 390px-wide portrait stage with responsive height,
  readable typography, app scrolling, focus containment and explicit Home/Back.
  Stage pauses room rendering. App state remains mounted across room returns.
  Android apps are labelled browser reconstructions, as the owner permitted.
- FocusLock desktop, CrisisWatch and Fraud Detection now join DarkSentinel as
  real-source iframe demos. Backend/IPC seams supply demo fixtures. Source
  manifests live in `apps/<name>/PORTFOLIO.md`; builds in `public/apps/`.
  No source repository was edited. Refresh is manual, not automatic.

## Verification status

Production and per-app builds passed. Integrated regression results:
- `verify-v3`: 41/41; `verify-studio`: 23/23.
- Held objects and all eight reduced-motion hand actions passed. Phone and
  notebook settled with zero additional idle render frames in those checks.
- OS apps: 5/5 plus music, wallpaper persistence and Skills RAF checks.
- Room interactions passed, including window audio, blinds, sky variants,
  lamp, keyboard and held objects.
- Real-GPU `verify-real-apps`: all four desktop apps passed, including native
  FocusLock minimize/restore/close, with no page errors or failed requests.
- Final `shots-studio` passed window Back during opening and modal phone entry;
  catalog, phone, overview, seat and window screenshots were inspected.
- `verify-project-uis` and secondary legacy harnesses were syntax-checked only,
  not browser-run. Physical Android and other GPUs remain untested.

Visual review also removed the embedded CRT overlay, restored CrisisWatch's
Inter/Space Grotesk font stacks, and caught a stream confidence fixture scale
error. The real project UI is retained. Its Google Fonts and original remote
images still require network access; readable system fallbacks are explicit.
Final `shots-crisiswatch` passed normal navigation and sample submission,
asserted REST confidence 96 and displayed stream confidence 96%, and captured
the painted embedded result with the restored font stack.
The final GPU probe exposed an orbit returning to its start being treated as
a click; pointer movement is now tracked in standing mode as well as seated.

Real-GPU screenshots inspected: interior overview, window close-up, pen, cup
and award grips. Smooth surface normals removed visible triangle faceting in
skin. These are stylized procedural hands, not anatomical scan assets.
The cup/award held wrist measurements remain about 44°/53°; the main improvement
is the continuous surface and cuff, not a claim of new wrist biomechanics.

Phone agent checked 1366×768 and 1536×864: widths 390px, responsive heights,
16px body/13px secondary text for main app content, state persistence,
dialog-first Escape and entry focus. Parent corrected a clipped demo label
by allowing the FocusLock header to grow.

Performance limitation: the old drag sweep changed camera framing between
samples and the governor previously changed pixel ratio. Do not use it to
claim a controlled before/after speedup. Pixel-ratio pinning is now explicit
and the probe returns its pointer to the starting position after each sweep.
Final corrected sweep on AMD Radeon / ANGLE D3D11, 1536×864, mid tier, seated:
68 draws and 64,492 triangles at each pinned ratio. GPU median / p95 in ms:
0.8×: 9.57 / 11.75; 1×: 14.56 / 16.38; 1.25×: 21.96 / 24.45.
This is current-device render cost, not a before/after improvement or FPS
claim. The full-resolution seat remains too expensive for a reliable 60Hz
claim on this iGPU; retain the adaptive ratio. The standing transient HUD
sample was 30.6ms and was not a steady-state benchmark.
No cross-device or physical-Android validation was performed.

---
# Current update — 2026-09-17, round 2 (Fable)

Branch `feat/v3`, local commits only, no remote. Newer than everything below.

## What changed

**Hands and wrist (the owner's main complaint).** Judged on the real GPU this
time (see "Measuring", below), not from tests. What was wrong and what changed
in `src/v3/desktop/seatedHands.js`:
- The palm was ~35% too thick and ~30% too long; the wrist ball bulged past
  it. Now wrist-to-knuckle 13.5 cm, 9.5 cm wide, ~3 cm thick at the heel.
- The forearm was a bare tube ending in a 16 cm sleeve cylinder that passed
  right by the camera. Now a shirt sleeve with a cuff 3–4 cm above the wrist
  covers the forearm; the elbow is a child of the forearm so it matches the
  sleeve's elliptical end; the upper-arm sleeve is 8–10 cm and runs from the
  real shoulder so its end never floats in view.
- The arm bones were 40 cm each with a symmetric solve, so every reach was a
  straight rod. Now upper arm 32 cm, forearm 27 cm, general two-bone solve,
  and past 57.5 cm the shoulder yields toward the hand (torso lean) instead
  of the arm stretching. Rest wrist bend went 13.5° → 8°; held states 40–56°.
- The mug grip has its own `mug` pose (far joints open so the tips end at
  the handle) and the sip turns the mug so the handle faces the body:
  wrist at the sip 84° → 43°. One fingertip can still show at the rim when
  the mug tilts; the rest are hidden.
- Lamp and blind reaches go through `hold()` (arc, fingers open on the way).

**Award frame.** Moved to `[-1.0, 1.335, -0.22]`, turned 0.62 rad toward the
seat: left of the monitor's sightline from the seat, in front of the speaker,
clear of the phone and the lamp. `AWARD_REST` in `buildRoomInteractions.js`.

**FPS root cause, measured.** Seated at 1536×864 @ 1.25, the iGPU took 22–28
ms per frame on every tier while CPU submission was 1–3 ms. The pixel-ratio
governor fed on CPU time, read every frame as cheap, and climbed to its
ceiling. It now feeds on GPU time when the timer extension exists
(`gov.recordFrame(Math.max(cpu, lastGpu))`), and seated it settles at
0.8–0.95× for 10–16 ms. Standing view is 3–7 ms. The hand rig costs ~3 ms
(46 draw calls). The remaining cost is five point lights plus the shadowed
moon on MeshStandardMaterial across the desk; see `docs/FABLE-NOTES.md`.

**Real project UIs: the pattern, proven on DarkSentinel.** `apps/darksentinel/`
is the Next.js 14 source copied at `d5821bf`; five files changed (its
`PORTFOLIO.md` lists them): API routes removed, `lib/api.ts` answers every
request from `lib/mock/router.ts` fixtures (all `DEMO DATA`), static export
with `basePath /apps/darksentinel`, `generateStaticParams` for the dynamic
route. `node scripts/build-apps.mjs darksentinel` writes the export to
`public/apps/darksentinel/` (committed, 2.4 MB, 282 kB raw first load).
`public/os/shell/iframeApp.js` hosts it in a 1280×780 window; the app entry
is eight lines. The window title says `· demo data`. The recipe for the other
apps, the per-app seams and the readability floor are in
`docs/PROMPT-R8-GEMINI.md`. The old hand-drawn `darksentinel.js` (and its
"83 features" claim) is gone.

**Readability, measured.** Inside the monitor the OS fills the viewport, so
app pixels are screen pixels: a 1280×780 window shows DarkSentinel at its
natural size (smallest text 11.8 px, body 14–16 px). The held phone's 540-px
surface rendered at 0.68× on a 1536×864 screen (0.85× at 1080p, 0.60× at
1366×768), so a 16 px phone font shows at 10.9 px. The held phone is already
framed to fit 94% of the viewport height, so no camera change makes it larger
without cropping; the rule for phone apps is therefore app-side: text ≥ 20 px
in surface units. `scripts/probe-phone-scale.mjs` measures the scale.

**Black void: live prototypes for the owner's decision.** `/?void=studio`
(sky-coloured backdrop, fog, ground) and `/?void=block` (plus the room's slab
and distant blocks with lit windows). Default stays black. Frames:
`scripts/shots/void-{black,studio,block}.png` (GPU, 1536×864 @ 1.25). The
choice is in `OPEN-QUESTIONS.md` item 1.

**Docs.** `docs/IDEAS.md` (ranked ideas, costed, two audiences),
`docs/FABLE-NOTES.md` (overhaul, research, small things seen),
`OPEN-QUESTIONS.md` items 5–7 (Compose, React Native, hand mesh).

## Measuring on the real GPU

Headless Playwright with `channel: 'chromium'` and `--use-angle=d3d11` runs on
the AMD Radeon iGPU of this laptop and exposes `EXT_disjoint_timer_query_webgl2`.
`scripts/measure-gpu.mjs` (per tier, standing/seated, hands on/off, `SWEEP=`
pixel ratios), `GPU=1 node scripts/shots-hands.mjs` (frames at 1536×864 @
1.25), `scripts/shots-void.mjs`, `scripts/probe-phone-scale.mjs`. The HUD's
`GPU x.x MS` is the number to trust; the FPS row under the harness is limited
by the harness's own mouse-event rate.

## Verified (production build, `http://localhost:4173`)

`verify-v3` 35/35, `verify-room-interactions`, `verify-held-objects`,
`verify-pen-drawing`, `verify-reduced-hands`, `verify-os-apps`,
`verify-project-uis`, `verify-real-apps` (new: the real DarkSentinel UI opens
in its window, landing → manual console → System Status, no page errors, no
off-origin requests except its Google Fonts link). Two suites default to
`127.0.0.1:4174`; always pass `BASE`.

Not verified: the owner's judgement of the hands; whether the DarkSentinel
mock covers every screen (landing, manual console, system status and the
threat detail route are exercised; Search & Scrape, PII, alerts and export are
wired to fixtures but only clicked by hand in a real browser once); the
Google Fonts request in DarkSentinel's layout is the one third-party request
in the real-UI path (fallback fonts offline).

Known: headless Chromium does not reliably paint a nested iframe, so real-app
tests are text-based and screenshots come from the GPU path; a static export
hydrates late in headless, so tests wait for React before clicking.

---

# Current update — 2026-09-16, hands rework

Branch `feat/v3`, local commits only, no remote. Newer than everything below.

The seated hand rig was rebuilt in `src/v3/desktop/seatedHands.js` (it used to
be `seatedHands()` inside `buildWorkspace.js`). What changed:
- Palm is a superellipse loft; each finger is three phalanges on nested joints;
  the thumb has a base that rotates from lying beside the index to opposing the
  fingers, plus two flexion joints. The forearm hangs off the hand at an
  elliptical wrist, so the wrist cross-section rolls with the palm; an elbow
  ball covers the sleeve/forearm join. Elbow is still the analytic two-bone
  solve with a pole; shoulders still move with `lean`.
- Poses are seven scalars per hand (`POSES` in seatedHands.js: rest, open,
  flat, point, pinch, wrap, hook, cup, hold, pen). `hold()` in WorkspaceStage
  blends pose alongside position and rotation, opens the fingers on the way to
  a grip, and arcs the reach upward. Each grip names its pose.
- Side-edge holds (résumé, notebook, award) and the phone hold are authored as
  explicit hand-axis bases (`edgeGrip`, `basisGrip`) with the fingers tilted so
  the wrist points toward the elbow. Wrist bend at the held states is now
  33–59° where it was 74–90°.
- The pen grip is derived from the pinch pose (`pinchFrame`): the pencil runs
  through the index and thumb pads and rests in the thumb web. The flat pencil
  is picked up with a separate grip and rolls into the writing grip while it
  lifts; the held pencil rotation is derived from an authored writing-hand
  orientation, not hand-tuned.
- Rest hands sit at y 1.311 with per-finger curls that put every fingertip
  4–5 mm above the keycap tops; typing dips still meet the key.
- Keyboard marker anchor moved to the far edge of the keyboard so its label
  no longer covers keys.
- Telemetry shows GPU MS from `EXT_disjoint_timer_query_webgl2` when the
  browser exposes it (desktop Chrome). It is the first graphics-card number in
  the HUD; FPS is still render-on-demand cadence and reads low when idle.

Verified on the production build at `http://localhost:4173`: `verify-v3`
35/35, `verify-room-interactions`, `verify-held-objects` (zero idle frames
holding phone and notebook), `verify-pen-drawing`, `verify-reduced-hands`
(new: every action lands held under reduced motion, no page errors),
`shots-typing` (rest tips 1.266–1.267, press dips to 1.2575). Frames in
`scripts/shots/hands-*.png`.

Not verified: how the motion feels on real hardware and the owner's judgement
of the hands; GPU MS on the target laptop (the readout exists, the number is
his to report); draw-call cost of the rig (≈40 small meshes for both arms,
unmeasured on a GPU).

Known: the coffee sip still bends the wrist ~84° (the mug's handle grip is
right, the raised-mug orientation is not); the lamp reach is a straight tween
without the arc; `scripts/shots-hands.mjs` seeks timelines for mid-reach frames
and the lamp's camera fly races that seek, so the lamp frame is clock-sampled.

The black void, round-7 project UIs and the FPS cause remain open — see
OPEN-QUESTIONS and the notes above.

---

# Current update — 2026-09-15, desk rework

Branch `feat/v3`, local commits only, no remote. Newer than everything below.

Room, as built now:
- Standing view: a SIT DOWN button. Seated: controls collapse into CONTROLS ▸
  with STAND UP / ESC always visible; the name header hides while seated.
- Walls are bare (pinboard, poster, pinned note, shelf, books and plant removed
  at the owner's request). Flat ceiling. A front wall closes the room behind the
  chair and hides with the other walls from the standing view.
- Desk objects the hands use: phone (FocusLock), notebook (blank ruled page),
  pen (draws on the notebook page; CLEAR PAGE wipes it; the drawing lasts until
  reload), coffee (four sips, then REFILL COFFEE), awards frame (stands on the
  desk, picked up by hand), résumé (drawer → both hands; scroll to zoom, move to
  read), headphones (shared song), lamp, blinds, window, keyboard (clicks pass
  through the hands; the finger over the key dips).
- Lighting: warmer day fill, less screen glare on the keyboard
  (`scripts/measure-sky.mjs` reports keyboard clipping).
- Monitor: round-6 project apps plus the shared Music Player
  (`docs/review/gemini-round6.md`). Round 7 replaces the project apps with the
  real UIs (below).

Direction set by the owner:
- **Every project runs as its real UI**: phone apps on the phone, desktop/web
  apps on the monitor, rebuilt from each project's own repo, frontends backed by
  in-browser simulated data. Brief: `docs/PROMPT-R7-GEMINI-REAL-PROJECT-UIS.md`.
- **The black void around the room is deferred.** Options on the table were a
  building exterior, a soft studio backdrop, or starting seated. Not decided;
  see OPEN-QUESTIONS.

Known unresolved:
- Wrist cut on the curled coffee hand: two attempts (wrist joint, deeper
  forearm) changed nothing visible; cause unknown.
- FPS drops below 40: headless comparison against 7b8c191 showed identical
  render cadence and CPU per frame; GPU cost is unmeasured. Most likely the HUD
  counts only rendered frames (render on demand), which reads low while looking
  around slowly.
- The pen's holding hand reads as a fist; the pencil and ink are correct.

Checks: `verify-v3`, `verify-room-interactions`, `verify-held-objects`,
`verify-headphones-song`, `verify-music-sync`, `verify-pen-drawing`
(all take `BASE=http://localhost:4173` after `npx vite preview --port 4173`).

---

# Update — 2026-09-14, fifth room pass

The historical handoff below predates the completed night rig and seated interactions.
Current app changes start from ea0f479 plus its brief-only documentation commit.

- Initial scene offers SIT. Seated DESK and CONTACT controls preserve both anchors.
- Phone uses the unchanged Instagram UV rectangle; the ready finger waits below/right of it.
- `PhoneScreen.jsx` owns the 540×1200 DOM phone surface. The room projectively
  maps it during the zoom; the home Instagram control hands off to FocusLock,
  and the visible close action/Escape returns to the desk.
- Continuous tapered skin surfaces replace joint collars. Resting hands are retained per the user's latest request. Both hands/forearms total 19,392 triangles in 16 draw parts, no shadow casting. This is geometry submitted before occlusion, not a count of pixels visible behind an object.
- Notebook lifts to a held reading pose, returns on Escape, and uses the existing page texture unchanged. Reduced motion places both objects immediately in their held pose.
- Ceiling and pendant rose join static geometry. Lighting values, fixed light positions, WORKSPACE.screen and CLOSE_READ are preserved.
- Build passed. Updated navigation regression passed 37/37. Focused phone/notebook tests measured zero rAF callbacks over three seconds at idle. Reduced-motion keyboard activation and returns passed. Final rest-height-only adjustment was checked with a fresh build and screenshots after that full regression.
- Review artifacts: scripts/shots/fifth-rest.png, fifth-phone.png (hover), fifth-notebook.png. The page was visually compared with check-notebook.png; text remains comparably sized, without projected markers over it.
- scripts/verify-held-objects.mjs reproduces normal-motion pickup, tap, idle and return checks at BASE (defaults to 4174).
- Real AMD GPU performance remains unmeasured. FocusLock is still a labelled placeholder. Hands remain authored procedural geometry, not a scan; their realism needs the owner's judgement.
- Written room redesign options, estimated costs and ordering: [ROOM-SHAPE-PROPOSAL.md](ROOM-SHAPE-PROPOSAL.md). Reshape options are not implemented.
- dhruvOS now registers the four dependency-free sketches `corrupted`, `fluid`
  (`Flux`), `kinetic`, and `tear` as standalone windows. The former Lab and
  Wormhole launchers, iframe registry, and `public/lab/*.html` pages are gone.
- Animated sketch apps expose visibility cleanup: their rAF work stops on
  minimize, close, and the embedded OS `leave` message. The wallpaper action
  now applies the selected palette to the visible desktop root as well as the
  intro layer. Resonance starts audio only from its in-app control.

---

# Handoff — updated 2026-09-13

Branch `feat/v3`. Nothing pushed, no remote configured. Working tree clean as of
`407a1d1`; everything below is committed.

Read `AGENTS.md` for repo rules and traps. `docs/ASTRA-3D-BRIEF.md` is the live
art direction for the 3D work.

## Where it stands

**Verified 36/36** (`node scripts/verify-v3.mjs`, BASE=http://127.0.0.1:4174,
run against `407a1d1`). This is a real full-suite number measured directly, not
an intermediate or partial run.

The desktop surface is an **authored three.js room** — desk, monitor, keyboard,
notebook, chair, lamp, window. Orbit it, click the monitor, the camera travels
in and hands off to dhruvOS, which retains state across exit and re-entry.
There is no splat capture and no Spark; that direction is dead and its source
is deleted.

### Settled this session

- **Monitor mesh click is confirmed.** A real raycast into the canvas at the
  monitor plane — not the projected marker button — enters the OS. This was the
  outstanding "never conclusively checked" item from the previous handoff.
- **Escape exit is covered.** Both exits (Back button and Escape from inside)
  are tested, including focus restoration.
- **The screen is live, not a painting.** During camera travel, the real dhruvOS
  iframe is transformed onto the monitor's projected screen quad via an exact
  affine solve from three corner correspondences, updated per frame through an
  imperative ref path (no React re-render). You arrive at the thing you were
  already looking at. A true DOM→WebGL-texture route was investigated and
  rejected: no browser API renders a live cross-document DOM into a texture.
- **Travel reads as acceleration.** `power4.in` entering / `power4.out` leaving,
  1.2s / 1.0s, FOV widening 40°→54° over the final 40%, vignette and
  overexposure flash at arrival. `prefers-reduced-motion` cuts straight through
  with no acceleration, FOV change, vignette or flash.
- **Art direction is decided: night.** See `docs/ASTRA-3D-BRIEF.md`. A first
  dark pass is committed (`1a44ac9`); the full night rig is not done.
- **Repo cleaned.** Dead v1/v2 source, `SplatStage.jsx`, `splatBounds.js`, and
  five unused dependencies (spark, r3f, drei, postprocessing, rapier) removed.

### A correction worth carrying forward

A previous agent reported these focus checks as passing, and a later one
reported them as pre-existing failures. Both were wrong. The restore was
deferred to a `requestAnimationFrame` while the harness reads `activeElement`
the moment the room state flips — the old timing won that race by luck and the
retuned travel timing lost it. It is now a `useLayoutEffect` that focuses
synchronously at commit with a single reassert. **Do not reintroduce a deferred
focus restore.**

## Not done

- **The night lighting rig.** Committed pass is dark but flat: light shafts read
  as flat patches with no falloff, the lamp does not visibly emit, the monitor
  does not spill light onto the desk. That last one is the highest-value item in
  the brief.
- **The hanging bulb.** Requested by the user. Brief recommends taking the
  fixture but firing a single power-surge flicker on entry rather than constant
  interrogation-style flicker — attention, tone and photosensitivity reasons.
- **`screenTexture()` in `buildWorkspace.js` is still a static painting.** It is
  what you see on the monitor *before* travel begins. The live overlay only
  takes over during `entering`. Matching the two would remove the last seam.
- The former lab gallery and its iframe pages were removed. Four sketches now
  live directly in the dhruvOS app registry; the other experiments were dropped.
- **Content.** All project `links.live` / `links.github`, and every `decision`
  and `broke` field in `src/v3/content/index.js`, are empty strings. Do not
  fabricate these; they come from the user.
- **`og:image`.** Absent — shared links preview as bare text.

## Explicitly unverified

- **Real GPU behaviour.** Every run used headless Chromium's SwiftShader
  software renderer through the intentional `v3:surface-override` path. rAF
  cadence is CPU submission timing, not GPU frame time. No FPS claim anywhere in
  this repo is load-bearing.
- **A mid-transform frame** of the OS overlay skewed onto the monitor quad
  during flight. Start and end frames are confirmed correct and the projection
  math is exact by construction, but screenshot overhead under software
  rendering exceeded the 1.2s travel window, so no genuinely mid-flight capture
  exists.
- **The iframe-side `request-leave` bridge.** The host handles Escape because
  focus sits on the host's Back button while inside. The OS document's own
  leave message only fires with focus inside the iframe, which nothing tests.
- **Mobile gyro on real hardware.** Headless has no `deviceorientation`.
- **Transition quality as a human experience.** Screenshots are not a judgement
  of whether the warp feels good.

## Commands

```bash
npm install
npm run build
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
node scripts/shot.mjs scripts/shots/scene.png     # screenshots the 3D scene
BASE=http://localhost:4173 node scripts/verify-v3.mjs
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
```

`npm run preview` strips arguments on this machine — call Vite's bin directly.
Both verification scripts use `http://localhost:4173` when `BASE` is omitted.
Reuse one preview server; concurrent heavy browser probes have caused
`spawn EPERM` here.
