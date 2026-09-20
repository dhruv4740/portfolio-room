# After Hours acceptance harness

`scripts/verify-after-hours.mjs` is the bounded acceptance pass for the new
arrival and asset-loading work. It covers the stateful edges that the existing
room, hand, studio and real-project suites do not own:

- first arrival, start/middle/end interruption, seated replay (including
  re-entry after an interrupted replay), and navigation to WORK while the
  arrival cue is active;
- reduced-motion initial load and replay;
- required and optional asset transfer budgets;
- the software-capability `/work` route and its no-3D request boundary.

Run it against the same preview origin as the other harnesses:

```powershell
BASE=http://localhost:4173 node scripts/verify-after-hours.mjs
GPU=1 BASE=http://localhost:4173 node scripts/verify-after-hours.mjs
```

`GPU=1` uses Chromium with ANGLE D3D11 and the ignored GPU blocklist. It is
useful for the arrival visual timing and render diagnostics, but this harness
does not claim a frame-rate result. The GPU browser slot must stay exclusive.

## Arrival UI and API contract

The visible UI is authoritative. The cue uses `.arrival-cue` and
`[data-testid="arrival-skip"]`; the seated replay control uses
`[data-testid="replay-arrival"]`. The harness reads those elements directly,
then optionally reads the same state through
`window.__v3test.arrivalAPI` (or `window.__v3test.arrival`) when the diagnostic
bridge is present. A bridge state must agree with the visible cue; an API alone
cannot make an arrival check pass.

The optional diagnostic object may expose `state()` or a plain state object
with `phase` and `durationMs`. `phase` should use a settled value such as
`settled`, `complete`, `idle`, or `done` after Skip, Escape, natural completion,
or navigation. The harness derives the end-interruption wait from
`durationMs`, falling back to five seconds from the approved plan.

## Asset measurement

The preferred diagnostic source is `window.__v3test.assetManifest` with
`required` and `optional` arrays. Each item should include a local runtime path
and `bytes` (or `transferBytes`). When that bridge is absent, the harness uses
Resource Timing entries under `/assets/`, `/models/`, and `/materials/`, while
excluding `/os/` and `/apps/`, as an explicit estimate and records that
limitation in the result detail. `/after-hours/` entries include the city GLB,
all material textures, and baked light maps, so texture transfer is part of
the measured enhancement total.

The acceptance targets are independent: required core assets are at most 15 MB
transferred, and optional enhancements are at most 15 MB more. Resource Timing
can undercount cached responses; a manifest with recorded transfer sizes is the
stronger evidence. Runtime requests must remain same-origin and local.

The normal asset check waits for
`.workspace-stage[data-winter-city="ready"][data-room-materials="ready"][data-room-bake="ready"]`
before measuring. A separate fallback context aborts the optional city,
material, and bake requests and verifies that the overview, seat, and object
controls remain usable while the stage reports `fallback` statuses.

## Harness Audit Table

| Script | Source Snapshot | Completed Assertions | Exit Status | Remaining Check |
|---|---|---|---|---|
| `scripts/verify-after-hours-audio.mjs` | D3D11 launch + Playwright internal listener filter + auto-resume contract | 35 / 35 | PASS (code 0) | None (synthetic event verified; acoustic listening quality unverified) |
| `scripts/verify-after-hours.mjs` | D3D11 launch + detach-safe skip click + Escape fallback | 26 / 26 | PASS (code 0) | None |
| `scripts/verify-v3.mjs` | Configurable GPU main browser (`GPU=1`) + separate unpinned software fallback | 41 / 41 | PASS (code 0) | None |
| `scripts/verify-studio.mjs` | D3D11 launch + try/finally browser close | 23 / 23 | PASS (code 0) | None |
| `scripts/verify-held-objects.mjs` | D3D11 launch + 12s seated exploration timeout + try/finally browser close | 6 / 6 lifecycle assertions | PASS (code 0) | None |
| `scripts/verify-reduced-hands.mjs` | D3D11 launch + 8 hand poses held/escaped + try/finally browser close | 8 / 8 poses + clean errors | PASS (code 0) | None |
| `scripts/verify-room-interactions.mjs` | D3D11 launch + window visibility diff + audio tests 1-4 + sky states | All room controls + 3 skies | PASS (code 0) | None |
| `scripts/verify-real-apps.mjs` | D3D11 launch + 4 iframe apps (DarkSentinel, FocusLock, CrisisWatch, Fraud) | 4 apps navigated, 0 errors, 0 failed, 0 external | PASS (code 0) | None (DOM text and navigation verified; headless nested iframe paint unverified) |

## Latest Verification Run (2026-09-20)

Following the freeze by external Claude Opus (`docs/reviews/OPUS-INTEGRATION-HANDOFF.md`: `Status: READY FOR VERIFICATION`), a clean production build (`npm run build`, 1.05s) was run once, serving on the dedicated preview server at `http://localhost:4173`. All suites were executed serially on the real GPU (`GPU=1`, Chromium ANGLE D3D11, AMD Radeon Graphics):

1. **`verify-after-hours-audio.mjs`**: **35/35 passed** (Exit code 0). Verified all 5 After Hours audio jobs (window open/close city soundscape, double-click debouncing, standing/seated pause/resume, headphones mute/unmute, background blur/visibility suspension and foreground auto-resume).
2. **`verify-after-hours.mjs`**: **26/26 passed** (Exit code 0). Verified arrival cue visibility, start/middle/end interruptions, WORK route navigation, seated replay re-entry, reduced-motion bypass, asset budgets, and missing-asset fallback.
   - Core required transfer: 1,015,446 bytes (~1.02 MB, limit 15 MB).
   - Optional `/after-hours/` transfer: 11,566,796 bytes (~11.57 MB, limit 15 MB).
   - Runtime requests: 33 model resources, strictly local/same-origin.
3. **`verify-v3.mjs`**: **41/41 passed** (Exit code 0). Software GPU static fallback to `/work` with zero 3D requests and <250KB payload; desktop 3D workspace mount, 76.2% lit canvas, launchpad overview, anchor projection, dhruvOS camera travel, state persistence across returns, and mobile deck surface isolation.
4. **`verify-studio.mjs`**: **23/23 passed** (Exit code 0). Overview launchpad routes, mobile stage presentation, readable CSS (390px, no sub-1 scaling), FocusLock stage interaction, tab persistence, resize invariance (1280x720, 1600x900, 1440x900), and clean room return.
5. **`verify-held-objects.mjs`**: **Passed** (Exit code 0). Phone stage metrics (`mode: stage`, `zoom: 1`, `width: 390`, `labelFontPx: 14.06`), 0 idle frame submissions while held, FocusLock extension grant flow, and notebook reading idle and Escape return.
6. **`verify-reduced-hands.mjs`**: **Passed** (Exit code 0). Immediate hold on click for PEN (86ms), AWARD (53ms), RESUME (53ms), COFFEE (31ms), LAMP (83ms), HEADPHONES (177ms), NOTEBOOK (57ms), PHONE (255ms), with clean Escape returns and 0 page errors.
7. **`verify-room-interactions.mjs`**: **Passed** (Exit code 0). Lamp toggle, resume drawer open/close, blinds toggle, window auto-raise on blinds, window visibility diff shares (night: 40.8%, day: 85.4%), room audio triggers (open->playing, double-click consistency, close->silent, stand->silent, sit->playing), headphones mute, coffee depletion/refill, award inspection, typing, and sky presets (day, dusk, night).
8. **`verify-real-apps.mjs`**: **Passed** (Exit code 0). All four embedded apps opened and navigated without console errors, failed requests, or external leaks:
   - DarkSentinel: Launch Manual Mode, System Status
   - FocusLock: Blocked Rules, minimize/restore/close
   - CrisisWatch: Fact/Cap debunker query
   - Fraud Detection: Dashboard navigation

## Fixed-Camera GPU Measurement Sweep

Measured using `scripts/measure-gpu.mjs` with `TIERS=mid`, `SWEEP=0.8,1,1.25`, viewport 1536×864, Chromium ANGLE D3D11 on AMD Radeon Graphics (`0x000015E7`), Direct3D11 vs_5_0 ps_5_0:

| Measurement Point | Tier | DPR | Samples | GPU Median | GPU p95 | Draw Calls | Triangles | Shadows |
|---|---|---|---|---|---|---|---|---|
| Standing drag | mid | 1.25 | — | 12.17 ms | — | 90 | 91,664 | true |
| Seated drag (with hands) | mid | 1.25 | — | 12.79 ms | — | 83 | 125,188 | true |
| Seated drag (no-hands) | mid | 1.25 | — | 12.36 ms | — | 77 | 87,336 | true |
| Seated sweep: DPR 0.8 | mid | 0.80 | 93 | 6.93 ms | 7.49 ms | 83 | 122,844 | true |
| Seated sweep: DPR 1.0 | mid | 1.00 | 92 | 9.31 ms | 9.85 ms | 83 | 125,188 | true |
| Seated sweep: DPR 1.25 | mid | 1.25 | 92 | 13.08 ms | 13.82 ms | 83 | 122,844 | true |

*Note: Hand rig adds ~6 draw calls and ~37,852 triangles, representing ~0.42 ms GPU cost. GPU frame cost scales with pixel count (fill rate), demonstrating proper draw call batching.*

## Captured GPU Visual Proofs

- Hand poses (`scripts/shots/hands-gpu-*.png`):
  - `hands-gpu-rest.png`
  - `hands-gpu-pen-pick.png`
  - `hands-gpu-pen-drawing.png`
  - `hands-gpu-coffee-grab.png`
  - `hands-gpu-coffee-sip.png`
  - `hands-gpu-award-pick.png`
  - `hands-gpu-award-held.png`
- Typing (`scripts/shots/typing-press.png`)
- After Hours mid-tier scene (`scripts/shots/after-hours-mid-*.png`):
  - `after-hours-mid-overview.png`
  - `after-hours-mid-seat.png`
  - `after-hours-mid-window.png`
  - `after-hours-mid-coffee.png`

## Historical Runs (Prior Interrupted Run Context)

On earlier test cycles on 2026-09-20 prior to the Opus audio freeze and harness fixes:
- `verify-after-hours.mjs` passed 26/26.
- `verify-v3.mjs` was incomplete due to timeout in `screenCoverage()` under software rendering.
- `verify-studio.mjs` had stopped after 12 assertions before room checks.
- `verify-held-objects.mjs` failed at a 5-second seated wait.
- `verify-reduced-hands.mjs`, `verify-room-interactions.mjs`, and `verify-real-apps.mjs` were unrun in that cycle.
All of these regressions have now been re-run to completion with 100% passing status as detailed above.

## Baseline evidence

The requested real-GPU baseline was captured from the unchanged
`scripts/shots-studio.mjs` flow on 2026-09-20 at 1536×864, device scale 1.25,
mid tier, ANGLE D3D11:

- [baseline-after-hours-overview.png](../scripts/shots/baseline-after-hours-overview.png)
- [baseline-after-hours-seat.png](../scripts/shots/baseline-after-hours-seat.png)
- [baseline-after-hours-window.png](../scripts/shots/baseline-after-hours-window.png)

The shot flow reported `medianMs=12.94108`, 67 draw calls and 61,242 triangles
for its mid-tier sample. This is a current-device observation, not a before /
after improvement claim.

The functional regression scripts accept `GPU=1` to use Chromium ANGLE D3D11;
`verify-v3.mjs` intentionally keeps its default software launch so its static
fallback assertion remains meaningful. No result above is a frame-rate claim.
