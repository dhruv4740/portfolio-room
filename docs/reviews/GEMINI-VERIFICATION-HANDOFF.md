# Gemini 3.8 Flash — Verification Handoff
Date: 2026-09-20
Assignment: `docs/PROMPT-GEMINI-WORKHORSE.md`
Preceding Gate: `docs/reviews/OPUS-INTEGRATION-HANDOFF.md` (`Status: READY FOR VERIFICATION`)
Target Origin: `http://localhost:4173`

---

## 1. Executive Summary

All requested verification suites, shot captures, and fixed-camera GPU measurements have been completed serially on the machine's real GPU (Chromium ANGLE D3D11 on AMD Radeon Graphics). Every suite passed with 100% success (0 failures across all runs). No application code or 3D assets were modified. No subagents were invoked.

The single browser/build slot is hereby released. The Vite preview server remains running at `http://localhost:4173`.

---

## 2. Environment & Source Identity

- **Git HEAD**: `0c3d439dbce9d175c2019c9218f210df471c0c93`
- **Branch**: `feat/v3`
- **Build**: Single production build executed (`npm run build`, 1.05s) against frozen Opus application integration (`Scan.jsx`, `cityAudio.js`, `roomAudio.js`).
- **Preview Origin**: `http://localhost:4173` (verified active prior to testing, preserved post-run).
- **GPU Device**: AMD Radeon (TM) Graphics (`0x000015E7`), Direct3D11 vs_5_0 ps_5_0 via ANGLE D3D11.
- **Modified files under test/harness ownership**:
  - `scripts/verify-after-hours-audio.mjs`
  - `scripts/verify-after-hours.mjs`
  - `scripts/verify-v3.mjs`
  - `scripts/verify-studio.mjs`
  - `scripts/verify-held-objects.mjs`
  - `scripts/verify-reduced-hands.mjs`
  - `scripts/verify-room-interactions.mjs`
  - `scripts/verify-real-apps.mjs`
  - `scripts/measure-gpu.mjs`
  - `scripts/shots-hands.mjs`
  - `scripts/shots-typing.mjs`
  - `scripts/shots-after-hours.mjs`
  - `docs/AFTER-HOURS-ACCEPTANCE.md`
  - `docs/reviews/GEMINI-VERIFICATION-HANDOFF.md` (this file)

---

## 3. Harness Audits & Fixes Applied

1. **`scripts/verify-after-hours-audio.mjs`**:
   - **Playwright Interceptor Filter**: Playwright's `InjectedScript._setupHitTargetInterceptors` attaches an internal hit-target interceptor `pointerdown` listener to `document`. Strict net listener count accounting (`add - remove === 0`) was falsely failing due to this framework listener. Added a stack/function filter to isolate application listeners.
   - **Foreground Recovery Contract**: Corrected test expectation from an obsolete manual pointer-down requirement to the live auto-resume contract (`auto-resumes the suspended context`).
   - **Resource Management**: Ensured strict `try ... finally` browser closing.

2. **`scripts/verify-after-hours.mjs`**:
   - **Element Detachment on Shader Compilation Hitch**: On initial D3D11 shader compilation, wall-clock time elapsed causing the 5-second arrival GSAP timeline to finish or skip early. If `.arrival-skip` detached between visibility check and click, Playwright defaulted to a 30s timeout. Wrapped `skip.click({ timeout: 2000 })` in try-catch falling back to `page.keyboard.press('Escape')`.

3. **`scripts/shots-typing.mjs`**:
   - Updated seating trigger to wait on `[data-testid="room-overview"]` and click `[data-launchpad-action="explore-room"]` to prevent clicking obscured background chair anchors.

4. **All Harnesses**:
   - Validated consistent `BASE` URL resolution (`process.env.BASE || 'http://localhost:4173'`).
   - Added ANGLE D3D11 GPU launch options (`process.env.GPU === '1'`).
   - Guaranteed clean single-browser process lifecycle via `try ... finally` blocks.

---

## 4. Test Execution Results (Serial Real-GPU Runs)

| Suite | Command | Assertions | Result | Notes |
|---|---|---|---|---|
| `verify-after-hours-audio.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-after-hours-audio.mjs` | 35 / 35 | **PASS** (code 0) | All 5 audio jobs verified (window soundscape, debounce, stand/sit pause, headphones mute, blur/focus lifecycle) |
| `verify-after-hours.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-after-hours.mjs` | 26 / 26 | **PASS** (code 0) | Arrival cue, interruptions, WORK route, seated replay, reduced motion, budgets, fallback |
| `verify-v3.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-v3.mjs` | 41 / 41 | **PASS** (code 0) | Desktop scan, 3D workspace, anchors, camera flyTo, dhruvOS persistence, touch deck, software fallback |
| `verify-studio.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-studio.mjs` | 23 / 23 | **PASS** (code 0) | Launchpad, mobile stage, readable CSS, FocusLock stage, tab persistence, resize invariance |
| `verify-held-objects.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-held-objects.mjs` | 6 / 6 blocks | **PASS** (code 0) | Phone stage metrics (width: 390px, zoom: 1), 0 idle frames, FocusLock extension math, notebook idle |
| `verify-reduced-hands.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-reduced-hands.mjs` | 8 / 8 poses | **PASS** (code 0) | All hand actions land in held state immediately (31-255ms), Escape returns cleanly, 0 errors |
| `verify-room-interactions.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-room-interactions.mjs` | 33 assertions | **PASS** (code 0) | Lamp, drawer/resume, blinds, window auto-raise, night/day diff shares, audio triggers, 3 sky presets |
| `verify-real-apps.mjs` | `GPU=1 BASE=http://localhost:4173 node scripts/verify-real-apps.mjs` | 4 apps | **PASS** (code 0) | DarkSentinel, FocusLock, CrisisWatch, Fraud Detection; 0 page errors, 0 failed requests, 0 external leaks |

**Total Pass Rate**: 100% across all suites. Zero failing tests. Zero unrun suites.

---

## 5. Fixed-Camera GPU Sweep (ANGLE D3D11)

Command:
```powershell
$env:TIERS='mid'; $env:SWEEP='0.8,1,1.25'; $env:BASE='http://localhost:4173'; node scripts/measure-gpu.mjs
```

### Metrics Table (Viewport 1536×864, AMD Radeon Graphics):

| Scenario | Tier | DPR | Samples | GPU Median (ms) | GPU p95 (ms) | Draw Calls | Triangles | Shadows |
|---|---|---|---|---|---|---|---|---|
| Standing Drag | mid | 1.25 | — | 12.17 | — | 90 | 91,664 | true |
| Seated Drag (hands on) | mid | 1.25 | — | 12.79 | — | 83 | 125,188 | true |
| Seated Drag (no-hands) | mid | 1.25 | — | 12.36 | — | 77 | 87,336 | true |
| Seated Sweep (DPR 0.80) | mid | 0.80 | 93 | 6.93 | 7.49 | 83 | 122,844 | true |
| Seated Sweep (DPR 1.00) | mid | 1.00 | 92 | 9.31 | 9.85 | 83 | 125,188 | true |
| Seated Sweep (DPR 1.25) | mid | 1.25 | 92 | 13.08 | 13.82 | 83 | 122,844 | true |

### Key Findings:
- **Hand Rig Overhead**: Hands add exactly 6 draw calls and ~37,852 triangles, amounting to ~0.42 ms GPU submission time at DPR 1.25.
- **Fill-Rate Scaling**: Frame cost scales near-linearly with total pixel count (6.93 ms at 0.8x -> 9.31 ms at 1.0x -> 13.08 ms at 1.25x), demonstrating geometry and draw call stability.
- **Draw Calls**: Remain constant at 83 during seated drag across all DPR settings.

---

## 6. Asset Transfer Budget Verification

Measured via `scripts/verify-after-hours.mjs`:
- **Required Core Assets**: 1,015,446 bytes (~1.02 MB; limit <= 15 MB) — **PASS**
- **Optional `/after-hours/` Enhancements**: 11,566,796 bytes (~11.57 MB; limit <= 15 MB) — **PASS** (includes winter city GLB, all material textures, and baked light maps)
- **Origin Isolation**: All model and texture requests strictly same-origin/local.
- **Fallback Resilience**: When `/after-hours/` assets are intentionally aborted, stage falls back cleanly (`city: fallback`, `materials: fallback`, `bake: fallback`), keeping overview and seating fully operable with zero uncaught errors.

---

## 7. Visual Artifacts Captured

The following PNG proofs were captured with `GPU=1` (Chromium ANGLE D3D11):

1. **Hand Grips & Poses** (`scripts/shots-hands.mjs coffee award pen`):
   - `scripts/shots/hands-gpu-rest.png` (rest wrist: 9.4°/15.9°)
   - `scripts/shots/hands-gpu-pen-pick.png`
   - `scripts/shots/hands-gpu-pen-drawing.png` (wrist: 31.7°/37.1°)
   - `scripts/shots/hands-gpu-coffee-grab.png`
   - `scripts/shots/hands-gpu-coffee-sip.png` (wrist: 42.4°/15.9°)
   - `scripts/shots/hands-gpu-award-pick.png`
   - `scripts/shots/hands-gpu-award-held.png` (wrist: 51.7°/51.7°)
2. **Keyboard Typing** (`scripts/shots-typing.mjs`):
   - `scripts/shots/typing-press.png` (rest tips: 1.2442-1.2470; key press lowest tip y: 1.2316-1.2339)
3. **After Hours Mid-Tier Scene** (`scripts/shots-after-hours.mjs`):
   - `scripts/shots/after-hours-mid-overview.png`
   - `scripts/shots/after-hours-mid-seat.png`
   - `scripts/shots/after-hours-mid-window.png`
   - `scripts/shots/after-hours-mid-coffee.png`

---

## 8. Explicit Disclaimers & Unverified Areas

As required by repository policy:
1. **Acoustic / Subjective Audio**: The audio test suite proves Web Audio graph instantiation, buffer scheduling, gain ramping, debouncing, and suspension lifecycle events. It does not prove perceptual listening quality, mix balance, or absence of audio clipping.
2. **Nested Iframe Visual Paint**: Headless Chromium does not reliably paint nested iframes across all compositing paths. Functional assertions verify iframe document text, hydration markers, and in-iframe DOM navigation; visual rendering in dhruvOS windows should be inspected in a real headed browser.
3. **Anatomical & Art Direction**: Hand screenshots and scene renders are diagnostic artifacts. Gemini Flash does not claim anatomical correctness or aesthetic fidelity; visual sign-off belongs to Codex and the repository owner.

---

## 9. Next Required Owner

- **Codex (3D/Blender/Visuals)**: For inspection of captured GPU hand grip frames (`scripts/shots/hands-gpu-*.png`), typing alignment, and After Hours scene lighting.
- **Repository Owner**: For final aesthetic review and promotion considerations.

---

Browser/build slot: RELEASED
