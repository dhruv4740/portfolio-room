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

The problem it solves: the retained interactive sketches have different visual
languages. As *applications inside an operating system*, that heterogeneity
stops being a style collision and becomes the point. An OS is supposed to run
programs that do not match each other.

Contents:

- **`Projects/`** — the real work. Each project a window: what it is, the
  decision behind it, what broke, live and source links.
- **Interactive sketches** — four dependency-free canvas apps in their own
  windows: Corrupted, Flux, Kinetic, and Reality Tear.
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

## The retained interactive sketches

The former iframe gallery was removed. The four retained sketches are registered
directly as dhruvOS apps, so they have the same window lifecycle as the rest of
the OS and do not carry CDN-backed HTML pages.

| Idea | Reused as |
|---|---|
| **Corrupted** | a dependency-free glitch canvas sketch |
| **Flux** | a dependency-free cursor-driven flow sketch |
| **Kinetic** | a dependency-free motion study |
| **Reality Tear** | a dependency-free pointer-driven reveal sketch |

The other former lab experiments were dropped. `src/lab/registry.js` is empty so
it cannot point at deleted files.

## Fun side and recruiter side

They are not separate sites and must not become two codebases. One content
source, three surfaces (`src/v3/content/index.js` already enforces this).

- **The fun path**: room → monitor → OS → interactive sketches, terminal easter
  eggs, toys.
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
- An interactive sketch is never the first thing anyone sees. It remains a
  sketch inside the OS rather than being presented as a shipped product.
- The room is not allowed to be the only home of any fact.
- If a surface can't be made good, cut it rather than ship it as filler.
