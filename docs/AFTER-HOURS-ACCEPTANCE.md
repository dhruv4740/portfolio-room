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

## Latest run

On 2026-09-20, the GPU acceptance command completed **26/26 passed**. It
measured 1,013,170 bytes of core resources and 11,566,796 bytes of
`/after-hours/` enhancement resources, including material textures and baked
light maps. Google font requests were allowed under the existing portfolio
font policy; intentional aborted optional assets were checked separately.

The legacy regressions were then started serially against the same preview:

- `verify-v3.mjs` was incomplete twice. The first run stopped after 10 durable
  passes during scan coverage. The GPU retry reached the scan section, failed
  its 15-second workspace mount wait, and then timed out in the existing
  `screenCoverage()` screenshot after 30 seconds.
- `verify-studio.mjs` recorded 12 passes through mobile stage exit, then
  stopped before its room checks without a final result.
- `verify-held-objects.mjs` failed at its existing 5-second seated wait after
  Explore (`page.waitForFunction` at line 73).

`verify-reduced-hands.mjs`, `verify-room-interactions.mjs`, and
`verify-real-apps.mjs` were not started against that stale preview. The GPU
measurement and hand/typing shot scripts were also not rerun. These are
explicitly unverified until the next built preview is available.

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
