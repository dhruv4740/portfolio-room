# Cinematic studio — implementation notes

The next approved upgrade is specified in AFTER-HOURS-PLAN.md; current
execution state lives in AFTER-HOURS-HANDOFF.md. The description below records
the working baseline, not completion of the new realism target. Production
assets will use Blender sources, reproducible exports and ASSET-REGISTER.md.

The room is a launchpad for the work. Visitors can open desktop projects,
mobile projects, or explore the desk immediately. WORK remains the short path
to project facts and contact information; capability fallback still avoids
loading three.js on `/work`.

## Presentation

- Interior night overview, with the computer and phone as primary destinations.
- Coherent wall geometry with a real window aperture and a recessed doorway.
- City layers and nearby buildings at different world depths, so camera motion
  produces parallax rather than sliding a flat texture.
- Opening the window raises the blinds and moves the camera closer. City audio
  starts only through the visitor's action. Back returns to the seat.
- Room controls are secondary, exposed through Objects. Telemetry appears only
  under `?debug=1` or the test flag.
- Computer projects launch with one click or keyboard activation. Tools form a
  separate group. A readable catalog replaces the corrupted-text quest log;
  its descriptions come from the shared content and demo buttons open the
  actual project builds. The same iframe survives leaving and returning.

## Phone

The physical pickup leads to an upright HTML portrait stage. Its preferred
viewport is 390 × 844 **CSS pixels**, with responsive height for shorter
screens. These are layout units, not the physical pixels in a phone panel.
The UI is laid out at readable size rather than shrinking a 540-pixel desktop
surface into the held model. The 3D render loop pauses while the stage is open.

Android projects remain browser reconstructions, as approved by the owner.
They should preserve original layout, copy, colors and important interactions;
they do not run Android services, device permissions or native databases.
Their demo state persists across visits within the room session.

## Hands

`seatedHands.js` retains joint poses and the two-bone elbow solve. The skin is
now one continuous mesh per hand, blended through the palm, finger webbing and
wrist. Clothing is a second mesh per arm. This reduces the hand assemblies to
four skinned draws. Smooth normals come from the surface gradient.

`node scripts/build-hand-assets.mjs` regenerates local binary geometry after
changes to topology or the neutral binding pose. Commit both files in
`public/models/`; browsers with DecompressionStream load the gzip variant.
Generation is a fallback, not normal main-thread startup work.

Static shadow-map updates remain intentional. The hands receive shadows but
do not cast dynamic shadows. Removing two weak point lights reduces fragment
lighting work; actual device cost must be measured with GPU timer queries.
`scripts/measure-gpu.mjs` can pin pixel ratio during sweeps so the adaptive
governor cannot silently change the comparison.

## Updating project demos

Desktop demos use copied project source and local mock backends. See each
`apps/<name>/PORTFOLIO.md` for provenance and changed files. Original project
repositories are never edited by the portfolio build.

Changes in those repositories **do not automatically update the portfolio**.
Refresh the relevant copied source, preserve its documented mock seams, run
`node scripts/build-apps.mjs <name>`, verify the real UI, and commit the source
copy together with `public/apps/<name>/`. The normal portfolio build consumes
the committed output and does not need each project's toolchain.

Automatic refresh and native Android execution are future work. Any screenshot
or source change in an Android app also needs a deliberate reconstruction
update and a side-by-side check against its original UI.

## Verification boundaries

Use the current entry in HANDOFF for actual results. Browser acceptance checks
do not establish visual quality, Android parity, or performance on other GPUs.
Real-GPU screenshots cover appearance; GPU timer queries cover render cost.

## Next visual review

Review the entry composition and phone stage in the owner's browser first.
The remaining hand limitation is pose/contact realism: the cup and award
wrists still bend substantially, and the procedural shape remains stylized.
A further anatomy pass should use close-up contact references, not just
passing intersection or angle checks. Android parity likewise needs a
side-by-side review against current original-app screenshots. Automatic demo
refresh is separate future work; no synchronization job is installed.
