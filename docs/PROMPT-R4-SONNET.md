# Round 4 — Sonnet: the window really opens, room rename, then the deferred polish

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. If a step
is impossible as written, skip only that step, finish the rest, and explain it
under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Parallel work

Ownership, build and git rules are exactly as in `docs/PROMPT-R3-SONNET-ROOM.md`
("Parallel work — read first"). Read that section again before starting. You
build to `dist-sonnet`, serve on 4174, never touch `PhoneScreen.jsx`,
`public/os/**` or `src/v3/content/index.js`. Gemini is working at the same time.

## Order and scope

Job 1 → Job 2 → then round 3's deferred jobs in this order: 3a → 3b → 3g → 3h →
3c → 3f → 3d → 3e, exactly as specified in `docs/PROMPT-R3-SONNET-ROOM.md`
(including the 3a audit table and every measured check), with the change listed
under "Changes to round 3 specs" below. Commit after each job. Aim to finish all
of them. If you must stop, stop at a commit boundary and list what's left.

## Job 1 — the window still does not visibly open (commit: `fix(room): open the window where the seat can see it`)

The orchestrator opened `scripts/shots/window-closed-night.png` and
`window-open-night.png` from your round 3. The two images are the same except
the **blind slats** on the right shifted position. The 0.76 diff is the slats
moving (the sway tween or the blinds state), not the sash. From the seat, the
window does not read as open. Your report's claim that "the real bug was in the
test, not the geometry" is wrong.

Cause to address: the sash is behind the closed blinds, so nothing about it can
be seen from the seat.

1. **Opening the window raises the blinds first.** In the `windowOpen` action:
   if `state.blinds < 0.5`, run the existing blinds-raise animation first
   (same code path as the BLINDS action, same duration), then slide the sash.
   Closing the window does not lower the blinds. The blinds sway tween from
   round 2 is removed (it confounds the measurement and adds nothing once the
   blinds are up).
2. The open gap must be clearly visible from the seat: the sash (frame + glass)
   slides 0.58 m and the part of the opening it uncovers shows the skyline with
   no glass tint; the glass on the sash keeps the round-2 material (the
   `MeshPhysicalMaterial` regression is not required any more). Add a 3 cm
   dark (`#20242a`) sash frame so its edge reads against the sky.
3. **Test that isolates the sash.** In `verify-room-interactions.mjs`:
   at `?sky=night`, seated, click BLINDS to raise them, wait for idle, hide
   markers, take `window-closed-night.png`; click WINDOW, wait for idle, hide
   markers, take `window-open-night.png`. The blinds are up in both shots, so
   only the sash changes. Region = `projectAnchor('windowOpen')` ± 12%.
   Assert ≥ 3%. Do the same at `?sky=day`. Also assert that clicking WINDOW with
   the blinds down ends with `dataset.blindsOpen` > 0.5.
4. Crop the window region of both night shots into
   `window-crop-closed-night.png` and `window-crop-open-night.png` and open them
   yourself before reporting. Describe in one sentence what visibly differs.

## Job 2 — the OS has no name in the room (commit: `feat(room): drop the dhruvOS name from the room`)

The owner decided the in-monitor OS is not named anywhere visitors see.
Internal identifiers (component name `DhruvOSScreen`, `source: 'dhruvOS'`
message field, file names, comments) stay.

| File | Current | New |
|---|---|---|
| `src/v3/desktop/buildWorkspace.js` monitor texture header | `ctx.fillText('dhruvOS', 26, 28)` | remove this text draw (keep `WORKSPACE 01`) |
| `src/v3/desktop/buildWorkspace.js` monitor list | `'01   dhruvOS'` | `'01   Open the computer'` |
| `src/v3/desktop/DhruvOSScreen.jsx` status `preparing` | `CONNECTING TO DHruvOS` | `CONNECTING` |
| `src/v3/desktop/DhruvOSScreen.jsx` status `inside` | `DHruvOS ONLINE` | `ONLINE` |
| `src/v3/desktop/DhruvOSScreen.jsx` error text | `dhruvOS failed to initialise.` | `The computer failed to start.` |
| `src/v3/desktop/DhruvOSScreen.jsx` error text | `The embedded dhruvOS document could not be loaded.` | `The computer could not be loaded.` |
| `src/v3/desktop/DhruvOSScreen.jsx` `aria-label` | `dhruvOS embedded screen` | `Desk computer screen` |
| `src/v3/desktop/DhruvOSScreen.jsx` iframe `title` | `dhruvOS` | `Desk computer` |
| `src/v3/desktop/Scan.jsx` error | `dhruvOS did not respond. The room is still available.` | `The computer did not respond. The room is still available.` |

Update any assertion in your test files that matched the old strings. Then grep
`src/v3/desktop` and `scripts` case-insensitively for `dhruv ?os` and paste the
output with a reason per remaining line (internal identifier, comment or test
label only).

## Changes to round 3 specs

- 3a `headphones` row: replace "HEADPHONES ON state readout" with: while worn,
  the HEADPHONES seat button reads `HEADPHONES OFF` (clicking removes them).
  No new readout element.
- 3e: the `OPEN RESUME (PDF)` link you added in round 3 stays visible whenever
  the drawer is open, even when the controls are collapsed (unchanged), and
  `STAND UP / ESC` stays visible when collapsed.
- 3h: the lighting targets stay, and the round-4 Job 1 blinds change must not
  break `measure-sky.mjs` (it measures with the blinds in their default state;
  keep that default).

## Verification (paste the last 8 lines of each)

```
npx vite build --outDir dist-sonnet
BASE=http://localhost:4174 node scripts/verify-v3.mjs
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
BASE=http://localhost:4174 node scripts/verify-room-polish.mjs
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```

## Report — `docs/review/sonnet-round4.md`, committed last (`docs: sonnet round 4 report`)

```
# Sonnet round 4 report
## Commits
## Commands run          (command + last 8 lines verbatim)
## Window                (what visibly differs in the crops; diff night/day)
## Rename grep           (output + reason per line)
## Audit table results   (3a: id | present at HEAD? | fixed? | before/after paths)
## Numbers               (check | before | after | threshold)
## Screenshots to review (path — what to look for)
## Deviations            (including any job not done)
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted. Do not describe a
screenshot you did not open.
