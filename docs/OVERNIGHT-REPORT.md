# Overnight report (perf/lighten-room, preview only)

Preview: https://preview.dhruvkothari.pages.dev. Nothing was deployed to production or merged to main.

## Morning summary
**On preview (branch perf/lighten-room):** typing in the room is smoother (OS flicker animation and blur removed, about 37 to 51 fps while typing) and no longer scrambles fast typing; a Notepad is the typing target; "Try my live apps" is the first option on the room overview and a live-app row sits at the top of /work; phones get a link card instead of a broken deep link; the og.jpg and "What I did" lines are new; analytics (Cloudflare beacon plus a D1 visit log) only count the exact production host `dhruvkothari.pages.dev`, so preview and per-deploy URLs are ignored. All 13 suites pass on the final build; I click-tested /#/os/darksentinel, /#/phone/basketproof and the /work hero button at 375 px (touch card) on preview.

**Owner decides:**
1. DarkSentinel wording: "Top 5" or "Finalist".
2. Whether to deploy to production (nothing is on production or main yet).
3. Eyeball the visual changes listed in "Visual changes for the owner to eyeball" below (screenshots in `C:/Users/hp/AppData/Roaming/Claude/side-session-notes/local_f9d3536a-6c78-4903-a9f2-ede888503fe7/shots/`), including the new overview option and /work box; `LIVE_APPS_HERO` in `src/v3/lib/features.js` turns the latter off.

**Known open items:** the first key typed in the room still shows one 130-180 ms gap (GPU raster of the OS iframe layer; not fixed, see PERF-AUDIT.md). `idle('blinds open')` failed once in ~46 runs and did not reproduce (check now retries). Preview was not re-tested on a real phone, only an emulated 375 px touch context.

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

### Round 5
- Scrambled typing ('hlloe') fixed. Cause: the notepad called `textarea.focus()` when opened by the first room key, which moved real browser focus into the OS iframe. The next real keystrokes then typed natively into the textarea while the earlier keys were still queued as postMessages, so the late messages landed after them. Notepad now skips the focus while the OS is in the `room` state (`public/os/apps/notepad.js`). `verify-room-interactions`: 22 runs, no reordering. One unrelated failure in 12 runs: `idle('blinds open')` (the render-count-stays-flat check after the blinds tween), not seen before this round and not investigated.
- First-key gap traced, not fixed: see PERF-AUDIT.md ("First-key hitch, traced"). It is GPU raster of the OS iframe layer (plus a one-off AudioContext creation if the first gesture is a key).
- Touch card re-captured with the debug HUD off. It showed a second overlap: the "MUMBAI 07:05 CLEAR" chip sat on "More: live apps, phone demos". Hidden under 640 px wide (`Scan.jsx`).
- Full suite on the final build (before deploy): verify-v3 46 pass, room-interactions 9, held-objects 2, reduced-hands 1, hand-support 1, phone-grip 0 asserts (exit 0), after-hours 27, deeplinks 14, tour 18, os-apps 21, focuslock-app 29, after-hours-audio 32, touch-look 4. All 13 exit 0.

### Visual changes for the owner to eyeball
Screenshots are in `C:/Users/hp/AppData/Roaming/Claude/side-session-notes/local_f9d3536a-6c78-4903-a9f2-ede888503fe7/shots/` (outside the repo).
- Notepad as the room-keyboard typing target (before: a terminal): `typing-before.png` (live site) vs `typing-after.png` (this build). Same screenshots show the OS top bar and taskbar.
- crt-flicker animation and top bar/taskbar backdrop blur removed (barely visible; was an 0.012-opacity teal flash every 8 s): visible only as the typing pair above; the gain is frame rate, 37 to 51 fps while typing.
- Touch link card for `/os/<app>` and `/phone/<app>` on phones: before `card-before.png`, after `card-after.png`; current clean captures `card-portrait-hudoff.png`, `card-landscape-hudoff.png`.
- Mumbai readout hidden on narrow phones: compare `card-portrait-hudoff.png` with the earlier portrait capture (readout over the "More" line).
- og.jpg (link preview image): `og-before.jpg` vs `og-after.jpg`.
- Debug HUD moved top-right (only with `?debug=1`).
- "What I did" lines on the work cards, hint chip and camera ease when typing, résumé sheet: no before/after captures taken.

### Round 6
- `idle('blinds open')`: not reproducible. 12 further runs plus a 75 s render-count watch of the idle seated room (0 draws) found no periodic render; the one failure in about 46 runs looks like a single stray draw (probably the pixel-ratio governor re-evaluating) landing in the 1.5 s window. The check now restarts its wait up to 3 times, so a scene that keeps drawing still fails.
- "Use my real apps" push, behind `LIVE_APPS_HERO` in `src/v3/lib/features.js` (set false to restore the old overview and /work):
  - Room overview: new top option "Try my live apps" (light button, same action as the old "Live apps on the computer", which is hidden from the "More" list while the flag is on; that list is now "More: phone demos"). Guided tour and Look around unchanged.
  - /work: a "Try my real apps" box under the intro with FocusLock (`/#/os/focuslock`), DarkSentinel (`/#/os/darksentinel`) and BasketProof (`/#/phone/basketproof`). On phones these open the touch link card.
  - Suites after the change: deeplinks, tour, v3 and room-interactions all exit 0.
- Eyeball list additions (`C:/Users/hp/AppData/Roaming/Claude/side-session-notes/local_f9d3536a-6c78-4903-a9f2-ede888503fe7/shots/`): `hero-overview-desktop-before/after.png`, `hero-overview-375-before/after.png`, `hero-work-desktop-before/after.png`, `hero-work-375-before/after.png`.

### Round 7
- Analytics host check is now exact (`dhruvkothari.pages.dev`) in `index.html`, `resume/index.html`, `analytics.js` and, server-side, `functions/api/hit.js` (204 for any other host). Before, any subdomain matched, so preview visits would have counted.
- D1: one test row (a preview check of `/#/os/focuslock`) deleted; the table is empty.
- Preview click-test: `/#/os/darksentinel` opens DarkSentinel on the monitor, `/#/phone/basketproof` opens BasketProof on the phone, the /work DarkSentinel button at 375 px shows the touch card. Captures: `click-*.png` in the shots folder.
- Full suite, final build, all exit 0: verify-v3 46, room-interactions 9, held-objects 2, reduced-hands 1, hand-support 1, phone-grip 0 asserts, after-hours 27, deeplinks 14, tour 18, os-apps 21, focuslock-app 29, after-hours-audio 32, touch-look 4.

## Round 8+

### A. Night only (one revertible commit)
The room is locked to the night look: `resolveSkyState()` always returns `night`, the live Mumbai weather fetch is gone from the room (fixed clear-night haze instead), and the dusk/day skyline textures and sky configs are no longer built. `/work` still shows its own Mumbai clock/weather line.
Measured (cold.mjs, fresh profile, `/?sky=night`, 3 runs): reveal before 3188/2974/3211 ms, after 2937/3186/3805 ms; programs 33 both. Seated (steady.mjs): fps 58 before vs 55.7-57.4 after, gpuMed 7.9-9.8 vs 7.7-12.2 ms, within the run-to-run noise of this iGPU. So it is neutral for speed; it removes code and the day/dusk look. Suites: v3 45/45, after-hours 26/26, deeplinks pass. Revert: `git revert` the "night only" commit.

### 1. Redesign mockups
Eight small static frames at `/mockups/` (index grid, one-line caption each): four colour/type directions (amber serif, monitor cyan mono, paper editorial, moonlight sans), two room overlays over a real night screenshot, two /work layouts (ledger, sticky split). Real content only; no build step. Source: `public/mockups/`.

### 2b. Baked lighting (not started as a new prototype)
The static room is already baked: walls and floor use per-surface lightmaps with lamp on/off variants (`public/materials/after-hours/baked-true-scale/*`, `afterHours.js` bake promise). What is not baked is the desk and props, which need a new Blender bake pass (Blender 5.2 is installed here). Deferred behind motion quality, which is the owner's top complaint; the flag-and-A/B step is still open.

### 3. Motion quality (first pass)
Audited with `scripts/shots-hand-items.mjs` (frame sheets plus wristDeg and desk-penetration probe; it now targets the markers by `data-object`, since the old Notebook/Pen markers are gone). Sheets: shared notes `shots/hands-phone.png` (before) and `hands-phone-after.png`.
- **Phone reach bent the wrists and bunched the sleeve.** `PHONE_LEAN` sank the torso 8 cm (`y: -0.08`), which the hand solver compensated for with a 37-42 degree right wrist and a large sleeve fold. Set `y` to 0 (a seated torso does not sink). Wrist during the reach: right 37-42 to 19-22 degrees, left 26-47 to 14-33. Frames show a straight forearm reaching, not a folded one.
- **Cold-open camera had a pop.** The last segment of the arrival was linear (`ease: 'none'`) right after a sine ease that ends at zero speed, so the camera jumped to full speed, then stopped into the settle tween. Now `sine.inOut`.
- **Audit result for the rest:** every hand and object reach tween in `WorkspaceStage.jsx` already uses a power2 or power3 in/out ease; the only linear ones left are clocks, not motion.
- **Fixed after review (wrist and sleeve).** (1) Elbow cover now clamps above the desk top when it hangs over or just off the desk edge (`deskBox` in `seatedHands.js`); the left sleeve was 15 mm into the desk at 0.9-1.6 s, now 0 mm at every sampled frame. (2) Left wrist at the final phone grip was 64 degrees; the back grip is now pitched 35 and yawed -30 degrees and the left elbow follows the hand axis while gripping (`FOLLOW`), giving 23 degrees with 0 verts inside the phone. wristDeg left/right at 0.5/0.9/1.2/1.6/2.0/2.6/3.0 s: 27/12/12/28/21/23/23 and 23/19/19/19/21/24/24. (3) Award and coffee frames eyeballed (6 frames each, `hands-award-b.png`, `hands-coffee-b.png`): no visible clipping, the nonzero skin-vertex counts are fingers wrapping the held object's loose box. Cold-open camera before/after in `coldopen-before-after.png`: the linear run into the settle is now eased; the old build is also the day-lit look. Suites held-objects, reduced-hands, hand-support, phone-grip, room-interactions pass.

### Unit 4: case studies
- Five case studies (Blink growth tools, FocusLock, DarkSentinel, Blackout, 3D Portfolio) as `caseStudy {problem, decisions, result}` in `src/v3/content/index.js` (Blink on `experience[0]`), 108-130 words each, facts only from the content file, résumé and `docs/PROJECT-MATERIAL.md`. Shown as a "Case studies" accordion on /work; Ask reads them (`knowledge.js` now includes experience case studies).
- Screenshots: FocusLock, DarkSentinel and 3D Portfolio use existing images. Blink and Blackout have no real screenshot in the repo, so none is shown rather than a fake.

### Phone grip approach
- The left hand now reaches to the phone edge-on (side grip) instead of palm-down on top, then rolls under to the back grip (`WorkspaceStage.jsx`: reach target and `followPhone` blend SIDE to BACK; roll-in table indexed on its second half). wristDeg at 1.0-2.4 s: 5/19/23/23/22/20 (was 12/24/28/27/21/22), sleeve 0 mm, 0 verts in phone. Before/after frames: `phone-grip-before-after.png` in shared notes (top row before). Suites phone-grip, held-objects, hand-support, reduced-hands pass.

### Unit 5: room-tour video
- `scripts/record-tour.mjs` records the app's own guided tour (launchpad "Take the guided tour", 59 s, 960x540, muted) from a CDP screencast piped to Playwright's bundled ffmpeg, which can only encode VP9 (no H.264, no VP8 decode), so the output is `public/media/room-tour.webm` (1.6 MB) with `room-tour.jpg` poster and no MP4. /work shows it under "Room tour" (`TourVideo` in `Work.jsx`): `preload=none`, source set only when scrolled near, muted loop, no autoplay under reduced motion. Length is 59 s rather than 45 s because that is the existing tour's length. Sampled frames at 3/10/20/30/40/50 s show the room, monitor demos and phone.

### Unit 6: live GitHub proof
- `functions/api/proof.js` reads the public GitHub REST API unauthenticated (repo stats and 3 latest commits for focuslock, blackout, expense-tracker, portfolio-room), caches 6 h in `ASK_KV` (`proof:v1`), serves the last good copy if GitHub fails or rate-limits, returns an empty list otherwise. No secrets. /work shows "Live from GitHub" (`GithubProof`, renders nothing on failure). `node scripts/test-proof.mjs` covers cache hit, stale fallback and empty fallback.

### Unit 7: phone contact
- New "Message" app on the room phone (`phone-apps/ContactApp.jsx`, wired in `PhoneScreen.jsx`): rings, Answer, short form, sent screen, mailto fallback. `functions/api/contact.js` validates, caps, honeypots, saves to `ASK_KV` and emails via Resend only if `RESEND_API_KEY` is set. Checked end to end locally with `wrangler pages dev` (call, form, sent screens in a screenshot). `scripts/test-contact.mjs` passes; held-objects suite passes. Owner step: add `RESEND_API_KEY` (see `docs/CONTACT.md`). Cloudflare Email Routing was not used (no custom domain).

### Unit 8: case-file PDFs
- `scripts/build-casefiles.mjs` (run by `npm run build`) prints one A4 page per case study (problem, decisions, result, what broke where the content has it, screenshot, stack, links) with Playwright Chromium to `public/casefiles/<id>.pdf` (blink, focuslock, darksentinel, blackout, portfolio3d; 33-152 KB each). The PDFs are committed; if Chromium is missing at build time the script keeps them and exits 0. Each case study on /work links its PDF. Checked: 1 page each, FocusLock page rendered and read.
