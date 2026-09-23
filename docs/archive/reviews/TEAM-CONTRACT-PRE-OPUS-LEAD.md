# Active team contract — 2026-09-20

Latest owner instruction supersedes the Luna/Sol delegation section in the
After Hours plan: **no internal Codex subagents**. Work is shared between
Codex (3D), Claude Opus (application logic), Gemini 3.8 Flash (workhorse tasks).
The earlier Sonnet assignment is finished/superseded; preserve its report and
audio harness. Do not run another Sonnet/Luna task or spawn child agents.

All three apps share this exact working tree on feat/v3. Read current files,
not memories of an earlier checkout. Never stash/reset/clean/revert others'
changes. No push, deployment, dependencies or mass formatting. No concurrent
Git writes: Codex performs checkpoints; other agents report ready files.

## Exclusive write ownership

### Current assignments — realism asset preparation

These supersede the historical ownership table and closed assignments below.
Prompts are prepared for the owner to forward; this does not mean either
external model has started. No internal subagents.

| Owner | Current exclusive writes |
|---|---|
| Codex | Live scene, hands, phone grip, lighting, integration, main documentation; all files outside the two exceptions below |
| Gemini | `art/candidates/hands/`, `docs/reviews/GEMINI-HAND-ASSETS.md`, per `PROMPT-GEMINI-REALISM-ASSETS.md` |
| Opus | `art/vendor/polyhaven/desk_lamp_arm_01/`, `docs/reviews/OPUS-LAMP-ASSET.md`, per `PROMPT-OPUS-LAMP-ASSET.md` |

Codex retains the build/browser/GPU slot. Peers may download and inspect assets
offline, including CPU Blender imports/exports, but must not render, build,
run localhost tests, commit, or touch runtime files. Previous runtime and
verification assignments are closed. No automatic continuation of old scopes.

The target remains cinematic realism; current procedural improvements are
not evidence of GTA/RDR-level quality. Next acceptance gate is a coherent,
physically scaled hero view with authored assets and convincing lighting.
Codex owns that judgment and hand/animation compatibility, not asset research.

Latest owner direction: Opus may implement bounded 3D tasks from exact Codex
specifications. Current exception: ONLY new speakerDetails.js and
docs/reviews/OPUS-SPEAKERS-HANDOFF.md, as specified in PROMPT-OPUS-SPEAKERS.md.
Keep it unimported; Codex owns integration and visual acceptance. No Opus
browser/build use. This does not transfer hand anatomy or general 3D ownership.

Update: speaker task completed and integrated by Codex; seated/overview visual
review passed. That assignment is closed. Neither Opus nor Gemini has a new
task; do not keep editing the speaker module under the earlier permission.

| Owner | Files |
|---|---|
| Codex | All 3D: WorkspaceStage.jsx, buildWorkspace.js, buildRoomInteractions.js, seatedHands.js, handSurface.js, handAssets.js, afterHours.js, sceneDirector.js, cameraRig.js, perfGovernor.js; art/, runtime models/materials, Blender/export scripts; this contract and main handoff |
| Opus | src/v3/desktop/Scan.jsx, roomAudio.js, cityAudio.js; docs/reviews/OPUS-INTEGRATION-HANDOFF.md |
| Gemini Flash | Existing verification/measurement/shot scripts (not Blender/export scripts); docs/AFTER-HOURS-ACCEPTANCE.md; docs/reviews/GEMINI-VERIFICATION-HANDOFF.md |

Everything else is read-only unless Codex explicitly reallocates it here.
Existing Opus/Sonnet reviews are immutable evidence of their earlier snapshots.
Do not alter 3D code to make a test pass. Do not change application contracts
between Scan and WorkspaceStage without reporting the proposed interface first.

## Build/browser coordination

**CURRENT SLOT: CODEX.** Gemini released its contact/exterior batch; report in
docs/reviews/GEMINI-CONTACT-VERIFICATION.md. Codex is correcting the confirmed
hand gzip double-decode and reviewing the next art work. No new Gemini batch.
The previous reservation below is historical.

**PREVIOUS SLOT: RESERVED FOR GEMINI — contact/exterior verification.** Codex
finished its GPU visual review and froze runtime/assets for the new task in
PROMPT-GEMINI-CONTACT-VERIFY.md. This reservation does not mean Gemini has
started; the owner must forward that prompt. No new Opus assignment. Codex may
work on new offline hand-source files, but must not rebuild or change runtime
until Gemini reports release (or the owner cancels the assignment).
The latest contact and exterior entries in AFTER-HOURS-HANDOFF.md supersede
the old snapshot information below.
The prior batch procedure below is retained as history, not a current lock.

**One operator: Gemini.** Reuse localhost:4173. No other agent starts browsers,
Blender renders, GPU measurements or builds during its verification batch.
Codex has stopped all internal agents; no verification Node process remained
when the team changed. The preview server remains available.

Current runtime checkpoint: aad580e; assets checkpoint: 56bae6d. Dist predates
the final nail-material adjustment. Codex runtime edits are now frozen for the
handoff; hand-rig reference/export additions do not affect runtime.

Owner subsequently asked Codex to continue in parallel. Codex may author new,
UNIMPORTED 3D modules and Blender scripts during verification. Existing runtime
imports, public assets and dist remain frozen until Gemini releases the slot.
Current staged work: src/v3/desktop/deskContactShadows.js, not integrated.

Opus may edit its three files now. Gemini can do static harness/doc work in
parallel. Gemini must wait for OPUS-INTEGRATION-HANDOFF.md to say
`Status: READY FOR VERIFICATION` (or `NO RUNTIME CHANGES`) before building.
At that point Opus freezes its runtime files until Gemini reports completion.
Gemini records source commit + dirty-file list and build start time, builds
once, runs suites serially, and writes `Browser/build slot: RELEASED` when done.
If a real application defect needs Opus, stop dependent checks and report it;
do not race a rebuild or silently modify somebody else's file.

## Evidence rules

No skipped/incomplete check counts as a pass. A report describing an assertion
is not evidence it ran (the Sonnet report explicitly says its harness is unrun,
despite some earlier wording saying "verified"). Confirm peer findings against
current source: reviews contain hypotheses and can be wrong.
Never return a GSAP timeline from Playwright evaluate: it is a thenable; a
paused timeline can hang the test. Use a block body without returning it.
Real GPU timing requires ANGLE D3D11, no competing browser workload, asset
readiness and warmup. rAF cadence is not GPU time. Keep genuine software
fallback coverage separate from forced real-GPU scan testing.

Current durable evidence: After Hours 26/26; latest v3-results.json contains
41 passing assertions and studio-results.json 23, but the internal agent was
interrupted before final handback. Audit these artifacts before claiming full
completion. Parent high-tier room/window/coffee capture finished with errors[].
Audio harness, remaining grip shots and final fixed-DPR GPU p95 need review.

User-owned files: .claude/, resume/, resume_linkedin (5)_page-0001.jpg,
scripts/probe-seated.mjs, probe-seated2.mjs, probe-walls-fps.mjs. Leave untouched.
