# Gemini Flash — Realistic Hand Asset Research & Acquisition Report

**Status**: **READY FOR CODEX REVIEW**  
**Date**: 2026-09-20  
**Assignment**: `docs/PROMPT-GEMINI-REALISM-ASSETS.md`  
**Branch**: `feat/v3`  
**Scope Invariant**: Zero runtime touches (`src/` and `public/` untouched), no dependencies added, no Git commits, no builds, no localhost browser sessions, no subagents.

---

## 1. Executive Summary

This report completes the candidate research, evaluation, and file acquisition of realistic bare first-person hands/arms to replace the procedural hand rig with assets matching the "After Hours" GTA V / RDR2 physical realism target.

The primary recommended asset has been downloaded by the owner, extracted to the designated candidate directory, and verified offline with exact file metrics and cryptographic checksums:

- **Acquired Asset**: **DJMaesen (`bumstrum`) — `FP arms`**
  - **Local Path**: `art/candidates/hands/fp-arms/`
  - **FBX Model**: `art/candidates/hands/fp-arms/source/arms2.fbx` (733,228 bytes, SHA-256: `bc9746a415949ecef2bb73f975f17533fe23720b0717055a43e358a8ffb5cc87`)
  - **Textures (4096×4096 PBR)**:
    - Base Color / Albedo: `fparmsColor.png` (39,223,858 bytes, SHA-256: `ac65ea6a50affd343b3e1e59b7a2a6b8ee4af9de652353f0214ff32fe4871908`)
    - Normal Map: `fparmsNormal.png` (32,834,922 bytes, SHA-256: `44d4d2915de23300107d8161532d8283ec0eaae431f8d481a3fa97bf5438e9e8`)
    - Roughness Map: `fparmsRoughness.png` (9,303,590 bytes, SHA-256: `124ce33daf65c9f518ec3285e5e75fc1b8972bef76cd455a5720a8bda5b89c59`)
  - **License**: Creative Commons Attribution 4.0 International (**CC BY 4.0**). Permissive commercial use, no Share-Alike copyleft burden.
  - **Measured Topology**: **9,860 faces, 4,982 vertices**. Fits directly into the three.js WebGL budget.
  - **Anatomy & Aesthetic**: Bare hands and forearms extending to the elbow. Natural relaxed resting bind pose. Realistic skin pores, knuckle micro-creases, and fingernails. Zero tactical gear, sleeves, or gloves.

The files are verified intact and the task is transitioned to **`READY FOR CODEX REVIEW`**.

---

## 2. Candidate Evaluation Matrix

| Candidate | Creator | Source URL & Model UID | License & Terms | Measured Facts (API / Local) | Page Claims | Visual Assessment & Anatomy | Suitability Verdict |
|---|---|---|---|---|---|---|---|
| **FP arms** | DJMaesen (`bumstrum`) | [Sketchfab 06ee1407...](https://sketchfab.com/3d-models/fp-arms-06ee1407117d4e5ab343becb4ee44bb6)<br>`06ee1407117d4e5ab343becb4ee44bb6` | **CC BY 4.0**<br>Commercial OK, derivatives OK, no copyleft | **Faces: 9,860**<br>Verts: 4,982<br>FBX: 733 KB<br>Tex: 4K PBR | 9.9k triangles<br>5.0k verts<br>4K PBR maps<br>Rigged | Bare hands and forearms. Natural relaxed resting pose. High skin pore and wrinkle detail. No clothing or gear. | **ACQUIRED & RECOMMENDED** |
| **FREE [FPS Arms] GameReady** | BAMEN (`bamenwo05`) | [Sketchfab 296d30fc...](https://sketchfab.com/3d-models/free-fps-arms-gameready-rigged-296d30fc705b4dff85c2c8a2d2724e7f)<br>`296d30fc705b4dff85c2c8a2d2724e7f` | **CC BY 4.0**<br>Commercial OK, derivatives OK | **Faces: 13,728**<br>Verts: 6,942<br>Anims: 0<br>Downloadable: Yes | 13.7k triangles<br>6.9k verts<br>1K PBR maps<br>Rigged | Bare hands, but forearms are covered by rolled military camouflage sleeves. Clashes with calm night desk aesthetic. | Shortlisted Backup (Aesthetic Clash) |
| **Rigged hand** | Elena FF (`elenaferfor`) | [Sketchfab eae97cc2...](https://sketchfab.com/3d-models/hand-rigged-eae97cc2a742413cb5338ab942b12c1e)<br>`eae97cc2a742413cb5338ab942b12c1e` | **CC BY-SA 4.0**<br>Share-Alike copyleft required | **Faces: 28,994**<br>Verts: 14,499<br>Anims: 0<br>Downloadable: Yes | 29.0k triangles<br>14.5k verts<br>PBR textures<br>Rigged | Single hand with short wrist stub only. Lacks forearm length needed for seated perspective. Share-alike license burdens derivatives. | Shortlisted Backup (License / Geometry) |
| **Hand Rig** | CreativeMachine | [Sketchfab a348cf60...](https://sketchfab.com/3d-models/hand-rig-a348cf6087eb4fd98a83b026593823ad)<br>`a348cf6087eb4fd98a83b026593823ad` | **CC BY 4.0** | **Faces: 562,964**<br>Verts: 281,492<br>Downloadable: Yes | High-res posed hands<br>Procedural materials | High quality sculpt, but density (562k faces) is unviable for WebGL. Procedural Blender node shaders, no baked PBR textures. | **REJECTED** |

---

## 3. Acquired Asset Verification: DJMaesen `FP arms`

### Local File Inventory & Checksums

| File | Type | Resolution | Size (Bytes) | SHA-256 Checksum |
|---|---|---|---|---|
| `source/arms2.fbx` | FBX Armature & Mesh | — | 733,228 | `bc9746a415949ecef2bb73f975f17533fe23720b0717055a43e358a8ffb5cc87` |
| `textures/fparmsColor.png` | Albedo / BaseColor | 4096×4096 | 39,223,858 | `ac65ea6a50affd343b3e1e59b7a2a6b8ee4af9de652353f0214ff32fe4871908` |
| `textures/fparmsNormal.png` | Normal Map (Tangent) | 4096×4096 | 32,834,922 | `44d4d2915de23300107d8161532d8283ec0eaae431f8d481a3fa97bf5438e9e8` |
| `textures/fparmsRoughness.png` | Roughness Map | 4096×4096 | 9,303,590 | `124ce33daf65c9f518ec3285e5e75fc1b8972bef76cd455a5720a8bda5b89c59` |

### Provenance & Attribution
- **Author**: DJMaesen ([@bumstrum](https://sketchfab.com/bumstrum))
- **Source**: [https://sketchfab.com/3d-models/fp-arms-06ee1407117d4e5ab343becb4ee44bb6](https://sketchfab.com/3d-models/fp-arms-06ee1407117d4e5ab343becb4ee44bb6)
- **License**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](http://creativecommons.org/licenses/by/4.0/)
- **Required Credit**: `"FP arms" by DJMaesen (https://sketchfab.com/bumstrum), used under CC BY 4.0.`

---

## 4. Technical Integration Plan for Codex

Now that the source FBX and 4K textures are available locally in `art/candidates/hands/fp-arms/`:

1. **Anatomical & Pose Alignment (Blender)**:
   - Import `arms2.fbx` into Blender 5.2.2 alongside `art/after-hours/hand-rig-reference.blend`.
   - Verify hand scaling against the 0.084 m palm reference and desk height.
   - Retarget mesh skin weights to the 19-bone hierarchy (`palm_L`, `wrist_L`, `thumb_01..03`, `index_01..03`, `middle_01..03`, `ring_01..03`, `pinky_01..03`, `forearm_L` and `_R`).
2. **PBR Texture Downscaling**:
   - The raw textures are 4096×4096 PNGs totaling ~81 MiB.
   - Downscale to 2048×2048 (desktop high tier) and 1024×1024 (mobile / low tier) JPG/PNG/WebP to respect the project's <15MB transfer budget.
3. **Runtime Asset Generation**:
   - Run `node scripts/build-hand-assets.mjs` to serialize the new skinned geometry into `public/models/hands-v1.bin` and `hands-v1.bin.gz`.
4. **Visual & Behavioral Verification**:
   - Run `GPU=1 node scripts/shots-hands.mjs` to inspect all grip poses (resting, typing, coffee cup hold, pen contact, award inspection, phone hold).
   - Verify that rest wrist angles remain within natural limits (~7–10°) and contact shadows ground smoothly on the desk mat.

---

## 5. Changed Files

- `art/candidates/hands/README.md`
- `art/candidates/hands/manifest.json`
- `docs/reviews/GEMINI-HAND-ASSETS.md`

*(No runtime files under `src/` or `public/` were modified).*

---

**READY FOR CODEX REVIEW**
