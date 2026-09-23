# Handoff: overnight autonomous run (written 2026-09-23 ~01:45)

**Read this first. It supersedes HANDOFF.md, HANDOFF-NEXT-SESSION.md,
TEAM-COORDINATION.md and every ownership/GPU-slot rule in older docs.**

## Who and how

- The owner is Dhruv. **You are the only agent.** Codex/Astra and Fable are
  gone for good. File reservations and the "GPU slot" protocol are dead. You
  may write occasional offline "workhorse" prompts for Gemini (the owner
  forwards them), but nothing depends on it.
- The owner approved **everything** below and asked for a continuous,
  autonomous overnight run. Don't stop to ask questions. When a decision is
  ambiguous, take the conservative reading, note it in the report, and
  continue.
- **Git:**
  - Work on `feat/v3`; big bets go on their own branches.
  - **Never merge to main.**
  - Commit after every logical unit and `git push` each branch.
  - The remote is `origin` → https://github.com/dhruv4740/portfolio-room
    (private). The owner's older private repo `dhruv4740/portfolio` is
    unrelated: don't touch it.
- Conventional Commits, no attribution lines. Follow `~/.claude/CLAUDE.md`
  (conclusion first, never overstate verification).
- Subagents are allowed on Sonnet/Haiku for exploration.

## State at handoff (all committed and pushed)

| Commit | What |
|---|---|
| `2e61c29` | Hands unfused. Surface unions restored to 3 mm and finger skin-weight falloff set to 2.5 mm (`handSurface.js` `SURF`). Hands yawed inward onto F/J. Thumb points forward. New skin material: `MeshPhysicalMaterial` with a wrapped-diffuse SSS hack, sheen and crease darkening (`handAppearance.js`). Paler nails. Torso vertical shift clamped. First-person head never drawn. Test hook `__v3test.keyBoxes()`. Harness `scripts/review-hands-rest.mjs` |
| `b1e0675` | Each resting hand is aligned with its own forearm (`restYaw`). Rest wrists are 19°/7°; the left is vertical extension, within the normal range |
| `2abe121` | `docs/PARKED-IDEAS.md`: case-study pages undecided; AI chat and multiplayer cut |

Audit of the whole site: `docs/reviews/OPUS55-AUDIT-2026-09-23.md`. Read it.
Its bug list is part of the queue.

**Hands verification so far:**
- `verify-reduced-hands`: passed 8/8.
- GPU grip frames: 18 shots, no page errors.
- `verify-held-objects`: **not yet run successfully**. It must be run with
  `GPU=1`.

## Critical traps

- **After any change to hand topology, bind pose, `POSES.open` or the thumb
  `d0`/`d1` vectors, run `node scripts/build-hand-assets.mjs`** (about 4 s)
  and commit both `public/models/hands-v1.bin*`. The browser loads the bake,
  not the source.
- Changes to `POSES.rest`, the materials and `applyHandAppearance` apply at
  runtime and need no rebake.
- **Playwright suites must run with `GPU=1`** (real AMD iGPU through ANGLE
  D3D11). Without it, software rendering starves input and clicks hang.
  That's why `verify-v3` "aborts after 13". It is not a code bug.
- **Never trust a SwiftShader frame for any visual claim.**
- **Dev server:** `.claude/launch.json` has `dev` and `preview` configs, both
  on port 4173.
- **The dev server shows the recursive-room bug:** `/apps/<name>/` falls back
  to the root index. Preview/production is fine. Fixing it with a small Vite
  dev middleware is in the queue.
- **Never add an SPA `/*` rewrite on the host.** The app uses HashRouter.
- **Stray preview servers:** the old hand-comparison worktrees at
  `%LOCALAPPDATA%\Temp\handcmp\*` still have preview servers on ports
  4201–4205. Kill them, then run `git worktree remove` on each. Also remove
  the stale `%LOCALAPPDATA%\Temp\pf-old` worktree.
- **Don't delete owner files:** `art/`, `resume/`, the root résumé jpg, or
  `scripts/probe-*.mjs`.

## The approved queue, in order

Commit and push after each item. Verify on the GPU and look at the frames.

1. **Hands wrap-up.** Run `GPU=1 BASE=http://localhost:4173 node
   scripts/verify-held-objects.mjs` and `verify-room-interactions`. Fix any
   regressions.
2. **Five-option launchpad** (`Scan.jsx`, the `.launchpad` section). Place it
   higher and larger. Each option gets a one-line explanation and a time
   estimate, and keys 1–5 act as shortcuts:
   1. Try my projects: the computer, ~3 min.
   2. Phone apps.
   3. Explore the room.
   4. **Recruiter? 30-second version:** `/work`.
   5. **About me:** a DOM panel with identity, experience and achievements
      from `content/index.js`.

   Keep Contact and GitHub pinned top-right. Keep the existing
   `data-launchpad-action` hooks, which the tests use. The résumé download
   stays hidden until the owner adds `public/resume.pdf`
   (`contact.resume`).
3. **Real loading progress.** Replace "INITIALISING" with a progress bar
   driven by the asset loads, and let the launchpad become usable early.
   Lazy-load `song.mp3` (only needed when the headphones go on), the hand
   bake (only needed when seated) and PhoneScreen plus the phone apps (only
   needed when the phone is picked up).
4. **Link previews.** Fix the false meta/OG description in `index.html` ("a
   photorealistic scan… seventeen things"; the site has 8 projects). Set the
   title role to match the content: "Full-stack developer". Render a real
   GPU frame of the room as `public/og.jpg` at 1200×630 and add
   `og:image`/`twitter:card`.
5. **Compression.** The owner OK'd dev-only tools (`@gltf-transform/cli`,
   meshopt, KTX2). Current cold payload is ~12.6 MB of models and audio plus
   ~7–8 MB of textures. The lamp GLB is 2.9 MB and the city GLB 4.5 MB.
   Register the needed decoders (MeshoptDecoder/KTX2Loader) in the loaders.
   Delete `public/splats/` (the rejected 8.3 MB shoe, gitignored but copied
   into local `dist/`).
6. **Deep links and command palette.**
   - Deep links: `/#/os/<app>` opens straight into the running app in
     dhruvOS; add equivalents for phone apps, About and Contact.
   - Palette: Ctrl/⌘+K anywhere, to jump to projects, résumé, contact and
     room actions.
7. **Live signals.** Show the owner's recent public GitHub activity on the
   monitor's idle/home screen, using the unauthenticated GitHub API for user
   `dhruv4740`. Cache it and fail silently.
8. **Live Mumbai.**
   - **There is never snow in Mumbai.** Snow goes.
   - Drive the sky from Mumbai local time (IST) and real weather from
     Open-Meteo (free, no key; Mumbai is at 19.07, 72.88).
   - When it's raining (or in monsoon, June–September, with rain): rain on
     the glass, wet street reflections, rain/traffic audio.
   - Otherwise: a humid night with sea haze and sodium-orange streetlights.
   - Add a small "Mumbai · 01:40 · 27°C · light rain" readout.
   - The existing `setSky` states and `cityAudio.js` are the hooks. The city
     model (`winter-city.glb`) needs retuning toward Mumbai; do the full
     retune on the relight branch.
9. **Fixes batch:**
   - the "01 Monitor" marker overlapping the monitor text;
   - `/work` horizontal overflow at 625 px (`.work-skill-meta`);
   - the Fraud app's `<title>` reads "Vite + React + TS";
   - a Vite dev middleware so `/apps/<name>/` serves its own `index.html`;
   - dead code (`src/game`, `src/hooks`, `src/store`, `src/data`, `src/lib`,
     `src/lab`, `src/content`, `src/shaders`, `src/index.css`, empty
     `src/components/*`, `src/flagship`);
   - unused dependencies (`framer-motion`, `lenis`, `zustand`, `howler`,
     `r3f-perf`);
   - stale splat comments in `App.jsx`, `capability.js` and `vite.config.js`.
10. **60-second guided tour** (approved). An autopilot camera tour with
    captions that briefly opens the real apps and can be interrupted at any
    time. It ends on Résumé · Contact · Recruiter version. It is a launchpad
    option alongside the recruiter route; both stay.
11. **Docs cleanup** (approved).
    - Move `docs/PROMPT-*`, `TEAM-*`, `*-CONTINUATION*` and superseded
      handoffs to `docs/archive/`.
    - Rewrite AGENTS.md for a single agent, with an optional Gemini
      workhorse lane. Remove the contradictory "No internal
      subagents"/"Luna/Sol" text.
    - Update STATE.md.
12. **Branch `feat/true-scale-room`.**
    - Adopt the true-scale candidate (`cinematicLayout.js`,
      `buildCinematicWorkspace.js`, `cinematicRoomInteractions.js`,
      `cinematicSpeakerDetails.js`). Its return shape matches
      `buildWorkspace`.
    - Rework the world-space hand kinematics in the same edit. Details:
      `docs/reviews/OPUS-ROOM-COMPOSITION.md`,
      `docs/reviews/OPUS-HANDS-AND-REACH.md`.
    - Today the keyboard is 94 cm from the shoulders and the torso leans
      24 cm at rest.
    - The `WORKSPACE.screen` invariant still applies (AGENTS.md).
13. **Branch `feat/relight`** (based on the true-scale branch). Realism items
    1–5, all approved:
    - baked GI lightmaps via Blender 5.2 (installed at
      `C:\Program Files\Blender Foundation\Blender 5.2`; the pipeline is in
      `scripts/blender/`);
    - Poly Haven CC0 materials;
    - post-processing: AgX/filmic, bloom, grain, vignette, and depth of
      field in cutscenes;
    - atmosphere: dust in the lamp beam, coffee steam, rain and haze;
    - sound design.

    Target: "GTA V/RDR2-feeling" for **one room**. Keep the iGPU budget
    (GPU timer ms via `scripts/measure-gpu.mjs`).
14. **Cutscenes, after the relight.**
    - A cold open under 8 s: a rainy Mumbai night, drift in, the lamp clicks
      on, settle at the desk, the name types onto the monitor. Skippable,
      once per visitor.
    - A coffee/chai moment by the window in the monsoon.
    - Use **first-person camera language with hands minimal/out of focus.**
    - Human/character animation is optional. Research free mocap and
      realistic rigged hands (Mixamo, and whether the MetaHuman licence now
      allows non-Unreal use, which is unverified). Skip it if it isn't
      convincing; pre-rendered Blender video cutscenes are the fallback.

**Expected:** items 1–11 are realistic in one night. Items 12–14 may be
partial. Report exactly what landed and what didn't, with a named line per
skipped item.

## Final report for the owner (in the morning)

What changed per item, with commit hashes, verification actually run versus
not run, GPU screenshots of the landing, seated view and hands, and anything
skipped. Send the key frames with SendUserFile.
