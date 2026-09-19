# Sonnet review — room audio and lifecycle verification

Scope: `src/v3/desktop/roomAudio.js`, `cityAudio.js`, `Scan.jsx`, and the
coffee foley timeline in `WorkspaceStage.jsx`. Read-only review of those
files plus `AGENTS.md`, `docs/HANDOFF.md`, `docs/AFTER-HOURS-HANDOFF.md`,
`docs/AFTER-HOURS-PLAN.md`. No runtime file was edited. The only files
created are this report and `scripts/verify-after-hours-audio.mjs`.

Source was read once, in full, on 2026-09-20 against the working tree as it
stood when this review started. Other agents are editing `src/v3` and `docs/`
concurrently — if any of the referenced lines have since moved, treat line
numbers as of that snapshot, not necessarily current HEAD.

## Implementation findings

1. **`roomAudio.js:57-60` — the room-audio `AudioContext` is suspended on
   tab-hide but never resumed on tab-foreground.**
   ```js
   function handleVisibility() {
     if (!audioCtx) return;
     if (document.hidden) audioCtx.suspend().catch(() => {});
   }
   ```
   There is no `else` branch. Recovery is entirely incidental: the next
   `pointerdown`/`keydown` anywhere in the document calls `unlockRoomAudio()`,
   which does resume a suspended context (`roomAudio.js:49`) — but until that
   next gesture happens, `playRoomFoley` silently no-ops (`audioCtx.state !==
   'running'` check at `roomAudio.js:137`), so a coffee sip or any other foley
   triggered right after returning to the tab is silent with no visible sign
   why. Minimal fix: add `else if (audioCtx.state === 'suspended')
   audioCtx.resume().catch(() => {});` to `handleVisibility`.
   Verified by the harness: `hidden-tab: returning to the foreground does NOT
   auto-resume the suspended context`.

2. **`cityAudio.js` has no visibility handling of its own; suppression on
   hidden tabs is entirely `Scan.jsx`'s responsibility** (`Scan.jsx:245`,
   `onVisibility = () => { if (document.hidden) stopCityAmbience(); }`).
   `stopCityAmbience()` (`cityAudio.js:100-111`) only ramps `masterGain` to 0
   over 0.5s — the noise source and both hum oscillators keep running
   underneath, inaudible but still consuming a live `AudioContext` and CPU.
   This is not a leak (the context itself is closed on unmount via
   `disposeCityAmbience`, and `initAudio()` is idempotent so repeated
   start/stop cannot accumulate oscillators), but it means "hidden tab" and
   "window closed" are audibly identical without being state-identical, and a
   codebase-wide grep for "AudioContext" would not immediately show that the
   city ambience context is still ticking while a tab is hidden. Not
   file:line actionable beyond noting the gap; no fix suggested since the
   plan text ("Freeze weather for reduced motion; stop it behind the OS/phone
   and on hidden tabs") only requires audible suppression, which this
   satisfies.

3. **`WorkspaceStage.jsx:768` (and the mirrored `:759` refill branch) — reduced
   motion for coffee dispatches zero `workspace:foley` events**, not a
   fast/instant version of the three cues:
   ```js
   if(reduced){finish();return;}
   ```
   This matches the plan's literal wording ("reduced motion does not
   synthesize a full gesture sequence") but means reduced-motion users get no
   coffee sound at all, including no single instant confirmation cue. Flagging
   as a finding rather than a defect since the spec text supports silence; the
   product call belongs to the parent/owner, not this review. Verified by the
   harness: `coffee (reduced motion): settling to the held state does not
   synthesize any lift/sip/setdown cue`.

4. **Coffee cancellation is correct and was verified, not just inferred.**
   `WorkspaceStage.jsx:806` (`action?.kill()` in `returnExtra`) kills the gsap
   timeline holding the pending `.call()` foley dispatches, and the coffee
   branch of `returnExtra` (falls through to the generic `id!=='award'` reset
   at `WorkspaceStage.jsx:856`) resets the mug's position/rotation immediately
   with no foley dispatch of its own. No stale `sip`/`cup-setdown` fires after
   a mid-timeline `Escape`, confirmed by waiting past both original
   timestamps in the harness.

5. **No implementation defect found for gesture-gating or mute
   independence.** `roomAudio.js` never constructs an `AudioContext` outside
   `unlockRoomAudio()`, which only runs from the `pointerdown`/`keydown`
   document listeners `Scan.jsx:246-247` bind unconditionally on mount —
   covering keyboard-only users correctly. `cityAudio.js`'s `startCityAmbience`
   checks `muted` (`cityAudio.js:80-83`) *before* calling `initAudio()`, so a
   persisted mute genuinely prevents city ambience from ever creating its own
   context, not merely from being audible. `musicPlayer.js` has no coupling
   to `v3:room-muted` anywhere (`grep` found no match) and `Scan.jsx`'s
   headphones handler (`Scan.jsx:280-288`) reaches `window.__v3Music`/the
   dynamic import directly, independent of `roomMuted` state — confirmed live
   by the harness (music keeps playing across a room-sound re-mute).

## Coverage vs the 5 required assertion areas

| # | Area | Authored | Notes |
|---|------|----------|-------|
| 1 | No AudioContext before gesture; keyboard + pointer unlock | Yes | `runGestureGate` — separate contexts, pointer-only (`page.mouse.click` at an empty overview coordinate, never a button) and keyboard-only (`Tab`), each asserting zero contexts pre-gesture and exactly one post-gesture. |
| 2 | Persisted mute + matching city suppression, music independent | Yes | `runMuteAndIndependence` — loads with `v3:room-muted=1` pre-set, checks the ROOM SOUND control's rendered state and `aria-pressed`, opens the window while muted (city ambience must not start), unmutes (must start), starts the Music Player via headphones, re-mutes and confirms city ambience stops while music keeps playing. |
| 3 | Coffee order/count-of-one, cancellation, reduced-motion non-synthesis | Yes | `runCoffeeTimeline` + `runCoffeeReducedMotion` — full-cycle order/count assertion, a second cycle interrupted with `Escape` after cup-lift but before sip/setdown with a wait past both original timestamps, and a reduced-motion context asserting zero foley dispatches. |
| 4 | Hidden-tab suppression, cleanup after unmount/re-entry | Yes | `runHiddenTabAndLifecycle` — simulates `document.hidden` via `Object.defineProperty` + a real `visibilitychange` dispatch (not a mock of the app's own handler), confirms city ambience stops and the room `AudioContext` suspends, confirms a foley event dispatched while hidden produces no oscillator/buffer-source node, then documents the no-auto-resume finding above. |
| 5 | No page errors / no leaked listeners or contexts after repeated lifecycle | Yes | Same function, two full navigate-to-`/work`-and-back cycles: asserts net listener count (add − remove, tracked per type on `document`/`window` only) returns to zero on each unmount, asserts every `AudioContext` created so far is closed on unmount, and asserts a fresh gesture after remount creates a genuinely new context rather than resuming a stale reference. `page.on('pageerror'/'console')` collected across the whole run. |

Instrumentation used, and why it stays narrow: a single `addInitScript`
(`installAudioProbe`) wraps the *native* `AudioContext`/`webkitAudioContext`
constructor — every call still constructs and returns the real instance;
only `close`, `createOscillator`, and `createBufferSource` are additionally
counted — and wraps `EventTarget.prototype.addEventListener` /
`removeEventListener` / `dispatchEvent`, forwarding every call and only
tallying the four event types (`pointerdown`, `keydown`, `visibilitychange`,
`workspace:foley`) `Scan.jsx`/`roomAudio.js` actually bind, scoped to
`document`/`window` targets only. Nothing in the app's own audio or event
code is replaced; the harness never asserts against its own injected values,
only against real native return values (`ctx.state`, dispatched event
payloads) and real DOM state (`aria-pressed`, `dataset.actionState`,
`window.__cityAmbience.playing()`, `window.__v3Music.getState().playing`).

## Checks actually run

Only `node --check scripts/verify-after-hours-audio.mjs` (syntax validation).
**The browser harness has not been executed.** Per the assignment, the
parent/Luna own the exclusive GPU/browser slot; this review did not start a
dev/preview server, install dependencies, or open a browser context.
Everything above describing "the harness asserts X" is a description of what
the authored code does, not a report of a passing run. Nothing in this
document should be read as a result.

## Exact command for the owner to run

```
node node_modules/vite/bin/vite.js preview --host localhost --port 4173 --strictPort
BASE=http://localhost:4173 node scripts/verify-after-hours-audio.mjs
```

Uses the same production-preview convention as every other `verify-*.mjs` in
this repo (`AGENTS.md`, `scripts/verify-after-hours.mjs`). Writes
`scripts/shots/after-hours-audio-results.json` and exits 1 on any failure,
matching the existing scripts' behavior.

## Explicit remaining verification

- **The harness has never been run.** Every assertion above is unverified in
  the sense that matters most: nobody has watched it pass or fail against
  the real preview server. Timing constants in the coffee tests (900ms /
  3,400ms / 4,200ms waits) are derived from the exact `.call()` offsets in
  `WorkspaceStage.jsx` (0.6s / 1.95s / 3.7s) plus margin, but have not been
  empirically confirmed against real gsap/timer jitter on this machine.
- **Listening quality is unverified and out of this harness's reach.**
  Whether the ceramic/cloth/sip synthesis actually sounds convincing, whether
  levels are balanced against the Music Player, and whether the city
  ambience's brown-noise/hum mix is pleasant are judgments for a human in a
  real browser, not something a Playwright assertion can establish.
- **Real tab-visibility behavior is unverified.** The hidden-tab test drives
  `document.hidden` via `Object.defineProperty` and a synthetic
  `visibilitychange` dispatch because Playwright has no first-class "hide
  this tab" API that reliably fires the same event in headless Chromium.
  This exercises the app's real handlers with a real event, but it is not
  the same as an OS-level tab switch or minimize, which real users will do.
- **The `handleVisibility` no-resume-on-foreground gap (finding 1) is
  reported, not fixed.** This review does not own `roomAudio.js` and did not
  edit it. The fix is one line; whoever owns that file should decide whether
  silence-until-next-gesture is acceptable or should be closed.
- **Coffee refill (`WorkspaceStage.jsx:755-763`, the `coffeeLevel<=0.001`
  branch) is not covered.** It shares the same `finish`/foley-free-under-
  reduced pattern as the sip branch but has no lift/sip/setdown cues at all
  (by design — it's a pour, not a drink), so it did not fit naturally into
  the five required areas and was left out rather than padding unrelated
  coverage.
- **Source may have changed since this review's snapshot.** If the coffee
  timeline offsets, the mute key name, or the event names in
  `WorkspaceStage.jsx`/`roomAudio.js`/`cityAudio.js` have moved under a
  concurrent edit, the harness's selectors and timing assumptions (documented
  inline in `scripts/verify-after-hours-audio.mjs`) will need a matching
  update before it can pass — this was not re-checked after the initial read.
