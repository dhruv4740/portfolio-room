# Handoff to Claude — 2026-09-13

## Read this first

The user stopped the Codex run and requested an immediate handoff. Subagents
are stopped. Preserve the uncommitted working tree. Do not reset to HEAD:
HEAD `1912627` is the earlier shoe-scan prototype, NOT the new modeled room.
Branch: `feat/v3`. Nothing pushed. The latest room changes are uncommitted.

Preview: http://127.0.0.1:4174/#/ (running when handed off).
Screenshot: `scripts/shots/v3-workspace.png`.

## Current direction overrides older plans

The user rejected the shoe placeholder and explicitly requested a properly
generated workspace so desk/monitor interactions can actually be tested.
The live desktop now uses an authored Three.js room, not a downloaded splat.
Do not restore the shoe. Capture sourcing/licensing is not a prerequisite for
this modeled scene. This is an interactive model, not photogrammetry.

The aim remains: impressive, authored portfolio; real desk → monitor → usable
dhruvOS; no generic gradients/glassmorphism, no likeness of the user, clear WORK
path. The modeled room is functional but not a finished cinematic portfolio.

User dislikes long waits, redundant checks and excessive delegation. They have
explicitly selected Claude to continue. Prior Astra/Luna routing was for Codex,
not a requirement that Claude install or delegate to those models.

## Implemented in the working tree

- `src/v3/desktop/buildWorkspace.js`: authored oak desk, monitor/screen texture,
  keyboard, mouse, notebook, lamp, speakers, books, chair, tower, window/blinds,
  pinboard and plant. `WORKSPACE` contains modeled world geometry/anchor points
  and screen dimensions. Static geometry batched by material + anchor ID to
  preserve raycast interaction while reducing draw calls.
- `src/v3/desktop/WorkspaceStage.jsx`: vanilla Three.js renderer, orbit controls,
  real-object first-hit raycasting, accessible projected `.anchor-marker`
  buttons (`data-object=monitor|desk|notebook|window`), camera travel toward the
  actual monitor plane, pause while preparing/inside, cadence telemetry,
  static shadow map. Root has `data-scene="workspace"`.
- `Scan.jsx`: uses WorkspaceStage instead of SplatStage; direct monitor click
  initiates OS entry; secondary anchors open content panels. Phases are room,
  preparing, entering, inside, leaving. OS state survives return/re-entry.
- `DhruvOSScreen.jsx`: existing persistent same-origin iframe bridge now fades
  in at the end of camera travel instead of scaling a panel from screen center.
  Removed developer-facing footer. Entry travels 1.35s; host phase lasts 1.4s.
- `content/index.js`: scene anchors updated and old capture metadata/coordinates
  removed. `Telemetry.jsx` and `ScanIntro.jsx` no longer present shoe/splat loading.
- Existing `os/embed.html` / `public/os/embed.html` bypass external CDN and
  standalone boot/tear, immediately opening Projects. Existing OS remains a
  separate content/style source and needs curation. Gravity needs Matter and
  is not available in the dependency-free embedded path.

`SplatStage.jsx` is retained historical source but no longer imported by Scan.
The normalized-capture rules in older docs concern that renderer, not the new
authored geometry. Do not import old v1/v2 app code. Keep `/work` lightweight.

## Verification: do not overstate

- Latest production build passed.
- A complete intermediate run passed 29/32 checks. Failures were Desk/Window
  sequential marker tests and return focus. Tests now reset between anchors;
  stage now restores marker visibility in a layout effect before return focus.
- Latest rerun was deliberately stopped on user/root instruction: 14 observed
  passes through monitor activation; no full green rerun after final fixes.
- Prior modeled-room run verified OS entry, project interaction, return,
  retained state/re-entry, mobile and static routes. Latest exact final code
  still needs targeted confirmation of the changed tests/focus behavior.
- Latest paint observation: 35.9% lit; four modeled anchor buttons projected.
- Real monitor-mesh click check was requested but not conclusively completed.
- `scripts/shots/v3-results.json` is incremental/partial. Do not call it a
  complete suite result. Screenshots are visual evidence, not GPU benchmarks.
- Real hardware performance, failure recovery, and refined transition quality
  remain unverified. rAF cadence is not GPU duration. Software Chromium can be
  slow; do not convert CPU submission time into FPS.

## Continue here

1. Inspect the live room and screenshot with the user before more visual work.
2. Verify actual monitor mesh click, entry, Escape/Back, return focus and repeat
   entry on final code. Fix specific failures; avoid repeated broad probes.
3. Improve composition/materials/camera handoff and curate the OS destination.
   The screen texture is a static preview, not a live mirrored OS texture.
   Pixel-perfect continuity, return-screen preview, particle dissolve and
   polished warp are not finished. No renderer migration was performed.
4. Fill authentic project evidence/links with user input; do not fabricate it.
5. Review and commit this uncommitted unit locally when ready. No push.

## Commands / environment

PowerShell at `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`.

```text
npm run build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174
node scripts/verify-v3.mjs
```

Check the verifier's BASE configuration before running against a different port.
Direct Vite CLI avoids npm argument stripping seen here. Vite/Chromium process
creation needed elevated execution under Codex's Windows sandbox (spawn EPERM).
Reuse a running server; never launch multiple concurrent heavy browser probes.
Software GPU normally selects WORK; tests explicitly set
localStorage['v3:surface-override']='scan'. Respect the normal capability fallback.

No further implementation was performed after the user requested this handoff.
