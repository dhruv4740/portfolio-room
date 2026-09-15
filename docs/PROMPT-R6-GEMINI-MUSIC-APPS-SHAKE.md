# Round 6 — Gemini: shared music player, project apps, shake hint

Repo: `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
You work in parallel with the orchestrator (Claude), who is editing the 3D room
at the same time. Stay inside the files listed under "You own". If a job needs a
change in a file you do not own, stop and write the exact change you need in
your report instead of making it.

## Rules
- Commit per job, Conventional Commits, subject under 72 chars, no trailing
  period, no attribution lines. Scoped commits: `git add <new files>` then
  `git commit -m "..." -- <paths>`. Never commit to main. Never push.
- No invented facts, metrics or links. All project text comes from
  `src/v3/content/index.js` (then run `node scripts/gen-os-content.mjs` to
  regenerate `public/os/shell/content.js` — never hand-edit the generated file).
- No audio without a user gesture.
- Do not name the OS anywhere visitors can see it.
- Build with `npm run build`; test against `npx vite preview --port 4173`
  (`BASE=http://localhost:4173`).

## You own
- `public/os/**`
- `src/v3/content/index.js` (+ regenerated `public/os/shell/content.js`)
- `src/v3/desktop/PhoneScreen.jsx`
- `src/v3/desktop/Scan.jsx` — only the headphones song `useEffect` (lines ~122–135 today)
- `src/v3/desktop/DhruvOSScreen.jsx` — only if the music bridge needs it
- New file `src/v3/desktop/musicPlayer.js`
- `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs`, new `scripts/verify-music-sync.mjs`

## Do not touch
`src/v3/desktop/WorkspaceStage.jsx`, `buildWorkspace.js`, `buildRoomInteractions.js`,
`buildSeatedFigure.js`, `perfGovernor.js`, `cityAudio.js`, `scripts/verify-v3.mjs`,
`scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`.

---

## Job 1 — One song, one player, everywhere

### Today (read these first)
- Room headphones: `src/v3/desktop/Scan.jsx` ~L122–135 creates its own
  `new Audio('/os/audio/song.mp3')`, restarts at 0 on wear, pauses on removal.
  It listens to `window` event `workspace:headphones` with `detail.on`.
- Monitor app: `public/os/apps/resonance.js` creates a second `<audio>` element
  inside the OS iframe, routes it into `ctx.audio.analyser` for the visualiser,
  has SONG/SYNTH modes, and pauses itself on `v3:visibility` state `room`.
- Menubar toggle: `public/os/shell/desktop.js` L22–28 `#sound-toggle` calls
  `ctx.audio.toggle()`, which starts/stops the synth pad in
  `public/os/shell/audio.js` — not the song.
- The OS runs in a same-origin iframe (`DhruvOSScreen.jsx`, `TRUSTED_ORIGIN`).

### Target behaviour
1. Exactly one `HTMLAudioElement` plays `song.mp3`, owned by the parent page
   (the room), in new module `src/v3/desktop/musicPlayer.js`. It survives
   entering/leaving the monitor. Leaving the monitor must NOT pause it.
2. API (singleton, also exposed as `window.__v3Music` for the iframe):
   `play()`, `pause()`, `toggle()`, `seek(seconds)`, `setVolume(0..1)`,
   `setOutput('speakers'|'headphones')`, `setListenerDistance(metres)`,
   `getState() -> { playing, currentTime, duration, volume, output }`,
   `getAnalyser() -> AnalyserNode`, `subscribe(fn) -> unsubscribe`
   (fn called with getState() on every change and at most every 250 ms while playing).
3. Sound difference (same track, same playhead):
   - `headphones`: dry, full-range signal.
   - `speakers`: highpass ~120 Hz, lowpass ~5 kHz, a short room echo (a
     ConvolverNode with a generated ~0.4 s decaying-noise impulse, wet ≈ 0.18),
     overall gain ×0.7.
   - Crossfade the two paths over 300 ms when output changes; no restart, no click.
   - `setListenerDistance(d)`: speakers path only, gain ×clamp(1.2/d, 0.25, 1).
     The orchestrator will call this from the room camera; default distance 1.2.
4. Headphones (`Scan.jsx` effect): on `detail.on === true` → `setOutput('headphones')`
   then `play()` (do NOT reset to 0 — keep the playhead). On `false` → `pause()`
   and `setOutput('speakers')`. This replaces the existing `new Audio(...)`.
5. Monitor Music Player and the menubar toggle both drive `window.parent.__v3Music`
   when it exists. When the OS is opened standalone (no parent API), fall back to
   today's local `<audio>` behaviour so `/os` still works alone.
6. Visualiser reads `getAnalyser()` from the parent API (same-origin access is
   fine). Keep the idle "breathing" animation when paused.
7. The SYNTH source: remove it from the menubar toggle (toggle = song play/pause,
   label `♪ ON` / `♪ OFF` reflecting shared state via `subscribe`). Keep the SYNTH
   option inside the Music Player only if it still works without touching the
   shared song; otherwise remove it and say so in the report.

### Rename
- `resonance` → Music Player everywhere visitors can see it: window title
  `Music Player`, desktop/menu label (`public/os/shell/desktop.js` L159 today
  `♫  Resonance`), overlay hint text, bottom-left label, terminal references in
  `public/os/apps/terminal.js`. Rename the file to `public/os/apps/music.js`
  with `id: 'music'` and update `public/os/shell/registry.js`. Update docs under
  `public/os/docs` and `public/os/HANDOFF.md` that mention Resonance.

### Verify (new `scripts/verify-music-sync.mjs`)
Playwright, `--autoplay-policy=no-user-gesture-required`, hook
`HTMLMediaElement.prototype.play` like `scripts/verify-headphones-song.mjs`.
Assert, printing PASS lines:
- Only one audio element with `src` ending `/os/audio/song.mp3` exists across
  the page and the iframe after: wearing headphones, entering the monitor,
  opening Music Player, pressing play/pause there, using the menubar toggle.
- Playhead continuity: wear headphones, wait 3 s, take off, open the monitor,
  press play in Music Player → `currentTime` ≥ 2.5 (not restarted).
- `getState().output` is `headphones` while worn and `speakers` otherwise.
- Leaving the monitor (Escape) while playing → still playing.
- `scripts/verify-headphones-song.mjs` still passes (it expects loop=true,
  playing while worn, paused after removal).

---

## Job 2 — One app per project

The desktop apps are named after visual effects (Decoder, Kinetic, Flux,
Corrupted, Reality Tear, Gravity). Visitors can't tell what they are. The owner
decided: **one app per project, each using an existing effect as its
presentation; effects with no project are cut.** Apps are named by the project.

### Mapping (implement exactly)
| New app (title = project name) | Built from | What the effect shows |
|---|---|---|
| DarkSentinel | `tear.js` (Reality Tear) | Surface layer = normal network-flow dashboard; tearing reveals the darknet layer: the real pipeline steps from content (flow scoring → Tor scrape → text classification → risk routing) and the uncertain-zone LLM decision. |
| BasketProof | `decoder.js` | Grocery lines and totals scramble and only resolve to a value when "verified"; lines that can't be verified stay `UNKNOWN`. Text from the project's `decision`/`broke`. No real prices — use the words `VERIFIED` / `UNKNOWN`, not invented rupee amounts. |
| FocusLock | `corrupted.js` | Distraction glitch that clears into the lock screen as the limit hits; shows the real `decision` and `broke` text (SendInput fix, Firestore rules). |
| Expense Tracker | `kinetic.js` | Incoming bank-SMS-style lines animate into ledger rows; shows the peek/ack decision text. Use placeholder message text that is clearly illustrative (e.g. `INR ••• debited`), no fake amounts presented as real data. |
| Skills | `gravity.js` | Keep as is, retitle `Skills`. |

Cut: `fluid.js` (Flux). Remove from `registry.js`, delete the file, remove menu
entries and any content references (`src/v3/content/index.js` skill `three`
note mentions "Flux, Kinetic, Reality Tear" — reword to the new app names).
Each app keeps a one-line header inside its window: `<Project> — <tagline from content>`.
Keep existing app ids stable only if other code references them; otherwise use
ids `darksentinel`, `basketproof`, `focuslock`, `expense`, `skills`.

### Content corrections in `src/v3/content/index.js` (verified against the repos)
- Project `basket`: name `BasketProof` (matches the owner's résumé). Remove
  "cart-sync" wording — the code adds items to each platform separately; it does
  not sync carts. Tech: `Python`, `FastAPI`, `PostgreSQL`, `Kotlin`.
- Project `expense`: parsing happens in TypeScript (`src/parser.ts`); Kotlin
  only captures SMS/notifications into the peek/ack buffer. Reword the
  description accordingly.
- Project `focuslock`: year `2026` (first commit 2026-06-27).
Then run `node scripts/gen-os-content.mjs`.

### Verify
Update `scripts/verify-os-apps.mjs` to open each of the five apps by its new
title, assert its header line equals `<name> — <tagline>` from generated
content, assert Flux/Decoder/Kinetic/Corrupted/Reality Tear/Resonance titles no
longer appear anywhere in the desktop DOM, and screenshot each app to
`scripts/shots/app-<id>.png`.

---

## Job 3 — Shake step explains itself

`src/v3/desktop/PhoneScreen.jsx` friction step `shake` (~L1213–1220 today: title
"Shake Challenge", hint "Move your mouse side to side quickly", "Shake meter: N%").
Visitors don't know why moving the mouse matters.

Change the step to show, above the meter:
1. Line 1 (source copy, keep): `Shake your phone to continue`
2. Line 2 (new, smaller): `On the real phone you physically shake it. Here, move your mouse left and right quickly.`
3. A small looping CSS animation of a phone icon rocking left-right (pure CSS,
   no rAF, stops when the step unmounts), beside a mouse icon with ← → arrows.
4. The meter bar visibly fills as reversals are detected; while progress is 0
   and no mouse movement has happened for 2 s, pulse the arrows once per second.
Use `window.__phoneTimeScale` for any timers, as the existing steps do.

### Verify
Update `scripts/verify-focuslock-app.mjs` shake step: assert both lines'
exact text, assert the rocking element has a running CSS animation
(`getAnimations().length > 0`), keep the existing mouse-reversal completion
path, save `scripts/shots/phone-friction-shake.png`.

---

## Report (write `docs/review/gemini-round6.md` and commit it)
1. Commits (hash + subject) per job.
2. For Job 1: the final `musicPlayer.js` API with file:line, and the node graph
   (element → … → destination) for both outputs.
3. Any change you needed in a file you do not own — exact diff, not applied.
4. Verbatim last 10 lines of: `verify-music-sync.mjs`, `verify-headphones-song.mjs`,
   `verify-os-apps.mjs`, `verify-focuslock-app.mjs`, and `npm run build`.
5. Screenshot paths the orchestrator should look at.
6. Anything skipped or not working, each on its own line.
