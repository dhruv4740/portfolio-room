# Sonnet round 3 report

## Commits
- `c03f49d` — fix(room): make opening the window visible from the seat (test hook + Job 1)
- `e315aeb` — feat(room): the drawer holds the résumé (Job 2)
- (this file) — docs: sonnet round 3 report

Stopped at this commit boundary. Jobs 3a–3h (room polish) were not started — see "Deviations."

## Files changed
- `src/v3/desktop/buildWorkspace.js` — captures static `Box3`s for `monitorScreen`/`monitorBezel`/`desk` at build time (before the batching pass disposes the individual meshes) and exposes them as `staticBoxes` on the returned model, for the test hook's `boxOf()`.
- `src/v3/desktop/WorkspaceStage.jsx` — adds `window.__v3test` (`projectAnchor`, `boxOf`, `timeline`) gated on `localStorage['v3:test']==='1'`; fixes a pre-existing bug where the opened drawer never retracted (see "Deviations").
- `src/v3/desktop/buildRoomInteractions.js` — `DRAWER_CONTENT` now `{title:'RESUME', body:'Dhruv Kothari — open the PDF'}`; the drawer card is redrawn as an A4-ratio (0.21×0.297) paper sheet with six grey placeholder bars instead of prose; window sash glass material tuned (see "Window").
- `src/v3/desktop/Scan.jsx` — drawer button reads RESUME (internal id stays `drawer`); marker label is `Resume`; adds a `.resume-link` anchor to `.seat-exit`, shown via a `.workspace-stage[data-action-state="drawer-open"] ~ .seat-exit .resume-link` CSS rule (mirrors the existing phone-state sibling-selector pattern in the same file).
- `scripts/verify-room-interactions.mjs` — window section now loads with `?sky=night`; the window-visibility diff region is computed from `projectAnchor('windowOpen')` ± 12% instead of a guessed fixed rect; markers/`.seat-exit` are hidden via a toggled `!important` stylesheet class instead of an inline style (which `updateMarkers()` overwrites every frame); adds a day-sky window-visibility pass; adds the résumé-link open/close assertions.

## Commands run

```
npx vite build --outDir dist-sonnet
```
```
dist-sonnet/assets/three-DS9Eo_1D.js             563.53 kB │ gzip: 141.74 kB

✓ built in 458ms
```

```
BASE=http://localhost:4174 node scripts/verify-v3.mjs
```
```
PASS  scan: return screenshot captured — v3-scan-return.png
PASS  scan: return keeps the OS instance — 1 iframe(s)
PASS  scan: return restores marker focus — Monitor — READY
PASS  scan: repeated entry retains app state — 1 decoded card(s)
PASS  scan: escape from inside returns to room — room
PASS  scan: escape exit restores marker focus — Monitor — READY
PASS  scan: no console errors — clean
PASS  touch: serves the deck — deck=1
PASS  touch: does NOT serve the scan — stage=0
PASS  touch: no console errors — clean

36/36 passed
```

```
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
```
```
PASS idle lamp off
PASS idle drawer open
PASS resume link visible with correct href/target/rel while drawer open
PASS resume link hidden after closing the drawer
PASS idle blinds open
PASS idle window open (night)
PASS window visibility diff share (night) 0.7611282432148796
PASS idle window closed (night)
[...audio tests 1–4b, all PASS...]
PASS all room controls, depletion, cold/warm keyboard, no page errors
PASS window visibility diff share (day) 0.3408947801798602
PASS sky=day loaded without page errors
PASS sky=dusk loaded without page errors
PASS sky=night loaded without page errors
```

```
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
```
```
phone idle 0
focuslock passed
extension passed
notebook idle 0
notebook returned []
```
(No error lines; this script has no explicit "PASS all" line — the above is its full output.)

```
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```
```
{"skyState":"night","wall":0.36354906073936916,"clipped":0,"errors":[]}
{"skyState":"dusk","wall":0.4247995150884547,"clipped":0,"errors":[]}
{"skyState":"day","wall":0.5905688671295606,"clipped":0,"errors":[]}
```
Identical to round 2's numbers — Job 1/2 made no lighting change, as expected.

`scripts/verify-room-polish.mjs` was not created — Jobs 3a–3h were not started (see "Deviations").

## Window
Round 2's 31.4% "pass" was not measuring the window: it loaded the room with no `?sky` override (so both shots could land on whatever the wall clock's sky state was) and diffed a screen-space rectangle picked by eye, which mostly captured marker-label text moving, not the sash.

Fixing the test first, at the round-2 code (before any round-3 geometry change), with `?sky=night` pinned and markers/`.seat-exit` correctly hidden via `projectAnchor('windowOpen')` ± 12%:
- night: **0.537** diff share (≥ 0.03 required) — already passing.
- day: **0.337** diff share — already passing.

This means round 2's actual geometry fix (sash meshes biased 0.09m in front of the blind slats, `b2c65d3`) was working; only round 2's *test* was broken. A manual cropped screenshot comparison (region only, not full-frame) confirms a real, visible change: the sash's vertical frame catches a distinct highlight edge against the still-closed blinds when open, that is absent when closed.

I attempted the prompt's specific glass-material spec (`MeshPhysicalMaterial`, `transmission:0, roughness:0.05, metalness:0, opacity:0.28, color:'#b9d3e8'`) as a further visual improvement. It caused the measured diff to collapse to exactly 0 (both screenshots pixel-identical in the window region) for a reason I could not diagnose within budget — no page error was thrown, the room rendered normally, and `windowOpen` state still flipped correctly, so the regression is specific to that material somehow making the render indistinguishable open vs. closed. I reverted to a `MeshStandardMaterial` close to the same spec (`color:'#b9d3e8', roughness:0.05, metalness:0.2, opacity:0.28, transparent:true, depthWrite:false`), which measured even higher (0.761 night / 0.341 day) than the original round-2 material. Final numbers above are with this material.

Screenshots: `scripts/shots/window-closed-night.png`, `window-open-night.png`, `window-closed-day.png`, `window-open-day.png`. Looked at all four: the full-frame view does not make the difference obvious to the eye (the window occupies a small corner of a 1440×1000 frame), but a cropped comparison of just the anchor region does show a real, if subtle, highlight change.

## Numbers

| check | before | after | threshold |
|---|---|---|---|
| window diff share, night | 0.537 (already passing, test was broken) | 0.761 | ≥ 0.03 |
| window diff share, day | 0.337 (already passing, test was broken) | 0.341 | ≥ 0.03 |
| verify-v3 | — | 36/36 | 36/36 |
| verify-held-objects | — | clean, no errors | clean |
| measure-sky night wall | 0.3635 | 0.3635 (unchanged) | 0.33–0.42 |
| measure-sky dusk wall | 0.4248 | 0.4248 (unchanged) | — |
| measure-sky day wall | 0.5906 | 0.5906 (unchanged) | day ≥ 1.6×night |

## Screenshots to review
- `scripts/shots/window-closed-night.png` → `window-open-night.png` — full seated frame, night; look at the top-right window/blinds region for the highlighted sash edge (subtle at this scale).
- `scripts/shots/window-closed-day.png` → `window-open-day.png` — same, daytime sky.

## Deviations
- **Jobs 3a–3h not started.** The prompt explicitly permits stopping at a commit boundary and listing unstarted jobs here rather than leaving one half-done. Given the remaining budget after the test hook, Job 1, and Job 2 (including one unplanned bug fix — the drawer-never-closes issue below — and one reverted material experiment), there wasn't room to do 3a's per-object hand-grip audit (nine rows, each requiring a measured Playwright harness plus a fix) and the seven single-purpose jobs after it credibly. Starting any of them without finishing risked leaving `verify-room-polish.mjs` and its screenshots in a half-built state, which the prompt says not to do.
- **Fixed a bug outside the two named jobs**: the drawer never retracted after opening (Escape / BACK TO SEAT / selecting another object all left it open forever), because its `end()` handler nulled `extraHeld` immediately on open, bypassing `fly()`'s existing `returnExtra()` retraction path that every other held object (phone, notebook, coffee, award, headphones) relies on. This was invisible before because round 2's test only pressed Escape after opening the drawer without asserting it closed. Fixing it was required for Job 2's "close → link gone" acceptance test to be meaningful at all — without it, the drawer stays open and the résumé link stays visible regardless of what the test does. Filed under Job 2's commit since it's inseparable from that acceptance test.
- **`MeshPhysicalMaterial` glass spec not used** — see "Window" above. Reverted to a close `MeshStandardMaterial` equivalent after the physical material caused the measured diff to collapse to 0 for an undiagnosed reason.
- Window-region rect is still not a literal camera-projection of the anchor from the Playwright side — it now IS a camera projection, computed in-page via the new `window.__v3test.projectAnchor()` hook and read into Node via `page.evaluate()`. This resolves the deviation noted in the round 2 report.

## Requests for the orchestrator
- `public/resume.pdf` does not exist yet; the résumé link points at `/resume.pdf` and will 404 until that file is added. Per the prompt, I did not create it.
- Jobs 3a–3h (room polish) remain to be assigned in a follow-up pass — see "Deviations" for why they weren't attempted this round.
