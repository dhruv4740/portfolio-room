# Codex checkpoint for Opus/Gemini — 2026-09-20

This records actual implementation and evidence, not the final artistic target.
Read OPUS-GEMINI-CONTINUATION.md for what to do next.

Code checkpoints: `1aa34c1` (lamp + phone), `61fadee` (opt-in hand retarget).
The documentation handoff follows those commits. No pushes.

## Default live scene

- Poly Haven articulated task lamp integrated from Opus's prepared 2.85 MiB
  GLB. Source is CC0, 26,158 triangles. `authoredTaskLamp.js` batches 27 source
  parts into two static material meshes after screw adjustment. Native source,
  editable .blend, export tools and integrity records live under art/vendor.
- Mount at rear desk edge x=-1.28, y=1.165, z=-.755, rotation +90° Y.
  Source +X clamp web faces out/back. Screw moves down 14.43 mm to match a
  35 mm desktop; root origin is the upper contact pad. Lamp stays metre scale.
- Desktop thickness reduced from 120 to 35 mm, edge radius 8 mm. Steel legs
  extend to the new underside; inlay repositioned. Overall desk width/depth,
  height and oversized monitor are NOT corrected yet.
- Real downward SpotLight replaces omnidirectional bulb. Source emitter
  (-.14886,.56546,.07183); light 8 mm below it avoids emitting inside the dish.
  Intensity 5.5 on, angle .8, penumbra .7. Latest change adds cached 512px
  shadow, not per-frame updates. Old pool decal hidden after successful load.
  Switch modulates light and actual masked emissive material. Fallback retained.
- `afterHours` waits for lamp load before capturing its environment probe;
  stage exposes data-task-lamp. Current old indirect bake still reflects the
  previous task-light placement. Rebake after layout settles.
- Phone now 78 x 166 x 9 mm, display inset with .4 mm surface clearance; rests
  on desk. The 390 CSS-pixel DOM stage is unchanged. Pickup thumb clearance
  increased and generic world-up arc disabled ONLY during phone underhand
  roll, since that arc passed through the tilted case. Other actions keep arcs.

## Authored hand experiment — opt-in ONLY

`/?hands=authored&sky=day` loads the downloaded DJMaesen FP arms retarget.
Default remains the existing procedural hands. Gemini's report is wrong about
bare skin: actual texture atlas and room rendering show fingerless leather
gloves and cloth sleeves. Preserve the report as historical, not current truth.

Blender inspection: 59 bones, 40 deform vertex groups, 4,982 source vertices,
9,860 actual loop triangles. New extraction script reads original mesh/UVs/
weights/rest joints without changing FBX. Node retarget transfers source
bone-local anatomy to the existing 19-control-bone contract, straightening
curled source digits, merging forearm influences and clipping inside cuff.
Authored UVs/weights retained, normals smoothed, original cloth rig retained.

Files: scripts/blender/extract_authored_hands.py;
scripts/build-authored-hands.mjs; art/after-hours/authored-hands/source-skin.json;
public/models/hands-authored.bin(.gz); public/models/hands-authored/.
7,984 skin triangles after hidden-arm clipping, 1,523,704-byte raw binary,
about 543 KB gzip; 1K color/normal/roughness about 2.59 MB total.
Do NOT run build-hand-assets.mjs expecting FBX import: it regenerates procedural
hands. Source textures/FBX remain local candidate downloads. Credits shipped.

Known prototype limits: fabric cuff intersects the current shirt; this is not
a clean bare wrist asset. Not every action reviewed, no claim of anatomically
correct finger contact or default readiness. It exists to evaluate adaptation,
not to substitute gloves silently. Codex owns further retarget decisions.

## Evidence and exact gaps

- Production build passed after final source changes. One transient OneDrive
  error opening public/os/vendor/three.core.js cleared on a single retry.
- `verify-phone-grip.mjs`: real GPU, 23 pickup samples from t=.35 to1.88;
  every sample has zero skinned vertices strictly inside the case, no page
  errors, stage reached and Escape returned to desk. This is a vertex-volume
  check, NOT complete continuous collision/contact proof or reverse-path proof.
- Earlier lamp integration `shots-after-hours`: night overview/seat/window/
  coffee, no page/console errors. This PRECEDES moving lamp to rear edge,
  two-mesh batching and the new spotlight shadow. Do not call it final validation.
- Authored prototype `GPU=1 HANDS=authored shots-hands coffee award pen phone`:
  completed without browser errors. Daylight rest and pen frames inspected;
  glove material and cuff mismatch confirmed. That run included rear-edge lamp
  placement/two-mesh batching but PRECEDES spotlight shadow and last phone fix.
- Final lamp shadow/on-off/fallback/disposal/GPU-cost acceptance outstanding.
  Full affected regression outstanding. No new overall performance claim.
- Existing procedural hand pass previously passed build, binary checks,
  full day shots, focused final night cup/award, reduced-hands eight actions,
  held-object and contact-low eleven checks. These predate this asset pass.

## Working tree and reproduction

Codex committed its code, derived prototype assets, lamp sources and updated
reference rig; the documentation handoff is the next checkpoint. User files and bulk downloaded candidates
remain untracked intentionally. Do not clean or blindly git add everything.
Inspect `git log` for the actual checkpoint hash instead of assuming an old one.
The preview serves dist; rebuild after edits before testing. No browser/GPU
process remains reserved by Codex after handoff; Opus receives the slot.
