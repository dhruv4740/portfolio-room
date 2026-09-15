# dhruvOS — Agent Handoff Document

**Branch:** `feat/v3`
**Owner:** Dhruv Kothari (`dhruvkothari13062006@gmail.com`, `github.com/dhruv4740`)  
**Last updated:** 2026-09-14 (embedded OS app cleanup)

**Architecture docs:** See `public/os/docs/` — ROADMAP.md / ARCHITECTURE.md for full spec.
**Content:** Edit `src/v3/content/index.js`; `scripts/gen-os-content.mjs` generates
`public/os/shell/content.js` during `npm run build`.

---

## What This Is

A fake retro-future OS desktop that serves as Dhruv's portfolio. No build step, no bundler. Pure ES modules served as static files.

**Entry points:** `public/os/index.html` (standalone) and
`public/os/embed.html?embed=1` (the v3 monitor).
**Live test command:** serve the production build, then run
`BASE=http://localhost:4173 node scripts/verify-os-apps.mjs`.

---

## User Experience Flow

1. **Reality Tear intro** — a flat minimalist landing page is shown. The user drags to "tear" through it, revealing the dark OS beneath. Clicking the "skip →" button in the bottom-right skips directly. (~55% torn triggers auto-complete via GSAP.)
2. **BIOS boot** — green terminal-style boot lines scroll; the user clicks anywhere to skip.
3. **Desktop** — 14 registered app icons. Single-click or double-click to open.
Draggable windows, traffic-light close/minimize, taskbar at the bottom. Menubar
has a persistent `✉ contact` button and a `SYS ▸ N%` exploration meter.

---

## Tech Stack

| Concern | How |
|---|---|
| JS modules | Native ES modules with `type="module"`. No bundler. |
| Three.js | Via importmap (`three@0.169.0` from unpkg). |
| GSAP | CDN global (`gsap` on `window`). Window open/close animations, boot fade, intro tear. |
| Matter.js | CDN global. Not used by current apps — available for future physics. |
| Web Audio | Native `shell/audio.js` synthesizer; starts only on user gesture. |
| Fonts | JetBrains Mono via Google Fonts. |
| Styling | Single `styles.css`. CSS custom properties for the green palette. |

The embedded entry has no CDN dependencies. The standalone legacy entry still
declares the globals used by its intro and existing Gravity paths.

---

## File Structure

```
os/
├── index.html          — HTML shell, importmap, CDN scripts, DOM structure
├── styles.css          — All CSS. See "CSS variables" section below.
├── main.js             — Orchestrates: runIntro → runBoot → showDesktop
│
├── intro/
│   └── tear.js         — Reality Tear effect. Exports runIntro(onComplete).
│
├── shell/
│   ├── registry.js     — Loads all apps via dynamic import(). Exports default apps[].
│   ├── desktop.js      — Builds icons, clock, sound toggle, taskbar. initDesktop(apps, ctx).
│   ├── windowManager.js — openApp / closeApp / focus / minimizeApp / getOpenWindows.
│   └── audio.js        — Web Audio ambient synth. Exports { start, stop, toggle, analyser }.
│
└── apps/
    ├── about.js        — Neural graph of Dhruv's identity (Canvas 2D, force-directed)
    ├── terminal.js     — Working shell. Shadow DOM scoped. Commands: help/ls/about/projects/whoami/contact/clear/sudo/rm
    ├── projects.js     — Corrupted quest-log. Each project glitch-reveals on hover/click.
    ├── corrupted.js    — Dependency-free glitch canvas sketch.
    ├── fluid.js        — Dependency-free cursor-driven flow sketch (Flux).
    ├── kinetic.js      — Dependency-free motion study.
    ├── tear.js         — Dependency-free pointer-driven reveal sketch.
    ├── gallery.js      — Kinetic project list. Scroll-velocity skew, scramble-on-hover titles.
    └── wallpaper.js    — Curl-noise flow field. 4 colour palettes, "Set as wallpaper" button.
```

---

## CSS Variables (in `styles.css` `:root`)

```css
--green:   #5cffd0   /* primary accent — text, borders, glows */
--amber:   #ffb000   /* secondary accent — warnings, alternate highlight */
--red:     #ff4f4f   /* close button, errors */
--bg:      #050a08   /* deepest background */
--surface: #0c1610   /* window background */
--surface2:#111e16   /* titlebar, taskbar, menubar */
--border:  rgba(92,255,208,0.18)
--text:    #c8f5e6
--muted:   rgba(92,255,208,0.45)
--font:    'JetBrains Mono', monospace
```

---

## App Contract

Every file in `os/apps/` must default-export this shape:

```js
export default {
  id: 'unique-string',   // used as window key and registry lookup
  title: 'display name', // shown in titlebar and taskbar
  icon: '◈',             // single Unicode glyph for desktop icon
  width: 700,            // default window width in px
  height: 540,           // default window height in px

  mount(body, ctx) {
    // body: HTMLElement — the .win-body div inside the window frame
    // ctx: { openApp(id), audio, theme: { green, amber, bg } }

    // Do your setup here. All event listeners MUST go on `body` or
    // child elements — NOT on window/document (causes leaks).
    // Use ResizeObserver on `body` for layout, NOT window resize.

    return function cleanup() {
      // cancel rAF, disconnect ResizeObserver, remove listeners
      // called automatically when window is closed
    };
  },
};
```

**To add a new app:**
1. Create `os/apps/myapp.js` with the above shape.
2. Add `await load('../apps/myapp.js');` to `public/os/shell/registry.js`.
3. Done. The icon appears automatically on the desktop.

---

## Context Object (`ctx`)

Passed as the second argument to every `mount()`:

```js
ctx = {
  openApp(id),                  // open any registered app by id
  openProject(projectId),       // emit 'open-project' + open projects app
  openContact(),                // open contact app

  content,   // public/os/shell/content.js — generated source for app copy
  store,     // public/os/shell/store.js — event bus + exploration state

  audio: {
    start(), stop(), toggle(),  // ambient synth control
    get analyser()              // Web Audio AnalyserNode for visualisers
  },
  theme: {
    green: '#5cffd0', amber: '#ffb000', red: '#ff4f4f',
    bg: '#050a08', surface: '#0c1610', muted: 'rgba(92,255,208,0.45)',
  },
}
```

See `public/os/docs/ARCHITECTURE.md` for the full store API and canonical event list.

---

## Window Manager API (`public/os/shell/windowManager.js`)

```js
openApp(appDef, ctx)   // opens window; focuses if already open
closeApp(id)           // calls cleanup(), GSAP fade-out, removes DOM
focus(id)              // z-index cascade, adds .focused class
minimizeApp(id)        // toggles .minimized (display:none)
getOpenWindows()       // → Map<id, { el, bodyEl, cleanup, minimized }>
setTaskbarCallback(fn) // fn(Map) called on any open/close/focus change
```

Windows are draggable via pointer-capture on the titlebar. Traffic lights (red/yellow/green) wire close/minimize. Clicking anywhere on a window brings it to front.

---

## Audio (`public/os/shell/audio.js`)

Web Audio API synthesizer — bass sine wave + detuned saw pad + LFO lowpass filter. **Starts only on user gesture** (browser requirement). The `♪ OFF / ON` button in the menubar calls `ctx.audio.toggle()`.

The `analyser` getter returns the connected `AnalyserNode` — use it in any app for audio-reactive visuals (e.g., a future equaliser or oscilloscope app).

---

## Integration Test

```
node scripts/_os.mjs
```

Spins up a local HTTP server on port 4182, launches headless Chromium with SwiftShader (GPU fallback), navigates to the OS, waits for intro to be ready, skips intro, skips boot, waits for desk icons to appear. Reports:
- console errors / warnings / failed requests
- number of desk-icons found
- app labels registered

**Expected output (current):**
```
==== dhruvOS APPS ====
BASE=http://localhost:4173 node scripts/verify-os-apps.mjs
PASS removed apps are not launchable from desktop or terminal
PASS set as wallpaper changes the desktop
PASS no page errors or failed network requests
```

Screenshots go to `mockups/shots/`. The desktop screenshot shows only the beneath-canvas background (dark green starfield) because `#desktop` GSAP fade-in (700ms) hasn't completed when the shot fires — this is a test timing limitation, NOT a bug. The icon count proves the desktop rendered correctly.

---

## Known Issues / Bugs Fixed Already

| Bug | Fix Applied |
|---|---|
| `#boot` (z-index 200) hidden behind `#os-beneath` (z-index 501) | `#boot` z-index raised to 520; `#desktop` z-index set to 510 |
| Integration test clicked `#intro-skip` before JS loaded (race condition with 7 sequential dynamic imports) | Test now uses `page.waitForSelector('#intro-skip:visible')` instead of fixed 1500ms sleep |
| Reality Tear mask showed no holes (`fillStyle='#000'` on opaque canvas is a no-op for CSS masks) | Fixed to `globalCompositeOperation='destination-out'` before each stamp |

---

## Current App Status (Wave 3)

**14 apps total.** Content apps read the generated `public/os/shell/content.js`.

| App | Status | Notes |
|---|---|---|
| `about` | ✅ Complete | Green palette. Nodes from content.js (skills + projects). Side-drawer on click. Project nodes → openProject. Contact node → openContact. Contact strip. |
| `terminal` | ✅ Complete | Registered apps in `ls`. `open <app>` command. Colorized output. ASCII contact card on `contact` command. |
| `projects` | ✅ Complete | 4 real projects from content.js. Dramatic locked state. Scramble-reveal. Link chips (hidden when empty). Store deep-link support. Contact strip. |
| `corrupted`, `fluid`, `kinetic`, `tear` | ✅ Complete | Native dependency-free sketch apps. Their rAF loops stop on minimize, close, and embedded `leave`. |
| `gallery` | ✅ Complete | 4 projects from content.js. Amber year label. Hover expands description. Link chips. Cross-links to projects via openProject. Contact strip. |
| `wallpaper` | ✅ Complete | 260 particles. Swatch palette selector (28×28 color squares). Amber SET button. Palette persisted to store. |
| `contact` | ✅ Complete | Corner-accent card. Email copy-to-clipboard. GitHub link. Resume button (hidden until `content.contact.resume` filled). |

## Real Content

Generated from `src/v3/content/index.js` into `public/os/shell/content.js`.

- To add live/github links: fill `projects[n].links.live` and/or `.github`
- To add resume: fill `contact.resume` with PDF URL
- To update project descriptions: edit `projects[n].description`

---

## Pending / Next Up

See `public/os/docs/ROADMAP.md` for full checkbox list. Summary:

### Phase 2 — Shell (next priority)
- Right-click desktop context menu
- Animated default wallpaper on boot (low-cost, ≤120 particles)
- Mobile/small-screen layout

### Phase 3 — New Apps
Priority order: **Gravity** (Matter.js skill chips) → **Decoder** → **Music Player** → others  
Mockup sources in `mockups/` — see ROADMAP.md for the table.

### Deploy
Static files — deploy `os/` as-is to Vercel or Netlify. No build step needed.

---

## Constraints — Do Not Violate

- **No bundler in `public/os`.** All embedded imports are local ES modules. Do not introduce new CDN dependencies.
- **No heavy GPGPU on the main thread.** The user's laptop is weak. No `GPUComputationRenderer` FBO ping-pong, no multi-pass raymarching at full resolution. Canvas 2D is always safe. Three.js single-pass shaders are OK at ≤512×512.
- **App listeners go on `body` or canvas, NOT `window`.** Every app receives a `body` element. Attaching listeners to `window` inside an app causes leaks that survive window close. Always remove listeners in `cleanup()`. Animated apps may return `{ cleanup, setVisible }`; `setVisible(false)` is required before work stops on minimize, close, or embedded `leave`.
- **`cleanup()` must be complete.** Cancel every `requestAnimationFrame`, disconnect every `ResizeObserver`, remove every event listener. The window manager calls `cleanup()` on close.
- **CLAUDE.md rules apply.** Conventional commits, no commit to main/master, YAGNI, no placeholder logic.

---

## Repository Layout (portfolio root)

```
portfolio/
├── os/                 ← dhruvOS (this project, feat/dhruvos branch)
├── mockups/            ← 16 standalone HTML concept demos (feat/concept-mockups)
│   ├── index.html      ← Gallery landing page
│   ├── shots/          ← Playwright screenshots (gitignored)
│   └── *.html          ← Individual concept demos (A–P)
├── src/                ← Old R3F room build (feat/scaffold-foundation, rejected)
├── scripts/
│   └── _os.mjs         ← Integration test (Playwright headless)
└── CLAUDE.md           ← Global dev directives (do not regenerate)
```

---

## Running the Test

```bash
# From repo root
node scripts/_os.mjs
```

Requires `playwright` in node_modules. If not installed:
```bash
npm install playwright
npx playwright install chromium
```

---

## Quick Reference: Adding an App

```js
// os/apps/myapp.js
export default {
  id: 'myapp',
  title: 'myapp',
  icon: '◉',
  width: 640,
  height: 480,
  mount(body, ctx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;';

    // ... your content ...

    const ro = new ResizeObserver(() => { /* handle resize */ });
    ro.observe(body);

    return function cleanup() {
      ro.disconnect();
      // cancel rAF, remove listeners
    };
  },
};
```

Then in `public/os/shell/registry.js`, add:
```js
await load('../apps/myapp.js');
```

Run `node scripts/_os.mjs` and verify 0 errors.
