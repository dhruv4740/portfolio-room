# Multi-pass continuation: Opus leads, Gemini supports

Owner-authorized 2026-09-20. This is the current execution brief, superseding
older agent assignments. The owner will return after several passes. Preserve
Codex usage for difficult anatomy, animation/art direction and final review.
Opus may direct Gemini and make routine integration decisions without asking
the owner or Codex at each step. Do substantive, reviewable work, not micro-passes.

## Read first

AGENTS.md; HANDOFF.md; AFTER-HOURS-HANDOFF.md; TEAM-COORDINATION.md; this file;
AFTER-HOURS-PLAN.md; ASSET-REGISTER.md; the new REALISM-ASSET-CHECKPOINT.md.
FABLE-NOTES.md and IDEAS.md are useful historical context, not current scope
or evidence. Read relevant source before relying on any peer's descriptions.

## Product and artistic intent

Dhruv's flagship portfolio: a believable, cinematic night studio, warm task
light against a cold snowy city, with a short interruptible first-person
arrival and tactile interactions. GTA V/RDR2 are references for coherent scale,
materials, lighting, atmosphere and animation, NOT a promised measured quality
level. Current room is still far from that standard. Prioritize a compelling
seated/arrival hero view over more objects or features. No dialogue, narration,
open-world movement, game-ripped assets, paid purchases or new UI gimmicks.

Keep WORK instantly available; retain mobile deck and software-GPU fallback.
The scene launches real project demos in persistent dhruvOS. Desktop demos
are copied real source builds; Android reconstructions stay honestly labelled.
The phone stage is 390 CSS pixels wide: this is layout space, independent of
hardware pixel density. Keep the readable DOM stage and state preservation.

## Team authority and safety

- Opus is integration lead and sole Git writer. Work on feat/v3, conventional
  local commits per logical unit, no push, no attribution/co-author trailers.
- Gemini is a workhorse for bounded research, provenance, preparation, tests
  and documentation. Opus writes explicit tasks with owned paths, expected
  output, acceptance criteria and a named build/browser slot. Gemini may
  propose fixes but does not edit Opus-owned runtime files without reassignment.
- Codex is paused after the checkpoint. Reserve `seatedHands.js`,
  `handSurface.js`, `handAppearance.js`, `handAssets.js`, `build-authored-hands.mjs`
  and `extract_authored_hands.py` for its anatomy/retarget work. Read freely.
  Keep authored hands opt-in; do not silently replace the default hand rig.
- Opus may edit other relevant live scene files, including buildWorkspace,
  buildRoomInteractions, afterHours, authoredTaskLamp, sceneDirector and
  WorkspaceStage for integration. Preserve existing hand/phone grip controls.
  A genuine regression in reserved files: document and ask Codex to review;
  continue independent work meanwhile.
- Do not spawn internal agents. These are two external apps/models. Neither
  can assume the other has received a message just because a prompt exists.
  Use shared docs for assignments; if direct cross-app communication is not
  available, give the owner one clear prompt/link to forward, then continue
  independent work. Do not send external messages on the owner's behalf.
- Never stash/reset/clean or delete other changes. User-owned: .claude/,
  resume/, resume_linkedin (5)_page-0001.jpg, probe-seated.mjs,
  probe-seated2.mjs, probe-walls-fps.mjs. Keep original candidate downloads.

## Pass 0 — accept the inherited checkpoint

Read REALISM-ASSET-CHECKPOINT.md carefully: some parts are verified, others
are deliberately experimental. Inspect git status and record the actual
commit and dirty list. Production build passed. The latest phone vertex
collision check passed 23 samples. Do not repeat all historical suites first.

Validate the latest lamp implementation specifically: async loading and failed
load fallback; switch on/off; root placement/clamp contact; shade/arm overlap;
warm spotlight shadows; final seated night and overview composition; disposal.
Current source combines 27 static nodes into two material meshes. Keep that
draw reduction. Architectural shadowMap.autoUpdate must stay false. The warm
spot now adds a cached shadow map, not per-frame shadow rendering.

The lamp moved after the old indirect bake. Do not claim the current bake is
physically accurate for its new placement. First settle composition, then
rebake or adjust the lamp's separable indirect contribution consistently.
Avoid shipping a bright fake pool disconnected from the actual lamp: the
authored lamp disables the old additive pool decal when loaded.

## Pass 1 — licensed desk assets

Gemini first reconciles candidates against actual files and provenance. It
previously called fingerless gloves bare hands and counted polygon faces as
triangles in some FBX inspection snippets. Correct the record with evidence;
do not repeat adjectives such as superb/outstanding as if measured.

Opus starts with the selected A4Tech Bloody V7 mouse. Its local license.txt
includes source, creator Prokyovec and CC BY 4.0. Preserve visible attribution
in public asset credits and record modifications. 136,520 triangles is too
much for a small prop: prepare a silhouette/UV-preserving version around
8–15k triangles, 1K maps, ideally <=2 MiB. Compare actual close-ups before
accepting simplification. Target a plausible roughly 7 x 12 cm mouse, grounded
on the felt mat with correct wheel/forward orientation. Remove the old box
mouse/wheel in the same integration; update contact casters using real geometry.
Do not claim a performance improvement until measured.

Next mechanical keyboard: verify source/license first. Keep a comparable
~48 cm footprint and the existing hand reach/typing contact. The current
keys/setKey/KEY_ROWS and test hooks are functional contracts. A static imported
keyboard must not silently remove physical key depression or leave duplicate
procedural keys. Inspect separability/material topology, map supported keys
to actual keycap transforms where possible, or prepare the candidate and
document a blocker rather than fake a successful interactive replacement.

Next worn leather chair, once provenance is verified: judge shape in actual
views, fit the seated figure, floor and desk. Preserve seat, stand and camera
interaction anchors. Do not scale it arbitrarily just to cover the old chair.
Remove old visible geometry and fake contact remnants with the replacement.
It may remain prepared-but-unintegrated if the model/style does not fit.

## Pass 2 — cohesive room, not a prop catalogue

Audit the mixed physical scale before adding more objects. Desk is currently
3.52 x 1.45 m at y=1.165; newly corrected thickness 35 mm. Monitor enclosure
is 1.4 x .93 m; seated camera y=1.72. These remain oversized compared with
the real-scale keyboard, mouse, phone and lamp. An architecture/layout proposal
and before/after hero comparison is more valuable than arbitrary mesh detail.

Opus may implement a coherent layout correction if it updates all affected
camera, WORKSPACE.screen, hit-plane, anchors, contact surfaces and interaction
targets together. Do not shrink the whole root blindly: hand reach/world-space
animation would break. If it requires redesign of hand kinematics, record the
exact proposed dimensions and defer that portion to Codex while doing others.

Prepare/integrate one licensed hanging fixture if it improves arrival framing;
preserve existing pendant emission/power-stutter behavior without adding
unnecessary dynamic lights. Choose cage vs dome by scene fit, not polygon count
alone. Keep fixture scale, cord attachment and ceiling contact convincing.

Refine window reveal/sill/blind geometry, exterior depth and actual reflections
only where a comparison shows improvement. Avoid repetitive glowing windows,
mirror-like walls, overly glossy skin or random grunge. Reuse current winter
city GLB/PBR/bake pipeline. No new expensive post-processing to hide weak forms.
Keep static architectural shadows, cached contact shadows and existing tiers.

## Pass 3 — verification and delivery

One active build/browser/GPU operator at a time. Opus initially owns the slot.
For Gemini verification, freeze runtime/assets and record source commit, dirty
list and build timestamp; explicitly transfer/release the slot in TEAM.
CPU asset prep/research can run independently in separately owned folders.
No concurrent Blender render and browser timing. Use existing preview :4173.

Run relevant suites once per integrated logical pass, fix failures and run a
focused confirmation. At the final integrated checkpoint run the affected
room, held-object, reduced-hand, After Hours and v3 suites; real-app suites only
if their shell/contracts changed. Commands and GPU caveats are in AGENTS.md.
Use `$env:GPU='1'` etc in PowerShell, not POSIX env-prefix syntax. Default
software-GPU fallback tests must remain genuine. `/work` never loads three.js.

Take final real-GPU seated night/overview/arrival/lamp on-off and relevant
interaction frames, then actually inspect them. Record failed/skipped tests.
GPU measurement: `scripts/measure-gpu.mjs`, e.g. TIERS=mid, DPR=1.25 as proper
PowerShell environment variables. Read timer-query median/p95, not rAF cadence
or governor submission interval. Warm assets first; no competing GPU process.
Budget goal is stable ~30 fps on the owner's AMD iGPU, not an invented result.
Check transfer/VRAM increases; don't raise budget assertions merely to pass.

## Gemini hand search: exact new requirements

The downloaded DJMaesen FP arms is GLOVED. Its atlas contains leather seams,
fabric and exposed fingertips. Current `?hands=authored` is a retarget study,
not an approved replacement. Do not recolor gloves to pretend they are skin.

Find at most two genuinely bare, anatomically credible candidates with usable
forearms, rig, UVs and skin maps. Provide a real preview AND inspected texture
atlas when downloadable, original source, creator and license. Prefer CC0/BY.
If gated, provide one exact owner download request and continue other work.
No game rips, NC-only assets, unexplained aggregator licenses or invented
visual claims. Codex chooses the final hand candidate and handles hard retargeting.

## Durable progress and stop conditions

After each logical pass update TEAM ownership/slot, AFTER-HOURS-HANDOFF,
ASSET-REGISTER, STATE and a new review report with source commit, changed
files, screenshots, measured results and unresolved limits. Preserve old
reports as historical snapshots; append explicit corrections separately.
Use new PROMPT-GEMINI-*.md files for bounded assignments, not vague todo lists.
Opus reviews Gemini's output before merging it into conclusions or code.

Continue independently through the applicable passes. Do not stop merely
because one candidate needs a download. Stop dependent work for unknown
licenses, destructive actions or actual ownership conflicts; do useful
independent work and explain the specific blocker. No deployment/push.
At the end, give the owner a concise summary plus one comprehensive
`docs/reviews/OPUS-MULTIPASS-HANDOFF.md` for Codex's later review.
