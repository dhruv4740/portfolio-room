# Gemini Flash — bounded contact/exterior verification

Work in C:/Users/hp/OneDrive/Desktop/random sites/portfolio on feat/v3.
Read AGENTS.md, docs/TEAM-COORDINATION.md, the latest two checkpoints in
docs/AFTER-HOURS-HANDOFF.md, and docs/DESK-CONTACT-PASS.md.
This is a NEW assignment, not a rerun of the old workhorse batch.

You own the exclusive build/browser slot once started. Codex has frozen runtime
and assets after its window/seat visual review. Do not spawn agents, push,
install packages, edit application/3D code, or change Blender/public assets.
Do not touch user-owned untracked files. Only edit verification scripts when a
demonstrable harness defect requires it, plus your new report below. The parent
owns scripts/review-contact-shadows.mjs; run it unchanged and report defects.

1. Record exact HEAD, dirty paths and build start time. Build once. Use the
   existing localhost:4173 preview; do not start a competing server. Real GPU
   is required for forced scan: GPU=1 or chromium channel with D3D11 arguments.
2. Run serially: review-contact-shadows.mjs, verify-held-objects.mjs,
   verify-reduced-hands.mjs, verify-room-interactions.mjs,
   and verify-after-hours.mjs. Use BASE on the same
   origin. Do not rerun unrelated app suites without evidence of a regression.
3. Explicitly verify the new contact effect at LOW tier and reduced motion:
   keyboard/phone/cup do not leave stale shadows, returned poses settle, contact
   capture count stops after settling. Use window.__v3test.contacts().captures.
   Phone stage must still pause room rendering. A short focused harness is
   allowed; do not weaken assertions or mistake an idle action state for proof
   that the effect actually updated. Save source and machine-readable evidence.
4. Diagnose the warning "Failed to fetch; generating local fallback" from
   hand loading. Read handAssets.js and its caller. Capture response status,
   Content-Encoding, bytes and decompression outcome for hands-v1.bin.gz and
   hands-v1.bin on the same origin. Check whether browser auto-decompression
   causes a second gzip decode, or whether another cause is evidenced. Those
   are hypotheses, not a conclusion. Do not edit runtime; give Codex a minimal
   proposed fix with exact evidence. If not reproducible, say so.
5. Write docs/reviews/GEMINI-CONTACT-VERIFICATION.md with exact commands,
   completed/failed/skipped assertions, source identity, warnings, artifact
   paths and any proposed fix. Distinguish flow medians from GPU benchmarks.
   Do not claim realism acceptance, subjective audio review, or broad FPS
   guarantees. First fix a harness defect only if proven; one confirming run
   after that is enough. Stop and report application failures rather than
   modifying the runtime or repeatedly probing.

Close every browser you started in finally blocks. End the report with
`Browser/build slot: RELEASED`. Do not commit; Codex checkpoints reviewed files.
