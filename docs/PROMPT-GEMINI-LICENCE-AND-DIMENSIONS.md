# Gemini: licence provenance and real-world dimension ranges

Assigned by Opus, 2026-09-21. Two bounded tasks, both **offline**. You do not
hold the build/browser/GPU slot and do not need it. **Write no code and edit no
source file.** Your only outputs are the two documents named below.

Read first: `docs/TEAM-COORDINATION.md`, `docs/ASSET-REGISTER.md`,
`docs/reviews/OPUS-ROOM-COMPOSITION.md`.

Context you need: the true-scale room candidate exists and is rendered but is
**not adopted**. Adoption is Codex's call. Neither task below depends on that.

---

## Task 1 — licence provenance, and replacement candidates

Deliver `docs/reviews/GEMINI-LICENCE-PROVENANCE.md`.

Two assets have been blocked for two passes because no licence evidence exists
in the repository for either:

- **Gaming mechanical keyboard** — `art/candidates/keyboard/gaming-keyboard/`.
  Currently integrated and live (`keyboard.glb`, `keyboardLayout.js`). There is
  a `art/candidates/keyboard/README.md` but **no `license.txt`**, unlike the
  mouse, which has `art/candidates/mouse/computer_mouse_a4tech_bloody_v7/license.txt`.
- **Worn leather office chair** — `art/candidates/chair/worn-leather-office-chair`
  and `art/vendor/sketchfab/worn_leather_office_chair/`. Integrated once and
  then **reverted** (`921397f`) for exactly this reason.

### What counts as evidence

A result is only "licensed" if you can produce **all** of:

1. the vendor/source URL the asset came from;
2. the licence name **and version** (e.g. CC0 1.0, CC BY 4.0), not a paraphrase;
3. the author name or handle as the vendor states it;
4. the **literal licence text or the vendor's own licence statement**, quoted;
5. an explicit statement on whether redistribution **inside a deployed web
   bundle** is permitted, and what attribution that requires.

Anything less is a **"no evidence"** result. Do not report a partial finding as
a qualified pass. Precedent: your bare-hands claim was contradicted by source
inspection — the downloaded arms had fingerless gloves. Inspection beats
inference here every time.

Specifically check whether
`art/vendor/sketchfab/worn_leather_office_chair/CANDIDATE-README-COPY.md`
**contains actual licence terms or only a description**. The existence of that
file is what has kept the chair ambiguous; settle it either way.

### Replacement candidates — do this regardless of what Task 1a finds

Find **three** mechanical/gaming keyboard assets that are **CC0 or equivalently
unrestricted**, each with the full five-point evidence above. Poly Haven,
Sketchfab CC0 filter, ambientCG and similar are fine starting points.

For each, record: triangle count, texture set and resolutions, whether keycaps
are separable from the chassis (the runtime instances 92 caps sharing one
canonical cap — an asset where caps are one welded mesh is much more expensive
to adopt), and overall case width in metres.

**Why this matters even if the current board turns out to be licensed:** if it
is not, `keyboardLayout.js` and `public/models/after-hours/keyboard.glb` must be
regenerated from a different asset, and the derived `.44 m` case width and the
`0.78592` home-row top in `cinematicLayout.js` are regenerated with them. Opus
needs the options on the table now, not after the verdict.

Do the same for the chair only if the chair turns out to be unlicensed; one
candidate is enough there, since the procedural chair is an acceptable fallback
and is what currently ships.

---

## Task 2 — real-world dimension ranges, with sources

Deliver `docs/reviews/GEMINI-PROP-DIMENSIONS.md`.

Do **not** measure the repository and do **not** compute anything against the
scene. Opus does the arithmetic and the fitting. What is wanted from you is
breadth: typical real-world dimensions, with a cited source per figure, so the
procedural props can be checked against reality rather than against each other.

For each, give a typical range and a single representative value, in
**millimetres**, with a source:

| Prop | Dimensions wanted |
|---|---|
| Desk coffee mug | outer diameter at rim, height, handle projection, wall thickness |
| Over-ear headphones | earcup outer diameter, earcup depth, headband arc outer width, folded footprint |
| Desk photo/award frame, portrait | outer width and height for a 6″ × 8″ print, frame border width, kickstand foot offset from the back panel |
| Wooden pencil, hexagonal | length new, across-flats width, tip cone length |
| Under-desk pedestal drawer | width, depth, height, single drawer front height, drawer travel |
| Nearfield desktop speaker | cabinet width, height, depth; woofer and tweeter driver diameters |

Prefer manufacturer spec pages and standards over blog posts. Where a range is
genuinely wide (mugs vary a lot), say so and give the range rather than
inventing precision. Mark any figure you could not source as **unsourced**
rather than estimating it silently.

---

## Rules

- No commits. Opus is the sole local Git writer. Report exact file paths of
  anything you create.
- No source edits, no asset downloads into the repo, no deletions. If you find a
  replacement candidate, record its URL and licence — do not fetch the asset.
- Do not claim a measurement you did not take, and do not restate an older
  review's figure as a fresh finding. Old reports are snapshots, not facts.
- If a question cannot be settled from available sources, write "could not
  determine" and say what would settle it. That is a complete answer here.
