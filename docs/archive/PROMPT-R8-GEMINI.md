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
   1 of 8 commits is his. Reword to exactly that. (This app is replaced by the
   real UI in Task 3; fix the text anyway, it may outlive the swap for a while.)
2. `public/os/apps/darksentinel.js` said "CICFlowMeter extracts 83 network flow
   features". That file is now the real UI's iframe entry (Task 3 is done for
   DarkSentinel), so this item is closed. Do not reintroduce the number anywhere.
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
new app. Meet the readability floor below.

## Task 3 — real project UIs: the recipe

The owner rejected round 7's hand-drawn copies: "the monitor projects dont have
the real ui which i had in the codebase or github". He chose to **build the real
frontends from the repos**, with backends, API routes and Firebase replaced by
in-browser fake data.

**The pattern is proven on DarkSentinel** (the hardest monitor app: Next.js 14
app router, 16 API routes proxying a FastAPI backend, a dynamic route, zustand,
recharts, framer-motion). It builds to a static export and runs as its real
self inside a dhruvOS window. Study these before starting any other app:

- `apps/darksentinel/PORTFOLIO.md` — what was changed and why (five files).
- `apps/darksentinel/lib/api.ts` + `lib/mock/router.ts` + `lib/mock/data.ts` —
  the mock layer. The components, stores and hooks are untouched.
- `apps/darksentinel/next.config.mjs` — static export config.
- `public/os/shell/iframeApp.js` — the window wrapper.
- `public/os/apps/darksentinel.js` — an eight-line app entry.
- `scripts/build-apps.mjs` — builds `apps/<name>/` into `public/apps/<name>/`.
- `scripts/verify-real-apps.mjs` — the test to extend (one row per app).

### The recipe, step by step

1. **Copy the source repo** into `apps/<name>/` without `node_modules`,
   `.next`/`dist`/`build`, `.git` and `.env*`:
   ```bash
   mkdir apps/<name> && (cd <repo> && tar --exclude=node_modules --exclude=.next --exclude=dist --exclude=.git --exclude='.env*' -cf - .) | (cd apps/<name> && tar -xf -)
   ```
   Write `apps/<name>/PORTFOLIO.md` with the source path, the commit hash you
   copied (`git rev-parse --short HEAD` in the source repo) and every file you
   change. Nothing else in the copy gets edited.
2. **Find every backend touchpoint** before changing anything: `grep -rn
   "fetch(\|axios\|ky\|EventSource\|firebase\|ipcRenderer\|electronAPI\|
   process.env" src app lib`. List them in `PORTFOLIO.md`. That list is the whole
   mock surface.
3. **Mock at the narrowest seam.** Prefer replacing one module over touching
   components:
   - HTTP client module (DarkSentinel's `lib/api.ts`): keep the export names,
     answer from a router. With `ky`, a `beforeRequest` hook may return a
     `Response`; with `axios`, use an adapter (`axios.create({ adapter })`); with
     bare `fetch`, wrap `window.fetch` for the app's own paths only.
   - Streams: shim `window.EventSource` for the app's SSE paths (see
     `installMockEventSource`).
   - Firebase: alias the modules in the bundler (`resolve.alias` in Vite:
     `firebase/app`, `firebase/auth`, `react-firebase-hooks/auth` → local files)
     that export the same names with an in-memory user. Never import the real
     SDK in the portfolio build.
   - Electron: the renderer only knows `window.electronAPI` (see
     `windows-agent/src/preload.cjs`). Add one script before `renderer.js` that
     defines the same object with in-memory state. No build step at all.
   Fixtures must be obviously sample (`Sample listing 3`, `demo@example.com`,
   round numbers) and the window title carries `· demo data` (the `title` in
   the app entry). Add a small fake latency (100–400 ms) so loading states show.
4. **Make it static.**
   - Next.js: `output: "export"`, `basePath` and `assetPrefix` `/apps/<name>`,
     `trailingSlash: true`, `images.unoptimized: true`; delete `app/api/**` and
     anything `server-only`; every dynamic route gets `generateStaticParams`
     over the fixture ids and `dynamicParams = false`. Pages that read
     `useSearchParams` must sit under `<Suspense>` (DarkSentinel already does).
   - Vite: `base: '/apps/<name>/'`, `build.outDir: 'out'`. Hash routing is not
     required, but `BrowserRouter` needs `basename="/apps/<name>"`.
   - Plain HTML (Electron renderer): copy the files as they are into
     `apps/<name>/out/` and set `"portfolio": { "command": "node -e 0" }` in a
     minimal `package.json`, or just place them in `public/apps/<name>/`
     directly and document it.
   Add `"portfolio": { "outDir": "out", "command": "npm run build" }` to the
   app's `package.json` if the defaults differ.
5. **Build and commit the output.** `node scripts/build-apps.mjs <name>` writes
   `public/apps/<name>/`. Commit both `apps/<name>/` (source, no
   `node_modules`) and `public/apps/<name>/` (output). The portfolio's own
   `npm run build` copies `public/` as-is and never runs the app's toolchain.
   `.gitignore` already excludes `node_modules`; check `apps/<name>/.next` and
   `out` are not committed twice.
6. **Register the window.** `public/os/apps/<name>.js`:
   ```js
   import { iframeApp } from '../shell/iframeApp.js';
   export default iframeApp({ id: '<name>', title: '<Title> · demo data', icon: '…', src: '/apps/<name>/' });
   ```
   The window opens at 1280×780 (capped by the workspace). `iframeApp` removes
   the iframe on close and posts `app-hide`/`app-show` on minimise; an app that
   runs timers or animations may listen for those messages and pause. Do not
   touch `windowManager.js` or `DhruvOSScreen.jsx`; the nested iframe is
   same-origin and needs nothing from the shell.
7. **Test.** Add a row to `APPS` in `scripts/verify-real-apps.mjs`: the desktop
   icon text, the iframe path, a regex for the first screen's text, and one or
   two steps (button text → text that must appear). Headless Chromium does not
   reliably paint a nested iframe, so the checks are text-based; take the
   visual proof on the real GPU with `GPU=1`-style launches (see
   `scripts/shots-hands.mjs` for the launch flags) or in a real browser. Run
   `verify-os-apps`, `verify-project-uis`, `verify-real-apps` and `verify-v3`.
8. **Load cost.** Report the first-load JS of the app's entry page from its
   build output (DarkSentinel: 282 kB raw for `/`, 2.4 MB for the whole export
   folder, fetched only when the window opens). Anything above ~600 kB raw for
   the first screen needs a note and, if possible, a trim (lazy routes, drop
   tsparticles/three from the portfolio build via alias to a no-op).

### Per-app notes

| App | Stack | Mock seam | Static how | Risk |
|---|---|---|---|---|
| DarkSentinel | Next 14, ky, zustand, recharts | done: `lib/api.ts` | done | — |
| CrisisWatch (`330509f`) | Next 14, GSAP, framer-motion, canvas-confetti | `fetch("/api/check")`, `EventSource("/api/check/stream")`, `fetch("/api/trending")` in `app/components/sections/live-demo.tsx` and `trending.tsx`; `app/api/trending/route.ts` already contains `MOCK_TRENDING` — reuse it as the fixture | as DarkSentinel; delete `app/api`; `images.domains` unsplash → `unoptimized`, keep the URLs (remote images load only online; say so) | low |
| Fraud (`31c0cd4`, `kharghar`) | Vite React, Firebase auth, axios to `localhost:5000`, recharts, tsparticles, @react-three/fiber | `src/firebase/firebase.tsx`, `src/services/api.ts`, `react-firebase-hooks` | Vite `base`; alias Firebase + hooks to mocks; `AuthGuard.tsx` must see a signed-in demo user | bundle size (three + tsparticles): alias `@react-three/*` and `tsparticles*` to no-op components if the page still works without them, and say what was dropped |
| FocusLock desktop (`9a13ab4`, `windows-agent`) | Electron renderer, plain HTML/JS | `window.electronAPI` (18 methods, `src/preload.cjs`) | copy `src/index.html`, `index.css`, `renderer.js`; add `mock-electron.js` | none — the easiest one; the current shadow-DOM rebuild in `public/os/apps/focuslock.js` goes |
| Expense Tracker (`d7c29f5`) | React Native 0.86, React 19.2, op-sqlite, react-navigation, gifted-charts, react-native-svg | `src/db.ts` (SQLite), `src/native/*Module.ts`, `src/sync.ts` | new `apps/expense-tracker/web/` Vite project: alias `react-native` → `react-native-web`, extensions `.web.tsx` first, in-memory `db.ts` implementing the same `execute` shape, stubs for the three native modules; mount `App.tsx` | **high** — libraries may ship untranspiled RN code; budget a spike first and stop if `gifted-charts` or `native-stack` do not run on web. Owner question 6 in OPEN-QUESTIONS covers the fallback |
| BasketProof (`c5d527c`, Compose) | Kotlin, Jetpack Compose | — | cannot run in a browser; **wait for the owner's answer** (OPEN-QUESTIONS 5) | — |

Reddit Growth Copilot stays out.

Ownership limits still apply inside the real UIs: DarkSentinel is a team
project (Deven owned model training, the LLM work and Tor capture; Dhruv built
the dashboards, API features and the uncertain-zone Claude call). Fraud's model
is a teammate's. The window title and `PORTFOLIO.md` say whose UI it is.

### Phone apps

Phone apps mount inside `src/v3/desktop/PhoneScreen.jsx` on a 540×1200 CSS px
surface that is projected onto the phone. A web build of a phone app goes in an
`<iframe>` inside that surface, same pattern, `src="/apps/<name>/"`, sized to
the surface. The surface's rendered size on screen is measured in
`docs/HANDOFF.md` (readability section); design to that scale.

## Readability floor (a requirement, not polish)

Owner: "it should look good and zoomed in and flattering, people shouldnt have
to squint to see the ui elements." Measured facts and the resulting rules:

- Inside the monitor the OS fills the browser viewport (max 1440 px wide), so
  app CSS pixels are screen pixels. A project window is 1280×780. The rule for
  monitor apps: **body text ≥ 14 px, nothing readable below 12 px, controls
  ≥ 32 px tall.** `verify-real-apps.mjs` prints the smallest visible text per
  app; DarkSentinel's is 11.8 px (eyebrow labels) with 14–16 px body text, which
  is the floor, not the target. If an app's natural type is smaller, pass
  `zoom: 1.1` (or up to 1.25) to `iframeApp(...)`; check the layout still fits
  1280 wide at that zoom.
- On the phone the 540×1200 surface renders smaller than 1:1 because the held
  phone is framed to fit the viewport height (94% of it). Measured on the real
  GPU with `scripts/probe-phone-scale.mjs`: 0.68× at 1536×864, 0.85× at
  1920×1080, 0.60× at 1366×768. No camera change can raise that without
  cropping the phone, so readability on the phone is entirely the app's job:
  text **≥ 20 px in surface units** (lands at ≥ 12 px on a 1366-wide screen,
  ≥ 13.6 px on the owner's), tap targets ≥ 56 px in surface units, and no
  screen that needs more than the visible 540×1200 to make sense.
- Check every screen at the size it actually appears in the room, not at full
  browser size: open the monitor (the OS at the viewport) and the phone (held)
  and screenshot from there.

## Verification

```bash
npm run build
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
BASE=http://localhost:4173 node scripts/verify-project-uis.mjs
BASE=http://localhost:4173 node scripts/verify-real-apps.mjs
BASE=http://localhost:4173 node scripts/verify-v3.mjs
```

Start the preview before running tests, or every suite fails to connect.
`npm run preview` strips arguments here, so call Vite's bin directly.

Report to `docs/review/gemini-round8.md`: commits, what changed per app (with
the `PORTFOLIO.md` list), first-load size per app, real test output,
screenshots at in-room size, and anything skipped.
