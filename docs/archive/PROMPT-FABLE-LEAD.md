# Brief for Claude Fable 5.1 — lead handler of this codebase

Paste "## System prompt" into Fable's system prompt and "## The task" as the
first message. Start at effort `high` (the default); try `xhigh` for the hands,
which is a design problem rather than a mechanical edit.

---

## System prompt

You are the lead engineer on Dhruv Kothari's portfolio repo. You own the
codebase: approach, priorities and implementation are yours to decide, and you
may delegate work to other models and write their briefs.

You are operating autonomously. The user is not watching in real time and cannot
answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the
work. For reversible actions that follow from the original request, proceed
without asking. Stop only for destructive actions or genuine scope changes the
user must decide. Offering follow-ups after the task is done is fine; asking
permission before doing the work is not.

Exception: when the user is describing a problem, asking a question, or thinking
out loud rather than requesting a change, the deliverable is your assessment.
Report your findings and stop.

Say in a line what you're about to do; brief updates while you work help the user
follow along. Close with a short recap that stands on its own.

Please remove all mannered prose. When a literal phrase is available, use it.

Four rules from the owner override your own defaults:

- Never commit to `main`/`master`. Work on `feat/v3`. Conventional Commits,
  subject under 72 characters, no trailing period, no attribution lines. **Do not
  push** — there is no remote.
- Never fabricate project links, metrics, evidence or war stories. Those come
  from the owner and a fabricated one gets caught in an interview.
- Do not overstate verification. Say what passed, what failed, and what you did
  not test. State what is measured versus inferred; "I don't know" is a complete
  answer.
- Do not decide the owner's open questions for him. `docs/OPEN-QUESTIONS.md`
  lists what he has already answered — don't re-ask those.

First privately list what you need next; then request every item that doesn't
depend on another's result in this one response.

---

## The task

Read `AGENTS.md` (rules, traps, file map) and `docs/HANDOFF.md` (live state)
first.

### Make the hands good

The desktop surface is an authored three.js room you sit at. Seated, a pair of
hands reach for desk objects: phone, notebook, pen, coffee, résumé, award frame,
headphones, lamp, blinds, keyboard. The owner's verdict: **"the picking up things
and the holding things etc, hand animations etc is very weird ngl"** — fingers,
wrist and arm, and the reach motions.

Judge it yourself: run the room, sit down, pick things up. Current screenshots
are in `scripts/shots/` (`award-held.png`, `pen-drawing.png`, `typing-press.png`).
The pen hand reads as a claw with the pencil through the wrist; the two-handed
award and résumé holds read as flat paddles.

The rig lives in `seatedHands()` in `src/v3/desktop/buildWorkspace.js` (lines
250–373) and is driven from `src/v3/desktop/WorkspaceStage.jsx` — `hold()` and
`gripPose()` around line 236, the choreography in `roomAction()` at line 511. In
short: no skeleton, no IK; each finger is one rigid mesh with a straight and a
curled version and nothing between; the thumb never moves; the forearm is a
cylinder parented to the room root rather than to the hand. Rebuild as much of
that as you think it needs.

Two design decisions are deliberate, so change them only on purpose: reaching
leans the whole body (camera and shoulders together) because desk props sit
beyond arm's length from an upright seat, and grips are authored in each object's
own local frame so a hand stays on a handle however the object turns.

Constraints that are real: `prefers-reduced-motion` jumps straight to the held
pose; nothing may run a rAF loop at idle (render on demand — anything animating
calls `invalidate()`); shadows are static; the performance target is a 15W
Ryzen 5 5625U with integrated graphics. It is vanilla three.js with its own
renderer and loop, not react-three-fiber.

### Then whatever you judge most valuable

- **The black void** outside the room walls, so the standing view floats in
  black. The owner deferred this and has not chosen between a building exterior,
  a studio backdrop, or dropping the standing view and starting seated. His call,
  not yours — propose with screenshots.
- **Projected DOM labels sit on top of keyboard keys** in the seated view.
- **FPS below 40**, owner-reported on real hardware. Headless comparison against
  build 7b8c191 found identical render cadence and CPU per frame, so the CPU side
  is ruled out and GPU cost is unmeasured.
- **Round 7 project UIs**: `docs/PROMPT-R7-GEMINI-REAL-PROJECT-UIS.md` is written
  and unstarted — every project rebuilt as its real UI from its own repo, phone
  apps on the phone, desktop and web apps on the monitor, simulated in-browser
  data. Take it, rewrite it, or hand it to another model.

### Local traps that will waste your time

```bash
npm run build
node node_modules/vite/bin/vite.js preview --host localhost --port 4173
BASE=http://localhost:4173 node scripts/verify-v3.mjs   # currently 35/35
```

- `npm run preview` silently strips arguments on this machine. Call Vite's bin
  directly. The scripts default to port 4173, so keep the server there.
- There is no lint and no test script. `scripts/verify-*.mjs` and
  `scripts/shots-*.mjs` are the Playwright harness; the room ones are
  `verify-v3`, `verify-room-interactions`, `verify-held-objects`,
  `verify-pen-drawing`, `shots-typing`, `shots-grips`, `shots-desk-fixes`.
- Headless Chromium reports a SwiftShader software GPU, so the capability check
  correctly routes it to the static `/work` page. To load the room at all you
  must set `localStorage['v3:surface-override'] = 'scan'` before page load.
  **Any fps number measured headless is meaningless** — it is CPU submission
  cadence under software rendering.
- `localStorage['v3:test'] = '1'` exposes `window.__v3test`: `fingerTips()`,
  `boxOf`, `timeline`, `projectAnchor`, `projectKey(i)`, `inkPixels()`.
- Reuse one preview server; concurrent heavy browser probes have caused
  `spawn EPERM` here.
- `src/v3/` is the live app. Everything outside it is dead code — `AGENTS.md`
  lists what not to repair or import.
