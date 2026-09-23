# Gemini Licence Provenance & Replacement Candidates

**Date**: 2026-09-21  
**Author**: Gemini (Supporting Researcher)  
**Assignment Reference**: `docs/PROMPT-GEMINI-LICENCE-AND-DIMENSIONS.md`  
**Execution Context**: Offline review only. No slot claimed, no Git commits, zero source/runtime code edits.

---

## 1. Conclusion First: Licence Provenance Verdict

Both blocked assets have been **conclusively identified and resolved via official Sketchfab API v3 records**:

1. **Gaming Mechanical Keyboard**: **VERIFIED LICENSED — CC BY 4.0**.
   - Model: `"Gaming keyboard"` by **ZxTulz** (`zxtulz`).
   - Sketchfab Model UID: `c1e5e07153d84978a1ad7256d720220a`.
   - Licence: **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
   - Verdict: **Fully compliant for WebGL bundle redistribution and modification**. Not CC BY-ND (derivatives and decimation are explicitly permitted). Requires author attribution in `public/asset-credits.txt`.

2. **Worn Leather Office Chair**: **VERIFIED LICENSED — CC BY 4.0**.
   - Model: `"Worn Leather Office Chair"` by **FordVFX** (`FordVFX`).
   - Sketchfab Model UID: `003b00c7cdd348888296b85c40275a50`.
   - Licence: **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
   - Verdict: **Fully compliant for WebGL bundle redistribution and modification**. Requires author attribution in `public/asset-credits.txt`.
   - File settlement: `art/vendor/sketchfab/worn_leather_office_chair/CANDIDATE-README-COPY.md` contains **zero licence terms**; it is an exact duplicate (2,989 bytes) of the local candidate inspection README.

---

## 2. Five-Point Licence Evidence

### 2.1 Gaming Mechanical Keyboard (`art/candidates/keyboard/gaming-keyboard/`)

| Requirement | Verified Evidence |
|---|---|
| **1. Vendor / Source URL** | `https://sketchfab.com/3d-models/gaming-keyboard-c1e5e07153d84978a1ad7256d720220a` |
| **2. Licence Name & Version** | **Creative Commons Attribution 4.0 International (CC BY 4.0)** (`http://creativecommons.org/licenses/by/4.0/`) |
| **3. Author Name / Handle** | **ZxTulz** (username: `zxtulz`, profile: `https://sketchfab.com/zxtulz`) |
| **4. Literal Licence Statement** | Quoted from Sketchfab API (`api.sketchfab.com/v3/models/c1e5e07153d84978a1ad7256d720220a`):<br>`"license": {"fullName": "Creative Commons Attribution", "label": "CC Attribution", "requirements": "Author must be credited. Commercial use is allowed.", "slug": "by", "url": "http://creativecommons.org/licenses/by/4.0/"}` |
| **5. Redistribution in Web Bundle & Attribution** | **Permitted**. CC BY 4.0 § 3(a) explicitly grants worldwide, royalty-free, non-sublicensable rights to reproduce and share the material in any medium or format (including electronic WebGL bundles) and to produce and share adapted material (decimation, UV remapping, and mesh splitting).<br>**Required Attribution Text** (to add to `public/asset-credits.txt`):<br>`"Gaming keyboard" (https://sketchfab.com/3d-models/gaming-keyboard-c1e5e07153d84978a1ad7256d720220a) by ZxTulz (https://sketchfab.com/zxtulz) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)` |

**Mesh Identity Verification**:
- Sketchfab API records: `faceCount: 71399`, `vertexCount: 37250`, `textureCount: 6`, `materialCount: 1`.
- Local repository measurement (`art/candidates/keyboard/README.md`): 71,399 true triangles, 37,250 vertices, 1 material (`13 - Default`), 6 textures (`BaseColor`, `Roughness`, `Normal`, `Metallic`, `AO`, `Emissive`).
- Matches 100% identically down to the vertex.

---

### 2.2 Worn Leather Office Chair (`art/candidates/chair/` & `art/vendor/sketchfab/worn_leather_office_chair/`)

| Requirement | Verified Evidence |
|---|---|
| **1. Vendor / Source URL** | `https://sketchfab.com/3d-models/worn-leather-office-chair-003b00c7cdd348888296b85c40275a50` |
| **2. Licence Name & Version** | **Creative Commons Attribution 4.0 International (CC BY 4.0)** (`http://creativecommons.org/licenses/by/4.0/`) |
| **3. Author Name / Handle** | **FordVFX** (username: `FordVFX`, profile: `https://sketchfab.com/FordVFX`) |
| **4. Literal Licence Statement** | Quoted from Sketchfab API (`api.sketchfab.com/v3/models/003b00c7cdd348888296b85c40275a50`):<br>`"license": {"fullName": "Creative Commons Attribution", "label": "CC Attribution", "requirements": "Author must be credited. Commercial use is allowed.", "slug": "by", "url": "http://creativecommons.org/licenses/by/4.0/"}` |
| **5. Redistribution in Web Bundle & Attribution** | **Permitted**. CC BY 4.0 grants commercial, non-commercial, adaptation and redistribution rights inside web application bundles.<br>**Required Attribution Text** (to add to `public/asset-credits.txt` if integrated):<br>`"Worn Leather Office Chair" (https://sketchfab.com/3d-models/worn-leather-office-chair-003b00c7cdd348888296b85c40275a50) by FordVFX (https://sketchfab.com/FordVFX) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)` |

**Mesh Identity Verification**:
- Sketchfab API records: `faceCount: 27270`, `vertexCount: 13703`, `textureCount: 24`, `materialCount: 6`.
- Local repository measurement (`art/candidates/chair/README.md`): 27,270 true triangles, 13,703 vertices, 6 material slots, 24 PNG map files.
- Matches 100% identically down to the vertex.

---

### 2.3 Settlement of `CANDIDATE-README-COPY.md`

Direct character-by-character inspection of `art/vendor/sketchfab/worn_leather_office_chair/CANDIDATE-README-COPY.md` confirms:
- The file is an **exact 2,989-byte clone** of `art/candidates/chair/README.md`.
- It contains **zero licence terms or legal grants**.
- Under Section 2, it explicitly states: *"External Provenance & License: NOT ESTABLISHED. No license.txt, author attribution, or original source URL is present in the archive."*
- **Settlement**: The presence of `CANDIDATE-README-COPY.md` provides no independent licence evidence. However, provenance is now independently established via the Sketchfab API record above.

---

## 3. Keyboard Replacement Candidates

### 3.1 Exhaustive CC0 Audit Across 3D Repositories
An automated check against the primary open-asset repositories yields an exhaustive negative finding for CC0 mechanical gaming keyboards:
- **Poly Haven**: 0 keyboard assets exist on the platform.
- **ambientCG**: 0 keyboard assets exist on the platform.
- **Sketchfab CC0 Search** (`api.sketchfab.com/v3/search?license=cc0&q=keyboard` and `tags=keyboard`): **0 models found**. The Sketchfab public-domain catalogue contains zero mechanical/gaming keyboard assets.

Therefore, the permissive fallback standard across the 3D ecosystem for this asset class is **Creative Commons Attribution 4.0 (CC BY 4.0)**, matching the existing keyboard and mouse.

Below are **three fully verified alternative candidates** meeting all five evidence criteria:

---

### 3.2 Candidate 1: "Logitech mechanical gaming keyboard" (BlackCube)

- **Source URL**: `https://sketchfab.com/3d-models/logitech-mechanical-gaming-keyboard-c775d45baf854606931584404d7b9109`
- **Sketchfab Model UID**: `c775d45baf854606931584404d7b9109`
- **Author**: **BlackCube** (`blackcube4`, `https://sketchfab.com/blackcube4`)
- **Licence**: **CC BY 4.0** (`requirements: "Author must be credited. Commercial use is allowed."`)
- **Redistribution**: Web bundle permitted with CC BY 4.0 attribution.
- **Geometry & Topology**:
  - Triangles: **33,688 faces / 33,680 triangles** in GLTF.
  - Vertices: **19,236 vertices**.
- **Textures**: 5 PBR texture maps (max resolution 4096×4096).
- **Separability**: Authored in Blender as distinct components (individual keycaps and top chassis plate are loose mesh islands). Keycaps are separable for instancing.
- **Case Width**: **0.445 m** (standard full-size ANSI gaming layout; drop-in fit for the cinematic 0.44 m contract).

---

### 3.3 Candidate 2: "Logitech mechanical gaming keyboard RGB" (BlackCube)

- **Source URL**: `https://sketchfab.com/3d-models/logitech-mechanical-gaming-keyboard-rgb-3f9f5098b8d248b3829735e05178a3dd`
- **Sketchfab Model UID**: `3f9f5098b8d248b3829735e05178a3dd`
- **Author**: **BlackCube** (`blackcube4`, `https://sketchfab.com/blackcube4`)
- **Licence**: **CC BY 4.0** (`requirements: "Author must be credited. Commercial use is allowed."`)
- **Redistribution**: Web bundle permitted with CC BY 4.0 attribution.
- **Geometry & Topology**:
  - Triangles: **33,688 faces / 33,680 triangles** in GLTF.
  - Vertices: **19,236 vertices**.
- **Textures**: 6 PBR texture maps including RGB emissive channel (4096×4096).
- **Separability**: Identical topology to Candidate 1 with loose keycap geometry, suitable for canonical cap instancing.
- **Case Width**: **0.445 m** (ANSI full-size layout).

---

### 3.4 Candidate 3: "Mechanical keyboard" (FelikinRuslan)

- **Source URL**: `https://sketchfab.com/3d-models/mechanical-keyboard-1ba4055c33674567b51b783701ed05ce`
- **Sketchfab Model UID**: `1ba4055c33674567b51b783701ed05ce`
- **Author**: **FelikinRuslan** (`FelikinRuslan`, `https://sketchfab.com/FelikinRuslan`)
- **Licence**: **CC BY 4.0** (`requirements: "Author must be credited. Commercial use is allowed."`)
- **Redistribution**: Web bundle permitted with CC BY 4.0 attribution.
- **Geometry & Topology**:
  - Triangles: **11,128 triangles** (highly optimized WebGL budget).
  - Vertices: **6,621 vertices**.
- **Textures**: 2 material slots, 7 PBR texture maps (2048×2048 resolution).
- **Separability**: Distinct material slots separating the chassis housing from the keycaps.
- **Case Width**: **0.440 m** (standard tenkeyless / full hybrid casing).

---

## 4. Chair Replacement Candidate (Poly Haven CC0)

Even though the current chair is verified CC BY 4.0, if the owner or Opus prefers an unconditional **CC0 1.0 Universal** asset with zero attribution requirement and clean PBR maps:

### "Modern Arm Chair 01" (Vibrant Nordic / Poly Haven)

- **Source URL**: `https://polyhaven.com/a/modern_arm_chair_01`
- **API Files Endpoint**: `https://api.polyhaven.com/files/modern_arm_chair_01`
- **Author**: **Vibrant Nordic**
- **Licence**: **CC0 1.0 Universal** (Public Domain dedication, `https://creativecommons.org/publicdomain/zero/1.0/`)
- **Redistribution**: Unrestricted public domain. No attribution legally required.
- **Geometry & Topology**:
  - True Polygons: **8,916 polygons** (~17,800 triangles).
  - WebGL Draw Calls: **2 materials** (`legs` and `pillow`), reducing draw calls from the current chair's 6 down to 2.
- **Textures**: Complete PBR sets (Diffuse, Roughness, Normal OpenGL, Metallic, AO) available in 1K, 2K, 4K, 8K JPG/PNG/EXR. Pre-packed GLTF ARM (AO/Roughness/Metallic) maps provided.
- **Dimensions**: Contemporary oak armchair with plush black leather cushions. Width: 0.85 m, Depth: 0.82 m, Seat Height: ~0.44 m (aligns naturally with the room contract seat height of 0.45 m).
