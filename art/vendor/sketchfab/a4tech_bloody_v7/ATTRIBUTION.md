# Computer mouse A4Tech Bloody V7 — source, license and attribution

| | |
|---|---|
| Asset | Computer mouse A4Tech bloody V7 |
| Source page | https://sketchfab.com/3d-models/computer-mouse-a4tech-bloody-v7-69e3f3ec5cc44b14afaa85c53db09c1f |
| Author | Prokyovec (https://sketchfab.com/fipro333) |
| License | CC BY 4.0 (http://creativecommons.org/licenses/by/4.0/) |
| Commercial use | Allowed; credit required |

License evidence is the `license.txt` shipped inside the owner's download,
copied here verbatim. Required credit text, per that file:

> This work is based on "Computer mouse A4Tech bloody V7"
> (https://sketchfab.com/3d-models/computer-mouse-a4tech-bloody-v7-69e3f3ec5cc44b14afaa85c53db09c1f)
> by Prokyovec (https://sketchfab.com/fipro333) licensed under CC-BY-4.0
> (http://creativecommons.org/licenses/by/4.0/)

It is shipped to users in `public/asset-credits.txt`.

## Measured source

Measured in Blender 5.2.2 from the owner's download, not quoted from a listing:

- 136,520 triangles across 6 mesh parts and 5 materials.
- **No textures.** The glTF declares zero images and zero textures; all five
  materials are flat base-colour/metallic/roughness values. The Bloody hand
  logo and the button seams are modelled geometry, which is why the source
  is this dense.
- Source bounds 5.8644 × 8.5115 × 2.6126 in its own units — no real-world
  scale, so scale had to be chosen rather than read.

## Modifications in the derived runtime file

`export/mouse.glb`, produced by `scripts/blender/prepare_mouse.py`:

1. Decimate (collapse) at ratio 0.085 → **11,601 triangles**, a 91.5%
   reduction. No UV work was needed: there are no texture maps to preserve.
2. Parents cleared from the Sketchfab empties and transforms applied.
3. Origin moved to the centre of the footprint on the base plane, so the room
   positions the mouse by its contact point with the desk mat.
4. Uniform scale 0.014569 to a 124 mm length, then X scaled by a further 0.85.
   The asset is proportionally wider than the real product (85.5 mm against
   roughly 66 mm); 0.85 lands 72.7 mm without altering length, height or
   profile. Final measured size **72.7 × 124.0 × 38.0 mm**.
5. Texture coordinates dropped on export (nothing samples them).

Result is 597,652 bytes, well under the 2 MiB budget.

## Accepted degradation

Rendered close-ups at the source and decimated densities are
`scripts/shots/mouse-source.png` and `scripts/shots/mouse-decimated.png`,
produced by `scripts/blender/compare_mouse_decimation.py`.

The overall shell, silhouette and side-button forms survive. The engraved
Bloody hand logo and the fine button-seam creases visibly break up — they are
sub-millimetre geometry. Both renders frame the mouse far closer than any
camera in the scene reaches, where the logo is well under a pixel. This is
accepted on that basis, not on the triangle count.

No performance improvement is claimed here; nothing has been measured.

## What is original source and what is derived

- `../../../candidates/mouse/computer_mouse_a4tech_bloody_v7/` — the owner's
  untouched download. Do not edit or delete.
- `license.txt` — copied verbatim from that download.
- `export/mouse.glb` — derived runtime file.
- `CHECKSUMS.json` — SHA-256 and byte size for source and derived files.
