# Handoff

The single source of truth for status, open problems and what to do next.
Operational rules (commands, invariants, traps) are in [AGENTS.md](../AGENTS.md).
Last updated 2026-09-24.

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
2. **The projects lag during the walkthrough, and entering or leaving the monitor lags.** Not measured yet.
   - The "3D loop keeps rendering behind the dhruvOS iframe" theory is unlikely: `Scan.jsx` passes `paused` while the screen is `preparing` or `inside`, and the loop stops when paused. The code confirms this; it hasn't been measured.
   - Other suspects: the load stall, or the flights into and out of the screen.
   - Measure with `scripts/measure-gpu.mjs` and a CPU profile before changing anything.
3. **Opening the window seems to freeze the site.** Not reproduced yet. Likely causes: a shader recompile when the window light turns on, or starting the city audio. Profile the click.

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
8. **Mobile demo:** the phone-apps demo has no walkthrough text. Only the guided tour has captions. Not started.

### Test suite

- `verify-phone-grip` fails its skin-clipping assertion. This predates 2026-09-23.
- `verify-focuslock-app` times out on the friction step. This also predates it.
- `verify-tour` failed its OS-open step ("opens Fraud" or "opens CrisisWatch") in 4 of 5 runs on 2026-09-24, including a run with no source changes. It's no longer an occasional flake, and it may be the walkthrough lag (item 2) showing up. Cause unknown.
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
