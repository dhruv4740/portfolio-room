# Hand form, deformation and surface pass — 2026-09-20

Codex owns this pass. No current external assignment. This refines the existing
procedural rig; it is not a claim of a photorealistic replacement.

## Changes

- Forearm skin overlaps the palm instead of starting with a round cap at the
  heel. Its union blends over 12mm; hand-to-arm weights transition over a 64mm
  longitudinal region (z .018 to .082), independent of surface-distance ties.
  Thumb contributions remain intact through that region. An early version
  replaced them at a cutoff and produced a sharp fold in the award grip;
  visual review caught it, and the corrected night cup/award frames were checked.
- A shallow thenar pad merges into the palm at the thumb root. Dorsal arch,
  metacarpal ridges and oval wrist from the earlier study remain. Added two
  shallow palmar folds, not painted black creases.
- Skin sampling is 3.5mm rather than 5mm; the old mesh had only about three
  cells across a fingertip. Cloth density is unchanged.
- handAppearance.js adds regional linear vertex colours and a small procedural
  microrelief/roughness tile. Detail is bound to the neutral mesh and deforms
  with it. Shared 128px mipmapped texture, no external assets or new draws.
  This is ordinary surface shading, not a subsurface-scattering implementation.
- Bone positions, 19-bone ordering, finger dimensions and authored pose controls
  are preserved. Binary format remains version 1; its existing UV flag is used.

## Evidence at first implementation checkpoint

Build passed. verify-hand-assets.mjs confirms both compressed and uncompressed
files match generated bind attributes/indices, normalized valid bone weights,
and finite bounded CPU-skinned vertices for all 11 presets. Its initial index
comparison caught a harness type mismatch (source Uint16 versus serialized
Uint32); corrected to compare the format's intended Uint32 representation.

The first complete daylight capture passed before the final density/fold edit.
Cup and rest frames inspected: wrist transition is visibly less pinched, skin
remains stylized. Final night/day captures, reduced-motion/held/contact checks
and GPU cost are pending. Do not treat that earlier capture as final acceptance.
The complete night capture subsequently passed; the final weight correction
was confirmed with a focused night cup/award capture. Rest, award, cup and pen
night frames inspected. Full final daylight capture is running. Existing night
lighting leaves the raised hands quite dark; do not hide that limitation.

## Remaining artistic limits

Implicit geometry still lacks a sculpted anatomical topology and detailed
knuckle/nail-bed construction. Microrelief is restrained procedural detail,
not scanned skin. Do not increase noise to conceal form errors. Judge grips,
silhouettes and wrist continuity in the actual room before further texture work.
