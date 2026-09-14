# Round 5 — Sonnet: the 3D room polish only

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will read your diff, rerun your
tests and look at every screenshot. Execute exactly what is written.

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.

## Why this round is narrow

You deferred jobs 3a–3h in round 3 and again in round 4. This round contains
**nothing else**, so the whole budget goes to them. The DOM jobs (3d SIT button,
3e collapsible controls, the masthead half of 3f) moved to Gemini. Do not do them.

## Ownership this round

| Owner | Paths |
|---|---|
| **You** | `src/v3/desktop/WorkspaceStage.jsx`, `src/v3/desktop/buildWorkspace.js`, `src/v3/desktop/buildRoomInteractions.js`, every other file in `src/v3/desktop/` **except** `Scan.jsx`, `PhoneScreen.jsx`, `DhruvOSScreen.jsx`; `scripts/verify-room-polish.mjs` (new), `scripts/measure-sky.mjs`, `docs/review/sonnet-round5.md` |
| Gemini | `src/v3/desktop/Scan.jsx`, `scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`, `scripts/verify-v3.mjs`, `public/os/**`, `PhoneScreen.jsx` |

- **Commit only your paths, scoped on the command line:**
  `git commit -m "<msg>" -- <path1> <path2>`. In round 4 a plain `git commit`
  swept Gemini's staged deletion into your report commit. Never run `git commit`
  without `-- <paths>`. No `add -A`, `add .`, `commit -a`, `stash`, `reset`,
  `checkout --`, `--amend`. Git lock: wait 10 s, retry up to 6 times.
- Build `npx vite build --outDir dist-sonnet`, serve
  `npx vite preview --outDir dist-sonnet --port 4174 --strictPort`, run scripts
  with `BASE=http://localhost:4174`.
- No new dependencies, no downloaded assets. Render-on-demand, bounded
  animations, idle = zero frames.

## Jobs, in this order, one commit each

The full specifications are in `docs/PROMPT-R3-SONNET-ROOM.md`, section
"Job 3 — room polish": **3a** (including the audit table and all measured
checks), **3b**, **3g**, **3h**, **3c**, and **only the poster part of 3f**
(frame, mat and wall offset; not the masthead). Read those sections now and
follow them exactly, with these changes:

1. **3a is split into one commit per audit-table row**, in table order:
   `notebook-held`, `notebook-mid`, `coffee-sip`, `award-held`, `phone-mid`,
   `drawer-open`, `typing`, `lap-look`, `headphones`. Commit subject
   `fix(room): <id> — <what changed>` (under 72 chars). The first commit also
   creates `scripts/verify-room-polish.mjs` with the sampling harness.
2. **3a `headphones` row:** the headphone animation and wear state stay in 3D.
   Set `host.dataset.headphonesOn = '1' | '0'` on `.workspace-stage` whenever the
   state changes. Gemini changes the button label from that attribute; you don't
   touch `Scan.jsx`.
3. **3g** must not hide the window you fixed in round 4: the added inner walls
   leave the window opening clear, and the round-4 window test in
   `verify-room-interactions.mjs` must still pass (run it; it's Gemini's file,
   read-only for you).
4. **3h:** the round-4 blinds-first window behaviour stays; `measure-sky.mjs`
   targets stay.
5. For every job: `audit-before-<id>.png` at HEAD, `audit-after-<id>.png` after.
   Open both before committing.

If you must stop, stop after a finished commit, and list the remaining ids in
the report. Do not write "given remaining budget" without listing exactly which
ids are left.

## Verification (paste the last 8 lines of each)

```
npx vite build --outDir dist-sonnet
BASE=http://localhost:4174 node scripts/verify-room-polish.mjs
BASE=http://localhost:4174 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4174 node scripts/verify-held-objects.mjs
BASE=http://localhost:4174 node scripts/verify-v3.mjs
BASE=http://localhost:4174 node scripts/measure-sky.mjs
```

The last four are Gemini's or shared files; if one fails because of Gemini's
in-progress `Scan.jsx` work, say so with the output and do not edit them.

## Report — `docs/review/sonnet-round5.md` (commit with `-- docs/review/sonnet-round5.md`)

```
# Sonnet round 5 report
## Commits               (hash — subject)
## Commands run          (command + last 8 lines verbatim)
## Audit table results   (id | present at HEAD? | fixed? | numbers | before/after paths)
## Numbers               (check | before | after | threshold)
## Screenshots to review (path — what to look for)
## Not done              (exact ids, or "none")
## Deviations
## Requests for the orchestrator
```

Never claim a test passed unless its output is pasted. Do not describe a
screenshot you did not open.
