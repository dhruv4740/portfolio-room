# After Hours — approved execution specification

Approved 2026-09-20. This supersedes the floating-room/toy aesthetic in older
vision documents. Read AFTER-HOURS-HANDOFF.md for actual progress. A checked
functional test does not establish that an artistic target has been achieved.

## Intent and locked decisions

The owner wants every visible part upgraded toward the physical realism of
GTA V / Red Dead Redemption 2: architecture, furniture, props, hands, material
response, lighting, shadows, reflections, exterior, weather and movement.
These are artistic references, not a claim of equivalent production quality.
Build a small, authored playable scene that could belong in a larger game.

- Fictional snowy city at night, warm studio inside; not a claim about Mumbai.
- First-person arrival, about five seconds, immediately interruptible.
- No dialogue, narration, full-body character, or WASD walking.
- Maximum visual detail is preferred over 60 fps. Target stable 30 fps on the
  owner's AMD iGPU; project DOM interfaces retain their own responsiveness.
- Free licensed assets plus custom modeling. No purchases. Ask for a specific
  manual download only if a necessary asset cannot be fetched directly.
- Blender installed and verified: C:/Program Files/Blender Foundation/Blender 5.2/blender.exe
  (5.2.2 LTS). Keep editable production sources and reproducible export scripts.
- Desktop project interfaces remain real-source demos. Android reconstructions
  remain honestly labelled. Preserve the persistent OS and readable phone stage.
- WORK and project entry remain available throughout arrival/loading.

## Execution sequence

1. Save/commit this plan, continuation ledger, asset register and doc pointers.
2. Preserve baseline screenshots and fixed-path GPU measurements.
3. Establish authored asset, export and offline baking workflow.
4. Complete one convincing seated night hero frame: room, materials, light,
   window and exterior. Review without bloom or depth-of-field concealment.
5. Integrate an authored hand/forearm asset and verify every grip before replacing
   the current rig. Free suitable rig or custom Blender model; no placeholder swap.
6. Perfect coffee, then inspect every other visible interaction to that standard.
7. Add first-person arrival, restrained weather and spatial sound.
8. Verify visual evidence, interactions, performance and fallback; update handoff.

## Art specification

Keep functional desk/monitor/phone placement and WORKSPACE.screen contract.
Use consistent human scale, restrained bevels, real joins, credible thickness,
and material-specific wear. Upgrade desk/architecture/window/chair/lamp/cup/
keyboard/hands, not just one showcase prop. Avoid generic clutter; personal
artifacts must come from existing truthful project content.

Textures: 2K hero surfaces, 1K secondary, shared atlases outside; 4K only after
a close-up comparison demonstrates benefit. Record every imported asset and
license in ASSET-REGISTER.md. Commit local runtime files, no hotlinked assets.

Lighting: warm task lamp, cool exterior, restrained monitor spill. Bake static
indirect light/occlusion, with separable lamp on/off contribution. Preserve
static architectural shadows. Bounded separate dynamic contact shadows may
update during hand/prop motion on higher tiers. Use prefiltered environment
reflections; subtle planar glass reflection on high, static approximation below.
Opening the sash moves/removes its reflective surface. No full-scene ray
tracing, SSR or volumetric fog. Bloom only after base-image acceptance; no DOF
during interactive use. Night is authored; diagnostic day/dusk disable
incompatible night baking rather than presenting it as physically accurate.

Exterior has three depths: modeled sill/snow/near roofs and facade; varied
mid-distance modules with recesses, selected lit interiors and roof equipment;
detailed far skyline with atmospheric haze. No uniform glowing-window grids.
Snow particles stay outside, with static accumulation, sparse traffic lights
and restrained steam. Freeze weather for reduced motion; stop it behind the
OS/phone and on hidden tabs. Lower tiers preserve composition.

Hands: authored topology, wrist alignment, skin normal detail and believable
sleeves. Adapter preserves pose scalars, grip calculations and pen contacts.
Validate rest, typing, coffee, pen, phone and award before replacing the rig.
Coffee: reach/contact/fingers settle/lift/sip pause/lower/contact/release;
coordinate weight, restrained camera response, localized steam and sounds.
Never auto-play drinking in front of project access.

Arrival: doorway -> window/desk composition -> existing overview destination.
Once per session, replay available. Escape/Skip settle; navigation cancels and
goes directly to the requested destination. Reduced motion starts settled.
Silent until a user gesture; persistent mute. No forced loading spectacle.

## Architecture and budgets

Vanilla three.js stays. Introduce a small named-shot scene director with
cancel/completion semantics; Scan retains navigation ownership. Extract coffee
choreography first, not a wholesale rewrite. Asset manifest and quality profiles
control reflection/shadow/weather/texture cost. Asset failure retains a usable
scene and never blocks WORK. `/work` must not import 3D code.

Targets, not measurements: 30 fps; steady GPU p95 <30ms on current laptop;
initial room assets <=15MB transferred, optional enhancements <=15MB more.
Reduce expensive effects before resolution; do not silently drop below .8 DPR
to claim acceptance. Pause scene behind fullscreen surfaces/hidden tabs.
Measure fixed camera paths and settings; rAF cadence is not GPU cost.

## Delegation and continuation rules

**Superseded team policy (latest owner instruction):** use
[TEAM-COORDINATION.md](TEAM-COORDINATION.md). Codex owns 3D; external Claude
Opus owns bounded application logic; external Gemini 3.8 Flash replaces Luna
for workhorse tasks. Internal subagents are stopped. The paragraph below is
historical and must not be used to launch Luna/Sol agents.

Parent owns all 3D/art direction, lighting, materials, asset integration,
reflections, camera choreography and final review. Luna owns bounded support:
documentation/provenance/UI/verification. High or xhigh by default; max only
for a specifically difficult bounded task. Sol low/medium only if Luna cannot
resolve a concrete problem; at most one Sol. Maximum four active agents total
(parent + three). Never spawn more simply to fill capacity. Exclusive file
ownership; serialize browser/GPU runs. Do not ask owner to reapprove this work.

Replacement agents must read the plan and ledger before editing, continue the
recorded milestone, distinguish planned/implemented/verified, preserve user
files, record approximation and blockers, and never call placeholders finished.
Update ledger after logical units and before long tests/stopping. Commit locally
per unit, never main/master, no push/deploy. Preserve Fable's history unchanged.

## Acceptance

Fixed screenshots: arrival, overview, rest, window closed/open, cup, pen, phone,
award. Inspect scale/anatomy/contact/seams/materials/reflections/snow, not only
text assertions. Verify arrival interruption at start/middle/end, replay,
reduced motion, navigation while loading, repeated interactions, OS/phone state,
missing optional assets, software GPU fallback and hidden-tab suspension.
Run relevant existing core/studio/held-object/room/real-project suites once,
fix, then a targeted confirmation. Record every unrun suite. Track transfer
and GPU budgets independently. Visual and functional evidence must agree.

Deferred: open world, dialogue, facial animation, multiplayer, paid assets,
automatic project synchronization, native Android execution, ray tracing.
