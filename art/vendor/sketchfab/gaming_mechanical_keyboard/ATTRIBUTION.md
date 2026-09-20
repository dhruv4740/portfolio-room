# Gaming Mechanical Keyboard

Used for the desk keyboard in the After Hours room.

## Provenance — partially verified

The owner states this was downloaded manually from Sketchfab for this personal,
non-commercial portfolio. **No download URL, author page or licence file came
with the archive**, so the specific licence terms are not verified here. What is
verifiable is only what the file itself records:

| Source | Value |
| --- | --- |
| Archive contents | `source/keyboard.FBX` + 6 PBR maps, no licence or README |
| FBX exporter | Autodesk 3ds Max 2018 |
| FBX timestamp | 2018-06-12 04:54:47 GMT |
| Author path in FBX | `C:\Users\zidan\OneDrive\Documents\3dsMax\` |
| Original document | `D:\keyboard.FBX` |

**Open action for the owner:** paste the Sketchfab model URL into this file so
the licence and the author credit can be recorded properly. If it turns out to
be CC BY, the author's name has to be added to `public/asset-credits.txt`; if it
is CC BY-ND, the decimation below makes a derivative and the asset must be
pulled. This is the one licence class that would still bite a non-commercial
personal site.

## What was changed

`scripts/blender/prepare_keyboard.py` produces
`public/models/after-hours/keyboard.glb` (0.43 MiB):

- Split the single source mesh into loose parts: a 6600-vert chassis, 92 keycaps
  of identical 333-vert topology, and one junk 14-vert plane (discarded).
- Kept the chassis whole (13,232 tris) and exported exactly **one** canonical 1u
  keycap, decimated 632 -> 164 tris, because the runtime instances it 92 times.
- Scaled uniformly by 0.54203 so the board is the room's 0.48 x 0.20 m case.
  The source is 0.886 x 0.373 m, roughly twice life size.
- Replaced the keycap UVs with a top-down 0..1 projection so the room's own
  label atlas prints on the cap top. The chassis keeps its original UVs and the
  asset's BaseColor / Roughness / Metallic / Normal maps, resized to 1K and
  re-encoded as JPEG quality 82.

## Known simplification

One instanced cap cannot carry the source's per-row sculpt: the top three rows
are 0.0416 deep and the bottom four 0.0388, and each row has its own tilt. The
per-row **height** stagger is preserved in the instance matrices (cap tops run
1.2349 to 1.2438), but every cap uses the home row's profile and angle. Wide
keys are the same cap stretched in x, up to 6.5x for the spacebar.
