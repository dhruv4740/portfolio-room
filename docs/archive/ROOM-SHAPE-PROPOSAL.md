# Room-shape proposal — fifth pass

The strongest first change is an angled rear corner plus a recessed doorway. Together they give the room an asymmetric silhouette and suggest a larger place beyond it, without changing the desk, monitor travel or content anchors. Keep the current furniture layout while testing those two changes.

These are estimates of added geometry and implementation effort, not measured GPU timings. Static shadows remove recurring shadow-map work; they do not remove geometry drawing, fragment shading or the initial shadow pass. Reuse the existing plaster, concrete and graphite materials so static pieces can join existing batches.

| Option | What it adds to the space | Rough additional cost | Static-shadow consequence |
|---|---|---|---|
| Angled wall / clipped corner | A 20–30° wall return breaks the rectangle and frames the desk diagonally. | 50–150 triangles; roughly half a day for geometry, framing and anchor checks. | Cheap: bake once. Check that the new wall does not block the existing moonlight. |
| Recessed doorway and shallow passage | A thick opening, threshold and dark return wall imply another room without building one. | 100–300 triangles; half to one day. No additional light required. | Cheap: static occlusion adds depth. Avoid extra shadow-casting lights. |
| Single raised step | A low platform under the desk or a side alcove establishes a second plane. | 30–100 triangles; half a day plus chair/desk-height checks. | Cheap to shade; moving furniture requires rebaking and updating authored anchors. |
| Folded / sloping ceiling | Two shallow planes and one beam create a more interesting pendant mount and silhouette. | 50–200 triangles; half to one day. | Cheap once baked; ceiling coverage still shades pixels every rendered frame. Keep the existing light positions. |
| L-shaped floor plan | A short side bay gives the room a corner to look around, with the chair facing into the main bay. | 150–500 triangles; one to two days including camera and interaction review. | Geometry is cheap. Reframing, cutaway visibility and avoiding blocked anchors are the larger costs. |
| Partial mezzanine | A small upper shelf/platform, stair or ladder and guardrail suggest vertical space. | 500–2,000 triangles; two to three days. | Static shadows help, but rails add shadow detail and visible draws. Most likely to obscure the scene or imply an inaccessible area. |

Recommended order: (1) angled corner, (2) recessed doorway, (3) folded ceiling, (4) one step if the composition benefits, (5) L-shaped bay only after those screenshots, (6) mezzanine last. Review a seated view and the initial chair view after each of the first two changes. The current fifth-pass implementation adds only the requested plain ceiling and pendant rose; none of these reshape options has been built.
