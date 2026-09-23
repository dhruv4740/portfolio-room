# Gemini 3.8 Flash — bounded verification and documentation work

Execute this assignment strictly. Read docs/TEAM-COORDINATION.md FIRST,
AGENTS.md, docs/AFTER-HOURS-HANDOFF.md and docs/AFTER-HOURS-ACCEPTANCE.md.
Do not spawn agents. Do not edit application code, 3D, assets or source apps.
Do not install packages, mass-format, commit, push, reset, stash or clean.

WRITE ONLY existing scripts/verify-*.mjs, scripts/measure-gpu.mjs,
scripts/shots-hands.mjs, scripts/shots-typing.mjs, scripts/shots-after-hours.mjs,
docs/AFTER-HOURS-ACCEPTANCE.md and
docs/reviews/GEMINI-VERIFICATION-HANDOFF.md. Do not touch user probe scripts.

## First: static work while Opus works

- Read existing harnesses and results. Preserve assertions. Check new GPU=1
  launch support, exact localhost:4173 origin, explicit arrival skip outside
  arrival tests, readiness before timing, and cleanup on failed runs.
- Audit scripts/verify-after-hours-audio.mjs from Sonnet. Correct harness bugs
  or inaccurate expectations using current application contracts. No test may
  assert a known defect as desired behavior or count a silent skip as passing.
- Do not rerun passing suites blindly. Build an exact table: script, source
  snapshot, completed assertions, exit status known/unknown, remaining check.
- Update stale acceptance text: verify-v3 now has separate software fallback
  and configurable GPU main browsers. Prior 41/23 JSON results are evidence
  of assertions, but internal-agent final handback was interrupted.

## Gate before executing

Wait for docs/reviews/OPUS-INTEGRATION-HANDOFF.md to say
`Status: READY FOR VERIFICATION` or `Status: NO RUNTIME CHANGES`.
Until then do static work only. Do not assume elapsed time is permission.
If Opus has not finished when static work is done, report `WAITING FOR OPUS`
with completed work; do not start the browser. On continuation re-read status.

After the gate, YOU are the sole build/browser operator. Record git HEAD and
git diff --name-only, build once (`npm run build`), reuse preview at
http://localhost:4173. If preview is absent start the direct Vite bin on that
origin, with --strictPort. No concurrent browser suites or GPU jobs.

## Ordered work

1. Run the new audio harness on the real GPU; fix harness-only issues. Report
   app defects to Opus/Codex with reproduction and stop dependent checks.
2. Finish evidence for GPU=1 verify-v3, verify-studio, verify-held-objects,
   verify-reduced-hands, verify-room-interactions and verify-real-apps. Use
   existing reliable completed evidence where the source scope allows it;
   otherwise one run per required suite. Preserve software fallback coverage.
3. Run After Hours arrival/fallback checks if Opus changed arrival/lifecycle.
4. Capture rest/typing/coffee/pen/phone/award via existing GPU shot scripts.
   Record paths. Do not claim anatomical/visual acceptance; Codex inspects them.
5. Run a single fixed-camera GPU sweep: TIERS=mid, SWEEP=0.8,1,1.25. Wait for
   all three asset-ready statuses, warm up each ratio, clear samples, then
   measure. Report renderer, viewport, tier, DPR, sample count, median/p95,
   draw calls/triangles, and transfer budget independently. No FPS claims from
   rAF. No unrequested wider sweep or repeated benchmarking.

PowerShell env syntax: `$env:GPU='1'; $env:BASE='http://localhost:4173'; node ...`.
If a suite stalls, terminate only the exact process tree you launched, capture
its last durable output, and diagnose before one targeted retry. Never kill
all Chrome/Node processes. Never extend every timeout or remove an assertion
just to produce green output. Never return paused GSAP timelines from evaluate.

## Final handoff

Update AFTER-HOURS-ACCEPTANCE.md and your exclusive handoff with exact results,
failed/incomplete/unrun checks, logs/screenshot paths, source/build identity,
code changes, and next required owner. Keep old failures as historical entries.
End with `Browser/build slot: RELEASED`; close only your test browsers and leave
the preview server running. Listening quality and actual OS visibility remain
unverified unless separately observed; synthetic events do not prove either.
Do not edit the main handoff, art direction, peer reports or TEAM-COORDINATION.
