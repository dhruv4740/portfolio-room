# Sonnet parallel assignment — room audio and lifecycle verification

You are collaborating with the parent Codex agent in the SAME working tree.
Read AGENTS.md, docs/HANDOFF.md, docs/AFTER-HOURS-HANDOFF.md and
docs/AFTER-HOURS-PLAN.md first. Parent owns all 3D. A Luna agent currently owns
the core/arrival/room regression run and docs/AFTER-HOURS-ACCEPTANCE.md.

## Exclusive file ownership

You may create/edit ONLY:
- scripts/verify-after-hours-audio.mjs
- docs/reviews/SONNET-AFTER-HOURS-AUDIO.md

Read src/v3/desktop/roomAudio.js, cityAudio.js, Scan.jsx and the coffee event
timeline in WorkspaceStage.jsx. Do not change these or any other runtime file.
Report implementation defects with exact lines and a minimal suggested fix.
Do not commit, stash, reset, install dependencies, rebuild, start servers,
download assets or spawn agents. Never touch unrelated working-tree files.

## Concrete work

Author a small Playwright harness, following existing repo conventions,
targeting BASE=http://localhost:4173. Force scan and skip cinematic arrival for
unrelated audio checks. Use the real application and actual DOM controls.
Meaningful assertions should cover:

1. No AudioContext before user gesture; keyboard as well as pointer unlock.
2. Persisted ROOM SOUND mute and matching city ambience suppression, without
   muting the independent Music Player.
3. Coffee event order and one occurrence per lift/sip/setdown; cancellation
   prevents later stale timeline sounds; reduced motion does not synthesize
   a full gesture sequence.
4. Hidden-tab sound suppression and cleanup after route unmount/re-entry.
5. No page errors or leaked event listeners/contexts after repeated lifecycle.

Use narrow instrumentation of native AudioContext and event dispatch only as
needed. Do not replace the application implementation with mocks that prove
themselves. If a check cannot be observed reliably, report it as unverified.
Assertions must fail visibly; no silent skip presented as success.

You may run node --check and other non-browser static checks now. DO NOT run
the browser harness yet: the parent/Luna own the exclusive GPU/browser slot.
Record the exact execution command in the report and tell the owner the harness
is ready to hand back. Listening quality and real tab visibility are separate
from functional instrumentation; do not claim them verified by synthetic events.

If source changes during your review, record the ambiguity rather than editing
someone else's work. End with implementation findings, authored coverage,
checks actually run, and explicit remaining verification.
