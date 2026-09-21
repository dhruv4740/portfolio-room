# Hands: default restored, and why the body shifts when you pick things up

Opus, 2026-09-21, at the owner's request. Two separate problems. Measured on
real ANGLE D3D11 via `scripts/review-hands-compare.mjs` and
`scripts/review-hands-probe.mjs`; frames in `scripts/shots/hands/`.

**Reserved-file note:** `handSurface.js` is Codex's. Exactly one line changed —
the default selector — because the recorded contract already says that default,
and the owner asked for it. No anatomy, no surface, no retarget work was
touched. The BAMEN retarget remains reachable and remains Codex's to finish.

## 1. The authored hands were the default, against the written rule

`TEAM-COORDINATION.md` says "Keep `?hands=authored` opt-in."
`ASSET-REGISTER.md`, `HAND-REALISM-PASS.md`, `REALISM-ASSET-CHECKPOINT.md` and
`CODEX-HAND-SUPPORT-PASS.md` all describe it the same way. The code had it
inverted as a blocklist:

```js
const authored = handsParam !== 'procedural' && handsParam !== 'v1';   // was
const authored = handsParam === 'authored' || handsParam === 'bamen';  // now
```

So every visitor with no query string got the authored retarget. Restored to a
whitelist, which matches all four documents.

Verified: the no-parameter path now loads the procedural rig — 75,860 triangles
across 6 parts, identical to `?hands=procedural`. The authored path is
unchanged at 31,886 across 12.

`?hands=v1` and `?hands=procedural` both resolve to `hands-v1`. They are one
mode, not two; earlier notes listing them separately are misleading.

## 2. Why the authored surface reads "dead and melted"

Two independent causes, and they are not both topology. Measured off the
materials at runtime:

| | base roughness | colour map | normal map | triangles | parts |
|---|---|---|---|---|---|
| authored | **1.0** | `color.jpg` | set | 31,886 | 12 |
| procedural | 0.76 | none | none | 75,860 | 6 |

- **"Dead"** is the material: base roughness **1.0** is fully matte, so the skin
  returns no specular response at all under the room's single key. The
  procedural surface sits at 0.76 and still catches a highlight.
- **"Melted / merged"** is the topology: the authored surface carries **42% of
  the procedural triangle count**, and at that density the implicit-union skin
  loses the webbing and the gaps between fingers, so the digits read as one
  paddle. The owner's screenshot shows exactly this.

These are separable. Raising the base roughness alone would fix the dead look
without fixing the fusion. **Neither is fixed here** — that is Codex's surface.

**Correction to an earlier claim:** the one 404 seen on the authored run is
*not* a missing hand texture. Logging every response, both modes report **zero
failed requests**; all three authored maps load. It is the same unrelated
one-off seen in the room render passes.

## 3. The body shift is the scale problem, quantified

`seatedHands.update()` accumulates `torsoOffset` whenever a wrist is farther
than `REACH` from its shoulder, and `buildSeatedFigure.setUpperBodyOffset()`
translates the torso vertices by that vector — **including its Y component**.

```
REACH = UPPER_ARM 0.32 + FOREARM 0.27 − 0.015 = 0.575 m
```

Measured in the live room, right shoulder at [0.275, 1.40, 1.23]:

| Anchor | Shoulder distance | Over reach by | Torso dy | Torso dz |
|---|---|---|---|---|
| drawer | 1.105 | 0.530 | **−0.197** | −0.293 |
| headphones | 1.349 | 0.774 | −0.092 | −0.734 |
| coffee | 1.405 | 0.830 | −0.093 | −0.455 |
| pen | 1.682 | 1.107 | −0.120 | −0.770 |
| award | 1.932 | 1.357 | −0.046 | −1.018 |
| lamp | 2.246 | 1.671 | −0.141 | −1.198 |
| windowOpen | 3.267 | 2.692 | **+0.486** | −2.357 |
| blinds | 3.320 | 2.745 | **+0.289** | −2.241 |

At rest, before anything is touched, `torsoOffset` is already
**(0.01, −0.036, −0.234)** — the torso sits 23 cm forward permanently.

**Not one interactive anchor in the live room is within arm's reach.** Every
single one saturates the solver, so the lean compensation does all the work,
and because that compensation is an unconstrained 3D translation the whole
upper body slides vertically — down as much as 20 cm for the drawer, **up as
much as 49 cm** for the window. The sign flips at shoulder height (1.40): reach
below it and the body sinks, above it and the body rises. That is what "picking
shifts up the entire body" is.

A real shoulder does not translate vertically by half a metre. It rotates, and
scapular elevation contributes a couple of centimetres at most.

### Adoption does not fix this on its own — correcting an assumption

I expected the true-scale room to bring these inside reach. It does not.
Against the contract's shoulder midpoint [0.05, 1.10, 0.82]:

| Anchor | Live distance | Cinematic distance |
|---|---|---|
| keyboard | — | 0.773 |
| mouse | — | 0.739 |
| drawer | 1.105 | 0.825 |
| pen | 1.682 | 0.977 |
| coffee | 1.405 | 1.010 |
| blinds | 3.320 | 2.138 |

**0 of 15 anchors are within REACH in the cinematic room either.** The excess
roughly halves, so the shift would be smaller — but it would still be there.

The reason is in the shared contract itself: the shoulder at z = 0.82 with the
keyboard centred at z = 0.17 puts the home row **0.72 m** from the shoulder
midpoint in a straight line, and a fully extended human arm in this rig is
0.575 m. A seated typist's shoulder sits roughly 0.40–0.50 m behind the home
row. **This is a concrete fit problem in the contract, not in the candidate.**

Proposed revision for Codex, flagged rather than silently applied: move the
shoulder midpoint forward to roughly **z = 0.62** (and the seated camera with
it), or move the desk and keyboard back by the same ~0.20 m. Either brings the
keyboard, mouse, notebook and drawer inside reach and leaves only the genuinely
out-of-reach props — window, blinds, lamp, ceiling fixture — needing a lean.

The second fix is independent of scale and belongs to `seatedHands`:
**constrain the vertical component of `torsoOffset`**, or drive a shoulder
rotation rather than a torso translation. Even with a perfect room, a target
above shoulder height will keep lifting the whole body while that translation
is unconstrained. Both are Codex's files; neither was changed here.

## What was changed

| File | Change |
|---|---|
| `src/v3/desktop/handSurface.js` | One line: default selector back to opt-in |
| `scripts/review-cinematic-room.html` | `hands` param no longer strict `'1'`, so the procedural surface is reachable with the figure visible |
| `scripts/review-hands-compare.mjs` | New: three modes, live room, real GPU |
| `scripts/review-hands-probe.mjs` | New: materials, failed requests, reach table |

Not changed: any hand surface, anatomy, retarget, texture or the BAMEN asset.
