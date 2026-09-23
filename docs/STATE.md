# Current state

2026-09-23. Branch `feat/v3`, pushed to `origin` (private
`dhruv4740/portfolio-room`). One agent (Claude) owns the repo; the queue is in
[HANDOFF-OVERNIGHT.md](HANDOFF-OVERNIGHT.md). Older checkpoints and team docs
are in `archive/` and the git log.

## Live and verified on the real GPU (`GPU=1`)

- **Launchpad**: six options with keys 1–6 (projects, phone apps, explore,
  recruiter `/work`, About panel, 60-second guided tour). Contact and GitHub are
  pinned top-right. The résumé download stays hidden until `public/resume.pdf`
  exists and `contact.resume` is set.
- **Deep links** `/#/os/<app>`, `/#/phone[/<app>]`, `/#/about`, `/#/contact`,
  `/#/room/<object>`, and a **Ctrl/⌘+K palette** on every route
  (`verify-deeplinks`).
- **Guided tour**: an autopilot with captions over those routes, interruptible
  by any real input including clicks inside the OS (`verify-tour`).
- **Loading**: a boot bar, then a room-detail bar driven by the three.js
  loading manager. The song, the phone UI and the phone apps load off the
  critical path; the hand bake downloads alongside the scan bundle.
- **Payload**: the city GLB is meshopt-compressed, the GLB textures are WebP and
  the room JPEGs are re-encoded (GLBs 9.5→4.7 MB, JPEGs 9.8→1.8 MB).
- **Live signals**: the latest public GitHub event is shown on the monitor idle
  screen (cached for 30 min, silent on failure).
- **Live Mumbai**: the sky follows IST and Open-Meteo drives rain, wet streets
  and a rain audio layer. Clear nights get a warm haze. The corner readout shows
  time, temperature and conditions, and there is no snow. Review overrides are
  `?sky=` and `?weather=rain|clear`.
- **Link previews**: honest meta text and a real GPU frame as `public/og.jpg`.
  The `og:image` URL is relative until a deploy domain exists.
- **Fixes**: production builds render (JSX runtime pinned). Seated canvas clicks
  now reach the room past the invisible head, so `verify-v3` passes 41/41. The
  monitor marker no longer covers the screen text. `/work` has no overflow at
  625 px. The Fraud app has a proper title. The dev server serves
  `/apps/<name>/` correctly, and full-screen phone apps close when the phone is
  put down.

## Known gaps

- `verify-phone-grip` fails its skin-clipping assertion. It failed the same way
  with the current uncommitted work stashed, but the lazy phone-UI loading change
  hasn't been ruled out as a cause.
- `verify-focuslock-app` times out on the friction-step timing. This
  reproduces at the committed baseline.
- On a local production build the launchpad appears about 5 s after load, with
  the main thread busy. The cause hasn't been profiled.
- Dead v1/v2 directories under `src/` still exist. Deletion is approved, but the
  agent's permission classifier blocked it.
- Mixed scene scale remains the main realism blocker. The true-scale candidate
  (`cinematic*.js`) is not adopted yet (queue item 12).
- Suites that don't pass `?sky=` see day or dusk during Mumbai daytime.
