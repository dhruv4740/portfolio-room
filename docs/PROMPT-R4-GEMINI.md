# Round 4 — Gemini: remove invented phone data, cut Cosmos, ML skill, song in Resonance

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. If a step
is impossible as written, skip only that step, finish the rest, and explain it
under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Parallel work

Same ownership as round 3. Sonnet is working on the room.

| Owner | Paths |
|---|---|
| **You** | `public/os/**`, `src/v3/content/index.js`, `src/v3/desktop/PhoneScreen.jsx`, `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs`, `song.mp3` (move only), `docs/review/gemini-round4.md` |
| Sonnet | every other file under `src/v3/desktop/**`, `scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs`, `scripts/verify-room-polish.mjs` |

Stage by explicit path; no `add -A`, `add .`, `commit -a`, `stash`, `reset`,
`checkout --`, `--amend`. Git lock: wait 10 s, retry up to 6 times, never delete
it. Build with `npm run build`, test against `http://localhost:4173`. Scratch
scripts outside the repo are fine; none inside it.

## Job 1 — no invented data on the phone (commit: `fix(phone): show only real FocusLock content`)

The orchestrator checked your round-3 screens against the FocusLock source.
The settings, friction toggles, sync code, focus session and Reels/Shorts
policies are real. These are **not in the source** and must go:

1. **Sample session tasks** "Deep work on thesis", "Review PRs", "Draft specs".
   The task list starts empty. Show the real empty state if the source has one
   (search `MainActivity.kt` and `activity_main.xml` for the task list and its
   empty text); otherwise show no rows and no placeholder text. Adding a task
   still works and persists.
2. **Usage numbers** "42.0 / 60 min used", "14 opens today · 3 Reels · 2 Shorts".
   Opens = the visitor's real Instagram opens count that the lock screen already
   uses. Minutes, Reels and Shorts = `0`. The limit value = the real default
   from `FocusPolicyClient.kt` (quote the line in the report); if there is none,
   show opens only and remove the "min used" bar.
3. **Duration preset chips** `15m / 25m / 45m / 60m` and the `-5m / +5m`
   buttons: keep them only if the source has them (search for the values and
   the button ids and quote the lines). Otherwise replace them with exactly
   the control the source uses.
4. **The Instagram feed screen** (`phone-fl-instagram-feed.png`: "dhruv4740",
   "1,337 likes", "Unblocked by your FocusLock policy", the caption). Delete the
   screen and all code paths to it. The owner decided the Instagram flow is only
   "open Instagram → blocked by FocusLock". Tapping Instagram always shows the
   lock overlay, whatever the FocusLock settings say. If a setting in the app
   claims to unblock Instagram, it may still change in-app state, but it doesn't
   bypass the lock in this demo.
5. The "Shield Active" / "Usage: ACTIVE" permission badges: keep only if the
   source has these labels (quote them), otherwise remove.
6. Then grep `PhoneScreen.jsx` for every user-visible string literal and list
   each in the report with either the source file and line it came from, or
   "visitor state" / "computed". Any string with neither gets removed.

Update `verify-focuslock-app.mjs`: remove the feed checks; assert that after a
fresh `localStorage.clear()` the dashboard shows no task rows and the minutes
value is `0`; assert that tapping Instagram with every FocusLock toggle turned
off still shows the lock overlay. Re-shoot every `phone-fl-*.png`.

## Job 2 — cut Cosmos (commit: `feat(os): remove the Cosmos app`)

Delete `public/os/apps/cosmos.js` and every reference to it: app registry or
imports, desktop icon lists, terminal commands and `ls`/`help` output, docs
under `public/os/docs` and `public/os/HANDOFF.md` (remove the lines), and tests.
Then grep for `cosmos` (case-insensitive) in `public/os`, `src`, `scripts` and
paste the output (expected: nothing). In `verify-os-apps.mjs`, assert that no
desktop label and no terminal `ls` output matches `/cosmos/i`, like the existing
Wormhole/Lab check.

## Job 3 — ML skill without DarkSentinel (commit: `fix(content): ml skill cites only the fraud project`)

In `src/v3/content/index.js`, the `ml` skill becomes exactly:
`{ id: 'ml', label: 'ML / data', proof: ['fraud'], note: 'XGBoost, pandas' }`.
Run `npm run build` so `public/os/shell/content.js` is regenerated, and commit both.

## Job 4 — Resonance loops the owner's song (commit: `feat(os): resonance plays and loops the song`)

1. `git mv` is not possible (the file is untracked): move `song.mp3` from the repo
   root to `public/os/audio/song.mp3` (create the folder). Commit it.
2. Read `public/os/apps/resonance.js` and the shell audio it uses
   (`appCtx.audio`, the analyser). Make the song the Resonance source:
   - one `HTMLAudioElement` (`loop = true`, `preload = 'none'`) connected via
     `createMediaElementSource` to the existing analyser so the visualiser reacts
     to the song;
   - it plays **only** after a click inside Resonance (the existing overlay/play
     control); never autoplay, never on mount;
   - a play/pause button and a volume slider (0–1, default 0.6), styled like the
     existing overlay controls;
   - pause on `setVisible(false)`, on window close/cleanup and on the
     `v3:visibility` hidden event; resume on becoming visible only if it was
     playing before it was hidden;
   - `createMediaElementSource` can only be called once per element: create the
     element and source lazily once per app instance and disconnect them in cleanup.
   - If the shell's synthesized audio is currently the Resonance source, keep it
     available as a second choice (`SONG` / `SYNTH` toggle, default `SONG`).
3. Tests in `verify-os-apps.mjs`: open Resonance → assert the audio element is
   paused and `currentTime === 0` (no autoplay); click play → after 1 s
   `currentTime > 0.5` and `loop === true`; minimize → paused; close → the
   element is removed and paused. Screenshot `resonance-song.png`.

## Verification (paste the last 8 lines of each)

```
npm run build
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
BASE=http://localhost:4173 node scripts/verify-focuslock-app.mjs
BASE=http://localhost:4173 node scripts/verify-v3.mjs
```

## Report — `docs/review/gemini-round4.md`, committed last (`docs: gemini round 4 report`)

```
# Gemini round 4 report
## Commits
## Commands run            (command + last 8 lines verbatim)
## Phone strings audit     (table: string | source file:line OR visitor state/computed)
## Removed invented content (list)
## Cosmos grep             (output)
## Resonance               (how the song connects to the analyser; test results)
## Screenshots to review   (path — what to look for)
## Deviations
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted.
