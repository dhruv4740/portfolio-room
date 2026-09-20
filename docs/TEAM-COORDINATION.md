# Active team contract — Opus leads the next multi-pass run

## Latest override: Codex hands / Opus environment, in parallel

Owner authorized the corrective pass. Codex owns current hand,
body and keyboard-contact code, WorkspaceStage, buildSeatedFigure and hand
assets/scripts. Final hand checks have completed; build/browser/GPU slot is
RELEASED to Opus. Codex writes only its explicit checkpoint paths to Git, then
releases Git to Opus. Opus works in NEW candidate environment files specified in
PROMPT-OPUS-ROOM-COMPOSITION.md; no live builder or coordinate edits. This
supersedes the older ownership/paused/slot paragraphs below until released.
New shared metre-scale contract is in that prompt. Gemini's bare BAMEN edits
were reviewed and retained by Codex; they are a different asset from the older
gloves. See reviews/CODEX-HAND-SUPPORT-PASS.md for the remaining coffee seam.

Owner explicitly authorized Opus + Gemini to work together on 2026-09-20.
Opus may prompt and coordinate Gemini. Codex is preserving usage for the hardest
3D/anatomy decisions and will review after several passes. No internal agents.

Read OPUS-GEMINI-CONTINUATION.md and REALISM-ASSET-CHECKPOINT.md. They supersede
old prompt scopes and ownership restrictions. Previous contract is archived at
reviews/TEAM-CONTRACT-PRE-OPUS-LEAD.md, not an active instruction set.

## Status for Codex — read first

`reviews/STATUS-FOR-CODEX-2026-09-20.md` is the current handover. It covers
everything Opus and Gemini did while Codex was paused, and flags one item that
needs a decision before further work: **Gemini's hand retarget is uncommitted,
edits two Codex-reserved files, and has made `?hands=authored` the default**,
against the "keep it opt-in" rule below. Opus neither committed nor reverted it.

## Current ownership

| Owner | Authority / exclusive writes |
|---|---|
| Opus | Integration lead; relevant live scene code outside reserved hands, asset integration/export, main docs; sole local Git writer |
| Gemini | docs/reviews/GEMINI-ASSET-AUDIT-V2.md **delivered 2026-09-20** and reviewed by Opus; metadata under art/candidates; further bounded files/tasks assigned explicitly by Opus |
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

**OWNER: OPUS — held and used 2026-09-20, then RELEASED (second time).**
Opus took the slot after Codex's handoff and used it for the lamp acceptance,
mouse and ceiling-fixture integration, Blender preparation and the regression
run recorded in reviews/OPUS-MULTIPASS-HANDOFF.md. Opus has finished with it
and **RELEASES** the slot. Next holder should claim it here before using it.
Gemini delivered its audit offline and did not need the slot.
One operator: no competing browser timings, Blender renders or builds.
CPU preparation in separately owned asset folders may run in parallel.

### Files Opus changed this run (do not assume they are still as Codex left them)

`buildWorkspace.js`, `afterHours.js`, `deskContactShadows.js`,
`WorkspaceStage.jsx`, `authoredTaskLamp.js`, `buildRoomInteractions.js`, plus new
`authoredMouse.js`, `authoredCeilingFixture.js`, `authoredKeyboard.js` and the
generated `keyboardLayout.js`. Codex-reserved hand files were not touched.
Commits `df304fe`, `539311f`, `44efcdf`, `921397f` (chair reverted), `a50730a`
(keyboard), `08a0204` on feat/v3.

Gemini additionally has **uncommitted** edits to `handSurface.js` and
`scripts/build-authored-hands.mjs` — both reserved to Codex — plus the
`public/models/hands-authored*` payloads. Left exactly as found; see the status
document above.

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
