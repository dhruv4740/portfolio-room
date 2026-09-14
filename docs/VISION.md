# Vision

## The two jobs

A portfolio does two things, and they want opposite designs:

1. **Flex.** "Damn, I made such a crazy website." The audience is other
   builders, graphics people, HN/Twitter. Judged on craft and surprise.
2. **Recruit.** An internship screener needs name, skills, projects, links, in
   under thirty seconds, on whatever device they have.

**Priority, stated by the user: flexing first, internships later.** Where the
two conflict, the flex wins — but the recruiter path must never break, which is
why `/work` is a separate, static, zero-WebGL surface rather than a compromise
baked into the hero.

## The concept

An authored 3D workspace floats in a quiet void, annotated with instrument
chrome — telemetry, readouts, and monospace labels. The desk, monitor, notebook,
and surrounding props are modeled geometry with deliberate materials and
lighting. You orbit the scene; real objects are anchors that open real content.

The point is that the workspace is a designed place, not a generic landing page
or a photogrammetry demo. Its geometry makes the portfolio feel like a small
world while keeping the composition, performance, and interaction under our
control.

## Direction change (2026-09-13) — current

Three things now define the hero:

1. **Use an authored modeled workspace.** Replace the shoe placeholder and the
   planned downloaded room scan with a real desk, monitor, notebook, and other
   modeled scene objects. The hero no longer depends on photogrammetry,
   Gaussian splats, or a capture asset.
2. **No person in the scene.** Do not build anything that puts the user's
   likeness on the site.
3. **New hero sequence.** Verbatim:

   > "We use one of those, and then Maybe we also have a laptop or something
   > like that, and then clicking on the laptop, there's, like, a crazy
   > animation motion of, you know, going at the light of speed and then
   > getting transported inside the laptop."

   So: modeled workspace → a monitor is a clickable object → a focused handoff
   carries you inside the machine. The embedded destination is dhruvOS, which
   includes the four retained interactive sketches.

The modeled workspace resolves the earlier room-capture choice. Further
experiments inside the machine can be considered after the core handoff works.

## What this is not

- Not an AI-slop gradient landing page. No purple-to-blue, no glassmorphism, no
  "Crafting digital experiences" copy.
- Not a scroll-jacked story. The user drives the camera.
- Not two codebases. Three surfaces, one content file.
