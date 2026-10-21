# Overnight report (perf/lighten-room, preview only)

Preview: https://preview.dhruvkothari.pages.dev. Nothing was deployed to production or merged to main.

## Done
| Item | Commit | Notes |
|---|---|---|
| Round 3: pacing, typing cache, dust/vignette/colour grade, window/city/notebook/pen/drawer removed | 0ff0340, 9ff2049, d92b336, e194178 | Numbers in docs/PERF-AUDIT.md "Round 3". |
| Résumé sheet on the desk | face175, 0a3cd4a | Opens the `/resume/` page. Frames: tmp-measure/resume-*.png |
| Cloudflare Web Analytics beacon | 9bd2be6 | Production hosts only; skips `v3:no-track` / `v3:test`. |
| Visit log: D1 + `/api/hit` + token `/stats` | b5fcb63 | docs/ANALYTICS.md. Token only in gitignored-by-location `tmp-measure/stats-token.txt` (not committed). No `?r=`. |
| OS boot fixes | see log | matter/howler removed (no `Matter.`/`Howl` use found); gsap now local `vendor/gsap.min.js` (3.15.0, CDN was 3.12.5); font link non-blocking; `/os/*` cache 1 h revalidate. Three.js importmap still on unpkg (not asked). |
| "What I did" on /work | see log | Facts from public/resume.pdf only; projects with no résumé line (crisiswatch, ecowater) get none. tmp-measure/work-did.png |
| Notepad typing | see log | `public/os/apps/notepad.js`; hint chip, camera ease (relaxes after 4 s). Restore terminal: `USE_NOTEPAD=false` in `public/os/main.js`; drop the ease: `TYPING_EASE=false` in WorkspaceStage.jsx. Frames: tmp-measure/np-real-*.png |
| Touch deep-link card | see log | Coarse pointer + `/os/<app>` or `/phone/<app>` shows name, one-liner, "Try the X demo" button; nothing auto-opens. Restore: `TOUCH_LINK_CARD=false` in Scan.jsx. Frames: tmp-measure/card-before.png, card-after.png |

## Skipped, with reasons
- Extra perf candidates (AA off, pixel ratio 1.0 while moving, Physical to Standard, fewer lights, skip night env probe, contact shadows off, telemetry re-render): the A/B rig was throttled and runs were discarded, so none has trustworthy data; none shipped.
- Per-key dropped frame: not investigated this round; suspects listed in PERF-AUDIT.md.
- Before/after frame sheets and cold-load 1x/4x numbers: not produced.
- OS-app opens inside the iframe are not in the visit log.
- Touch card was checked on one emulated landscape phone only; it overlaps the overview menu there.

## Follow-up round (after the usage reset)
- **"What I did" lines rewritten.** FocusLock and 3D Portfolio now list the stack and the résumé's numbers instead of repeating the card; Blackout trimmed to its distinct facts; Cellbook and Expense Tracker dropped (nothing résumé/PROJECTS-MAP says beyond the card). DarkSentinel (LLM review layer, from the résumé) and BasketProof (636 tests) kept.
- **For the owner: DarkSentinel wording mismatch.** `/work` says "Top 5 at the IIT Madras × BITS Goa hackathon" (card, proof row and `badge` text); the résumé says "Finalist, ... Hackathon 2026, 230+ teams". Neither was changed. Pick one wording.
- **Touch card overlap fixed.** The card is now a centred dialog on a dimmed backdrop, so it no longer sits on the overview menu. Frames of the card itself: tmp-measure/card-portrait.png (375x812) and tmp-measure/card-landscape.png (812x375).
- **Perf candidates re-measured on-screen (d).** The earlier discards came from the off-screen headed window; with `WINPOS=0,0` every run held 60 fps. No candidate beat its base run (AA off, Standard material, fewer lights, no env map, no contact shadows; pixel ratio 1.0 was one drop and one tie). Nothing shipped. Numbers: docs/PERF-AUDIT.md.
- **Per-key dropped frame (e).** No per-key hitch found: after the first key, gaps are the 33 ms of 30 Hz pacing. The only big gaps (134 ms and 83 ms) happen once, right after the first key (notepad window creation plus the camera ease start). Shadows, contact shadows and hand shadow casting were ruled out. Possible fix not built: pre-create the notepad window hidden. Details in docs/PERF-AUDIT.md.

### Round 4 (HUD, typing fps)
- Debug HUD (FR/GPU ms) is off for real visitors: it renders only with `?debug=1` or `localStorage v3:test=1`; the card capture had the test flag set. Moved top-right anyway (`Telemetry.jsx`) so it cannot cover the overview text.
- Typing at 30 fps traced to the OS stylesheet (flicker animation + backdrop blur), not the governor; removed, about 37 to 51 fps while typing. Key/drag motion probe added. Details in PERF-AUDIT.md.
- Not done: first-key hitch (130-180 ms once). Notepad pre-warm did not help, reverted.
- Found, not fixed: `verify-room-interactions` flakes about 1 run in 4-8 with typed text reordered ('hlloe', 'hoell'). Also happens on the build before this round, so it is an existing race in the room-key path (zero-delay typing); real typing speeds are unlikely to hit it.
