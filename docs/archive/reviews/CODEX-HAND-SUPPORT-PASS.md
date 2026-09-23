# Hand/body/contact correction — 2026-09-20

Owner authorized Codex to repair the hardest hand issues while Opus implements
the environment candidate described in PROMPT-OPUS-ROOM-COMPOSITION.md.
That prompt supplies the shared physical layout contract. No internal agents.

## Changes

- Reviewed and retained Gemini's BAMEN bare-arm source/retarget, rather than
  reverting to the obsolete gloved candidate. Keeping the authored path as
  default is now deliberate for continued correction, not final art acceptance.
  `?hands=procedural` remains available. Added actual BAMEN public credit.
- Shared torso translation fits both arm reaches. Previously each arm solved
  from a virtual shifted shoulder but drew the sleeve from the original one,
  stretching upper arms. Torso upper vertices, shoulders and neckline now
  follow the same lean; hips/legs stay planted. This is a positional solver,
  not a new physically simulated or authored cutscene animation.
- Forearm retarget now uses the source forearm axis instead of the palm axis.
  Restored fitted long sleeves and elbow covers; skin is clipped 65mm above
  the wrist. A short rolled-cuff experiment was rejected after GPU review.
  Rest overlap improved, but the coffee pose still exposes a wrist/sleeve seam.
- Indexed the authored skin with UV/weight seams preserved. Raw binary reduced
  from Gemini's 5,911,024 to 1,212,096 bytes; gzip625,368 instead of1.35MB.
  It contains 13,455 skin triangles per side after clipping. Both procedural
  binaries regenerated because the neutral arm solve changed.
- Actual skinned surface vertices now determine keyboard clearance. Rest index
  fingers align to actual F/J cap positions; full-size keyboards are asymmetric
  because their navigation block sits on the right. Rest poses/returns share
  calibrated coordinates. Cap replacement triggers a one-time recalibration.
- Typing selects nearest finger, solves bounded rotation against actual cap
  surfaces and uses 3mm travel instead of9mm. Repeated typing on one hand
  replaces the prior tween. No continuous per-frame contact sampling at idle.
- Authored skin roughness has a .58 minimum to curb wax-like highlights.
- Arm bounds now inspect visible sleeve components rather than aliasing the
  entire skin mesh. Hand bounds still cover the skin asset including forearm;
  do not mislabel that as a palm-only anatomical bounding box.

## Evidence

Production build passes. verify-hand-assets confirms regenerated raw/gzip
procedural geometry and valid finite skinning for11 presets. Final real-GPU
verify-hand-support passes: rest clearance4.948mm, sampled F clearance1.116mm,
sampled J clearance0.449mm, distinct arm/skin bounds and upper-arm lengths32cm
in both rest and coffee. All8 reduced-motion actions pass. Rest and coffee
screenshots were inspected; the coffee wrist/sleeve seam remains unaccepted.
Evidence: scripts/shots/hand-support.json and hand-support-{night,coffee}.png.

## Limits

This does not fix the oversized room/window or deliver a final cinematic
sequence. Opus owns the isolated replacement environment. The BAMEN mesh is
still retargeted to existing controls; native anatomical proportions and every
grip have not been newly approved. Bisection samples vertices and conservative
key boxes, not continuous triangle collisions. Typing is not a complete
touch-typing animation: distant keys may animate without a lateral hand reach.
Skin normal map remains1.52MB; texture compression is deferred. No new overall
GPU performance claim or full app regression. Old Blender reference snapshots
predate this solver change; regenerate before using them for exact authoring.
