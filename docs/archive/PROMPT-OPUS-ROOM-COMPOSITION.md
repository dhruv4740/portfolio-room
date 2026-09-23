# Opus: room scale and window composition, parallel with Codex hands

Owner approved this split. Read HANDOFF, STATUS-FOR-CODEX-2026-09-20,
ROOM-SCALE-PROPOSAL and TEAM-COORDINATION. This supersedes your prior queue:
freeze new prop integrations. Deliver one convincing night-room composition.

Codex is actively repairing hand/body/keyboard contact. To avoid coordinate
races, prepare the replacement room in NEW files, not the live builder:
`src/v3/desktop/buildCinematicWorkspace.js`, `cinematicLayout.js`, and optional
helpers prefixed `cinematic*`. You may copy the current builder as a temporary
migration candidate, preserving its return API. Do not switch live imports.
Only new art sources/exported candidates under `art/cinematic-room/` and
`public/models/cinematic-room/`; do not overwrite current city/bake assets.
Report in `docs/reviews/OPUS-ROOM-COMPOSITION.md`. No Git writes while Codex
is checkpointing. No internal agents; Gemini may do bounded offline support.

## Shared physical contract (metres, Y up)

- Desk 1.80 x .80, center X=0 Z=-.05, top Y=.740, thickness .035.
- Mat around .75 x .40, top Y=.749. Keyboard centered X=0 Z=.17,
  home-row key top Y=.785, about .44 m overall width. Preserve real key layout,
  instance IDs and per-row top offsets; expose positions in cinematicLayout.
- Seated camera position [.05,1.23,.83]; look toward monitor center initially.
- Torso shoulder midpoint [.05,1.10,.82], seat top about .45.
- Monitor visible display .66 x .37125 (16:9), center [0,1.085,-.30].
  Enclosure/stand proportionate; WORKSPACE.screen and clickable screen same.
- Phone/mouse/lamp remain their actual sizes. Move to fit. Other large props
  fit credible sizes; no new props. Window to right of monitor must be visible
  from the fixed seated camera. Ceiling around2.6 m.

Export these as named values, plus object rests and camera targets. Do not
scale the root blindly. Codex will adapt live hand/action coordinates to this
contract once your environment candidate is accepted. You may flag a concrete
fit problem and propose revised values in the report; don't silently diverge.

## Art job

The current scene reads as a giant monitor in front of blinds and a brick wall.
Compose room depth: warm working area, cool window reveal, dark quiet edges.
Window needs foreground sill/snow, a middle-distance building and far city
lights visible through a useful opening. Reposition the near exterior block
if it occludes the view; more random luminous rectangles is not a solution.
Use existing licensed assets and modelled city; keep a restrained window
reflection, no opaque mirror pane or thick prison-bar framing. Inspect blind
spacing/profile rather than just deleting useful controls.

Make joins, desk legs, lamp clamp, sill and ceiling physically coherent.
Keep the UI launchpad and WORK access, OS persistence and existing features.
Avoid adding effects. Fix image composition before rebaking; clearly label
an old bake reused for preview as temporary. No GTA/RDR-equivalence claims.

## Parallel execution / acceptance

Codex owns the build/browser/GPU slot initially. You can implement and inspect
offline while it works. Do not build or render until TEAM says RELEASED or
Codex explicitly transfers the slot. Prepare a standalone review entry/harness
under `scripts/` with a unique `review-cinematic-room` prefix if useful; do not
modify Vite config or current app routes. When given the slot, render a fixed
seated night view and overview, inspect them and report actual defects. Hands
may be hidden in this environment-only study; say so, not final scene acceptance.

No edits to WorkspaceStage, seatedHands, handSurface, handAssets, handAppearance,
build-authored-hands, buildSeatedFigure, current keyboard helpers or live assets.
Preserve source licences. Leave Gemini's hand edits to Codex. Deliver usable
code + comparison frames + precise integration mapping, not another proposal.
