# Brief for Claude Fable 5.1 — lead handler of this codebase

Paste everything from "## System prompt" down into Fable's system prompt, and
"## The task" as the first user message. The owner has put Fable in charge of
this repo: the hands rework first, then the rest of the room, then the project
UIs and any orchestration it wants to delegate.

Run at effort `high` to start (the default). For the hands rework specifically,
try `xhigh` — it is a geometry-and-motion design problem, not a mechanical edit.
Effort names do not mean the same amount of thinking across models, so sweep
`medium` / `high` / `xhigh` on this repo rather than reusing a level from
elsewhere.

---

## System prompt

You are the lead engineer on Dhruv Kothari's portfolio repo. You own the
codebase: you decide implementation approach, you may delegate work to other
models, and you write the briefs for them.

You are operating autonomously. The user is not watching in real time and cannot
answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block
the work. For reversible actions that follow from the original request, proceed
without asking. Stop only for destructive actions or genuine scope changes the
user must decide. Offering follow-ups after the task is done is fine; asking
permission before doing the work is not.

Exception: when the user is describing a problem, asking a question, or thinking
out loud rather than requesting a change, the deliverable is your assessment.
Report your findings and stop.

If, while working or testing, you find a pre-existing bug, a performance concern,
or behavior the task doesn't mention, don't fix, optimize or extend it in this
change unless the requested behavior cannot work without it; report it as a
follow-up in your summary. Where the task is ambiguous, implement the reading its
wording and the surrounding code most directly support, state that assumption in
your summary, and don't build for the other readings as well. Verify your work
however you like; scratch scripts and quick checks need not be kept. This is
about extras only: implement every behavior the task asks for, completely.

Say in a line what you're about to do; brief updates while you work help the user
follow along. Close with a short recap that stands on its own — what you found,
what you did, and what's next.

Please remove all mannered prose. When a literal phrase is available, use it.

Repo rules, which override your own defaults:

- Never commit to `main`/`master`. Work on branch `feat/v3`. Conventional
  Commits, subject under 72 characters, no trailing period, no attribution or
  co-author lines. Commit locally per logical unit of completed work. **Do not
  push** — there is no remote configured.
- Never fabricate project links, metrics, evidence or war stories. Those come
  from the owner, and a fabricated one gets caught in an interview.
- Do not overstate verification. Say what passed, what failed, and what you did
  not test. A partial run is not a passing suite. The owner has called this out
  before.
- State what is measured versus inferred. "I don't know" is a complete answer.
- Anything skipped, deferred or stubbed gets its own named line in the report.
- Do not decide open questions for the owner. `docs/OPEN-QUESTIONS.md` lists
  what he has already answered — do not re-ask those; ask about anything new.
- The owner dislikes long waits and probe loops: one clean verification run, a
  fix, one confirming run.

First privately list what you need next; then request every item that doesn't
depend on another's result in this one response.

---

## The task

Read `AGENTS.md` (repo rules, traps, file map) and `docs/HANDOFF.md` (live state)
before anything else. Everything below assumes you have read both.

### Context

The desktop surface is an authored three.js room — desk, monitor, keyboard,
notebook, chair, lamp, window — that you orbit and then sit at. Seated, a pair of
hands reach for desk objects: phone, notebook, pen, coffee, résumé, award frame,
headphones, lamp, blinds, keyboard. Vanilla three.js with its own renderer and
loop, not react-three-fiber. Render on demand via `invalidate()`; GSAP drives the
animation timelines.

The owner's verdict on the hands: **"the picking up things and the holding things
etc, hand animations etc is very weird ngl"**, and specifically "the hands are
weirdly attached to arm and it sinks in the keyboard at rest". The second half is
fixed (commit 7457f53). The rest is Part 1 below.

### Part 1 — the hands

#### What exists today

No skeleton, no skinning, no IK solver, no animation clips. All authored
procedural geometry.

`src/v3/desktop/buildWorkspace.js`, `seatedHands()` at lines 250–373:

- `skinSweep(points, radii, segments, sides, flatten)` (line 251) sweeps a
  cross-section along a Catmull-Rom curve. Every skin part comes from it, so
  there are no joint collars anywhere.
- `palmGeometry()` (line 272) is a lathed palm profile. Its back end, toward the
  wrist, is an open ring about 0.025 wide by 0.018 tall.
- Each hand (line 289 on) is a `THREE.Group` with a palm mesh, four finger groups
  and one thumb group. A finger is **one rigid mesh** with two baked geometries,
  `userData.relaxed` and `userData.curled` (lines 304–309). `grip(h, pointing)`
  (line 353) swaps which one is drawn. That is the whole of the finger
  articulation: straight or curled, nothing between, no per-joint control.
- The thumb (line 314) is a single fixed sweep that never moves relative to the
  palm.
- Forearm and sleeve are separate cylinders parented to the room root, not to the
  hand. `update()` (line 325) computes a wrist point in hand space, derives an
  elbow from a fixed 0.40 upper-arm length and a fixed pole vector, then scales
  and aims each cylinder. A two-bone solve with no twist and no wrist geometry.
- After build, every hand part is merged into one vertex-coloured mesh per group
  (lines 340–351) to keep draw calls down. **Any per-joint rig has to survive
  that merge or replace the merging strategy.** Current cost: both hands and
  forearms are about 19k triangles in 16 parts, no shadow casting.

`src/v3/desktop/WorkspaceStage.jsx`:

- `REST` (line 233) — resting hand positions, y 1.292 so the fingertips sit on
  the keycaps (`KEY_TOP = 1.2625`, line 488).
- `gripPose(g, out)` (line 236) — a grip is authored **in the target object's own
  local frame**: `{ obj, p: [x,y,z], r: [rx,ry,rz] }`. Position goes through
  `obj.matrix`; the hand quaternion is `obj.quaternion · Euler(r)`. This is why a
  hand stays on a handle however the object turns, and why **every grippable
  object must be a direct child of the room root** — a nested object would need
  `matrixWorld`. If you change that, change it everywhere in one edit.
- `hold(h, a, b, w, via)` (line 244) — lerp/slerp the hand between two grips, with
  an optional midpoint `via` that routes the hand around an edge instead of
  through the object.
- `animatePhone` (line 298), `roomAction(id, reduced)` (line 511) and the
  per-object branches after it are the actual choreography, driven by GSAP.
- `pressKey` (line 489) does the typing dip: the finger over the key's column
  rotates by `asin((tip.y - KEY_TOP) / length)`.
- `startLean()` / `leanCamera()` — desk props sit beyond arm's length from an
  upright seat, so reaching **leans the whole body**, camera and shoulders
  together, instead of stretching the arm. This is deliberate. Keep it.

#### What is wrong

1. **Finger poses.** Straight-or-curled with nothing between means no grip ever
   conforms to the object. The pen hand reads as a claw with the pencil passing
   through the wrist. The award and résumé two-hand holds read as flat paddles
   clamping the frame. Fingers do not wrap, the thumb opposes nothing, and no
   fingertip actually contacts the surface it is meant to hold.
2. **Arm and wrist.** The forearm is a cylinder aimed at a point inside the palm.
   Commit 7457f53 narrowed it to 0.016 at the wrist and buried the end cap so the
   cut disc stopped showing — concealment, not a joint. There is no wrist, no
   forearm twist, and the fixed elbow pole puts the elbow in an odd place in some
   poses.
3. **Motion paths.** Reaches are straight lerps between two authored grips. A
   real reach has an arc, a grip that closes on contact rather than during
   travel, and a settle at the end.

Screenshots of the current state are in `scripts/shots/`: `award-held.png`,
`pen-drawing.png`, `typing-press.png`, `pen-notebook-held.png`.

#### What to build

You decide the approach — that is why this is going to you rather than being
specified. The serious options as the previous agent saw them:

- A real finger rig: three phalanx segments per finger with parented joints, a
  driven thumb, a continuous pose model (open / conform / pinch), and a wrist
  joint between palm and forearm.
- A grip-solve pass: author contact points on each object and close the fingers
  onto them procedurally, so a grip is described by what is touched rather than
  by a hand-space pose.
- Something better. If you replace the hands system wholesale, say so plainly and
  either keep the public surface (`hands.root`, `left`, `right`, `lean`,
  `update()`, `reset()`, `grip()`, and `hand.position` / `hand.quaternion` as the
  thing `hold()` drives) or update every call site in the same change.

Motion quality is in scope: arced reaches, grips that close on arrival, a settle.

#### Hard constraints

- Do not break `hold()`'s contract without updating every call site: phone,
  notebook, coffee, lamp, drawer/résumé, award, pen, blinds, headphones,
  keyboard.
- `prefers-reduced-motion` must still jump straight to the held pose. Every
  action already has a `reduced` branch.
- Render on demand: nothing may run a rAF loop at idle. Anything that animates
  calls `invalidate()`. `verify-held-objects.mjs` asserts zero callbacks at idle.
- Shadows are static (`shadowMap.autoUpdate = false`). Hands do not cast.
- Performance target is a 15W Ryzen 5 5625U with integrated graphics at
  1920×1080. Keep triangles and draw calls near current levels; if a rig needs
  more parts, say what it costs.
- No new dependencies without saying why.

#### Verification

```bash
npm run build
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
BASE=http://localhost:4173 node scripts/verify-v3.mjs                # expect 35/35
BASE=http://localhost:4173 node scripts/verify-room-interactions.mjs
BASE=http://localhost:4173 node scripts/verify-held-objects.mjs
BASE=http://localhost:4173 node scripts/verify-pen-drawing.mjs
BASE=http://localhost:4173 node scripts/shots-typing.mjs             # fingertip heights
BASE=http://localhost:4173 node scripts/shots-desk-fixes.mjs
BASE=http://localhost:4173 node scripts/shots-grips.mjs
```

`npm run preview` strips arguments on this machine — call Vite's bin directly.
There is no lint and no test script; the build plus the Playwright harness is the
entire quality signal. Reuse one preview server; concurrent heavy browser probes
have caused `spawn EPERM` here.

Test hooks live behind `localStorage['v3:test'] = '1'`, exposing `window.__v3test`
with `fingerTips()`, `projectAnchor`, `boxOf`, `timeline`, `projectKey(i)`,
`inkPixels()`. Headless Chromium reports a SwiftShader software GPU, so you must
also set `localStorage['v3:surface-override'] = 'scan'` before page load, or the
capability check correctly routes you to the static `/work` page. **Any fps
number measured headless is meaningless** — do not report one.

**Screenshots are the real judgement here**, since the tests cannot see whether a
hand looks right. Take before/after crops of: rest on the keyboard, mid-reach for
the coffee, the mug held, the pen on the page, the award frame held two-handed,
the résumé held two-handed, the phone held. Put them in `scripts/shots/` and
reference them in the report.

### Part 2 — the rest, in priority order

1. **The black void.** Outside the room walls there is nothing, so the standing
   view floats in black. Deferred by the owner, still undecided. Options he was
   offered: a building exterior with a city around it, a soft studio backdrop in
   the sky colour, or dropping the standing view and starting seated. **Do not
   pick for him** — propose with screenshots and ask.
2. **Markers over keys.** The projected DOM labels (Phone, Keyboard) sit on top
   of keyboard keys in the seated view, making those keys awkward to click. Move,
   offset or hide them.
3. **FPS below 40**, owner-reported on real hardware. A headless comparison
   against build 7b8c191 found identical render cadence and CPU per frame, so the
   CPU side is ruled out and GPU cost is unmeasured. Settling it needs a real-GPU
   profile. If you cannot run one, say so instead of guessing.
4. **Round 7 project UIs.** `docs/PROMPT-R7-GEMINI-REAL-PROJECT-UIS.md` is
   written and unstarted: every project rebuilt as its real UI from its own repo
   — phone apps on the phone, desktop and web apps on the monitor, simulated
   in-browser data tagged DEMO DATA, no invented numbers, no network, no secrets.
   Take it yourself or rewrite the prompt and hand it to another model. The owner
   has offered you the orchestration role, so this is your call.

### Report

Write to `docs/review/fable-lead-round1.md`: what you changed, what you rejected
and why, verbatim test output, screenshot paths, and what is still wrong.
