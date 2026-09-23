# Open questions — waiting on Dhruv

Ask for these. Do not invent answers; every field below renders as nothing when
empty, which is safe, whereas a fabricated one gets caught in an interview.

## Outstanding

1. **The black void around the room (standing view).** Deferred by the owner
   on 2026-09-15 ("we will tackle this later"). Two of the three options are
   now live prototypes behind a URL flag so they can be judged in the running
   room, not from stills: `/?void=studio` (sky-coloured backdrop, fog, a
   ground plane the room sits on) and `/?void=block` (the same plus the room's
   own slab and neighbouring blocks with lit windows). The third option, start
   seated, needs no mock: it is the seated view. Frames on the real GPU:
   `scripts/shots/void-black.png`, `void-studio.png`, `void-block.png`. The
   default stays black until he picks; the blocks in `block` are placeholders
   that a real pass would model properly.

2. **Résumé download.** The room now shows the current one-page résumé
   (`public/resume-page.jpg`) in the drawer. There is still no downloadable
   PDF; if he wants one, drop it at `public/resume.pdf` and set
   `contact.resume = '/resume.pdf'`.

3. **Deployment** — no remote, host or domain chosen yet. Nothing has been
   pushed; `git push` is blocked until he supplies a remote.

4. **`og:image`** — absent, so shared links preview as bare text. Waiting on the
   finished night-lit room so the share image is the real thing.

5. **BasketProof on the phone (Jetpack Compose).** Compose cannot run in a
   browser. Three honest options, his call:
   a. **Compose Multiplatform, wasm target.** The real composables run. Cost:
      the Android module has to become a KMP module with `expect/actual` for
      every Android-only dependency; the download is several MB of Kotlin/Wasm
      and Skiko; needs Chrome/Firefox/Safari 18+. Days of work, heavy page.
   b. **Recorded screens with tap hotspots.** Real pixels from the emulator,
      stitched into a tappable flow on the phone. Not interactive beyond
      navigation, but nothing is redrawn by hand.
   c. **Keep the round-7 React rebuild**, labelled "rebuilt from the Compose
      source". This is what is on the phone now and what he rejected for the
      monitor apps; on the phone it may be acceptable if labelled.

6. **Expense Tracker on the phone (React Native 0.86).** The recipe proposes
   react-native-web under Vite with the SQLite and native modules replaced by
   in-memory stand-ins. It is the riskiest port in the set (charts and
   navigation libraries may need web shims). Go ahead with that, or keep the
   round-7 rebuild labelled as in 5c? See `docs/PROMPT-R8-GEMINI.md`.

7. **A real hand mesh.** The procedural rig has been rebuilt twice; it is
   better and still not a hand you would mistake for one. The next step that
   changes the picture is a rigged, skinned hand model (GLB), driven by the
   same pose scalars. Downloading assets is his to do: pick a CC0 or CC-BY
   rigged hand (Sketchfab, Quaternius, KayKit), drop it in `public/models/`,
   and say which. Until then the procedural rig stays.

## Answered — do not re-ask

- **Art direction**: night. Monitor is the brightest object; lamp warm, blinds
  cool. See `docs/ASTRA-3D-BRIEF.md`.
- **Inside the monitor**: dhruvOS, which already exists and retains state.
- **Basket Price**: ships, with neutral framing. No mention of scraping, terms
  of service, or the specific delivery companies' storefront mechanics.
- **DarkSentinel role**: answered; the owner built the dashboards, API features
  and the uncertain-zone Claude call (see its `note` in content).
- **Monitor and phone apps**: one app per project, and each project runs as its
  real UI from its own repo — phone apps on the phone, desktop/web apps on the
  monitor, simulated data instead of backends (2026-09-15). The effect sketches
  (Corrupted, Flux, Kinetic, Reality Tear) are no longer the goal.
- **Walls**: bare. No posters, pinboard or shelf; awards stand on the desk.
- **Notebook**: blank page you draw on with the pen; drawing kept until reload.
- **Project set**: show all, ranked by depth. FocusLock, Expense Tracker and
  Basket Price lead; hackathon pieces sit below.
- **CrisisWatch decision**: framed around the constraint (fixed model, so the
  problem was reliable structured output from it) and LangGraph giving the
  verification flow traceable steps. Do **not** write anything implying the
  architecture was poor or that he did not know what he was doing.
- **LinkedIn**: linkedin.com/in/dhruv4740
