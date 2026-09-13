# Prompt for Astra, round 3 — copy everything below the horizontal rule

---

Third pass. The skyline and the phone landed well. The hands did not, and there
is one big new feature. Same repo, same constraints.

**Start from commit `4b34a49`, not from your own copy.** I made fixes after your
`b29e135` and you will revert them otherwise. What I changed:

- **Lighting, again.** Still too dark for the owner. Hemisphere 0.26 → 0.42,
  moon 0.75 → 1.15, desk lamp 1.5/2.3 → 1.85/3.0, pendant 0.55/2.4 →
  0.85/3.2, exposure 1.35 → 1.5. Do not lower these. If you want more night
  feeling, get it from contrast and direction, not from turning the floor down.
- **The notebook.** Rewrote the page texture — larger type, dark ink, wrapped
  long lines, an emissive map so night lighting cannot make it unreadable, and a
  portrait page with the book resized to match. Reduced its Y rotation from
  −0.12 to −0.04 because the skew made every line run diagonally when read from
  above. Re-aimed `anchors.notebook` at the page centre and framed the read from
  almost directly overhead.
- **A bug in your `onComplete`.** You reset
  `controls.minDistance = ... selected !== 'phone' ? 1.4 : 0.025`. That 1.4m
  floor silently undid the notebook flight on the very next frame — the camera
  flew in and OrbitControls immediately clamped it back out, so the close view
  was impossible regardless of the offset. I introduced a `CLOSE_READ` set
  (`phone`, `notebook`). **Any new close-inspection object you add must join
  that set** or it will have the same invisible failure.

## Job 1 — the hands are wrong, and they do nothing

The owner's verdict was blunt and I agree with it. Look at
`scripts/shots/round-two-hands.png`. The problems:

- Fingers are fused into mitten-like blocks with no separation.
- They end at the wrist in mid-air. There is no forearm, no sleeve, no body —
  they read as severed props resting on the keyboard.
- They intersect the keycaps rather than resting on them.
- They are completely static, which makes them read as scenery rather than as
  the user's own hands.

544 triangles was too austere a budget. Spend more. A believable pair of hands
with separated fingers, a wrist and a forearm that recedes out of frame toward
the viewer is worth a few thousand triangles — this is one mesh in a scene
already merging its geometry, and it is the single most important object for
selling embodiment. Keep them stylised and low-poly to match the room's
authored look; do not chase realism. But they must have fingers.

They also need to be *doing* something. At rest they should sit on the keyboard
in a plausible typing posture, weight on the desk, not floating. Idle motion —
a small settle, a finger shift — is acceptable **only** as a one-shot on
entering the seated view, not as a permanent loop.

## Job 2 — the phone sequence. This is the headline.

This is what the owner asked for directly and enthusiastically, so build it
properly. The sequence, when the user clicks the phone from the seated view:

1. **The right hand reaches over and picks up the phone.** The phone leaves the
   desk and comes up toward the camera, held.
2. **The left hand comes into frame with a finger extended, ready to tap.**
3. **The phone's home screen has exactly one app icon on it.** That icon is
   Instagram. Everything else on the home screen is empty. This is the joke and
   it should be legible — a phone with one app.
4. **The finger taps it.**
5. **FocusLock takes over the screen.** The app that limits your screen time
   interrupting the one app you have. That is the punchline and the whole
   sequence exists to land it.
6. The user can back out — Escape and a visible control — and the hand returns
   the phone to the desk.

Notes on building it:

- This is a **bounded, event-driven animation**. It runs on user action and it
  ends. That is entirely compatible with render-on-demand: request frames while
  the sequence plays, stop when it settles. This is the one place in the room
  where animation is not just allowed but required.
- **Animate it by hand.** No animation system, no skeleton, no IK solver, no
  glTF rig. Authored transforms on a timeline with GSAP, which is already a
  dependency and already drives the camera. A reach is a position tween and a
  rotation tween. A tap is a small finger translation. Keep it that simple.
- **Timing is the whole thing.** The reach should feel unhurried, the tap crisp,
  and there should be a beat of hesitation between the tap and FocusLock
  appearing — that pause is what makes the punchline land. Aim for roughly 2.5
  to 3.5 seconds end to end. Do not rush it.
- **Both screens are textures I will supply.** Build the Instagram home screen
  and the FocusLock screen as two clearly-marked placeholder textures at the
  dimensions you already established (540 × 1200 portrait). Tell me both
  function names. Do **not** draw a real Instagram logo or invent FocusLock UI —
  I will provide both. A labelled grey box is the correct placeholder.
- The phone's screen light should change when the screen content changes. It is
  a static point light, so only its colour and intensity move — which is free.
- Respect `prefers-reduced-motion`: skip straight to the FocusLock state with no
  reach or tap.

If any part of this is not achievable the way I have described it, tell me
before building rather than shipping a degraded version silently. This one
matters more than anything else in this pass.

## Job 3 — the room is a box, and the owner noticed

His words: *"this all is like yk a square, can we have a better design or maybe
keep that future scope."*

He is right. It is a rectangular room with a desk against one wall. I am not
asking you to rebuild it in this pass — the hands and the phone sequence are the
priority and I would rather have those excellent than have three things half
done.

What I want from you here is **a written proposal, not code**. Given everything
you now know about the scene and its integrated-GPU budget, how would you make
the space itself more interesting? Things worth considering: a non-rectangular
floor plan, a partial second level or a step, an angled wall, a doorway or
opening that implies space beyond the room, a ceiling that is not a flat plane,
a corner the camera can orbit *around* rather than just across. Tell me which of
these are cheap given static shadows and which are expensive, and what you would
do first.

Include a rough cost and a rough ordering. I will take it to him and we will
decide whether it happens now or later.

## Constraints, unchanged

- Integrated AMD GPU is the target, not the fallback.
- `renderer.shadowMap.autoUpdate = false` with one `needsUpdate`. Static
  shadows. The hands and the phone moving must **not** re-render the shadow map
  — bake their contact shadows as decals if they need any.
- Light `intensity` and colour are free to animate. Light *position* is not.
- Render-on-demand: request frames during a bounded sequence, then stop. Never
  leave a permanent loop running.
- Any new close-inspection anchor must be added to the `CLOSE_READ` set in
  `WorkspaceStage.jsx` `onComplete`, or its camera flight will be silently
  clamped back out.
- `WORKSPACE.screen` drives both the travel target and the clickable plane.
- Vanilla three.js. No new dependencies, no CDN imports, no r3f.
- Never invent content. Screens, logos and UI come from me.

## Report back

- The two placeholder texture function names for the phone screens.
- The full timing breakdown of the phone sequence, in seconds per beat.
- Triangle count for the new hands, and what you did about the forearms.
- Confirmation that nothing animates continuously after each sequence settles.
- Your room-shape proposal, with costs and an ordering.
- What you would cut first if the integrated GPU struggles.

---
