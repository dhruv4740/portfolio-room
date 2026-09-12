# Roadmap

> 2026-09-12: Read [the proposed creative and build plan](PLAN.md) first.
> It revises the ordering below and records source-verified renderer constraints,
> the telemetry measurement issue, and current OS integration work. The older
> candidate list remains for context; the new direction is a recommendation.

Ordered. Flex-first, per `docs/VISION.md`.

## Blocked on the user

**B1. Pick the "inside the laptop" payoff.** Candidates in the next section.
Everything in the hero sequence depends on this choice.

**B2. Content.** All project `links.live` / `links.github`, the `decision` and
`broke` fields, and `contact.linkedin` / `twitter` / `resume` in
`src/v3/content/index.js` are empty strings. No agent can invent these.

**B3. Capture licence.** See `docs/DECISIONS.md` #7. Needs a deep-research pass
the user runs externally and pastes back.

## Candidate ideas for the payoff — answering "what other ideas do you have?"

Not built. Presented for the user to pick from; feasibility noted honestly.

1. **Splat dissolve, not a cut.** The room's splats scatter outward and
   reassemble into the next scene, per-particle on the GPU. This is the
   strongest idea because it is the one effect that is only possible *because*
   the scene is splats — a mesh scene cannot do it. Feasibility: Spark exposes
   `objectModifier` / `worldModifier` / `dyno`, so the API exists. **Not
   prototyped.** Risk: a 270k-particle animated modifier may cost real frame
   time; unmeasured.

2. **Droste / infinite recursion.** Inside the laptop is the same room, smaller,
   with the same laptop. Zoom forever. Cheap to fake with two nested captures
   and a scale loop; enormously effective as a "wait, what" moment.

3. **dhruvOS as the interior.** There is already a desktop-OS project in this
   repo's history (`dhruvOS`, Wave 4, commit `0ae0c71`). Warping into the laptop
   and landing in a working OS the user built is the payoff with the least new
   invention and the most actual substance — the flex becomes "and the thing
   inside is real."

4. **The lab as the interior.** `public/lab/*.html` is 17 working demos. The
   monitor anchor already opens them via `LabScreen.jsx`. Promoting that from a
   panel to the destination of the warp costs almost nothing and reuses built
   work. Weakest surprise, strongest effort-to-payoff.

5. **Per-object portals.** Not one laptop — every anchor warps somewhere
   different. Scales the concept but multiplies the build.

6. **Wireframe reveal.** Hold a key and the photoreal capture drops to its
   underlying point cloud / bounding structure. Shows the machinery. Fits the
   instrument aesthetic exactly.

Recommendation if the user doesn't pick: **3 with the transition from 1.** It
reuses real work and the dissolve is the part that can't be copied.

## Ready to build now

**R1. Evaluate three.js r186 native splat renderer.** Shipped 2026-09-08.
Question to answer: does it cover the per-splat animation hooks the dissolve
needs? If yes, migrate and drop 1.81MB gzip. **Do this before building the warp**
so the warp is written once. See `docs/DECISIONS.md` #2.

**R2. Source the capture.** Needs a visible laptop or monitor, a permissive
licence, and to not be a recognisable benchmark scene. Then: crop hard in
SuperSplat, target under 15MB, drop in `public/splats/`, update `capture` in
`src/v3/content/index.js`, retune the four anchors.

**R3. Delete dead v1/v2 source.** `src/App.jsx`, `src/Shell.jsx`, `src/routes/`,
`src/flagship/`, `src/components/`. Verify `src/lab/` survives — it is live.

**R4. `og:image`.** Links currently preview as bare text, which undoes the flex
at the exact moment someone shares it.

## After the payoff is picked

- Build the warp transition.
- Intro polish — the load sequence is the first thing anyone sees.
- **Record mode**: a keystroke that hides all chrome, so the user can screen-
  record a clean clip. Flex-first means the shareable artifact matters as much
  as the site.
- Test gyro on real hardware.
