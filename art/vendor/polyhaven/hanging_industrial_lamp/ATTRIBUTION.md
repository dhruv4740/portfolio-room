# Hanging Industrial Lamp — source, license and attribution

| | |
|---|---|
| Asset | Hanging Industrial Lamp (`hanging_industrial_lamp`) |
| Source page | https://polyhaven.com/a/hanging_industrial_lamp |
| Author | Kuutti Siitonen |
| License | CC0 |
| Downloaded resolution | 4K FBX + PBR maps (owner download) |

Poly Haven licenses all assets CC0; see the note in
`../desk_lamp_arm_01/ATTRIBUTION.md`, which records that the site-wide license
page rather than per-asset API metadata is the source of that status.
Attribution is not required under CC0 and is recorded here anyway.

## Measured source

Measured in Blender 5.2.2 from the owner's download, by
`scripts/blender/probe_ceiling_lamps.py`:

- **9,530 loop triangles**, 4,931 polygon faces, 4,799 vertices, 1 mesh object.
- 2 materials: `hanging_industrial_lamp` (body) and `..._glass`.
- Bounds 0.550 × 0.550 × 1.355 m.

The candidate README in `art/candidates/ceiling-lamp/README.md` reported 4,931
as "triangles". That figure is the **polygon face** count. Both this repo's
measurement and Gemini's independent audit agree on 9,530 true triangles.

### Correction to the candidate README's descriptions

That README describes this asset as an "enamelled warehouse dome pendant" and
the other candidate (`caged_hanging_light`) as an "industrial exposed filament
bulb inside an iron cage". Rendered elevations
(`scripts/shots/fixture-*.png`, from `scripts/blender/preview_ceiling_lamps.py`)
show otherwise:

- `hanging_industrial_lamp` is a **conical caged pendant** on a chain with a
  side flex — it is the one that resembles a caged bulb fixture.
- `caged_hanging_light` is a **1.16 m linear caged batten** (a vapour-tight
  strip light) on two chains, not a bulb in a cage at all.

This asset was chosen on that corrected basis: it replaces a bare bulb on a
cord, which the batten could not.

## Modifications in the derived runtime file

`export/ceiling-fixture.glb`, produced by
`scripts/blender/prepare_ceiling_fixture.py`:

1. **Chain trimmed.** The source hangs 1.355 m, most of it chain and flex. The
   room's ceiling rose is only ~0.9 m above where the fixture should sit, so
   geometry above source Z = -0.45 is deleted. Result hangs **0.889 m**, at
   **7,990 triangles**.
2. Origin moved to the top of the remaining chain, so the room hangs it
   directly off the existing ceiling rose with no floating gap.
3. 4K maps resized to **1024 × 1024** and exported as JPEG. PNG export produced
   a 13.6 MB file; JPEG at quality 82 gives **803,352 bytes**. Roughness and
   metalness are packed into one texture by the glTF exporter, so the fixture
   costs four images rather than six.
4. Glass material kept as a constant-alpha blend (0.35) with its normal map;
   the source ships no colour or roughness map for the glass.

## Runtime behaviour

`src/v3/desktop/authoredCeilingFixture.js` hangs it at `[-0.65, 3.0975, 0.5]`,
putting its underside at about y = 2.21. The procedural cord, socket and
emissive bulb sphere remain as the load fallback, grouped out of static
batching so they can be hidden on success.

`castShadow` is **off** for this fixture: architectural shadows are static and
already baked, and a new caster would have had to go into that cached map.
No new dynamic light is added — the arrival power stutter drives the fixture's
emissive intensity through the existing `setEntryPower`, exactly as it drove
the procedural bulb's.

## Not verified

The power stutter's effect on this fixture is **not asserted by any test**.
`scripts/verify-ceiling-fixture.mjs` confirms it loads, renders and lights the
ceiling band, but the arrival completes before the room bake resolves and the
replay control is not reachable from that harness.
