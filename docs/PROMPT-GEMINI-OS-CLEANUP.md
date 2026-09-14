# Prompt for Gemini — dhruvOS app cleanup

Copy everything below the rule.

---

You are executing one scoped job on a portfolio repo. An orchestrator (Claude)
reviews and verifies your work afterwards, so report precisely and never claim
something you did not check.

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
dhruvOS is dependency-free ES modules in `public/os/`, loaded in a same-origin
iframe at `os/embed.html?embed=1`. Lab experiments live in `public/lab/` with a
registry at `src/lab/registry.js`.
**Another agent works in parallel** on `src/v3/desktop/`. Do not touch it, and
stage only your own files when committing.

## Step 0 — map before changing

Find how apps are registered, launched and listed (desktop icons, dock, start
menu, any app registry), and write down every file that references `wormhole`,
`lab`, `corrupted`, `fluid`, `kinetic`, `tear`, `resonance` and the wallpaper
feature. Include that map in your report.

## Job 1 — remove two apps

Delete the **Wormhole** app and the **Lab** app from dhruvOS entirely: code,
icons, registry entries, launch paths. Nothing may still link to them.

## Job 2 — promote four lab experiments into real dhruvOS apps

`corrupted`, `fluid` (app title **Flux**), `kinetic`, and `tear` (app title
**Reality Tear**) each become a standalone app. For each:

- **No CDN imports.** If an experiment loads anything from a CDN, stop and list
  exactly what and from where in your report instead of vendoring it yourself.
- **No permanent animation loops.** `requestAnimationFrame` runs only while the
  app window is open and visible. It stops on minimize, close, and when the OS
  receives the parent's `leave` message. Check how `public/os/main.js` handles
  that message.
- **No invented content.** Remove fabricated names, metrics, fake logs or claims
  from `public/lab/*.html` and the promoted apps. Do not write new descriptive
  copy about the owner — leave a short neutral title only; copy comes later.

The remaining lab experiments are dropped. Report which ones and update
`src/lab/registry.js` so nothing points at deleted files.

## Job 3 — fix "set as wallpaper"

It is broken. Find the root cause, fix it, and describe the mechanism in your
report. Do **not** add new wallpaper options yet; that needs a design decision.

## Job 4 — Resonance must never play sound on its own

Make sure no audio starts without a user gesture (click or keypress inside the
app). Do not redesign the app.

## Do not touch

Cosmos and Decoder (both waiting on design decisions), `public/os/shell/content.js`
(generated — edit `src/v3/content/index.js` via `scripts/gen-os-content.mjs` only,
and only if a removal requires it), and anything under `src/v3/desktop/`.

## Constraints

- No new dependencies.
- Conventional Commits, subject under 72 chars, no trailing period, no
  attribution or co-author lines. One commit per job. Never push, never commit
  to `main`.

## Verify before reporting

1. `npm run build`, then serve with `npx vite preview --port 4173`.
2. `node scripts/verify-v3.mjs` must stay **36/36**.
3. Write `scripts/verify-os-apps.mjs` (Playwright, same style as the other
   scripts): open `http://localhost:4173/os/embed.html?embed=1`, launch each of
   the four promoted apps, assert no page errors and no failed network requests,
   minimize or close it, then assert `requestAnimationFrame` callbacks stop
   (wrap rAF with a counter the way `scripts/verify-held-objects.mjs` does).
   Also assert Wormhole and Lab are not launchable, and that setting a wallpaper
   actually changes it. Run it and paste the output.

## Report back

- The Step 0 map.
- Commit hashes per job.
- Any CDN dependency you found and did not resolve.
- Which experiments were dropped.
- The wallpaper root cause.
- Test output tails.
- Anything you could not do as described, and why.
