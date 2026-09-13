# Prompt for Astra, round 7 — copy everything below the horizontal rule

---

Seventh pass. **This supersedes Job 2 of round 6.** I told you to remove the
resting hands; the owner has overruled that and he is right. Do not remove them.
His reasoning: if hands only appear when he grabs the phone, they have come from
nowhere. Continuity matters more than hiding the problem.

Everything else in round 6 still stands — side walls, held-object clipping, lamp
switch, coffee, removing the `desk` anchor, and the approved reshape.

Start from current `feat/v3` HEAD.

## Job 1 — build a full seated human body

This is the headline and it replaces the hands-only approach entirely.

The owner has wanted this from the beginning — *"you sit like a human, you get a
human body from the start"* — and the arm problem is what finally forces it.
Arms look freakish when you turn your head because they belong to nothing. Give
them a body and the problem stops being a problem: seeing your own shoulder when
you look sideways is *correct*, not a bug.

What this means concretely:

- A person sits in the chair. Torso, lap, thighs, legs, arms, hands. Seen from
  the seated first-person view you look down at your own lap and forearms.
- Seen from the **orbit view before the user sits**, there is somebody sitting
  at the desk. The owner should be able to walk up on the scene and find it
  occupied.
- Clicking SIT moves the camera into that person's head. The transition from
  looking at someone to being them is, done well, the best moment in the whole
  room. Spend effort on it.

**The single most important thing here: never show the face.** This is what makes
the job tractable. From orbit you see the back and side of the head and the
shoulders — build a plausible head silhouette and hair, no facial features
needed at close range. From first person you see lap, chest edge and arms, and
the head is the camera. If you set the orbit angles so the face is never framed,
you have removed the hardest part of human modelling from the scope entirely.
Constrain the camera to guarantee this rather than hoping.

Other guidance:

- Keep the stylisation consistent with the room — clean authored geometry, matte
  materials, simplified. A realistic body in a stylised room will read worse
  than a stylised body, not better. Clothing should be simple blocked shapes:
  sleeves, a collar, trousers, shoes.
- The body is **static geometry** except for the arms during interactions. It
  does not breathe, idle or shift weight. That keeps render-on-demand intact.
- Static shadows still apply. The seated figure bakes into the one-time pass. It
  does not move, so this is free.
- The arms are now part of the body, so their origin problem disappears. Rebuild
  them at correct proportions: upper arm and forearm roughly equal, elbow where
  an elbow goes, wrists that line up with the keyboard.

I want to be straight with you: this is the highest-risk item in the project. A
badly-made human is much worse than no human. If partway in you conclude it will
not reach a good standard, **stop and tell me** rather than shipping something
uncanny. Getting a clear "this needs a proper character asset" from you is a
useful result, not a failure.

## Job 2 — attempt real liquid in the mug, once

Last round I told you not to attempt fluid simulation. The owner wants it tried
properly at least once, so try it.

Do a genuine attempt at convincing liquid in the coffee mug — surface motion
that sloshes and settles as the mug is lifted and tilted, not just a plane that
rotates. Shader-based surface displacement on a small mesh, confined to a mug
interior, is a very different cost proposition from a full fluid sim, and it
only ever needs to run during a bounded interaction.

Rules:

- It runs **only** while the mug is held and moving. When it settles, frames
  stop. No permanent simulation.
- If it cannot look convincingly better than the simple tilting-plane version,
  say so plainly and keep the simple one. The owner asked for the attempt, not
  for a bad result.
- Report what it costs. This is the kind of thing that is fine on a good GPU and
  ruinous on an integrated one, and integrated is the target.

## Job 3 — four more interactions, all chosen by the owner

These are on top of the lamp switch and the coffee. Same rules throughout:
bounded event-driven animation, hand approach per Job 1, static lights, frames
stop when the sequence settles.

**1. Hackathon award on the shelf.** Pick up a framed certificate or small
trophy and read it. It carries his two wins and the finalist placing. This is
the only place his achievements exist as a physical object. Text comes from the
content source — `achievements` is already imported into `buildWorkspace.js`.
Legibility matters as much as it did for the notebook: build it to be read.

**2. A desk drawer with something inside.** It opens, and there is something in
it. Build the drawer and the opening motion; leave the contents as a clearly
marked placeholder and tell me what slot to fill. The owner and I will decide
what is in there — it should be a detail people feel clever for finding.

**3. Window blind cord.** Pull it to open and close the blinds. This is the
second interaction that changes the room's light, and it pairs with the lamp
switch — between them the user controls the whole mood of the room. Blinds
change how much of the skyline is visible and how much cool rim light enters.
Light **intensity** changes are free; if the blind slats themselves cast
shadows, that geometry moves, so handle it by swapping between two baked states
rather than re-rendering the shadow map.

**4. Headphones you can put on.** Pick them up from the desk and wear them. This
one is deliberately a bridge: dhruvOS has a music app, and the owner wants the
room and the OS to connect. Build the object and the wearing motion, and expose
a clear state flag for whether they are on — I will wire the audio side. **No
audio plays without a user gesture**, ever.

## Job 4 — the keyboard actually types

Currently the keyboard is scenery. Make pressing keys put text on the monitor.

The reason this is worth doing: the monitor is already a **live dhruvOS in a
same-origin iframe**, not a picture of one. So typing on the physical keyboard
and seeing it appear on that screen means the room and the OS are genuinely the
same machine. That is a much stronger claim than any visual effect.

- Keys depress physically when pressed — that tactile feedback is half the value.
- Text goes to whatever is on the screen. Check how `DhruvOSScreen.jsx` holds
  the iframe bridge before designing this; forwarding key events into a
  same-origin iframe is straightforward, but the pre-travel state may be a
  static texture rather than the live OS, and those two cases need different
  handling. Tell me what you find.
- Physical keyboard input from the user's real keyboard should drive it too, not
  only clicking keys with the mouse.
- Do not break the existing Escape binding or the keyboard accessibility of the
  anchors. There is a Playwright harness asserting focus behaviour; keep 36/36.

## Constraints, unchanged

- Integrated AMD GPU is the target, still never benchmarked on real hardware.
- Static shadows: `shadowMap.autoUpdate = false`, one `needsUpdate`. The seated
  body, walls, ceiling and reshape all bake into that single pass.
- Light intensity and colour animate free; position does not.
- Render-on-demand. Bounded sequences request frames then stop. Idle costs zero.
- New close-inspection anchors join the `CLOSE_READ` set in `onComplete`.
- Do not lower the current lighting values as a first response.
- Vanilla three.js, no new dependencies, no CDN imports.
- `INSTAGRAM_ICON_UV_RECT` governs drawing, hover and hit-testing together.
- The FocusLock screen stays a labelled placeholder.
- Never invent content. Award text comes from the content source; drawer
  contents are a placeholder I will fill.

## Report back

- Screenshots: the seated figure from orbit, the first-person view of your own
  lap and arms, and the sit transition mid-flight.
- Your honest assessment of whether the body reaches a good standard, and
  whether you think a proper character asset is needed instead.
- What the liquid attempt cost, and whether you kept it or fell back.
- What you found about typing into the monitor in both the pre-travel and live
  states.
- The drawer contents slot, and what format you want it in.
- Confirmation that idle still costs zero frames after all of this.

---
