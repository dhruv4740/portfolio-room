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
