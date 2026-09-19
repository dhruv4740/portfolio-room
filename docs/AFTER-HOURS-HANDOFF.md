# After Hours — live continuation ledger

## Current checkpoint

2026-09-20: owner authorized execution. Documentation saved before any new
implementation. Blender 5.2.2 LTS verified. **Realism upgrade not implemented
yet.** See AFTER-HOURS-PLAN.md for approved scope and agent restrictions.

Branch feat/v3. Baseline commit fce4507: flatter procedural hands, continuous
mesh, readable phone stage, four real desktop demos. Existing room still uses
mostly procedural shapes/materials and an illustrative city. Do not describe
it as achieving the GTA/RDR realism target.

## Next exact actions

1. Commit documentation checkpoint.
2. Parent inspect/capture baseline and establish Blender export/bake pipeline.
3. Delegate bounded support to Luna with exclusive files; no 3D delegation.
4. Complete seated night hero frame before adding cinematic embellishments.

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
| Durable spec | Written, pending commit | This document + plan + register |
| Baseline | Existing evidence | Preserve fresh hero views |
| Blender pipeline | Installed, not integrated | Author editable scene/export script |
| Hero frame | Not started | Geometry/material/lighting upgrade |
| Winter city | Not started | Replace illustrative facade planes |
| Authored hands | Not started | Current rig stays until replacement passes |
| Coffee/arrival/audio | Not started | Preserve working controls |
| Acceptance | Not run for new work | Functional + visual + GPU required |

Append concrete edits, commit IDs, owned files, exact next steps and failures
here at each checkpoint. Do not replace pending items with optimistic claims.
