# State

As of commit `02e0cc5` on branch `feat/v3`, 2026-09-12. Every number below was
measured, not estimated. Reproduce with the verification steps in `AGENTS.md`.

## Built and verified

**16/16 checks pass** (`node scripts/verify-v3.mjs`).

| Surface | Status |
|---|---|
| `/work` static | complete — renders identity, zero console errors, requests no spark / three / splat |
| desktop scan | complete — canvas mounts, splat paints, anchors project, panel opens |
| mobile deck | complete — serves deck not scan, no console errors. **Gyro untested on real hardware** (headless has no `deviceorientation`) |

## Measured bundle

| Chunk | Raw | Gzip |
|---|---|---|
| spark | 4933.7 KB | 1805 KB |
| three | 521.5 KB | 134 KB |
| react | 185.2 KB | — |
| Scan | 101.6 KB | 37.2 KB |
| Work | 10.0 KB | — |
| Deck | 10.0 KB | — |

**`/work` measured at 77.5 KB encoded JS**, against a 250 KB budget asserted in
the harness. The split works.

## Built but unverified against the real thing

- **Anchor coordinates** are tuned to the *placeholder* (a shoe). They will all
  need retuning when a room capture lands. Four anchors, ~15 minutes of nudging.
- **Capture provenance fields** (`capturedOn`, `device`, `method`) are empty
  strings; `isPlaceholder: true` drives the `DEV PLACEHOLDER` flag in telemetry.

## Not built — do not let the docs imply otherwise

- **The warp / laptop sequence does not exist.** The evidence that it is
  feasible is Spark's type definitions (`SplatMeshOptions.objectModifier`,
  `worldModifier`, `SplatEdit`, the `dyno` shader graph) plus README claims of a
  fully dynamic shader-graph pipeline. That is **API surface, not a prototype.**
  Nothing has been built or benchmarked.
- **Splat-dissolve transition** — same status.
- **"Record mode"** (chrome-free capture for sharing a clip) — not started.
- **`og:image`** — absent. Every link share currently previews as text.

## Content TODOs — all empty strings in `src/v3/content/index.js`

- every project's `links.live` and `links.github`
- every project's `decision` and `broke` fields
- `contact.linkedin`, `contact.twitter`, `contact.resume`

These are the difference between a demo and a portfolio. The site cannot ship
with them blank; this is content only the user can supply.

## Repo hygiene

- Dead v1/v2 source still present and unreferenced: `src/App.jsx`,
  `src/Shell.jsx`, `src/routes/`, `src/flagship/`, `src/components/`. Safe to
  delete; not yet deleted.
- `src/lab/registry.js` + `public/lab/*.html` (17 demos) are **live** — the lab
  predates v3 and is the user's own prior work, iframed by `LabScreen.jsx`.
- Git history is linear; branch consolidation is done; the pre-existing stash is
  preserved.
- **No remote configured.** Nothing has been pushed.

## Update — 2026-09-13: entrance scaffold and honest timing

This section describes the current working tree. The pinned baseline above
remains tied to commit `02e0cc5`; its 16/16 result is not a verification result
for this entrance work.

### Implemented in the working tree

- `Scan.jsx` now has explicit `room → preparing → entering → inside → leaving`
  phases. Selection and the room panel are disabled during the handoff; Escape,
  a visible Back to Room control, reduced motion, destination timeout and load
  failure all have return paths.
- `DhruvOSScreen.jsx` mounts the dedicated dependency-free
  `/os/embed.html?embed=1` entry lazily and keeps one iframe alive between
  visits. The same-origin/source-checked bridge handles `ready`, `enter`,
  `leave` and `request-leave`; the entry bypasses tear/boot and opens Projects
  immediately. The registry's optional Gravity app remains unavailable when
  Matter.js is absent; Matter is not a dependency of this entrance path.
- The existing Spark scene still supplies the room and the existing camera rig
  still flies to the selected anchor. `SplatStage.jsx` pauses its renderer and
  rAF loop while the destination prepares and while it owns the viewport, then
  resumes with a fresh timing window. It reports rAF cadence separately from
  CPU submission work; GPU time is explicitly unavailable.

### Deferred or unverified

- The planned “nearby scan separates into its splats” effect is not implemented.
  The current entrance is an HTML screen scale/fade composed with the existing
  anchor camera flight. Motion/deformation, normalized screen-plane geometry
  and perspective-matched camera-to-HTML composition remain reserved work; no
  migration or dependency change is justified by the current scaffold.
- Failure-path behavior, telemetry interpretation on real hardware and GPU
  timer measurement remain unverified. The bounded browser checks below cover
  the entrance path and a separate mobile deck smoke.
- Capture sourcing, final screen composition, OS curation/content export, mobile
  entrance proof and the extended acceptance checks remain later plan work.

### Measurement interpretation

**`RAF` is the average interval between browser `requestAnimationFrame`
callbacks. `CPU` is the measured `rig.update` plus `renderer.render` call
duration through command submission. `GPU` is blank/unavailable because no GPU
timer query is active. Neither the CPU number nor a derived `1000 / RAF` value
is completed GPU time, and neither is a basis for a performance claim without
the planned p50/p95 and real-device measurements.**

### Verification status

Root reports the metrics build passed in the elevated verification context.
The final serial entrance run recorded 21 passing checks, including the inside
state, one embedded OS window, a decoded project card, return to room, retained
iframe and focus restoration. It then timed out waiting two seconds for the
second entry cue. A subsequent focused re-entry check passed: the decoded card
persisted, the same single iframe remained, focus returned to the Monitor and
the second entry reached inside without console errors. This is focused
entrance evidence, not a whole-suite aggregate; failure-path coverage remains
a separate check. A separate Pixel 7 reduced-motion smoke passed with six deck
cards, the Portfolio heading, no stage/Spark/Three/splat requests and no
console errors. Real-hardware motion is unverified. Screenshots are state
evidence only, not timing or performance measurements.
