# Prompt for Astra, round 5 — copy everything below the horizontal rule

---

Fifth pass. The tap interaction works and the UV hit-testing was the right
solution. But there is a blocking bug, and the hands have now been rejected
three rounds running, so this round changes the approach rather than asking for
the same thing again.

Start from commit `ea0f479`. I replaced the grey placeholder on the phone home
screen with a drawn Instagram icon — real gradient tile and camera glyph, no
external asset. `INSTAGRAM_ICON_UV_RECT` is unchanged and still governs drawing,
hover and hit-testing. Keep that invariant.

## Job 1 — BLOCKING: the finger covers the icon it is asking you to click

The ready-to-tap pose sits on top of the Instagram icon. The user cannot see
what they are being asked to click. That is worse than the automatic tap it
replaced, because now the interaction is both hidden *and* required.

Fix, independent of anything else in this document:

- The resting "ready" pose must leave `INSTAGRAM_ICON_UV_RECT` **completely
  unobstructed**. Approach from below or from the side, finger tip clear of the
  icon's projected area, hovering at a readable distance.
- The finger enters the icon's area only during the tap itself, and returns
  clear afterwards.
- **Verify it visually.** Screenshot the held-phone waiting state and confirm the
  icon is fully visible with the hover highlight readable. Do not report this
  fixed on reasoning alone — this is exactly the class of bug that looks correct
  in code and wrong on screen.

## Job 2 — the hands: change the approach, not the polish

Three rounds, three rejections, same words each time: not realistic, wonky. You
have tried austere primitives and you have tried a 4,240-triangle matte
mannequin. The variable being changed is not the one that matters.

Hands are among the hardest things to model convincingly, and a hand that is
slightly wrong is far more unsettling than no hand at all. So the new constraint
is not "make them better." It is:

> **Maximum visible hand area, minimum articulated geometry.**

Concretely:

- **Holding the phone: hide the hand behind the device.** The fingers wrap
  around the *back* of the phone. What the camera sees is finger tips cresting
  the edges of the phone and a forearm entering from the bottom of frame. Almost
  no hand is visible, and the small part that is happens to be the easiest part
  to model convincingly. This is the standard trick and it works.
- **Tapping: one extended index finger and a closed hand.** A pointing hand is a
  silhouette people accept instantly. Five articulated digits in an open pose is
  the hardest possible case and it is the one you have been building three times.
  Do not model an open hand.
- **At rest on the keyboard: consider removing the hands entirely.** They appear
  only when something is held. The seated view without hands was never
  criticised by the owner; the hands themselves have been criticised every
  round. If you think resting hands add something, argue for it — but the
  default now is that they are not there.

Sleeve or cuff where the forearm leaves frame is worth it: it terminates the
limb honestly instead of fading a bare arm into nothing.

If after this you still think a full hand is the right answer, say so with your
reasoning before building it.

## Job 3 — the bulb hangs from nothing

There is **no ceiling mesh in the room**. The pendant cord starts at y = 3.12 in
a room whose `max` y is 3.2, so it emerges from empty space and the bulb reads
as floating.

Add a ceiling, and mount the pendant to it properly — a ceiling rose or a plate
where the cord meets the surface. Both are static and bake into the existing
one-time shadow pass, so the runtime cost is zero.

While you are there: a ceiling changes how the room reads at night and gives the
pendant something to throw light onto. That is a free improvement — take it.

## Job 4 — pick up the notebook and read it

Currently the notebook is read by flying the camera down to the desk. The owner
wants it **picked up**, like the phone: the hand lifts it, brings it up to
reading height, and the page is read held.

Reuse the phone sequence's machinery — same bounded, event-driven animation,
same hand approach as Job 2 (hand behind the object, forearm from below frame).
A notebook is a much more forgiving object to hold than a phone because it is
larger and hides more of the hand.

Constraints specific to this:

- The page must end up **at least as legible as it is now.** I spent a pass
  getting the type size, contrast and framing right; a held notebook that is
  harder to read than the current top-down view is a regression, not a feature.
  Screenshot it and compare.
- Reading must remain possible for a keyboard user, and backing out returns the
  notebook to the desk.
- `prefers-reduced-motion` goes straight to the held reading pose.

## Job 5 — make sitting the way in, and resolve what that breaks

The owner wants **SIT to be the only thing offered at first**, so the room is
entered from the chair rather than orbited into. I agree — it makes the seated
view the default reading of the scene instead of an optional extra.

**There is a problem you must solve as part of this, not after it.**
`WorkspaceStage.jsx` currently restricts seated clicks to
`['monitor', 'notebook', 'phone']`. If sitting is the only way in, then `window`
and `desk` become permanently unreachable — and `window` is the **contact**
anchor, so the room would lose its contact entry point entirely.

Pick one and tell me which:

- Add `window` and `desk` to the seated-clickable set, with sensible seated
  camera framings for each.
- Or keep orbit available as a secondary mode reachable from the seated view, so
  those anchors survive.

Do not ship the sit-gate with two dead anchors.

## Job 6 — the room is a rectangular box

I asked for a written proposal on this last round and have not received one.
That is the outstanding item.

The owner's words: *"this all is like yk a square, can we have a better design."*

Give me a **written proposal, not code**: how would you make the space itself
more interesting, given static shadows and an integrated-GPU budget? Worth
considering — a non-rectangular floor plan, an angled wall, a partial second
level or a step, a doorway or opening implying space beyond, a ceiling that is
not a flat plane, a corner the camera can orbit around rather than across.

For each: rough cost, and whether static shadows make it cheap or expensive.
Then an ordering. We will decide from that.

## Constraints, unchanged

- Integrated AMD GPU is the target. Still never benchmarked on real hardware —
  do not claim otherwise.
- Static shadows: `shadowMap.autoUpdate = false`, one `needsUpdate`. A ceiling
  and a room reshape both bake into that single pass; keep it that way.
- Light intensity and colour animate freely; position does not.
- Render-on-demand. Bounded sequences request frames then stop. Idle waiting
  costs zero frames.
- New close-inspection anchors join the `CLOSE_READ` set in `onComplete`.
- Do not lower the lighting values.
- Vanilla three.js, no new dependencies, no CDN imports.
- `INSTAGRAM_ICON_UV_RECT` governs drawing, hover and hit-testing together.
- The FocusLock screen stays a labelled placeholder until I supply the capture.

## Report back

- A screenshot proving the Instagram icon is unobstructed while waiting.
- Which hand approach you built, and the new visible-surface triangle count.
- Whether you kept resting hands, and why.
- A screenshot of the held notebook page, for legibility comparison.
- Which option you chose for the seated anchor problem in Job 5.
- The room-shape proposal with costs and ordering.

---
