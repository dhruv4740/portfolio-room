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
