# Status for Codex — 2026-09-20

Written by Opus at the owner's request, covering everything Opus and Gemini did
while Codex was paused. Read section 2 before you touch anything: Gemini has
uncommitted edits inside your reserved files, and one of them changes a
default the contract told us all to leave alone.

Branch `feat/v3`. Build/browser/GPU slot: **held by Opus, now RELEASED.**

---

## 1. What Opus shipped (committed, verified)

| Commit | What |
| --- | --- |
| `df304fe` | Task lamp: light source moved below the shade rim |
| `539311f` | A4Tech Bloody V7 mouse replaces the box mouse |
| `44efcdf` | Poly Haven industrial pendant hung from the ceiling |
| `9aab140` | Chair integrated (**since reverted**) |
| `921397f` | Chair reverted |
| `a50730a` | Licensed mechanical keyboard replaces the procedural one |
| `08a0204` | Handoff docs |

Full detail is in `OPUS-MULTIPASS-HANDOFF.md`. Three things there affect you.

### 1a. The keyboard is now at real key pitch, and it makes the hands look big

Cap pitch went from the procedural 34 mm to the asset's real 23.2 mm. The hand
rig did not change, so a fingertip now covers roughly two keys. **This is not a
keyboard defect and I did not try to fix it** — it is the scale question in
`ROOM-SCALE-PROPOSAL.md` becoming visible, and the hand half of that decision is
yours. See `scripts/shots/keyboard-seated.png`.

The contract the keyboard preserves, so you can rely on it:

- `model.keys` is still a single `THREE.InstancedMesh` and still the same object
  across the async load — the asset swaps `.geometry` underneath it.
- Instances **0–59** are the `KEY_ROWS` grid in row-major order. `instanceId`,
  `setKey`, `pressKey`, `KEY_ROWS` and the hit path are unchanged.
- Instances **60–91** are modifiers. `setKey`'s pre-existing `index >= 60` bounds
  check already ignores them.
- `KEY_TOP = 1.2375` still holds for the home row. Cap tops now stagger per row
  from 1.2349 to 1.2438, centred on that value — so the finger dip is correct at
  the home row and up to ~4.5 mm off at the outer rows.

Note for the record: the candidate README's claim that this mesh was monolithic
and its keys therefore undepressable was **wrong**. It is one mesh object but 92
keycaps of identical 333-vert topology. I had repeated that claim to the owner
as a reason the work would be large and risky; it was neither.

### 1b. The chair was reverted on style, not licence

It integrated correctly (scaled so the seating surface lands on the room's
existing seat height, orientation measured from the export). It is an ornate
Victorian captain's chair, not the worn leather office chair its README claimed.
`prepare_chair.py` and the provenance are kept so it can be redone.

### 1c. The `verify-v3` click hang is not a code defect

`verify-v3` passes **41/41** with `GPU=1`; without it, it times out clicking
`desktop-projects`. Not an actionability problem — the button's bounding box is
byte-identical across six samples, and `click({force: true})` also times out with
`data-entrance-state` still `room`, so the input event never lands. That points
to renderer main-thread starvation under the software rasteriser. **Run the
suites with `GPU=1`; a run without it is not a regression.**

---

## 2. Gemini's work — UNCOMMITTED, and inside your reserved files

Gemini retargeted the BAMEN "FPS Female Arms" model onto the `seatedHands.js`
rig. The visual result is genuinely good: I captured it myself and it is real
bare skin — fingers, knuckles, palms, wrists and forearms, with 1K PBR maps.
That resolves the long-running gloves-vs-bare-hands dispute in Gemini's favour.

**But it is all sitting uncommitted in the working tree, and it touches files
reserved to you.** I did not commit it and I did not revert it. It is exactly as
Gemini left it:

```
 M src/v3/desktop/handSurface.js              <- RESERVED TO CODEX
 M scripts/build-authored-hands.mjs           <- RESERVED TO CODEX
 M art/after-hours/authored-hands/source-skin.json
 M public/models/hands-authored.bin           1.52 MB -> 5.91 MB
 M public/models/hands-authored.bin.gz        543 KB  -> 1.35 MB
 M public/models/hands-authored/color.jpg     278 KB  -> 77 KB
 M public/models/hands-authored/normal.png    2.01 MB -> 1.52 MB
 M public/models/hands-authored/roughness.jpg 300 KB  -> 119 KB
```

### 2a. The authored hands are now the DEFAULT. This breaks a standing rule.

`handSurface.js` line 4 changed from opt-in to opt-out:

```js
-const authored = ... new URLSearchParams(...).get('hands') === 'authored';
+const authored = ... handsParam !== 'procedural' && handsParam !== 'v1';
```

The contract in `TEAM-COORDINATION.md` says "Keep `?hands=authored` opt-in."
This is now inverted. I verified it empirically rather than reading the diff —
loading with **no query parameter at all**:

| URL | Assets fetched | Total |
| --- | --- | --- |
| `/` (no param) | `hands-authored.bin.gz`, `color.jpg`, `normal.png`, `roughness.jpg` | **3.06 MB** |
| `/?hands=authored` | identical | 3.06 MB |
| `/?hands=procedural` | `hands-v1.bin.gz` | 1.67 MB |

So every visitor now downloads **+1.39 MB** versus the procedural path, and the
authored rig ships without anyone having opted into it. `normal.png` alone is
1.52 MB of PNG on the default path.

I have deliberately **not** reverted this. The owner authorised Gemini's work
and may well want bare hands as the default now that they look right — but that
is a decision to take explicitly, with the payload in view, not to inherit from
an uncommitted diff. It is your file; the call is yours or the owner's.

### 2b. A test hook lost a distinction it used to make

`WorkspaceStage.jsx`'s `boxOf` was changed so that when `clothMesh` is hidden it
falls back to `skinMesh`. Consequence, measured live:

```
armL  {"min":[-0.1626,1.2262,0.2591], "max":[-0.0259,1.3094,0.7404]}
handL {"min":[-0.1626,1.2262,0.2591], "max":[-0.0259,1.3094,0.7404]}
```

`boxOf('armL')` and `boxOf('handL')` now return **the same box**. Any assertion
that compares arm bounds against hand bounds is now comparing an object with
itself and will pass vacuously. Worth auditing before you trust those suites.

### 2c. What I confirmed myself, and what I did not

Confirmed by my own runs against this tree:

- `verify-v3` — 41/41 with `GPU=1`.
- `verify-room-interactions` — full pass with `GPU=1`, including its
  cold/warm keyboard and idle assertions.
- `verify-reduced-hands` — passed, all 8 actions, 19–71 ms.
- Bare skin renders correctly; the skin-to-sleeve junction is clean when viewed
  from the side (`scripts/shots/arm-side.png`).

**Not** independently confirmed — reported by Gemini, take as a claim:
`verify-os-apps`, `verify-real-apps`, and the per-pose GPU inspections for
phone / coffee / pen / notebook / award / resume / lamp.

One observation, not a defect claim: the procedural upper-arm sleeve cylinder is
now visibly coarse next to the realistic forearm — a smooth thick tube. It reads
fine at the seated camera but the user can drag to look, and from the side it is
noticeable.

---

## 3. What is waiting on you

1. **Decide the hands default** (§2a). Either commit Gemini's opt-out change
   deliberately, accepting +1.39 MB on the default path and probably shrinking
   `normal.png`, or restore `?hands=authored` as opt-in. Nothing else should be
   built on top of this until it is settled, because it is uncommitted.
2. **Room scale** (`ROOM-SCALE-PROPOSAL.md`). Now more urgent: the real-pitch
   keyboard makes the hand/room mismatch obvious. `seatedHands.js` drives pose
   in world space, so this is yours.
3. **Rebake indirect lighting** — after §3.2, not before. The current bake is
   documented as not accurate for the lamp's present placement.
4. **Audit `boxOf`-based assertions** (§2b).
5. Owner action, not yours: supply the Sketchfab URL for the keyboard so its
   licence class can be recorded. CC BY-ND is the only class that would force a
   removal, since the cap is decimated.

Opus touched no reserved hand file. `scripts/probe-seated.mjs`,
`probe-seated2.mjs`, `probe-walls-fps.mjs`, `.claude/`, `resume/` and the
candidate downloads are untouched.
