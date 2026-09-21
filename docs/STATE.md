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

2026-09-21: Opus closed three owed items on the candidate and fixed one live
bug. The ceiling fixture's `setEntryPower` calls before the GLB landed were
being dropped (live file, now remembered and applied on load, with a regression
check that can actually distinguish the two states). `setSky` now has a key
light per sky state whose ray is constructed to pass through the aperture.
Speaker drivers exist for the cinematic cabinets. Rendering then exposed a
defect no numeric check caught: the middle-distance block passed the sightline
cone and still read as a wardrobe at the glass — it is now a 16 x 40 m tower at
57 m, with the backdrop moved behind it. **Still not adopted**; this was polish
on the candidate, not progress toward adoption. See reviews/OPUS-ROOM-COMPOSITION.md.
Gemini was assigned PROMPT-GEMINI-LICENCE-AND-DIMENSIONS.md (licence provenance
for keyboard and chair plus CC0 replacements, and sourced prop dimensions); as
of this checkpoint it has not reported.

2026-09-21 later: the authored hand surface was the default for every visitor
despite four documents calling it opt-in; restored (`0e79071`). The owner then
reported the hands still fused, and that is correct: the *procedural* surface
regressed at `6a13047`, which raised the smooth-union blend radius. Proven by
swapping `dd85216`'s baked hands-v1.bin back in - 37,780 triangles with
separated fingers against 75,860 today with merged ones. The shipped hands are
baked, so the fix needs a rebake, not a source edit. The body shift was traced
to `11a2bce` and measured: no anchor is within the 0.575 m reach, and the
window lifts the torso +0.486 m. Adoption would NOT fix it. Keyboard and chair
licences resolved (both CC BY 4.0, confirmed against the Sketchfab API) and the
keyboard credited, which it had lacked since `a50730a`. Full evidence:
reviews/OPUS-HANDS-AND-REACH.md. Next-session handoff: HANDOFF-NEXT-SESSION.md.

Important limits: **mixed scene scale is still the main blocker in the live
room** — the audit is in ROOM-SCALE-PROPOSAL.md and the candidate above is the
proposed answer; the uniform correction needs Codex because seated hand poses
are world-space. The indirect bake still reflects the task light's older
placement and must not be called accurate. Default hands remain procedural;
the downloaded FP arms prototype is gloved. **Keyboard and chair stay blocked:
no license evidence exists in the repository for either.** `verify-v3` and
`verify-after-hours` fail on clicks that trigger a route change; this was
reproduced at commit `f1b9aa9`, before this pass, so it is pre-existing.
