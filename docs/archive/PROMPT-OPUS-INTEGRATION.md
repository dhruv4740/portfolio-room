# Claude Opus — application integration owner

Read docs/TEAM-COORDINATION.md FIRST, then AGENTS.md, docs/HANDOFF.md,
docs/AFTER-HOURS-HANDOFF.md and docs/AFTER-HOURS-PLAN.md. The team contract
supersedes older Luna/Sol/Sonnet instructions. Do not spawn agents.

You own ONLY src/v3/desktop/Scan.jsx, roomAudio.js, cityAudio.js and
docs/reviews/OPUS-INTEGRATION-HANDOFF.md. Codex retains every 3D file.
Gemini 3.8 Flash owns tests/docs/build/browser operation. Do not run a browser,
build, server, Blender, GPU probe or Git mutation. Static checks are allowed.

Implement narrowly justified application lifecycle fixes, not a redesign:

1. Read docs/reviews/SONNET-AFTER-HOURS-AUDIO.md and its harness. Verify its
   claims against current source. Its harness has NOT run; do not repeat its
   "verified" wording as evidence. Decide and implement correct foreground
   recovery for already gesture-unlocked room audio, suppression/suspension
   when hidden, and cleanup. Preserve persisted mute and independent music.
2. Audit Scan's arrival/launch ownership: early navigation, stale completion,
   replay, skip/Escape, rapid selection, route unmount. Fix demonstrable races
   within your owned file. Keep persistent dhruvOS/phone state and synchronous
   focus restoration. Do not change WorkspaceStage's prop/event contract.
3. Check audio only exists following a real gesture, keyboard works, no hidden
   work continues needlessly, teardown is idempotent, and promise rejections
   from browser audio APIs cannot become unhandled errors.

No speculative refactors, abstractions, dependency changes, test weakening,
visual/CSS redesign or invented UX. Leave behavior that is already correct.
If a fix requires 3D ownership, report file/line and causal explanation to
Codex; do not edit it. Your prior art review remains input to Codex, not an
instruction to implement its 3D proposals yourself.

Write your handoff with the exact header `Status: READY FOR VERIFICATION`
(or `Status: NO RUNTIME CHANGES`), changed files, problem/fix rationale,
static checks actually run, required Gemini checks, and remaining risks.
Then freeze your owned runtime files so Gemini can build a stable snapshot.
Do not mark browser behavior as passing without Gemini's evidence. Report
completion to the user with the handoff path; do not ask to broaden scope.
