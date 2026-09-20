# Opus multi-pass integration run — handoff for Codex and the owner

**Date:** 2026-09-20
**Branch:** `feat/v3`, local only. No push, no deployment.
**Started from:** `f1b9aa9` (docs: hand multi-pass integration to Opus and Gemini)
**Ends at:** `44efcdf`
**Commits added:** `df304fe`, `539311f`, `44efcdf`
**Build/browser/GPU slot:** held by Opus for this run, now **RELEASED** in
`docs/TEAM-COORDINATION.md`.

Everything below separates what was **measured** from what was **inferred** and
what was **not checked**. Build success is not treated as visual acceptance.

---

## 1. What changed

### Pass 0 — task lamp validated, and one real defect fixed (`df304fe`)

The inherited lamp loaded, switched, fell back and disposed correctly. But the
warm pool it was supposed to cast was almost absent, and the fallback bulb
looked *better* than the licensed asset.

**Root cause, measured:** `authoredTaskLamp.js` placed the SpotLight at local
y = 0.55746, taken from the source emitter. The shade's rim plane measures
**y = 0.4995** (`scripts/blender/` probe of the exported GLB: head centre
0.60579, rim 0.49949). The light therefore sat **58 mm inside the dish**, and
because every batched lamp mesh has `castShadow = true`, the shade was
occluding its own spotlight — a 45.8° cone clipped to whatever the rim
subtended. Aim, intensity, distance and decay were all nominally correct.

**Fix:** one line. The source now sits at local y = 0.491, just below the rim.

**Ruled out first:** the shade's cone axis was measured by SVD over the head
mesh with the sign resolved by end-radius — it points within 0.7° of straight
down, so the existing straight-down target was already correct. No re-pose or
re-export was needed, and none was done.

**New coverage:** `scripts/verify-task-lamp.mjs`. `shots-after-hours` covered
none of switch on/off, failed-load fallback, or unmount. This does, on the
real GPU (ANGLE D3D11).

### Pass 1 — licensed mouse replaces the box (`539311f`)

| | Source | Runtime |
|---|---|---|
| Triangles | 136,520 (measured, matches Gemini) | **11,601** |
| Size | no real-world scale | **72.7 × 124 × 38 mm** |
| File | 6.9 MB `.bin` | **597,652 bytes** |

The source ships **zero textures** — the glTF declares no images and no
textures, and all five materials are flat PBR values. The Bloody hand logo and
button seams are *modelled geometry*, which is why it is that dense. So there
was no UV atlas to preserve and no maps to bake; this was a decimation and
scale pass only.

Scale: uniform 0.014569 to a 124 mm length, then X × 0.85. The asset is
proportionally wider than the real product (85.5 mm against ~66 mm); 0.85
lands 72.7 mm without touching length, height or profile.

Orientation was determined by measuring the height profile along the long
axis — a mouse is tall at the palm rest and low at the button end — and then
confirmed in both hero frames, not assumed.

The procedural boxes now live in a `Mouse fallback` group, out of static
batching so they can be hidden on load. `deskContactShadows.js` gained
`addStatic(geometry)`; the loaded mouse hands over its **real merged
geometry** for the contact pass, replacing the old box caster.

### Pass 2a — licensed ceiling pendant replaces the sphere (`44efcdf`)

Poly Haven **Hanging Industrial Lamp** (Kuutti Siitonen, CC0), 9,530 source
triangles → **7,990** after trimming the chain, **803,352 bytes** with 1K
JPEG maps. Hangs 0.889 m from the existing ceiling rose.

`castShadow` is off for it: architectural shadows are static and pre-baked, and
a new caster would have to enter that cached map. No new dynamic light was
added — the arrival power stutter drives its emissive through the existing
`setEntryPower`, exactly as it drove the procedural bulb.

**Correction to the candidate README.** It describes `caged_hanging_light` as
an "industrial exposed filament bulb inside an iron cage" and
`hanging_industrial_lamp` as an "enamelled warehouse dome pendant". Rendered
elevations (`scripts/shots/fixture-*.png`) show the opposite of what those
labels imply: `caged_hanging_light` is a **1.16 m linear caged batten** (a
vapour-tight strip light) on two chains and cannot replace a bulb on a cord;
`hanging_industrial_lamp` is the **conical caged pendant**. The choice was made
on the corrected reading.

### Pass 2b — room scale: audited and proposed, deliberately not implemented

`docs/ROOM-SCALE-PROPOSAL.md` (new) has the measured table and exact proposed
dimensions.

The finding worth Codex's attention: **the seated composition is already close
to correct even though the absolute scale is not.** Eye height above the desk
is 0.555 m against a real 0.47–0.52 m. What fails is only what sits next to a
true-scale object — and the mouse, phone and lamp are now all 1.0×.

A monitor-only correction was considered and **rejected**: the monitor is the
reference the eye uses to judge the desk, so shrinking it alone makes the desk
read as *more* oversized. Option A (uniform 0.625 toward real) is the
recommendation, and it is deferred because `seatedHands.js` drives pose in
**world space** — a room rescale without matching hand-kinematics work puts the
hands through the desk. The proposal lists all ten consumers that must change
in the same edit.

**The indirect bake was not touched and must not be described as accurate.**
It still reflects the task light's older placement, and the lamp has since
moved and had its source lowered.

---

## 2. Gemini's audit — reviewed, and independently reproduced

`docs/reviews/GEMINI-ASSET-AUDIT-V2.md` was delivered during this run. I did
not take it at face value; I re-measured the parts this pass depended on in
Blender 5.2.2:

| Claim | Gemini | My measurement | Verdict |
|---|---|---|---|
| Mouse triangles | 136,520 | 136,520 | agrees |
| Caged hanging light | 22,893 tris, 1.160 × 0.312 × 0.748 | 22,893, 1.162 × 0.315 × 0.750 | agrees |
| Hanging industrial lamp | 9,530 tris, 0.548 × 0.548 × 1.355 | 9,530, 0.550 × 0.550 × 1.355 | agrees |
| Keyboard / chair: no license | — | no license file in either directory | agrees |

Its retraction of the earlier bare-skin claim about the FP arms matches the
checkpoint. Its *descriptions* of the two ceiling fixtures are wrong, as
recorded above — that is a visual claim, not a measured one, which is the same
failure mode as the earlier bare-hands report.

The candidate READMEs report **polygon faces as triangles** throughout. Both
fixtures confirm it (11,955 / 4,931 faces against 22,893 / 9,530 triangles).

---

## 3. Blocked, and precisely why

- **Keyboard** — no license evidence anywhere in the repository. Gemini also
  reports it is a single monolithic mesh with all 104 keycaps fused to the
  chassis, which would break the existing `keys`/`setKey`/`KEY_ROWS` key
  depression contract even if the licence arrived. **Owner action:** supply the
  original download page and licence grant.
- **Chair** — no license evidence. Same owner action.
- **Logitech G203 mouse** — no license. Not needed; the A4Tech is integrated.
- **Bare hands** — Gemini proposes two CC BY 4.0 candidates requiring an
  authenticated Sketchfab download. Codex chooses the final candidate; not
  actioned here.

Nothing was integrated on an unverified licence.

---

## 4. Verification

Real GPU throughout (`chromium` channel, `--use-angle=d3d11`), preview on
`http://localhost:4173` serving `dist`, rebuilt before each run.

### Focused suites added this run

`scripts/verify-task-lamp.mjs` — **passes.** Status `ready`; blocked-load
status `fallback`; no page or console errors in either; stage gone after
unmount. Drift-corrected pool luminance: lamp on **70.23**, off **66.30**,
back on **70.23** (exact return).

`scripts/verify-ceiling-fixture.mjs` — **passes.** Status `ready`, no errors,
ceiling-band peak luminance 228.27.

### Measurement caveats, stated because they matter

- The luminance figures are **pixel measurements, not photometric ones**.
- Idle camera drift moves whole-frame luminance by several levels between
  captures, so the lamp numbers are normalised against an unlit control region.
  Early readings that skipped this were contaminated; the ones above are not.
- Toggling the lamp changes **the whole frame**, not just the pool:
  `afterHours.js` blends the room's baked lightmap between an off and an on
  bake. A whole-frame diff is therefore expected and is not a bug.

### Pre-existing failures — reproduced at the baseline commit

`verify-v3` and `verify-after-hours` both fail on a click that triggers a route
change (`desktop-projects` into dhruvOS; the `WORK` link out of scan).
Playwright reports the element visible, enabled, stable and topmost, then times
out performing the click.

**This is not caused by this pass.** I built commit `f1b9aa9` in a separate
git worktree with its own preview on port 4174 and ran `verify-v3` against it:
it fails identically, at the same line, on code this run never touched. A
direct probe (`scripts/probe-launchpad-click.mjs`) shows the same button
clicks in **78 ms** and reaches `entranceState: inside` when clicked in
isolation, so the app path itself works — the failure is in those suites'
accumulated state or in this Playwright/headless combination, and it predates
this run. **It is unfixed and remains open.**

### Not checked — named explicitly

- **The arrival power stutter's effect on the new ceiling fixture.** The
  arrival completes before the room bake resolves, and the replay control is
  only rendered in states that harness cannot reach. The code path is the same
  one the old bulb used, but no test asserts it.
- **Any performance claim for the mouse or the fixture.** Nothing was measured.
  Triangles went down and two GLBs were added; that is not a net figure.
  `scripts/measure-gpu.mjs` was **not** run this session.
- **Lamp GPU cost** of the cached 512 px spotlight shadow map.
- **Transfer/VRAM delta** from the two new assets.
- **Mouse decimation at close range.** The engraved logo and button-seam
  creases visibly break up at the decimated density — see
  `scripts/shots/mouse-source.png` against `scripts/shots/mouse-decimated.png`.
  Both renders frame it far closer than any scene camera reaches, where the
  logo is well under a pixel. Accepted on that basis, not on triangle count.
- `verify-os-apps`, `verify-real-apps` and the other app-shell suites were not
  run: no shell or app contract changed.

---

## 5. Files changed

Runtime: `src/v3/desktop/buildWorkspace.js`, `afterHours.js`,
`deskContactShadows.js`, `authoredTaskLamp.js`, one dataset line in
`WorkspaceStage.jsx`; new `authoredMouse.js`, `authoredCeilingFixture.js`.

Assets: `public/models/after-hours/mouse.glb`, `ceiling-fixture.glb`,
`public/asset-credits.txt`.

Provenance: `art/vendor/sketchfab/a4tech_bloody_v7/`,
`art/vendor/polyhaven/hanging_industrial_lamp/` (both with ATTRIBUTION.md and
CHECKSUMS.json; the 16 MB of intermediate 1K PNGs is gitignored as derived).

Tooling: `scripts/blender/prepare_mouse.py`, `compare_mouse_decimation.py`,
`probe_mouse_axes.py`, `prepare_ceiling_fixture.py`, `probe_ceiling_lamps.py`,
`preview_ceiling_lamps.py`, `probe_fixture_profile.py`;
`scripts/verify-task-lamp.mjs`, `verify-ceiling-fixture.mjs`,
`probe-launchpad-click.mjs`.

Docs: `ROOM-SCALE-PROPOSAL.md` (new), `ASSET-REGISTER.md`, `STATE.md`,
`AFTER-HOURS-HANDOFF.md`, `TEAM-COORDINATION.md`, this file.

**Codex-reserved hand files were not touched.** `?hands=authored` remains
opt-in and the default hand rig is unchanged. Note that `handSurface.js` and
`public/models/hands-authored.bin*` showed uncommitted modifications from
another agent during this run; they were left exactly as found.

---

## 6. What I would do next, in order

1. **Decide the room scale** (`ROOM-SCALE-PROPOSAL.md`). Everything else in the
   realism direction is downstream of it, including the bake. Codex owns the
   hand-kinematics half.
2. **Rebake the indirect lighting** once, after that decision — not before.
3. **Get licences for the keyboard and chair**, or drop them and source CC0
   replacements. Both are owner actions.
4. **Fix or quarantine the pre-existing `verify-v3` / `verify-after-hours`
   click hang.** It currently hides real regressions in those suites, which is
   worse than the failure itself.
5. Only then: measure. A single `measure-gpu.mjs` run after the layout settles
   is worth more than one now against geometry that is about to change.
