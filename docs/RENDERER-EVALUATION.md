# Renderer evaluation: Spark 2.1.0 vs Three r186 native splats

2026-09-13. This is the bounded renderer decision for milestone 1 in
[`PLAN.md`](./PLAN.md). It covers the current installed APIs, the official
Three r186 implementation, the entrance deformation requirement, sorting,
formats, browser requirements, and expected migration cost. It does not change
application or package files.

## Recommendation

Keep Spark for the entrance prototype and do not migrate the portfolio renderer
at this gate.

Three r186 can render the current `.splat` asset, but its native
`GaussianSplat` is a new WebGPU renderer addon rather than a drop-in replacement
for the existing `WebGLRenderer` plus Spark path. More significantly, the
official r186 API documents no public per-splat deformation or buffer update
hook.
The constructor copies geometry into private storage buffers, and the exposed
sort API is camera/mesh-orientation driven. That is not enough to call the
planned animated room-to-screen warp maintainable or sorting-safe.

Spark's installed 2.1.0 API directly provides the missing shape of the work:
GPU `objectModifier`/`worldModifier` Dyno stages, a per-frame callback,
`SplatEdit`, covariance modifiers, and `SplatSkinning`. Spark's documented
sorting has a known one-frame-or-more lag, so it still needs visual and timing
measurement during the entrance prototype. Its public API is nevertheless the
better fit for this effect today.

The no-migration stop condition is: after one focused engineering day, if
native has not demonstrated the required animated deformation through a
maintainable public API, correct sorting while it moves, and a worthwhile
measured end-to-end benefit on the chosen reference device, stop the comparison
and continue with Spark. A source-level possibility or a private-field hack does
not pass this gate.

## What is verified

### Repository and installed versions

The lockfile and installed package metadata report:

| Item | Verified value |
| --- | --- |
| Branch / revision | `feat/v3` / `1751c77` at inspection time |
| `@sparkjsdev/spark` | `2.1.0` |
| `three` | `0.184.0` |
| Node | `v22.14.0` |
| Capture | `public/splats/dev-room.splat`, 8,655,712 bytes |
| Capture row count | 270,491 (`8,655,712 / 32`) |

The row count is a byte-level measurement. It is consistent with the official
r186 `SPLATLoader` fixed-width format, whose source declares a 32-byte row and
decodes center, scale, color, and quaternion fields. It does not independently
prove the provenance or visual quality of the downloaded capture.

The current scan creates a `THREE.WebGLRenderer` with `antialias: false`, then
passes it to `SparkRenderer`, creates `SplatMesh({ url, onProgress, onLoad })`,
and derives bounds through Spark's `forEachSplat` source. The Spark import is
inside `SplatStage.jsx`, preserving the static `/work` split.

The current installed module probe succeeded for Spark's named exports:
`SparkRenderer`, `SplatMesh`, `SplatSkinning`, `SplatEdit`, `SplatLoader`,
`PackedSplats`, `ExtSplats`, `SplatFileType`, and `dyno`. It also succeeded for
`three/webgpu` and its `WebGPURenderer` export. The installed Three 0.184 tree
does not contain the r186 native addons: importing
`three/addons/objects/GaussianSplat.js` and
`three/addons/loaders/SPZLoader.js` failed with `ERR_MODULE_NOT_FOUND`.

### Native backend and initialization requirements

The [official `GaussianSplat` documentation](https://threejs.org/docs/pages/GaussianSplat.html)
states that it can only be used with `WebGPURenderer`; its `forceWebGL` WebGL 2
backend is supported, while legacy `WebGLRenderer` is not. The
[r186 source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/GaussianSplat.js)
imports from `three/webgpu` and `three/tsl`, constructs a node material, and
uses `CountingSort`.

The [official `WebGPURenderer` documentation](https://threejs.org/docs/pages/WebGPURenderer.html)
confirms that WebGPU is attempted by default and WebGL 2 is the fallback. The
renderer API is asynchronous: the Three manual recommends `await renderer.init()`
when initialization must complete before the first render. A migration would
therefore change both the renderer type and the scan's startup/teardown
lifecycle; setting `forceWebGL: true` would still use Three's new WebGL 2 backend,
not restore the existing `WebGLRenderer` path.

### Format compatibility

The official r186 [SPLATLoader source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/SPLATLoader.js)
accepts standard fixed-width `.splat` files and returns `BufferGeometry` with
position, covariance, and RGBA attributes for `GaussianSplat`. The current
asset's byte length is divisible by 32, so it is a practical candidate for an
isolated native load test without transcoding.

r186 also includes official loaders for [PLY](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/GaussianSplatPLYLoader.js),
[SPZ](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/SPZLoader.js),
[KSPLAT](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/KSPLATLoader.js),
and the glTF [KHR Gaussian Splatting extension](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/GLTFGaussianSplatLoaderExtension.js).
The [native geometry helper](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/utils/GaussianSplatUtils.js)
expects float32 centers/covariances, byte RGBA colors, and packed SH bands when
present.

Spark's [loading documentation](https://sparkjs.dev/docs/loading-splats/)
supports `.ply`, `.spz`, `.splat`, and `.ksplat`, with additional `.sog`/ZIP and
`.rad` paths in the current 2.1 API. The installed `SplatFileType` enum contains
`PLY`, `SPZ`, `SPLAT`, `KSPLAT`, `PCSOGS`, `PCSOGSZIP`, and `RAD`. Format support
is therefore not the reason to migrate.

### Deformation hooks

Spark's official [SplatMesh documentation](https://sparkjs.dev/docs/splat-mesh/)
exposes the relevant public hooks:

- `onFrame({ mesh, time, deltaTime })` for per-frame updates;
- `objectModifiers` and `worldModifiers` for GPU Dyno changes to each `Gsplat`;
- covariance modifier variants when covariance splats are enabled;
- `SplatEdit` for SDF color/opacity/displacement edits;
- `SplatSkinning` for dual-quaternion or linear-blend skeletal animation;
- `ExtSplats` when float32 center precision is needed.

The [Spark system design](https://sparkjs.dev/docs/system-design/) explains that
these pipelines are synthesized to GLSL and run on the GPU. This makes Spark a
credible implementation surface for pulling centers toward a screen over a
1.5–2 second transition. The actual appearance, CPU/GPU cost, and sorting during
that motion remain unmeasured.

The r186 [GaussianSplat documentation](https://threejs.org/docs/pages/GaussianSplat.html)
lists only `autoSort`, bounds, raycast, `updateSort`, and
`updateSphericalHarmonics` as the relevant public surface. The source's
constructor copies input attributes into private storage buffers, and its sort
implementation reads a private position attribute and private sort state.
There is no documented `onFrame`, per-splat modifier, center setter, or public
buffer invalidation method.

This does not prove native animation is impossible. A custom TSL/material path,
a maintained fork, or private-field writes might make a prototype work. None is
a documented r186 application API, and each adds migration and maintenance risk;
the required behavior must therefore be demonstrated before it can qualify for
this project.

This is corroborated by the open official Three issue
[#34527](https://github.com/mrdoob/three.js/issues/34527), which specifically
requests a public buffer-update method because r186 copies geometry into private
storage and has no public way to change centers or colors after construction.
The issue describes writing private fields and clearing private sort state as a
workaround. That is evidence of an available experiment, not an acceptable
production API for this portfolio.

### Sorting behavior

Spark's [system design](https://sparkjs.dev/docs/system-design/) says it gathers
splats from the visible scene, computes viewpoint distances, performs a worker
bucket sort, and draws the aggregate in back-to-front order. It explicitly says
the order lags the render by at least one frame, and possibly more on older
devices. Spark also documents correct sorting across distinct `SplatMesh`
objects.

Native r186 uses a GPU `CountingSort` path and calls `updateSort` from
`onBeforeRender`. The official source's `_needsSort` test is based on the
camera/mesh model-view direction, and `updateSort` reads the internal position
attribute when it dispatches the sort. The public API does not define what
happens after arbitrary center data is rewritten, nor does it expose a supported
sort invalidation operation. A moving screen-warp therefore needs a native
prototype that checks ordering during deformation; source inspection alone
cannot certify it.

### Bounds, raycasting, and current app adaptation

Native r186 computes bounding boxes and spheres from the full splat extents and
provides raycasting. Spark exposes `getBoundingBox` plus `forEachSplat`; the
current app intentionally uses a percentile center sample to reject capture
floaters before framing. A native migration would need to adapt
`computeSplatBounds` to native geometry attributes and decide whether to keep the
current percentile behavior. This is routine migration work, but it is still
application code and a potential framing difference.

### Browser and route implications

Spark's official [overview](https://sparkjs.dev/docs/overview/) targets WebGL 2,
desktop, mobile, and WebXR, and advertises 98%+ WebGL 2 coverage. Three's native
documentation specifies a WebGPU-first renderer with WebGL 2 fallback, but no
equivalent coverage guarantee for `GaussianSplat`. Both native backends must be
tested on the reference hardware and on the fallback path before changing
`resolveSurface()`.

The repository deliberately routes software WebGL to `/work`, and the static
route must never request Three, Spark, or a capture. A native implementation can
remain dynamically loaded, but its `three/webgpu`/TSL imports and the async
renderer init must be kept inside the scan path. The native package change would
also require checking Vite's `manualChunks` output and the `/work` request
invariant.

## Expected migration impact

| Area | Spark today | Native r186 change |
| --- | --- | --- |
| Renderer | `WebGLRenderer` + `SparkRenderer` | `WebGPURenderer`; optional `forceWebGL` fallback; async `init()` |
| Imports | Core `three` plus dynamic Spark | `three/webgpu`, `three/tsl`, native addon and loader imports |
| Loading | `SplatMesh({ url, onProgress, onLoad })` | Loader returns geometry, then `new GaussianSplat(geometry)` |
| Entrance effect | Public Dyno modifiers and frame hooks are available | No documented per-splat deformation/update hook; center animation would require custom TSL/material work, a fork, or private fields |
| Sort | Aggregate Spark worker bucket sort; known one-frame-or-more lag | `CountingSort` in `GaussianSplat`; center mutation/invalidation semantics unverified |
| Bounds | Existing `forEachSplat`-based percentile framing | Rewrite around native geometry attributes or full extent bounds |
| Cleanup | Existing Spark/SplatMesh disposal path | Dispose native geometry/material/renderer and any loader-owned resources; validate async teardown |
| Static `/work` | Verified by existing harness design | Re-check request graph after introducing WebGPU/TSL chunks |
| Bundle size | Spark module file is 5,379,614 bytes on disk; Vite production result not measured here | Removing Spark does not prove a net saving; WebGPU/TSL/addon/loader chunks must be measured in a real production build |

The file sizes above are module-file measurements, not transfer sizes or
compressed production chunks. No bundle-size benefit is claimed.

## What was measured, and what was not

### Measured or source-verified

- Exact installed versions from `package-lock.json` and package metadata.
- Spark named exports and `SplatFileType` values by importing the installed
  module in Node.
- Three 0.184 `three/webgpu` export availability.
- Absence of r186 native addon files in installed Three 0.184 by import probe.
- Capture byte length and 32-byte row divisibility.
- Static source/type API surfaces described above.
- Installed Spark module file size.

### Not measured

- Native r186 rendering, because r186 is not installed and package files were
  intentionally left unchanged.
- Visual equivalence of the same capture and camera path.
- A native animated center deformation and its sort correctness.
- WebGPU versus WebGL2-backend frame cadence, CPU submission time, or GPU time.
- Cold load, first visible frame, decode time, or transfer bytes on reference
  hardware.
- Production bundle/request graph after a native import.
- Browser coverage beyond the documented capabilities.

My sandboxed `npm run build` attempt and headless Playwright launch both stopped
with Windows `spawn EPERM` before useful renderer measurements were produced.
The main agent separately verified the application build in its elevated
environment; that result does not constitute a native-versus-Spark benchmark.
The local failures are environment limitations, not renderer results. No
benchmark number is inferred from them.

## Focused follow-up, only if the gate is reopened

Use a temporary isolated prototype or branch with no application/package-file
changes in the main worktree. Use the same 270,491-row `.splat` file, camera,
canvas size, pixel ratio, and path. The minimum native test is:

1. Load through r186 `SPLATLoader`, create `GaussianSplat`, and render with
   `WebGPURenderer` on both WebGPU and `forceWebGL` WebGL 2 paths where the
   target browser supports them.
2. Implement the entrance center deformation through a public API. If no public
   API supports it, record native as blocked for this product effect rather than
   normalizing a private-field workaround.
3. Capture stills at rest, during deformation, and at arrival from at least
   three camera directions. Check for incorrect alpha ordering, holes, popping,
   and stale depth ordering.
4. Measure request bytes, decode/first-visible timing, p50/p95 rAF interval,
   CPU submission duration, and GPU duration only when a supported timer query
   is available. Label unavailable GPU timing as unavailable.
5. Verify disposal and that the `/work` request graph remains free of the scan
   renderer, native chunks, and capture.

Only a public, stable implementation that passes the behavior check and shows a
meaningful measured benefit should replace Spark. Otherwise the entrance should
be authored with Spark's Dyno pipeline, and native Three should be revisited
only when its update/invalidation surface matures.

## Official sources consulted

- [Three.js r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)
- [Three.js `GaussianSplat` docs](https://threejs.org/docs/pages/GaussianSplat.html)
- [Three.js r186 `GaussianSplat` source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/objects/GaussianSplat.js)
- [Three.js `WebGPURenderer` docs](https://threejs.org/docs/pages/WebGPURenderer.html)
- [Three.js r186 `SPLATLoader` source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/SPLATLoader.js)
- [Three.js r186 `GaussianSplatPLYLoader` source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/GaussianSplatPLYLoader.js)
- [Three.js r186 `SPZLoader` source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/SPZLoader.js)
- [Three.js r186 `KSPLATLoader` source](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/loaders/KSPLATLoader.js)
- [Three.js r186 Gaussian geometry utilities](https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/jsm/utils/GaussianSplatUtils.js)
- [Three.js issue #34527: public splat buffer update](https://github.com/mrdoob/three.js/issues/34527)
- [Spark overview](https://sparkjs.dev/docs/overview/)
- [Spark system design](https://sparkjs.dev/docs/system-design/)
- [Spark `SplatMesh` docs](https://sparkjs.dev/docs/splat-mesh/)
- [Spark loading docs](https://sparkjs.dev/docs/loading-splats/)
