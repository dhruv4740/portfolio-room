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
  on `96bb322`, before the lazy phone-UI change, and the only code between that
  and the handoff commit is DOM-only launchpad work.
- `verify-focuslock-app` times out on the friction-step timing. This
  reproduces at the committed baseline.
- On a local production build the launchpad appears about 5 s after load, with
  the main thread busy. The cause hasn't been profiled.
- Dead v1/v2 directories under `src/` still exist. Deletion is approved, but the
  agent's permission classifier blocked it.
- **This branch (`feat/true-scale-room`) adopts the true-scale room** (queue
  item 12). The measurements below were taken on the real GPU and compare this
  branch with `feat/v3`.
  - Suites: the same results as `feat/v3`. `verify-phone-grip` still fails on
    both branches.
  - `verify-v3` also passes 41/41 on a production preview.
  - Forward lean: 24.6 cm → 0 at rest, and 24.3 cm → 9.6 cm when holding the
    phone.
  - GPU median, mid tier, seated drag: 18.1 → 15.2 ms. Triangles:
    231k → 151k.
  - Lost or changed on this branch:
    - The winter-city GLB is skipped, so wet streets have no effect.
    - The old lightmap bake is skipped.
    - The high-tier sash reflection is gone.
    - `?hands=authored` is not rebaked and will be misplaced.
    - The seated figure's root is scaled 0.9 × 0.743 × 0.9, and its torso
      lean renders slightly short.
    - Opening the window now looks from the seat instead of standing at the
      glass.
    - Test edits:
      - `verify-after-hours`, `verify-phone-grip` and `measure-gpu` accept
        `skipped` for the city and the bake.
      - `verify-room-interactions` projects the window diff region from the
        open view.
- Suites that don't pass `?sky=` see day or dusk during Mumbai daytime.
- **Relight (item 13, also on this branch):** the true-scale room has its own baked lighting, one texture density across walls and floor, dust in the lamp beam, and a CSS vignette and grain. GPU cost is below `feat/v3` on every tier.
- **Cold open (item 14):** 7.2 s from the doorway, lamp click, typed name; once per visitor and skippable.
- **First-load stall:** after the room appears, the page freezes for 14–21 s on this iGPU while shaders compile (79 programs, 3 shadow-casting lights). It predates this branch, and a fix needs an owner decision.
- `verify-tour` is flaky on this branch: the CrisisWatch sample failed in 3 of about 8 runs.
- Full overnight account: `docs/MORNING-REPORT.md` on `feat/v3`.
