# Ideas — what would make this portfolio better

Written by Fable 5.1, 2026-09-17. Ideas only; nothing here is built or approved.
Ranked by value against cost. Two audiences, in order: builders (people who
will judge the craft) and internship screeners (people who need facts in
under a minute).

Cost scale: **S** under a day, **M** a few days, **L** a week or more, **XL**
a project of its own. Impact is per audience, 1–5. "Needs owner" means it
cannot be done without material only Dhruv has.

## Tier 1 — cheap, and the site is worse without them

| # | Idea | Cost | Builders | Screeners | Needs owner |
|---|------|------|----------|-----------|-------------|
| 1 | **Deploy it.** No remote, no host, no domain. Nothing else on this list matters until a URL exists. Cloudflare Pages or Vercel, static output, custom domain. | S | 5 | 5 | domain, account |
| 2 | **Real links per project.** `links.live` and `links.github` are empty strings for every project. One honest GitHub link per project turns every claim into something checkable. | S | 5 | 4 | the URLs |
| 3 | **`decision` and `broke` fields.** Empty for every project. "What I decided and why" and "what broke" are the two things builders read first and screeners quote in interviews. Three sentences each. | S | 5 | 3 | his words |
| 4 | **Résumé PDF.** The drawer shows a JPG. Screeners want a file they can forward. `public/resume.pdf` + `contact.resume`. | S | 1 | 5 | the PDF |
| 5 | **Share card (`og:image`).** Shared links preview as bare text. A 1200×630 render of the night room with his name. | S | 3 | 4 | no |
| 6 | **Evidence, generated not typed.** A build step that reads each repo and writes `proof.json`: commits by author, test count, languages, last commit date. Rendered as a small strip per project. This is the honest answer to "how much of DarkSentinel is yours" — it prints the number. Never hand-edited. | M | 5 | 4 | repo access at build |
| 7 | **The 20-second path.** Screeners will not sit down at the desk. A keyboard hint on the first frame ("Press W for the short version") and `/work` leading with three lines: who, what, proof. Most of this exists; the hint and the three lines do not. | S | 1 | 5 | no |

## Tier 2 — medium cost, strong return

| # | Idea | Cost | Builders | Screeners | Needs owner |
|---|------|------|----------|-----------|-------------|
| 8 | **Guided tour.** "Show me around": the room runs its own actions in sequence with captions: sit, open the machine, open a project, pick up the résumé, stand. Visitors who never click still see everything. Reduced-motion gets a slideshow. | M | 4 | 5 | no |
| 9 | **Real project UIs, all seven** (in progress; recipe in `PROMPT-R8-GEMINI.md`). Each window's title bar links to the exact commit the build came from. | M | 5 | 3 | Compose decision |
| 10 | **Source badge inside each app window.** "Built from `d5821bf`, 1 of 8 commits are Dhruv's" — pulled from `proof.json`. The ownership nuance stops being a footnote. | S | 4 | 4 | no |
| 11 | **Lighting bake.** Five point lights plus a directional light are evaluated per pixel; that is what the iGPU pays for at the desk. Bake the static contribution into a lightmap or vertex colours, keep one real light for the lamp and one for the screen. Halves GPU time again. | L | 3 | 1 (faster load) | no |
| 12 | **Time-of-day sync.** The room already has a day sky (`?sky=day`) and the night rig. Follow the visitor's clock. Visitors who return see a different room. | S–M | 3 | 1 | no |
| 13 | **Sound design, gesture-gated.** Key clicks (the keyboard already types), the mug set down, the drawer, the chair. Cheap, and presence goes up a lot. Off until the first click, as the music player already is. | S | 4 | 1 | no |
| 14 | **Type to act.** The keyboard already receives keys. Typing `resume`, `coffee`, `lamp` on the room keyboard runs the action. A builder's shortcut and a small delight. | S | 4 | 1 | no |
| 15 | **"Now" on the monitor.** The screensaver shows the last real commit message and repo, pulled at build time. Proof of activity without a blog. | S | 3 | 3 | no |
| 16 | **Recruiter mode.** One toggle: hides the toys, shows facts, larger type. Same content file. | S | 1 | 4 | no |
| 17 | **Real hand mesh.** The procedural rig has a ceiling. A CC0 rigged hand (GLB) with skinning, driven by the same pose scalars, would pass the eye the geometry never will. | M | 3 | 0 | pick and supply the asset |
| 18 | **Privacy-respecting analytics.** Plausible or a self-hosted counter: which objects get clicked, how many reach `/work`, how many open a project. Decides what to build next with data. | S | 2 | 1 | account |

## Tier 3 — big bets

| # | Idea | Cost | Builders | Screeners | Needs owner |
|---|------|------|----------|-----------|-------------|
| 19 | **Presence.** Other visitors as faint cursors or a second chair; a Durable Object or a tiny WebSocket relay. Builders talk about sites like this. | L | 5 | 0 | hosting choice |
| 20 | **A real terminal in dhruvOS.** Pyodide or a JS sandbox that runs snippets from his actual repos (the SMS parser from Expense Tracker, the risk scorer from DarkSentinel). "Run it" beats "read about it". | L | 5 | 2 | which snippets |
| 21 | **Notebook with real notes.** The notebook is blank and drawable. Pages of real working notes, sketches, the RULES.md from Expense Tracker. | M | 4 | 2 | his notes |
| 22 | **Mobile room.** The deck surface is a scroll page. A phone-first room (single fixed seat, tap targets, no orbit) is a separate product. | L | 3 | 3 | no |
| 23 | **WebGPU renderer.** three.js's WebGPURenderer would not fix the fill cost; the lights are the cost. Skip unless the bake is done and the next bottleneck is API overhead. | XL | 2 | 0 | no |
| 24 | **Photogrammetry of the real desk.** Tried as a splat, abandoned, the owner rejected the placeholder. Do not revive. | – | – | – | – |

## Things to stop doing

- Rebuilding project UIs by hand. Rejected once already; the recipe exists.
- Effect apps on the monitor (Corrupted, Flux, Kinetic, Tear). Already removed
  from the project set; keep them out.
- Claims without a link. Every number on the site should trace to a file or a
  commit; `proof.json` (#6) is how.

## If only three things get done

1. Deploy (#1) with real links (#2) and the résumé PDF (#4).
2. `decision` and `broke` for the three lead projects (#3).
3. The guided tour (#8), so the room works for people who will not click.
