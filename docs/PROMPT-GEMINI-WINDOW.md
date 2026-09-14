# Prompt for Gemini — the window: sky states and opening it

Copy everything below the rule.

---

You are executing one scoped job on a portfolio repo. An orchestrator (Claude)
reviews and verifies your work afterwards, so report precisely and never claim
something you did not check.

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
Vanilla three.js room (no r3f), Vite 8, React 19, GSAP, Playwright.
**Another agent works in parallel** on `public/os/`, `public/lab/`, `src/lab/` and all `.md` docs.
Do not touch those paths, and stage only your own files when committing.

## Read first

- `src/v3/desktop/buildWorkspace.js` — `WORKSPACE` (anchors, seat, screen), the
  lights (hemisphere 0.42, moon 1.15, lamp bulb 1.85/3.0, pendant 0.85/3.2),
  `skylineTexture()`, and the returned model API.
- `src/v3/desktop/buildRoomInteractions.js` — how lamp/blinds/drawer state is
  held and applied. Follow this pattern.
- `src/v3/desktop/WorkspaceStage.jsx` — `fly()` seated branch, `roomAction()`,
  render-on-demand (`invalidate()`), and the static shadow map.
- `src/v3/desktop/Scan.jsx` — the seated button bar.

## Job 1 — the sky follows the visitor's local time, as set states

Three states: **night**, **dusk**, **day**, picked from the visitor's local hour
on load. Defaults (the owner may change them): day 07:00–16:59, dusk
05:00–06:59 and 17:00–18:59, night otherwise.

- **Night is the current room. Do not change any night lighting value.** The
  owner rejected darker lighting three times; readability is fixed and must stay.
- Dusk and day each get their own sky/skyline texture and light colours and
  intensities. The moon becomes the sun by day.
- The shadow map is static (`shadowMap.autoUpdate = false`). A state change may
  move the key light, but then it sets `shadowMap.needsUpdate = true` **once**.
  Never re-render shadows per frame.
- Expose `model.setSky('night'|'dusk'|'day')`, write the state to
  `host.dataset.skyState`, and accept a `?sky=day` URL override so the states
  can be reviewed without changing the clock.
- Day must still read as the same room: warm desk lamp still meaningful, monitor
  still legible, no blown-out white walls.

## Job 2 — open the window

- **New interaction id `windowOpen`.** Do NOT reuse `window`: that anchor opens
  the contact panel, and adding `window` to `roomActions.objects` makes
  `fly()` route to `roomAction()` first, which would delete the site's contact
  entry point.
- The sash opens with a bounded GSAP animation (hand reach like the lamp is
  optional), cooler outside light rises by **intensity only**, and it holds its
  state until toggled again.
- City ambience starts **only inside the click/keypress handler** that opens it,
  and stops when closed. There is no audio asset and you must not download one:
  synthesize it with Web Audio (filtered noise plus a low hum is enough). Never
  start audio from load, state restore or any path without a user gesture.
- Add a `WINDOW` button to the seated bar in `Scan.jsx`, and `host.dataset.windowOpen`.

## Job 3 — the seated button bar covers the zoomed phone

When the phone is zoomed in (`.workspace-stage` has `data-phone-state` of
`zoomed` or `focuslock`), the `.seat-exit` bar in `Scan.jsx` overlaps the bottom
of the phone screen (see `scripts/shots/phone-focuslock.png`). Fix the overlap
without hiding the way back: Escape and a visible back control must still work.
Screenshot it afterwards.

## Constraints

- Render-on-demand: animations request frames while running, then stop. Idle
  costs zero frames — this is asserted by the tests.
- Integrated AMD GPU is the target. Do not claim performance you did not measure.
- No new dependencies, no CDN imports, no downloaded assets.
- Do not change the phone (`PhoneScreen.jsx`), the notebook, or the seated body.
- Conventional Commits, subject under 72 chars, no trailing period, no
  attribution or co-author lines. Commit locally per logical unit. Never push,
  never commit to `main`.

## Verify before reporting

1. `npm run build`, then serve with `npx vite preview --port 4173`.
2. `node scripts/verify-v3.mjs` must stay **36/36**.
3. Extend `scripts/verify-room-interactions.mjs` with `windowOpen` toggling and
   a zero-idle-frames check after it settles, plus each `?sky=` state loading
   without page errors. Run it and `scripts/verify-held-objects.mjs` with
   `BASE=http://localhost:4173` (the preview binds `localhost`, not `127.0.0.1`).
4. Screenshots into `scripts/shots/`: seated view and orbit view for each sky
   state, and window closed/open at night. Look at them yourself before reporting.

## Report back

- Commit hashes and what each contains.
- The exact light values you set for dusk and day, and confirmation night is
  byte-for-byte unchanged (show the diff lines).
- How many shadow re-renders a state change costs.
- Test output tails and the screenshot paths.
- Anything you could not do as described, and why.
