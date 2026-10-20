# Projects map

Every project the owner shows, and where it is surfaced. Swept 2026-10-20 on
`perf/lighten-room` (read-only; line numbers drift, grep the names).

Content source: `src/v3/content/index.js` `projects` array (ids: focuslock ~118,
expense ~135, basket ~150, darksentinel ~165, crisiswatch ~184, fraud ~199,
ecowater ~213, portfolio3d ~227, blackout ~242, cellbook ~257).
`public/os/shell/content.js` is **generated** from it
(`scripts/gen-os-content.mjs`). Groupings in the same file: `personalProjectIds`
(cellbook, portfolio3d, expense, blackout, ecowater), `hackathonProjectIds`
(darksentinel, crisiswatch, fraud), `featuredProjectIds` (focuslock,
portfolio3d, darksentinel, blackout; used only by the mobile deck,
`Deck.jsx`). `/work` features `FEATURED_IDS = ['focuslock','basket']`
(`src/v3/work/Work.jsx` ~243), so the two featured sets disagree.

## Per project

| id | Source (`apps/`) / original | Built output | /work | dhruvOS window | Phone |
|---|---|---|---|---|---|
| focuslock | `apps/focuslock/` (Electron renderer copy, `build.mjs`); original `C:\Users\hp\OneDrive\Desktop\new-focuslock\windows-agent` @9a13ab4, GitHub dhruv4740/focuslock | `public/apps/focuslock/` | Try-it: web "Windows app" + phone app | `public/os/apps/focuslock.js` (iframeApp, banner → `ctx.openPhone`) | yes, `/phone/focuslock` |
| expense | none; phone reconstruction `src/v3/desktop/phone-apps/ExpenseApp.jsx` from `C:\Users\hp\expense-tracker` | n/a | Try-it: phone | none | yes, `/phone/expense` |
| basket (BasketProof) | none; `phone-apps/BasketProofApp.jsx` from `C:\Users\hp\OneDrive\Desktop\comparison` | n/a | Try-it: phone | none | yes, `/phone/basketproof` (content id is `basket`) |
| darksentinel | `apps/darksentinel/` (Next); original `C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui` @d5821bf (team project, private) | `public/apps/darksentinel/` | Try-it: web | `public/os/apps/darksentinel.js` | none |
| crisiswatch | `apps/crisiswatch/` (Next static export); original `...\Temp\resume-audit\crisiswatch-web` @330509f, GitHub dhruv4740/crisiswatch | `public/apps/crisiswatch/` | Try-it: web | `public/os/apps/crisiswatch.js` (zoom 1.25) | none |
| fraud (F-Shield) | `apps/fraud/` (Vite); original `C:\Users\hp\kharghar-hacks\kharghar` @31c0cd4 | `public/apps/fraud/` | Try-it: web | `public/os/apps/fraud.js` | none |
| blackout | none; GitHub dhruv4740/blackout (content) | none | link only | none | none |
| cellbook | none, no URL | none | card only | none | none |
| ecowater | none, no URL (hardware; no facts on file) | none | card only | none | none |
| portfolio3d | this site | none | link to `/` | none | none |

Each `apps/<name>/` has a `PORTFOLIO.md` listing the files changed from the
original (mock layer replaces the backend). Rebuild with
`node scripts/build-apps.mjs <name>`; outputs are committed.

## Wiring files per surface

- **/work card + demo panel:** `src/v3/work/Work.jsx` (`tryDemo` ~326, Try-it
  button ~340 shown only if `DEMOS[id]`, `PREVIEWS` ~242) and
  `src/v3/work/DemoPanel.jsx` (`DEMOS` map lines ~10–19; web demos = iframe at
  ~59 plus a new-tab link at ~52; phone demos render `PhoneScreen` ~62 and
  dispatch `phone:open-app` ~26). Previews: `public/previews/`.
- **dhruvOS window:** `public/os/apps/<name>.js` using `iframeApp` from
  `public/os/shell/iframeApp.js`; registered in `public/os/shell/registry.js`
  (~20–25); catalogue window `public/os/apps/projects.js` (`desktopApps` ~7,
  `phoneApps` ~8, groups ~10–12, launch via `ctx.openApp`/`ctx.openPhone`);
  desktop icons/context menu in `public/os/shell/desktop.js` (~125, ~178).
- **Phone:** `src/v3/desktop/PhoneScreen.jsx` (app configs ~42/57/62, import of
  the phone apps ~24, `phone:open-app` listener ~543), lazy-loaded from
  `WorkspaceStage.jsx` ~17; `Scan.jsx` ~590–607 handles `os:open-phone` and
  navigates to `/phone/<app>`; routes `/phone` and `/phone/:app` in `App.jsx`
  ~98; palette entries in `src/v3/ui/CommandPalette.jsx` ~16–18.

## Gaps (facts, not decisions)

- No /work demo: blackout, cellbook, ecowater, portfolio3d.
- No dhruvOS window: expense, basket, blackout, cellbook, ecowater, portfolio3d.
- No phone app: darksentinel, crisiswatch, fraud, and the non-interactive ones.
- `PREVIEWS` in `Work.jsx` lacks crisiswatch and fraud although
  `public/previews/crisiswatch.jpg` and `fraud.jpg` exist.
- Repo URLs absent from content: basket, cellbook, ecowater, fraud;
  darksentinel is private.
