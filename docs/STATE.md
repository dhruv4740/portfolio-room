# State

Current working tree: 2026-09-13 on branch `feat/v3`. This file separates
measured results from the previous Gaussian-splat prototype and the current
authored workspace migration.

## Current direction

- The desktop hero is moving from the shoe placeholder and planned room capture
  to an authored modeled 3D workspace: desk, monitor, notebook, and supporting
  objects.
- The final scan surface is expected to render the workspace directly. It must
  not require a `.splat`/`.ply`/`.spz` capture or the Spark renderer.
- The monitor remains the entry anchor for the embedded dhruvOS experience.
  Returning to the workspace, retaining the OS iframe, and re-entering with app
  state intact are behavioral acceptance checks.
- `/work` remains the static recruiter route, and the mobile deck remains a
  separate touch surface driven by the shared v3 content source.

## Verification status

The old `02e0cc5` baseline recorded 16/16 checks for the Gaussian-splat shoe
placeholder. That result is historical evidence for the retired scene and is
not a release result for the modeled workspace.

The entrance scaffold previously had focused evidence for entering dhruvOS,
decoding a project card, returning to the room, retaining the iframe, restoring
focus, and a Pixel 7 deck smoke. Those checks must be rerun against the modeled
workspace after the scene and content integration land. The updated harness
also needs to assert actual workspace geometry and object interaction rather
than splat coverage.

## Current verification evidence — 2026-09-13

- `npm run build` passes for the modeled workspace bundle.
- A 1440×900 production-preview screenshot is saved at
  `scripts/shots/v3-workspace.png`; it shows the desk, monitor, keyboard,
  notebook, chair, lamp, window, and all four markers.
- The latest bounded run observed 14 passing assertions before it was stopped:
  capability fallback, all six `/work` checks, workspace mount, no Spark/no
  capture requests, 35.9% lit coverage (mean luma 75.2), four enabled anchor
  buttons, four projected anchors, and monitor-anchor activation.
- The previous complete run reached 29/32. Its desk/window failures came from
  testing different anchors while the camera was still in the previous
  close-up; its focus failure preceded the stage's focus-race fix. The harness
  now returns through Escape and waits for the room between anchor checks and
  includes a direct canvas monitor hit test. A complete rerun of those fixes is
  pending.
- The current local preview is available at
  `http://127.0.0.1:4174/#/` (port 4173 was already occupied).

No GPU timing claim is currently established. Browser `requestAnimationFrame`
cadence and JavaScript submission duration do not measure completed GPU time;
the harness must report GPU duration as unavailable unless a supported timer is
active. Screenshots are visual evidence only.

## Acceptance checks for the modeled workspace

- Desktop scan mounts a canvas with an explicit `workspace` scene marker and
  renders the modeled desk, monitor, notebook, and window objects.
- The monitor, desk, notebook, and window anchors are present and projected;
  activating the monitor opens its panel and exposes the screen entry control.
- The monitor entry reaches the embedded OS, a project card responds, Back to
  Room returns to the workspace, and the same OS instance survives re-entry.
- `/work` requests no Spark, Three, or capture asset and reports no console
  errors. The deck serves on a Pixel 7 context, without mounting the desktop
  stage.
- `npm run build` and `node scripts/verify-v3.mjs` pass after integration.

## Known limitations

- Final object placement, material tuning, camera choreography, and real-device
  motion performance remain to be measured after the modeled scene lands.
- Gyroscope behavior remains unverified on physical hardware; no permission
  prompt should be required to understand the mobile surface.
- Project links and the decision/failure notes in `src/v3/content/index.js`,
  plus the optional contact links, still need the user's real details.

## Repo hygiene

- Dead v1/v2 source remains unreferenced: `src/App.jsx`, `src/Shell.jsx`,
  `src/routes/`, `src/flagship/`, and `src/components/`. Leave cleanup as a
  separate change.
- `src/lab/registry.js` and `public/lab/*.html` remain live through
  `LabScreen.jsx`.
- No remote is configured and nothing has been pushed.
