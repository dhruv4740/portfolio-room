# Overnight report (2026-09-23)

This file is updated after each commit. All verification ran on the real AMD
iGPU (`GPU=1`, ANGLE D3D11) unless noted. Branches: `feat/v3` holds items
1–11, `feat/true-scale-room` holds item 12, and `feat/relight` (based on
item 12) holds item 13. Nothing was merged to main.

## Items

| # | Item | Commits | Verified |
|---|------|---------|----------|
| 1 | Hands wrap-up | none needed | `verify-held-objects` and `verify-room-interactions` pass |
| 2 | Launchpad | `208e0e2` | `verify-v3` and a GPU frame |
| 3 | Loading progress, lazy song, phone UI and hand bake | `fe8bb65` | `verify-v3`; a production build found a JSX-runtime bug, fixed in `96bb322` |
| 4 | Link previews and `og.jpg` | `f88d86e` | GPU frame rendered to 1200×630 |
| 5 | Compression, splats removed | `8a4f10d` | GLBs 9.5→4.7 MB, JPEGs 9.8→1.8 MB; suites pass |
| 6 | Deep links, Ctrl/⌘+K | `9d62b24` | `verify-deeplinks` 12/12 |
| 7 | GitHub activity on the monitor | `c5bd3e5` | visible in the seated frame |
| 8 | Live Mumbai sky, weather and rain; no snow | `9a21011` | `verify-after-hours` 26/26, night and rain frames |
| 9 | Fixes batch | `7fbfac2`, `ab638b6`, `4c28ced` | `verify-v3` 41/41 (was 39) |
| 10 | Guided tour | `19b108e` | `verify-tour` 9/9 |
| 11 | Docs cleanup | `f3aa32d`, `493c3a5` | not applicable |
| 12 | True-scale room | `a9689a8`, `71b6a64`, `d6cf2c9` | see below |
| 13 | Relight | in progress | not yet |
| 14 | Cutscenes | not started | not yet |

Test infrastructure: `fab933a`, `89395f4`, `c6f1b28`.

## Item 12, measured (`feat/true-scale-room` vs `feat/v3`)

- **Suites:** results match `feat/v3`.
  - Pass: `verify-v3` 41, `room-interactions` 34, `after-hours` 26, `os-apps` 20, `deeplinks` 12, `tour` 9.
  - Exit 0: `held-objects`, `reduced-hands`, `hand-support`.
  - `verify-phone-grip` fails its skin-clipping assertion on both branches.
- **Production preview:** `verify-v3` 41/41, no page errors.
- **Forward lean:** at rest it drops from 24.6 cm to 0. Holding the phone it drops from 24.3 cm to 9.6 cm.
- **GPU median, seated drag:**
  - Mid: 18.1 → 15.2 ms.
  - High: 26.1 → 18.9 ms. The high tier renders at pixel ratio 1.25, against 1.1 on `feat/v3`.
  - Triangles: 231k → 151k.
- **Lost or changed:**
  - The winter-city GLB is skipped, so wet streets do nothing.
  - The old lightmap bake is skipped. A true-scale bake is being built in item 13.
  - The high-tier sash reflection is gone.
  - `?hands=authored` was not rebaked.
  - The figure is squashed non-uniformly.
  - Opening the window now looks from the seat.
- **Test edits:**
  - `after-hours`, `phone-grip` and `measure-gpu` accept `skipped` for the city and the bake.
  - `room-interactions` projects the window diff region from the open view. On both branches, this check compares two different camera positions.

## Skipped or open

- **Dead `src/` directories:** deletion is approved, but the permission classifier blocked `rm -rf` and `git rm`. They are still present, and the app doesn't use them.
- **`verify-phone-grip`** skin clipping predates tonight's work and is not fixed.
- **`verify-focuslock-app`** times out on the friction step. It does the same at the baseline, and it is not fixed.
- **Launchpad appears ~5 s after load** on a production build. Not profiled.
- **New Poly Haven downloads** were skipped (no new downloads overnight). The four CC0 sets already in the repo are used.
