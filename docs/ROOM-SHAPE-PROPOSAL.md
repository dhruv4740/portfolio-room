# Room shape proposal

Recommendation: start with an angled rear return and a doorway into a short, offset passage. Together they give the camera a corner to move around and suggest a larger place, while keeping the desk and monitor entrance in their current positions. Budget 1.5–2.5 working days including framing and visual checks. This is proposed future work; none of it is implemented in the third pass.

Estimates below are incremental geometry and draw calls after batching, not measured GPU milliseconds. They assume existing materials, a bounded orbit, no walking, no extra shadow-casting lights, and the current single cached shadow map.

| Order | Change | Implementation/tuning estimate | Approximate runtime addition | Reason / risk |
|---|---|---|---|---|
| 1 | Clip one floor corner and angle the left return 20–30 degrees; give the desk alcove a deeper return | 0.5–1 day | 100–300 triangles, 0–2 draws | Breaks the box silhouette and produces useful foreground occlusion as the camera orbits. Refit the room bounds and orbit limits, then bake shadows once. |
| 2 | Add a real doorway with a short passage turning out of sight | 1–1.5 days | 200–600 triangles, 0–3 draws | Implies space beyond without modeling another room. Use a baked warm patch at the turn; avoid an additional real light. |
| 3 | Raise the window corner on one broad step | 0.5–1 day | 100–250 triangles, 0–2 draws | Adds a second height and a strong edge. Keep it outside the chair/desk zone so seated eye height and object inspections stay valid. |
| 4 | Add a partial sloping ceiling with two or three exposed beams | 1 day | 300–900 triangles, 1–3 draws | Gives the upward head turn a destination. The risk is occluding the establishing shot, so leave the camera side open and test extreme orbit angles. |
| 5 | Partial mezzanine with a sparse railing | 2–3 days | 1,500–4,000 triangles, 2–6 draws | Feasible as static geometry, but it creates more occlusion and shadow-map coverage demands. Defer until the smaller changes have earned their place. |

Static shadows make all five cheap relative to moving lights or characters, but not free: added surfaces still shade on every rendered frame. An enlarged shadow frustum also spreads the same texels over more space and can reduce quality. Enlarging its resolution would increase memory and first-frame cost. Keep the passage shallow and the mezzanine small rather than expanding the whole scene.

The expensive direction is a traversable second room or floor with stairs, camera collision, new interactions, dynamic lighting, reflections, or transparent windows looking into fully modeled interiors. That changes navigation and multiplies visible surface work; it is outside this proposal.

If the integrated AMD GPU struggles, remove the mezzanine first, then ceiling detail. Preserve the angled wall and doorway: they change the silhouette and depth most for the least geometry. Validate render submission and actual GPU frame time on the owner's laptop before attaching an FPS claim.
