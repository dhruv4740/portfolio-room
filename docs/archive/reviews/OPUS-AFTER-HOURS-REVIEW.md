# After Hours — independent art-direction and implementation review

Read-only critique. No runtime code, asset, shared doc or build output was
edited. No build, server, browser, GPU or Blender process was run.

Reviewed 2026-09-20 against the working tree on `feat/v3`. The source read
during this review was committed by the parent mid-review as `aad580e`
("feat: integrate winter studio lighting and cinematic arrival"); all file
contents cited below were re-checked against that commit and are unchanged.

**Concurrent work, flagged:** while this review was being written the parent
added `art/after-hours/hand-rig-reference.{blend,json}`,
`scripts/export-hand-reference.mjs` and
`scripts/blender/import_hand_reference.py`. Section 5 was written without
sight of those files and may duplicate or contradict work already in flight —
read it as a set of constraints the pipeline must satisfy, not as a proposal
to start one.

## Evidence, and what it is worth

| Artifact | Timestamp | Status |
|---|---|---|
| `src/v3/desktop/buildWorkspace.js` | 04:51 | **Newest source.** Post-dates every screenshot. |
| `src/v3/desktop/afterHours.js` | 04:50 | Post-dates every screenshot. |
| `src/v3/desktop/WorkspaceStage.jsx` | 04:44 | Post-dates every screenshot. |
| `scripts/shots/after-hours-seat.png` | 04:42 | Hero seated frame. Read for composition/contact/material. |
| `scripts/shots/after-hours-overview.png` | 04:42 | Standing overview. |
| `scripts/shots/after-hours-window.png` | 04:42 | Exterior/window. |
| `scripts/shots/hands-gpu-rest.png` | 03:21 | **Day sky, pre-resize keyboard (1.04 m).** Valid for hand anatomy and forearm continuity. Invalid for scale, lighting and exterior. |

Everything below distinguishes **[seen]** (visible in a named screenshot),
**[code]** (derived from the current source) and **[hypothesis]**.

Evidence I could not obtain under the read-only constraint: no frame of the
current 04:51 source exists; no close-up of the night hands; no cup/pen/award
grip frames newer than 03:21; no measured triangle/draw-call count for the
current tree; no controlled GPU comparison. The handoff's `0.8x 9.57/11.75`,
`1x 14.56/16.38`, `1.25x 21.96/24.45` sweep and the `seat 19.57 ms /
window 20.91 ms` samples are labelled there as transient flow observations,
not controlled benchmarks, and I treat them that way throughout.

---

## 1. The five things that keep it reading as a procedural toy

### 1.1 The architecture and the props are built at two different scales

This is the prompt's top-priority axis and it is the root cause of the "game
level, not a desk" read in both wide frames.

**[code]** Measured from the live source, in metres:

| Object | Source | Authored | Real-world reference | Ratio |
|---|---|---|---|---|
| Room | `buildWorkspace.js:12` | 5.00 × 3.95 × 3.20 | — | — |
| **Desk top** | `:360` | **3.52 × 1.45**, top at **1.165** | 1.4 × 0.7, top 0.73–0.75 | **2.5× / 2.1× / 1.6×** |
| **Monitor screen** | `:26` | **1.28 × 0.79** → **59″ diagonal** | 27″ = 0.60 × 0.34 | **2.1×** |
| Chair seat | `:457` | 0.60 × 0.55, top 0.665 | 0.45 × 0.45, top 0.45 | 1.3× / 1.5× |
| Seated eye | `:23` (`seat`) | 1.72 | 1.20–1.32 | 1.4× |
| Tower | `:453` | 0.35 × 0.64 × 0.64 | 0.20 × 0.45 × 0.45 | 1.4× |
| Keyboard | handoff | 0.48 | 0.44 | **1.09×** |
| Hand palm width | derived, §4 | 0.084 | 0.084 | **1.00×** |

The objects the viewer *touches* — hands, keyboard, phone, mug, pen — are at
1.0×. The architecture and furniture are at ~1.4–1.6×. The desk and the monitor
are at ~2.1–2.5×. Three scales in one frame.

**[seen]** The consequence is measurable in `after-hours-overview.png`: the
keyboard occupies 13.6 % of the desk's width (0.48 / 3.52). On a real desk it
occupies ~31 %. That single ratio is why the keyboard looks like a toy, why
the props read as scattered across a stage, and why the gaps between them look
like level-design spacing rather than a workspace.

A second consequence is postural. The desk top is at 1.165 m and the seated
shoulder is at `y = 1.40` (`seatedHands.js:104`) — only **0.235 m above the
desk**. A real seated shoulder sits 0.45–0.55 m above a desk. The occupant is
effectively sitting at a counter that reaches their chest, which is part of why
the forearms enter `hands-gpu-rest.png` at such a steep angle.

**The constraint that makes this non-trivial**, and the reason I rank it first
but do not recommend changing everything at once: `WORKSPACE.screen`
(`buildWorkspace.js:26`) is load-bearing per `AGENTS.md` — the camera-travel
target and the monitor's clickable plane both derive from it, and dhruvOS
projects into those dimensions. The 59″ panel may be a deliberate readability
hack for the embedded OS. So:

- **Desk first.** 3.52 → ~1.60 m wide, 1.45 → ~0.75 m deep, top 1.165 → ~0.75 m.
  This touches no contract. It does move every desk anchor in `WORKSPACE.anchors`
  and the leg/contact positions at `:554`, and it requires re-running
  `bake_room.py` (whose desk occluder at `:34` hard-codes the same numbers).
- **Monitor second, and only after a readability check** of the projected OS at
  the reduced size. If dhruvOS is not legible at 27″, the honest answer is to
  keep the oversized panel and accept it as a stated stylisation — not to leave
  it unexamined.

**[hypothesis]** I have no record in `HANDOFF.md`, `AFTER-HOURS-PLAN.md` or
`FABLE-NOTES.md` of the desk or monitor size being a deliberate decision. Every
prior scale correction recorded there concerns hands, the phone stage and the
keyboard. If a decision exists and I missed it, this finding reduces to the
desk alone.

### 1.2 Nothing resting on the desk casts occlusion from any source

This is the single most damaging defect and it is fully explained by code.

**[seen]** In `after-hours-overview.png` and `after-hours-seat.png` the
keyboard, mouse, phone, mug, book stack, both speakers, the award frame and the
notebook all meet the desk with no darkening whatsoever. They read as decals
printed on the wood, not objects sitting on it. The desk has a broad warm
gradient across it, but not one object interrupts that gradient.

**[code]** Three independent occlusion channels all skip the desk top:

1. `buildWorkspace.js:553-565` — the only contact decals in the scene are four
   desk legs, the chair, the tower, the monitor foot and a wall/floor corner
   strip. There is no decal for any object *on* the desk.
2. `afterHours.js:129-131` + `docs/ASSET-REGISTER.md` — `model.bakedMaterials`
   covers `{back, left, right, floor}` only. The desk top is
   `model.materials.oak`, which receives a PBR set at `afterHours.js:117` and
   **no lightmap**. The Blender bake (`scripts/blender/bake_room.py:34`) models
   the desk as an occluder but never as a receiver.
3. `WorkspaceStage.jsx:66-67` — `shadowMap.autoUpdate = false` with one
   `needsUpdate`, and `buildWorkspace.js:396`/`402`/`429` explicitly set
   `castShadow = false` on the keyboard keys, the phone and the notebook parts.

So the dynamic path, the baked path and the decal path each exclude desk-top
props. The result is an unavoidable "floating clutter" read that no amount of
material or exterior work will fix.

### 1.3 The exterior has no atmospheric depth because the fog ramp starts past it

**[seen]** In `after-hours-window.png` the near-right facade, the mid-block
facade and the roofline at the top of the frame sit at an identical black
level. There is no aerial perspective at all. GTA/RDR night exteriors are
readable almost entirely through this one cue.

**[code]** `WorkspaceStage.jsx:95` sets the night fog to
`new THREE.Fog('#15202b', 24, 105)`. The authored exterior volume — from the
snow field at `afterHours.js:23` — spans `z = -2.4` to `z = -26.4`, roughly
25 m deep starting ~1.6 m behind the camera's seat position. Linear fog factor
is `(d - near) / (far - near)`, so:

- near facade at ~8 m → **0 %** fog
- mid block at ~16 m → **0 %** fog
- farthest authored geometry at ~27 m → `(27-24)/(105-24)` = **3.7 %** fog

The entire city occupies the first 3.7 % of the fog ramp. The `24, 105` values
look like a carry-over; the diagnostic day path at `WorkspaceStage.jsx:102`
uses a far more sensible `7, 26`. The `o.material.fog = true` flag set on every
city mesh at `afterHours.js:100` is correct and currently wasted.

**[hypothesis]** I could not read the city GLB's actual bounding box without
running a process. If its far skyline extends well past 27 m the numbers above
shift, but the conclusion — that `near = 24` excludes the near and mid blocks
entirely — does not.

### 1.4 Every lit window is the same flat rectangle

**[seen]** `after-hours-window.png` shows ~14 lit windows. Every one is a
uniform tan fill with a black mullion cross, the same value, the same hue, no
interior depth, no curtain, no sill object, no occupant silhouette, no spill
onto the brick beside it. Unlit windows are a uniform near-black. This is
precisely the "uniform glowing-window grids" the plan at
`docs/AFTER-HOURS-PLAN.md` forbids.

**[code]** `afterHours.js:102` — materials whose name starts with `Window ` are
excluded from the `.color.multiplyScalar(.68)` + emissive treatment, so they
keep their authored flat emissive. There is no per-window variation channel at
all: no instanced color attribute, no emissive map, no random seed. The
variation has to come from the GLB's material set, and there appear to be at
most a couple of window materials among the 9 the register lists.

### 1.5 Two fixtures lie about what they emit

To be precise about what is and is not broken: the lamp **is** a live light.
`buildWorkspace.js:438` creates it at `0.75 / 2.2`, and line 492 immediately
overwrites it to `intensity = 1.85, distance = 3.0`. Line 438's arguments and
line 493's `shade.material = dark` are dead writes, worth deleting but not the
defect.

The defect is the decal:

**[code]** `buildWorkspace.js:544` places `lampPool` — a **radially symmetric**
gradient (`createRadialGradient`, line 515, equal radii) — flat on the desk at
a fixed `[-1.03, 1.167, -0.3]`. The shade above it is a cone tilted
`rotation.z = -0.3` (line 437). A tilted cone projects an **ellipse with a
biased hotspot and a defined rim**, not a centred circular falloff. The pool's
shape asserts a fixture that is not there.

Compounding it: the decal is `toneMapped: false` (line 524) while the scene
renders through `ACESFilmicToneMapping` at `toneMappingExposure = 1.5`
(`WorkspaceStage.jsx:69-70`). The pool is therefore outside the room's tone
response by construction and will always sit on top of the image as a sticker
rather than inside it. The same applies to `'Screen spill'` (line 546),
`'Screen desk edge'` (line 550) and every `contactShadow` (line 537).

**[seen]** In `after-hours-overview.png` the warm desk gradient is centred on
the desk rather than under the lamp head, which is consistent with the above.

`docs/HANDOFF.md:387-390` already records "the lamp does not visibly emit" as
an open item under **Not done — the night lighting rig**. The contribution here
is the mechanism: the light is fine, the decal that represents it is not.

**Second fixture — the ceiling pendant, which illuminates nothing in the
runtime *or* the bake.**

**[code]** `buildWorkspace.js:506` — `const pendantLight = new THREE.Object3D();
pendantLight.intensity = .85;`. `Object3D` has no `intensity`; this is a dead
write, and `setEntryPower` at line 608 (`pendantLight.intensity = 0.85 * value`)
is a dead API that the entry stutter drives to no effect.

The comment at line 499 implies emission-only is intentional and the bake
supplies the real contribution. It does not. `scripts/blender/bake_room.py:44-46`
defines exactly three area lights — `Cold window` (32 W), `Monitor bounce`
(3 W) and `Task lamp` (24 W). **There is no ceiling or pendant emitter in the
bake.** So the room's only overhead fixture is a glowing sphere that lights
nothing by either path.

**[seen]** `after-hours-overview.png` — the pendant reads as a cream ellipse
against the ceiling with no falloff on the ceiling plane around it and no
contribution anywhere below.

### Runners-up, not in the five

- No skirting board or wall/floor trim; the plaster meets the floor as a raw
  90° edge **[seen, overview]**.
- `steel` at `metalness: 0.92` (`buildWorkspace.js:245`) renders near-black
  whenever `scene.environment` is null — which is the case on the `day`
  diagnostic sky (`afterHours.js:154`) and on any `materials`/`bake`/`city`
  fallback status. See risk 6.4.
- The chair back never occludes the seated frame, despite the camera sitting in
  front of a chair with a back at `z = 1.414` **[seen, overview]**.

---

## 2. Concrete visual target for one hero seated frame

One frame, rendered with the HUD hidden, no bloom, no DOF, lamp **on**, blinds
**open**, sash **closed**, mug full, at the existing `WORKSPACE.seat` camera.
Acceptance is by eye against these seven statements, all of which are false today:

1. The keyboard, mouse, mug and phone each sit in a visible soft darkening that
   is tightest at the contact line and gone within ~3 cm. The desk's warm
   gradient is *interrupted* by each object.
2. The brightest point on the desk is directly beneath the lamp head, the pool
   is an ellipse elongated away from the shade's tilt, and it has a discernible
   rim rather than an infinite fade.
3. Three exterior depths are separable by value alone: the near facade is the
   darkest and highest-contrast, the mid block is measurably lifted, the far
   roofline is lifted again and desaturated toward the fog colour.
4. No two lit exterior windows share the same value. At least three show
   something inside — a mullion shadow, a curtain edge, a warm ceiling plane.
5. The monitor bezel and the lamp arm show a directional specular streak
   sourced from the window, not a flat grey.
6. The hands show four separable digits with a dorsal knuckle arch and a
   readable thumb, and the sleeve meets the wrist without a diameter step.
7. Nothing in the frame is brighter than the monitor except the lamp interior.

Camera/light values I can derive, with units:

- **Fog**: `new THREE.Fog('#1b2733', 6.0, 34.0)` in metres, replacing
  `WorkspaceStage.jsx:95`. Derivation: the interior's deepest visible surface
  from the seat is the back wall at ~2.5 m, so `near = 6` leaves the room
  untouched; the authored exterior ends near 27 m, so `far = 34` puts the far
  roofline at `(27-6)/(34-6)` = **75 %** fog and the near facade at ~7 %. That
  is the three-depth separation item 3 asks for, from one line.
- **Lamp pool**: the shade is a `ConeGeometry(0.14, 0.15)` at `y = 1.89` tilted
  `-0.3 rad`, desk top at `y = 1.167`. Drop height 0.723 m; half-angle
  `atan(0.14/0.15)` = 0.751 rad, so the untilted pool radius is
  `0.723 * tan(0.751)` ≈ **0.70 m**, and the 0.3 rad tilt shifts the centre by
  `0.723 * tan(0.3)` ≈ **0.22 m** toward +x and stretches the far edge. Current
  decal is 0.48 half-size centred at `x = -1.03`; the geometrically consistent
  placement is roughly `x = -0.81`, elliptical, ~0.70 × 0.85 m.
- **Tone mapping**: `toneMappingExposure = 1.5` with ACES is doing a lot of the
  lift. I did not measure it and will not propose a number; test 1.5 against
  1.15 once the lightmaps and the fog are correct, in that order.

---

## 3. Ranked implementation sequence

Each item states its acceptance test and its structural cost. I derive cost
from what the code makes the GPU do; I do not invent millisecond figures.

**0 — Desk dimensions.** Ranked zero because everything below is tuned against
the frame it produces, and doing it after items 1–6 means redoing their
placement. It is also the largest single change in this list: it moves
`WORKSPACE.anchors` (11 desk-relative entries), the leg and contact positions
at `buildWorkspace.js:554`, `HAND_REST` and the shoulder height in
`seatedHands.js:8`/`:104`, the seat and overview cameras, and the desk occluder
in `bake_room.py:34` — followed by a bake re-run and a full held-object
regression. Cost: zero GPU, high integration risk. **Acceptance:** the keyboard
occupies ~30 % of the desk's width and the seated shoulder sits 0.45–0.55 m
above the desk top. Hold the monitor at its current size pending an OS
readability check (§1.1).

If the parent judges that too disruptive this late, say so explicitly in the
ledger and treat the scale as a stated stylisation — but do not leave it
unexamined, because it is the first thing a builder will notice.

**1 — Desk-top occlusion.** Highest visual return per unit of work and per unit
of GPU. Two options: (a) extend the Blender bake to make the desk top a
*receiver* and add a `desk` entry to `model.bakedMaterials`, giving free
per-pixel AO at zero extra draw calls; or (b) add ~8 `contactShadow()` decals
for keyboard, mouse, mug, phone, books, speakers ×2, award frame. (a) is
correct and (b) is the cheap bridge. Cost of (b): +8 draw calls against the 67
the acceptance baseline recorded, plus 8 × 128² canvas textures — negligible.
Cost of (a): one more 256² lightmap in the existing 659,558-byte atlas set, and
a bake re-run. **Acceptance:** the seven-statement list, item 1.

**2 — Fog near/far.** One line. Cost: zero — fog is already compiled into every
city material via `afterHours.js:100`. **Acceptance:** item 3.

**3 — Lamp pool geometry and tone-mapping participation.** Reshape the decal to
the ellipse derived above; remove `toneMapped: false` from the glow decals
(keep it on contact shadows if the darkening otherwise crushes). Delete the
dead writes at `buildWorkspace.js:438` args, `:493`, `:506-507`, `:608`. Cost:
zero. **Acceptance:** item 2.

**4 — Pendant.** Either make it a real `PointLight` *and* add a matching
ceiling emitter to `bake_room.py`, or delete the `setEntryPower` pendant branch
and accept it as a prop. Do not leave a dead API. Cost: one light, or none.
**Acceptance:** the ceiling plane around the rose shows falloff, or the entry
stutter no longer pretends to drive it.

**5 — Window variation.** Per-window emissive variation via an instanced color
attribute or a small emissive atlas on the window material, plus a low-cost
interior card behind three or four of them. Cost: at most one extra material
and a handful of quads against the city's existing 45,660 triangles.
**Acceptance:** item 4.

**6 — Environment reflection reliability.** See risk 5.4. Cost: one static
fallback PMREM, generated once. **Acceptance:** item 5 holds with the city GLB
blocked (the acceptance harness already has a fallback context for this).

**7 — Hands.** Largest effort, and it should be last because items 1–3 change
how the hands read. Section 5 below.

Deliberately **not** recommended: bloom, DOF, SSR, any additional full-scene
pass, more clutter, or any postprocessing before items 1–4 land. The plan is
right that the base image has to be accepted first.

---

## 4. Hand and forearm assessment

Evidence: `hands-gpu-rest.png` (03:21, day, pre-resize keyboard — valid for
anatomy), `after-hours-seat.png` (04:42, hands at distance), plus
`seatedHands.js` and `handSurface.js`.

**The rig's proportions are not the problem.** `seatedHands.js:44-48` gives
index 0.072 m, middle 0.080 m, ring 0.074 m, pinky 0.058 m total length, with
MCP spread `x = ±0.033` and radii ~0.009 m → palm width ≈ 0.084 m. Those are
within a few percent of adult male anthropometry. The per-joint split
`[0.46, 0.30, 0.24]` (line 86) is also close to real proximal/middle/distal
ratios. **The failure is entirely in the surface reconstruction**, and the
recommendation follows from that.

1. **Neutral proportions — pass [code].** As above. Do not "fix" the skeleton.
2. **Knuckle arch — fail [seen].** The dorsal MCP line reads as a flat slab
   with no bumps. **Cause [code]:** `handSurface.js:89` samples the SDF on a
   `step = .005` (5 mm) grid, and `handSurface.js:83` unions parts with a
   `k = .003` (3 mm) smooth-minimum blend. A knuckle bump is roughly 3 mm of
   relief — at or below both the sampling floor and the blend radius. The arch
   is removed by arithmetic, not by art choice. The palm SDF at lines 62-74
   does encode a knuckle-line arch via the `front` term, but it is an arch in
   the *plan* of the palm boundary, not a dorsal relief.
3. **Thumb placement — fail [seen].** In `hands-gpu-rest.png` the thumb is not
   separable on either hand; it is absorbed into the palm silhouette. **Cause
   [code]:** the thumb base sits at `(∓0.032, -0.006, 0.019)` (line 91), inside
   the palm SDF's own half-width of 0.044 and thickness 0.012 (lines 63-64), so
   the 3 mm blend fuses the metacarpal into the palm mass. At the `rest` pose's
   `tOpp: 0.25` it is also barely opposed, so nothing separates it in silhouette.
4. **Webbing — fail [seen/code].** Adjacent digits are one continuous slab with
   shallow grooves. The 3 mm blend between finger capsules whose surfaces are
   ~4–6 mm apart at the MCP produces a full merge rather than a web. This is the
   mitten read.
5. **Topology under flexion — unverified.** No current close-up of a curled
   grip exists; `hands-gpu-coffee-grab.png` and `hands-gpu-pen-drawing.png` are
   03:21. **[code]** the bind pose is deliberately straightened at
   `seatedHands.js:186` to avoid fusing a fist, which is the right call. Skin
   weights come from a Gaussian over SDF distance with `σ = .006`
   (`handSurface.js:125`), capped at 4 influences — that is reasonable, but with
   5 mm vertices there are too few loops across a joint to deform without
   collapse. Expect creasing at PIP under `wrap`/`hook`. Flag for the parent to
   confirm from a fresh GPU grip shot.
6. **Wrist/forearm continuity — fail [seen].** There is a hard diameter step
   where the dark sleeve meets the hand, and the wrist is visibly too thin.
   **Cause [code]:** the forearm is a separate `LatheGeometry` sleeve
   (`seatedHands.js:54-56`) starting at radius 0.015, while the skin surface's
   wrist segment is `segment(h.arm, ..., .018, .016)` (`handSurface.js:59`) and
   the arm bone is scaled non-uniformly `(1.15, length, 0.72)` at
   `seatedHands.js:151`. The sleeve does not receive that 1.15/0.72 elliptical
   scale, so the cuff cross-section cannot match the wrist it covers.
7. **Sleeve contact — fail [seen].** In `hands-gpu-rest.png` the forearms enter
   the frame at a steep angle as smooth featureless cones with no cuff fold, no
   fabric wrinkle and no compression where they cross the wrist rest — one arm
   appears to intersect the wrist-rest bar. `cloth` is
   `MeshStandardMaterial({ roughness: 1 })` (`seatedHands.js:61`) with no normal
   map, so there is no fabric response at any distance.
8. **Grip adapter constraints — the real integration surface.** Any replacement
   rig must satisfy, exactly:
   - the seven scalars in `POSE_KEYS` — `c0, c1, c2, c3, spread, tOpp, tCurl`
     (`seatedHands.js:12-30`), tweened by GSAP and by `lerpPose`;
   - `localTips(h)` (`seatedHands.js:168-172`) returning four digit tips plus
     the thumb tip **in hand-local space**;
   - `pinchFrame(h, pose)` (`seatedHands.js:175-182`) returning `{contact, axis}`
     in hand-local space, which the pen contact depends on;
   - `HAND_REST = {x: 0.11, y: 1.278, z: 0.405}` and the hand frame convention
     documented at `seatedHands.js:4-6` (fingers −z, palm −y, wrist +z);
   - `curlSum(p)` for the typing/energy coupling.

   `WorkspaceStage.jsx:609` also positions held objects by hard-coded offsets
   from `h.hand.position` — any change to the hand bone's origin relative to the
   palm will silently break every grip.

**On the CC0 candidates.** WRAD ARMS (1,200-triangle target, 512² albedo,
Half-Life/PS1 styling) and DevMops Low Poly Arms are *deliberately retro*.
Swapping either in would trade a fused-but-correctly-proportioned surface for a
faceted one. They are useful as **rig and topology references** — WRAD's wrist
twist joints and forearm bone layout in particular — and as a check that a
50-joint skinned hand/forearm pair is cheap. They are not realism upgrades and
should not be described as such in the register or the ledger.

---

## 5. Recommended Blender pipeline (do not implement)

The argument for authoring rather than tuning the SDF: the current mesh is
generated at page load by a 49×40×70 = 137,200-sample marching-tetrahedra pass
per hand (`handSurface.js:89-108`). Halving the step to 2.5 mm to recover
knuckles and webbing multiplies that by 8, to ~1.1 M samples per hand — not
viable at runtime. But the repo already ships `public/models/hands-v1.bin` via
`scripts/build-hand-assets.mjs`, and `handSurface.js:33-42` already prefers the
prebuilt geometry and only falls back to the SDF. **The offline path exists;
the resolution constraint only applies to the fallback.** That is the opening.

Proposed shape, stated as a target for the parent rather than a plan I own:

1. **Model one right hand + forearm in Blender 5.2**, quad topology, edge loops
   placed for flexion: three loops per finger joint, a dorsal loop ring over
   each MCP to carry the knuckle, a fan through each web, and an elliptical
   wrist section matching the existing 1.15/0.72 aspect. Budget 6–9 k triangles
   per hand including forearm; against the 61,242-triangle scene baseline a
   pair is affordable. Mirror for the left rather than modelling twice.
2. **Rig with the existing joint hierarchy, not a new one.** The adapter is
   easiest if the armature reproduces `seatedHands.js`'s chain exactly: per
   digit three bones at lengths `[0.46, 0.30, 0.24] × spec.length`, thumb three
   bones at `[0.035, 0.025, 0.022]`, plus `hand`, `arm`, `elbow`, `sleeve` — the
   same order as the `bones` array at `handSurface.js:31`, because the skin
   indices written into the `.bin` are positional.
3. **Keep the driver, replace the skin.** `applyPose` (`seatedHands.js:112-130`)
   already maps the seven scalars onto `MCP/PIP/DIP` and the thumb basis. If the
   Blender rest pose matches the straightened bind pose used at
   `seatedHands.js:186`, the existing `applyPose`, `localTips` and `pinchFrame`
   continue to work unmodified. **This is the property that makes the swap safe,
   and it should be the acceptance criterion for the export, not an afterthought.**
4. **Bake a skin normal map** (pore and knuckle-crease detail) and a sleeve
   normal + roughness pair. Item 7 of §4 is unfixable without them. 1 K is
   enough at the distances in `after-hours-seat.png`.
5. **Extend `scripts/build-hand-assets.mjs`** to consume the exported GLB into
   the same four-buffer layout (`skin`, `cloth` × left, right) that
   `handSurface.js:33-38` expects, so the runtime branch does not change at all.
6. **Validate before replacing**, per the plan: rest, typing, coffee (all four
   phases), pen, phone, award, resume, notebook, headphones, lamp — each as a
   GPU shot, plus `verify-held-objects.mjs` and `shots-hands.mjs` wrist angles.
   Keep the SDF fallback in place until every one passes.

I am not proposing a specific commercial or NC-licensed rig. The register's
research conclusion — that no free, clearly-licensed candidate combines close-up
anatomy, textured forearms and a ready export — matches what I can verify from
the register itself, and custom authoring is the correct response to it.

---

## 6. Five architectural risks

Capped at five, as instructed. Each is minimal-fix, in-place, no rewrite.

### 6.1 `sceneDirector.restore()` is asymmetric with `start()`

`sceneDirector.js:10-12` mutates six control properties on start: `enabled`,
`enableDamping`, `minDistance`, and the four angle limits. `restore()` at line 6
puts back five of them and **never restores `minDistance` (left at `0.025`) or
`enabled` (left `false`)**.

The cancel path at `WorkspaceStage.jsx:1095` calls `director.cancel()` then
`place(home)` — and `place` (`WorkspaceStage.jsx:161`) only copies position and
target; it does not re-derive constraints.

**Severity, honestly stated:** this is latent debt, not an observable bug today.
`controls.enabled` is never assigned `true` anywhere in `WorkspaceStage.jsx` or
`Scan.jsx` — the camera is driven by custom `pointerMove`/`wheelZoom` handlers
(`WorkspaceStage.jsx:1030-1044`, `1025-1029`, FOV zoom rather than dolly), and
`render()` only calls `controls.update()` when not seated. OrbitControls is a
state container, so a wrong `minDistance` has no effect. The moment anyone
re-enables it, the constraint set is silently wrong after a cancelled arrival.

**Fix:** have `restore()` also set `controls.minDistance = 1.4;
controls.maxDistance = 11;` — the values `WorkspaceStage.jsx:937` and `991`
otherwise derive. One line.

### 6.2 A foreign module mutates renderer state inside the owner's frame

`AGENTS.md` states the invariant plainly: "`WorkspaceStage.jsx` owns its own
renderer and loop." `afterHours.js` does not respect it.

`createAfterHours` takes `renderer` as a constructor parameter, builds a
`PMREMGenerator` from it (`afterHours.js:75`), and inside `captureProbe`
reaches into the owner's global state: it toggles
`renderer.shadowMap.enabled` off and back on (`:87-88`), nulls
`scene.environment` (`:86`), hides five scene objects (`:83-85`), and drives
`cube.update()` — six render-target binds and six full scene passes (`:88`).
All of this runs synchronously from `update()` (`:151`), which
`WorkspaceStage`'s `tick` calls mid-frame.

Two concrete consequences. First, `renderer.shadowMap.enabled` is restored to
whatever it was rather than to a known value, so if anything else ever toggles
it the two writers will fight. Second, the invariant at `WorkspaceStage.jsx:66`
(`shadowMap.autoUpdate = false`, baked once) is currently what keeps the six
cube passes from re-baking the shadow map — a correctness property that lives
in a different file from the code that depends on it, with no comment on either
side saying so.

**Severity:** no observable defect today. It is an ownership violation that
makes the shadow-baking invariant fragile, and it is the kind of thing that
breaks silently when someone adds a second light.

**Fix:** give `WorkspaceStage` a narrow `withOfflineRender(fn)` helper that
owns the save/restore of `shadowMap.enabled` and `scene.environment`, and pass
*that* to `createAfterHours` instead of the raw renderer. No rewrite; it moves
about eight lines across a boundary that already exists.

### 6.3 The construction-failure path leaves a live `document` listener

`WorkspaceStage.jsx:1155-1165` is the React cleanup; `:1167` is the `catch`
arm. They are not duplicates — the catch arm runs when construction throws, and
in that case the effect returns nothing, so the cleanup at `:1156` never runs.

The catch arm omits five things the cleanup does: the
`document.removeEventListener('visibilitychange', refresh)` at `:1157`, the
five canvas listener removals at `:1158-1162`, `gl.deleteQuery` at `:1163`,
`gov.dispose()` and `api.current = null` at `:1164`.

The `document`-level one is the problem. Listeners are registered at
`:1067-1072`, well before `refresh()` at `:1154`, so an exception anywhere in
between leaves `refresh` attached to `document`. And `refresh`
(`WorkspaceStage.jsx:264-270`) has **no `disposed` guard** — every subsequent
tab visibility change will call it, touching a disposed `controls`
(`controls.enabled = false`), a disposed `gov` (`gov.markDirty()`) and
`updateMarkers()` against a torn-down model, for the life of the page.

**Severity:** requires a construction failure to trigger, which is narrow — but
construction is exactly where a WebGL context failure lands, and that is the
path most likely to throw on the low-end hardware the fallback exists for.

**Fix:** add `if (disposed) return;` as the first line of `refresh`, and move
the `document.removeEventListener` into the catch arm. Two lines.
### 6.4 A `fallback` status leaves `scene.environment` null, and metals go black

`scene.environment` is only ever assigned from a captured probe
(`afterHours.js:79`, `90`, `154`), and `captureProbe` is gated at line 150 on
all three of `city`, `materials` and `bake` leaving `loading`. On the `day`
diagnostic sky, line 154 sets it to `null` unconditionally.

`buildWorkspace.js:245` defines `steel` at `metalness: 0.92, roughness: 0.32`,
and `dark` at `metalness: 0.42`. In three.js a metal with no environment has
almost nothing to reflect: the monitor stand, lamp arm and chair frame collapse
toward black. The plan's own requirement is "asset failure retains a usable
scene" — visually, this one does not.

**Fix:** generate a small static PMREM (a `RoomEnvironment`, or a 2-colour
gradient cube matching the hemisphere light) once at construction and install it
as the baseline `scene.environment`, with the captured probe replacing it when
available and restoring to the baseline — not to `null` — on `day` and on
fallback.

### 6.5 Tier is frozen at construction, and shed effects never recover

`createAfterHours` receives `tier` as a parameter and branches on it once, at
`afterHours.js:22` (snow count) and `afterHours.js:40` (whether the sash
`Reflector` exists at all). If `perfGovernor` promotes or demotes the tier later,
neither responds.

Separately, `afterHours.js:146-147` sets `glassReflection.visible = false` after
10 consecutive frames over 27 ms and **never re-enables it** — a one-way latch,
so a transient spike (a probe capture, a GC pause, another tab) permanently
removes the reflection for the session. Note the reflector costs a full extra
scene pass at 384×512 every rendered frame while the sash is open
(`afterHours.js:42`), so shedding it is right; not recovering is not.

**Fix:** add a hysteresis counter — restore visibility after, say, 120
consecutive frames under ~20 ms — and expose a `setTier(tier)` that at minimum
adjusts the snow draw range. Creating the `Reflector` lazily on promotion is a
larger change and I would not do it in this pass.

### Minor correctness bugs, not architectural — fix in passing

Two real defects that do not belong in any of the prompt's four risk domains:

- **`afterHours.js:82-92`** — `captureProbe` snapshots `[hands, figure, snow]`
  visibility and restores them, and restores the reflector, but sets
  `steam.visible = false` at `:85` and **never restores it**. It self-heals
  because `update()` rewrites `steam.visible` at `:144` before calling
  `captureProbe()` at `:151`, so steam is missing for the capture frame only.
  Harmless today; a trap for anyone who moves the probe call. *Fix:* add
  `steam.visible` to the array at `:82` and restore at `:91`.
- **`afterHours.js:11`** — `lastLamp = -1`, and `setSky` at `:154` reads
  `probes.get(lastLamp ? 'on' : 'off')`. `-1` is truthy, so a `setSky('night')`
  before the first `update()` requests the **`on`** probe regardless of the
  actual lamp state, installing the wrong environment or `null`. *Fix:*
  initialise to `0`, or test `lastLamp === 1`.

Also considered and cut: the probe's six synchronous scene renders inside a rAF
tick (`afterHours.js:80-88`) — bounded to at most two captures per session by
the `probes` cache, so a one-off spike rather than a sustained cost, and
covered structurally by risk 6.2.

---

## Handback

**Files inspected (read-only):** `AGENTS.md`; `docs/HANDOFF.md` (lines 1-150
read in full, remainder searched by keyword for scale, lighting and monitor
decisions); `docs/FABLE-NOTES.md` (searched, not read in full);
`docs/AFTER-HOURS-HANDOFF.md`; `docs/AFTER-HOURS-PLAN.md`;
`docs/ASSET-REGISTER.md`; `docs/AFTER-HOURS-ACCEPTANCE.md`;
`src/v3/desktop/buildWorkspace.js`; `buildRoomInteractions.js` (listing only);
`seatedHands.js`; `handSurface.js`; `handAssets.js` (listing only);
`afterHours.js`; `sceneDirector.js`; `WorkspaceStage.jsx` (targeted regions:
58-170, 223-270, 600-612, 750-800, 880-1010, 1025-1100, 1150-1175);
`perfGovernor.js` (listing only); `scripts/blender/bake_room.py` (lights and
receivers); `scripts/shots/after-hours-{overview,seat,window}.png`;
`scripts/shots/hands-gpu-rest.png`.

**Evidence unavailable, and therefore not claimed:**

- No screenshot exists of the current 04:51 source. Every visual finding is
  against 04:42 or older frames and may already be addressed by the parent's
  unbuilt edits (reduced-motion snow freeze, night-bake suppression, sash
  reflection, localized steam, skinned nail plates).
- No night close-up of the hands. §4 items 2-4, 6 and 7 rest on
  `hands-gpu-rest.png` (03:21, day sky, 1.04 m keyboard); item 5 (topology under
  flexion) is explicitly marked unverified.
- The winter-city GLB's bounding box was not measured; the fog derivation in
  §1.2 uses the snow volume's `z` extent as a proxy and says so.
- No GPU, frame-time, draw-call or triangle measurement was taken. All cost
  statements in §3 are structural (passes, draw calls, texture bytes), not timed.
- `docs/HANDOFF.md` lines 151-438 and `docs/FABLE-NOTES.md` were searched by
  keyword rather than read line by line. If a deliberate decision about desk or
  monitor scale is recorded in a passage my searches missed, §1.1 is wrong about
  intent (though not about the measurements).
- No verification suite was run. `verify-after-hours.mjs`,
  `verify-after-hours-audio.mjs`, `verify-v3.mjs`, `verify-studio.mjs`,
  `verify-held-objects.mjs`, `verify-room-interactions.mjs`,
  `verify-reduced-hands.mjs` and `verify-real-apps.mjs` are all unrun by me.

**No code was edited.** No commit, stash, reset, dependency install, build,
server, browser, GPU or Blender process was run. The only file written by this
review is this one. `docs/reviews/` was created to hold it; the Sonnet audio
assignment owns `docs/reviews/SONNET-AFTER-HOURS-AUDIO.md` in the same directory.
