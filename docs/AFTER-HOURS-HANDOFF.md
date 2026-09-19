# After Hours — live continuation ledger

## Current checkpoint

2026-09-20: documentation committed FIRST as 09fe88f; Blender/material assets
and isolated external-agent prompts committed as 56bae6d. Integration is in
progress, not artistically accepted. Usage interruption was recovered without
lost work. After Hours acceptance passed 26/26 on the earlier integrated build.
See AFTER-HOURS-PLAN.md for approved scope and agent restrictions.

Branch feat/v3. Baseline commit fce4507: flatter procedural hands, continuous
mesh, readable phone stage, four real desktop demos. Existing room still uses
mostly procedural shapes/materials and an illustrative city. Do not describe
it as achieving the GTA/RDR realism target.

## Next exact actions

1. Luna acceptance owns the browser, running remaining regressions with GPU=1
   against the rebuilt dist. Do not rebuild underneath it. Older software scan
   runs timed out; they were incomplete, not passes. See acceptance report.
2. Parent high-tier room/window/coffee captures passed without errors. Newer
   source only adjusts nail shadow reception/color. Build this after browser
   release, inspect rest/typing/pen/phone/award, and confirm any actual failures.
3. Measure fixed camera/DPR GPU cost after resource/probe warmup.
4. Continue custom anatomical hand work and hero-frame review. CC0 candidates
   are retro references, not suitable drop-in realism replacements.
5. Optional external assignments: PROMPT-OPUS-AFTER-HOURS.md (read-only art/code
   review), PROMPT-SONNET-AFTER-HOURS.md (isolated audio harness). Neither owns
   runtime edits or browser runs. Do not assume the owner has started them.

## Environment and commands

- Repo: C:/Users/hp/OneDrive/Desktop/random sites/portfolio
- Blender: C:/Program Files/Blender Foundation/Blender 5.2/blender.exe
- Build: npm run build (writes tracked vendor/content outputs; review diff).
- Preview: node node_modules/vite/bin/vite.js preview --host localhost --port 4173 --strictPort
- GPU shots: PowerShell `$env:GPU='1'; node scripts/shots-hands.mjs coffee award pen`
- GPU timing: `$env:TIERS='mid'; $env:SWEEP='0.8,1,1.25'; node scripts/measure-gpu.mjs`
- Browser slot must be exclusive for performance measurements.

## Baseline evidence and limits

HANDOFF.md contains previous passing suites; they are not proof of future
changes. Prior fixed seated GPU sweep: 0.8x 9.57/11.75 ms median/p95; 1x
14.56/16.38; 1.25x 21.96/24.45. New art needs a new measurement.
Current procedural hands remain stylized. No authored replacement exists yet.

## User-owned files — leave alone

.claude/, resume/, resume_linkedin (5)_page-0001.jpg,
scripts/probe-seated.mjs, probe-seated2.mjs, probe-walls-fps.mjs.

## Milestone ledger

| Milestone | State | Evidence / next action |
|---|---|---|
| Durable spec | Committed 09fe88f | Plan, register and pointers |
| Baseline | Captured | scripts/shots/baseline-after-hours-{overview,seat,window}.png |
| Blender pipeline | Implemented | scripts/blender/build_after_hours.py + bake_room.py; editable art/after-hours sources |
| Hero frame | In progress | Real CC0 PBR maps, on/off irradiance, room reflection probe; needs final visual review |
| Winter city | First model integrated | 45,660 triangles / 9 materials, GLB, exterior snow; not accepted yet |
| Authored hands | Not started | Current rig stays until replacement passes |
| Coffee/arrival/audio | Arrival and room foley implemented, browser/audio verification pending | sceneDirector.js + Scan token API; roomAudio.js gesture unlock, persisted mute and foley event bridge |
| Acceptance | Harness prepared, not run | verify-after-hours.mjs; previous shots-studio ran before final material fix |

## Active ownership

Parent: all 3D files, Blender scripts/assets, live ledger. Luna arrival_ui:
Scan.jsx only (completed). Luna asset_support: ASSET-REGISTER.md and downloaded
maps; researching licensed hand rig, no 3D integration. Luna acceptance:
verify-after-hours.mjs and AFTER-HOURS-ACCEPTANCE.md; baseline complete and
browser now owned by acceptance. No Sol used. Texture assets are ~7.34MiB;
eight compact byte/256px lightmaps total 659,558 bytes, successfully rebaked.

Latest built GPU shots completed with no page/console errors: seat median
19.57ms and window 20.91ms at 1.1 DPR. These are transient flow samples, NOT a
controlled benchmark/p95 acceptance. after-hours-seat.png/window.png were
reviewed. Keyboard width is now .48m instead of 1.04m; mouse/mat/rest positions
are aligned. Ceramic mug now has a rolled rim, foot and glaze. The city and
hands still read as authored procedural art; GTA/RDR target is not achieved.

Now built and GPU-captured: reduced-motion snow freeze, correct night-bake
suppression during diagnostic sky loading, high-tier sash reflection (shed
before resolution under sustained load), coffee steam, skinned nail plates,
3mm blind slats and separated book covers/page blocks. Final captures are
after-hours-high-{overview,seat,window,coffee}.png. Coffee capture initially
hung because its Playwright evaluate returned a paused GSAP thenable; fixed
using a block body. That was a harness bug, not an application hang.

After Hours 26/26 measured 1,013,170 core bytes and 11,566,796 enhancement bytes
including maps/bakes. Resource Timing estimates, not immutable bundle sizes.
Core/studio/held regression attempts on forced software scan remain incomplete;
real GPU confirmation is running. Do not publish a full-suite pass yet.

Append concrete edits, commit IDs, owned files, exact next steps and failures
here at each checkpoint. Do not replace pending items with optimistic claims.

### Room audio milestone — 2026-09-20

Implemented in `src/v3/desktop/roomAudio.js`, `cityAudio.js` and `Scan.jsx`:
short synthesized ceramic/cloth/sip foley listens for `workspace:foley` with
`{kind, pan}`, creates an AudioContext only after pointer or keyboard gesture,
persists `v3:room-muted`, and exposes an accessible room sound toggle. Existing
city ambience follows the same mute preference; hidden tabs stop ambience and
suspend/suppress foley. Scan cleanup removes gesture/event listeners, pending
node cleanup timers, and closes the context on unmount.

Unverified: no browser run or listening review has been performed. Parent coffee
timings dispatch lift at 0.6s, sip at 1.95s and setdown at 3.7s; integration and
perceived levels remain to be checked in the parent’s browser slot.
