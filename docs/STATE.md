# Current state

2026-09-20 checkpoint: branch feat/v3, local only. Opus leads the next run,
Gemini supports, Codex paused to preserve usage. See TEAM-COORDINATION.md.

Live scope is src/v3 and public/os; legacy v1/v2 are dead. Night studio,
snowy modeled city, cached contact shadows, arrival/audio and persistent real
project demos exist. They do not yet meet the desired game-like realism.

Latest lamp/phone/hand-prototype implementation, measured evidence and gaps
are in REALISM-ASSET-CHECKPOINT.md. The master continuation is
OPUS-GEMINI-CONTINUATION.md. Update this file after integrated checkpoints;
do not duplicate stale claims from older reviews.

2026-09-20, later: Opus ran three integration passes on feat/v3 (`df304fe`,
`539311f`, `44efcdf`). Task lamp accepted against a new focused suite; the
licensed A4Tech mouse and the CC0 Poly Haven industrial pendant replaced their
procedural stand-ins. Full record: reviews/OPUS-MULTIPASS-HANDOFF.md.

2026-09-20, later still: Codex repaired hand/body/keyboard contact (`11a2bce`)
and released the slot; Opus used it for the cinematic room render pass
(`1a10d16`, `5dcea66`). **The true-scale room now exists as a rendered,
corrected candidate** — `cinematicLayout.js`, `buildCinematicWorkspace.js`,
`cinematicRoomInteractions.js` plus a `scripts/review-cinematic-room*` harness.
Five comparison frames on a real GPU; three contact/scale defects found and
fixed. **Not adopted**: no live import is switched, because adoption and the
hand kinematics are one edit and that edit is Codex's. Full record and the
old-to-new mapping table: reviews/OPUS-ROOM-COMPOSITION.md.

Important limits: **mixed scene scale is still the main blocker in the live
room** — the audit is in ROOM-SCALE-PROPOSAL.md and the candidate above is the
proposed answer; the uniform correction needs Codex because seated hand poses
are world-space. The indirect bake still reflects the task light's older
placement and must not be called accurate. Default hands remain procedural;
the downloaded FP arms prototype is gloved. **Keyboard and chair stay blocked:
no license evidence exists in the repository for either.** `verify-v3` and
`verify-after-hours` fail on clicks that trigger a route change; this was
reproduced at commit `f1b9aa9`, before this pass, so it is pre-existing.
