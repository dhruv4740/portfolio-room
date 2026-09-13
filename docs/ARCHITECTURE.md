# Architecture — what lives where

Decided 2026-09-13. This answers "what goes inside dhruvOS, what stays outside,
and how do the fun side and the recruiter side coexist."

## The governing principle

**Spectacle scales with hardware. Content never does.**

Every visitor gets every fact — projects, links, résumé, contact — regardless of
GPU, connection or input device. What changes is how much show wraps it. No
content is ever locked behind a capability gate. If someone on a Chromebook
can't read what Dhruv built, the site has failed at its more important job.

## The layers

### Layer 0 — the room (`/`, desktop with a real GPU)

Pure spectacle and orientation. An authored, night-lit three.js workspace you
orbit. Its entire job is the first ten seconds: make a builder audience sit up.

It holds almost no content itself. Four anchors:

- **Monitor** → the way in. Camera travels into the screen, hands off to dhruvOS.
- **Notebook** → about, short-form.
- **Desk** → selected work, short-form.
- **Window** → contact.

The three non-monitor anchors are teasers with a path to the full thing. The
room must never be the only place a fact exists.

### Layer 1 — dhruvOS (inside the monitor)

**This is where everything deep lives, and the OS metaphor is doing real
architectural work — not just being cute.**

The problem it solves: the lab demos have violently different visual languages.
Chromatic's iridescent keynote gloss cannot sit next to Corrupted's glitched RPG
save file on a single page — they would fight and both would lose. But as
*applications inside an operating system*, heterogeneity stops being a style
collision and becomes the point. An OS is supposed to run programs that don't
match each other. The metaphor licenses the variety.

Contents:

- **`Projects/`** — the real work. Each project a window: what it is, the
  decision behind it, what broke, live and source links.
- **`Lab/`** — the 14 verified-working demos, launched as apps in their own
  windows. Honestly labelled as experiments, not shipped products.
- **`Terminal`** — `resume`, `contact`, `whoami`, `ls`. The easter-egg surface,
  and a genuinely fast path for anyone who'd rather type.
- **`About`**, plus the existing toys (`car.exe` and friends).

### Layer 2 — `/work` (static, no WebGL)

The recruiter document. Served automatically to software rasterizers and
`saveData` users, and reachable by anyone who clicks WORK. Complete, fast,
keyboard-navigable, printable.

This is not a fallback and must never read as one. It is the surface most
internship screeners will actually use, and it should feel like a well-set
specification document that deliberately doesn't need a GPU.

### Layer 3 — the deck (`/`, touch devices)

Condensed spectacle plus the full content set. A phone can't orbit a room
comfortably, so it gets a different experience rather than a squeezed one.

## Where the lab ideas get reused

The audit found 14 of 17 demos genuinely working (`docs/LAB-AUDIT.md`). They are
not shipped as a wall of iframes — that would be padding a portfolio with
experiments. Instead each strong idea is given a **job**:

| Idea | Reused as |
|---|---|
| **Powers of Ten** | the warp mechanic — room → screen → OS is already a scale-zoom; treat it as one continuous rung-by-rung zoom rather than a dolly |
| **Reality Tear** | the `/work` ↔ room bridge — the flat document tears open to reveal the room, resolving the two-audience split with one gesture |
| **Corrupted** | the `Projects/` presentation inside dhruvOS — skills as stats, projects as quests. Also gives the empty `decision`/`broke` fields a *format* worth filling |
| **Drift** | the `Lab/` launcher — an infinite draggable canvas of demos is exactly the right container for a pile of experiments |
| **Kinetic** | `/work` typography and the deck — editorial kinetic type is the cheapest way to make a GPU-free page not boring |
| **Neural** | the skills view — a living graph beats a list, and works on both `/work` and inside the OS |
| **Decoder** | the loading / intro state, and a hold-to-reveal wireframe mode in the room |

Not reused: Singularity, Flux, Chromatic, Particle Genesis, Resonance, Wormhole.
They are technique demos — beautiful, but they don't answer a question the site
is asking, and shader set-pieces for their own sake are the exact "AI slop with
better shaders" trap this project exists to avoid. They remain available inside
`Lab/` where they belong.

## Fun side and recruiter side

They are not separate sites and must not become two codebases. One content
source, three surfaces (`src/v3/content/index.js` already enforces this).

- **The fun path**: room → monitor → OS → Lab, terminal easter eggs, toys.
- **The recruiter path**: `/work` → project detail → links → résumé → contact.
- **The bridges matter more than either path.** The room carries a plain,
  un-embarrassed WORK link. `/work` carries an honest invitation back to the
  room with a note that it wants a GPU. Neither hides the other; a recruiter who
  gets curious should be able to see the toy, and a builder who wants the facts
  shouldn't have to fly a camera to get them.

## Hardware policy

| Detected | Gets |
|---|---|
| genuine software rasterizer (SwiftShader / llvmpipe) | `/work` |
| integrated GPU (the owner's AMD Radeon / Ryzen 5 5625U is the reference target) | the full room, mid quality tier |
| discrete GPU | the full room, top tier |
| touch device | the deck |
| `saveData` on | `/work` |

Integrated graphics get the **full room**, never a downgrade to static. The
reference machine is a 15W Ryzen 5 5625U with Vega-class integrated graphics at
1920x1080/60Hz — bandwidth-bound and thermally throttled under sustained load.
Quality adapts via resolution scaling and render-on-demand, not by removing
content or features. See `src/v3/desktop/perfGovernor.js`.

## Consequences to hold to

- Adding a project means editing `src/v3/content/index.js` and nothing else.
- A lab demo is never the first thing anyone sees. Experiments are labelled as
  experiments — inflating them into "products" is the fastest way to lose the
  trust of the exact audience being courted.
- The room is not allowed to be the only home of any fact.
- If a surface can't be made good, cut it rather than ship it as filler.
