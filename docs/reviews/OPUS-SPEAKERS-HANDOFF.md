# OPUS — nearfield speaker detail module handoff

New file: `src/v3/desktop/speakerDetails.js`. Unimported. No other runtime file
was touched.

## API

```js
import { createSpeakerDetails } from './speakerDetails.js';

const speakerDetails = createSpeakerDetails();   // no arguments
root.add(speakerDetails.root);                    // world space, add untransformed
// ...
speakerDetails.dispose();                         // geometries + materials + root.clear()
```

`root` is a `THREE.Group` named `Speaker driver details` holding exactly three
meshes: `Speaker metalwork`, `Speaker surrounds`, `Speaker cones`. Every vertex
is already in world coordinates — do not position, rotate or scale the group.

## Integration (exact)

1. In `buildWorkspace.js`, in the speaker loop around line 454, delete only:
   ```js
   const cone = new THREE.Mesh(new THREE.CircleGeometry(0.059, 24), black); cone.position.set(x, 1.3, -0.362); root.add(cone);
   ```
   Keep `box('Nearfield speaker', …)` and its `0.02` rounded-box radius.
2. Import and add once (not inside the loop):
   ```js
   const speakerDetails = createSpeakerDetails();
   root.add(speakerDetails.root);
   ```
3. Call `speakerDetails.dispose()` wherever the workspace teardown disposes its
   other owned resources.

**Remove the old disc in the same commit that adds the import.** The old disc
(y=1.3, z=-0.362, r=0.059) occupies the same volume as the new woofer, so
running both produces z-fighting and a doubled silhouette. They are mutually
exclusive, not additive.

`Speaker metalwork` / `Speaker surrounds` / `Speaker cones` are deliberately not
in the `contactNames` set at `buildWorkspace.js:578`, so the contact-shadow pass
never picks them up as casters. They also need no receiver registration:
`deskContactShadows.js` projects onto its own horizontal decal meshes
(`Desk contact receiver N`, built from `center`/`size`/`raisedReceivers`), it
does not patch object materials — so these vertical driver fronts are outside
that pass exactly as the cabinet already is. Nothing requests a shadow-map
update.

`buildWorkspace.js:239` creates `root` with no position, rotation, scale or
matrix assignment anywhere in the file, so it is at identity and the baked world
coordinates land correctly.

## Measured (Node, no renderer)

| Quantity | Value |
|---|---|
| Triangles | **2784** total — metalwork 1440, surrounds 480, cones 864 |
| Materials | **3** (`MeshStandardMaterial`), one draw each, both fronts merged |
| Meshes | 3 |
| Bounds X | -1.0285 … 1.0185 |
| Bounds Y | 1.1965 … 1.4060 |
| Bounds Z | -0.3680 … -0.3502 |

Budgets: ≤3000 triangles and ≤3 materials, both satisfied. Radial segments 24
for woofer and tweeter. All merged geometries are indexed and carry
position/normal/uv; `mergeGeometries` return value is asserted non-null.

Fit against the existing cabinets (`.18 × .28 × .16` at `x=±~.955, y=1.305,
z=-.45`, rounded-box radius `.02`): the flange outer radius is `.0685`, inside
the `.07` flat area of the front face; flange X span `±.0685` sits inside the
cabinet half-width `.09`; Y span `1.1965…1.4060` sits inside `1.165…1.445`.
Raycasting is disabled on all three meshes (`mesh.raycast = () => {}`), so no
functional anchor or hover target changes. `castShadow = false`,
`receiveShadow = true`.

## Construction notes and deliberate deviations

**Everything is proud of the cabinet, not recessed into it.** The cabinet is a
solid rounded box whose front face is at `z = -.37`. A driver cannot be sunk
into geometry that already exists, so the whole assembly is sculpted forward in
the permitted `-.368 … -.350` band. Each lathe closes with a short cylindrical
skirt running back to `z = -.368`, which leaves **2mm of clearance** to the
cabinet face — deliberate, so no surface is coincident, and the silhouette
still reads as a solid basket rather than a floating disc from oblique seated
angles. That 2mm gap is visible only from a grazing angle well below the seat.

**Woofer** (centre `y = 1.265`): satin-metal flange (outer `r .0685`, flat face
ring at `z = -.352`), black rubber half-roll surround (`r .060 → .0468`,
crowning forward to `z = -.3502`), matte graphite paper cone sloping back from
`r .0468, z = -.3562` to `r .014, z = -.3675`, and a forward-domed dust cap
returning to `z = -.3625` on axis. `r .060` is the surround seat, matching the
specified `.060` outer radius.

**Tweeter** (centre `y = 1.385`, outer `r .021`): shallow metal waveguide
curving from the rim back to `z = -.3625`, then a small forward dome peaking at
`z = -.3558`.

**Screws — deviation from "recessed".** Four low-poly spheres (`r .0022`) at
ring radius `.064`, at 45°/135°/225°/315°, centred at `z = -.3528`, i.e. `.0008`
*behind* the flange face so only a shallow cap protrudes. A `LatheGeometry`
flange is rotationally symmetric and cannot carry counterbores, and a screw
modelled behind an opaque ring would be invisible. This transverse intersection
is what reads as recessed. No threads. If Codex wants literal bores, the flange
must stop being a single lathe.

**Materials** (no textures, no transparency, no emissive, no lights):

| Name | Colour | Roughness | Metalness |
|---|---|---|---|
| Speaker satin metal | `#3a3d42` | .46 | .62 |
| Speaker surround rubber | `#17181a` | .74 | 0 |
| Speaker graphite paper | `#2a2c2f` | .93 | 0 |

**Layout change, intentional:** the woofer centre moves from the old disc's
`y = 1.3` to `y = 1.265` per the brief, and the tweeter takes the space above at
`y = 1.385`. The front is no longer vertically centred on the cabinet; that is
the specified two-way layout, not a regression.

## Verification status

Verified in Node with real three.js (no renderer):

- Module parses and executes; `createSpeakerDetails()` and `dispose()` both run
  clean.
- Triangle, material and mesh counts above are read from the merged index
  buffers, not estimated.
- Bounds above are computed from the merged geometries.
- Normal orientation measured on every distinct surface, sampled at real vertex
  depths. As (radial, z) where positive radial points away from the driver axis:
  woofer dust-cap apex `(0, +0.999)`; tweeter dome apex `(0, +0.985)`; flange
  flat ring `(+0.243, +0.970)`; surround crown `(0, +1.000)`; mid-cone at
  `r .030` `(-0.305, +0.952)`; inner lip `(-0.600, +0.800)`; skirt rear ring
  `(+1.000, -0.000)`; skirt front ring `(+0.988, +0.154)`. Every front surface
  faces the room and the skirt wall faces outward — no inverted lathe. The
  lateral components are vertex-normal averaging across adjacent profile
  segments, as expected on a smooth lathe.

**Not verified — Codex must check:**

- No render has happened. Nothing here is a visual acceptance claim.
- Appearance under the room's actual hemisphere + directional rig is unknown:
  whether the graphite/rubber/metal separation reads at seated distance, whether
  the metalness `.62` flange catches the moon rim too hard, and whether the
  shallow dish shows shading banding at 24 radial segments.
- Whether the 2mm cabinet gap is visible from the seated or overview camera.
- Whether 2784 triangles and 3 extra draws are acceptable against the current
  frame budget on the low-end path.
