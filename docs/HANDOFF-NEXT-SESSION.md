# Handoff — next Claude Code session

Written by Opus, 2026-09-21, at the owner's request. Start here, then read
`docs/TEAM-COORDINATION.md` for ownership and `docs/STATE.md` for the ledger.

Branch `feat/v3`, local only, nothing pushed. Working tree clean at handoff.

## What this project is, in one paragraph

A 3D portfolio: a night studio room you arrive in, sit down at, and use — a
monitor that opens a real desktop OS with working project demos, a phone, a
notebook you can draw in, blinds, a lamp. It works end to end. The open work is
that it does not yet look as good as it should, and two specific things look
wrong.

## The three live problems, in priority order

### 1. Hands read as fused, melted paddles

**Evidence and full diagnosis: `docs/reviews/OPUS-HANDS-AND-REACH.md`.**

Three separate findings, do not conflate them:

- The **authored** BAMEN retarget was the *default* for every visitor, against
  four documents that call it opt-in. Fixed in `0e79071` — one line. It is now
  reachable only with `?hands=authored`.
- The authored surface is matte (base roughness **1.0**, no specular) and
  carries 42% of the procedural triangle count. Both are Codex's to fix.
- **The procedural surface is also fused**, and that is the one the owner is
  actually seeing now. Cause traced to `6a13047`, which raised the smooth-union
  blend radius from a uniform 3 mm to 6 mm (thenar pad) and 12 mm (forearm).
  Proven by swapping `dd85216`'s baked `hands-v1.bin` back in and rendering:
  **37,780 triangles with separated fingers, versus 75,860 today with merged
  ones.** Crops in `scripts/shots/hands/crop-{old,current}-bake.png`.

**Critical gotcha:** `handSurface.js:46` returns early when the baked `.bin`
loads. The implicit-union code below only runs on fetch failure. Editing blend
constants there changes **nothing** at runtime — `scripts/build-hand-assets.mjs`
must be re-run and both `.bin` and `.bin.gz` regenerated.

### 2. The whole upper body shifts when you pick things up

`seatedHands.update()` translates the torso whenever a wrist exceeds
`REACH = 0.575 m`, and that translation is an unconstrained 3D vector — **Y
included**. `buildSeatedFigure.setUpperBodyOffset()` applies it to the torso
vertices.

Measured in the live room: **not one interactive anchor is within reach.** The
window is 3.267 m from the shoulder and lifts the body **+0.486 m**; the drawer
drops it 0.197 m. At rest the torso already sits 23 cm forward.

Introduced by `11a2bce` — before that, `update()` was just
`hands.forEach(updateHand)` and no torso translation existed.

**I checked whether adopting the true-scale room fixes it. It does not** —
0 of 15 anchors are in reach there either; the excess roughly halves. The
contract itself puts the home row 0.72 m from the shoulder midpoint, past a
fully extended arm. Two independent fixes are proposed in the review doc: move
the contract's shoulder forward to ~z=0.62, and constrain the vertical
component of `torsoOffset` (or rotate the shoulder instead of translating the
torso).

### 3. Unverified: "the lighting was better before the assets"

The owner recalls this. **Not tested.** Bracketing commits and a suggested
bisect are in the review doc's last section. Do not assert it either way
without shooting frames.

## The big decision that is still open

The **true-scale room candidate** is built, rendered, corrected — and not
adopted. `cinematicLayout.js`, `buildCinematicWorkspace.js`,
`cinematicRoomInteractions.js`, `cinematicSpeakerDetails.js`. Its return shape
matches the live builder key for key (32/32, checked mechanically), so adoption
is an import swap **plus** reworking world-space hand kinematics in the same
edit. That is why it has not happened. Full mapping table and limits:
`docs/reviews/OPUS-ROOM-COMPOSITION.md`.

The live room is ~1.6× human scale with several true-scale props on it, which
is the root of problem 2 and of the "toy on a giant desk" look.

## Ownership — read before editing

| Owner | Files |
|---|---|
| Codex | `seatedHands.js`, `handSurface.js`, `handAppearance.js`, `handAssets.js`, `buildSeatedFigure.js`, `build-authored-hands.mjs`, `build-hand-assets.mjs`, plus the adoption decision |
| Opus | Live scene integration outside those, asset integration, docs, sole local Git writer |
| Gemini | Offline research only. No code, no commits. |

Only one line of a reserved file has been changed (the hands default), with the
owner's explicit instruction, and it is committed on its own as `0e79071` so it
can be reviewed or reverted in isolation.

## Rules that bite

- **Never commit to main.** Branch `feat/v3`. Conventional Commits, subject
  under 72 chars.
- **One build/browser/GPU slot.** Claim it in `TEAM-COORDINATION.md` *before*
  using it, release it after. The doc has been wrong about slot state twice.
- **Real ANGLE D3D11 is mandatory for any visual claim.** Headless software
  rendering makes `perfGovernor` rate the machine 'low' and shadows vanish, so
  a SwiftShader frame is shadowless and flat and every lighting defect read off
  one is an artifact. Launch with
  `{ channel: 'chromium', args: ['--use-angle=d3d11','--ignore-gpu-blocklist'] }`.
- **Build success is not visual acceptance.** Look at the screenshots.
- **rAF is not GPU time.** Use timer queries for cost claims.
- Never return a GSAP timeline from `page.evaluate` — it is a thenable.
- Do not delete owner downloads under `art/`, or touch `.claude/`, `resume/`,
  `scripts/probe-*.mjs`.

## How to run things

```bash
node scripts/review-cinematic-room-geometry.mjs
```

Offline, no GPU, no server — 36 checks over the room contract and sightlines.

For anything visual, start the dev server on **4173** (`.claude/launch.json`
has `dev` and `preview` entries), then:

```bash
BASE=http://localhost:4173 node scripts/review-hands-compare.mjs
```

Other harnesses, all `BASE=`-driven: `review-hands-probe.mjs` (materials,
failed requests, reach table), `review-hands-crop.mjs` (tight hand crop,
`NAME=` and `HANDS=`), `review-cinematic-room-shots.mjs` (five comparison
frames), `review-cinematic-room-sky.mjs` (one frame per sky state),
`review-cinematic-room-checks.mjs` (sill, parapet, entry power).

`scripts/review-cinematic-room.html` is a standalone review entry served by the
dev server; it is under `scripts/` so the Vite build never sees it. Its `hands`
parameter is shared with `handSurface.js`: `hands=1` shows the figure with the
authored surface, `hands=procedural` with the procedural one, absent hides it.

## Known-broken, pre-existing

`verify-v3` and `verify-after-hours` fail on clicks that trigger a route
change. Reproduced at `f1b9aa9`, before any of this work. Not caused by it, not
fixed by it.

A single 404 appears on the first navigation of a fresh browser session and
never again. Every asset reports `ready`; logging all responses shows zero
failed requests. Not chased.

## Assets and licensing

Resolved this session: the keyboard is **CC BY 4.0 by ZxTulz** and the chair
**CC BY 4.0 by FordVFX** — Gemini's finding, independently confirmed against
the Sketchfab API (name, author, licence URL, face and vertex counts all
match). Both were blocked for two passes on missing evidence.

The keyboard had been shipping since `a50730a` with no attribution, which CC BY
does not permit. Credited in `public/asset-credits.txt` in `e9b1d52`. **If the
chair is ever reinstated it needs the same.**

Not independently reproduced: Gemini's claim that the local FBX is vertex-for-
vertex the same file as that Sketchfab listing. It would need Blender.

Gemini also delivered sourced real-world prop dimensions in
`docs/reviews/GEMINI-PROP-DIMENSIONS.md` — useful for checking the procedural
props, which are carried at a flat 0.625 scale and were never individually
measured.

## Suggested first move

Ask the owner which they want first: the hands rebuild (problem 1, needs Codex
and an asset rebake) or the room adoption (needs Codex and the hand kinematics
in one edit). They block on the same person. Everything Opus can do without
Codex on these two has been done.
