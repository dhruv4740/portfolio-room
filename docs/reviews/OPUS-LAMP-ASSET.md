# OPUS — Poly Haven desk lamp asset preparation

**READY FOR CODEX REVIEW**

Isolated asset prep. Nothing under `src/` or `public/` was touched, nothing was
imported into the runtime, no Blender file outside the owned folder was opened
for writing, no build or browser was run, and no renders were produced.

## Output paths

All under `art/vendor/polyhaven/desk_lamp_arm_01/`:

| Path | What it is |
|---|---|
| `export/desk_lamp_arm_01.glb` | **the candidate runtime file** — 2,989,048 B (2.85 MiB) |
| `work/desk_lamp_arm_01_work.blend` | editable derived Blender file, posed and re-rooted |
| `source/blend/` | untouched Poly Haven native .blend + its 5 textures |
| `source/gltf/` | untouched Poly Haven glTF 1K variant + 3 JPEGs + shared .bin |
| `ATTRIBUTION.md` | source URLs, authors, CC0 verification, provenance |
| `CHECKSUMS.json` | per-file URL, size, manifest MD5, verification result, SHA-256 |
| `tools/` | the 12 scripts that downloaded, inspected, built and verified the above, plus their 4 JSON reports |

## Source verification

All 11 files were downloaded by following URLs from
`art/after-hours/lamp-download-manifest.json` — none guessed — and **every one
matched the manifest MD5 and byte size**. SHA-256 recorded for each in
`CHECKSUMS.json`. The glTF variant's shared `desk_lamp_arm_01.bin` comes from a
path containing `/8k/`; that is the single shared geometry buffer, not a
texture, and no 8K texture was downloaded.

License: Poly Haven's site-wide license page (fetched 2026-09-20) states all
assets are CC0. **The per-asset API response carries no `license` field**, so
CC0 rests on the site-wide page, not per-asset metadata. Authors: Kuutti
Siitonen (modeling & texturing), Yann Kervran (rigging) — matches the page.

## What the source actually is

Blender 5.2.2, metric, `scale_length` 1.0, metres, Z-up.

- 27 `geo_*` mesh objects, 1 armature (`rig_lamp`, **53 bones**), 2 NURBS
  curves, 7 hook empties, 6 zero-triangle rig widget meshes.
- **2 materials**, one UV set (`UVMap`) on every mesh, no vertex colours used.
- No cameras, no lights, no actions in the source file.
- Raw mesh triangles 23,070. The two cable meshes carry Array + Curve
  modifiers; evaluated, the model is 25,710 triangles, matching the published
  `polycount`.

**Published dimensions are computed naively.** The API reports 617.3 × 408.0 ×
879.0 mm, which reproduces exactly if you union each object's *local* bounding
box pushed through its matrix. The vertex-exact extent is smaller. Every figure
in this document is vertex-exact and stated in the delivered pose; treat the
879 mm as Poly Haven's number, not as a measurement of the geometry.

### The mount is a real G-clamp, and the brief's assumption needs adjusting

The prompt says "this is a clamp lamp" — correct — but the parts are not named
"clamp" and the clamp is not a separate object. It is the bottom of
`geo_base_pivot` plus the whole of `geo_pivot-holder`:

- `geo_base_pivot` carries a **910.5 mm² downward-facing pad** — by a wide
  margin the largest horizontal face in the assembly. This is the upper jaw,
  the face that rests on the desk top. **The GLB origin is the centre of this
  face** (verified residual exactly `[0, 0, 0]`).
- Below it, a void, then the yoke closing the C at y ≈ −0.0475 … −0.0481.
- `geo_pivot-holder` is the screw: a 6.8 mm square-section threaded stem from
  y = −0.0884 up to y = −0.02057, with a wing tab at the bottom and a
  **230.1 mm² upward-facing pad** at the top — the moving jaw that presses up
  against the desk underside.

**Desk thickness = 20.57 mm** (upper jaw at y = 0, screw pad at y = −0.02057)
in the delivered file. Physical capacity to the yoke is ≈ 48.1 mm.

The screw *is* rigged: `ctrl_pivot-holder` carries a Limit Location whose only
free axis is local Y, which resolves to world +Z exactly, with range
−24.0 mm … +15.8 mm. **That travel exists only in Blender.** In the GLB the jaw
gap is frozen at 20.57 mm.

**Placement constraint Codex must honour: 88.4 mm of the model hangs below the
origin plane**, inside X ∈ [−0.021, 0.043], Z ∈ [−0.027, 0.018] (glTF Y-up,
metres). The lamp cannot sit on a solid desktop — it needs a desk edge, an
overhang, or geometry that permits the clamp to pass through.

## The delivered GLB

Axes: **glTF Y-up, metres, right-handed.** +Y is up, the origin is the clamp's
upper-jaw desk-contact pad centre. Blender Z-up `(x, y, z)` maps to glTF
`(x, z, −y)`.

| | |
|---|---|
| Triangles | **26,158** |
| Nodes / meshes | 27 / 27 — one per source part, nothing baked together |
| Materials | 2 |
| Images / textures / samplers | 4 / 7 / 1, all embedded, 2,143,469 B (2.04 MiB) |
| File size | 2,989,048 B = **2.85 MiB** (target was under 4 MiB) |
| Bounds X | −0.25198 … 0.32944 (0.58143 m) |
| Bounds Y | −0.08840 … 0.68636 (0.77477 m) |
| Bounds Z | −0.15888 … 0.17510 (0.33398 m) |
| Cameras / lights / skins / animations | none |

26,158 rather than 25,710: the working pose stretches the cable curves, so the
fit-to-curve Array modifier emits 448 more triangles. Both figures are the
evaluated model; 23,070 would have meant the wire modifiers failed to apply.

### Pose

**The file as delivered by Poly Haven does not satisfy the brief.** Its rig
settles — via IK, Copy Rotation, Stretch To and Damped Track — into a pose
aiming the shade **28.3° below horizontal**, i.e. mostly sideways. (The raw,
unevaluated mesh aims straight down, which is why a naive read of the source is
misleading.)

Both head controls are clamped by the rig's own Limit Rotation constraints to a
single free axis each: `ctrl_top_rotation_A` only rolls the shade about its
barrel (best achievable elevation 34.7°), and `ctrl_top_rotation_B` is the
tilt. Sweeping both, **zeroing them puts the emitter at 89.7° — dead straight
down.** That is the rig's own neutral, not an arbitrary value, and it is what
was exported.

Measured emitter in the delivered GLB (glTF Y-up, metres):

- centroid **(−0.14886, 0.56546, 0.07183)**
- aim **(0.00459, −0.99999, −0.00213)**

So the shade sits 565 mm above the desk, 149 mm out along −X and 72 mm along
+Z, pointing at the desk surface. An ordinary working pose. A different pose is
available on request — the work .blend keeps the full rig.

### Materials

| glTF material | maps |
|---|---|
| `desk_lamp_arm_01` | baseColor, metallicRoughness, normal, occlusion |
| `desk_lamp_arm_01_light` | the above **plus emissiveTexture**, `emissiveFactor [1.0, 0.98379, 0.64911]` |

Runtime maps were retargeted from the source EXRs to the Poly Haven glTF 1K
JPEGs. glTF cannot carry EXR, so leaving them would have forced the exporter to
synthesise and re-encode PNGs; the ARM JPEG is already AO/Rough/Metal packed the
way glTF wants, and an already-JPEG image is copied rather than re-encoded. The
diffuse JPEG is byte-identical between the two variants (same MD5). Net effect:
4 embedded images at 1K, 2.04 MiB, no re-encoding, no quality loss beyond
Poly Haven's own 1K JPEGs.

**The emissive survived, and it took a rewire to do so.** In source, `mask01`
drives Principled **Emission Strength**, which glTF models as a scalar — a
texture there is silently dropped, and the whole 1,504-triangle inner dish would
have glowed uniformly. It was moved onto Emission Color via a multiply with the
source's own warm colour. The GLB parse confirms a real `emissiveTexture`
alongside the warm `emissiveFactor`. `mask01`'s colourspace was changed
Non-Color → sRGB, which glTF requires for an emissive map. No other material
change was made.

## Integration

```js
new GLTFLoader().load(url, (gltf) => {
  const lamp = gltf.scene;            // add untransformed, then place
  lamp.position.set(deskEdgeX, deskTopY, deskEdgeZ);
  scene.add(lamp);
});
```

1. **Place by the origin.** `(0, 0, 0)` is the desk *top surface* at the clamp
   pad centre. Set the lamp's world position to the point on the desk top where
   the clamp should bite. Do not offset by the model height.
1b. **Rotate about +Y before placing.** In local space the shade extends
   **149 mm along −X** and 72 mm along +Z from the clamp. Clamping at a desk
   edge without rotating will aim the head off the desk rather than onto it.
   Rotate the group about +Y so −X points toward the work area, then place.
2. **Leave room below.** 88.4 mm hangs beneath that plane in a
   64 × 45 mm footprint. Desk edge or overhang only.
3. **Add the light yourself.** The GLB contains no lights. In the lamp's local
   space, place a `SpotLight` at `(-0.14886, 0.56546, 0.07183)` with its target
   at `(-0.14886, 0, 0.07183)` — aim is `(0.00459, -0.99999, -0.00213)`, i.e.
   straight down. Nest both under the lamp group so they follow placement.
4. **Articulation is static.** See limitations — do not transform sub-nodes
   expecting the linkage to follow.
5. **Dispose** by traversing `gltf.scene` and disposing each `mesh.geometry`,
   each material, and each material's textures; `GLTFLoader` does not own them
   after load.

Addressable node names, if Codex wants to hide, recolour or measure parts:
`geo_lamp-head` (13,862 tris), `geo_top_wire` (2,112), `geo_lamp-base-pivot`
(1,296), `geo_pivot-holder` (1,200, the clamp screw), `geo_middle_wire` (1,104),
`geo_base_pivot` (852, the clamp body), `geo_middle-pivot` (724),
`geo_arm_2_a` (396), plus 19 smaller parts.

## Verification performed

Three independent passes, no renderer at any point:

1. **Blender inspection of the untouched source** — units, hierarchy, materials
   and the socket each texture ultimately drives, modifier stacks, raw vs
   evaluated triangle counts, 53 bones and every pose constraint, UV sets. Plus
   targeted vertex-level probes of the clamp's horizontal faces and the emissive
   face set.
2. **Direct GLB container parse** (`tools/verify_glb.mjs`, no three.js) — header
   and chunk integrity, declared vs actual length, node/mesh/material/image
   counts, primitive modes, triangle count, accessor min/max presence, world
   bounds, texture slot assignments, embedding, and absence of cameras, lights,
   skins and animations. **All checks pass.** Its expected triangle count and
   bounds are read from the Blender-side measurements rather than typed by hand,
   so the two passes must agree.
3. **Reimport of the GLB into a clean Blender session** — independently
   reproduced 27 meshes, 26,158 triangles, identical bounds, emitter aim
   `(0.00459, 0.00213, -0.99999)` in Blender Z-up, all 5 texture references
   resolved and packed with non-zero size, and no lights, cameras or armatures.

## Limitations and things not verified

- **No render has happened.** Nothing here is a claim of visual acceptance.
  Whether the lamp reads correctly under the room's lighting and whether the
  worn-metal albedo sits right against the room's palette are both open.
  On the one question I can bound: in the straight-down pose the `geo_lamp-head`
  and `geo_arm_2_a` bounding boxes overlap in a **22 mm band** around
  x ≈ −0.05 (head X −0.25198…−0.04518, arm X −0.06733…0.29834; head Y
  0.49981…0.68136, arm Y 0.36325…0.62733 in Blender Z-up). Bounding boxes
  overlapping is not surface interpenetration — whether the actual surfaces
  touch is unverified and needs eyes on it.
- **Blender constraints do not survive glTF**, as the brief anticipated. The
  53-bone rig uses IK, Copy Transforms, Copy Rotation, Copy Location, Stretch
  To, Damped Track, Limit Rotation, Limit Location and a Transformation
  constraint — the exporter carries none of them. The GLB was therefore exported
  **without skinning**, as 27 named mesh nodes carrying their own transforms.
  This was deliberate: a skinned export would have shipped 53 joints whose
  constraints all drop, so posing any one joint in three.js would tear the
  linkage apart. Articulation in the GLB is static. To change the pose, edit
  `work/desk_lamp_arm_01_work.blend` and re-run `tools/prepare_and_export.py`.
- **The clamp screw's 39.8 mm travel is Blender-only.** Jaw gap in the GLB is
  frozen at 20.57 mm.
- **Both materials export `doubleSided: true`**, inherited from the source's
  material settings. Codex may want `side: THREE.FrontSide` for fill-rate; I did
  not change it, since that is a material decision Codex owns.
- The exporter logged *"More than one shader node tex image used for a texture"*
  twice, because both materials reference the same images through separate
  nodes. Result is 7 texture entries over 4 images with 1 shared sampler. Benign,
  but it is a real warning and I have not proven the sampler settings are
  identical between the two.
- `geo_middle_wire` and `geo_top_wire` carry vertex groups named
  `DEF_arm-joint`, `DEF_lamp-head-wire`, `DEF_arm-2-a` — **uppercase, and no
  such bones exist** among the 53. Those Armature modifiers are inert in the
  source; the cables are driven purely by Curve + Hook. A source quirk, not
  something I introduced, and it does not affect the export.
- The work .blend retains orphaned EXR image datablocks (`rough`, `metal`) with
  no users after the retarget. They are excluded from the GLB
  (`export_unused_images=False`, confirmed: 4 images embedded) but they do
  inflate the .blend slightly.
- Texture *quality* at 1K was not assessed at the camera distance Codex will
  use. The 2K set exists and would cost roughly +3 MiB; the 4 MiB budget has
  ~1.15 MiB of headroom, so a 2K upgrade of a single map is feasible but a full
  2K set is not.

## Changed-file list

Created, all inside the two allowed locations:

```
art/vendor/polyhaven/desk_lamp_arm_01/ATTRIBUTION.md
art/vendor/polyhaven/desk_lamp_arm_01/CHECKSUMS.json
art/vendor/polyhaven/desk_lamp_arm_01/export/desk_lamp_arm_01.glb
art/vendor/polyhaven/desk_lamp_arm_01/work/desk_lamp_arm_01_work.blend
art/vendor/polyhaven/desk_lamp_arm_01/source/blend/desk_lamp_arm_01_1k.blend
art/vendor/polyhaven/desk_lamp_arm_01/source/blend/textures/         (5 files)
art/vendor/polyhaven/desk_lamp_arm_01/source/gltf/desk_lamp_arm_01_1k.gltf
art/vendor/polyhaven/desk_lamp_arm_01/source/gltf/desk_lamp_arm_01.bin
art/vendor/polyhaven/desk_lamp_arm_01/source/gltf/textures/          (3 files)
art/vendor/polyhaven/desk_lamp_arm_01/tools/                         (12 scripts + 4 JSON reports)
docs/reviews/OPUS-LAMP-ASSET.md
```

Modified: none. No Git operations were performed.
