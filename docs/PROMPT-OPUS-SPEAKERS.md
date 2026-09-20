# Opus — authored nearfield speaker detail module

Read AGENTS.md and docs/TEAM-COORDINATION.md. The owner now permits bounded
3D implementation by Opus. Codex retains art direction and final integration.
Work in this shared repo on feat/v3. Do not spawn agents, commit, build, launch
browsers, download assets, or modify any existing runtime or public asset.

Write only src/v3/desktop/speakerDetails.js and
docs/reviews/OPUS-SPEAKERS-HANDOFF.md. The module stays unimported until Codex
reviews it. No changes to buildWorkspace.js or hand files.

Problem: the current pair has rounded cabinets but a flat CircleGeometry cone
that reads as a black box. Build original, physically credible compact speaker
fronts. Existing cabinets: centres x=-0.96 and +0.95, y=1.305, z=-0.45;
size .18 x .28 x .16 metres, front toward +Z at -.37. Existing circular disc
is at y=1.3, z=-.362 with radius .059. Codex will remove only that old disc.
Preserve cabinets, position, desk contact and all functional anchors.

Export createSpeakerDetails() returning {root, dispose}. Both fronts are in
world coordinates. Use vanilla three.js and mergeGeometries, no dependencies.
Own/dispose all created geometry/materials; no animation, textures, lights,
transparency, logos or bright indicators. Disable raycasting on detail meshes.

Specific construction per front:
- Woofer centre y=1.265; outer radius .060, surrounding mounting flange,
  rounded rubber suspension, a sloping paper diaphragm and small dust cap.
  Cabinet front limits the recess: sculpt everything between z=-.368 and
  -.350 so no surface disappears behind the solid existing cabinet.
  Use LatheGeometry with an explicit rotational profile for the cone/surround;
  orient its local axis toward +Z, check normals and avoid coincident surfaces.
- Tweeter centre y=1.385, radius .021: shallow waveguide and central dome.
- Four small recessed mounting screw heads around the woofer flange, radius
  about .002; no modeled threads. Ensure the flange fits the .18m cabinet.
- Distinguish matte graphite paper, softer black rubber and satin dark metal
  by roughness and restrained colour variation. No glossy chrome.
- At most three new material draws for BOTH fronts combined, at most 3,000
  added triangles total. Merge parts by material; dispose temporary geometries.
  Fine radial segments around 24–32 suffice at the actual camera distance.
- Details receive existing shadows; do not add shadow-map update requests.

Check syntax and geometry bounds/counts with Node (no renderer needed). Report
actual triangle count, material count, XYZ bounds, API and exact integration
instructions in your handoff. Call out any unverified normals/appearance.
Do not claim browser or visual acceptance. Codex will import, remove the old
discs and inspect both seated and overview views under actual room lighting.

This ownership exception covers ONLY these two new files. Hand anatomy,
materials, contact shadows, city and live scene remain Codex-owned.
