# Round 5 — Gemini: room UI (SIT button, collapsible controls, masthead, headphones label)

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written. If a step
is impossible as written, skip only that step, finish the rest, and explain it
under "Deviations".

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Ownership this round (changed)

| Owner | Paths |
|---|---|
| **You** | `src/v3/desktop/Scan.jsx`, `scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`, `scripts/verify-v3.mjs`, `public/os/**`, `src/v3/desktop/PhoneScreen.jsx`, `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs`, `docs/review/gemini-round5.md` |
| Sonnet | `WorkspaceStage.jsx`, `buildWorkspace.js`, `buildRoomInteractions.js` and all other `src/v3/desktop/*` files not listed above; `scripts/verify-room-polish.mjs`, `scripts/measure-sky.mjs` |

Sonnet is changing the 3D room at the same time (hands, walls, lighting).

- **Commit scoped on the command line:** `git commit -m "<msg>" -- <paths>`.
  Never a bare `git commit`: in round 4 a bare commit by one agent swept in the
  other's staged files. No `add -A`, `add .`, `commit -a`, `stash`, `reset`,
  `checkout --`, `--amend`. Git lock: wait 10 s, retry up to 6 times.
- Build `npm run build`, test on `http://localhost:4173`.

## Before you start

Read `docs/PROMPT-R3-SONNET-ROOM.md` sections **3d**, **3e** and **3f**. Those
specs are now yours, with the changes below. The masthead is `.scan-head` and the
seat control bar is `.seat-exit`, both in `Scan.jsx`.

## Job 1 — SIT is the obvious first action (commit: `feat(room): make SIT the obvious first action`)

Exactly spec 3d. Find where the `SIT` marker/button is rendered (search
`Scan.jsx` and, read-only, `WorkspaceStage.jsx` for `SIT`). If its markup lives in
`WorkspaceStage.jsx` (Sonnet's), do the styling through a CSS rule in
`Scan.jsx`'s `css` string targeting its class and change the label there only if
the label is in `Scan.jsx`; otherwise write the exact label change under
"Requests for the orchestrator". Screenshot `sit-cta.png` in the standing view
and `sit-cta-reduced.png` with `reducedMotion: 'reduce'` (no pulse).
Test in `verify-room-interactions.mjs`: the SIT control's bounding box height
≥ 44 px and its computed background colour equals the accent colour.

## Job 2 — collapsible seat controls (commit: `feat(room): collapse the seat controls`)

Exactly spec 3e, including: collapsed by default into `CONTROLS ▸`, expanded
`CONTROLS ▾`, `aria-expanded`, `sessionStorage['v3:controls']`, `STAND UP / ESC`
always visible, Esc still stands up, and `.resume-link` visible whenever the
drawer is open even when collapsed.

Add a helper to each test file you own that clicks seat buttons
(`verify-room-interactions.mjs`, `verify-held-objects.mjs`, `verify-v3.mjs`):
`async function expandControls(page)` that clicks the toggle only if
`aria-expanded` is `false`, and call it before every seat-button click. Add
assertions: collapsed on first load, expanded state survives a reload in the same
session, Esc stands up while collapsed. Screenshots `controls-collapsed.png`,
`controls-expanded.png`.

## Job 3 — masthead does not overlap the poster (commit: `fix(room): hide the masthead while seated`)

The masthead half of spec 3f only: while seated, `.scan-head` fades to
`opacity: 0` over 0.3 s with `pointer-events: none`; restored on stand-up. The
poster frame is Sonnet's. Test: seated → computed opacity `0` after 400 ms;
standing → `1`. Screenshot `masthead-seated.png`.

## Job 4 — headphones button label (commit: `feat(room): headphones button reflects wearing state`)

Sonnet sets `data-headphones-on="1" | "0"` on `.workspace-stage` when the
headphones are worn or removed. In `Scan.jsx`, the HEADPHONES seat button reads
`HEADPHONES OFF` while the attribute is `"1"`, otherwise `HEADPHONES`. Observe
the attribute with a `MutationObserver` created after the stage mounts and
disconnected on unmount. If the attribute never appears (Sonnet not finished),
the label stays `HEADPHONES`. Don't fake the attribute in app code. In the
test, if the attribute is absent after clicking HEADPHONES, print
`SKIP headphones label: attribute not present yet` instead of failing.

## Verification (paste the last 8 lines of each)

```
npm run build
BASE=http://localhost:4173 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4173 node scripts/verify-held-objects.mjs
BASE=http://localhost:4173 node scripts/verify-v3.mjs
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
BASE=http://localhost:4173 node scripts/verify-focuslock-app.mjs
```

## Report — `docs/review/gemini-round5.md` (commit with `-- docs/review/gemini-round5.md`)

```
# Gemini round 5 report
## Commits
## Commands run            (command + last 8 lines verbatim)
## Where SIT lives         (file:line, and what you changed or requested)
## Screenshots to review   (path — what to look for)
## Deviations
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted.
