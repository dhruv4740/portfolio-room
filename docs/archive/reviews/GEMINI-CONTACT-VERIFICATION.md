# Gemini Flash — Contact & Exterior Verification Report
Date: 2026-09-20
Assignment: `docs/PROMPT-GEMINI-CONTACT-VERIFY.md`
Preceding Checkpoints: `7c86166` (exterior depth) and `1fb9ddf` (desk contact shadows)
Target Origin: `http://localhost:4173`

---

## 1. Executive Summary

This report completes the bounded contact and exterior verification assignment following Codex's visual review and freeze of 3D runtime and assets.

All suites were executed serially on the real GPU (Chromium ANGLE D3D11 on AMD Radeon Graphics).
- **Serial Regressions**: `review-contact-shadows.mjs`, `verify-held-objects.mjs`, `verify-reduced-hands.mjs`, `verify-room-interactions.mjs`, and `verify-after-hours.mjs` all passed with **100% success** (0 errors).
- **Low-Tier & Reduced-Motion Contact Verification**: Created and executed `scripts/verify-contact-low.mjs`. All 11 assertions passed, verifying 256px resolution, capture throttling, settled rest states, keyboard/cup/phone contact updates without stale shadows, and room rendering pause during the phone stage.
- **Hand Asset Warning Diagnosis**: Diagnosed root cause of `"Failed to fetch; generating local fallback"`. The Vite preview server serves `.gz` files with `Content-Encoding: gzip`, causing browser-level automatic decompression. Passing the already-decompressed stream into `DecompressionStream('gzip')` triggers a stream fault (`TypeError: Failed to fetch`). A minimal fix for Codex is documented below without altering runtime code.

The exclusive browser/build slot is **RELEASED**. The preview server remains active at `http://localhost:4173`.

---

## 2. Environment & Source Identity

- **Git HEAD**: `7c8616694d7488c7ecac62f502b777db5808e80a` (`feat: add recessed city interiors and winter depth`)
- **Preceding Commit**: `1fb9ddf` (`feat: ground desk props with cached contact shadows`)
- **Branch**: `feat/v3`
- **Dirty Paths at Start**: None (only user-owned untracked files: `.claude/`, `resume/`, `resume_linkedin (5)_page-0001.jpg`, `scripts/probe-*.mjs`).
- **Single Production Build**:
  - Start: `2026-09-20 10:35:55.234 +05:30`
  - Duration: `673ms`
  - Output: `dist/` verified, zero build errors.
- **Preview Origin**: Reused dedicated Vite preview on `http://localhost:4173` (verified active, no competing server started).
- **GPU Device**: AMD Radeon (TM) Graphics (`0x000015E7`), Direct3D11 vs_5_0 ps_5_0 via ANGLE D3D11.

---

## 3. Serial Test Execution Results

All suites were run serially with exclusive browser access on ANGLE D3D11.

### 1. `scripts/review-contact-shadows.mjs` (Parent-owned, run unchanged)
- **Command**: `node scripts/review-contact-shadows.mjs`
- **Status**: **PASS** (Exit code 0)
- **Observations**:
  - Initial contact state: `enabled: true, captures: 3, resolution: [512, 211], dynamicMeshes: 23`
  - Settled rest: `idle === count` passed (settled hands do not recapture).
  - Dynamic lift: Coffee cup lifting refreshed captures (`captures > count` passed).
  - Fixed-seat comparison (flow sample at mid tier, 1536×864, DPR 1.25):
    - Contacts disabled (`false`): median 10.87 ms, p95 11.26 ms (75 samples), 82 draw calls, 145,378 triangles.
    - Contacts enabled (`true`): median 11.09 ms, p95 15.23 ms (75 samples), 84 draw calls, 145,382 triangles.
    - Added overhead: exactly +2 draw calls (desk and raised felt mat receivers) and +4 triangles.
  - Errors: 0 (`errors []`).
  - Generated shots: `scripts/shots/contact-seat-on.png`, `contact-seat-off.png`, `contact-coffee-lift.png`, `contact-coffee-return.png`.

### 2. `scripts/verify-held-objects.mjs`
- **Command**: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node scripts/verify-held-objects.mjs`
- **Status**: **PASS** (Exit code 0)
- **Observations**:
  - Phone stage metrics: `mode: 'stage'`, `transform: 'none'`, `zoom: 1`, `width: 390`, `labelFontPx: 14.06`.
  - Phone stage idle frames: `0` (room rendering paused).
  - FocusLock math extension and home return: passed.
  - Notebook reading idle frames: `0`.
  - Errors: 0.

### 3. `scripts/verify-reduced-hands.mjs`
- **Command**: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node scripts/verify-reduced-hands.mjs`
- **Status**: **PASS** (Exit code 0)
- **Observations**:
  - PEN held in 55 ms (wrist 31.7/36.9)
  - AWARD held in 26 ms (wrist 51.7/51.7)
  - RESUME held in 23 ms (wrist 51.4/51.4)
  - COFFEE held in 20 ms (wrist 9.4/15.9)
  - LAMP held in 22 ms (wrist 9.4/15.9)
  - HEADPHONES held in 36 ms (wrist 9.4/15.9)
  - NOTEBOOK held in 32 ms (wrist 39/39)
  - PHONE held in 29 ms (wrist 50/15.9)
  - Errors: 0.

### 4. `scripts/verify-room-interactions.mjs`
- **Command**: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node scripts/verify-room-interactions.mjs`
- **Status**: **PASS** (Exit code 0)
- **Observations**:
  - Lamp toggle, resume drawer open/close, blinds toggle, window auto-raise on blinds.
  - Window visibility diff shares: Night = 34.37%, Day = 88.15%.
  - Audio tests 1–4 passed (open/close soundscape, double-click debounce, stand/sit pause-resume).
  - Headphones toggle, coffee depletion/refill, award inspection, typing.
  - Sky presets: day, dusk, night all loaded without page errors.
  - Errors: 0.

### 5. `scripts/verify-after-hours.mjs`
- **Command**: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node scripts/verify-after-hours.mjs`
- **Status**: **PASS** (26 / 26 passed, Exit code 0)
- **Observations**:
  - Arrival cues, start/middle/end interruptions, WORK static route navigation, seated replay re-entry.
  - Reduced-motion bypass.
  - Asset readiness: `winterCity: 'ready'`, `roomMaterials: 'ready'`, `roomBake: 'ready'`.
  - Transfer budgets: Required = 1,018,098 bytes (~1.02 MB vs 15 MB limit); Optional = 13,060,348 bytes (~13.06 MB vs 15 MB limit).
  - Missing-asset fallback: `fallback` reported for aborted optional assets, controls remain interactive.
  - Software fallback: `/work` static route reached with zero 3D requests.
  - Errors: 0.

---

## 4. Explicit Low-Tier & Reduced-Motion Contact Verification

Created and executed dedicated harness `scripts/verify-contact-low.mjs`.

- **Command**: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node scripts/verify-contact-low.mjs`
- **Result**: **11 / 11 PASSED** (Exit code 0)
- **Machine-Readable Artifact**: `scripts/shots/contact-low-results.json`
- **Visual Artifacts**:
  - `scripts/shots/contact-low-rest.png`
  - `scripts/shots/contact-low-typing.png`
  - `scripts/shots/contact-low-coffee-settled.png`
  - `scripts/shots/contact-low-phone-stage.png`
  - `scripts/shots/contact-low-returned.png`

### Detailed Assertion Results:

| Check | Expected | Measured | Status |
|---|---|---|---|
| Low-tier configuration | `resolution[0] === 256`, `enabled === true` | `resolution: [256, 105]`, `dynamicMeshes: 23` | **PASS** |
| Settled rest state | Captures remain unchanged over 1.2s idle | `captures: 2 -> 2` | **PASS** |
| Keyboard typing refresh | Keypress triggers contact update | `pre: 2 -> post: 5` | **PASS** |
| Keyboard typing settle | Captures stop incrementing once typing stops | `captures: 5 -> 5` | **PASS** |
| Coffee action refresh | Coffee liquid/pose update refreshes contact | `pre: 5 -> post: 6` | **PASS** |
| Coffee returned settle | Cup returns to home pose, captures stop | `captures: 6 -> 6` | **PASS** |
| Phone stage room pause (reduced motion) | 0 rAF frames submitted while stage is open | `idleFrames: 0` | **PASS** |
| Phone returned settle (reduced motion) | Returned to desk, captures stop | `captures: 6 -> 6` | **PASS** |
| Standard motion phone physical lift | Tabletop clearance dynamically updates contact | `pre: 5 -> post: 17` | **PASS** |
| Standard motion phone return settle | Return to desk placement settles captures | `captures: 36 -> 36` | **PASS** |
| Error cleaniness | Zero uncaught page or console errors | `clean` (0 errors) | **PASS** |

### Key Mechanics Confirmed:
1. **Low-Tier Throttling & Sizing**: The contact shadow pass correctly respects low-tier parameters (`resolution: 256`, `updatesPerSecond: 10`), using a 256×105 render target instead of 512×211.
2. **Dynamic Invalidation & Settling**: Caster updates occur strictly when source or bone matrices change (`matrixChanged()`). Once an action completes and hands/props settle at rest, `dirty` evaluates to false and `capture()` is not called.
3. **Absence of Stale Shadows**:
   - The raised felt mat receiver receives contact from hands, keycaps, and keyboard feet without bleeding under the mat.
   - When props (cup/phone) are lifted or returned, their contact silhouettes track their positions and leave no residual shadow.
4. **Room Rendering Pause**: In phone stage mode, `cancelAnimationFrame(raf)` suspends room rendering, confirming 0 frame submissions.

---

## 5. Hand-Asset Loading Warning Diagnosis (`handAssets.js`)

### Reported Warning:
```
warning Failed to fetch; generating local fallback
```

### Investigation & Captured Evidence:
Inspected `src/v3/desktop/handAssets.js` (lines 5–10) and `src/v3/desktop/handSurface.js` (line 3).

1. **Static Assets on Origin `http://localhost:4173`**:
   - Both `public/models/hands-v1.bin` (1,329,256 bytes) and `public/models/hands-v1.bin.gz` (671,822 bytes) exist on disk and in `dist/models/`.
2. **Server Response Headers**:
   - Fetching `http://localhost:4173/models/hands-v1.bin.gz`:
     - HTTP Status: `200 OK`
     - `Content-Length`: `671822`
     - `Content-Encoding`: `gzip`
3. **Browser Networking Layer Behavior**:
   - Because Vite's preview static server (`sirv`) sees the `.gz` extension and sets the HTTP response header `Content-Encoding: gzip`, the browser HTTP client (and fetch API) **transparently decompresses the payload** during transport.
   - As a result, `response.body` exposed to JavaScript contains the **already-decompressed** 1,329,256 uncompressed bytes.
4. **Failure Mechanism in `handAssets.js`**:
   ```javascript
   // handAssets.js line 9:
   const buffer = compressed
     ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
     : await response.arrayBuffer();
   ```
   - When `DecompressionStream('gzip')` receives the already-decompressed stream (which begins with the uncompressed `HAND` binary header `0x48414e44`), it rejects with a stream decoding error.
   - Reading the faulted stream via `new Response(...).arrayBuffer()` throws a `TypeError: Failed to fetch`.
   - `handSurface.js` catches this error and logs: `console.warn(error.message + '; generating local fallback');`, falling back to procedural hand mesh generation.

### Minimal Proposed Fix for Codex (Do NOT edit runtime yet):
In `src/v3/desktop/handAssets.js`, check whether the browser has already decompressed the response before piping to `DecompressionStream`:

```javascript
export async function loadHandAssets() {
  const compressed = typeof DecompressionStream !== 'undefined';
  const response = await fetch(`${import.meta.env?.BASE_URL || '/'}models/hands-v1.bin${compressed ? '.gz' : ''}`);
  if (!response.ok) throw new Error('Hand geometry could not be loaded');
  const alreadyDecompressed = response.headers.get('content-encoding') === 'gzip';
  const buffer = (compressed && !alreadyDecompressed)
    ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : await response.arrayBuffer();
  const view = new DataView(buffer);
  ...
```

*Verification of proposed fix*: Tested in Chromium via Playwright evaluate. Checking `response.headers.get('content-encoding') === 'gzip'` immediately resolved the 1,329,256-byte arrayBuffer and successfully decoded the `HAND` (0x48414e44) magic number and version 1.

---

## 6. Disclaimers & Unverified Boundaries

1. **Acoustic / Visual Realism**: All tests assert state machines, timing, and WebGL state. Gemini Flash does not claim photorealistic art acceptance or acoustic fidelity; visual sign-off belongs to Codex and the repository owner.
2. **GPU Flow Samples vs. Benchmarks**: Frame intervals reported in `review-contact-shadows.mjs` (10.87 ms / 11.09 ms) are incidental transient flow samples during test execution, not controlled multi-run benchmarks.
3. **Runtime Immutability**: No application, 3D, or asset files were edited during this verification run.

---

## 7. Next Required Action

- **Codex (3D)**: Review the proposed one-line `Content-Encoding` check in `src/v3/desktop/handAssets.js` to eliminate the fallback warning, and proceed with custom hand anatomy art tasks.

---

Browser/build slot: RELEASED
