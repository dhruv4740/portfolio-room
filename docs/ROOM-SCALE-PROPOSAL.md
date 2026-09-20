# Room scale: measured audit and a proposal

Written 2026-09-20 by Opus during the multi-pass integration run. Every
"current" figure below is read out of `src/v3/desktop/buildWorkspace.js`, not
recalled from an earlier document. Nothing in this file has been implemented.

## The problem, stated precisely

The room is internally consistent at roughly **1.5–2× human scale**. Three
props are now at **true 1.0× scale**: the phone (78 × 166 × 9 mm), the Poly
Haven task lamp (metre-scale CC0 asset) and, as of this pass, the mouse
(72.7 × 124 × 38 mm). Correct props on an oversized desk is what reads wrong —
not any single object.

## Measured, current against real

| Element | Current | Real-world | Ratio |
|---|---|---|---|
| Desk top | 3.52 × 1.45 m, surface at y = 1.165 | 1.4–1.8 × 0.7–0.8 m, 0.73–0.75 m | 2.2× / 1.9× / 1.6× |
| Monitor enclosure | 1.40 × 0.93 m | 27″ 16:9 ≈ 0.62 × 0.37; 32″ ≈ 0.72 × 0.43 | ~2× |
| `WORKSPACE.screen` | 1.28 × 0.79 m (1.50 m diagonal ≈ **59″**) | 27″ = 0.69 m diagonal | 2.2× |
| Keyboard case | 0.48 × 0.20 m | full-size ≈ 0.44 × 0.13 m | 1.1× / 1.5× |
| Chair seat top | y = 0.63 | 0.42–0.48 m | 1.4× |
| Ceiling | y = 3.12 | 2.4–2.7 m | 1.2× |
| Seated eye | y = 1.72 | 1.20–1.30 m seated | 1.35× |
| Mouse (this pass) | 0.124 × 0.0727 × 0.038 m | 0.124 × 0.066 × 0.038 m | **1.0×** |
| Phone | 0.078 × 0.166 × 0.009 m | — | **1.0×** |
| Task lamp | Poly Haven metre scale | — | **1.0×** |

## The non-obvious part

The seated composition is nearly right even though the absolute scale is not.
Eye height above the desk surface is currently **0.555 m** (1.72 − 1.165). Real
is 0.47–0.52 m. So from the seat, the *relative* geometry is close to correct,
and the scene reads acceptably. What fails is everything judged against a
true-scale object: the mouse and phone look like toys on a 3.52 m desk.

This means a uniform shrink is not required to fix the seated hero view. It is
required to make true-scale props sit correctly.

## Option A — uniform correction (recommended target, not for this session)

Scale the room by **1/1.6 ≈ 0.625** toward real dimensions:

| Element | Current | Proposed |
|---|---|---|
| Desk top | 3.52 × 1.45, y = 1.165 | **2.00 × 0.80, y = 0.740** |
| Desk thickness | 0.035 | 0.035 (already correct — do not scale) |
| Monitor enclosure | 1.40 × 0.93 | **0.72 × 0.45** |
| `WORKSPACE.screen` | centre [0, 1.79, −0.362], 1.28 × 0.79 | centre **[0, 1.12, −0.30]**, **0.66 × 0.39** |
| Monitor foot / stand | [0.5, .035, .29] / [.08, .31, .06] | [0.26, .022, .15] / [.045, .18, .035] |
| Keyboard case | 0.48 × 0.20 at y = 1.201 | 0.44 × 0.13 at y = **0.755** |
| Chair seat | y = 0.63 | **y = 0.45** |
| Seated eye | y = 1.72 | **y = 1.22** |
| Ceiling | 3.12 | **2.60** |

Props already at 1.0× (mouse, phone, lamp) **keep their sizes** and only move.

**Every consumer that must change in the same edit:**

1. `WORKSPACE.screen` — camera-travel target *and* the monitor's clickable
   plane both derive from it (`AGENTS.md` invariant).
2. `WORKSPACE.seat`, `WORKSPACE.overview`, `WORKSPACE.target`,
   `WORKSPACE.chair`, `WORKSPACE.min`/`max`.
3. Every entry in `WORKSPACE.anchors` (13 of them) and the projected
   `.anchor-marker` positions that derive from them.
4. `WORKSPACE.deskSurface` and `matSurface` — these feed the contact-shadow
   camera bounds and the raised receiver in `deskContactShadows.js`.
5. The static contact caster set and `contactShadow()` decal placements.
6. `authoredTaskLamp.js` mount (derives from `deskSurface`, so it follows
   automatically — but its screw offset is tied to desk thickness, which must
   **not** scale).
7. `authoredMouse.js` anchor, `authoredCeilingFixture.js` mount.
8. `buildRoomInteractions.js` object rest positions and travel distances.
9. `sceneDirector.js` arrival path waypoints.
10. The baked lightmaps and the indirect bake — a rebake, not a rescale.

**What breaks and why this is Codex's call:** `seatedHands.js` drives hand
pose in **world space**, and `POSES`/`HAND_REST` encode reach in metres. A
0.625 scale on the room without a matching rework of hand kinematics puts the
hands through the desk or short of the keyboard. `docs/OPUS-GEMINI-CONTINUATION.md`
says explicitly to record the dimensions and defer that portion. That is what
this file is.

## Option B — partial correction (considered and rejected)

Shrink only the monitor (1.40 × 0.93 → 0.72 × 0.45), which is not coupled to
hand kinematics, and leave the desk.

Rejected: a correctly sized 32″ monitor on a 3.52 m desk makes the desk read as
*more* oversized, not less, because the monitor is currently the reference the
eye uses to judge the desk. A half-correction moves coherence backwards. It
also shrinks the portfolio's centrepiece — `WORKSPACE.screen` carries the
"Things I made." content — in the overview hero shot.

If only one thing is ever done, it should be Option A or nothing.

## Consequence for the task lamp bake

`docs/REALISM-ASSET-CHECKPOINT.md` defers the indirect rebake until the layout
settles, and that still holds. The current bake reflects the task light's
*previous* placement, and the lamp has since moved to the rear desk edge and
had its source lowered below the shade rim (commit `df304fe`). **No claim is
made that the current indirect bake is physically accurate.** Rebake after a
layout decision, not before.
