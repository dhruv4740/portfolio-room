# Proposed direction — a room you can enter, a machine you can use

2026-09-12. Recommendation after reading all 16 repository Markdown files,
inspecting the v3 source and dhruvOS entry points, and reviewing saved v3
screenshots/results. This is a proposed build plan, not an approved redesign or
a report of newly tested behavior. No application code changed during this pass.

## Creative decision

Build one continuous experience: a captured workspace → enter its screen → use
a curated version of dhruvOS → return to the same workspace.

The memorable part should be continuity. Something that looks like a photograph
becomes spatial; a screen within it becomes usable software; changes you make
inside remain visible when you leave. That gives the spectacle a consequence.

A downloaded room, particle explosion and retro desktop can each feel familiar.
Combining them does not automatically create originality. The authored work is
the composition, the handoff between media, and the specific things the machine
lets a visitor do. Keep the current no-person and downloaded-capture direction.

## The first visit

Times below are choreography targets after assets are ready, not measured load
times. Interaction controls when the sequence starts.

| Beat | What the visitor experiences | What makes it convincing |
|---|---|---|
| Arrive | A tightly cropped desk or workstation, surrounded by quiet negative space. Name, WORK, one clear screen target. | A deliberate camera composition; no wall of floating labels or mandatory boot theater. |
| Discover | A small orbit reveals real depth. Hover/focus wakes the screen with a preview of the destination. | The preview and destination share the same composition. No promise of live DOM inside a WebGL texture. |
| Enter | A click aligns the camera with the screen; the nearby scan briefly separates into its splats as the camera accelerates. | Deformation pulls toward the screen, preserving a readable destination. Avoid an unrelated star tunnel. Target roughly 1.5–2 seconds total, built from existing motion beats. |
| Arrive inside | The screen edges pass beyond the viewport and the same layout becomes interactive HTML. | No white flash, second loading screen, Reality Tear intro, or BIOS boot. |
| Do something | One excellent experiment is already open; Selected Work and Contact are immediately available. | The visitor can make a meaningful change within one action. |
| Leave | A visible Back to room control restores the camera. The screen retains the last experiment's preview/state. | It feels like leaving a running machine rather than dismissing a modal. |

Reduced motion uses a direct handoff. Keyboard activation follows the same flow.
Sound is optional and off by default; the sequence must work silently.

## Which interior to build

Reuse dhruvOS's working shell and app lifecycle. Curate its first view to three
destinations: Selected Work, Experiments, Contact. Keep a terminal as an optional
discovery, not a required navigation mechanism. Existing apps can live in an
archive; eleven desktop icons do not all deserve first-view prominence.

For the integrated experience, use v3's bone/charcoal/orange palette and readable
type. The standalone OS can retain its historical presentation. Remove fake
hardware readouts, obligatory text decoding, and exploration-percentage rewards
from the integrated flow. Technical instrument styling works only if its data
means something.

Select the initial experiment by trying the actual candidates for directness,
visual quality, stability and personal relevance. Do not assume the most
complicated shader is the best. A visitor should understand what to do without
reading a manual, then see the effect of doing it.

## Ideas worth pursuing

| Idea | Concrete interaction | Priority / risk |
|---|---|---|
| The machine remembers | Change a parameter or wallpaper inside; return outside and see the updated screen. Re-enter with state intact. | First extension after the entrance. A state-driven thumbnail is enough; continuous DOM capture is unnecessary. |
| Inspect the photograph | A visible Inspect control temporarily reveals splat centers or ellipsoids, then restores the capture. | Strong secondary interaction; rendering approach still needs a prototype. A scan has no inherent mesh wireframe. |
| Open the experiment's workings | Pause an experiment, change one real parameter, inspect a short explanation or relevant source link, reset it. | High value: makes authorship legible through a working interaction. Explanations must match the actual implementation. |
| A notebook of failures | A secondary room anchor opens a real before/after capture and the engineering decision behind it. | Low rendering risk, requires authentic material. The empty-space camera failure is already documented. |
| One recursive window | An optional OS app briefly shows the room containing the computer you are using. | Later easter egg. Cap nesting and render work; do not build an infinite engine. |
| A session postcard | Export a still of the visitor's chosen experiment parameters with a small credit line. | Later, only after export behavior and asset permissions are verified. |

Ship the entrance and one meaningful experiment first. Add memory next. The
remaining ideas are alternatives to evaluate, not a cumulative feature list.

Do not lead with particles spelling the name, a chrome blob, arbitrary glitch
text, a fake terminal loader, or portals for every object. An orange palette can
be just as generic as purple gradients if the interactions have no purpose.

## Findings that change the existing roadmap

1. **Native splats shipped, but migration is not a package swap.** The official
   [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186) includes
   the renderer. Its [tagged source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/GaussianSplat.js)
   explicitly requires WebGPURenderer, including its WebGL backend, and excludes
   the legacy WebGLRenderer used here. Deformation hooks, sorting under animated
   positions, supported capture formats, browser coverage and total delivered
   bytes need comparison. Removing Spark does not establish a net 1.81MB saving.
2. **The sub-millisecond claim is not GPU frame time.** SplatStage times
   rig.update plus renderer.render with performance.now; marker updates are
   outside that interval. Telemetry computes 1000 divided by that value.
   This is CPU work/submission timing, not actual FPS or completed GPU duration.
   The saved screenshot's 1250 FPS must not justify performance headroom.
3. **dhruvOS is already on disk.** os/ and public/os/ exist; v3 content already
   links to /os/. Its entry point runs tear → BIOS → desktop, and its registry
   imports eleven apps. It needs integration and curation, not history recovery.
4. **There are multiple content sources today.** v3 shares one source across its
   three surfaces, but the OS has a separate content module. Integrating it
   unchanged would reintroduce content drift. Pick os/ as the editable source
   and make its public copy reproducible during integration.
5. **The old harness is a baseline, not a release certificate.** Saved results
   say 16/16, but the dialog check counts mounted dialogs, including the hidden
   lab dialog. Strengthen visibility and interaction checks before relying on
   them for the new sequence. No tests were rerun for this planning pass.
6. **Some old statements are too absolute.** Particle dispersal is possible
   with mesh-derived particles too; splats make it visually coherent here,
   not exclusive. Capture licensing needs source-specific evidence, not a
   mandatory external deep-research handoff. Optional social links need not
   block a creative launch; credible featured work and asset permissions do.

## Build order and acceptance gates

### 1. Establish honest measurements and a renderer decision

First correct the distinction between CPU submission time, requestAnimationFrame
cadence and GPU duration. Use GPU timers only where supported; show unavailable
otherwise. Record browser, hardware, viewport, DPR, capture bytes/count, cold
load, first visible scan, and p50/p95 frame intervals while orbiting and entering.

Time-box the native comparison to one focused engineering day. Use the same
capture, camera path and resolution in isolated Spark/native prototypes. Test
an actual animated deformation, its sorting, bounds and screen-plane composition.
Measure the production dependency graph rather than comparing package sizes.

Gate: select native only if the required effect and browser paths work through
maintainable APIs with a worthwhile measured benefit. If that is unresolved at
the time-box, continue with Spark. Renderer migration must not become the project.

### 2. Prove the entrance before polishing a room

Build a minimal screen plane and a representative scan; the existing placeholder
is sufficient for a private deformation test. Establish normalized screen corners
or center/orientation/size relative to capture bounds. A point anchor alone does
not determine a screen's plane or the perspective-matched HTML handoff.

Implement explicit states: room → preparing → entering → inside → leaving.
Disable competing camera input during entry, keep a visible exit, handle Back,
Escape, repeated clicks, reduced motion and failed destination loads. Prepare
the destination before committing to the flight; return to the room on failure.

Gate: one repeatable camera-to-HTML handoff, one working app, and a reliable
return. No second intro and no visible geometry jump. If full-room deformation
looks noisy or runs poorly, restrict it near the screen. If still poor, retain
the continuous camera/screen handoff without the particle effect.

### 3. Source and art-direct the final capture

Shortlist up to three source assets. Record creator, original URL, exact licence
and attribution requirements, permission for website redistribution and editing,
capture format, transfer size, and views along the intended camera path. A
download button or credit line is not permission by itself. Resolve uncertainty
with the creator if needed; no messages sent without user authorization.

Prefer a distinctive desk fragment with readable foreground/midground separation,
usable approach angles and space for a screen. A large luxurious room can create
more visual noise and more downloads without improving the experience.

A captured laptop is preferable, but not mandatory: evaluate inserting a simple
authored monitor into a suitable licensed scan. Check depth/occlusion, contact
with the desk and the baked lighting. Reject visibly pasted-on results. This
fallback widens sourcing without reversing the downloaded-room direction.

Gate: approved redistribution terms, a compelling establishing still and close-up,
no distracting holes along the flight. Aim below 15MB as an asset target; then
measure the resulting wait. Sourcing can overlap prototype work.

### 4. Integrate the curated OS and real work

Add an explicit embedded entry that bypasses tear/boot and accepts v3 content.
Keep standalone ES modules; use a narrow, validated parent/iframe handshake for
ready, enter, leave and preview state. Validate message origin and source.
Choose a reproducible copy/content export process instead of hand-editing both
OS trees. Load only needed apps and pause hidden animation/audio loops, including
the room while fully inside. Preserve camera and app state for return.

Gate: one source of project facts, immediate usable destination, consistent
appearance, no accumulating render loops after repeated visits. Three featured
projects should each have a real image/demo, a concise claim, usable evidence
and a true technical decision. Ask Dhruv only for facts not recoverable from
existing work; do not invent outcomes or personal history.

### 5. Give mobile its own convincing proof

Retain the deck/static capability split. Introduce a lightweight still or short
user-played recording of the same entrance, then a touch-friendly experiment and
project evidence. Do not make gyro permission necessary to understand the site.
Check actual touch hardware, readable controls, denied permissions and reduced
motion. Keep WORK available throughout, using the current HashRouter URLs.

Gate: the experience makes sense without a desktop GPU; the static route still
requests no three, Spark or capture. A phone visitor can try something and reach
contact without waiting for a desktop simulation.

### 6. Finish and verify

Run npm run build and the documented Chromium/preview/verify-v3 prerequisites.
Extend behavioral checks for visible entry/exit, focus restoration, iframe
keyboard handling, repeated entry, destination failure, and direct links. Inspect
motion on real hardware; screenshot coverage alone cannot judge choreography.

Provisional performance target: smooth 60Hz presentation on the chosen reference
laptop, with p95 frame intervals around 20ms or better at the stated settings.
Agree the actual device before claiming success. Degrade DPR/effect density when
needed; do not infer performance from software-rendered headless results.

Generate an OG image from the final scene and a clean recording of the working
sequence. Keep project-specific sharing URLs meaningful despite HashRouter's
fragment limitations. Only then consider dead-code cleanup as a separate change.

Ask five first-time viewers to enter, use something and leave without coaching.
Target four finding the screen within five seconds of the room becoming ready,
and being able to name something Dhruv built after their visit. These are planned
observations, not validated results. If the transition is memorable but the work
is forgotten, improve the arrival content before adding more effects.

## Immediate next unit

Measurement correction plus a bounded Spark/native entrance prototype. Deliver
a short recording, measured comparison and a renderer recommendation. Do not
rebuild the full portfolio or add all candidate ideas before that gate passes.

Deferred: final capture selection/licence verification, prototype implementation,
real-device measurements, personal project facts, mobile redesign, and publishing.
