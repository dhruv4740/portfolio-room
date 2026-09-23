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
| 13 | Relight (partial, see below) | `3814f48`, `7b4d1e4`, `0773c89`, `578f08c` | see below |
| 14 | Cutscenes (partial, see below) | `c104ab3`, `a6c63a5` | see below |

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

## Item 13, `feat/relight` (based on item 12)

**Landed:**
- **GI bake for the true-scale room** (`3814f48`): Blender 5.2 Cycles at 64 samples, lamp-off and lamp-on irradiance atlases, 533 KB.
  - Geometry and light positions come from `cinematicLayout.js`.
  - Orientation checked: the lamp peak on the floor atlas lands on the lamp side of the desk.
- **One texel density** across walls and floor (`7b4d1e4`): UVs in metres, with `feat/v3`'s tile sizes.
- **Dust in the lamp beam** (`0773c89`).
- **Lens vignette and film grain** (`578f08c`): a static CSS overlay with no WebGL cost, shown only in the room phase.

**Verified:**
- Suites match item 12.
  - `verify-tour` failed once on the CrisisWatch check, then passed 9/9 twice on rerun. It samples every 2 s, so it is flaky.
  - `verify-phone-grip` fails, as it does on both earlier branches.
- GPU median, seated drag, back-to-back runs at the same pixel ratio (1.25):
  - Mid: `feat/v3` 15.0 ms → relight 9.8 ms.
  - High: 14.1 → 9.1 ms.
  - Low: 13.3 → 7.5 ms.
  - Absolute numbers drift with the machine's state, so only back-to-back runs are compared.

**Tried and rejected:** AgX tone mapping. At matched exposure (2.4) the night room went flat and grey and lost the lamp pool. ACES stays; the frames are in `scripts/shots/agx-*` in the worktree.

**Skipped:**
- **Bloom:** it needs a composer and a multisampled render target on the iGPU. The room works without it.
- **Depth of field:** belongs to cutscenes (item 14).
- **Sound design:** I can't verify it by ear, so it is left as is. The rain layer from item 8 exists.
- **New Poly Haven materials:** no downloads overnight. The four existing CC0 sets are used.
- **Mumbai retune of the city GLB:** the true-scale room doesn't load that GLB.

## Item 14, `feat/cutscenes` (based on item 13)

The stack is `feat/true-scale-room` → `feat/relight` → `feat/cutscenes`, so this branch holds items 12–14 together.

**Landed: the cold open** (`c104ab3`, `a6c63a5`). It replaces the old 5 s arrival flight, whose start point was outside the true-scale room.
- The shot runs 7.2 s:
  - The camera comes in through the doorway with the lamp off.
  - The lamp clicks on at 1.7 s.
  - "DHRUV KOTHARI" types onto the monitor's title bar between 2.9 and 4.3 s.
  - The camera rises to the landing view.
- It plays once per visitor (localStorage), and SKIP still works. Replay and reduced motion land in the final state.
- A load stall now pauses the shot rather than skipping it (at most 50 ms of shot time per tick).
- The sky and weather stay live. Rain is not forced for the shot.

**Verified:**
- Dev suites: `verify-v3` 41/41 and `verify-after-hours` 26/26 (the arrival contract).
  - `room-interactions` 34, `deeplinks` 12, `tour` 9 and `os-apps` 20 pass.
  - `verify-v3` failed once with two transient 403 console errors, which did not reproduce, then passed 41/41.
- Cold-open frames were checked at each beat; the contact sheet is `scripts/shots/cold-sheet.png` in the worktree.
- Production build: the shot plays through, with no page errors.

**Test edit:** the `verify-after-hours` arrival helper also clears the new localStorage key.

**Skipped:**
- **The monsoon chai moment by the window:** not built.
- **Depth of field in cutscenes:** no post-processing pipeline exists for it.
- **Mocap and realistic rigged-hand research:**
  - The MetaHuman licence question can't be settled from here. It needs a deep-research pass (for example Gemini or ChatGPT deep research).
  - Hands stay as they are.
- **Pre-rendered Blender cutscene video:** not attempted.
- **Arrival audio:** browsers block it before a gesture, so the lamp click is visual only.

## First-load stall (profiled tonight; predates tonight's work)

- On this iGPU, first load blocks the main thread for 14–21 s after the room appears. `feat/v3` shows 21 s, so it is not from these branches.
- A CPU profile puts about 32 s in three.js `onFirstUse`, which waits synchronously on shader compile and link on ANGLE D3D11.
- The scene has 79 shader programs, lit by 5 lights of which 3 cast shadows. That is about 0.45 s per program.
- Tried and reverted: collapsing the environment and shadow variants. It made no difference.
- Likely fixes, both of which need a decision:
  - fewer shadow-casting lights (changes the look);
  - `KHR_parallel_shader_compile` via `compileAsync`, holding the room behind the load bar until it finishes (longer bar, responsive page).
- A real browser caches compiled programs, so repeat visits should be much faster. This was not measured.
- While the stall lasts, the cold open holds its first frame.

## Skipped or open

- **Dead `src/` directories:** deletion is approved, but the permission classifier blocked `rm -rf` and `git rm`. They are still present, and the app doesn't use them.
- **`verify-phone-grip`** skin clipping predates tonight's work and is not fixed.
- **`verify-focuslock-app`** times out on the friction step. It does the same at the baseline, and it is not fixed.
- **Launchpad delay:** profiled; see "First-load stall" above.
- **New Poly Haven downloads** were skipped (no new downloads overnight). The four CC0 sets already in the repo are used.
