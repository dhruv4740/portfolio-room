# Round 3 — Sonnet: window that visibly opens, résumé drawer, room polish

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. Where this
prompt makes a decision, follow it. If a step is impossible as written, skip
only that step, finish the rest, and explain it under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
Vanilla three.js room (no r3f), React 19, GSAP, Playwright.

## Parallel work — read first

The other agent (Gemini) is working on the in-monitor OS and the phone's DOM
screen at the same time.

| Owner | Paths you may create, edit, delete or stage |
|---|---|
| **You** | `src/v3/desktop/**` **except** `PhoneScreen.jsx`; `scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs`, `scripts/verify-room-polish.mjs` (new), `docs/review/sonnet-round3.md` |
| Gemini | `public/os/**`, `src/v3/content/index.js`, `src/v3/desktop/PhoneScreen.jsx`, `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs` |

- Never edit, stage, revert or delete outside your row. Needed changes go under
  "Requests for the orchestrator" with exact text.
- Stage by explicit path. Never `git add -A`, `git add .`, `git commit -a`,
  `git stash`, `git reset`, `git checkout -- <path>`, `git commit --amend`.
- Git lock: if `.git/index.lock` exists, wait 10 s and retry up to 6 times.
  Never delete it.
- Build and serve only: `npx vite build --outDir dist-sonnet` and
  `npx vite preview --outDir dist-sonnet --port 4174 --strictPort`. Never `dist/`,
  never port 4173. Run every script with `BASE=http://localhost:4174`.
- Gemini is adding a `.ps-app-focuslock` icon to the phone home screen; the
  Instagram icon keeps class `.ps-app`. Do not depend on anything else in the
  phone DOM.
- No new dependencies, no downloaded assets, no CDN. Render-on-demand; bounded
  animations only; idle = zero frames. `shadowMap.needsUpdate = true` only in
  `setSky` or once after a geometry/light change you make at build time.

## Order and scope

This is a long job. Do it strictly in this order: Test hook → Job 1 → Job 2 →
3a → 3b → 3g → 3h → 3c → 3f → 3d → 3e. Commit after each job. If you run out of
budget, stop at a commit boundary, write the report, and list the jobs not
started under "Deviations". Never leave a half-done job uncommitted or broken.

## Round 2 problem you are fixing first

`window-closed-night.png` and `window-open-night.png` are identical at the
window. Two reasons: (a) `verify-room-interactions.mjs` loads the room without a
sky override, so on a daytime clock both shots are **day**; (b) the diff
rectangle was a fixed screen rectangle you picked, and the 31% it measured came
from marker labels changing, not the window. Opening the window is still
invisible from the seat.

## Test hook (do this first, commit with Job 1)

In `WorkspaceStage.jsx`, when `localStorage['v3:test'] === '1'`, expose
`window.__v3test` with:
- `projectAnchor(id)` → `{x, y}` in CSS pixels of the canvas for
  `WORKSPACE.anchors[id]` projected with the current camera;
- `boxOf(name)` → `{min:[x,y,z], max:[x,y,z]}` world `Box3` of a named object
  (`phone`, `monitorScreen`, `monitorBezel`, `desk`, `coffeeMug`, `handL`, `handR`,
  and the object held in the current action as `held`);
- `timeline()` → the active action's GSAP timeline or `null`.
Never expose it otherwise.

## Job 1 — the window opens visibly (commit: `fix(room): make opening the window visible from the seat`)

1. Fix the test first. In `verify-room-interactions.mjs` the window section loads
   `${BASE}/#/?sky=night`, sits, then **hides every marker and label** before each
   screenshot (`document.querySelectorAll('.scan-marker, .seat-exit').forEach(e => e.style.visibility = 'hidden')`
   — find the real marker class names in `Scan.jsx`/`WorkspaceStage.jsx` and use
   those), takes the closed shot, opens the window, waits for the action to
   finish and the camera to return, hides markers again, takes the open shot.
   The diff region is `projectAnchor('windowOpen')` ± 12% of the image
   width/height, computed **after** the camera returns. Threshold stays ≥ 3%.
   Run it at HEAD before changing anything and paste the number (expected: well under 3%).
2. Find why the open sash is invisible from the seat: check whether the sash
   is behind the blind slats, outside the wall plane, culled, too small
   in view, or visually identical to the closed state because the glass and the
   gap render the same. Write the finding in the report.
3. Fix it so the open state is obvious. All of these:
   - the sash slides and is rendered in front of the blinds (move the sash, not the blinds);
   - the opening shows a clear difference: when open, the gap has no glass
     (the skyline texture seen through the gap is brighter/unfiltered), and the
     glass pane on the sash has a visible reflection (`MeshPhysicalMaterial`,
     `transmission 0`, `roughness 0.05`, `metalness 0`, `opacity 0.28`, `transparent true`,
     colour `#b9d3e8`) so the moving pane reads as glass;
   - the blinds sway tween from round 2 stays.
4. Acceptance: diff ≥ 3% with markers hidden, at night. Also save
   `window-closed-day.png` and `window-open-day.png` with `?sky=day` and assert ≥ 3% there too.

## Job 2 — the drawer is the résumé (commit: `feat(room): the drawer holds the résumé`)

1. Visible names: marker label `Drawer` → `Resume`; the seat button text
   `DRAWER` → `RESUME` (keep the internal id `drawer` everywhere).
2. `DRAWER_CONTENT` in `buildRoomInteractions.js` becomes
   `{ title: 'RESUME', body: 'Dhruv Kothari — open the PDF' }`. Redraw the card as a
   paper sheet: A4 ratio plane (0.21 × 0.297 m, scaled to fit the drawer),
   off-white `#f4f1ea`, the title in bold at top, then six grey placeholder
   text-lines drawn as thin `#c9c4b8` bars (not words), lying flat in the drawer.
3. When `actionState === 'drawer-open'`, show a DOM link inside `.seat-exit`:
   `<a class="resume-link" href="/resume.pdf" target="_blank" rel="noopener">OPEN RESUME (PDF)</a>`,
   styled like the other seat buttons but using the accent colour. Hidden in any other state.
   `public/resume.pdf` does not exist yet — the orchestrator adds it later. Do not create it.
4. Test in `verify-room-interactions.mjs`: open the drawer → the link is visible,
   `href` ends with `/resume.pdf`, `target` is `_blank`, `rel` contains `noopener`;
   close → link gone.

## Job 3 — room polish (one commit each, in this order)

Create `scripts/verify-room-polish.mjs` (Playwright, `v3:test` set, 1440×1000,
`reducedMotion: 'no-preference'`) and add each check below to it as you go.
Every job: take the "before" screenshot at HEAD first, then "after", both paths
listed in the report.

### 3a `fix(room): every object is actually held by a hand` (split into one commit per object if large)

The orchestrator audited screenshots of every interaction. Older shots
(`scripts/shots/seven-*.png`, `seventh-body-*.png`, `fifth-notebook.png`) show
the problems below; some may already be fixed at HEAD. For **each** item: take a
fresh HEAD screenshot at the listed moment first (`audit-before-<id>.png`),
write in the report whether the problem is present, then fix it and take
`audit-after-<id>.png`.

| id | Interaction | Problem seen | Required result |
|---|---|---|---|
| notebook-held | NOTEBOOK, fully raised | Notebook floats in front of the camera; hands are off its edges (one below it, one off-screen) | Both hands grip the notebook's left and right edges at mid-height, thumbs on the front face, fingers behind; the notebook doesn't cover the hands |
| notebook-mid | NOTEBOOK, 50% of the lift | Notebook flies in from the top right with no hand on it, and one hand stays on the keyboard | The right hand reaches, picks it up from the desk and carries it; the left hand joins by 70% |
| coffee-sip | COFFEE, at the sip | Mug floats and fills the lower-left of the view, clips the keyboard, and has no hand on the handle; the rim edge looks jagged | Right hand's fingers through or around the handle for the whole lift; the mug never intersects the keyboard; rim segments ≥ 48 |
| award-held | AWARD, held | A brown open-ended tube (a hand-less forearm or sleeve) comes up from the bottom right; the left hand clips into the keyboard | A proper hand holds the frame's lower edge; no open mesh ends visible; the idle hand rests on the desk, not inside the keyboard |
| phone-mid | PHONE, 50% of the lift | Phone passes over the left speaker and near the monitor; the hand is under it | Covered by 3b for the path; the hand wraps the phone's side at every sample |
| drawer-open | DRAWER open | A long arm lies across the desk and mousepad through the desk edge; the body sits in view and the room void shows behind | The arm reaches down to the drawer handle below the desk edge without intersecting the desk, and returns to rest when open; the void is covered by 3g |
| typing | KEYBOARD / live typing | Hands hover above the keys; fingertips never touch | Fingertip `min.y` within 0–4 mm above the keycap tops at a key press, and the pressed key moves down 2 mm and back |
| lap-look | Seated, look straight down | Camera is inside the torso: arm cylinders come out of the top edge, and the chair ring fills the view | Clamp seated pitch so the camera never goes inside the body's bounding box, or hide torso and arm meshes whose box contains the camera; forearms never look cut open |
| headphones | HEADPHONES | Headphones vanish from the desk with no visible result from the seat | Show them on: a headband arc briefly swings past the top of the view and ends worn (out of view), with a small persistent "HEADPHONES ON" state readout; taking them off puts them back on the stand |

Measured checks in `verify-room-polish.mjs`. For each hand action (notebook,
coffee, award, phone, drawer, headphones, typing): sample the action timeline at
20 evenly spaced progress points (`timeline().progress(p)` then one render), and
for each sample assert:
- `handL`/`handR` box `min.y >= desk.max.y - 0.004` unless the hand is below the
  desk-edge plane for the drawer reach;
- while an object is held, the holding hand's box intersects the held object's
  box expanded by 1 cm (the hand is on the object);
- no hand or arm mesh intersects `monitorScreen`, `monitorBezel` or the keyboard
  body box, except fingertips during typing.

Add hand/arm mesh names to `boxOf` as needed (`armL`, `armR`) and list them in
the report.

### 3b `fix(room): phone clears the monitor when lifted`
Sample the phone pick-up and zoom timelines at 30 points; assert the `phone`
box never intersects `monitorScreen` or `monitorBezel`. Fix the phone's path
(lift height / arc / waypoint), not the monitor position.

### 3c `feat(room): coffee looks like coffee`
- liquid colour `#2a170c`, `MeshPhysicalMaterial` roughness 0.18, clearcoat 0.6;
- a crema ring: a thin torus or ring at the liquid's edge, colour `#8a5a36`,
  width 12% of the liquid radius;
- the liquid top sits 6 mm below the rim when full and keeps the existing
  depletion behaviour;
- the inside of the mug is darker than the outside (separate inner wall material `#1b1b1b`).
Screenshot close-up `coffee-close.png` (select coffee, seated).

### 3d `feat(room): make SIT the obvious first action`
In the standing/orbit view, the `SIT` marker is small. Make it the primary call
to action: label `SIT DOWN`, min height 44 px, padding 12px 22px, background the
accent orange already used for `MODELED REALTIME`, dark text, 13 px mono,
letter-spacing .16em, and a pulse of 2 cycles (scale 1 → 1.06 → 1, 0.9 s each)
the first time it appears, then static. Respect `prefers-reduced-motion` (no pulse).
Screenshot `sit-cta.png`.

### 3e `feat(room): collapse the seat controls`
The bottom-left control bar (`.seat-exit`, NOTEBOOK … STAND UP / ESC) takes too
much space. Make it collapsible:
- collapsed by default into one button `CONTROLS ▸` at the same position;
  expanded shows the full bar and the button reads `CONTROLS ▾`;
- `aria-expanded` on the toggle; the expanded state is remembered in
  `sessionStorage['v3:controls']`;
- `STAND UP / ESC` stays visible even when collapsed (keep it next to the toggle);
  Esc key still stands up;
- the `OPEN RESUME (PDF)` link from Job 2 is visible whenever the drawer is open,
  even if collapsed.
Update every test you own that clicks those buttons (`verify-room-interactions.mjs`,
`verify-held-objects.mjs`, `verify-v3.mjs`) to expand first via the toggle.
Screenshots `controls-collapsed.png`, `controls-expanded.png`.

### 3f `fix(room): poster reads as a framed poster`
In the seated view the "MAKE IT REAL." poster merges with the wall and with the
page masthead (the DOM `Dhruv Kothari / FULL-STACK DEVELOPER` header is drawn on
top of it — see `scripts/shots/sky-seated-night.png`). Do both:
- poster: a 12 mm dark frame (`#1c1c1c`), 8 mm off the wall, and a thin
  white mat (8 mm) between frame and print;
- masthead: while `seated` is true, fade `.scan-head` to `opacity 0` over 0.3 s
  and `pointer-events: none`; restore on stand-up.
Screenshot `poster-seated.png`.

### 3g `fix(room): close the room behind the camera`
When seated and dragging to look around, and in close-up reads, the camera sees
black void where the room has no walls. Add the missing walls and ceiling so
**from inside** every direction shows room, but the orbit (standing) view keeps
its open cutaway: the added faces use `side: THREE.FrontSide` with normals
pointing into the room, so they are back-face culled from outside. Match the
existing wall material and colour. Acceptance: seated, set the camera yaw to
0°, 90°, 180°, 270° via the drag controls (or the test hook), screenshot
`look-<deg>.png` each, and assert fewer than 2% of pixels are pure black
(`max channel <= 6`). The orbit screenshot must still show the cutaway
(`orbit-after.png` next to `scripts/shots/sky-orbit-night.png`).

### 3h `fix(room): calmer, believable lighting`
Current problems: a hard-edged lamp cone and a hot white patch on the keyboard at
night; a flat blue-grey cast by day.
- desk lamp spotlight: `penumbra 0.75`, `decay 2`, reduce `angle` so the pool
  covers the keyboard and notebook but not the monitor base;
- keyboard hot spot: clipped pixels inside `projectAnchor('keyboard')` ± 8% must be ≤ 1%;
- day: hemisphere sky colour warmer (`B <= 1.05 × R`), keep the round-2
  `measure-sky` ratios passing (`day ≥ 1.6× night`, dusk in between, clipped ≤ 2%);
- night wall luminance may now change but must stay within 0.33–0.42.
Rerun `measure-sky.mjs` and paste before/after.

## Verification you must run and paste (last 8 lines each)

```
npx vite build --outDir dist-sonnet
BASE=http://localhost:4174 node scripts/verify-v3.mjs
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
BASE=http://localhost:4174 node scripts/verify-room-polish.mjs
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```

Look at every screenshot you produced before reporting.

## Report — `docs/review/sonnet-round3.md`, committed last (`docs: sonnet round 3 report`)

```
# Sonnet round 3 report
## Commits               (hash — subject)
## Files changed         (path — purpose)
## Commands run          (command + last 8 lines verbatim)
## Window                (why it was invisible; diff at HEAD vs after, night and day)
## Numbers               (table: check | before | after | threshold)
## Screenshots to review (before → after pairs, one line each, what to look for)
## Deviations
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted. Do not describe a
screenshot you did not open.
