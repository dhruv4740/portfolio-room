# Round 2 — Sonnet: make the sky states and the window actually read

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will review your diff, rerun your
tests and look at your screenshots. Execute exactly what is written. Where this
prompt makes a decision, follow it; do not substitute your own. If something is
impossible as written, stop that step, do the rest, and explain in your report.

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
Vanilla three.js room (no r3f), React 19, GSAP, Playwright.

## Parallel work — read this first

The other agent (Gemini) is porting dhruvOS apps at the same time.

| Owner  | Paths you may create, edit, delete or stage |
|--------|---------------------------------------------|
| **You** | `src/v3/desktop/**`, `scripts/verify-room-interactions.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs`, `docs/review/sonnet-round2.md` |
| Gemini | `public/os/**`, `scripts/vendor-os-libs.mjs`, `scripts/verify-os-apps.mjs`, `scripts/shoot-port-originals.mjs`, `docs/port-source/**`, `docs/review/gemini-round2.md`, `src/v3/content/index.js` |

- Never edit, stage, revert or delete anything outside your row. If a change is
  needed there, write it under "Requests for the orchestrator" in your report.
- Stage files **by explicit path**. Never `git add -A`, `git add .`,
  `git commit -a`, `git stash`, `git reset`, or `git checkout -- <path>` on files
  you do not own.
- Git lock: if a commit fails because `.git/index.lock` exists, wait 10 seconds
  and retry, up to 6 times. Never delete the lock file.
- **Separate build output and port:** you never build into `dist/` and never
  serve on 4173 — Gemini uses those. Your commands are exactly:
  ```
  npx vite build --outDir dist-sonnet
  npx vite preview --outDir dist-sonnet --port 4174 --strictPort
  ```
  Before the first build, append the line `dist-sonnet/` to `.git/info/exclude`
  (local only, not committed).
  Note: `npm run build` also regenerates `public/os/shell/content.js`, which is
  Gemini's; that is why you call `vite build` directly.
- `scripts/verify-v3.mjs` may hardcode port 4173. Open it. If it does not read
  `process.env.BASE`, change it so the base URL is
  `process.env.BASE || 'http://localhost:4173'` (and derive anything else that
  embeds the port from that). Commit that change separately. Always run it with
  `BASE=http://localhost:4174`.

## Current state you are fixing

Round 1 (commits `3d381dc`, `502ae0b`, `ed1a210`, `faf5b57`) added
`SKY_CONFIGS` and `setSky()` in `src/v3/desktop/buildWorkspace.js`, a
`windowOpen` interaction (sash in `buildRoomInteractions.js`, action in
`WorkspaceStage.jsx` `roomAction`), `src/v3/desktop/cityAudio.js`, and a WINDOW
button whose click handler in `Scan.jsx` `handleSelect` starts/stops audio.

Review found three problems. Look at these screenshots first:
`scripts/shots/sky-orbit-day.png`, `sky-seated-day.png`,
`window-closed-night.png`, `window-open-night.png`.

1. **Day does not read as day.** Inside, the room is as dark as night; only the
   skyline texture changed. `day` raised hemisphere 0.42→0.52 and key
   1.15→1.38, which is far too little.
2. **Opening the window is invisible.** `window-closed-night.png` and
   `window-open-night.png` are practically identical from the seat.
3. **Audio can desync from the window.** `handleSelect` decides start/stop by
   reading `dataset.windowOpen` *before* the action runs, and the action is
   triggered by an `activeId` toggle. A second click while the first action is
   still animating, or a click while `activeId` is already `windowOpen`, can
   leave the window closed with audio playing or open and silent.

## Job 1 — sky states that read as their time of day

**Night is frozen.** `SKY_CONFIGS.night` and every value the night state
produces (hemisphere, key light colour/intensity/position, lamp 1.85/3.0,
pendant 0.85/3.2, `toneMappingExposure` 1.5, scene background and fog) must
stay exactly as they are at HEAD. Do not change `toneMappingExposure` for any
state; it is shared.

For **day** and **dusk**, change only these, all inside `SKY_CONFIGS` and
`setSky()`:

- hemisphere sky colour, ground colour, intensity
- key light colour, closed/open intensity, position
- a new per-state `windowLight` base intensity (the cool PointLight at the
  window; night keeps its current behaviour)
- the skyline texture (already per state)

Procedure — follow it, do not eyeball:

1. Write `scripts/measure-sky.mjs` (Playwright, same style as
   `scripts/verify-room-interactions.mjs`). For each state it loads
   `${BASE}/#/?sky=<state>` (check how round 1 reads the override and match it),
   sits in the chair the way the existing room test does, waits 2500 ms, takes
   a screenshot, and computes on the decoded PNG (use `pngjs` only if it is
   already in `node_modules`; otherwise use `page.evaluate` with a canvas
   `getImageData` on the screenshot loaded as a data URL):
   - **wall luminance:** mean of `0.2126R + 0.7152G + 0.0722B` over the rectangle
     x 5%–22%, y 30%–55% of the image (the left wall above the lamp in the
     seated view — confirm on `sky-seated-day.png` that it is wall, and adjust
     the rectangle once if not, recording the final rectangle in your report);
   - **clipped fraction:** share of all pixels with any channel ≥ 250.
   It prints one JSON line per state and writes the seated screenshot to
   `scripts/shots/sky-seated-<state>.png` and an orbit screenshot (no sit) to
   `scripts/shots/sky-orbit-<state>.png`.
2. Run it at HEAD before changing anything; record the numbers.
3. Tune day and dusk until **all** of these hold:
   - `day.wall >= 1.6 × night.wall`
   - `night.wall × 1.15 <= dusk.wall <= day.wall × 0.85`
   - `day.clipped <= 0.02` and `dusk.clipped <= 0.02`
   - night numbers identical to step 2 (±1%)
   - day key light colour is neutral-warm white (R ≥ G ≥ B, B ≥ 0.85·R); dusk key
     is orange (R > G > B, B ≤ 0.6·R)
   - the monitor text in the seated day screenshot is still readable (look)
4. Each `setSky` call that moves the key light sets
   `renderer.shadowMap.needsUpdate = true` exactly once and invalidates one
   frame. Keep that.

## Job 2 — opening the window must be visible from the seat

Keep the id `windowOpen` and the anchor. Do **not** use or alter the `window`
anchor (it opens the contact panel).

1. During the action, frame the window: fly to
   `{ position: WORKSPACE.seat.position, target: WORKSPACE.anchors.windowOpen }`
   with `duration 0.45` (as the blinds action does), then keep that framing until
   the action completes, then return to the normal seated view exactly as the
   other room actions do.
2. The sash must be in front of the blinds from the seated camera. Check the
   z-order: if the sash group sits behind the blind slats, move the sash (not
   the blinds) forward in z until it renders in front, and keep its frame
   aligned to the window opening. The sash slides 0.58 m as now.
3. When the window opens, the blind slats sway once: a bounded GSAP tween of the
   blinds group's `rotation.x` to +0.06, back through −0.035, to 0, total 1.2 s,
   `sine.inOut`. Not on close. No permanent loop.
4. `windowLight` rises to its state base intensity when open (Job 1 value;
   night 0.55 as now). Intensity only — no position change, no shadow update.
5. Acceptance, measured, not eyeballed. Extend
   `scripts/verify-room-interactions.mjs`: at night, seated, take the default
   seated screenshot with the window closed, open it, wait for the action to
   settle and the camera to return, take the same screenshot again, and compute
   over the window region (use the projected 2D rect of
   `WORKSPACE.anchors.windowOpen` ± 12% of the image width/height) the share of
   pixels whose max channel difference is > 12. Assert **≥ 3%**. Save both
   images as `scripts/shots/window-closed-night.png` and
   `window-open-night.png`.

## Job 3 — audio always matches the window

Replace the round-1 logic with this design exactly:

1. `src/v3/desktop/cityAudio.js` exports `isCityAmbiencePlaying()` returning a
   boolean, and exposes it on `window.__cityAmbience = { playing: () => … }`
   **only** when `import.meta.env.DEV` is true or `localStorage['v3:test'] === '1'`.
2. In `Scan.jsx`, keep a ref `windowIntent` (boolean, starts `false`).
   In `handleSelect('windowOpen')`, **ignore the click** (return early) if
   `document.querySelector('.workspace-stage')?.dataset.actionState` is not
   `'idle'` and not empty. Otherwise flip `windowIntent.current`; if it is now
   `true`, call `startCityAmbience()` **synchronously inside this handler**
   (it is the user gesture); else `stopCityAmbience()`. Then trigger the action.
3. `WorkspaceStage.jsx`: the `windowOpen` action's target state is
   `windowIntent`, not `1 - state` — pass it in (a prop `windowIntent`, read
   through the existing `state.current` pattern). If the target already equals
   the current state, finish immediately without animating.
4. After the action completes, if `dataset.windowOpen` disagrees with
   `isCityAmbiencePlaying()`, call `stopCityAmbience()` and log
   `console.warn('[window] audio desync corrected')`. (Never start audio here —
   there is no gesture.)
5. Standing up (`seated` becomes false) stops audio and leaves the window state
   unchanged. **Sitting back down with the window open restarts audio inside the
   SIT click handler** (`onSit` in `Scan.jsx` and the chair marker click), since
   that click is a gesture.
6. Extend `scripts/verify-room-interactions.mjs` (set `localStorage['v3:test']='1'`
   in the init script):
   - click WINDOW once → after settle, `windowOpen === '1'` and `playing() === true`;
   - click WINDOW, then click WINDOW again **80 ms later** → after settle, the
     window state and `playing()` agree;
   - click WINDOW to close → `'0'` and `false`;
   - with the window open, STAND UP → `playing() === false`; SIT → `true`;
   - zero idle frames after each settle (reuse the existing idle check);
   - no page errors.

## Constraints

- Render-on-demand. Bounded animations only. Idle costs zero frames.
- Static shadows: `shadowMap.needsUpdate = true` only inside `setSky`.
- No new dependencies, no CDN, no downloaded assets. No audio without a gesture.
- Do not change `PhoneScreen.jsx`, the notebook, the seated figure or the
  FocusLock/phone flow.
- Conventional Commits, no trailing period, **no attribution or co-author
  lines**, never push, never commit to `main`.

## Verification the orchestrator will rerun

With `npx vite preview --outDir dist-sonnet --port 4174 --strictPort` running:

```
BASE=http://localhost:4174 node scripts/verify-v3.mjs            # 36/36
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```

All four must pass. Look at every screenshot you produced before reporting.

## Commits (in this order, explicit paths only)

1. `test: let verify-v3 target any preview origin via BASE` (only if needed)
2. `test(room): measure sky wall luminance and clipping per state`
3. `fix(room): day and dusk light the room like their time of day`
4. `fix(room): frame the window and make opening it visible`
5. `fix(room): keep city ambience in step with the window`
6. `docs: sonnet round 2 report`

## Report — write it to `docs/review/sonnet-round2.md`, commit it last

Use exactly these headings:

```
# Sonnet round 2 report
## Commits            (hash — subject)
## Files changed      (path — one-line purpose)
## Commands run       (each command, then its last 8 output lines verbatim)
## Sky measurements   (table: state | wall before | wall after | clipped after) + final rectangle used
## Final light values (table: state | hemi sky/ground/intensity | key colour/closed/open/position | windowLight)
## Night unchanged    (the git diff lines proving SKY_CONFIGS.night is untouched, or "no diff")
## Window visibility  (changed-pixel share measured, and screenshot paths)
## Audio sync         (each Job 3 test step and its result)
## Deviations         (anything not done exactly as written, and why)
## Requests for the orchestrator (changes needed outside your paths, with exact text)
```

Never claim a test passed unless its output is pasted in "Commands run".
