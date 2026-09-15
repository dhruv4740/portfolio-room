# dhruvOS Roadmap

## Phase 0 — Backbone ✅

| Item | Status |
|---|---|
| `os/shell/content.js` — single source of truth | ✅ Done |
| `os/shell/store.js` — event bus + exploration state | ✅ Done |
| `os/shell/contactStrip.js` — shared footer helper | ✅ Done |
| `os/apps/contact.js` — contact card app | ✅ Done |
| `os/main.js` — ctx extended with `content`, `store`, `openProject`, `openContact` | ✅ Done |
| `os/shell/desktop.js` — contact button + exploration meter | ✅ Done |
| `os/shell/registry.js` — contact app registered | ✅ Done |

## Phase 0.5 — Design Fixes (applied per-app in Phase 1) ✅

| Item | Status |
|---|---|
| Global palette unification (blue→green) | ✅ Done in about.js |
| Min font sizes ≥10px across all apps | ✅ Done |
| Post-decode card depth in projects | ✅ Done |
| Locked-state dramatic treatment | ✅ Done |
| Retained interactive sketches as native OS apps | ✅ Done |
| Wallpaper swatch palette selector | ✅ Done |

## Phase 1 — App Overhaul ✅

| App | Content from content.js | Cross-links | Contact strip | Design fix |
|---|---|---|---|---|
| `about.js` | ✅ | ✅ openProject + openContact | ✅ | ✅ green palette + side drawer |
| `terminal.js` | ✅ | ✅ open <app> + openProject | n/a | ✅ colorized output + ASCII card |
| `projects.js` | ✅ | ✅ store deep-link | ✅ | ✅ dramatic locked state + link chips |
| `gallery.js` | ✅ | ✅ openProject per card | ✅ | ✅ amber year, hover expand, link chips |
| `wallpaper.js` | n/a | n/a | n/a | ✅ swatch UI + store persistence |
| `contact.js` | ✅ | n/a | n/a | ✅ corner accents + copy-to-clipboard |

## Phase 2 — Shell Features

| Item | Status |
|---|---|
| Right-click desktop context menu | ✅ Done (desktop.js — gravity/decoder/music/wallpaper/contact/reset) |
| Animated default wallpaper on boot | ✅ Done (shell/beneathCanvas.js — 80-particle curl flow, 24fps) |
| Mobile / small-screen layout | ⬜ Pending |

## Phase 3 — Native sketch apps

| App | Source | Status |
|---|---|---|
| Corrupted | dependency-free canvas | ✅ Done — visible-lifecycle sketch |
| Flux | dependency-free canvas | ✅ Done — visible-lifecycle sketch |
| Kinetic | dependency-free canvas | ✅ Done — visible-lifecycle sketch |
| Reality Tear | dependency-free canvas | ✅ Done — visible-lifecycle sketch |
| Gravity (Matter.js skill chips) | `mockups/gravity.html` | ✅ Done — chips from content.js, click→openProject |
| Decoder (scramble-reveal bio) | `mockups/decoder.html` | ✅ Done — 5-stage DOM text reveal from content.js |
| Music Player (audio-reactive) | `mockups/resonance.html` | ✅ Done — Canvas 2D, uses ctx.audio.analyser |
| Liminal (raymarched fog) | `mockups/raymarch.html` | ⬜ Pending |
| Particle Genesis lite | `mockups/particles.html` | ⬜ Pending |
| Singularity (raymarched BH) | `mockups/singularity.html` | ⬜ Pending |
| Drift (texture displacement) | `mockups/drift.html` | ⬜ Pending |

## Verification Checklist

- [ ] `BASE=http://localhost:4173 node scripts/verify-os-apps.mjs` → four sketch apps, 0 errors
- [ ] Edit `content.js` project name → changes across all apps simultaneously
- [ ] `about` — click project node → projects app opens and scrolls to that project
- [ ] Menubar `✉ contact` → contact card; click email → copies to clipboard
- [ ] Open several apps → `SYS ▸ N%` rises; reload → persists
- [ ] terminal `ls` lists the current registry; `open gallery` works; `contact` prints ASCII card
- [ ] `wallpaper` → set palette → reopen app → same palette selected
