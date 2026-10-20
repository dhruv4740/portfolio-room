# Performance audit (measurement only)

Branch `perf/lighten-room` (cut from main d003949, live). 2026-10-20. Sections 1-5
are the Round 1 measurements of main d003949; Round 2 (below) fixes and re-measures.
The A/B flags used are temporary local patches and are not in the tree. Scripts: `scripts/perf-audit/{cold,steady,arrival}.mjs`
(raw JSON goes to the git-ignored `scripts/shots/perf/`).

**Rig:** Windows laptop, AMD "Radeon Graphics" iGPU (governor tier `mid`), headless
Chromium on d3d11, 1536x864 at DPR 1.25, production build served by
`vite preview`, empty cache and `--disable-gpu-shader-disk-cache`. Single runs
unless stated; load times carry roughly +-0.7 s noise, steady GPU roughly
+-0.2 ms. "4x" is CDP CPU throttle, a proxy for battery saver, not a measurement
of it. Real battery saver also lowers GPU clocks, which this rig does not model.

## Headline

1. **Cold load is ~65% shader linking, not download.** At 1x CPU the room reveals
   at 12.6-13.3 s; 8.2-8.7 s of that is the main thread blocked inside
   `getProgramParameter` (program link) for 72 programs. Download is done by
   ~2.2 s (4.6 MB model/bins, 2.2 MB images, 378 KB JS).
2. **Shadow-casting is the load cost.** With shadow maps off: 37 programs, reveal
   4.45 s (vs 13 s). Any single caster still gives ~72 programs (the count is
   binary) but link time falls to ~6.4-6.9 s. Shadows are visible, so this needs
   the owner.
3. **At night the site freezes ~25 s.** 117-118 programs, canvas first visible at
   ~25-27 s. `captureProbe()` (cube probe + PMREM) sets `scene.environment`,
   which forces ~46 extra env-variant programs to link synchronously on the first
   frame after the gate. With the probe disabled at night: 72 programs, reveal
   ~12.3 s. The site follows IST, so many evening visitors get this path.
4. **Window/city, pen, notebook, hands: none matter.** Load and steady-state
   deltas are inside noise (table below). Removing them would not help.
5. **Typing:** every key costs a ~50 ms synchronous hand-pose search; the first key
   freezes ~0.9 s because it boots the OS iframe (which includes PNG-encoding the
   wallpaper, `toDataURL` ~0.6 s).

## Round 2: fixes and results (commit 904cd82)

**Root cause of the slow load.** three r184 deprecates `PCFSoftShadowMap`: on the first
shadow render it logs a warning and switches `shadowMap.type` to `PCFShadowMap`.
`shadowMapType` is part of the program cache key, so every program the warm-up gate
built with `compileAsync` (type 2) did not match what draw time asked for (type 1).
Draw time then linked a second set synchronously, one at a time (125-290 ms each).
Fix: set `renderer.shadowMap.type = THREE.PCFShadowMap` up front. Look is unchanged
(three was already rendering PCF; frame diff vs main below). Found by diffing the
program cache keys; the earlier `glassReflection` theory was wrong.

Invisible fixes in the commit:
- shadow type set up front (above): programs 72 to 38 dusk, 118 to 65 night;
- night probe captured inside the warm-up gate (`afterHours.warmProbe`), so the env-map
  variants link in parallel behind the loader;
- typing: `skinKeyClearance` skins each bone once per call and skips vertices outside
  the keys' footprint, same maths;
- OS iframe pre-boots 3 s after reveal, in idle time;
- wallpaper encoded once via `toBlob`, cached.
The lamp-flip warm pass and removing the per-material loop were tried and dropped
(no gain), the loop stays as a safety net.

### Cold load, main vs this branch (1x and 4x CPU, single runs, +-0.7 s noise)

| Sky | CPU | main reveal / canvas | main programs | now reveal / canvas | now programs |
|---|---|---|---|---|---|
| dusk | 1x | 12.0 / 12.1 s | 72 | **4.4 / 4.7 s** | 38 |
| dusk | 4x | 21.5 / 21.8 s | 72 | **12.2 / 12.5 s** | 38 |
| night | 1x | 12.2 / 26.7 s | 118 | **10.7 / 10.9 s** | 65 |
| night | 4x | 22.1 / 41.3 s | 118 | **19.9 / 20.2 s** | 65 |

Night 10.7 s is still ~6 s slower than dusk: the env-map variants of 27 more programs.
Steady-state seated GPU/CPU per frame is unchanged vs main (9.0-9.7 vs 8.6-9.4 ms
GPU on this run's machine state; within noise).

### Typing (warm, 41 keys through `typeProbe`, same keys on both builds)

| | main | now |
|---|---|---|
| keydown handler median | 50.8 ms | 29.6 ms |
| 41-key probe total | 2552 ms | 884 ms |
| long tasks while typing 6 s | 26 (1578 ms) | 0 |
| first key long task | 799 ms | 182 ms |
| poses (fingertips, wrist, finger dip) | | max delta 0 mm, 0 deg, 0 deg |

A ~550 ms rAF gap on the first key remains (profile: native "(program)" time, no
new programs). **Cause not isolated.**

### Pixel check vs main (landing, sit-down, seated, looking at keys, typing; dusk + night)
Mean abs diff 0.01-0.04 / 255 for every frame that is not mid-motion. The mid-motion
frames (sit-down first frame, typing frames) differ only by animation timing.
Sheets: `scripts/shots/perf/sheets/identity-{dusk,night}.png` (git-ignored).

### Fewer shadows and baked lighting

**Decision (owner-approved): real-time shadows are off** (`renderer.shadowMap.enabled=false`, lights keep `castShadow` so it is a one-line revert). Checked held phone, notebook, resume, lamp and typing at night, current vs off: mean diff <=0.04/255, nothing loses grounding (`scripts/perf-audit/held-frames.mjs`, sheets `shadows-held-night.png`, `shadows-typing-night.png`). **Lightmaps stay** (owner declined dropping them). Measurements below were taken before the switch.

Measured on the fixed build. Reveal at 1x, seated GPU at pixel ratio 1.25 (night sky
default at run time; baseline 9.5-9.7 ms).

| Option | Reveal dusk / night | Programs dusk / night | Seated GPU | Frame diff vs now |
|---|---|---|---|---|
| now (3 casters) | 4.6 / 10.3 s | 38 / 65 | 9.5-9.7 ms | |
| spot shadow off | 4.1 / 10.4 s | 38 / 65 | 8.95 ms | not rendered (tiny gain) |
| moon shadows off (keep spot) | 3.9 / 10.1 s | 37 / 64 | 7.6 ms (-2.1) | 0.01-0.02 / 255 |
| all shadows off | 3.8 / 9.8 s | 37 / 64 | 7.3 ms (-2.3) | 0.01-0.03 / 255 |
| baked lightmaps off | 3.8 / 9.9 s | 34 / 57 | 10.0 ms (no gain) | dusk 0.01; night landing 4.5, seated 2.1 |

Findings: after the program-mismatch fix, shadows cost only ~0.6-0.8 s of load but
the two moon shadow maps cost ~2 ms per frame. In the poses compared (landing,
seated, looking at keys, dusk and night) turning the real-time shadows off is not
visible; the contact shadows and lightmaps carry the look. Dropping lightmaps saves
~0.8 s and 4-8 programs, no frame time, and is visible at night. Baking the static
shadows was not attempted because there is nothing visible left to bake. Not tested:
shadows from moving objects held up to the lamp, rain/weather states.
Sheets: `scripts/shots/perf/sheets/{nomoon,noshadow,nobake}-{dusk,night}.png`.

### Round 2 caveats
- Single runs; load noise +-0.7 s or more (a prior configuration ranged 11.5-22 s).
- cold.mjs reveal times are rAF-detected; the program series and long-task totals are
  more reliable.
- `scripts/perf-audit/frames.mjs` makes the sheets; `typeprobe.mjs` compares poses.

## 1. Cold first load (empty cache)

| Sky | CPU | Launchpad in DOM | Room revealed | Programs | Link blocking | First quiet main thread |
|---|---|---|---|---|---|---|
| dusk (default at test time) | 1x | 1.1-1.2 s | 12.6-13.3 s | 72 | 8.2-8.7 s | 12.7-12.9 s |
| dusk | 4x | 7.8-8.2 s | 26.6-27.2 s | 72 | ~8.2 s | 48-50 s |
| day | 1x | | 11.3 s | 72 | | 11.3 s |
| night | 1x | | event ~11-12 s, canvas visible ~25-27 s | 117-118 | ~21-24 s | ~26 s |

- Launchpad is in the DOM at ~1.2 s but the main thread is blocked (300-800 ms
  lag per second) until the reveal, so it is not interactive earlier. All
  10.6-10.9 s of long tasks fall before the reveal.
- Split at 1x dusk (measured): download ~2 s overlapped; **shader link ~8.5 s**;
  JS ~0.5 s; startup, bake and material setup ~1.2 s. Static scene: 142 meshes,
  108 draw calls, 103k triangles. 5 lights, 3 shadow casters (spot 512 map, two
  directional 1024 maps), reported as "5/3 shadow".
- At 4x the link time does not grow (GPU/driver bound); JS, parsing and download
  absorb the extra. The 26.6-27.2 s reveal looks like the 20 s warm-up cap firing
  (stage start ~8 s + ~19 s). **That is inferred, not verified.**
- After reveal at 4x the governor drops to pixel ratio 0.8 (median 34-41 ms).
- The warm-up gate runs `compileAsync` then one hidden render per material. The
  per-material renders link serially. *Guess, untested:* programs three builds at
  draw time are not covered by `compileAsync`, so they link one at a time.

### A/B at load (1x, dusk)

| Variant | Reveal | Programs | Link | Verdict |
|---|---|---|---|---|
| baseline | 13.1-13.3 s | 72 | 8.7-9.0 s | |
| window/city hidden | 12.7 s | 71 | | noise |
| pen hidden | 12.6 s | 72 | | noise |
| notebook hidden | 12.4 s | 72 | | noise |
| hands hidden | 12.4 s | 72 | | noise |
| contact shadows off | 12.2 s | 70 | | -2 programs, ~noise |
| all shadows off | **4.45 s** | **37** | 0.25 s | dominant |
| spot shadow off | 11.8 s | 72 (71 in a re-run) | 7.7 s | -1.3 s |
| directional shadows off | 11.0 s | 71 | 6.9 s | -2.1 s |
| spot only casting | 10.0 s | 71 | | |
| moon only casting | 10.6 s | 72 | | |
| baked lightmaps off | 10.8 s | 64 | 6.7 s | -2.3 s, -8 programs |
| dust off, grade off | 12.7 s / 14.0 s | | | noise |
| pixel ratio 0.8 / 1.0 | 12.1 / 12.2 s | | | noise (link cost is not resolution-bound) |
| night, probe off | 12.3 s | 72 | 7.9 s | removes the night freeze |
| night, probe + shadows off | 3.6 s | 37 | | |

City audio and rain: the old city GLB is skipped (`status.city='skipped'` on the
cinematic room); the window city is a procedural group. Rain exists only in
weather states and was not on in these runs. City audio start was not measured.

## 2. Steady state (60 Hz, constant)

Pixel ratio pinned at 1.25. The room renders at 60 Hz continuously even when idle
(`tick` marks dirty every frame in the room phase).

| Scenario | fps | GPU median | GPU p95 | Render CPU | Main-thread busy |
|---|---|---|---|---|---|
| standing idle | 60.3 | 7.7 ms | 8.2 | 3.3 ms | 26% |
| standing, looking around | 59.1 | 7.8 ms | 8.5 | | 39% (one 83 ms gap) |
| seated idle | 60.2 | 7.2 ms | 7.6 | 2.9 ms | 23% |
| seated, looking around | 59.9 | 7.2 ms | 9.5 | | 37% |
| typing, warm (6 s) | 52 | 6.4 ms | 7.9 | 2.6 ms | 54% |

At 4x throttle the seated room holds ~40 fps (about 25 ms of main-thread work per
frame), so a slow CPU is the limit, not the GPU.

### Per-subsystem A/B, seated idle, pixel ratio pinned 1.25

| Variant | GPU median | Render CPU | Programs | Delta GPU |
|---|---|---|---|---|
| baseline (two runs) | 7.21 / 7.11 | 2.9 | 73 | |
| all shadows off | 5.89 | 2.2 | 37 | **-1.3 ms** |
| directional shadows off | 5.80 | 2.6 | 72 | **-1.4 ms** |
| spot shadow off | 7.00 | 2.8 | 73 | -0.2 (noise) |
| contact shadows off | 7.19 | 2.2 | 70 | 0 GPU, -0.7 ms CPU |
| hands hidden | 7.04 | 2.8 | 73 | noise |
| pen hidden | 7.14 | 2.8 | 73 | noise |
| notebook hidden | 7.09 | 2.7 | 73 | noise |
| window/city hidden | 6.80 | 2.9 | 73 | -0.4 |
| dust off | 7.21 | 2.8 | 73 | 0 |
| grade/vignette off | 7.45 | 2.8 | 73 | noise |
| lightmaps off | 7.17 | 2.8 | 65 | 0 |

Two ~1.3 ms savings exist (the 1024 moon shadow passes), nothing else is above
noise. The room is not GPU-bound on this machine at 7 ms; the 60 Hz constant loop
costs main-thread time (23-39% busy) that matters most on a throttled CPU.

## 3. Typing lag (CPU profile of 6 s of keystrokes)

- **First key:** 892 ms long task, frames drop to 18 fps, 966 ms max gap. The
  profile of that window shows `toDataURL` 605 ms (PNG-encoding the wallpaper
  when the OS iframe boots, `public/os/apps/wallpaper.js:115`); it is absent
  once warm. The OS iframe mounts lazily on the first key (`typeKey` through
  `setLiveMonitor`). Measured, not a guess: second round of typing has no
  `toDataURL`.
- **Every key (warm):** the keydown handler takes 50-57 ms (median), up to 90 ms.
  Profile self time over 6 s: `applyBoneTransform` 630 ms, a Scan chunk function
  (`Zo`) 524 ms, `multiplyMatrices` 249 ms, i.e. ~1.4 s of 6 s. From reading the
  code this is `skinKeyClearance` in `handContact.js`, called ~26 times per press
  (2 passes x (4 digits + 9 bisection steps)), each looping skinned vertices
  across every key box. The match between the code and the profile is strong, but
  I did not isolate the function by name because the build is minified.
- Each key also starts a gsap hand animation that renders every frame; render
  count is ~540 per 6 s versus ~360 idle.

## 4. Arrival-intro cost (~25 ms/frame in the old handoff)

**Not reproduced.** Fresh session (no `v3:arrival-seen`) versus seen, first 14 s
after reveal, pixel ratio pinned: 60 fps and 17 ms gaps from second 3 onward in
both; GPU median 7.47 vs 7.26 ms. The only difference is the first ~3 s: one
150 ms gap and one 114 ms GPU frame in the fresh run (83 ms gap and 13 ms GPU in
the seen run, which is the seat transition). At 4x: ~40 fps steady in both; first
4 s are 12-26 fps in both (fresh: 12-26; seen: 14-36 with a 417 ms gap), so the
seat/launchpad transition costs about the same either way. The `.arrival-cue`
never appeared because the test clicked "explore room" at ~2 s, which probably
cancelled the intro. A per-frame cost during an uninterrupted arrival (no click)
is **untested** here; the ~25 ms figure might still exist there.

## 5. Ranked proposals

| # | Change | Expected gain | Visual cost | Owner OK? |
|---|---|---|---|---|
| 1 | Night: do the probe capture inside the warm-up gate (or avoid the extra env-variant programs) | removes ~14 s freeze after reveal at night (canvas visible ~25 s becomes ~12-13 s or better) | none if only moved; look may change if programs are dropped | moving: no (invisible); dropping env programs: yes |
| 2 | Make `compileAsync` cover the draw-time variants / compile in parallel | unknown; could cut a large part of 8.5 s link (guess) | none | no (try, measure) |
| 3 | Shadows: bake static shadows, or one caster only | one caster: ~-2 s load, no program saving; none: 13 s to 4.5 s, 72 to 37 programs, -1.3 ms/frame | visible | **yes** |
| 4 | Idle render loop: 30 Hz or demand-driven when nothing moves | cuts ~23-39% main-thread busy; helps battery saver | none when static, risk of visible stutter if wrong | yes (motion) |
| 5 | Typing: cache or coarsen `skinKeyClearance` search; pre-boot the OS iframe off the critical path; encode wallpaper once (or `canvas.toBlob`/ cached) | -50 ms per key (~1.4 s per 6 s of typing); removes ~0.9 s first-key freeze | none if poses stay identical | no if poses are identical, yes if they change |
| 6 | Lightmaps (`nobake`): defer or drop | -2.3 s load, -8 programs | visible | **yes** |
| 7 | Directional (moon) shadow maps 1024 to 512 | ~-0.5 to -1.3 ms/frame (guess for the split) | soft shadow edges | **yes** |
| - | Remove window/city, pen, notebook | none measurable | visible | not worth asking |

## Not measured / caveats

- Real battery saver (GPU clock limits) and other GPUs; this rig is one iGPU.
- Real network (served from localhost); download time on a slow link is additive.
- City audio start cost, window-open hitch (~200 ms in older notes), first monitor
  entry (~500 ms in older notes): from earlier docs, not re-measured.
- Rain and weather states.
- Steady-state per-subsystem A/B was only run seated, one run each.

## Round 3 (perf/lighten-room)

Shipped: adaptive 60/30 Hz pacing (0ff0340), cached typing hand plan (9ff2049),
dust + vignette/grain overlay removed (d92b336), window interaction, city view,
notebook, pen and drawer removed (e194178), résumé sheet on the desk (face175).
Suites: 13/13 verify scripts pass after face175 (verify-room-interactions had one
transient failure in a batch run and passed on rerun).

Not shipped, no reliable data: AA off, pixel ratio 1.0 while moving, Physical to
Standard material, fewer lights, skipping the night env probe, contact shadows
off, telemetry re-render at 300 ms. The A/B rig was throttled (most runs
discarded as "window hidden or rAF throttled"). Thin data only: AA off gpuMed
7.19 ms vs base ~7.8-8.6 ms; Standard material 7.74 ms (no gain). Pixel ratio
and telemetry re-render were never run.

Open: the dropped frame on a single keystroke (suspects: deskContactShadows
re-capture, instanceMatrix upload, key-cap material switch, monitor texture
update) is unsolved; look-around choppiness at 60 Hz was not reproducible.
