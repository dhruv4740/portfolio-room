# Opus: prepare an authored articulated desk lamp

**CLOSED:** delivered and integrated as recorded in REALISM-ASSET-CHECKPOINT.md.
New authority and task: PROMPT-OPUS-MULTIPASS.md. Restrictions below describe
the completed preparation task, not the current integration scope.

Read AGENTS.md, docs/HANDOFF.md and docs/TEAM-COORDINATION.md. The speaker task
is closed. This new task is isolated asset preparation, not live integration.

## Ownership and safety

Write only `art/vendor/polyhaven/desk_lamp_arm_01/` and
`docs/reviews/OPUS-LAMP-ASSET.md`. Read other files for context. No src/, public/,
existing Blender files, Git writes, dependencies, builds, browser tests or
render jobs. No subagents. Codex owns the room composition, lighting,
interaction transforms and final visual acceptance. Offline Blender import,
inspection and export are allowed; do not compete for the GPU.

Blender: `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`.

## Source

Poly Haven Desk Lamp Arm 01:
https://polyhaven.com/a/desk_lamp_arm_01
API: https://api.polyhaven.com/files/desk_lamp_arm_01
The fetched manifest already exists at
`art/after-hours/lamp-download-manifest.json` (read-only).
Page reports CC0, approximately 0.9 m tall, 26k triangles; Kuutti Siitonen
modeling/texturing and Yann Kervran rigging. Verify against actual files.

Download the official native Blender source and required texture dependencies
at an appropriate resolution (1K or 2K; no 8K textures), preserving originals.
The glTF 1K manifest is also available if useful. Follow manifest URLs rather
than guessing names. Its shared .bin path contains /8k/ but is geometry,
not an instruction to download 8K maps. Verify manifest MD5 and record SHA-256.
Keep source/license/creator URLs and asset attribution alongside files.

## Preparation

Inspect source in Blender without rendering. Report actual dimensions, units,
triangle/material/draw estimates, UV sets, texture dependencies, hierarchy,
rig/constraints and orientation. Identify the clamp, arm joints, lamp head,
bulb/emitter and light exit direction. This is a clamp lamp; do not add a fake
pedestal or remodel it into the current procedural lamp.

Prepare a separate editable .blend and candidate .glb under your owned folder.
Keep originals untouched. Export at physical meter scale, Y-up glTF, root at
the center of the clamp's desk contact, documenting exact local axes and the
desk thickness it accommodates. Preserve meaningful object names and separate
head/arm/clamp transforms where source allows; do not bake all geometry into
one mesh. Do not export cameras or lights. Preserve correct color-space/PBR
map assignments and embedded textures; avoid gratuitous material changes.
If Blender constraints do not survive glTF, record this and supply a sane
static pose, not an invented claim that the rig works in three.js.

Target an ordinary desk working pose with the head aimed down at a work area;
Codex will choose final placement. Favor 1K runtime textures, at most 2K where
close-up detail needs it, ideally under 4 MiB GLB. Treat budget as a target,
not permission to damage geometry. Report actual size and any tradeoff.

Inspect the exported file by reimporting or using glTF inspection. Confirm
finite bounds, sane scale, material/texture presence and no missing dependencies.
Do not claim visual acceptance without rendered evidence. Explain integration
requirements, especially clamp placement, light origin/direction and disposal.

Finish docs/reviews/OPUS-LAMP-ASSET.md with READY FOR CODEX REVIEW, exact output
paths, verification performed, limitations and changed-file list. No runtime
imports or public asset copies. If downloads are blocked, report the precise
official link needed from the user rather than fabricating a substitute.
