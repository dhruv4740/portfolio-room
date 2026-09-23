# Sonnet round 2 report

## Commits
- `f8800d3` — test(room): measure sky wall luminance and clipping per state
- `0b4ca31` — fix(room): day and dusk light the room like their time of day
- `b2c65d3` — fix(room): frame the window and make opening it visible
- `19b6594` — fix(room): keep city ambience in step with the window
- (this file) — docs: sonnet round 2 report

Note: `scripts/verify-v3.mjs` already read `process.env.BASE || 'http://localhost:4173'` at HEAD, so the "let verify-v3 target any preview origin via BASE" commit was not needed and was skipped.

## Files changed
- `scripts/measure-sky.mjs` — new: measures wall luminance/highlight-clip share per sky state, seated and orbit screenshots.
- `src/v3/desktop/buildWorkspace.js` — `SKY_CONFIGS.day`/`.dusk` hemisphere + key-light intensities raised; added per-state `windowLight` base intensity; `keyConfig.windowLight` plumbed through `setSky`.
- `src/v3/desktop/buildRoomInteractions.js` — window sash meshes biased forward in z (in front of the blind slats); `blindsGroup` exposed on the returned object; `windowLight` intensity now reads the sky state's configured base instead of a hardcoded `0.55`.
- `src/v3/desktop/WorkspaceStage.jsx` — `windowOpen` prop threaded through `state.current`; `roomAction`'s `windowOpen` branch now targets `windowIntent` instead of `1 - state`, no-ops if already at target, and adds a bounded blind-sway GSAP tween on open only.
- `src/v3/desktop/cityAudio.js` — added `isCityAmbiencePlaying()`; exposes `window.__cityAmbience.playing()` in dev or when `localStorage['v3:test']==='1'`.
- `src/v3/desktop/Scan.jsx` — `windowIntent` ref replaces reading `dataset.windowOpen` to decide audio; `handleSelect('windowOpen')` gates on `actionState`, distinguishes a real click from WorkspaceStage's own completion echo (via `activeId !== id`), and self-corrects a desync after settle; `onSit` restarts audio if the window is open.
- `scripts/verify-room-interactions.mjs` — added `localStorage['v3:test']='1'`; added window open/close pixel-diff assertion; added the five Job 3 audio-sync assertions.

## Commands run

```
BASE=http://localhost:4174 node scripts/verify-v3.mjs
```
```
PASS  scan: return restores marker focus — Monitor — FOUR SKETCHES · READY
PASS  scan: repeated entry retains app state — 1 decoded card(s)
PASS  scan: escape from inside returns to room — room
PASS  scan: escape exit restores marker focus — Monitor — FOUR SKETCHES · READY
PASS  scan: no console errors — clean
PASS  touch: serves the deck — deck=1
PASS  touch: does NOT serve the scan — stage=0
PASS  touch: no console errors — clean

36/36 passed
```

```
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
```
```
PASS audio test 3: close -> silent
PASS idle audio test 4: window open before stand/sit
PASS audio test 4a: stand up -> silent
PASS audio test 4b: sit -> playing
PASS idle audio test cleanup: window closed
PASS idle headphones on
PASS idle coffee empty
PASS idle award reading
PASS idle live monitor typing
PASS all room controls, depletion, cold/warm keyboard, no page errors
PASS sky=day loaded without page errors
PASS sky=dusk loaded without page errors
PASS sky=night loaded without page errors
```

```
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
```
```
phone idle 0
focuslock passed
extension passed
notebook idle 0
notebook returned []
```
(No error lines; script has no explicit "PASS all" line — 8 lines is its full output.)

```
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```
```
{"skyState":"night","wall":0.36354906073936916,"clipped":0,"errors":[]}
{"skyState":"dusk","wall":0.4247995150884547,"clipped":0,"errors":[]}
{"skyState":"day","wall":0.5905688671295606,"clipped":0,"errors":[]}
```

## Sky measurements
Rectangle used: `x 5%–22%, y 30%–55%` of the seated screenshot (left wall above the lamp) — confirmed on `sky-seated-day.png`; no adjustment needed.

| state | wall before | wall after | clipped after |
|---|---|---|---|
| night | 0.3635 | 0.3635 (unchanged) | 0 |
| dusk | 0.3540 | 0.4248 | 0 |
| day | 0.4023 | 0.5906 | 0 |

Checks: day.wall (0.5906) ≥ 1.6×night.wall (0.5817) ✓ · night.wall×1.15 (0.4181) ≤ dusk.wall (0.4248) ≤ day.wall×0.85 (0.5020) ✓ · both clipped ≤ 0.02 ✓ · night unchanged ✓ · day key `#fff4e0` is R≥G≥B, B/R=0.878≥0.85 ✓ · dusk key `#e48652` is R>G>B, B/R=0.36≤0.6 ✓ · monitor text legible in `sky-seated-day.png` (checked by eye) ✓.

## Final light values

| state | hemi sky/ground/intensity | key colour/closed/open/position | windowLight |
|---|---|---|---|
| night (unchanged) | `#8294b2` / `#21160e` / 0.42 | `#8eadd8` / 1.15 / 1.60 / `[2.1,3.6,-2.7]` | 0.55 |
| dusk | `#8d7a8d` / `#3a271c` / 2.2 | `#e48652` / 1.75 / 2.2 / `[2.1,3.3,-2.7]` | 0.7 |
| day | `#a8c8e8` / `#4a453a` / 3.6 | `#fff4e0` / 2.3 / 2.9 / `[2.3,4.1,-2.6]` | 0.9 |

Hemisphere-intensity multipliers came out large (dusk 4.8×, day 8.6× night) because ACES Filmic tonemapping at exposure 1.5 compresses ambient contribution heavily; wall luminance rises much slower than the raw intensity value. Verified empirically via `measure-sky.mjs` rather than reasoned from first principles.

## Night unchanged
```
   night: {
     hemi: { sky: '#8294b2', ground: '#21160e', intensity: 0.42 },
     key: { color: '#8eadd8', closed: 1.15, open: 1.60, position: [2.1, 3.6, -2.7] },
+    windowLight: 0.55,
   },
```
Only addition is the new `windowLight: 0.55` field, which reproduces the previously hardcoded `0.55*state.windowOpen` constant used in `buildRoomInteractions.js` — functionally identical output for the night state. `measure-sky.mjs` confirms wall luminance unchanged (0.3635 → 0.3635) and `toneMappingExposure` (1.5) was not touched.

## Window visibility
Measured changed-pixel share (max channel diff > 12) over the window/blind region (`x 78%–100%, y 0%–62%` of the seated frame) between closed and open: **31.4%** (≥ 3% required).
Screenshots: `scripts/shots/window-closed-night.png`, `scripts/shots/window-open-night.png`.

Deviation on region definition: rather than projecting `WORKSPACE.anchors.windowOpen` through the camera's projection matrix from the Node/Playwright side (which would require re-implementing or exposing three.js camera math to the test harness), I used a fixed screen-space rectangle empirically confirmed to bound the window/blinds in the default seated frame at 1440×1000 with `reducedMotion:'reduce'`. The measured diff share (31.4%) is well clear of the 3% threshold, so this substitution does not put the assertion at risk of a false pass.

## Audio sync
All five Job 3 acceptance checks passed in `verify-room-interactions.mjs`:
1. Click WINDOW once → `windowOpen==='1'` and `playing()===true`. **PASS**
2. Click WINDOW, click again 80 ms later → second click gated by `actionState!=='idle'` (ignored outright); after settle, `windowOpen` and `playing()` agree (both true in the observed run). **PASS**
3. Click WINDOW to close → `windowOpen==='0'` and `playing()===false`. **PASS**
4. With window open, STAND UP → `playing()===false`; SIT → `playing()===true`. **PASS** (both sub-steps)
5. Zero idle frames after each settle (reused existing `idle()` helper) and zero page errors (`assert.deepEqual(errors,[])` at the end). **PASS**

Design note: WorkspaceStage's own completion callback (`finishExtra` → `onAnchorSelect(id)`) re-invokes the same `handleSelect` function used for real clicks, with `dataset.actionState` already reset to `'idle'` by the time it runs — so an `actionState`-only gate cannot distinguish a genuine click from this internal echo. I additionally gate on `activeId !== id`: a real click always occurs while `activeId` is `null` (the panel/action is idle), whereas the echo always fires while `activeId === id` (it's the call that resets `activeId` back to `null`). This is the mechanism that prevents the round-1 bug (audio being stopped immediately after opening, by the auto-close echo re-running the toggle logic).

## Deviations
- The `windowLight` consumption line in `buildRoomInteractions.js` (a 1-line change, conceptually part of Job 1) is committed together with Job 2's sash/blindsGroup changes in `b2c65d3` rather than with the Job 1 sky commit — git merged the adjacent hunks in that file and splitting them required more surgery than the gain justified. Functionally correct either way; noted for the record.
- `scripts/verify-room-interactions.mjs`'s Job 2 (window-visibility) and Job 3 (audio-sync) test additions are both committed in `19b6594` (the audio commit) rather than split across `b2c65d3`/`19b6594` — the diff hunks were contiguous (git merged them into one insertion block) and splitting would have required manual patch surgery for no functional benefit.
- Window-region rect for the visibility assertion is a fixed empirical screen-space box rather than a live projection of `WORKSPACE.anchors.windowOpen` through the camera (see "Window visibility" above).
- `WorkspaceStage.jsx`'s diff in `b2c65d3` includes the one-line `target=state.current.windowIntent?1:0` change, which is really Job 3's concern (it's what makes `windowIntent` authoritative instead of `1-state`) — it lives in the same `roomAction` block as Job 2's sway/no-op-if-already-there logic and could not be cleanly separated without splitting a single `if` block across two commits.
- Did not attempt to add `pngjs` or any other new dependency for `measure-sky.mjs`'s pixel analysis (per constraints); instead decode via `page.evaluate` + `Image`/`canvas`, driven from a `Buffer.toString('base64')` screenshot (not `page.screenshot({encoding:'base64'})`, which returns a `Buffer` regardless of the `encoding` option in the installed Playwright version and silently broke `page.evaluate` argument serialization when passed directly).

## Requests for the orchestrator
None — no changes were needed outside `src/v3/desktop/**`, `scripts/verify-room-interactions.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs`, or `docs/review/sonnet-round2.md`.
