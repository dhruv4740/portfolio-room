# Active team contract — Opus leads the next multi-pass run

Owner explicitly authorized Opus + Gemini to work together on 2026-09-20.
Opus may prompt and coordinate Gemini. Codex is preserving usage for the hardest
3D/anatomy decisions and will review after several passes. No internal agents.

Read OPUS-GEMINI-CONTINUATION.md and REALISM-ASSET-CHECKPOINT.md. They supersede
old prompt scopes and ownership restrictions. Previous contract is archived at
reviews/TEAM-CONTRACT-PRE-OPUS-LEAD.md, not an active instruction set.

## Current ownership

| Owner | Authority / exclusive writes |
|---|---|
| Opus | Integration lead; relevant live scene code outside reserved hands, asset integration/export, main docs; sole local Git writer |
| Gemini | Initially docs/reviews/GEMINI-ASSET-AUDIT-V2.md and metadata under art/candidates; further bounded files/tasks assigned explicitly by Opus |
| Codex | Reserved hand anatomy/retarget files below; paused after checkpoint, no concurrent runtime edits |

Reserved for Codex: seatedHands.js, handSurface.js, handAppearance.js,
handAssets.js, scripts/build-authored-hands.mjs,
scripts/blender/extract_authored_hands.py. Opus may inspect them and report
defects. Keep `?hands=authored` opt-in. Never promote gloves as bare hands.

Opus may edit buildWorkspace.js, WorkspaceStage.jsx, buildRoomInteractions.js,
afterHours.js, authoredTaskLamp.js and other necessary scene integration files,
while preserving the hand pose API, current phone grip fix and screen contract.
Assign Gemini new paths in a named prompt and record them here before overlap.

## Build / browser / GPU slot

**OWNER: OPUS — available after Codex checkpoint handoff.**
Codex has released the slot. This records permission, not evidence Opus started.
Gemini begins with offline research/provenance. Opus can transfer the slot for
verification, recording commit/dirty state/build timestamp and freezing runtime
and public assets. Recipient explicitly writes RELEASED on completion.
One operator: no competing browser timings, Blender renders or builds.
CPU preparation in separately owned asset folders may run in parallel.

## Git and files

Shared working tree: feat/v3. Opus alone commits local logical checkpoints.
No main/master commits, push, deployment, mass formatting or dependency churn.
Never stash/reset/clean others' work. Do not delete source downloads to save
space or blindly stage the repository. Gemini reports exact files, no commits.

Leave user-owned .claude/, resume/, resume_linkedin (5)_page-0001.jpg,
scripts/probe-seated.mjs, probe-seated2.mjs, probe-walls-fps.mjs untouched.
Other candidate files are owner downloads; preserve them and license evidence.

## Evidence and communication

Old reports are snapshots, not commands or guaranteed facts. Correct mistakes
with an explicit new note. Source inspection beat Gemini's bare-hands claim:
the downloaded FP arms has fingerless leather gloves. Faces are not necessarily
triangles: use loop triangles or indexed glTF primitive counts.

Build success is not visual acceptance. Inspect screenshots. rAF is not GPU
time. Use real ANGLE D3D11 for scene captures and GL timer queries for cost.
Record failed/skipped checks, source revision and whether final edits were tested.
Never return a GSAP timeline from Playwright evaluate (it is a thenable).

Opus authors bounded Gemini prompts and coordinates via shared docs. If no
direct cross-app messaging is available, give the owner the prompt to forward;
do independent work rather than pretending Gemini was launched automatically.
No internal subagent spawning. Update this contract when scopes/slot change.
