# Gemini — round 8

Repo: `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
Read `AGENTS.md` and the top of `docs/HANDOFF.md` first.

Fable 5.1 is the lead on this repo. It may add to or rewrite this brief. **Where
Fable's instructions and this file disagree, Fable wins.** Work ends up in the
same branch, so commit in small units and don't rewrite history.

## Rules

- Commit locally on `feat/v3` only. Conventional Commits, subject under 72
  characters, no trailing period, no attribution lines. Never push.
- **Never modify the source repos** listed below. Read them, copy or build from
  them into this repo. Never copy `.env` files, keys, tokens or service-account
  files.
- Never invent numbers, awards, roles or claims. Facts come from
  `src/v3/content/index.js` or from the source repo itself. Demo data is allowed
  only as visibly labelled fake data (`DEMO DATA`).
- Cite only files and commits that exist. Round 7's report cited a BasketProof
  commit (`65561a3`) and file (`Colors.kt`) and CrisisWatch commit (`8f8e025`)
  and files (`VerdictCard.tsx`, `MisinformationFeed.tsx`) that do not exist. Run
  `git rev-parse` and `ls` before citing anything.
- Report honestly: paste real test output, say what you did not test.

## Task 1 — accuracy fixes (start here)

1. `public/os/apps/fraud.js` About box says Dhruv contributed "the dashboard
   shell". Wrong. His commits on the Fraud project were README edits and the
   model file; the model work was a teammate's. In the `kharghar` frontend repo,
   1 of 8 commits is his. Reword to exactly that.
2. `public/os/apps/darksentinel.js` says "CICFlowMeter extracts 83 network flow
   features". 83 appears in neither the DarkSentinel repo nor the content file.
   Remove the number.
3. Correct `docs/review/gemini-round7.md`: BasketProof is at `c5d527c`, package
   path `android/app/src/main/java/in/basketproof/app/`; CrisisWatch is at
   `330509f` and its real components are `app/components/ui/verdict-card.tsx`,
   `app/components/sections/trending.tsx`, `app/components/ui/progress-stepper.tsx`.

## Task 2 — replace the Skills app

`public/os/apps/gravity.js` drops skill chips under physics. Nobody can read
them. The owner wants "whatever is the best and readable". Replace it with a
readable app: skills grouped by area, each showing the projects that prove it
(`skills[].proof` in `src/v3/content/index.js` already holds those links),
large type, no physics, no motion needed to read it. Keep the app's registry
entry and window lifecycle working. Update `scripts/verify-os-apps.mjs` for the
new app.

## Task 3 — real project UIs (after Fable's recipe lands)

The owner rejected round 7's hand-drawn copies: "the monitor projects dont have
the real ui which i had in the codebase or github". He chose to **build the real
frontends from the repos**, with backends, API routes and Firebase replaced by
in-browser fake data.

Fable designs the pattern (static build, mocking, how it is framed inside
dhruvOS and on the phone) and proves it on one app. **Wait for that recipe** —
it will be added to this file or to `docs/HANDOFF.md` — then apply it to the
remaining apps:

| Project | Repo | Runs on |
|---|---|---|
| DarkSentinel | `C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui` | monitor |
| CrisisWatch | `C:\Users\hp\AppData\Local\Temp\resume-audit\crisiswatch-web` | monitor |
| Fraud Detection | `C:\Users\hp\kharghar-hacks\kharghar` | monitor |
| FocusLock desktop | `C:\Users\hp\OneDrive\Desktop\new-focuslock\windows-agent` | monitor |
| Expense Tracker | `C:\Users\hp\expense-tracker` | phone |
| BasketProof | `C:\Users\hp\OneDrive\Desktop\comparison` | phone |

Reddit Growth Copilot stays out.

Ownership limits still apply inside the real UIs: DarkSentinel is a team
project (Deven owned model training, the LLM work and Tor capture; Dhruv built
the dashboards, API features and the uncertain-zone Claude call). Fraud's model
is a teammate's. Don't present teammates' work as Dhruv's.

**Readability is a requirement, not polish.** The owner: "it should look good and
zoomed in and flattering, people shouldnt have to squint to see the ui
elements." Check every screen at the size it actually appears on the monitor
and phone in the room, not only at full browser size. Fable sets the concrete
standard; follow it.

## Verification

```bash
npm run build
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
BASE=http://localhost:4173 node scripts/verify-project-uis.mjs
BASE=http://localhost:4173 node scripts/verify-v3.mjs
```

Start the preview before running tests, or every suite fails to connect.
`npm run preview` strips arguments here, so call Vite's bin directly.

Report to `docs/review/gemini-round8.md`: commits, what changed per app, real
test output, screenshots at in-room size, and anything skipped.
