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

A photoreal 3D Gaussian-splat capture of a room, floating in void, annotated
with instrument chrome — telemetry, readouts, monospace labels. You orbit it.
Objects in the room are anchors that open real content.

The point is that it is **not a render**. It is a photograph that has volume.
Most "impressive" portfolios are shader toys; this reads as a captured artifact,
which is a different and rarer kind of impressive.

## Direction change (2026-09-12) — current

Three things the user decided, which supersede earlier plans:

1. **No person in the scene.** Do not build anything that puts the user's
   likeness on the site.
2. **Use a public/downloaded room scan, not the user's own room.** Their
   reasoning, verbatim: *"They probably have richer budget and a better table."*
   The self-capture path in `docs/CAPTURE.md` is now a **fallback**, not the
   plan.
3. **New hero sequence.** Verbatim:

   > "We use one of those, and then Maybe we also have a laptop or something
   > like that, and then clicking on the laptop, there's, like, a crazy
   > animation motion of, you know, going at the light of speed and then getting
   > transported inside the laptop."

   So: room scan → a laptop/monitor is a clickable object → warp transition →
   you arrive *inside* the machine. What's inside is undecided; candidates are
   enumerated in `docs/ROADMAP.md`.

The user's closing question — **"What other ideas do you have?"** — has not been
answered yet. The candidate list in the roadmap exists to answer it. It needs
the user to pick.

## What this is not

- Not an AI-slop gradient landing page. No purple-to-blue, no glassmorphism, no
  "Crafting digital experiences" copy.
- Not a scroll-jacked story. The user drives the camera.
- Not two codebases. Three surfaces, one content file.
