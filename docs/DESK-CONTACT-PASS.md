# Staged 3D work — desk contact occlusion

Owner: Codex. Source: src/v3/desktop/deskContactShadows.js.
Status: implemented in an UNIMPORTED module; syntax checked, no GPU execution
or visual acceptance. It does not change Gemini's current runtime snapshot.

## Why this pass

The broad desk lighting has little local occlusion at the bottoms of props.
Existing architectural shadows and wall/floor irradiance do not solve that.
Add height-attenuated, softened contact occlusion on the desk and raised mat.
This is a local ambient-occlusion approximation, not a physically accurate
lamp shadow or an assertion that the rest of the lighting is finished.

The small orthographic capture looks UP from immediately below the tabletop.
It therefore captures each object's nearest underside, rather than allowing
a tall object's top to hide its foot contact. It renders only selected caster
meshes, never the desk, room or receiver planes. Two separable blur passes
soften the result. Desk and felt mat sample the same world-projected texture.
The mat needs a receiver at its own top height or the shadow is hidden beneath it.

Resources: three 512x211 RGBA8/depth targets at the default desk aspect ratio,
one merged static caster draw, selected dynamic mesh draws, two blur draws,
two receiver draws. Actual GPU time is unmeasured. Capture only on changes,
capped at 15Hz; one final invalidation handles the last throttled movement.
Do not claim this cost fits the budget before measuring it.

## Integration after Gemini releases its build/browser slot

1. In buildWorkspace, collect static desk caster geometry BEFORE static
   batching disposes the originals. Use actual world matrices and cloned
   geometry for keyboard case, mouse, book stacks, speakers, lamp base and
   monitor foot/stand. Merge once. Do not include tabletop, mat, walls or
   monitor display. Avoid copying dimensions into a second proxy model.
2. Return the merged geometry as an explicitly owned resource. Pass the actual
   dynamic phone, notebook, coffee, award, headphones and hand roots to the
   module; it borrows source geometries/skeletons without rebinding/disposal.
   Keep static geometry ownership/disposal explicit.
3. Base receiver: center [0,1.165,-.04], size [3.52,1.45]. Raised felt receiver:
   center [.11,1.174,.25], size [.95,.52], radius .025. Derive these from named
   shared desk/mat definitions during integration instead of duplicating them.
4. Call update(performance.now()) after pose/world-matrix updates and before
   main rendering. Hide receivers while capturing the environment probe to
   avoid depending on a stale pose in a cached probe. Preserve static
   architectural shadow autoUpdate=false; the pass restores renderer state.
5. Start on high/mid only. Do not spend GPU budget adding lights. Low-tier
   contact treatment can use static capture after verifying its startup cost.
6. Inspect rest, typing, lifted/returned mug, phone/notebook, pen and award.
   Confirm contacts leave the tabletop as props lift, no dark hand ghosts,
   no alpha rectangle/edge bleed, and mat receives keyboard/finger occlusion.
   Inspect shadow-map behavior and final idle render counts.
7. Measure GPU p95 and capture count at pinned DPR. Compare with the same
   camera/composition/effect state; do not compare incidental flow samples.

Further scale finding: keyboard case bottom is 1.1835m while mat top is
1.174m. Resolve the 9.5mm gap with credible feet or placement during 3D
integration; do not use a dark shadow to disguise unsupported geometry.

## What remains uncertain

Shader compilation on the target GPU, softness/strength, hand occlusion quality,
moving source visibility, overhead, and probe interactions are unverified.
The implementation is not permission for Gemini/Opus to edit 3D files; Codex
integrates and owns art acceptance. Do not mark the overall realism plan done.
