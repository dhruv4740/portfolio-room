# Opus — cinematic room composition candidate

Written 2026-09-20 in response to `docs/PROMPT-OPUS-ROOM-COMPOSITION.md`.
Environment-only study. Hands and the seated figure are built but **hidden**;
nothing here is an acceptance of the final scene.

**Nothing live was edited.** No live import was switched and no reserved file
was touched.

> **Read in two parts.** Everything up to "Honest limits" is the offline study,
> written while the build/browser/GPU slot was still Codex's — arithmetic only,
> no render. **"Render pass — 2026-09-20" at the end of this file is newer**:
> the slot was released after Codex's hand checkpoint `11a2bce`, the candidate
> was rendered, three defects the arithmetic could not see were found and
> fixed, and the frames exist. Where the two disagree, the render pass wins.

## What exists now

| File | What it is |
|---|---|
| `src/v3/desktop/cinematicLayout.js` | The shared physical contract as named exports, plus the keycap transform and the sightline arithmetic. Single source of truth; no other file restates a dimension. |
| `src/v3/desktop/buildCinematicWorkspace.js` | The replacement builder. Returns the live builder's object **key for key (32/32, checked mechanically)**. |
| `src/v3/desktop/cinematicRoomInteractions.js` | Metre-scale candidate copy of `buildRoomInteractions.js`, same returned shape. The live file is untouched. |
| `scripts/review-cinematic-room-geometry.mjs` | Offline review harness. No GPU, no browser, no dev server, no Vite change. |

No live import was switched. `buildWorkspace.js` still runs the app.

Run the harness with:

```bash
node scripts/review-cinematic-room-geometry.mjs
```

It currently prints **all checks passed** (24 checks). Note what that does and
does not mean: the harness imports `cinematicLayout.js` and checks the contract
values against each other and against the camera. It does **not** import the
builder, so it cannot catch a value the builder fails to place. Both defects
found in review below live in exactly that gap and were found by reading the
helper source, not by the harness.

## The contract, as built

Every value is authored at true scale. The root group is never scaled, so the
props that are already 1.0× — phone, Poly Haven task lamp, licensed mouse,
licensed keyboard — keep their real size and only move.

| Element | Contract | As built | Note |
|---|---|---|---|
| Desk | 1.80 × .80, X=0 Z=−.05, top .740, 35 mm | same | thickness not scaled |
| Mat | ~.75 × .40, top .749 | .75 × .40, centre (.02, .14) | centre chosen so the front edge lands at z = .34, inside the desk's .35 |
| Keyboard | centred X=0 Z=.17, home-row top .785, ~.44 m wide | X=0 Z=.17, **.44 m**, home-row top **.78592** | see the fit problem below |
| Monitor display | .66 × .37125, centre [0, 1.085, −.30] | same, 16:9 confirmed | `WORKSPACE.screen` *is* the clickable plane; no parallel literal |
| Seated camera | [.05, 1.23, .83] | same | eye sits .490 above the desk top (real 0.47–0.52) |
| Shoulder midpoint | [.05, 1.10, .82] | exported as `BODY.shoulderMidpoint` | |
| Seat top | ~.45 | .45 | chair authored around it |
| Ceiling | ~2.6 | 2.60 | interior 3.60 × 2.50 in plan |

## Concrete fit problem, and the value I propose changing

The contract's two keyboard numbers cannot both hold with the keyboard asset as
exported. Measured from `scripts/blender/prepare_keyboard.py` and the live
builder, not recalled:

- `KEY_TOP` = 1.2375 is the home-row cap top; the chassis origin (its own
  underside) is placed at 1.19723. **Board height, underside to home row =
  40.27 mm** at the exported .48 m case width.
- The felt mat top is 1.174, so the board currently **floats 23.2 mm above the
  mat** in the live scene. That is a contact defect, not a design choice, and
  this candidate removes it by seating the board on the felt.

At .48 m wide, a board seated on a .749 mat puts the home row at .78927
(+4.3 mm over the contract). Scaling it uniformly to the contract's .44 m width
scales its height too and puts the home row at **.78592 — 0.9 mm over .785**.
That near-exact agreement is the evidence that .785 was derived from a .44 m
board, so the .44 m scale is adopted.

**Proposed revision: `home-row key top Y = 0.78592`, not 0.785.** It is a 0.9 mm
change and it is what the asset actually reaches. Both numbers are exported so
the residual is visible rather than buried:

```
KEYBOARD.homeRowTop          0.78592   derived, what the geometry reaches
KEYBOARD.homeRowTopContract  0.785
KEYBOARD.homeRowTopResidual  0.00092
KEYBOARD.removedLiveFloat    0.02323   the float this candidate deletes
```

The 92 caps are **transformed, not re-exported**: order, count, per-row Y
offsets, 1u widths and the escape flag are preserved exactly, so
`instanceId → KEY_ROWS → setKey` and the `authoredKeyboard` geometry swap stay
valid. The uniform .9166667 scale is baked into the instance matrices, and the
chassis gets the same scale in `onReady` (the helper takes no scale parameter
and is reserved, so it was not edited).

## Window visibility, proved by arithmetic rather than claimed

The slot is held, so the acceptance criterion "window to the right of the
monitor must be visible from the fixed seated camera" is settled numerically
instead of by screenshot. All figures below are printed by the harness.

From the seated camera at [.05, 1.23, .83], at the window wall plane z = −0.90:

- The monitor enclosure's right edge grazes **x = 0.5085**. Anything left of
  that is occluded by the monitor.
- The right edge of the 56° frame (16:9) reaches **x = 1.8366**.
- The aperture is **x 0.62 → 1.50**, so it sits inside that band with
  **111 mm** of clearance past the monitor and **337 mm** of frame to spare.

Vertically the frame covers wall y 0.005 → 1.8835. The opening is 0.95 → 2.10,
so **0.9335 m of the 1.15 m opening is in shot** and the sill is in frame. The
top 0.216 m of the opening is above the frame; that is deliberate head-room, not
an error.

## Room depth: warm centre, cool reveal, dark edges

Three exterior depths, placed against the sightline cone (`sightlineAt()` in the
layout module), not by eye:

| Layer | Placement | Why |
|---|---|---|
| Foreground | sill at .95 with a 22 mm snow ledge lapping the reveal | the near value in the window, inside the room |
| Near parapet | centre [1.40, 0.10, −2.60], top y = **0.62** | the cone floor at that depth is **0.7315**, so it no longer occludes the view. It was repositioned, not deleted — it still reads when you look down through the glass and from the overview. |
| Middle distance | modelled block, centre [3.30, 1.50, −6.50], 1.80 × 5.00 | inside the cone, and it covers **53%** of the cone width — a real building with sky beside it, not a wall |
| Far | one skyline texture plane at z = −11, 11 × 10 m | large enough to cover the whole cone at that depth; checked |

No new luminous rectangles were added as a substitute for depth. The night
skyline gradient was re-graded darker at the top so the far layer stays the
low-contrast one and the modelled block carries the near contrast.

Lighting keeps the existing structure — one shadow-casting cool key through the
window, a warm task pool at the desk, screen spill, no fill in the corners. No
new effects, no post pass.

## Joinery and framing

- Window jambs and rails **30 mm** (live room: 65 mm), mullion **18 mm** (live:
  34 mm). Frame is **8.9%** of the opening width in total. The live sections at
  this opening size are what read as prison bars.
- Blinds were **inspected, not deleted**: 22 slats at a **52 mm** closed pitch
  and a 50 mm slat (real venetian is 25–50 mm), against the live room's 11
  slats at 145 mm, which is a louvre grille rather than a blind. `blindsGroup`,
  the open/closed cord control and the two-pose depth-material shadow bake all
  survive; the depth shader's `rowOffset` now follows the new pitch difference.
- Sill is a real slab lapping 60 mm into the room with the snow ledge on top.
  Desk legs are a trestle inset 60 mm from the ends with a foot rail and a rear
  stretcher.

### Two helpers that do not follow the desk

`createAuthoredTaskLamp` derives only **Y and Z** from `desktop`; its clamp
**X is hardcoded to the live room's −1.28** (`authoredTaskLamp.js:11`). With
this desk that resolves to (−1.28, 0.740, −0.44): Z lands correctly on the rear
edge, but X is **380 mm past the desk's left edge at −0.90**, so on load the
lamp would jump from the fallback into mid-air — and it is the warm anchor of
the whole composition, in the hero frame. The helper is reserved during the
hand repair, so the builder corrects the mount X after the call, the same
caller-side pattern used for the keyboard chassis scale. Its screw offset is
genuinely fine: it is tied to desk thickness, which stayed at 35 mm. The
harness now asserts the clamp is on the desk.

`createSpeakerDetails` is **not called**. Its driver fronts are authored in
absolute world coordinates for the live room's .18 × .28 × .16 cabinets at
(±.955, 1.305, −.45). At true scale the cabinets are .11 × .175 × .10 at
(±.80, .828, −.30), so the geometry neither lands nor fits — a root transform
cannot fix it. A cinematic driver set is owed; the speakers are plain cabinets
in this candidate.

`createAuthoredMouse` and `createAuthoredCeilingFixture` are fully
parameterised and need no correction.
- Glass opacity dropped .22 → .18 and the pane is still `depthWrite: false`: a
  restrained reflection, not a mirror.

## Integration mapping for Codex

The old → new transform is **not one scale factor**. Architecture moves to true
scale; 1.0× props only translate. Use these directly:

| Quantity | Live value | Cinematic value |
|---|---|---|
| Desk top Y | 1.165 | **0.740** |
| Mat top Y | 1.174 | **0.749** |
| Keyboard centre (x, z) | (0, .28) | **(0, .17)** |
| Keyboard chassis origin Y | 1.19723 | **0.749** (seated on the felt) |
| Home-row cap top Y | 1.2375 | **0.78592** |
| Cap centre x span | −.2185 … .2100 | **−.2003 … .1925** |
| Cap centre z span | .2166 … .33954 | **.1119 … .2246** |
| Screen centre | [0, 1.79, −.362] | **[0, 1.085, −.30]** |
| Screen size | 1.28 × .79 | **.66 × .37125** |
| Seated camera | [.05, 1.72, 1.16] | **[.05, 1.23, .83]** |
| Chair origin | [.05, 1.08, 1.414] (back) | **[.05, 0, .86]**, seat top .45 |
| Mouse anchor | [.37, 1.174, .30] | **[.30, .749, .17]** |
| Phone anchor | [−.80, 1.174, −.03] | **[−.28, .749, .02]** |
| Ceiling | 3.12 | **2.60** |

Per-cap Y for the hand pass is
`0.749 + (y_live − 1.19723) × 0.9166667`, and the same scale applies to X and Z
about the keyboard centre. `CINEMATIC_KEYCAPS` exports the finished positions,
so nothing needs to recompute this.

Adoption is an import swap in `WorkspaceStage.jsx` plus hand kinematics:
`seatedHands.js` drives pose in world space and `POSES`/`HAND_REST` encode reach
in metres, so they must move in the same edit. That is Codex's call and is why
the hands are hidden here.

## Honest limits

- ~~**No frames were rendered.**~~ **Superseded — the frames exist.** The slot
  was released after Codex's hand checkpoint and the render pass is written up
  below. The original bullet read:
  The prompt names comparison frames as a
  deliverable and they are the one thing not delivered, because the slot is
  Codex's. When it transfers, the two shots to take are the fixed seated night
  view at [.05, 1.23, .83] looking at [0, 1.085, −.30], and the overview at
  [−1.32, 2.02, 1.52] looking at [.18, 1.00, −.42], both exported from
  `CAMERA` in the layout module. Everything else in this report is arithmetic
  that does not need a GPU, so the study is not inert without them.
- **No bake exists for this room.** `bakedMaterials` is still produced and its
  `uv1` is now parameterised from `ROOM.interior` instead of the live room's
  hardcoded 5 × 3.12 × 3.9 extents, so a future bake will map correctly. If the
  current bake is loaded against this room for a preview it is **temporary and
  wrong**, and must be labelled as such. `afterHours.js` would need a new bake
  and new probe positions.
- **Rendered, inspected, not profiled.** Superseded in part by the render pass
  below: the builder has now run in a real ANGLE D3D11 browser and the draw
  call and triangle counts are measured (85/89,749 seated, 101/100,713
  overview, against the live room's 74/89,227 and 91/104,401). GPU frame time
  is still unmeasured — no timer queries were run, and rAF is not GPU time.
- **The seated figure is untouched and hidden.** `buildSeatedFigure` and
  `seatedHands` are imported and built so the return shape and
  `setHandsVisible` survive; they will not fit this room until the hand pass
  lands.
- **`setSky` is not at parity with the live one.** It applies hemisphere colour
  and intensity, key colour and the `keyConfig` values from `SKY_CONFIGS`, but
  it deliberately does **not** apply `cfg.key.position` — those are live-room
  coordinates and would throw the key light outside this room. Dusk and day
  therefore keep the night key's direction. A cinematic key-position set per sky
  state is owed.
- **The blinds' open-pose depth shader changed.** The rotation is now derived
  from `openTilt − closedTilt` and `rowOffset` follows the new pitch difference,
  but the live shader's Z term (`z += rowOffset*0.218230`) was dropped and only
  Y is offset. That changes the open-blinds shadow map and only a render will
  show whether it matters.
- **`afterHours.js` swaps in a winter-city GLB** at the live room's scale
  (`scene.add(city); model.city.visible = false`). It would land wrong here and
  needs its own placement pass alongside the bake and the probes.
- **The procedural props** (mug, frame, drawer, pencil, headphones) were
  modelled for the old room and are carried at a `PROP_SCALE` of 0.625 on their
  groups rather than remodelled. The mug at that scale is ~92 mm across, which
  is a real mug; the others were not individually measured against reality.
- **Reserved files were not touched**: `WorkspaceStage.jsx`, `seatedHands.js`,
  `handSurface.js`, `handAssets.js`, `handAppearance.js`,
  `build-authored-hands.mjs`, `buildSeatedFigure.js`, `authoredKeyboard.js`,
  `keyboardLayout.js`, `buildWorkspace.js`, `buildRoomInteractions.js`. The new
  builder imports several of them read-only, which is why the keyboard chassis
  is scaled from the caller rather than by adding a parameter to the helper.
- Licences unchanged: no asset was re-exported, re-scaled on disk or moved. No
  new art was written under `art/` or `public/models/`.

## Not claimed

This is a composition study of one room at one time of day. No comparison is
made or implied to any shipped game's rendering.

---

# Render pass — 2026-09-20, slot held

The build/browser/GPU slot was released to Opus after Codex's hand checkpoint
(`11a2bce`). Everything below this line is new: the candidate has now been
rendered, inspected, corrected against what the frames showed, and re-rendered.
Still environment-only — hands and the seated figure are hidden.

## Harness

| File | What it is |
|---|---|
| `scripts/review-cinematic-room.html` | Standalone entry. Builds either room into a bare scene with `WorkspaceStage.jsx`'s exact renderer settings and shoots from the `CAMERA` export. Lives under `scripts/` so `vite build` never sees it — the build's only input is `index.html` — while the dev server still serves it. No Vite config change, no app route. |
| `scripts/review-cinematic-room-shots.mjs` | Renders the five comparison frames. |
| `scripts/review-cinematic-room-probe.mjs` | World bounding boxes and contact gaps against the desk plane. |
| `scripts/review-cinematic-room-names.mjs` | Lists named objects, to confirm a claimed object is actually in the scene. |

Two things the harness does deliberately:

- **Real ANGLE D3D11** (`channel: 'chromium'`, `--use-angle=d3d11`). Headless
  Chromium's software rasteriser makes `perfGovernor` rate the machine `low`
  and shadows switch off, so a SwiftShader frame is flat and every lighting
  defect read off one would be an artifact of the harness.
- **Polls the four authored GLBs' `state.status`** instead of sleeping a fixed
  timeout, so a fallback box is never photographed and then reported as a
  defect. All five frames report `keyboard/mouse/taskLamp/ceilingFixture` =
  `ready`.

```bash
npm run dev                                                   # terminal 1
BASE=http://localhost:5174 node scripts/review-cinematic-room-shots.mjs
```

## Frames

In `scripts/shots/cinematic-room/`, 1600 x 900, night, `setEntryPower(1)`:

| Frame | Camera |
|---|---|
| `cinematic-seated-night.png` | [.05, 1.23, .83] to [0, 1.085, -.30] |
| `cinematic-seated-night-blinds-open.png` | same, `roomActions.state.blinds = 1` |
| `cinematic-overview-night.png` | [-1.32, 2.02, 1.52] to [.18, 1.00, -.42] |
| `live-seated-night.png` | live room's own seat, [.05, 1.72, 1.16] to [0, 1.42, -.37] |
| `live-overview-night.png` | live room's own overview |

The live pair is the before. It is what the prompt describes: the monitor fills
the frame edge to edge, the blinds are heavy dark sections at the right, and
there is no room behind any of it. The candidate pair has a desk that reads as
a desk, a window with three depths in it, and dark quiet edges.

**Measured cost**, `renderer.info.render` after the assets land:

| | draw calls | triangles |
|---|---|---|
| cinematic seated | 85 | 89,749 |
| cinematic overview | 101 | 100,713 |
| live seated | 74 | 89,227 |
| live overview | 91 | 104,401 |

Ten more draw calls than the live room at the same triangle budget. The
expectation recorded before the render ("cost should be comparable") held. GPU
frame time is still not measured.

## Three defects the frames found, and the fixes

All three were invisible to the offline geometry harness, which checks the
contract against itself and never imports the builder. Each was confirmed with
a world bounding box before and after, not by eye.

### 1. The ceiling fixture is a factory pendant in a 2.6 m room

**Measured:** the Poly Haven asset exports at 0.550 x 0.888 x 0.550 m, sized
for the live room's 3.12 m ceiling. Hung unchanged from a 2.60 m one its
underside lands at **y = 1.699** — below standing head height, directly over
the desk's front edge — and it swallowed the top third of the overview frame.

This is the same class of bug as the task lamp's hardcoded clamp X, and it was
missed for the same reason: `createAuthoredCeilingFixture` takes no scale
parameter, so the asset silently kept live-room proportions.

**Fix:** `CEILING_FIXTURE_SCALE = 0.625` in `cinematicLayout.js`, applied by the
builder to the fixture's mount — the same caller-side pattern already used for
the keyboard chassis and the lamp clamp, since the helper is not edited here.
The asset is added as the mount's child and inherits it, and its origin is the
top of the chain, so the fixture stays pinned to the rose. Shade now 0.343 m
across with its underside at **2.033 m**. The fallback pendant hangs off `root`
rather than the mount and was already short enough to leave alone.

### 2. The headphones floated 45 mm over the desk

**Measured:** `minY 0.7853` against a desk top of `0.740`.

The cinematic copy of `buildRoomInteractions` had lifted the band and both
earcups to local `y = 0.115` — the band radius — instead of the live file's
`0`. The contact on a pair lying flat is the underside of the cups.

**Fix:** every part sits at local `y = 0.0425`, half a cup, so the cup
undersides land exactly on the anchor plane. Now `minY 0.740`, gap `0.0000`.
Worth noting for whoever does the live room's own scale pass: **the live room
has the opposite residual** — its parts sit at local `0` but its anchor is
raised 75 mm, so its headphones float 32.5 mm clear of the desk.

### 3. The award frame sank 6.5 mm into the desk

**Measured:** `minY 0.7335` against `0.740`.

The kickstand was the inherited 0.300 length, which is solved for an untilted
frame. `AWARD_REST` tilts the whole group by -0.12 rad, and that swings the
strut's foot backward and down through the desk.

**Fix:** two parts. The strut length is re-solved for the tilted case (0.256),
and then the group is lifted by whatever its measured world box still leaves
below the anchor plane. The second half is the durable part: measured rather
than solved per-part, so the frame cannot sink again if the rest pose or the
kickstand angle is retuned. It runs before `homes` is captured, so the
interaction's return-to-rest uses the corrected position. Now `minY 0.740`.

Contacts after the fixes, all against the desk plane at 0.740: award `+0.0000`,
headphones `+0.0000`, coffee `+0.0000`, notebook `+0.0000`. The mouse sits on
the mat at 0.749, gap `0.0000` to the mat.

## The window reveal, as it actually renders

Projected into the 1600 x 900 seated frame, so this is where the layers land
rather than a claim about them:

| Layer | Screen span | Reading |
|---|---|---|
| Aperture | x 1117 to 1638, y -141 to 480 | clipped 38 px by the right frame edge; the top 141 px is above frame, as designed |
| Middle-distance block | x 1109 to 1323 | **44% of the visible aperture width** — a building with sky beside it, which is what the harness asserts and what the frame shows |
| Far skyline plane | x 946 to 1802 | covers the aperture; supplies the remaining 56% |
| Near parapet | top edge at y = 492 | **below the aperture's bottom at y 480, so it contributes nothing to the seated frame.** It does not occlude — which was the goal — but it is not the foreground layer either. |
| Sill + snow ledge | snow top spans x 1127 to 1593 at y 480 | **measured, in shot.** Both are built (`Window sill`, `Sill snow` in the builder) and then merged into the batched `Workspace architecture` mesh, which is why a name search does not find them; their authored extents project onto the aperture's bottom edge. This is the near value in the window. |

The depth separation is real and it is legible: the middle block's lit windows
are large and warm, the far skyline's are small and cool, and the sill is a
hard near edge under both. Nothing was added to fake it and no extra luminous
rectangles were introduced.

## One composition decision left to the owner, with evidence both ways

**The blinds default to closed, in both rooms.** `roomActions.state.blinds = 0`
is inherited from the live interaction, and the geometry harness asserts the
closed stack covers the opening, which it does — 22 slats at a 52 mm pitch.

Shot closed (`cinematic-seated-night.png`), the reveal is behind slats and the
two exterior depths merge into one lit surface. Shot open
(`cinematic-seated-night-blinds-open.png`), the middle block and the far
skyline separate cleanly and the window becomes the "useful opening" the brief
asks for. **The open frame is the better composition by a wide margin.**

This was not changed unilaterally: the default belongs to the interaction, not
to the geometry, and the blinds cord is a control the prompt explicitly says
not to delete. The harness takes `&blinds=0|1` so either can be re-shot.

## Still owed after this pass

Unchanged from the offline study, and the render did not settle any of them:

1. **The bake.** No bake exists for this room. Nothing in these frames used one
   — they are lit entirely by the runtime lights, which is why the corners go
   as dark as they do. Rebake after the layout is accepted, not before.
2. **`setSky` key positions** per sky state. These frames are night only.
3. **The speaker driver set.** `createSpeakerDetails` is still not called; the
   speakers are plain cabinets in every frame here.
4. **`afterHours.js`** placement, probes and its winter-city GLB.
5. **Hand kinematics.** Codex's call, and the reason the figure is hidden.
6. **GPU frame time.** Draw calls and triangles are measured; cost is not.

One 404 appears on the first navigation of a fresh browser session in the shots
run and never again — it did not reproduce when the run was repeated while
logging response URLs, and no scene asset is missing: all four authored GLBs
report `ready` in every frame. Not chased further.

## Three claims checked after the first write-up

Run with `node scripts/review-cinematic-room-checks.mjs`.

### Correction: "the parapet still reads from the overview" is not confirmed

The offline study says the near parapet "still reads when you look down through
the glass and **from the overview**". The first render pass only measured it
against the seated frame, so that half stood unchecked. Measured now, in the
1600 x 900 overview: the parapet's front face projects to x 575-922, y 331-590,
and the aperture to x 814-991, y 72-398. They overlap in roughly a 108 x 67 px
patch at the aperture's bottom corner.

So it is geometrically capable of being seen there — but it is unlit dark
facade at night, and **I could not identify it in the rendered overview frame.**
Treat the inherited claim as unproven rather than true. If the parapet is meant
to carry near-depth it needs either a lit face or a different placement; that is
a composition call, not a defect fix, so nothing was changed.

### Latent bug: the ceiling fixture's emissive is not driven by the first `setEntryPower`

`createAuthoredCeilingFixture`'s `update(power)` iterates an `emission` array
that stays empty until the GLB's `.then` populates it. The harness (and
`WorkspaceStage`) call `setEntryPower` immediately after build, which is before
that. Measured: one emissive material, sitting at `baseEmissive` = 1 as shot;
an explicit `setEntryPower(0.2)` after the asset lands drives it to 0.2, and
back to 1.

**No effect on these frames** — they are shot at power 1, which is the same
value. It matters for the arrival ramp, where a fixture asked for 0.2 would
render at 1 until the next call. In the live app the ramp calls repeatedly so
it self-corrects within a frame or two. Not fixed here: the helper is a live
file and this pass does not edit live files.

### Checks not run, and why

No verification suite was run this pass. Nothing this pass touched is on the
app's path: `git status` shows only the three candidate modules, the new
`review-cinematic-room*` harness files and docs, and `buildWorkspace.js` still
runs the app. The evidence that the live path still builds and renders is the
`live-seated-night.png` / `live-overview-night.png` pair, which were produced
from `buildWorkspace` + `buildRoomInteractions` in the same run as the
candidate frames, with all four authored assets reporting `ready`.

Screenshots are not committed: `scripts/shots/` is gitignored by design
(".gitignore: Playwright verification screenshots (throwaway)"). Re-run the
shots script to regenerate them.

## 2026-09-21 pass — three owed items closed, one defect found by rendering

Opus held the build/browser/GPU slot (claimed in TEAM-COORDINATION before use).
Everything below was rendered on real ANGLE D3D11, not asserted.

**1. Ceiling fixture entry power — fixed, live file.** `update()` iterated a
material list that is empty until the GLB lands, so every call before that was
dropped. It now remembers the last requested power and applies it once the
materials exist. Safe against double-scaling: `baseEmissive` is captured from
the freshly loaded material and `update()` cannot have touched it while the
list was empty.

Verified by a new check in `review-cinematic-room-checks.mjs`. The existing
check could not tell a working fixture from a broken one — it shoots at power 1
and the authored emissive is already 1, so both answers are `[1]`. Asking for
0.2 before the asset lands reports `[0.2]` with the fix and `[1]` without.
(My first attempt at that check appended a second `power=` to a URL that
already had one and read back the first; the harness now builds its own URL.)

**2. `setSky` key-light positions — done.** `SKY_CONFIGS.key.position` is still
ignored, correctly: those are live-room coordinates. `cinematicLayout.KEY_LIGHTS`
supplies one per state, and they are not authored directly — each state names
the point in the opening the light comes through, and the position is placed by
extending the target→entry ray outward, so a key whose ray misses the window
is not expressible. Read back out of the rendered scene:

| State | Position | Elevation | Colour |
|---|---|---|---|
| night | 3.45, 3.26, −1.78 | 28.0° | `#8eadd8` |
| dusk | 4.65, 2.25, −2.00 | 12.6° | `#e48652` |
| day | 4.03, 4.09, −2.11 | 32.3° | `#fff4e0` |

Both the closed and open keys move together, so the two-pose shadow pair stays
consistent. Frames: `cinematic-seated-{night,dusk,day}.png`, shot by the new
`scripts/review-cinematic-room-sky.mjs`.

**3. Speaker drivers — built.** `cinematicSpeakerDetails.js` re-expresses the
live lathe profiles as (radius, depth proud of the front face) and scales both
by cabinet width, so an 84 mm flange sits on a 110 mm cabinet instead of the
live 137 mm one. That is a 3″ woofer with a ~19 mm dome — what a nearfield this
size actually carries. Cabinets now come from the same `SPEAKER` export the
drivers derive from, so the two cannot drift apart. Visible and correctly
proportioned in the seated frames.

### The defect the harness could not catch

The middle-distance block **passed every numeric check and still rendered
wrong**. It was 1.8 × 5.0 m at 6.5 m with 135 mm windows: inside the sightline
cone, covering 53% of its width — and reading as a wardrobe pressed against the
glass, because its windows were the only thing the eye could scale it by.

"Inside the cone" says nothing about whether a thing reads as a building. The
checks now also require the block to be building-sized and its windows to be
domestic-sized, and `block()` places windows on a real metre pitch instead of a
fraction of the facade — a facade whose windows are a fixed percentage of it
can never be the wrong size, which is exactly how this passed.

The first correction was worse than the bug: a correctly sized 14 m building at
the old 6.5 m depth left the opening showing a 3 m sliver of facade and an
almost empty window. Depth has to follow from the angle. The old pillar
subtended ~0.25 rad across and ~0.68 rad up, which was a good composition; a
real tower filling those angles sits at ~57 m, so the block is now 16 × 40 m at
57 m, and the far backdrop moved behind it to −90 m and was resized so its drawn
skyline lands inside the cone rather than below it. With the blinds open the
frame now reads at three depths: sill, tower, far skyline.

Both intermediate states were rendered. Neither would have been caught by the
geometry harness, which passed throughout.

**Live regression:** the same run re-shot `live-seated-night` and
`live-overview-night` with all four authored assets `ready` and no errors, so
the ceiling-fixture edit did not disturb the live room.

**Counts, this pass:** cinematic seated 88 draw calls / 92,421 triangles;
overview 104 / 103,385. Live seated 74 / 89,227. Frame time still unmeasured.

The one 404 on first navigation of a fresh browser session reappeared in this
run too, again only once and with every asset `ready`. Still not chased.

## Not claimed (render pass)

Still a composition study of one room at one time of day, with the hands hidden.
Not an acceptance of the final scene, and no comparison to any shipped game.
