# Round 2 — Gemini: port the four sketches faithfully

Copy everything below the rule.

---

You are one of two executor agents working **at the same time** on one repo.
An orchestrator (Claude) wrote this prompt, will review your diff, rerun your
tests and look at your screenshots. Execute exactly what is written. Where this
prompt makes a decision, follow it; do not substitute your own. If something is
impossible as written, stop that step, do the rest, and explain in your report.

**Repo:** `C:\Users\hp\OneDrive\Desktop\random sites\portfolio`, branch `feat/v3`.
Start from HEAD (`git log -1` should be the commit that added this file or later).

## Parallel work — read this first

The other agent (Sonnet) is working on the 3D room at the same time.

| Owner  | Paths you may create, edit, delete or stage |
|--------|---------------------------------------------|
| **You** | `public/os/apps/corrupted.js`, `public/os/apps/fluid.js`, `public/os/apps/kinetic.js`, `public/os/apps/tear.js`, `public/os/vendor/**`, `public/os/fonts/**`, `scripts/vendor-os-libs.mjs`, `scripts/verify-os-apps.mjs`, `scripts/shoot-port-originals.mjs`, `docs/port-source/**`, `docs/review/gemini-round2.md`, the single `skills` line for `three` in `src/v3/content/index.js`, and `public/os/shell/content.js` only by running `node scripts/gen-os-content.mjs` |
| Sonnet | `src/v3/desktop/**`, `scripts/verify-room-interactions.mjs`, `scripts/verify-v3.mjs`, `scripts/measure-sky.mjs`, `docs/review/sonnet-round2.md` |

- Never edit, stage, revert or delete anything outside your row. If you believe
  a change is needed there, write it under "Requests for the orchestrator" in
  your report instead.
- Stage files **by explicit path** (`git add <path>`). Never `git add -A`,
  `git add .`, `git commit -a`, `git stash`, `git checkout -- <path>` on files you
  do not own, or `git reset`.
- Git lock: if a commit fails because `.git/index.lock` exists, wait 10 seconds
  and retry, up to 6 times. Never delete the lock file yourself.
- **Build output and ports are split so you do not collide:** you build into the
  default `dist/` and serve on **port 4173**. Sonnet uses `dist-sonnet/` on 4174.
  Do not touch `dist-sonnet/` and do not start anything on 4174.

## Why this job exists

Round 1 replaced these four sketches with 66–87 line canvas stand-ins
(`public/os/apps/*.js` at HEAD). The owner chose these four **because he liked
the originals**. The stand-ins are not the originals — Reality Tear is two lines
on a black background. They are rejected. Your job is a **faithful port** of the
originals into dhruvOS apps: same visuals, same interactions, same motion, same
typography — with the dependency, lifecycle and content problems fixed.

The originals are preserved at `docs/port-source/corrupted.html`, `fluid.html`,
`kinetic.html`, `tear.html` (exact copies of the deleted `public/lab/*.html`).
Read each one completely before writing its port.

## Step 1 — record the originals, before changing anything

Write `scripts/shoot-port-originals.mjs` (Playwright, ESM, same style as
`scripts/verify-held-objects.mjs`). For each of the four files:

1. `page.goto('file:///' + absolutePath)` with viewport **900 × 640**. The
   originals load three/GSAP/fonts from CDNs, so this needs the network; that is
   expected for the originals only.
2. Wait 2000 ms. Move the mouse from (200, 200) to (700, 450) in 20 steps.
3. Perform the page's main interaction (see the per-app sections below), wait
   800 ms, screenshot to `scripts/shots/orig-<id>.png`.

Run it. These screenshots are the fidelity reference for you and for review.

## Step 2 — vendor the libraries (no CDN at runtime)

The repo already depends on `three@^0.184.0` and `gsap@^3.15.0` (see
`package.json`). Use those installed copies. Do **not** add dependencies.

Write `scripts/vendor-os-libs.mjs` that copies, overwriting:

| From (`node_modules/…`) | To (`public/os/vendor/…`) |
|---|---|
| `three/build/three.module.js` | `three.module.js` |
| `three/build/three.core.js` (copy if it exists; r0.17x+ splits the build and `three.module.js` imports it) | `three.core.js` |
| every file under `three/examples/jsm/` that the ports actually import, keeping the relative path | `three-addons/<same relative path>` |
| `gsap/dist/gsap.min.js` | `gsap.min.js` |
| `gsap/dist/ScrollTrigger.min.js` | `ScrollTrigger.min.js` |

Then add `node scripts/vendor-os-libs.mjs && ` to the start of the `build` script
in `package.json` — **except `package.json` is not in your ownership row**, so
do not edit it; put the exact new `build` string under "Requests for the
orchestrator". Run the vendor script manually and **commit the vendored files**,
so the site works without the script having run.

How the ports load them:

- three: `import * as THREE from '../vendor/three.module.js';` (relative import
  from `public/os/apps/`). If an addon is needed, import it from
  `'../vendor/three-addons/…'`, and if that addon itself imports `'three'` by
  bare specifier, rewrite that one import line in the **vendored copy** to
  `'../../three.module.js'` (adjust depth) inside `vendor-os-libs.mjs`, so a
  re-run reproduces it.
- GSAP is UMD. Add a helper at the top of each app that needs it:
  ```js
  function loadScript(src) {
    return window.gsap && (!src.includes('ScrollTrigger') || window.ScrollTrigger)
      ? Promise.resolve()
      : new Promise((ok, fail) => {
          const s = document.createElement('script');
          s.src = new URL(src, import.meta.url).href; s.onload = ok; s.onerror = fail;
          document.head.appendChild(s);
        });
  }
  ```
  and `await loadScript('../vendor/gsap.min.js')` (then ScrollTrigger if used)
  inside `mount` before using `window.gsap`.
- **Lenis is dropped** (kinetic used it for smooth page scroll). Inside an OS
  window the scroll container is the window body; use native scrolling on that
  element and set ScrollTrigger's `scroller` to it.

## Step 3 — self-host the fonts

The originals use Google Fonts: VT323 and Press Start 2P (corrupted), Space
Grotesk 400/500/600/700 and JetBrains Mono 400/500 (fluid), Anton and
JetBrains Mono 400/500 (kinetic). Tear uses none.

1. For each family, fetch `https://fonts.googleapis.com/css2?family=…&display=swap`
   with request header `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36`
   so the CSS lists `woff2`. Download only the **latin** subset `woff2` files.
2. Save them as `public/os/fonts/<family-kebab>-<weight>.woff2`
   (e.g. `space-grotesk-600.woff2`).
3. Add `public/os/fonts/OFL.txt` stating these families are under the SIL Open
   Font License 1.1, with the family names.
4. Each app declares its own `@font-face` rules inside its injected `<style>`,
   with `src: url(<new URL('../fonts/…', import.meta.url).href>) format('woff2')`.

## Step 4 — the app contract (every port)

Look at how `public/os/shell/windowManager.js` mounts apps and at the round-1
`public/os/apps/tear.js` for the shape. Each port is:

```js
export default {
  id, title, icon, width: 900, height: 640,
  async mount(body) { /* … */ return { setVisible, cleanup }; },
};
```

Keep `id`/`title` exactly: `corrupted`/`Corrupted`, `fluid`/`Flux`,
`kinetic`/`Kinetic`, `tear`/`Reality Tear`. Keep the icons from the round-1 files.
If `windowManager.js` does not await an async `mount`, do the async loading
inside `mount` without awaiting at the top level and have `setVisible`/`cleanup`
work before loading has finished (guard with flags) — do not edit
`windowManager.js`.

Rules that apply to all four:

1. **Scoped DOM.** Build the original page's markup inside `body` under one root
   element with class `app-<id>`. No `document.body`, `document.documentElement`
   or `document.getElementById` lookups — query inside the root.
2. **Scoped CSS.** Copy the original CSS, prefix **every** selector with
   `.app-<id> `. Rewrite `html`, `body` and `:root` rules onto `.app-<id>` itself.
   Custom properties go on `.app-<id>`. Inject one `<style>` into the root.
3. **Sizing.** Replace `window.innerWidth/innerHeight` and `window` `resize`
   listeners with the root's `clientWidth/clientHeight` and a `ResizeObserver`
   on the root. Pointer coordinates are relative to the root's bounding rect.
   Keyboard listeners attach to the root (give it `tabIndex=0`), not `window`.
4. **Animation lifecycle.** Exactly one rAF loop per app, started only by
   `setVisible(true)`, cancelled by `setVisible(false)`. GSAP tweens and
   timelines created by the app are collected and `pause()`d on hide,
   `resume()`d on show, `kill()`ed on cleanup. `ScrollTrigger` instances are
   `kill()`ed on cleanup.
5. **Cleanup.** Remove every listener, disconnect observers, kill GSAP, and for
   WebGL: dispose geometries, materials, textures, render targets, then
   `renderer.dispose()` and `renderer.forceContextLoss()`. Remove the root.
6. **No network at runtime** except same-origin files under `/os/`.
7. **Removed chrome:** delete the "← concepts" / "← back to concepts" links and
   any `<title>`-only text such as "Flux — concept E".
8. **Visual fidelity:** colours, fonts, sizes, spacing, easing and timing match
   the original. three 0.169 → 0.184 API changes are yours to resolve without
   changing the look.

## Step 5 — replace invented content with real content

The originals contain placeholder and wrong copy. Import real data:
`import * as content from '../shell/content.js';` — open that file first and use
its actual export names (it is generated from `src/v3/content/index.js`; it has
the identity, contact, projects, skills and achievements). **Never write new
claims about the owner.** Only the substitutions below are allowed; generic
design copy that makes no claim (e.g. "Let's build it.") stays.

**Corrupted** (`corrupted.html`)
- Player name: the owner's name from content, keeping the original's glitch
  treatment of the characters (`D⌷RUV K0THΛRI` style while corrupted, clean
  when repaired).
- CHARACTER STATS: skill labels from content `skills`. **No numbers, bars or
  percentages per skill** — show the label and, when repaired, its proof project
  names. The overall SAVE INTEGRITY meter stays (it measures repair progress,
  not skill).
- QUEST LOG: every project from content — name and tagline, labelled MAIN QUEST
  or SIDE QUEST using the `type` field that content already provides.
- Contact: email, GitHub and LinkedIn **from content**. The original hardcodes
  `linkedin.com/in/dhruv-kothari`, which is wrong; do not keep it.
- Remove the hardcoded "Reddit Growth Copilot", "GeoSVG Maps Demo" and
  "React Three Fiber immersive portfolio experience" entries.
- Interaction for Step 1 screenshots: click the first "CLICK TO REPAIR" control.

**Flux** (`fluid.html`)
- Name: owner's name from content. Hero "Calm surfaces, / living depth." stays.
- Replace "Developer & designer building interactive, performant web
  experiences." with the identity role and location from content, followed by
  the original's "Move your cursor to stir the field."
- About: the identity `statement` from content. Delete both "I make the web feel
  alive…" and "Placeholder bio — real copy goes here." and "Currently exploring…".
- Selected Projects: the **first three** projects from content, name + tagline.
  Delete "Project Three" and every "Placeholder —" line.
- Contact: email/GitHub/LinkedIn from content; delete the "placeholder" link.
- Interaction for Step 1 screenshots: the mouse move already stirs it.

**Kinetic** (`kinetic.html`)
- Hero "Designer / & / developer / of the web." → keep the same three-line
  kinetic layout but with the words of the identity role from content
  (e.g. "Full-stack / & / developer"): split the role so the last word is the
  third line, and keep "&" as the middle line only if the role has two or more
  words; otherwise drop the "&" line.
- Intro sentence → the identity `statement`.
- Selected Work: **all** projects from content (name, tagline, year), and the
  counter "(01—04)" becomes `(01—NN)` from the real count.
- Delete "Placeholder case study…", "Project Three" and "Available 2026".
- "Let's / build / it." stays and links to `mailto:` with the content email.
- Interaction for Step 1 screenshots: scroll the page by 900 px.

**Reality Tear** (`tear.html`)
- The hidden "real" site: name from content; nav stays; replace "Developer &
  designer interested in interfaces, systems, and the space between them. Based
  in Mumbai." with identity role + location from content.
- Selected Work: first three projects from content with their `year`. Delete
  "Reddit Growth Copilot 2024", "GeoSVG Maps Demo 2024", "3D Portfolio 2025".
- Email from content. Delete "© 2025".
- Interaction for Step 1 screenshots: drag from (150, 320) to (750, 320) in 25
  steps with the button held.

Then change **only** this line in `src/v3/content/index.js`:
`note: 'four interactive sketches'` on the `three` skill → `note: 'Three.js sketches inside dhruvOS: Flux, Kinetic, Reality Tear'`
(Corrupted is DOM/canvas, not Three.js — verify that by reading its source; if
it does use Three.js, include it). Run `node scripts/gen-os-content.mjs`.

## Step 6 — verification the orchestrator will rerun

1. `node scripts/vendor-os-libs.mjs`, then `npx vite build`, then
   `npx vite preview --port 4173 --strictPort` (keep it running).
2. `node scripts/verify-v3.mjs` → must print `36/36 passed`.
3. Extend `scripts/verify-os-apps.mjs` (keep everything already in it):
   - `page.on('request')`: record any request whose origin is not
     `http://localhost:4173`; assert the list is empty at the end.
   - For each app: open it, wait 1500 ms, perform the **same interaction as
     Step 1** scaled into the window's body rect, wait 800 ms, screenshot the
     window to `scripts/shots/port-<id>.png`.
   - Keep the existing rAF-stops assertions for minimize, close and parent
     `leave`.
   - Add: after closing each WebGL app, assert
     `document.querySelectorAll('.app-<id>').length === 0`.
   - Run with `BASE=http://localhost:4173`.
4. Open every `orig-<id>.png` and `port-<id>.png` pair yourself and compare. In
   your report, list each visible difference you could not remove.
5. `git rm -r docs/port-source` as the **last** commit, after the ports pass.

## Commits (one per line, in this order, explicit paths only)

1. `chore(os): vendor three, gsap and sketch fonts for offline apps`
2. `feat(os): faithful Corrupted port with real save data`
3. `feat(os): faithful Flux port with real content`
4. `feat(os): faithful Kinetic port with real content`
5. `feat(os): faithful Reality Tear port with real content`
6. `test(os): offline, lifecycle and fidelity checks for sketch apps`
7. `chore: drop port sources after sketch ports`

Conventional Commits, no trailing period, **no attribution or co-author lines**,
never push, never commit to `main`.

## Report — write it to `docs/review/gemini-round2.md` and commit it last

Use exactly these headings so review is fast:

```
# Gemini round 2 report
## Commits            (hash — subject, one per line)
## Files changed      (path — one-line purpose)
## Commands run       (each command, then its last 5 output lines verbatim)
## Screenshots        (orig/port pairs as a table: app | orig path | port path | differences)
## Content substitutions (app | original text | replacement | content field used)
## Vendored files     (path | source | bytes)
## Deviations         (anything not done exactly as written, and why)
## Requests for the orchestrator (changes needed outside your paths, with exact text)
```

Never claim a test passed unless its output is pasted in "Commands run".
