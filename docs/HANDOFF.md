# Handoff

The single source of truth for status, open problems and what to do next.
Operational rules (commands, invariants, traps) are in [AGENTS.md](../AGENTS.md).
Last updated 2026-09-25, after an unattended overnight run. **Start with "Owner decisions waiting" below.**

## Working mode

The owner, Dhruv, gave these instructions on 2026-09-24:
- **Scope:** fix every open problem below in one pass rather than one small step at a time. Then work through every experience on the site until nothing is laggy, weird or cosmetically off.
- **Unattended runs are allowed.** The laptop may be left locked but awake.
- **Permission prompts:** the agent runs in auto-permission mode, so a prompt pauses the work until he returns. Avoid actions that need approval.
- **Decisions that change the look or feel:** leave them written up here rather than choosing.
- **Review:** show frame sheets for every interaction change (`scripts/shots/motion/`).

## What the site is

A personal portfolio. Its first job is to impress other builders; its second is to get an internship screener to the facts fast. `/work` is the static recruiter page and must never break.

The desktop surface is a first-person 3D room at a desk in Mumbai:
- The sky follows IST, and the weather comes live from Open-Meteo (rain, never snow).
- The monitor opens dhruvOS, which runs the real web projects.
- The phone runs the Android apps.
- Every object on the desk can be picked up or used.

The target is a room that feels like GTA V or RDR2. It hasn't got there yet.

## Branches

Nothing is merged to main.

| Branch | Contains |
|---|---|
| `feat/v3` | Launchpad, loading, deep links, live data, fixes |
| `feat/true-scale-room` | + the true-scale room |
| `feat/relight` | + baked lighting, dust, vignette and grain |
| `feat/cutscenes` | + the cold open. **This is the latest; work from here.** |

The worktree for the stacked branches is `C:\Users\hp\pf-truescale`. Its dev server is the `truescale` launch config (port 4175) and its production preview is `truescale-preview` (4176). The main checkout serves `feat/v3` on 4173.

## What exists (all on `feat/cutscenes`)

- **Launchpad:** six options (keys 1–6): projects, phone apps, explore, recruiter `/work`, About, a 60-second guided tour. Contact and GitHub are pinned top-right.
- **Navigation:** deep links `/#/os/<app>`, `/#/phone[/<app>]`, `/#/about`, `/#/contact`, `/#/room/<object>`, and a Ctrl/⌘+K palette.
- **Loading:** a real progress bar. Song, phone UI and phone apps load lazily.
- **Payload:** meshopt city, WebP GLB textures, re-encoded JPEGs.
- **Live data:** GitHub activity on the monitor; Mumbai sky, weather, rain and a corner readout.
- **Link previews:** `public/og.jpg`.
- **True-scale room** (`cinematicLayout.js`, `buildCinematicWorkspace.js`):
  - Desk at 0.74 m, and the hand rig rebuilt around a real seat.
  - Forward lean at rest went from 24.6 cm to 0.
- **Baked lighting** for this room (`scripts/blender/bake_true_scale_room.py`), plus dust in the lamp beam and a CSS vignette and grain.
- **Cold open:** 7.2 s. The camera comes in through the doorway, the lamp clicks on, and the name types onto the monitor. It plays once per visitor and SKIP works.

Verification results and commit hashes for all of this are in the git log and in `docs/archive/MORNING-REPORT-2026-09-23.md`.

## Owner decisions waiting (2026-09-25)

Each links to its details further down. Nothing here was chosen for you.
1. **First-load stall option** (Performance item 1): still yours to pick; untouched. The new background warm-up only compiles shaders the first render doesn't use (hands, seated body, contact casters) *after* the load settles. It doesn't change first load.
2. **Lamp and blinds** now switch without a hand reach, like the window sash (Experience sweep). Alternatives: a 57 cm lean, moving the lamp within reach, or standing up for the blinds.
3. **Mount dhruvOS in the background after load?** It would remove the ~500 ms GPU-side hitch on the first monitor entry, at the cost of loading the OS for every visitor (Performance, "Not fixed").
4. **Interaction looks that need authoring while watching them** (Experience sweep, "Not fixed"):
   - the pen's writing pose;
   - the notebook lift;
   - forearms through the desk's front edge (elbow placement in `seatedHands.js`);
   - the phone's side phase and the fanned fingers of the held phone (item 7);
   - the awards frame's size and fingertips.
5. **Cold open:** the launchpad and markers show during the arrival fly-in.
6. **Favicon:** still the Vite logo.
7. **Phone walkthrough copy** (item 8): first person, from PROJECT-MATERIAL.md facts. Edit freely.

## Open problems

The owner reported most of these after using the site. A problem marked **likely** has a suspected cause that hasn't been confirmed.

### Performance

1. **First load is very slow. The owner will choose the fix; don't pick one.** On 2026-09-24 the agent recommended option 3 below (background compile), since it's the only one that leaves the look unchanged. Measured: the main thread blocks for 14–21 s after the room appears, and `feat/v3` behaves the same.
   - A CPU profile puts about 32 s in three.js `onFirstUse`, which waits on shader compile and link on ANGLE D3D11.
   - There are 79 shader programs, lit by 5 lights of which 3 cast shadows. That's about 0.45 s per program.
   - Collapsing the environment and shadow variants made no difference.
   - Options for the owner to choose between:
     - fewer shadow-casting lights, or a cheaper shadow type;
     - fewer distinct materials;
     - compile in the background (`compileAsync` with `KHR_parallel_shader_compile`) behind the load bar.
2. **The projects lag during the walkthrough, and entering or leaving the monitor lags.** Mostly fixed: the 2+ s freezes are gone. The first monitor entry still has one ~500 ms GPU-side frame. Details below.
3. **Opening the window seems to freeze the site.** Not reproduced as a freeze: a ~200 ms hitch at the click. Details below.

**Baseline for 2 and 3, measured 2026-09-24/25 before any fix.** Tool: `scripts/profile-interaction.mjs <sit|window|enter|tour|tour-cold>`, which records a CPU profile, rAF frame gaps and long tasks on the real GPU. Setup: dev server on 4175, 1536×864 @ 1.25. React runs in dev mode on this server, so the React costs below are higher than in production.
   - **First-use shader compile of the hand rig: 2.1–2.7 s freezes.** Four programs (`Hand skin` plus three unnamed ones) compile the first time the hands are visible. Whichever comes first pays:
     - first sit: 2250 ms frame;
     - first exit from the monitor, when entered from the launchpad: 2216–2283 ms;
     - the tour's first seconds: 2149–2650 ms.
     - `getProgramInfoLog` holds 2.0–2.1 s of each. The second enter/leave cycle is smooth: max frame 83–100 ms, 0 new programs.
     - This is separate from the first-load stall: those 74–79 programs are already compiled by then. `KHR_parallel_shader_compile` is available here.
   - **First monitor entry: 450–500 ms and 267–350 ms frames**, 255–263 ms of long tasks, including 80 ms in `unlockRoomAudio`. Leaving the second time: max 83 ms.
   - **Window open: one 200–217 ms frame at the click, then 83–100 ms**, whether or not the first load had settled. No multi-second freeze reproduced in headless. The click path:
     - `startCityAmbience` creates an AudioContext (72 ms for a first context in a clean page);
     - the page re-fetches and parses `favicon.svg` (a 75 ms task);
     - the rest is 275 ms of `(program)`, native time the profiler doesn't attribute.
     - Guess, not measured: on the owner's machine a real audio device may make the AudioContext slower.
   - **Whole-tree React re-render every 300 ms:** `Scan` keeps the telemetry `stats` in state, and `WorkspaceStage` emits them every 300 ms while the loop runs. The trace shows a 28–31 ms React task about 3 times a second, even with nothing happening. Telemetry is only shown with `?debug=1` or `v3:test`, but every visitor pays for the render.
   - **Tour** (57.8 s): p50 17 ms, p95 33 ms, 33–34 frames over 50 ms, 13 over 100 ms. Worst frames:
     - the hand compile (2.1–2.65 s);
     - OS boot on entering (517–550 ms twice, then 283–300 ms);
     - leaving the monitor (367–400 ms).
   - **First-load stall (not being fixed, the owner's call):** settling took 18.4–20.6 s after the room appeared in 5 runs this session.
   - GPU cost per frame (`measure-gpu.mjs`, auto tier): 11.3 ms standing, 8.5 ms seated, 10.3 ms seated with the hands hidden. Steady-state GPU load isn't the lag.

**Fixes (2026-09-25) and the same measurements after:**
   - **Shader warm-up** (`WorkspaceStage.jsx`, `deskContactShadows.js` `warm()`):
     - What it does: once the load has settled (30 frames under 50 ms), `renderer.compileAsync(scene, camera)` compiles everything the first render skipped. It also compiles the contact-shadow caster variants (render target, shadow map off). All of it runs in parallel with `KHR_parallel_shader_compile`.
     - It finishes 0.8–1.0 s after settle and sets `data-shaders-warm="ready"`.
     - Results:
       - first sit: 0 new programs; worst frame 350 ms (was 2250);
       - first monitor exit: 367 ms (was 2216–2283);
       - tour worst frame: 567 ms (was 2149–2650).
     - The remaining ~240 ms of `getProgramInfoLog` is three.js checking each warmed program on its first draw (`debug.checkShaderErrors`). Turning that off would also change the first-load stall, which is the owner's call, so it stays on.
     - First-load settle after the change: 17.4–20.6 s, the same range as before. The warm-up starts only after settle.
   - **Telemetry isolated** (`Scan.jsx` `LiveTelemetry`): the stats go straight to the HUD, so `Scan` no longer re-renders every 300 ms. React dev time over the tour went from 1962 to 737 ms; per monitor entry/exit, from 250–340 to 55–93 ms.
   - **Pending OS app opens are queued** (`DhruvOSScreen.jsx`). A single slot dropped every app requested before the OS reported ready except the last one. See `verify-tour` below.
   - **Not fixed:**
     - First monitor entry: a 517 ms frame. The trace puts it in the GPU process: raster flushes of 130 ms and 242 ms while the OS document is first drawn, plus about 1.1 s of ANGLE worker tasks (likely Skia compiling shaders for that first raster; not confirmed).
       - A possible fix: mount the OS iframe in the background after load. That means loading dhruvOS for every visitor, which the code comment deliberately avoids. **Owner decision.**
     - Window open: still one 217 ms frame at the click (now 0 long tasks), native or GPU time. It's a hitch, not a freeze. If the owner still sees a multi-second freeze on the laptop, it wasn't reproduced here. One guess: a real audio device (e.g. Bluetooth) making the AudioContext slow.
   - **`verify-tour` flake: root cause found and fixed** (`Scan.jsx` deep-link effect).
     - Reproduced with fresh browsers (`scripts/_diag-tour.mjs`, verify-tour's first block with a 250 ms state log): a miss on run 2 of 2.
     - The first-load stall blocked the page from +0.3 s to +16.3 s after the tour started. When it cleared, the tour's 6.5 s step called `navigate('/os/crisiswatch')`, and then the stale deep-link effect for step 0's `/room/explore` ran and called `navigate('/', {replace: true})`. That replaced the newer URL, so the OS was never entered.
     - Fix: the effect still performs its link but clears the URL only while it's still that link.
     - Real visitors hit this too whenever a long stall lines up with the tour.
     - Earlier observation: `verify-tour` passed in this session's suite runs. When the tour is started cold, during the first-load stall, the key press isn't handled until the stall ends (about 14 s in the `tour-cold` run). The tour then ends at about 71.5 s, while `verify-tour` samples only to 62 s. `DhruvOSScreen` holds the only iframe on the page, so the suite's `querySelector('iframe')` isn't picking the wrong frame.

### Interactions

These were broken or made worse by the true-scale port. Its hand and camera constants were moved by one uniform seat offset, and its reach leans were halved; none of them was re-tuned while watching the motion.

4. **Résumé: fixed in `5c399d2`.**
   - The page is true letter size again. It had inherited the props' 0.625 scale, which also shrank the hand grips onto the text.
   - It's held 29 cm from the eye, readable without zooming.
   - Pick-up and put-down targets are computed from the drawer instead of old-room literals.
   - The awards frame has its own held point (`AWARD_HELD`, the old value). It hasn't been re-captured since the split.
5. **Drawer: fixed in `f790e76`.**
   - The grips are re-solved in world metres, since the drawer is scaled and the hand isn't.
   - Waypoints route the hand over the front panel and past the desk edge.
   - During the drawer beat the head leans out over the drawer (`DRAWER_HEAD`), so the upper arm no longer fills the frame.
   - New opt-in `elbowFollow` in `seatedHands.js`: the elbow goes where the hand's wrist axis points. Before it, wrists were bent 107–135° through the reach.
   - Measured with `drawerClip`: 0 skin vertices in the drawer or desk at every sampled frame. The wrist stays at 1–25° except brief 64–70° moments while the page travels between the drawer and the face.
6. **Phone speed: fixed.** The pick-up `timeScale` is gone (it was 1.55× on a first visit, 3.2× on a repeat), so pick-up and put-down now play at the same 1× pace.
   - Measured (`measure-phone-timing.mjs`, click → zoomed / Escape → desk): 2.50 s / 2.36 s on a first visit, 2.34 s / 2.36 s on a repeat. Before: 1.85 / 2.41 s and 1.17 / 2.37 s.
7. **Phone gap and roll: fixed.** Cause: the grip offsets were authored for a larger phone. The true-size phone is 7.8 cm wide, and the old top grip put the palm 12.5 cm from its centre.
   - The earlier "next idea" (a true rigid roll about the edge) was already what the first half did. The real cause: the top grip touched the phone only at its *far* edge (x = +40 mm), so any roll about the near edge lifted that contact off at once (1.8 mm → 13.6 mm within 5 % of the roll).
   - Fix, all in `WorkspaceStage.jsx`:
     - `PHONE_ROLL_IN`: a 41-knot push along the palm normal through the roll. It's solved for smoothness plus about a 1 mm gap by `scripts/probe-phone-tune.mjs` (`DP=1`).
     - The side grip sits 4 cm further up the phone (z −0.005), so the fingertips clear its top end while the hand turns under. The top grip can't move: with the phone flat, the forearm would sink into it.
     - `tunePhone` now poses the phone and body lean the way the timelines do at that grip. A probe against the already-held phone missed a 280-vertex forearm clip that only shows while the phone is flat.
   - Measured in motion (`FRAMES=48 record-motion.mjs phone final`, 96 frames): 0 skin vertices inside the phone in any frame. The gap through the roll is ≤ 4.2 mm (it was 14–16 mm). The hand path in the phone frame is monotonic, with no out-and-back. Wrist: left 6–65°, right 17–42°.
   - The 321-sample grip sweep shows 1–2 vertices inside at 2 samples. The probe measures against a sharp-cornered box, and the phone has 4 mm rounded corners.
   - Look/feel, for the owner (not changed): in the side phase (`phone-final-pickup-3-sheet.png`, 1.46–1.54 s) the phone touches the palm only along its edge, with the fingers straight, so it reads as floating beside the hand. In the held pose the fingers fan open behind the phone and the wrist sits at 65° (`phone-final-pickup-47.png`). Both predate this fix.
   - Tools: `__v3test.tunePhone(opts, grip)` (opts: top, side, back, backCurl, follow, push) and `phoneGap()` (now also logs the right wrist, the grip and the hand position in phone coordinates).
8. **Mobile demo walkthrough: done.**
   - In the phone's stage view, a text panel left of the phone says what the open app is and what to try. It changes per app: home, FocusLock, friction, hard block, Expense Tracker, BasketProof.
   - Styled like the stage chrome, not the signal colour. It's hidden below 1100 px wide, where there's no room beside the phone.
   - Copy comes from `WALKTHROUGH` in `PhoneScreen.jsx`, facts from PROJECT-MATERIAL.md only; BasketProof is framed neutrally.
   - Screenshots: `scripts/shots/walk-1536-*.png`.
   - **Owner review:** the copy is in the first person ("built for my family"), matching the tour captions. Edit freely.

### Experience sweep (2026-09-25)

Tool: `scripts/sweep-objects.mjs <tag> [ids]` clicks each desk object from the seat on the real GPU. It sweeps the action and return timelines (12 frames each, plus the held state) and captions every frame with `__v3test.handsProbe()`: per hand, the deepest skin and sleeve vertex inside the desk top (mm), vertices inside the held object's mesh boxes (loose: a handle's box holds the fingers through it, so check by eye), the wrist bend, and `T`, the reach clamp's torso shift. Sheets: `scripts/shots/motion/obj-<id>-<tag>-*`.

Metrics per object (tag `s4`, before fixes). Wrist max per hand:

| Object | Skin in desk | Sleeve in desk | Wrist L / R | Torso shift | Frames |
|---|---|---|---|---|---|
| lamp | 0 | 16 mm | 34° / **159°** | **57 cm** | `obj-lamp-s1-action-sheet` |
| coffee | 0 | 0 | 52° / 34° | 0 | `obj-coffee-s4-*` |
| award | 0 | 0 | 56° / 42° | 4 cm | `obj-award-s4-*` |
| notebook | 15 mm | 0 | 46° / 62° | 2 cm | `obj-notebook-s4-*` |
| pen | **16 mm** | 12 mm | 54° / 63° | 0 | `obj-pen-s4-held.png` |
| blinds | 0 | 0 | **144°** / 80° | **138 cm** | `obj-blinds-s2-action-sheet` |
| window | 0 | 0 | 20° / 17° | 0 | `obj-windowOpen-s4-*` |
| headphones | 16 mm | 16 mm | 45° / 45° | 0 | `obj-headphones-s3-action-03.png` |
| keyboard | 0 | 0 | 20° / 17° | 0 | `obj-keyboard-s4-*` |
| phone | 0 | 16 mm | 65° / 42° | 9 cm | `obj-phone-s4-*` |
| résumé | 0 | 0 | 52° / 80° | 0 | `obj-drawer-s4-*` |

The desk top is 35 mm thick and depth is measured to the nearest face, so 16 mm means a limb passes right through the slab.

**Fixed:**
- **Lamp and blinds: a detached arm.** The switch is 57 cm and the cord 1.38 m beyond a seated arm, and neither had a lean. The reach clamp shifted the whole torso while the camera stayed in the seat. The result: a shoulder filling the frame (lamp), an arm floating off to the window (blinds), the non-reaching hand pinned to the keyboard with its wrist at ~150°, and the sleeve through the desk.
  - Fix: they now switch the way the window sash already does, with the hands at rest and the camera glancing at the object. After: 0 torso shift, 0 desk contact, wrists 17–20° (`obj-lamp-s5-*`, `obj-blinds-s5-*`).
  - **Owner decision:** this drops the hand gesture for those two. Alternatives:
    - (a) a lean of about 57 cm for the lamp, twice the largest seated lean in the code (phone/award 27–28 cm);
    - (b) move the lamp within reach (a layout change);
    - (c) stand up and walk to the window for the blinds.
- **Awards frame re-captured** (it got its own held point in 5c399d2). The held view looked at the frame's origin, which is its bottom edge, so the "HACKATHONS" title was cut off at the top. It now looks at the held frame's centre (`awardCenter()`); the whole frame and every line are readable (`obj-award-s5-held.png`). Grip and wrists unchanged: 56° / 42° at the most, 38° / 38° held.

**Not fixed; needs the owner or a rig change:**
- **Forearms through the desk's front edge** (sleeve 16 mm deep): headphones pick-up, phone reach, lamp (before). The hands work low on the desk while the elbows sit below desk height, so the forearm passes through the front edge. It shows as a light stripe across the sleeve (`obj-headphones-s3-action-03.png`). Changing elbow placement in `seatedHands.js` touches every grip and every reviewed motion, so it wasn't done unattended.
- **Pen: the writing pose is wrong.** The hand sinks into the notebook and desk with only the thumb showing, and the pencil stands vertical above it instead of lying in the fingers (`obj-pen-s4-held.png`). The pose is derived from a writing-hand orientation (`PEN` in `WorkspaceStage.jsx`: the two direction vectors `f` and `n`) and needs re-authoring while watching the motion.
- **Notebook, held: fixed.** The held side grips were 25 cm out from the centre on a 25 cm-wide notebook, so the hands hovered about 2 cm off its sides and it floated (`obj-notebook-s4-held.png`). Measured with `__v3test.tuneNotebook(x)` and set to 19 cm: gap 1.1 / 3.6 mm, no overlap, wrists 41° / 41° (`obj-notebook-nb1-*`). The lift's side waypoint went from 29 to 23 cm to match.
- **Notebook, lift: not fixed.** At 1.23–1.48 s the notebook tips up while the open right hand is about 10 cm away, so it floats (`obj-notebook-nb1-action-sheet.png`). The right hand's pick is also 15–16 mm into the desk at 0.49–0.62 s. Both predate this session and need the pick/lift choreography re-authored while watching it.
- **Awards frame:** fingertips show below its bottom edge, and the frame reads small next to the hands. It's probably still at the props' 0.625 scale, which the résumé page was taken off in 5c399d2. A look decision.
- **Headphones:** both hands pass right in front of the camera on the way to the ears (1.50 s). The code comment says this is intended ("carry them up past the camera").

**Other surfaces** (`scripts/sweep-surfaces.mjs <tag> [coldopen,launchpad,os,deeplinks,work]`, output in `scripts/shots/surfaces/`, contact sheets `SHEET-*.png`). No page errors or console errors on any surface.
- **Every dhruvOS app opens and renders** (`SHEET-os.png`): about, terminal, projects, gallery, FocusLock, DarkSentinel, CrisisWatch, Fraud, wallpaper, contact, skills, music. Skills' tags pile at the bottom of an empty window: gravity needs Matter.js, which the embedded OS doesn't have (a known trap in AGENTS.md).
- **Palette: fixed two bugs.**
  - "res" or "resume" found nothing, because the only résumé entry is spelled with accents; matching is now accent-insensitive.
  - With few results the box still stretched to 64vh, leaving empty space; it now fits its contents (`v3-palette-res.png`).
- **`/room/<object>` deep links, opened cold on the dev server, did nothing.** React StrictMode runs the mount effect twice, and the second `handleSelect` toggled the object straight back off.
  - Production worked with the original code (1 cold run on the 4176 preview); it only affected dev, where every review happens.
  - Fixed: the effect is keyed by `location.key`, and the select waits for the seat to reach the stage instead of a fixed 400 ms timer that could fire right after a stall.
  - `verify-deeplinks` has no `/room/<object>` case; checked with a probe, cold and warm, on dev and prod.
- **/work:** renders and loads no three.js (`v1-work.png`).
- **Cold open, a look question for the owner** (`SHEET-coldopen.png`): the launchpad (name plus six options) and the Monitor/Phone markers are on screen for the whole arrival fly-in, from 1.2 s. The first-load stall also blocks the page during the fly-in: the screenshots show a 14.7 s gap.
- **Favicon:** still the default Vite logo (`public/favicon.svg`). It needs an owner-supplied mark.

### Test suite

- `verify-phone-grip` passes (exit 0) since `11eb21f`. Before that, its skin-clipping assertion failed.
- `verify-tour`'s OS-open failures were a real bug, not lag; fixed in `e0cd47e` (see Performance above). Afterwards: 3 of 3 suite runs and 8 of 8 fresh-browser diagnostic runs passed.
- `verify-focuslock-app` (not in `run-suites.sh`) still fails as before. Run on 2026-09-25: 13 PASS, then it times out waiting for friction step `breathing` → `delay` (line 218). The test sets `__phoneTimeScale = 20`, so breathing should end in 600 ms, and the friction effect's deps look stable. Cause not found; not investigated further.
- `verify-v3` failed once on 2026-09-25 with two "503 Service Unavailable" console errors. It passed 41/41 on an immediate re-run and on every other run; probably a live-data service, but the URL wasn't logged.
- `verify-deeplinks` has no `/room/<object>` case.
- `verify-held-objects` and `verify-reduced-hands` exit 0, but `run-suites.sh` counts 0 PASS lines for them, so they only prove the script ran.
- The suites check state, not feel. A green run proves nothing about how an interaction looks or how fast it is. Every interaction change needs a frame sequence reviewed by eye, including the wrist angle (see below).

### Tools for tuning interactions (added 2026-09-24)

- **`scripts/record-motion.mjs <resume|phone> <tag>`** (with `BASE=http://localhost:4175`):
  - Real-GPU frame sweeps of a whole timeline, plus a contact sheet per phase, with a per-frame probe in the captions.
  - It slows the timeline rather than pausing it, because a paused timeline stops the render loop.
  - `FRAMES=48` samples more densely (phone only). Sheets are split 16 frames each (`…-pickup-sheet`, `…-pickup-2-sheet`, …).
- **`scripts/probe-phone-tune.mjs`:** phone grip sweeps through `tunePhone`. Pass an options array for one compact row per option set; `DP=1` re-solves `PHONE_ROLL_IN`.
  - Never return a GSAP timeline from `page.evaluate`: serialising it takes about 150 s.
- **`scripts/probe-drawer-tune.mjs [timeline | grid <t> <json>]`:** parameter sweeps through `__v3test.tuneDrawerHandle`.
- **`scripts/measure-phone-timing.mjs`:** wall-clock phone pick-up and put-down.
- **`__v3test` probes:**
  - `drawerClip()`: skin in each drawer part, skin in the desk, gap to the handle, and wrist angles for both hands.
  - `phoneGap()`.
  - `tuneDrawerHandle(opts)`, `tunePhone(opts, grip)`.
- **Lesson:** a zero-clip frame can still show a wrist bent 90°. Log `wristDeg` for both hands and look at every frame.

## Not built yet (approved, lower priority than the problems above)

- Monsoon chai moment by the window (second cutscene).
- Depth of field in cutscenes; bloom (too costly on the iGPU so far).
- Sound design beyond the rain layer.
- Mocap or realistic rigged hands. Whether the MetaHuman licence allows use outside Unreal is unverified; ask the owner to run a deep-research pass.
- Bake source for `?hands=authored` in the true-scale room.
- Dead v1/v2 directories under `src/`. Deletion is approved; the agent's permission settings blocked it.

## Owner decisions on record

- **Monitor and phone:** each project runs as its real UI, built from its own repo with simulated data. Phone apps run on the phone, web apps on the monitor.
- **Room:** bare walls, awards on the desk. The notebook is a blank page you draw on.
- **Project order:** all projects shown, ranked by depth. FocusLock, Expense Tracker and Basket Price lead.
- **Copy rules:**
  - Basket Price is framed neutrally: no scraping or terms-of-service talk.
  - CrisisWatch is framed around its fixed-model constraint, never as a poor design.
- **Never fabricate** links, metrics or evidence.
- **Parked:** a per-project case-study page (undecided).
- **Scoped out:** AI chat (needs a paid key), multiplayer presence.
- **Still open:**
  - a downloadable résumé PDF (`public/resume.pdf` + `contact.resume`);
  - a deploy host and domain (`og:image` is relative until then).

## Reference docs

- [DESIGN.md](DESIGN.md): the UI design system and scene art rules.
- [ASSET-REGISTER.md](ASSET-REGISTER.md): licences and provenance for every asset.
- [PROJECT-MATERIAL.md](PROJECT-MATERIAL.md): verified facts about each project, for copy.
- `docs/archive/`: superseded plans, reviews and prompts. Historical only; don't follow them.
