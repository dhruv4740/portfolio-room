# Opus — application integration handoff

Status: READY FOR VERIFICATION

Owned runtime files are now frozen. I will not edit `Scan.jsx`, `roomAudio.js`
or `cityAudio.js` until Gemini reports its verification batch complete.

No browser, build, server, Blender, GPU probe or Git mutation was run. No
agents were spawned (the team contract forbids it).

## Changed files

| File | Change |
|---|---|
| `src/v3/desktop/roomAudio.js` | Foreground resume; `close()` rejection guard |
| `src/v3/desktop/cityAudio.js` | `resume()`/`close()` rejection guards; new `suspendCityAmbience()` |
| `src/v3/desktop/Scan.jsx` | Visibility handler moved to its own effect and given foreground recovery; arrival token ref made authoritative |
| `docs/reviews/OPUS-INTEGRATION-HANDOFF.md` | This file |

Nothing else was touched. `WorkspaceStage`'s prop/event contract is unchanged:
`arrivalToken`, `onArrivalComplete`, `workspace:foley`, `workspace:coffee` and
`workspace:headphones` all keep their existing shapes.

---

## 1. Room audio never recovered after a tab switch

**Problem.** `roomAudio.js` bound `visibilitychange` and suspended the context
on hide, but had no resume branch. `playRoomFoley` gates on
`audioCtx.state !== 'running'` (`roomAudio.js:141-142`), so once suspended, every
later cue was silently dropped. Recovery only happened incidentally, when the
document-level `pointerdown`/`keydown` listeners in `Scan.jsx` called
`unlockRoomAudio`, whose line 49 resumes as a side effect. Keyboard-driven and
timeline-driven foley arriving before any such gesture was lost.

**Fix.** `roomAudio.js:61-65` — `handleVisibility` now resumes when the
document becomes visible, and bails on a closed context:

```js
if (!audioCtx || audioCtx.state === 'closed') return;
if (document.hidden) audioCtx.suspend().catch(() => {});
else if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
```

**Why this does not create audio without a gesture.** The listener is bound
only inside `unlockRoomAudio`'s context-creation branch (`roomAudio.js:44-47`),
which itself only runs from a real `pointerdown`/`keydown`. If no gesture has
occurred there is no context and no listener, so nothing resumes. Resuming an
already-unlocked context is not a new grant of audio permission.

This confirms the defect Sonnet reported as item 1 against current source. I am
not repeating its "verified" wording — its harness has not run.

## 2. City ambience never restarted after a tab switch, and kept running while hidden

**Problem, part one.** `Scan.jsx`'s visibility listener was
`() => { if (document.hidden) stopCityAmbience(); }` — stop on hide, nothing on
show. Returning to the tab with the sash still open left the ambience
permanently silent for the rest of the session.

**Problem, part two.** `stopCityAmbience` only ramps `masterGain` to zero
(`cityAudio.js:100-111`). The looping noise `BufferSource` and both hum
oscillators keep running in a hidden tab — inaudible, but still scheduled work.
That is the "no hidden work continues needlessly" requirement.

**Fix.** New `suspendCityAmbience()` (`cityAudio.js:113-130`, function at `:116`) cancels any
in-flight fade, pins the gain at zero, and suspends the context. Pinning
matters: suspending mid-ramp would freeze the gain at an audible value and the
next resume would restart at that level.

`Scan.jsx:267-280` now handles both directions, in its **own effect** with
`[seated, screenPhase]` dependencies. The old handler lived in the `[]`-dependency
gesture-unlock effect, so it could not have read current state even if it had
tried to:

```js
if (document.hidden) { stopCityAmbience(); suspendCityAmbience(); return; }
if (windowIntent.current && seated && screenPhase === 'room') startCityAmbience();
```

The restart condition is the same one already used by `toggleRoomMute`
(`Scan.jsx:292`), so the two paths cannot disagree. `startCityAmbience` resumes
the context itself (`cityAudio.js:88-90`) and early-returns when muted
(`:80-83`), so **persisted mute survives a tab switch** and a muted user hears
nothing on return. When the sash is shut the context is deliberately left
suspended — that is the point of suspending it.

`suspendCityAmbience` never calls `initAudio`, so like the room fix it cannot
produce audio without a gesture.

**Music Player is untouched.** `musicPlayer.js` is a separate module with its
own element and is not imported by any file I changed; none of these paths
reference it.

## 3. Unhandled rejections from audio promises

**Problem.** Three call sites invoked promise-returning Web Audio methods
without a rejection handler. The surrounding `try {} catch {}` blocks absorb
synchronous throws only, so a rejection became an unhandled promise rejection —
which the Playwright harnesses surface as a page error.

- `cityAudio.js:89` — `audioCtx.resume()` inside `startCityAmbience`
- `cityAudio.js:147` — `audioCtx.close()` inside `disposeCityAmbience`
- `roomAudio.js:171` — `audioCtx?.close()` inside `disposeRoomAudio`

`close()` rejects when the context is already closed, which is reachable on a
double unmount or a dispose after an autoplay-blocked context was torn down.

**Fix.** `.catch(() => {})` on all three. Existing `suspend()`/`resume()` calls
in `roomAudio.js` already had handlers and were left alone.

**Teardown idempotency, re-checked and unchanged:** `disposeRoomAudio` clears
`visibilityBound`, drains `pendingCleanups` and nulls both refs, so a second
call is a no-op; `disposeCityAmbience` is guarded by `if (audioCtx)`. Both were
already correct and I did not touch them beyond the rejection guard.

## 4. Arrival token: stale completion and swallowed Escape

**Problem.** `arrivalTokenRef.current = arrivalToken` was assigned **during
render** (old `Scan.jsx:95`), while `handleArrivalComplete` guards on
`token !== arrivalTokenRef.current` and the Escape handler branches on
`arrivalTokenRef.current !== 0` (`Scan.jsx:369`). Between a user action calling
`cancelArrival()` and React committing the re-render, the ref still held the
**old** token. Two consequences in that window:

- A natural arrival completion arriving from the GSAP ticker passed the guard
  and ran `setSeated(false)` + `setOverviewOpen(true)`, re-settling the camera
  on top of a destination the user had just chosen (Explore the room, Sit,
  Phone, a launch). React normally commits before the next frame, so this is
  timing-dependent, not deterministic — but it is exactly the stale-completion
  class the assignment names, and it is not defended against.
- Two Escape presses inside one frame both took the `cancelArrival` branch, so
  the second was swallowed instead of backing out the next level.

`handleWorkspaceReady` already wrote the ref synchronously (old line 150),
while `replayArrival` and `cancelArrival` did not — the inconsistency is what
made the hazard easy to miss.

**Fix.** `Scan.jsx:95-105` introduces a single `setArrival(token)` that writes
the ref synchronously and then schedules the state update. All four mutation
sites now go through it (`cancelArrival`, `replayArrival`,
`handleArrivalComplete`, `handleWorkspaceReady`), and the render-phase
assignment is removed. `arrivalToken` state remains the sole prop passed to
`WorkspaceStage`, so the component contract is unchanged; the ref is now a
faithful mirror rather than a lagging one, and the render-phase side effect
(which was also a concurrent-mode hazard) is gone.

**Audited and deliberately left alone**, because they were already correct:
route unmount (`director?.cancel()` in `WorkspaceStage`'s cleanup plus
`cancelArrival` on both `WORK` links), replay re-entry, the `launchLocked`
guard against rapid launches, the `actionState !== 'idle'` guard on repeat sash
clicks (`Scan.jsx:174-178`), and the synchronous `useLayoutEffect` focus
restoration. I did not touch persistent dhruvOS/phone state.

---

## Static checks actually run

| Check | Result |
|---|---|
| `node --check src/v3/desktop/roomAudio.js` | pass |
| `node --check src/v3/desktop/cityAudio.js` | pass |
| `@babel/parser` parse of `Scan.jsx` (`sourceType: module`, `jsx` plugin) | pass |
| grep: every `.resume()`/`.suspend()`/`.close()` in the three files has a `.catch` | pass (7/7) |
| grep: `suspendCityAmbience` exported and imported exactly once; no dangling `resumeCityAmbience` | pass |
| grep: exactly two `visibilitychange` registrations, each with a matching removal | pass |

**Not run, and not claimed:** no build, no preview server, no Playwright run, no
listening review. Nothing below is asserted as passing.

## Required Gemini checks

The Sonnet harness already contains assertions for the two behaviours I added —
it asserted the correct behaviour while reporting the gap. Those assertions
should now be satisfiable for the first time:

- `scripts/verify-after-hours-audio.mjs:394` — "returning to the foreground
  auto-resumes the suspended context" (fix 1)
- `scripts/verify-after-hours-audio.mjs:396` — "returning to the foreground
  resumes city ambience when window is open" (fix 2)

Run command recorded by Sonnet:

```
node node_modules/vite/bin/vite.js preview --host localhost --port 4173 --strictPort
BASE=http://localhost:4173 node scripts/verify-after-hours-audio.mjs
```

Also required, because my changes touch Scan's effect structure and the arrival
token path:

1. `verify-after-hours.mjs` — first arrival, start/middle/end interruption,
   replay and re-entry after an interrupted replay, navigation to WORK during
   arrival, reduced-motion load and replay. **This is the suite most likely to
   catch a regression from fix 4.**
2. `verify-v3.mjs` and `verify-studio.mjs` — the focus-restoration and phase
   assertions; I changed effect boundaries in the same component.
3. `verify-room-interactions.mjs` — sash open/close and the ambience it drives.
4. Confirm zero page errors and zero unhandled rejections across all of the
   above; fix 3 exists specifically to keep that column clean.

## Remaining risks

1. **Harness context indexing — checked statically, no action needed.**
   `verify-after-hours-audio.mjs:374` asserts `contextStates[0] === 'suspended'`
   while hidden, and my change means the city context now also reaches
   `suspended`. I traced the order rather than leaving it open: the probe
   records contexts in construction order (`:58`, `:93-95`); the room context is
   created by `unlockRoomAudio` from the document-level `pointerdown`/`keydown`
   listeners, and the city context only from a WINDOW click. The hidden-tab
   flow runs `enterRoom` → `exploreRoom` → `openObjects` before clicking WINDOW
   (`:360-363`), and every one of those dispatches a real `pointerdown` first.
   **`contextStates[0]` is therefore the room context, deterministically**, and
   the assertion still targets what it intends. Derived from source, not run.
2. **Synthetic visibility only.** The harness drives
   `Object.defineProperty(document, 'hidden', ...)` plus a dispatched
   `visibilitychange`. A real browser also suspends contexts on its own
   schedule. Genuine tab-switch behaviour and perceived audio levels remain
   unverified by anyone.
3. **Fix 4 is a hazard closure, not a reproduced bug.** I did not observe the
   stale completion in a browser — I could not run one. The code path is real
   and the guard is now timing-independent, but if Gemini sees an arrival
   regression, this is the first change to suspend.
4. **`setCityAmbienceMuted(false)` still does not restart ambience** by itself;
   `Scan.jsx:290-293` does it. That asymmetry predates me and I left it, but it
   means any future caller of the mute setter outside Scan would get silence.
5. **Not fixed, out of my ownership.** Nothing in this pass required a 3D file.
   The risks in my earlier art review (`docs/reviews/OPUS-AFTER-HOURS-REVIEW.md`
   §6) remain Codex's to judge and are not implemented here.
