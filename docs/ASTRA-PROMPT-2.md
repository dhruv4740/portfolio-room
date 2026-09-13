# Prompt for Astra, round 2 — copy everything below the horizontal rule

---

Second pass on the three.js room. You did the night relight and the seated mode.
This is feedback plus three new jobs. Same repo, same constraints as before —
re-read them if you still have them, and note the corrections below, because I
changed some of your values.

**Pull the latest commit first.** I edited `buildWorkspace.js`, `Scan.jsx` and
`WorkspaceStage.jsx` after your commit. Work from `9a461c6`, not from your own
copy, or you will revert my fixes.

## Corrections I already made — do not undo these

**The room was too dark to read.** Night was the right call, but you cut the
floor out from under it: hemisphere went to 0.085, the moon to 0.32, and you
shrank the desk lamp's `distance` from 2.2 to 1.35, which collapsed its pool to
almost nothing. The result was a black frame with a monitor in it — the
furniture, the chair, the shelf and the plant were simply not visible. I raised
hemisphere to 0.26, the moon to 0.75, the lamp to intensity 1.5 / distance 2.3,
the pendant to 0.55 / 2.4, and exposure to 1.35.

The principle to hold: **darkness is only dramatic if there is something legible
in it.** The monitor should be the brightest thing in frame, but the room still
has to read as a room. If you want more contrast, get it from *directionality*
and from baked decals, not by lowering the global floor further.

**The notebook no longer opens a side panel.** It now carries real text on the
page texture itself, generated from `src/v3/content/index.js`, and clicking it
only zooms. `buildWorkspace.js` now imports `identity`, `education`,
`experience` and `achievements` from the content source — keep that import.
If you move the notebook, make sure the zoom framing still lands square enough
to actually read the page; that is now the whole point of the object.

## The governing rule for everything below

The owner's words: *"I don't want the experiences as standalone apps doing
nothing — they should all do something at least or show something, there should
be a reason to click them."* And: *"everything seems to have repeated things
about each other."*

So: **no object becomes interactive unless it reveals real content**, and no two
objects reveal the same content in the same way. If you cannot say what a thing
shows, it stays scenery.

## Job 1 — the window

Right now the window is unchanged and it shows nothing. It reads as a hole in
the wall. It is also the single biggest surface in the room after the wall
itself, so it is doing the most work to make the space feel real and currently
contributing least.

Make it a night view worth looking at. It is Mumbai, so that is a dense, warm,
low-rise-plus-towers skyline, not a generic blue cyberpunk grid. Suggestions,
pick what is cheap:

- A baked skyline texture on a plane well behind the window, with a slight
  parallax offset as the camera orbits. Parallax from camera motion is free —
  you are already re-rendering on those frames.
- Scattered warm window lights in the middle distance. A handful can change
  state very occasionally if and only if you can do it without holding the
  render loop open — a one-shot on entry is fine, a permanent loop is not.
- Blinds or a frame casting a real silhouette into the room. This is baked into
  the shadow map once, so it costs nothing at runtime and buys a lot.

Do **not** add rain, weather systems, or anything with a per-frame particle
budget. Do not make the window clickable unless you have a reason — it is
currently the `contact` anchor, and a side panel with an email address is fine
as-is.

## Job 2 — the phone

Add a phone on the desk. The reason this is worth doing and is not decoration:
**one of his real shipped projects is an Android app.** FocusLock — screen-time
limits enforced across Android and Windows off one Firestore backend.

So the phone shows FocusLock. That is a real project, displayed on the real
device class it runs on, and it is the only place in the whole portfolio where
that happens. That is the opposite of a repeat.

- Model a phone lying on the desk, plausible size, screen facing up or slightly
  propped. It should read as a phone at orbit distance.
- The screen is a texture. **I will supply the actual screen content** — build it
  as a clearly-marked placeholder texture with the right aspect ratio and tell me
  the texture dimensions you used and the function name to replace, and I will
  wire the real thing in. Do not invent UI that claims to be his app.
- Make it inspectable from the seated view, tagged like the other objects. Give
  it its own anchor id (`phone`) and add it to `WORKSPACE.anchors`.
- Its screen should be a genuine light source on the desk at night — even a very
  dim one. A phone face-up in a dark room throws light. This is a point light
  with low intensity and short distance; keep it static like everything else.

## Job 3 — embodiment, scoped honestly

The owner's vision, in his words: *"you sit like a human, you get a human body
from the start."*

I want you to push on this, but I want to be straight about where it gets
expensive, and I would rather you tell me I am wrong than silently build the
hard version.

**What I think is worth building:** when seated, the user sees **their own hands
and forearms**, resting on the desk or on the keyboard, in the lower portion of
the frame. That is what actually sells embodiment in first person. It is a fixed
or near-fixed pose, it needs no inverse kinematics, no skeleton, no animation
system, and it costs one more mesh in a scene that already batches its geometry.
When the user reaches to inspect an object, the hand can move toward it — a
single authored motion, not a solved one.

**What I think is a trap:** a full visible body in first person. Looking down at
your own torso at close range is the thing that looks wrong in almost every
implementation, because the neck-to-chest geometry is at an angle no camera ever
photographs, and any head-turn either drags the body unnaturally or decouples it.
Solving that properly means a rigged character, IK, and animation blending, which
is a different project and a real cost on an integrated GPU.

**Where I might be wrong, and you should tell me:** if he is standing/orbiting at
the start rather than seated, a third-person body is a different and much easier
proposition, because you are looking at it rather than out of it. That may be
closer to what he actually pictured — "you get a human body from the start"
could mean he wants to *see* a character. If you think a visible seated figure,
viewed in third person from the orbit camera, who then becomes the first-person
seated view when you click SIT, is achievable and good — say so, describe it, and
I will take it to him. That transition would be genuinely impressive.

What I need from you here is a **recommendation with a cost estimate**, not a
silent choice. Give me: what you would build, roughly how long, what it costs per
frame on an integrated GPU, and what you would cut if it turned out too heavy.
Then build the version you recommend, hands-only if you are unsure.

Model the hands simply. Stylised, low-poly, matching the room's authored look —
this room is clean authored geometry, not a scan, and realistic hands would look
more out of place than simplified ones.

## Constraints, restated because they still bind

- Integrated AMD GPU is the target. Not the fallback.
- `renderer.shadowMap.autoUpdate = false` with one `needsUpdate`. Static shadows.
  A moving shadow-casting light breaks the whole scheme.
- Changing a light's `intensity` is free. Moving a light is not.
- Render-on-demand: the loop stops scheduling frames when idle. Anything you
  animate continuously turns that off. If you must, tell me which thing and why.
- `WORKSPACE.screen` drives both the camera-travel target and the monitor's
  clickable plane. Change one, change both, in the same edit.
- Vanilla three.js. No r3f, no drei, no postprocessing lib, no new dependencies.
- No CDN imports. Everything resolves through the bundler.
- Never invent content. Any text or UI that claims to be his work comes from me.

## Report back

- Which objects you made interactive and what each one reveals.
- Your embodiment recommendation, with the cost estimate, before or alongside the
  code.
- The phone screen texture dimensions and the function I need to replace.
- Anything you animated continuously, and why it was unavoidable.
- Any change to `WORKSPACE.screen` or `anchors`, with the new values.
- Your honest read on integrated-GPU headroom after this pass, and what you would
  cut first.

---
