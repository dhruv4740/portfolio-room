# Handoff

The single source of truth for status, open problems and what to do next.
Operational rules (commands, invariants, traps) are in [AGENTS.md](../AGENTS.md).
Last updated 2026-09-23.

## Working mode

The owner, Dhruv, is present and available. Work interactively:
- Ask when a choice changes the look or the feel.
- Show frames and short clips as you go.
- Don't batch up a night's worth of changes. The overnight autonomous run of 2026-09-23 was a one-off.

## What the site is

A personal portfolio. Its first job is to impress other builders; its second is to get an internship screener to the facts fast. `/work` is the static recruiter page and must never break.

The desktop surface is a first-person 3D room at a desk in Mumbai:
- The sky follows IST, and the weather comes live from Open-Meteo (rain, never snow).
- The monitor opens dhruvOS, which runs the real web projects.
- The phone runs the Android apps.
- Every object on the desk can be picked up or used.

The target is a room that feels like GTA V or RDR2. It hasn't got there yet.

## Branches

Nothing is merged to main.

| Branch | Contains |
|---|---|
| `feat/v3` | Launchpad, loading, deep links, live data, fixes |
| `feat/true-scale-room` | + the true-scale room |
| `feat/relight` | + baked lighting, dust, vignette and grain |
| `feat/cutscenes` | + the cold open. **This is the latest; work from here.** |

The worktree for the stacked branches is `C:\Users\hp\pf-truescale`. Its dev server is the `truescale` launch config (port 4175) and its production preview is `truescale-preview` (4176). The main checkout serves `feat/v3` on 4173.

## What exists (all on `feat/cutscenes`)

- **Launchpad:** six options (keys 1–6): projects, phone apps, explore, recruiter `/work`, About, a 60-second guided tour. Contact and GitHub are pinned top-right.
- **Navigation:** deep links `/#/os/<app>`, `/#/phone[/<app>]`, `/#/about`, `/#/contact`, `/#/room/<object>`, and a Ctrl/⌘+K palette.
- **Loading:** a real progress bar. Song, phone UI and phone apps load lazily.
- **Payload:** meshopt city, WebP GLB textures, re-encoded JPEGs.
- **Live data:** GitHub activity on the monitor; Mumbai sky, weather, rain and a corner readout.
- **Link previews:** `public/og.jpg`.
- **True-scale room** (`cinematicLayout.js`, `buildCinematicWorkspace.js`):
  - Desk at 0.74 m, and the hand rig rebuilt around a real seat.
  - Forward lean at rest went from 24.6 cm to 0.
- **Baked lighting** for this room (`scripts/blender/bake_true_scale_room.py`), plus dust in the lamp beam and a CSS vignette and grain.
- **Cold open:** 7.2 s. The camera comes in through the doorway, the lamp clicks on, and the name types onto the monitor. It plays once per visitor and SKIP works.

Verification results and commit hashes for all of this are in the git log and in `docs/archive/MORNING-REPORT-2026-09-23.md`.

## Open problems

The owner reported most of these after using the site. A problem marked **likely** has a suspected cause that hasn't been confirmed.

### Performance

1. **First load is very slow.** Measured: the main thread blocks for 14–21 s after the room appears, and `feat/v3` behaves the same.
   - A CPU profile puts about 32 s in three.js `onFirstUse`, which waits on shader compile and link on ANGLE D3D11.
   - There are 79 shader programs, lit by 5 lights of which 3 cast shadows. That's about 0.45 s per program.
   - Collapsing the environment and shadow variants made no difference.
   - Options for the owner to choose between:
     - fewer shadow-casting lights, or a cheaper shadow type;
     - fewer distinct materials;
     - compile in the background (`compileAsync` with `KHR_parallel_shader_compile`) behind the load bar.
2. **The projects lag during the walkthrough, and entering or leaving the monitor lags.** Not measured yet. Likely causes: the 3D loop keeps rendering behind the dhruvOS iframe, the load stall, or both. Measure with `scripts/measure-gpu.mjs` and a CPU profile before changing anything.
3. **Opening the window seems to freeze the site.** Not reproduced yet. Likely causes: a shader recompile when the window light turns on, or starting the city audio. Profile the click.

### Interactions

These were broken or made worse by the true-scale port. Its hand and camera constants were moved by one uniform seat offset, and its reach leans were halved; none of them was re-tuned while watching the motion.

4. **Résumé:**
   - The pick-up and put-down motion looks wrong.
   - The page can't be read. Likely causes: `PAGE_HELD` was remapped by the seat delta, the prop scale is 0.625, and `resume-page.jpg` was re-encoded at 1700 px wide.
5. **Drawer:** the hand passes into the drawer when opening and closing it. Its grip offsets were authored for the old drawer size.
6. **Phone speed:** picking up the phone is far too fast, while putting it down runs at normal speed. The pick-up timeline runs at `timeScale(phoneVisited ? 3.2 : 1.55)` in `WorkspaceStage.jsx`.
7. **Phone gap:** when the phone is put down, there is a gap between the hand and the phone.
8. **Mobile demo:** the phone-apps demo has no walkthrough text. Only the guided tour has captions.

### Test suite

- `verify-phone-grip` fails its skin-clipping assertion. This predates 2026-09-23.
- `verify-focuslock-app` times out on the friction step. This also predates it.
- `verify-tour` fails its CrisisWatch sample in about 1 run in 3 on `feat/relight` and `feat/cutscenes`. Cause unknown.
- The suites check state, not feel. A green run proves nothing about how an interaction looks or how fast it is. Every interaction change needs a screen recording or a frame sequence, reviewed by eye.

## Not built yet (approved, lower priority than the problems above)

- Monsoon chai moment by the window (second cutscene).
- Depth of field in cutscenes; bloom (too costly on the iGPU so far).
- Sound design beyond the rain layer.
- Mocap or realistic rigged hands. Whether the MetaHuman licence allows use outside Unreal is unverified; ask the owner to run a deep-research pass.
- Bake source for `?hands=authored` in the true-scale room.
- Dead v1/v2 directories under `src/`. Deletion is approved; the agent's permission settings blocked it.

## Owner decisions on record

- **Monitor and phone:** each project runs as its real UI, built from its own repo with simulated data. Phone apps run on the phone, web apps on the monitor.
- **Room:** bare walls, awards on the desk. The notebook is a blank page you draw on.
- **Project order:** all projects shown, ranked by depth. FocusLock, Expense Tracker and Basket Price lead.
- **Copy rules:**
  - Basket Price is framed neutrally: no scraping or terms-of-service talk.
  - CrisisWatch is framed around its fixed-model constraint, never as a poor design.
- **Never fabricate** links, metrics or evidence.
- **Parked:** a per-project case-study page (undecided).
- **Scoped out:** AI chat (needs a paid key), multiplayer presence.
- **Still open:**
  - a downloadable résumé PDF (`public/resume.pdf` + `contact.resume`);
  - a deploy host and domain (`og:image` is relative until then).

## Reference docs

- [DESIGN.md](DESIGN.md): the UI design system and scene art rules.
- [ASSET-REGISTER.md](ASSET-REGISTER.md): licences and provenance for every asset.
- [PROJECT-MATERIAL.md](PROJECT-MATERIAL.md): verified facts about each project, for copy.
- `docs/archive/`: superseded plans, reviews and prompts. Historical only; don't follow them.
