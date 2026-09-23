# Gemini: realistic hand asset research and acquisition

**SUPERSEDED:** follow PROMPT-GEMINI-ASSET-AUDIT-V2.md and Opus's current
assignments. The earlier report misclassified the acquired fingerless gloves
as bare hands; see REALISM-ASSET-CHECKPOINT.md for rendered evidence and limits.

Read AGENTS.md, docs/HANDOFF.md and docs/TEAM-COORDINATION.md. Work in this
shared repository on feat/v3. This is research/acquisition, not scene coding.
The owner wants convincing bare first-person hands, not swollen procedural
hands or ripped GTA/RDR assets. Codex owns anatomy acceptance and integration.

## Exclusive scope

Write only `art/candidates/hands/` and
`docs/reviews/GEMINI-HAND-ASSETS.md`. No runtime/public assets, dependencies,
Git writes, builds, localhost browser sessions or verification script changes.
Do not spawn agents. Research external sites as needed. No paid purchases,
account creation, credential requests or bypassing download restrictions.

## Deliverable

Find at most three credible candidates and recommend one. Prefer CC0 or CC BY,
realistic bare hands with forearms, anatomically convincing neutral pose,
usable finger/thumb rig, UVs, and actual PBR textures. Skin and wrist quality
matter more than advertised polygon count. Dark gloves and painted low-poly
arms do not meet the direction. Evaluate previews, not titles alone.

Start with these leads; their pages were found but files and appearance have
NOT been validated:

- BAMEN, Free FPS Arms: https://sketchfab.com/3d-models/free-fps-arms-gameready-rigged-296d30fc705b4dff85c2c8a2d2724e7f
  Page claims 13.7k triangles, rigged, 1K PBR, CC BY; military sleeves may clash.
- ElenaFF, Rigged hand: https://sketchfab.com/3d-models/hand-rigged-eae97cc2a742413cb5338ab942b12c1e
  Page claims 29k triangles, rigged, CC BY-SA. Prefer a simpler license if
  quality is comparable; explicitly record share-alike terms if shortlisted.
- CreativeMachine, Hand Rig: https://sketchfab.com/3d-models/hand-rig-a348cf6087eb4fd98a83b026593823ad
  CC BY; multiple high-resolution posed hands, procedural Blender materials.
  Baking and simplification may make this unsuitable for immediate use.
- DJMaesen, FP arms: https://sketchfab.com/3d-models/fp-arms-06ee1407117d4e5ab343becb4ee44bb6
  Page claims 9.9k triangles and 4K maps; confirm rig and visual suitability.

You may find better original, licensed sources. Do not use game rips even if
an uploader attaches an open license. Do not revisit the previously rejected
WRAD/DevMops retro low-poly direction.

For each shortlisted asset record source, creator, exact license link and
attribution requirements, preview assessment, download availability, rig,
topology/triangle count, texture types/resolutions, physical units if known,
file sizes, and required adaptation. Separate measured facts from page claims.

Download the strongest freely accessible candidate(s) into your owned folder,
preserving originals and directory structure. Include source/license metadata
and SHA-256 hashes. Do not redistribute questionable assets into public/.
Inspect accessible files offline with lightweight tools; no Blender render or
GPU benchmark. If login prevents downloading the best candidate, give the
owner the precise asset page and requested format (prefer original Blender
or FBX with textures and rig); do not substitute a bad asset just to download
something. State clearly that an inaccessible file was not inspected.

End the report with READY FOR CODEX REVIEW or USER DOWNLOAD NEEDED, your exact
changed-file list, and the recommended next action. Do not integrate anything.
