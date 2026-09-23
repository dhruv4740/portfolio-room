# Round 7 — Gemini: every project runs as its real UI

Repo: `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
The orchestrator (Claude) is editing the 3D room at the same time. Stay inside
"You own". If you need a change elsewhere, write the exact diff in your report
instead of making it.

## Goal
The owner's direction: **visitors use the real projects, not effects about them.**
FocusLock on the phone is the model: it rebuilds the real Android app's
screens from its source. Do the same for every other project:
- **Phone apps run on the phone** (`PhoneScreen.jsx`).
- **Desktop/web apps run on the monitor** (the OS in `public/os/`).
- Backends are **not** rebuilt. Each UI runs on a small in-browser simulation
  (fixture data + fake latency) that behaves like the real backend's responses.

This replaces the round-6 effect apps (`tear.js`, `decoder.js`, `corrupted.js`,
`kinetic.js` as project apps). Keep `gravity.js` (Skills), `music.js`,
`terminal.js`, `about.js`, `contact.js`, `projects.js`, `gallery.js`, `wallpaper.js`
unless an item below says otherwise. Delete the effect apps once their project
has a real UI, and remove them from `registry.js`, menus and the terminal.

## Rules
- Commit per project, Conventional Commits, subject < 72 chars, no trailing
  period, no attribution lines. `git add <new files>` then
  `git commit -m "..." -- <paths>`. Never commit to main. Never push.
- **Source of truth is each project's own code.** Rebuild screens, labels,
  flows, states and error messages from the repo: routes/pages/components,
  strings, API response shapes. Do not invent features, screens or copy.
- **No invented numbers presented as real.** Fixture data must be obviously
  sample (e.g. `Sample item`, `demo@example.com`, round values) and each app
  shows a small persistent `DEMO DATA` tag. No fake user counts, accuracy
  figures, prices claimed as live, or testimonials.
- No network calls to real services, no API keys, no secrets copied from repos
  (check `.env*`, `google-services.json`, keystores — never read values into
  code or output). Offline only; no new npm dependencies, no CDNs.
- Match each project's real visual style (colours, typography, layout) closely
  enough that the owner recognises it; it doesn't have to be pixel-perfect.
- Do not name the OS anywhere visitors can see it. No audio without a gesture.
- Build `npm run build`; test on `npx vite preview --port 4173`.

## You own
- `public/os/**`
- `src/v3/desktop/PhoneScreen.jsx` and new files under `src/v3/desktop/phone-apps/`
- `src/v3/content/index.js` (+ regenerate `public/os/shell/content.js` with
  `node scripts/gen-os-content.mjs`; never hand-edit the generated file)
- `scripts/verify-os-apps.mjs`, `scripts/verify-focuslock-app.mjs`, new
  `scripts/verify-project-uis.mjs`
- `docs/review/gemini-round7.md`

## Do not touch
`src/v3/desktop/WorkspaceStage.jsx`, `Scan.jsx`, `buildWorkspace.js`,
`buildRoomInteractions.js`, `buildSeatedFigure.js`, `perfGovernor.js`,
`musicPlayer.js`, `cityAudio.js`, `scripts/verify-v3.mjs`,
`scripts/verify-room-interactions.mjs`, `scripts/verify-held-objects.mjs`,
anything else under `docs/`.

## Step 0 — inventory (write it first, in the report, before coding)
For each project in `src/v3/content/index.js` find the source and decide
phone vs monitor **from the code**, not from this prompt. Known local copies
(confirm each exists; if not, use the public GitHub repo under `dhruv4740`, and
if there is no accessible source, say so and skip that project):

| Project | Likely source | Expected surface |
|---|---|---|
| FocusLock (Android) | already on the phone | phone (done) |
| FocusLock (Windows agent / Electron) | `C:\Users\hp\OneDrive\Desktop\new-focuslock` | monitor, if the repo has a desktop UI |
| Expense Tracker | `C:\Users\hp\expense-tracker` | phone (React Native) |
| BasketProof | `C:\Users\hp\OneDrive\Desktop\comparison` (and `comparison-blinkit-reliability`) | check: Kotlin client → phone; any web UI → monitor |
| DarkSentinel | `C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui` | monitor (Next.js / Streamlit dashboards) |
| CrisisWatch | `C:\Users\hp\AppData\Local\Temp\resume-audit\crisiswatch-web` (+ `crisiswatch`), or `github.com/dhruv4740/crisiswatch` | monitor; its WhatsApp bridge could be a phone chat screen if the code supports it |
| Reddit Growth Copilot | `C:\Users\hp\OneDrive\Documents\reddit-growth-copilot` | monitor |
| Fraud Detection Dashboard | `C:\Users\hp\kharghar-hacks\Fraud` | monitor (Flask upload + dashboard) |
| Eco Water System | ESP32 firmware, no UI expected | skip unless a UI exists; say so |

For each: repo path, commit hash you read, the screens you will rebuild (with
the source file for each), the simulated backend responses (with the source
file defining their shape), and anything you will not rebuild.

Only the owner's own work belongs in the UI. DarkSentinel is a team project:
the owner built the dashboards, API features and the uncertain-zone Claude
call; do not present teammates' parts as interactive features beyond what the
dashboard itself shows. The Fraud project's model work is a teammate's; the
owner's commits are README edits and the model file, so rebuild only the
dashboard shell and label the result demo data. Note these limits in each app's
About line.

## Step 1 — phone launcher
The phone home screen gets real app icons for every phone app (FocusLock plus
the new ones). Each opens full-screen in the phone and has a home gesture/button
back, like FocusLock today. Existing FocusLock friction and Instagram lock
behaviour must keep working.

## Step 2 — monitor apps
Each desktop/web project is one OS app titled with the project name, opening
in a window sized for its real layout, with the project's own navigation.
Remove the round-6 header line (`<name> — <tagline>`) where the real UI has its
own header; keep an About entry (menu or small ⓘ) with the content tagline and
the ownership note.

## Verify (`scripts/verify-project-uis.mjs`)
Playwright against `BASE`. For every rebuilt app, print PASS lines for:
- opens from its surface (phone icon or OS desktop/menu) with no page errors;
- at least two real screens/flows reachable by clicking, each asserting a
  string that exists in the project's source (cite file:line in a comment);
- the `DEMO DATA` tag is visible;
- no `fetch`/XHR/WebSocket to any non-same-origin URL (hook `fetch`,
  `XMLHttpRequest.open`, `WebSocket`);
- screenshots `scripts/shots/ui-<id>-<screen>.png`.
Also keep passing: `verify-os-apps.mjs` (update it for the new app set),
`verify-focuslock-app.mjs`, `verify-music-sync.mjs`, `verify-headphones-song.mjs`.

## Report (`docs/review/gemini-round7.md`, committed)
1. Step 0 inventory table.
2. Commits (hash + subject) per project.
3. Per app: screens built with their source files; what was skipped and why.
4. Diffs you needed in files you don't own (not applied).
5. Verbatim last 10 lines of each verify script and `npm run build`.
6. Screenshot paths to review.
7. Anything unfinished, each on its own line, saying whether the app works without it.
