# Candidate: Gaming Mechanical Keyboard

- **Directory**: `art/candidates/keyboard/gaming-keyboard/`
- **Model File**: `source/keyboard.FBX` (FBX version 7400)
- **Status**: **SHIPPED** as `public/models/after-hours/keyboard.glb`.
  See `art/vendor/sketchfab/gaming_mechanical_keyboard/ATTRIBUTION.md`.
  Two claims below were wrong and are corrected in section 3.

---

## 1. Measured Geometry & Hierarchy (Blender 5.2.2 Headless Inspection)

- **True Triangles (Loop Triangles)**: **71,399 triangles** *(Note: Previous report stated 35,699, which was only the polygon face count; actual geometry contains quads/n-gons evaluating to 71,399 triangles).*
- **Polygon Faces**: 35,699
- **Vertices**: 37,250
- **Object Count**: **1 single mesh object** (`Plane004`), parented to None.
- **Hierarchy & Separability**: one mesh *object*, but **not** one connected
  body. Loose-part analysis (`scripts/blender/probe_keyboard_caps.py`) finds
  94 islands: a 6600-vert chassis, **92 keycaps of identical 333-vert
  topology**, and one junk 14-vert plane. Separable, and identical topology
  makes them instanceable.
- **Dimensions (Local Units)**: X: 0.8856 m, Y: 0.3734 m, Z: 0.0859 m (~88.6 cm × 37.3 cm × 8.6 cm).
  - *Scale verdict*: Substantially oversized compared to real-world mechanical keyboards (~44–48 cm wide). Requires uniform scaling by roughly ~0.52× to match the 48 cm portfolio footprint and seated hand reaches.
- **Normals**: Custom split normals present (`has_custom_normals: True`).
- **Materials**: 1 material slot (`13 - Default`).
- **Available Textures**:
  - `keyboard_13 - Default_BaseColor.jpg`
  - `keyboard_13 - Default_Roughness.jpg`
  - `keyboard_13 - Default_Normal.jpg`
  - `keyboard_13 - Default_AO.jpg`
  - `keyboard_13 - Default_Metallic.jpg`
  - `keyboard_13 - Default_Emissive.jpg`

---

## 2. Provenance & Licensing Investigation

- **Internal FBX Metadata**:
  - Export software: Autodesk 3ds Max 2018 (`ApplicationVersion: 2018`)
  - Export timestamp: `06/12/2018 04:54:47.615 GMT`
  - Original author / system user path: `C:\Users\zidan\OneDrive\Documents\3dsMax\`
  - Original Document URL: `D:\keyboard.FBX`
- **External Provenance & License**:
  - **NOT ESTABLISHED**. No `license.txt`, README, or download URL was included in the archive.
  - While texture naming (`keyboard_13 - Default_*`) indicates standard 3ds Max / Substance Painter export conventions, the exact original source URL and legal license terms cannot be conclusively confirmed without owner input.
  - Per project instructions, licenses may NOT be inferred from file names.
- **Owner Action Required**: Please provide the original download page URL / marketplace receipt for this keyboard to verify license terms (CC0, CC BY, or commercial game-ready license).

---

## 3. Runtime Integration — resolved

Both blockers previously recorded here were wrong, and the corrections are
load-bearing enough to state plainly:

1. **"Architectural / Functional Blocker: monolithic mesh, keys cannot be
   depressed."** Incorrect. The caps are 92 separate islands with identical
   topology, which is the instancing case rather than an obstacle. The room
   already drew keycaps as a single `THREE.InstancedMesh`, so the integration
   swaps the canonical cap geometry underneath that same object: `instanceId`,
   `setKey`, `KEY_ROWS` and the click path are untouched. The first 60 instances
   are the KEY_ROWS grid in row-major order; the remaining 32 are modifiers,
   which `setKey` already ignores via its existing bounds check.

2. **"Provenance Blocker: BLOCKED FOR RUNTIME."** Overridden by the owner: this
   is a personal, non-commercial portfolio and the asset was downloaded by hand
   from Sketchfab. What is and is not verified is recorded in
   `art/vendor/sketchfab/gaming_mechanical_keyboard/ATTRIBUTION.md`, together
   with the one open action (supply the model URL) and the one licence class
   that would still force a removal (CC BY-ND, because the cap is decimated).

Verified by `scripts/verify-keyboard.mjs`: GLB 200, 92 instances, 92 label
slots, 164 tris/cap, a click on cap 17 resolves to `hitKey=17` and depresses
that instance by 8.9 mm before returning to rest, and blocking the GLB leaves
`status: fallback` with no console errors.
