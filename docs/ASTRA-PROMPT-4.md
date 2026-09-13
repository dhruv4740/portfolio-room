# Prompt for Astra, round 4 — copy everything below the horizontal rule

---

Fourth pass, and a short one. The phone sequence works and the owner's reaction
was that the vision is alive. Three changes, one of which is a real interaction
change rather than a tweak.

Start from the current `feat/v3` HEAD.

## Job 1 — the user taps Instagram, not the hand

Right now `markPhone('tap')` fires on the timeline at t≈2.2s and FocusLock
appears on its own. The owner wants to **tap the icon himself**. That is the
difference between watching an ad and using a phone, and he is right that it is
better.

New flow:

1. Click the phone from the seated view.
2. The hand picks it up and brings it to the camera. **The sequence stops
   there.** The home screen is showing, one Instagram icon on it, and the other
   hand is in frame with a finger ready — hovering, not tapping.
3. Nothing further happens until the user clicks. Frames stop being requested.
   The room is idle and waiting.
4. **The user clicks the Instagram icon on the phone screen.** The finger comes
   down, taps it, and FocusLock takes over.

The hard part is step 4, so be deliberate about it. The Instagram icon is a
region of a texture on the phone screen mesh, not its own object. Raycast
against the screen mesh, take the hit's **UV coordinate**, and test it against
the icon's rect in UV space. Define that rect as a named constant next to the
texture function that draws the icon, so the two can never drift apart — if you
move the icon in the texture you move the constant in the same edit.

Requirements around it:

- The icon needs a hover state, so it is discoverable that it can be clicked.
  Cursor change on hover at minimum. A subtle highlight on the icon is better.
  Hovering must not start a permanent animation loop.
- Clicking anywhere else on the phone does nothing. Do not make the whole screen
  a button — the point is that he is tapping *that app*.
- Keyboard path: the sequence must be completable without a mouse. A focusable
  control or an Enter binding while the phone is held is fine.
- `prefers-reduced-motion` still goes straight to FocusLock with no reach and no
  tap, but the user should still perform the click.

## Job 2 — the left hand picks up the phone

The phone sits at `anchors.phone = [-0.80, 1.196, -0.03]`, which is on the
**left** side of the desk. Your sequence has the right hand reach across the
body to get it, and the left hand do the tapping. That is backwards and it is
why the reach looks awkward.

Swap them. **Left hand picks up and holds the phone. Right hand taps.** That is
what a person actually does with a phone on their left.

## Job 3 — the hands still look wrong

The owner's words: *"finger and hand design is all wonky and bad not realistic
at all."* This is the third pass on the hands, so I want to be direct about what
I think is going wrong rather than just asking for "better."

You are building hands out of scaled spheres and cylinders. That approach has a
ceiling, and the current result is under it: the proportions read as inflated,
the fingers as uniform tubes, and the join between finger and palm as a seam
rather than a knuckle.

**Pick one of these two directions and commit to it. Tell me which you chose
and why.**

**A — go for anatomical correctness.** Real hands have specific proportions and
if any of them are off the whole thing reads as wrong: fingers taper toward the
tip; the three segments of a finger get shorter toward the tip, roughly 2:1.2:1;
the middle finger is longest, index and ring near-equal and shorter, little
finger markedly shorter; the knuckle line across the palm is an arc, not a
straight edge; the thumb opposes from low on the palm at a very different angle
from the fingers, and it has two segments, not three; the palm is thicker at the
base than at the knuckles. Get the silhouette right before any surface detail —
if the outline is correct the hand reads as a hand even untextured.

**B — commit to deliberate stylisation.** The room is clean authored geometry
with flat materials, not a scan. A simplified hand that is *obviously* a
designed object — smooth, matte, unambiguously stylised, closer to a wooden
artist's mannequin or a clay maquette — will read as intentional rather than as
a failed attempt at realism. This is often the stronger choice when the
surrounding art direction is already stylised, and it is much more achievable
from primitives.

My honest read: **B is more likely to succeed** and would sit better with the
rest of the room, but the owner said "not realistic at all" as a criticism,
which points at A. So if you choose B, make the stylisation confident and
obvious enough that it reads as a choice — a slightly-off realistic hand and a
deliberately stylised one are very different things, and the failure mode of B
is landing in between.

Either way: separated fingers with visible joints, a wrist, and a forearm that
recedes out of frame. Spend the triangles. This is the most looked-at object in
the seated view.

## Constraints, unchanged

- Integrated AMD GPU is the target.
- Static shadows: `shadowMap.autoUpdate = false`, one `needsUpdate`. Moving
  hands must not re-render the shadow map.
- Light intensity and colour are free to animate; position is not.
- Render-on-demand. Bounded sequences request frames and then stop. **Waiting
  for the user's tap must cost zero frames.**
- New close-inspection anchors must join the `CLOSE_READ` set in
  `WorkspaceStage.jsx` `onComplete`, or the camera gets clamped back out.
- Do not lower the lighting values.
- Vanilla three.js, no new dependencies, no CDN imports.
- Screens and logos come from me — keep both phone textures as labelled
  placeholders.

## Report back

- Which hand direction you chose, A or B, and why.
- The Instagram icon's UV rect constant and where it lives.
- Confirmation that the idle wait between pickup and tap requests zero frames.
- New triangle count for the hands.
- Anything you could not do the way I described it.

---
