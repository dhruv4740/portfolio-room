# Round 5 — Gemini: FocusLock's real friction sequence on the phone

Copy everything below the rule.

---

You are the only executor agent this round. The orchestrator (Claude) is
editing the 3D room **at the same time** and will review your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. If a step
is impossible as written, skip only that step, finish the rest, and explain it
under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Ownership

| Owner | Paths |
|---|---|
| **You** | `src/v3/desktop/PhoneScreen.jsx`, `scripts/verify-focuslock-app.mjs`, `docs/review/gemini-round5.md` |
| Orchestrator | everything else, including `Scan.jsx`, `WorkspaceStage.jsx`, `buildWorkspace.js`, `buildRoomInteractions.js`, `scripts/verify-held-objects.mjs`, `scripts/verify-room-interactions.mjs` |

- Commit scoped: `git add <path>` for new files, then
  `git commit -m "<msg>" -- <paths>`. Never a bare `git commit`. No `add -A`,
  `add .`, `commit -a`, `stash`, `reset`, `checkout --`, `--amend`. Git lock:
  wait 10 s, retry up to 6 times.
- `npm run build`, test on `http://localhost:4173`. The orchestrator may rebuild
  while you work; if a run fails with errors in files you don't own, rerun once,
  then report it.
- Do not edit `scripts/verify-held-objects.mjs` (it expects the lock overlay
  after tapping Instagram). Under "Requests for the orchestrator", write the exact
  steps and selectors that test must use to reach the lock overlay after your change.

## What the owner wants

Right now tapping Instagram only shows the "FocusLock paused Instagram" lock
overlay. The real app also has a **friction sequence**: the barriers in the
FRICTION & BLOCKERS settings (Breathing Pause, Wait Delay, Intention Setting
Prompt, Shake Challenge, Cognitive Reflection, Stats & Checklist, Math Gate).
The owner wants visitors to actually go through those barriers on the phone,
as the real app does, driven by the toggles already in your Settings screen.

## Job 1 — read the real flow first (no commit)

From `dhruv4740/focuslock` (raw URLs as before), read:
- `android/app/src/main/res/layout/overlay_friction.xml` (every step view, its
  ids, texts, hints, buttons, durations);
- the Kotlin service or activity that inflates `overlay_friction.xml` (find it by
  searching the tree for `overlay_friction`), including step order, what each
  step waits for, timers, how a step completes or cancels, what happens at the
  end (access granted? for how long? message text?), and when the lock overlay
  (`overlay_lock.xml`) is shown instead of friction;
- the policy fields for each toggle and their defaults in `FocusPolicyClient.kt`
  (including `hardBlock` / "Hard block after limit" and daily-limit logic).

Write this down in the report as a table: step | source file:lines | enabled by |
UI texts | completes when | cancel path | duration. Also the decision rule
"friction vs lock overlay" quoted from the source.

## Job 2 — implement the friction sequence (commit: `feat(phone): FocusLock friction steps before Instagram`)

In `PhoneScreen.jsx`:

1. **Which screen appears on tapping Instagram.** Use the source's decision
   rule from Job 1 with the demo's persisted settings. If the source rule depends
   on real usage data the demo doesn't have, apply it with the visitor's own
   state (opens count, minutes = 0, the settings values). Instagram itself never
   opens: at the end of a successful sequence, show the source's success/granted
   text (quoted), then return to the home screen after 2 s and count one open.
   The lock overlay path must still be reachable through a real setting (for
   example "Hard block after limit" on, if the source rule allows it); say which.
2. **Each enabled step, in the source order, as DOM at 540×1200**, with the
   real texts, colours and durations:
   - Breathing Pause: the real duration (12 s) with an expanding/contracting
     breathing animation (CSS only), and whatever the source says about inhale/exhale text.
   - Wait Delay: the real countdown (10 s); the continue control is disabled until 0.
   - Intention Setting Prompt: the real prompt text and input; continue enabled
     only after the source's minimum (if none, non-empty).
   - Shake Challenge: the phone has no accelerometer on a desktop. Detect a
     shake as the pointer moving left-right across the phone screen with at least
     6 direction reversals within 2 s (a real gesture, not a button). Show the
     source's text, plus one small extra line `Move your mouse side to side
     quickly` (the only non-source string allowed; list it in the report). On
     touch devices, count horizontal touch-move reversals the same way.
   - Cognitive Reflection: the real phrase or question and typing rule
     (exact match, case rules as in the source).
   - Stats & Checklist: the visitor's real opens count, minutes 0, and the
     pending tasks from the dashboard task list (empty state text if none).
   - Math Gate: the difficulty from Settings (easy/medium/hard) with the source's
     number ranges and texts; wrong answers show the source's error text.
   Disabled steps are skipped. The step progress indicator, if the source has one,
   is shown as in the source.
3. **Cancel:** every step's source cancel button (e.g. "I will take a break now")
   ends the sequence and returns home; no open is counted.
4. **Timers** use real durations. Under `localStorage['v3:test'] === '1'` only,
   read `window.__phoneTimeScale` (default 1) and divide every duration by it.
   Never expose or read it otherwise.
5. No `requestAnimationFrame` loops: CSS animations and `setTimeout`/
   `setInterval` only, all cleared on unmount, on leaving the step and when the
   phone returns to the desk (`reset()`).
6. Every visible string must be traceable: extend the report's strings audit
   table with the new strings (source file:line).

## Job 3 — tests (commit: `test(phone): cover the friction sequence`)

In `verify-focuslock-app.mjs` (with `v3:test` and `__phoneTimeScale = 20`):
- defaults → tap Instagram → assert the steps shown, in order, equal the enabled
  steps from the source defaults; complete each one through the UI (type the
  intention, perform the shake with `page.mouse.move` reversals, type the
  reflection, answer the math); screenshot `phone-friction-<step>.png` for each;
  assert the granted text, then home, and opens +1;
- turn off every friction toggle in Settings → tap Instagram → the flow matches
  the source rule for "no friction" (quote it); screenshot;
- cancel on the first step → home, opens unchanged;
- the lock overlay path via the real setting → lock overlay visible;
- wrong math answer shows the source's error text;
- no page errors, zero external requests.

## Verification (paste the last 8 lines of each)

```
npm run build
BASE=http://localhost:4173 node scripts/verify-focuslock-app.mjs
```

## Report — `docs/review/gemini-round5.md` (commit `docs: gemini round 5 report` scoped to that path)

```
# Gemini round 5 report
## Commits
## Source flow table       (Job 1 table + the friction-vs-lock rule quoted)
## Commands run            (command + last 8 lines verbatim)
## New strings audit       (string | source file:line)
## Screenshots to review   (path — what to look for)
## Deviations
## Requests for the orchestrator (exact steps/selectors for verify-held-objects to reach the lock overlay)
```

Never claim a test passed unless its output is pasted.
