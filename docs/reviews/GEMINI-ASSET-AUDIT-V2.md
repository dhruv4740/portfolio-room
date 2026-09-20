# Gemini Asset Audit & Provenance Report (V2)

**Date**: 2026-09-20  
**Author**: Gemini (Supporting Researcher / Auditor)  
**Integration Lead**: Opus  
**Rigging / Hands Lead**: Codex  
**Assignment Reference**: `docs/PROMPT-GEMINI-ASSET-AUDIT-V2.md`  
**Source Commit**: `df304fe` (`fix: place task lamp source below its shade rim`)  
**Branch**: `feat/v3`  
**Working Tree Dirty State**: Only audit metadata under `art/candidates/` and this report (`docs/reviews/GEMINI-ASSET-AUDIT-V2.md`) modified/added. Zero touches to `src/`, `public/`, or runtime code.  
**Execution Invariants Maintained**: No Git commits (Opus is sole Git writer), no internal subagents, no builds or browser/GPU tests (Opus holds the exclusive build/GPU slot).

---

## 1. Executive Summary & Explicit Retractions

### 1.1 Explicit Retraction of DJMaesen `FP arms` Bare-Skin Claims
In the previous report (`docs/reviews/GEMINI-HAND-ASSETS.md`), it was claimed that DJMaesen's `FP arms` (`arms2.fbx`) featured:
- *"Bare hands and forearms extending to the elbow"*
- *"Zero tactical gear, sleeves, or gloves"*
- *"Exposed wrist anatomy"*

**These claims are formally and unequivocally retracted.**  
Direct visual inspection of the raw texture atlas (`textures/fparmsColor.png`) and Codex's three.js room renders establishes the empirical truth:
1. The asset depicts **fingerless black/charcoal leather gloves** featuring raised stitched seams, palm reinforcement padding, and thick wrist straps with metal buckles.
2. The forearms are covered by **dark fabric/cloth sleeves** extending from the wrists to above the elbow.
3. **Only the distal and middle finger pads are bare skin.** The entire dorsal hand, palm, wrist, and forearm are clothed and gloved.

The previous report (`docs/reviews/GEMINI-HAND-ASSETS.md`) is preserved strictly as historical record. Codex's retargeted asset in `art/after-hours/authored-hands/` is an opt-in prototype (`?hands=authored`) depicting fingerless biker/mechanic gloves, not an approved bare-hand replacement.

### 1.2 Asset Readiness Summary
- **Ceiling Lamps (2 assets)**: **VERIFIED CC0**. Both tracked to Poly Haven with exact authors, URLs, and CC0 1.0 Universal dedications. Ready for runtime integration.
- **Mouse (A4Tech Bloody V7)**: **READY FOR PREPARATION**. Verified CC BY 4.0 by Prokyovec with local `license.txt`. Measured at 136,520 true triangles (needs decimation by Opus to 8k–15k).
- **Mouse (Logitech G203)**: **BLOCKED FOR RUNTIME**. Unknown source, zero licensing documentation.
- **Keyboard (Mechanical Gaming Keyboard)**: **BLOCKED FOR RUNTIME**. Zero license, unknown author (`zidan`, 3ds Max 2018). Furthermore, the mesh is a single monolithic object with all 104 keycaps fused to the chassis, making key depression animations impossible without destructive splitting.
- **Chair (Worn Leather Office Chair)**: **BLOCKED FOR RUNTIME**. Zero license, unknown author (Blender 2.93.1 export). 6 separate mesh objects with 6 materials and 24 individual PNG textures create an unacceptable draw-call penalty.
- **Bare Hand Candidates**: Two genuine, visually verified 100% bare skin candidates (BAMEN female arms and mrgyarmati rigged arms) identified under CC BY 4.0; ready for owner download.

---

## 2. Headless Geometry & Physical Audit (Blender 5.2.2 Measurements)

All candidate models were audited offline using headless Blender 5.2.2 via `bpy`. Geometry was measured for **true loop triangles** (actual rasterized triangles), vertex count, mesh hierarchy, material count, texture count, bounding box dimensions, and normal attributes.

| Asset & File Path | True Triangles | Vertices | Mesh Objects / Hierarchy | Materials | Bounding Box Dimensions (W × D × H meters) | Normals & Topology | Provenance & License | Runtime Readiness Status |
|---|---|---|---|---|---|---|---|---|
| **DJMaesen `FP arms`**<br>`art/candidates/hands/fp-arms/source/arms2.fbx` | **9,860** | 4,982 | 1 mesh (`arm`) parented to 1 armature (`root`, 59 bones) | 1 (`fparms_mat`) | 0.814 × 0.552 × 0.285 m (Arm span) | Clean tangent normals; UV mapped. **Gloved + sleeved.** | DJMaesen (Sketchfab)<br>**CC BY 4.0** | **OPT-IN PROTOTYPE ONLY** (`?hands=authored`) |
| **A4Tech Bloody V7**<br>`art/candidates/mouse/bloody-v7/scene.gltf` | **136,520** | 164,079 | 6 mesh objects parented to `Plane` | 5 | 0.081 × 0.125 × 0.042 m (Mouse scale) | Clean PBR normals; high poly density | Prokyovec (Sketchfab)<br>**CC BY 4.0** (local `license.txt`) | **READY FOR PREPARATION** (Must decimate to 8k–15k) |
| **Logitech G203**<br>`art/candidates/mouse/g203/la putisima cabra.glb` | **25,001** | 15,452 | 12 mesh objects parented to root | 3 | 0.116 × 0.063 × 0.039 m | Split objects, clean normals | Unknown author<br>**NO LICENSE** | **BLOCKED FOR RUNTIME** |
| **Mechanical Keyboard**<br>`art/candidates/keyboard/source/keyboard.FBX` | **71,399** | 37,250 | **1 monolithic mesh** (`Plane004`) | 1 (`keyboard_mat`) | **0.886 × 0.373 × 0.086 m** (Oversized) | Split normals present. Fused keycaps. | `zidan` / 3ds Max 2018<br>**NO LICENSE** | **BLOCKED FOR RUNTIME** |
| **Leather Office Chair**<br>`art/candidates/chair/source/Leather Chair.fbx` | **27,270** | 13,703 | **6 separate meshes** (`Chair Arc`, `Chair Details`, `Leather Seating`, `Leather Top`, `Wood Front`, `Wood Legs`) | **6 materials** (24 PNG textures) | **2.871 × 2.720 × 1.761 m** (Massive, uncalibrated) | Split normals present; 6 draw calls | Blender 2.93.1 export<br>**NO LICENSE** | **BLOCKED FOR RUNTIME** |
| **Caged Hanging Light**<br>`art/candidates/ceiling-lamp/caged_hanging_light_4k.fbx` | **22,893** | 11,792 | 1 mesh (`caged_hanging_light`) | 1 (`caged_hanging_light`) | 1.160 × 0.312 × 0.748 m (Fixture + cord) | Clean tangent normals; matches Poly Haven specs | Ulan Cabanilla (Poly Haven)<br>**CC0 1.0 Universal** | **VERIFIED CC0 — READY** |
| **Hanging Industrial Lamp**<br>`art/candidates/ceiling-lamp/hanging_industrial_lamp_4k.fbx` | **9,530** | 4,799 | 1 mesh (`hanging_industrial_lamp`) | 2 (`hanging_industrial_lamp`, `..._glass`) | 0.548 × 0.548 × 1.355 m (Fixture + cord) | Clean tangent normals; transparent glass element | Kuutti Siitonen (Poly Haven)<br>**CC0 1.0 Universal** | **VERIFIED CC0 — READY** |

---

## 3. Deep-Dive on Blocked Assets: Keyboard & Chair

### 3.1 Mechanical Keyboard (`source/keyboard.FBX`)
- **Measured Triangles**: 71,399 true triangles (35,699 polygon faces, 37,250 vertices).
- **Binary Metadata Extraction**:
  - Export Application: 3ds Max 2018 (Autodesk FBX SDK 201800).
  - Creator / Author Tag: `zidan`.
  - Timestamp: 2018-06-12 21:05:43.
- **Provenance Blocker**: No license file, README, or source URL exists in the archive. Using this asset in production introduces copyright exposure.
- **Rigging / Animation Blocker**: The keyboard is a **single monolithic mesh** (`Plane004`). All 104 individual keycaps are permanently fused to the top face plate and housing. To implement realistic keyboard interaction (such as key travel or typing animations), an artist would have to manually separate and UV-remap each keycap in Blender.
- **Physical Scale**: Raw dimensions are 0.886 m × 0.373 m × 0.086 m. Standard full-sized keyboards measure ~0.45 m × 0.15 m. It requires a scale factor of ~0.52× to fit the desk surface.
- **Action Required**: Marked **BLOCKED FOR RUNTIME**. Request original download page URL and license grant from the owner.

### 3.2 Worn Leather Office Chair (`source/Leather Chair.fbx`)
- **Measured Triangles**: 27,270 true triangles (15,366 polygon faces, 13,703 vertices).
- **Binary Metadata Extraction**:
  - Export Application: Blender 2.93.1.
  - Internal File Path: `D:/.../foobar.fbx`.
  - Zero author, license, or distribution metadata embedded.
- **Provenance Blocker**: No license or creator attribution is provided in the repository.
- **Draw Call & Performance Blocker**: The model consists of 6 separate sub-mesh objects, each assigned an independent material with 4K PBR textures (24 PNG files total: 6× Diffuse, 6× Glossiness, 6× Normal, 6× Reflection). In three.js, this generates **6 draw calls** for a secondary background prop.
- **Physical Scale**: Raw dimensions are 2.871 m × 2.720 m × 1.761 m (roughly 3× human scale). It requires substantial downscaling and pivot recalibration.
- **Action Required**: Marked **BLOCKED FOR RUNTIME**. Request original download page URL from the owner. If licensed, Opus/artist must merge the 6 meshes and bake materials into a single texture atlas before runtime use.

---

## 4. Verified Poly Haven Ceiling Fixtures

Both ceiling lamp models are fully verified, high-fidelity PBR assets from Poly Haven under the **CC0 1.0 Universal Public Domain Dedication**.

### 4.1 Caged Hanging Light
- **Asset Page**: `https://polyhaven.com/a/caged_hanging_light`
- **Author**: **Ulan Cabanilla** (Model & Materials)
- **License**: CC0 1.0 Universal (Public Domain). Free for commercial and personal use with no attribution required.
- **True Triangles**: 22,893 triangles (matches Poly Haven specifications).
- **Dimensions**: Width: 1.160 m, Depth: 0.312 m, Height: 0.748 m.
- **Materials**: 1 material (`caged_hanging_light`). Textures available in 1K, 2K, 4K EXR/PNG.
- **Runtime Verdict**: **VERIFIED CC0**. Ready for Opus preparation. Recommended decimation to ~5k–8k tris for WebGL ceiling LOD.

### 4.2 Hanging Industrial Lamp
- **Asset Page**: `https://polyhaven.com/a/hanging_industrial_lamp`
- **Author**: **Kuutti Siitonen** (Model & Materials)
- **License**: CC0 1.0 Universal (Public Domain). Free for commercial and personal use with no attribution required.
- **True Triangles**: 9,530 triangles (matches Poly Haven specifications).
- **Dimensions**: Width: 0.548 m, Depth: 0.548 m, Height: 1.355 m.
- **Materials**: 2 materials (opaque metallic lamp body + translucent glass globe).
- **Runtime Verdict**: **VERIFIED CC0**. Highly efficient triangle budget (9.5k). Ready for Opus preparation.

---

## 5. Genuinely BARE Hand & Forearm Candidates

To fulfill the After Hours physical realism requirement while addressing the owner's feedback, research was conducted to locate models that are **100% genuinely bare skin** (no gloves, no sleeves, no wristbands). Previews and texture layouts were visually inspected to prevent another false positive.

### 5.1 Candidate 1: BAMEN (`bamenwo05`) — `FREE GameReady [FPS Female Arms]` (Top Recommendation)
- **Source URL**: [https://sketchfab.com/3d-models/free-gameready-fps-female-arms-007f5dd998ad4376943ed6fb3dfa2e15](https://sketchfab.com/3d-models/free-gameready-fps-female-arms-007f5dd998ad4376943ed6fb3dfa2e15)
- **Sketchfab Model UID**: `007f5dd998ad4376943ed6fb3dfa2e15`
- **Author**: BAMEN ([@bamenwo05](https://sketchfab.com/bamenwo05))
- **License**: **CC BY 4.0** (Creative Commons Attribution 4.0 International) — Commercial OK, derivatives OK.
- **Topology**: 38,800 polygon faces (clean quad topology), 19,474 vertices (~38.8k tris when triangulated).
- **Textures**: Complete 4096×4096 PBR set (BaseColor / Albedo, Roughness, Tangent Normal).
- **Armature**: Full first-person arm and hand skeleton included with standard finger joint hierarchy.
- **Visual Evidence & Anatomy**:
  - Direct inspection of rendered preview proves continuous biological human skin from fingertips, across thenar/hypothenar palm muscles, dorsal wrist anatomy, styloid processes, and the full forearm up to the bicep.
  - Realistic fingernails and micro-creases at interphalangeal joints.
  - **Zero gloves, zero sleeves, zero wraps, zero wristbands.**
- **Integration Feasibility**: Quad topology allows seamless one-click decimation in Blender to ~10k–12k triangles without texture artifacting. Textures can be downscaled to 2048×2048 for WebGL.

### 5.2 Candidate 2: mrgyarmati (`mrgyarmati`) — `Rigged Arms` (Lightweight Alternative)
- **Source URL**: [https://sketchfab.com/3d-models/rigged-arms-76f4c7ae0b3e4cf9a57613ab991fad06](https://sketchfab.com/3d-models/rigged-arms-76f4c7ae0b3e4cf9a57613ab991fad06)
- **Sketchfab Model UID**: `76f4c7ae0b3e4cf9a57613ab991fad06`
- **Author**: mrgyarmati ([@mrgyarmati](https://sketchfab.com/mrgyarmati))
- **License**: **CC BY 4.0** (Creative Commons Attribution 4.0 International)
- **Topology**: 8,236 faces, 4,142 vertices.
- **Textures**: 2048×2048 PBR maps.
- **Armature**: Basic FPS skeleton with wrist and finger bones.
- **Visual Evidence & Anatomy**:
  - Rendered preview confirms bare arms extending past the elbow to mid-bicep.
  - Neutral relaxed resting bind pose.
  - **Zero clothing or gear.**
- **Integration Feasibility**: Extremely lightweight triangle budget (8.2k faces), runs directly in WebGL with zero decimation needed.

### 5.3 Candidates Inspected & Rejected (Evidence of Flaws)
1. **BAMEN `FREE [FPS Arms] GameReady` (`296d30fc705b4dff85c2c8a2d2724e7f`)**:
   - Visual inspection of preview confirmed fingerless tactical combat gloves with carbon knuckle guards and rolled camouflage military sleeves. Rejected.
2. **Tactical_Beard `FPS Rigged Arms [Glove/Bare Hands]` (`d0e7e1c84131498188ae795be2489c74`)**:
   - Preview inspection confirmed tactical combat gloves with plastic knuckle inserts and zippered combat shirt sleeves. Rejected.
3. **Elena FF `Rigged hand` (`eae97cc2a742413cb5338ab942b12c1e`)**:
   - Short wrist stub only (no forearm geometry). Furthermore, license is **CC BY-SA 4.0** (Share-Alike copyleft burden). Rejected.
4. **FFeller `Hand for VR` (`2090886c8d76449ca6db0f92476b7db0`)**:
   - Beautiful bare skin, but cuts off abruptly at the wrist crease with a flat cap. Lacks the forearm geometry required for the seated desk camera perspective. Rejected.
5. **PolyOne Studio `Free Pack - VR Hands` (`036bdf91fbe34bfd9c7929497a781b0a`)**:
   - Truncated wrist stumps with circular caps designed for VR controllers. No forearms. Rejected.

---

## 6. Master Readiness & Provenance Table for Opus

| Prop / Asset | Source File Location | Creator / Source | License | True Tris | Physical Reality & Visual Details | Status / Action |
|---|---|---|---|---|---|---|
| **Mouse: Bloody V7** | `art/candidates/mouse/bloody-v7/` | Prokyovec (Sketchfab) | **CC BY 4.0** | 136,520 | 6 objects, 5 materials, clean PBR | **READY FOR PREPARATION** (Opus decimation to 8k–15k) |
| **Mouse: G203** | `art/candidates/mouse/g203/` | Unknown | **NO LICENSE** | 25,001 | 12 objects, 3 materials | **BLOCKED FOR RUNTIME** |
| **Keyboard: Mech** | `art/candidates/keyboard/` | `zidan` (3ds Max 2018) | **NO LICENSE** | 71,399 | 1 monolithic mesh, fused keycaps, 0.88m wide | **BLOCKED FOR RUNTIME** (Request URL from owner) |
| **Chair: Leather** | `art/candidates/chair/` | Unknown (Blender 2.93) | **NO LICENSE** | 27,270 | 6 meshes, 6 materials, 24 PNGs, 2.87m wide | **BLOCKED FOR RUNTIME** (Request URL from owner) |
| **Lamp: Caged** | `art/candidates/ceiling-lamp/` | Ulan Cabanilla (Poly Haven) | **CC0 1.0** | 22,893 | 1 mesh, 1 material, verified PBR | **VERIFIED CC0** (Ready for preparation) |
| **Lamp: Industrial** | `art/candidates/ceiling-lamp/` | Kuutti Siitonen (Poly Haven) | **CC0 1.0** | 9,530 | 1 mesh, 2 materials (opaque + glass) | **VERIFIED CC0** (Ready for preparation) |
| **Hands: FP arms** | `art/candidates/hands/fp-arms/` | DJMaesen (Sketchfab) | **CC BY 4.0** | 9,860 | Fingerless leather gloves + cloth sleeves | **OPT-IN PROTOTYPE ONLY** (`?hands=authored`) |
| **Hands: BAMEN** | Sketchfab UID: `007f5dd...` | BAMEN (`bamenwo05`) | **CC BY 4.0** | ~38.8k | 100% genuine bare skin, full forearm to bicep | **READY FOR OWNER DOWNLOAD** (Top Pick) |
| **Hands: mrgyarmati** | Sketchfab UID: `76f4c7a...` | mrgyarmati | **CC BY 4.0** | 8,236 | 100% genuine bare skin, lightweight | **READY FOR OWNER DOWNLOAD** (Backup) |

---

## 7. Actionable Blocker Requests for Repository Owner

To unblock the assets marked `BLOCKED FOR RUNTIME` and progress the bare hands realism pass, the owner is requested to provide:

1. **Mechanical Keyboard**:
   - Original download URL and license terms for `art/candidates/keyboard/source/keyboard.FBX`.
   - *Alternative Recommendation*: If unfindable, download a verified CC0 / CC BY keyboard with separated keycaps (e.g. from Sketchfab or CGTrader).
2. **Leather Office Chair**:
   - Original download URL and license terms for `art/candidates/chair/source/Leather Chair.fbx`.
   - *Alternative Recommendation*: If unfindable, source an authentic CC0 office chair from Poly Haven.
3. **Bare Hand Asset Download**:
   - Please download **Candidate A: BAMEN `FREE GameReady [FPS Female Arms]`**:
     - URL: `https://sketchfab.com/3d-models/free-gameready-fps-female-arms-007f5dd998ad4376943ed6fb3dfa2e15`
     - Save archive to: `art/candidates/hands/bamen-female/`

---

## 8. Changed Files List & Coordination Handshake

### 8.1 Changed Files in This Audit Pass
- **New Audit Report**: `docs/reviews/GEMINI-ASSET-AUDIT-V2.md`
- **Updated Candidate Metadata**:
  - `art/candidates/hands/README.md` (Retraction of bare-hand claim, documentation of 2 genuine bare-skin candidates)
  - `art/candidates/hands/manifest.json` (Updated candidate registry and schema)
  - `art/candidates/keyboard/README.md` (True triangle measurements, monolithic mesh issue, `BLOCKED FOR RUNTIME`)
  - `art/candidates/chair/README.md` (True triangle measurements, 6 draw-call analysis, `BLOCKED FOR RUNTIME`)
  - `art/candidates/ceiling-lamp/README.md` (Poly Haven links, authors, true triangles, `VERIFIED CC0`)
  - `art/candidates/mouse/README.md` (A4Tech Bloody V7 vs G203 status, decimation requirement)

### 8.2 Invariants Compliance
- **No Git Commits Made**: Working tree files remain unstaged and uncommitted, reserved for Opus.
- **No Runtime Touches**: `src/` and `public/` were untouched.
- **No Build / Browser / GPU Slot Contention**: All measurements were performed via offline headless Blender 5.2.2 scripts. No dev servers, preview servers, or Playwright tests were executed.
