# dhruvOS — Agent Handoff Document

**Branch:** `feat/dhruvos`  
**Owner:** Dhruv Kothari (`dhruvkothari13062006@gmail.com`, `github.com/dhruv4740`)  
**Last updated:** 2026-06-22

---

## What This Is

A fake retro-future OS desktop that serves as Dhruv's portfolio. No build step, no bundler. Pure ES modules served as static files.

**Entry point:** `os/index.html`  
**Live test command:** `cd os && npx serve` (or `python -m http.server 8000` inside `os/`), then open the printed localhost URL in Chrome.

---

## User Experience Flow

1. **Reality Tear intro** — a flat minimalist landing page is shown. The user drags to "tear" through it, revealing the dark OS beneath. Clicking the "skip →" button in the bottom-right skips directly. (~55% torn triggers auto-complete via GSAP.)
2. **BIOS boot** — green terminal-style boot lines scroll; the user clicks anywhere to skip.
3. **Desktop** — 7 app icons on the left column. Single-click or double-click to open. Draggable windows, traffic-light close/minimize, taskbar at the bottom.

---

## Tech Stack

| Concern | How |
|---|---|
| JS modules | Native ES modules with `type="module"`. No bundler. |
| Three.js | Via importmap (`three@0.169.0` from unpkg). Only `cosmos.js` uses it. |
| GSAP | CDN global (`gsap` on `window`). Window open/close animations, boot fade, intro tear. |
| Matter.js | CDN global. Not used by current apps — available for future physics. |
| Howler.js | CDN global. Used by `shell/audio.js` for the ambient synthesizer. |
| Fonts | JetBrains Mono via Google Fonts. |
| Styling | Single `styles.css`. CSS custom properties for the green palette. |

All CDN deps are declared in `os/index.html` before the `<script type="module">` entry point.

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
    ├── terminal.js     — Working shell. Shadow DOM scoped. Commands: help/ls/about/projects/cosmos/whoami/contact/clear/sudo/rm
    ├── projects.js     — Corrupted quest-log. Each project glitch-reveals on hover/click.
    ├── cosmos.js       — Powers of Ten zoom. 6 procedural canvas layers (galaxy→neuron). Wheel/drag inside window.
    ├── wormhole.js     — Hex-ring hyperspace tunnel. Canvas 2D, mouse-tilt deflection.
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
2. Add `await load('../apps/myapp.js');` to `os/shell/registry.js`.
3. Done. The icon appears automatically on the desktop.

---

## Context Object (`ctx`)

Passed as the second argument to every `mount()`:

```js
ctx = {
  openApp(id),           // open any registered app by id
  audio: {
    start(), stop(), toggle(),  // ambient synth control
    get analyser()              // Web Audio AnalyserNode for visualisers
  },
  theme: {
    green: '#5cffd0',
    amber: '#ffb000',
    bg:    '#050a08',
  },
}
```

---

## Window Manager API (`os/shell/windowManager.js`)

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

## Audio (`os/shell/audio.js`)

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
==== dhruvOS INTEGRATION ====
INFO desk-icons=7
INFO open-windows=0; labels=["about","terminal","projects","cosmos","wormhole","gallery","wallpaper"]
NO console errors / warnings / failed requests
shots: os-01-intro / os-02-desktop / os-03-apps
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

## Current App Status

| App | Status | Notes |
|---|---|---|
| `about` | Complete | Neural graph with 15 nodes, fire-propagation pulses, drag-to-pan. Click node → info panel. |
| `terminal` | Complete | Shadow DOM scoped. Commands: help / ls / about / projects / cosmos / whoami / contact / clear / sudo / rm. Up/Down history. |
| `projects` | Complete | 3 projects. Corrupted CSS clip-path glitch on load; hover/click scrambles to readable text. Integrity meter. |
| `cosmos` | Complete | Powers of Ten zoom. 6 procedural layers (galaxy, planet, city, desk, eye, neuron). Wheel and drag input inside window only. |
| `wormhole` | Complete | Hex-ring tunnel with wobble and star streaks. Mouse tilt deflects camera origin. |
| `gallery` | Complete | 4 projects listed. Scroll-velocity skew on titles. Scramble-decode on hover. |
| `wallpaper` | Complete | 300-particle curl-noise flow field. 4 palettes (green/amber/violet/blue). "Set as wallpaper" button patches `#os-beneath` background and `#workspace` radial gradient. |

---

## Real Content Status

Some content is placeholder. Real info:

- **Name:** Dhruv Kothari
- **Location:** Mumbai, India
- **Email:** dhruvkothari13062006@gmail.com
- **GitHub:** github.com/dhruv4740
- **Real projects:**
  1. Reddit Growth Copilot — AI finds Reddit threads, drafts on-brand replies. (2024)
  2. GeoSVG Maps Demo — Interactive SVG map generator with live coordinates. (2024)
  3. 3D Portfolio — R3F walkable room with physics, shaders, car game. (2025)
  4. dhruvOS — this thing. (2026)

The `terminal.js` `ls` command still lists old names — update the `ls` handler and the `PROJECTS` array in `gallery.js` when content is finalised.

---

## Pending / Next Up

These are the logical next steps in priority order:

### 1. Wire real content everywhere
- `terminal.js` → update `ls` output to list all 7 apps; add `wormhole`, `gallery`, `wallpaper` commands
- `about.js` → `NODE_DEFS` already has real projects; verify descriptions are accurate
- `projects.js` → the 3 project cards have real names but placeholder descriptions; flesh them out
- `gallery.js` → already has 4 real entries; add URLs/links when projects are deployed

### 2. Make the desktop look alive
The `#workspace` is bare dark background with icons. Possible improvements:
- Show a subtle version of the wallpaper app's flow-field as the default desktop background
- Add a "right-click" context menu on the desktop (Change Wallpaper → opens wallpaper app)
- Animate icons on boot (stagger entrance)

### 3. Resize-to-fit on small screens / mobile
Windows are sized from `appDef.width/height` clamped to workspace. On narrow viewports, the left icon column may overflow. Consider a bottom dock layout on mobile, or disable drag on touch and use full-screen windows instead.

### 4. Add more app ideas (user-approved concepts)
The user liked all of these — each could become a new app window:
- **Resonance** — audio visualiser using `ctx.audio.analyser`
- **Singularity** — GLSL raymarched shader (note: was laggy on user's laptop; keep texture size ≤512×512 and skip in low-end mode)
- **Liminal** — raymarched foggy floor / drifting SDF monoliths as a screensaver-style app

### 5. Deploy
Static files — deploy `os/` as-is to Vercel or Netlify. No build step needed. Just point the root to `os/index.html`.

---

## Constraints — Do Not Violate

- **No bundler.** All imports are ES module or CDN globals. Do not introduce Vite/Webpack/Rollup.
- **No heavy GPGPU on the main thread.** The user's laptop is weak. No `GPUComputationRenderer` FBO ping-pong, no multi-pass raymarching at full resolution. Canvas 2D is always safe. Three.js single-pass shaders are OK at ≤512×512.
- **App listeners go on `body` or canvas, NOT `window`.** Every app receives a `body` element. Attaching listeners to `window` inside an app causes leaks that survive window close. Always remove listeners in `cleanup()`.
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

Then in `os/shell/registry.js`, add:
```js
await load('../apps/myapp.js');
```

Run `node scripts/_os.mjs` and verify 0 errors.
