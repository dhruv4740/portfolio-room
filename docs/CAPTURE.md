# Capturing a room yourself — FALLBACK

> **This is no longer the plan.** The current direction is to source a public
> room scan rather than capture the user's own room — see `docs/VISION.md`.
> This document is kept because the path is still valid if sourcing fails, and
> because sections 3, 4 and "If the capture loads upside down" apply to **any**
> capture, downloaded or shot.

The scan surface currently renders a public demo splat (a shoe). Everything
else is built; this is the one input that has to come from you.

## 1. Capture the room (fallback path only)

Free, on-device, no account: **Scaniverse** (iOS/Android) → Splat mode.
Cloud alternative: **Luma AI** or **Polycam**.

What actually determines whether it looks good:

- **Even, diffuse light.** Overcast daylight or all your lamps on. Avoid a
  bright window in frame — it blows out and reconstructs as haze.
- **Move slowly.** Motion blur is unrecoverable. Walk at half the speed that
  feels right.
- **Orbit the subject, don't pan from one spot.** Parallax is what the solver
  needs; rotating in place gives it almost nothing.
- **Three heights.** One loop at desk level, one above looking down, one below
  looking up. Roughly 200+ frames total.
- **Nothing may move.** No pets, no you, no screensaver on the monitor. Moving
  objects become smeared ghosts.
- **Get close on the hero objects** — the monitor, the desk, whatever the
  anchors point at. Detail comes from coverage.

Budget 3–4 attempts. The first is usually mush; that is normal, not failure.

## 2. Export and shrink

Export `.ply` or `.splat`. Then in **SuperSplat** (free, browser,
<https://superspl.at/editor>):

1. **Crop hard.** Delete everything outside the desk area. This is the single
   biggest lever on file size, and dropping the far half of the room usually
   costs nothing visually.
2. Delete floater blobs and the reconstructed "ceiling haze".
3. Export compressed — `.spz` if offered, otherwise compressed `.ply`.

Target **under 15MB**. The placeholder is 8.6MB / 270k splats and renders at
well under 1ms/frame, so there is headroom — but every megabyte is paid for by
someone on mobile data.

## 3. Drop it in

Put the file in `public/splats/` and update `capture` in
`src/v3/content/index.js`:

```js
export const capture = {
  source: '/splats/room.spz',
  bytes: 12_400_000,      // real byte size — the loader uses it as a denominator
  isPlaceholder: false,   // clears the DEV PLACEHOLDER flag in the telemetry
  label: '',
  capturedOn: '2026-09-14',
  device: 'iPhone 13',
  method: 'Scaniverse',
};
```

`public/splats/*` is gitignored — the binaries stay out of the repo.

## 4. Tune the anchors

Anchors are authored in **normalised** coordinates: `at: [x, y, z]`, each `0..1`
within the capture's bounding box. `0` is the box minimum, `1` the maximum.
Nothing else needs editing — world positions and camera viewpoints are derived
at runtime.

```js
{ id: 'monitor', at: [0.5, 0.72, 0.35], dolly: 0.45, ... }
```

`dolly` is how close the camera parks, as a fraction of the capture radius.
Smaller is tighter.

Run `npm run dev`, read the live `CAM x y z` readout in the bottom-left
telemetry, orbit to the framing you want, and work backwards to the normalised
value. Expect ~15 minutes of nudging for four anchors.

## If the capture loads upside down

One line, in `src/v3/desktop/SplatStage.jsx`:

```js
splat.quaternion.set(1, 0, 0, 0);   // 180° about X
```

Set it to `(0, 0, 0, 1)` for no rotation. Different trainers use different
up-axis conventions; this is the only place it matters.

## Verifying

```bash
npm run build
npx vite preview --port 4173
node scripts/verify-v3.mjs
```

16 checks. The one that matters most after swapping a capture is
`scan: splat actually paints` — it screenshots the scene and measures how much
of the frame is lit, which catches a camera framing empty space.
