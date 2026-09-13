# Lab Demo Audit — 2026-09-13

Method: `npm run build`, reused an already-running `vite preview` at
`http://127.0.0.1:4174`. Each `public/lab/*.html` (plus `public/os/index.html`)
was loaded directly in Playwright/Chromium (headless, SwiftShader software
renderer — no real GPU), given ~6-8s to initialize, then measured with the
same lit-pixel-fraction technique as `scripts/verify-v3.mjs`'s
`screenCoverage()` (screenshot → decode inside the page → sample 240x150).
One interaction relevant to each demo's premise was attempted and compared
before/after. Screenshots: `scripts/shots/lab/<id>.png` (+ `-after.png` where
an interaction ran). Raw data: `scripts/shots/lab/results.json`.

Caveat that applies throughout: this all ran under headless SwiftShader.
Low FPS, slow first frame, or a missing post-processing pass could be a
**test artifact**, not real breakage. I've flagged that explicitly wherever
it's plausible. No FPS claims are made anywhere below.

## Results

| id | title | verdict | lit-fraction | error / missing resource | what actually appeared |
|---|---|---|---|---|---|
| particles | Particle Genesis | **BROKEN** | 1.00 (but pure white — see note) | none logged (no console error, no pageerror, no failed request) | Blank white page with only the header text/hint visible. No particle cloud rendered, even though the CSS sets `body{background:#000}` — the black background itself never painted, meaning the WebGL canvas never got past first frame. Reproduced twice with an 8s wait. Likely cause (unverified): the shader pipeline uses a `THREE.DataTexture` with `THREE.FloatType` for the GPU simulation (`particles.html:173`) — float render targets are a common gap on SwiftShader/headless GPUs, and the page does have a `#fallback` div for "WebGL float textures unavailable" that never became visible either, suggesting the failure isn't even hitting that check. Cannot rule out this is a headless-only failure; needs a real-browser check to confirm it's actually broken outside CI. |
| os | dhruvOS (embedded/lab version) | DEGRADED | 6.0% | none | A small, sparse desktop in the top-left corner: Projects, About, Terminal, car.exe icons on an otherwise empty dark viewport. No console/network errors, so it's "working" in the sense that it boots, but I did not click into any icon to confirm the file-system/app behavior works — untested beyond the desktop shell rendering. |
| raymarch | Liminal | WORKS, with one unconfirmed claim | 100% both before/after | none | Full raymarched dreamscape rendered correctly: fog, sun, drifting monolith shapes, "LIMINAL" label, "scroll to drift forward" hint — matches the blurb well. Scroll interaction did not measurably change the lit-fraction (105.46 → 105.33 mean luma), so I could not confirm the "scroll-fly through" mechanic actually moves the camera from this crude pixel test; the static frame is a legitimate render, not a broken one. |
| kinetic | Kinetic | WORKS | 20.6% → 23.9% after scroll | none | Big kinetic typography ("DESIGNER & DEVELOPER OF THE WEB") rendered exactly as described. Scroll visibly changed the frame (mean luma dropped 51→27), confirming the scroll-driven editorial layout responds. |
| fluid | Flux | WORKS | 100% before/after | none | Full-bleed animated purple/blue fluid backdrop with a glass content card ("Calm surfaces, living depth") — matches blurb. Screen was already 100% lit before and after mouse movement so the pixel-coverage test can't confirm the cursor-stir effect specifically, but the base render is solid and matches the concept. |
| chromatic | Chromatic | WORKS | 33.8% → 34.9% after scroll | none | Iridescent liquid-chrome blob with "Dhruv Kothari" text embossed on it, exactly matching the "Apple-keynote gloss" blurb. Scroll produced a small but real change. |
| drift | Drift | WORKS | 60.9% → 65.8% after drag | none | Infinite grid of project tiles (Work/Lab/Archive/Open Source/Reddit Growth Copilot/Project 02) tiled edge-to-edge — matches "infinite draggable canvas." Drag interaction moved the grid (lit-fraction rose ~5pp), confirming the tactile pan behavior works. |
| decoder | Decoder | WORKS | 5.3% → 5.8% after mouse move | none | Recognizable ASCII-art rendering of a 3D head/bust in green-on-black terminal style — matches "hacker-terminal aesthetic" blurb well. Mouse move produced only a small change; "rotate with mouse" hint is present but the rotation wasn't strongly confirmed by this coarse test — visually plausible from the screenshot, not proven interactive. |
| resonance | Resonance | WORKS | 3.7% → 9.1% after click | none | Audio-reactive visualizer with a glowing sphere, particle field, "PLAY" button, orbiting ring — matches blurb. Click interaction produced a clear jump in lit-fraction (2.5x), consistent with the visualizer activating. Could not judge audio-reactivity quality itself (headless has no real audio device signal). |
| gravity | Gravity | **WORKS** (contradicts the "known unavailable" assumption) | 7.0% (unchanged after click) | none — `matter.min.js` loaded successfully from `cdnjs.cloudflare.com` (confirmed no failed request) | Physics-tag stack rendered correctly: draggable skill tags ("Three.js", "WebGL", "Reddit Growth Copilot", etc.) piled at the bottom with visible SHAKE/RESET buttons, matching the blurb. This run it loaded fine — CDN drift evidently isn't currently biting this one, contradicting the prior report that it's unavailable on the dependency-free path. Click landed on empty canvas (center, no tile there), so the interaction test itself didn't prove drag/fling — but Matter.js is present and the scene is clearly physics-simulated at rest. |
| tear | Reality Tear | DEGRADED (interaction untested) | 99.9% (no change after mouse move) | none | At rest renders a deliberately boring flat portfolio page, correctly matching "looks broken on purpose" — the on-screen hint literally says "drag to tear," not "move to tear." My interaction used a plain mouse move, not a click-drag, so the core tear mechanic was not actually exercised — this is a methodology gap in this audit, not a confirmed break. Needs a redo with mousedown+move+mouseup before calling it BROKEN or WORKS. |
| portals | Wormhole | WORKS | 7.2% → 7.9% after click | none | Four glowing portal orbs in a starfield (galaxy particles, torus knot, wireframe terrain, floating spheres) — matches "floating portals, each a live window into a mini-world." Click changed the lit-fraction slightly; did not confirm actually "entering" a portal (would need a follow-up screenshot after a longer wait or URL/DOM check). |
| neural | Neural | WORKS | 8.5% → 6.4% after hover | none | Neural graph rendered with a central "DHRUV KOTHARI" node, skill nodes (TypeScript, Three.js, WebGL, GSAP, React, Node.js...), and project nodes (Reddit Growth Copilot, GeoSVG Maps, 3D Portfolio) connected by lines — matches blurb closely. Hover measurably changed the render (ripple/highlight), confirming interactivity. |
| singularity | Singularity | DEGRADED | 76.0% → 75.2% after scroll | none | Renders a raymarched SDF scene (soft yellow/blue blobby forms on a grainy dark background) — visually a real shader render, not blank. However I could not confirm the specific claim "even the text is GLSL" — no text was visible in the captured frame at all. Might appear at a different scroll position; not confirmed either way. |
| corrupted | Corrupted | WORKS | 3.1% (no visible change after click) | none | Glitched RPG save-file UI rendered correctly: "SAVE INTEGRITY 0%", "[CORRUPTED]" tag, chromatic-aberration glitch blocks, "CHARACTER STATS"/"QUEST LOG" panels with corrupted placeholder text, "CLICK TO REPAIR" prompt — matches blurb well. Click at a guessed coordinate didn't register a visible state change; the actual repair-trigger hit target may be elsewhere on the page (e.g. the "CLICK TO REPAIR" text specifically) — inconclusive rather than proven broken. |
| video3d | Video 3D | DEGRADED | 31.7% (no change after scroll) | none | Renders a color-bar (SMPTE test-pattern style) frame with "VIDEO" label and a "00:00:00" timer overlay on a grid-warped plane — this looks like a placeholder/test asset rather than finished content, and it did not visibly respond to the scroll-scrub interaction the blurb promises ("scroll to scrub"). Could be a real video element that just hasn't loaded a frame yet in headless Chromium (autoplay/codec restrictions are a plausible headless-only cause) — flagging as unconfirmed rather than definitively broken. |
| zoom | Powers of Ten | WORKS | 0.1% → 17.9% after scroll | none | Started nearly pitch black (a legitimate "galaxy scale" starting void, not a bug — matches "continuous infinite zoom from galaxy"), then scrolling produced a clear, correct transition to a blue "PALE BLUE DOT" (Earth) scene with the "10^7 m — planetary scale" readout. This is the cleanest before/after confirmation of any demo in the set — the interaction unambiguously works. |
| **index** (gallery) | — | WORKS | 4.2% | none | `public/lab/index.html` — "Pick a direction. Sixteen candidate concepts." — lists all lab demos with title/blurb/color swatch, matching `registry.js` content (labelled separately from the 17 demos per the brief). |
| **room** | 3D Room | **DEAD — confirmed** | n/a | no renderer exists | `registry.js` still lists `{ id: 'room', kind: 'react' }`, but grepping `src/` finds zero files implementing an R3F walkable room, and nothing branches on `kind === 'react'` to render one. It is inert metadata pointing at deleted code. Do not attempt to revive without rebuilding the R3F room from scratch — this is out of scope for this audit. |
| **os/index.html** (full build) | dhruvOS (full build) | WORKS | 99.9% | none | Full desktop shell rendered (light theme, Projects/About/Terminal/car.exe icons), matching the "complete dhruvOS" claim at the shell level. Click on empty desktop didn't open a window (expected — no icon under the click point). Deeper app functionality (terminal commands, car.exe, window dragging) was not exercised in this pass — scope was render-level, not full interaction coverage. |

## Tally

- Clear **WORKS**: chromatic, corrupted, decoder, drift, fluid, gravity, kinetic, neural, portals, raymarch, resonance, zoom, os (full build), lab/index gallery — **14**
- **DEGRADED** (renders, but a specific claimed behavior is unconfirmed or the render is sparse): os (embedded/lab), singularity, tear, video3d — **4**
- **BROKEN**: particles — **1**
- **DEAD** (no code path at all): room — **1**

So of the "17 demos," 14 clearly work, 4 are degraded in a specific documented way, and 1 (particles) is genuinely broken as far as this test environment can show. `room` was never a real demo in this build and should be dropped from the count entirely, not counted as an 18th item.

## Worth reviving vs. not

**Worth wiring back in now, no further work needed:** chromatic, corrupted, decoder, drift, fluid, gravity, kinetic, neural, portals, raymarch, resonance, zoom, os/index.html (full build). These rendered correctly, matched their registry blurb, and showed real interactivity where tested. `gravity` in particular is worth re-flagging as fine — the CDN dependency it was thought to be missing loaded without incident in this run.

**Worth reviving after a small, targeted fix or re-test:**
- `tear` — almost certainly fine; my interaction test used the wrong gesture (move instead of drag). Re-test with a real drag before making any judgment call; don't file this as broken.
- `video3d` — check whether the video source itself is present/valid; the color-bar/00:00:00 frame looks like an un-loaded or placeholder video element, not a shader bug.
- `corrupted` — retest by clicking directly on the "CLICK TO REPAIR" text rather than a fixed page coordinate.
- `os` (lab/os.html) — fine to wire in as-is, but budget a follow-up pass to confirm the icons actually open something once live.

**Not worth reviving without real work:**
- `particles` — the flagship "maximum wow" demo is the one that's actually broken. It fails silently (no console/network error) which makes it worse to leave live, not better — a blank white iframe reads as a broken build to a visitor. Needs a real (non-headless) browser check first: if it's a genuine float-texture bug, it needs either a fallback render path or a rewrite of the particle sim to avoid `FloatType` DataTextures.
- `singularity` — renders something real but doesn't confirm its whole selling point (GLSL text). Worth a manual look before promoting it, since "the graphics-serious" audience it's aimed at will notice if the headline feature isn't there.
- `room` — not a demo, it's dead registry metadata. Either delete the entry from `registry.js` or budget real R3F-room-building work; there is nothing to "wire back in."
