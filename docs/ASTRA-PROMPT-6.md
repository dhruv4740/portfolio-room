# Prompt for Astra, round 6 — copy everything below the horizontal rule

---

Sixth pass. The held-object work and the chair entry landed, and the owner's
verdict is that things are better. Two real bugs, three new interactions, and a
green light on the room reshape.

Start from current `feat/v3` HEAD. The room-shape proposal is accepted — see
Job 7.

## Job 1 — BUG: the room has no side walls

The owner: *"left and right side of the ROOM is an abyss of darkness."*

He is right and it is not a lighting problem. The room has a **back wall** and a
**short left return wall** and nothing else. There is no left wall, no right
wall. The sides of the space are open to void, which is why they read as an
abyss no matter how the lights are set.

Build the room as an actual enclosed space. Both side walls, full height,
meeting the ceiling you added last round. They are static, they bake into the
existing one-time shadow pass, and they will change how the light behaves —
bounce and containment are a large part of why the night lighting has felt thin.
Expect to re-check the lighting after this and tell me if anything needs
adjusting. Do not lower the current values as a first move.

Keep whatever cutaway logic the orbit camera needs so the room does not occlude
itself from outside — but from the seated view it must read as a closed room.

## Job 2 — BUG: the arms appear from nowhere and are impossibly long

The owner: *"if you look around in the chair the arms appear out of nowhere and
are insanely freakishly lengthy."*

Cause: the hands are added to the room root in world space. They are fixed
geometry authored to look correct from exactly one gaze direction. Turning the
head shows them from angles they were never built for, and a forearm that
terminates by disappearing out of frame looks fine head-on and absurd from the
side.

Do not try to make them correct from every angle. That is the expensive path and
it is the one that has failed three times. Instead:

- **Hands exist only while an object is held.** During free look — seated, empty
  handed — there are no hands at all.
- While an object *is* held, the camera is constrained anyway, so the hands only
  ever need to be correct within that narrow range.
- If the user can still turn their head far while holding something, fade or hide
  the hands past a gaze threshold rather than letting them be seen side-on.

This follows directly from last round's constraint — maximum visible hand area,
minimum articulated geometry — and it also resolves the complaint, so treat it
as the same problem rather than a new one.

## Job 3 — BUG: held objects intersect the hand and pass through the desk

Two related problems the owner reported: *"when i pick something up its going
into my hand a bit"* and *"sometimes it goes below the keyboard not possible
irl."*

The first is an offset problem — the object's origin is being placed at the grip
point rather than resting against it, so geometry interpenetrates. Work out the
contact offset per object and hold it there.

The second is that the pick-up and put-down paths are straight tweens that
ignore everything between start and end. Route them over an arc that clears the
desk surface and the keyboard. This does not need collision detection — an
authored path with enough clearance is sufficient and far cheaper. Nothing
should ever pass through the desk, the keyboard or the monitor.

Verify both by screenshotting mid-animation, not just at the end states. This is
another bug class that looks correct in code and wrong on screen.

## Job 4 — the desk lamp switch

Add a switch on the desk lamp that the hand reaches over and physically clicks,
turning the lamp on and off.

This is a good interaction because it is the one thing in the room where the
user's action changes the *lighting*, and lighting is the room's strongest
feature. Toggling the warm key light at night is a genuinely large visual
change for almost no cost.

- The switch is a small, real, clickable piece of geometry on the lamp body or
  its cord. It should look pressable.
- The hand reaches and clicks it — same bounded animation approach, same hand
  constraints as Job 2.
- **The lamp's light changes intensity only.** It does not move, so the baked
  shadow map stays valid. This is the case the static-shadow scheme was designed
  for and it costs nothing.
- The room must still be readable with the lamp off — the moon, the monitor and
  the pendant carry it. If off is unusably dark, raise the others rather than
  refusing the feature.
- It should hold its state. Turning it off and looking around keeps it off.

## Job 5 — the coffee

There is a mug on the left of the desk. Make it pick-up-able, and make drinking
from it work: the hand lifts it, it tilts toward the camera, the level drops,
and it returns to the desk.

On the liquid, be realistic about what is affordable: **do not attempt a fluid
simulation.** A flat liquid surface inside the mug whose height drops as you
drink, with a slight tilt during the motion and a subtly darker ring where it
meets the ceramic, reads convincingly and costs essentially nothing. A surface
that stays level relative to the world while the mug tilts is the single detail
that sells it — that is a rotation on one plane, not physics.

If the mug empties, it stays empty. Do not refill it silently; a mug you can
finish is a better detail than one that resets.

This is pure character rather than content, which is fine — it is the one
interaction in the room allowed to exist just because it feels good.

## Job 6 — the desk anchor is uninspired, so remove it

The owner's words: *"the desk click thing is uninspired, how do we fix that?"*

My answer is that it should not exist. The `desk` anchor currently opens
FocusLock in a side panel, which is the least interesting possible way to show a
project — and FocusLock now has a far better home: it is the punchline of the
phone sequence, shown on the device class it actually runs on.

So: **remove the `desk` anchor entirely.** Its content is already better served
elsewhere, and the interactions that replace it on that part of the desk are the
lamp switch and the coffee. A generic "desk" hotspot next to three specific,
physical, animated objects is exactly the kind of repetition the owner has been
objecting to all along.

Tell me if removing it breaks anything structural — otherwise take it out.

## Job 7 — the room reshape is approved

Your proposal is accepted, in your recommended order. Build the first three:

1. **Angled corner / clipped wall** — breaks the rectangle, frames the desk
   diagonally.
2. **Recessed doorway and shallow passage** — implies a larger place beyond the
   room without building one.
3. **Folded / sloping ceiling with a beam** — gives the pendant a real mount and
   a better silhouette.

Hold items 4 to 6 (step, L-shaped bay, mezzanine). Do not start them.

Screenshot the seated view and the initial chair view after each of the first
two, as you proposed. If any of them fights the monitor travel, the content
anchors or the night lighting, stop and tell me rather than working around it.

Note this interacts with Job 1 — you are adding side walls and reshaping at the
same time, so do the walls first and get a correct box before making it an
interesting one.

## Constraints, unchanged

- Integrated AMD GPU is the target, still never benchmarked on real hardware. Do
  not claim measured performance you do not have.
- Static shadows: `shadowMap.autoUpdate = false`, one `needsUpdate`. Walls,
  ceiling, reshape and the lamp toggle all preserve this. Intensity animates
  free; position does not.
- Render-on-demand. Bounded sequences request frames then stop; idle costs zero.
- New close-inspection anchors join the `CLOSE_READ` set in `onComplete`.
- Do not lower the current lighting values as a first response to anything.
- Vanilla three.js, no new dependencies, no CDN imports.
- `INSTAGRAM_ICON_UV_RECT` governs drawing, hover and hit-testing together.
- The FocusLock screen stays a labelled placeholder until I supply the capture.

## Report back

- Screenshots: mid-animation pickup (showing desk clearance), the lamp on and
  off, the mug part-drunk, and the room after the reshape.
- Confirmation that free-look while seated and empty-handed shows no hands.
- Whether the side walls changed the lighting, and what you adjusted.
- Whether removing the `desk` anchor broke anything.
- What you would cut first if the integrated GPU struggles.

---
