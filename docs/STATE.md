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
