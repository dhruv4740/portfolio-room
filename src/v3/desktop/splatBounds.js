// ============================================================================
// Bounds + framing for an arbitrary splat capture.
//
// Why this exists: hardcoding camera coordinates for a capture is a trap. Every
// scan comes out of training at a different scale, origin and orientation, so
// a hand-tuned camera silently frames empty space the moment the capture is
// re-trained or replaced. Deriving the framing from the data means the stage
// works with the dev placeholder AND the real room capture with no edits.
// ============================================================================

import * as THREE from 'three';

/**
 * Bounds of a splat cloud, robust to floaters.
 *
 * Gaussian splat captures always contain sparse garbage far outside the real
 * subject — reconstruction noise behind the camera, sky blobs, drifting
 * outliers. A raw min/max box is therefore useless: a single floater 50m away
 * inflates the box and pushes the camera into orbit. So take a percentile
 * range per axis instead, which throws those away.
 *
 * @param {object} splat  Spark SplatMesh
 * @param {object} opts
 * @returns {{box: THREE.Box3, center: THREE.Vector3, size: THREE.Vector3, radius: number, count: number} | null}
 */
export function computeSplatBounds(splat, opts = {}) {
  const { percentile = 0.02, maxSamples = 120_000, minOpacity = 0.12 } = opts;
  // Splat centres come out of the source in the mesh's LOCAL frame. The stage
  // rotates the mesh 180° about X to stand the capture upright, so local
  // bounds would frame the camera at a mirrored Y — the subject ends up
  // half out of shot. Bake the world matrix in before using these numbers.
  splat?.updateMatrixWorld?.(true);

  const source = splat?.splats ?? splat?.packedSplats;
  if (!source?.forEachSplat) return null;

  const total =
    source.getNumSplats?.() ?? splat?.numSplats ?? 0;
  if (!total) return null;

  // Sample rather than read every splat: a million-point capture would cost
  // more than a frame budget, and bounds do not need that precision.
  const step = Math.max(1, Math.floor(total / maxSamples));

  const xs = [];
  const ys = [];
  const zs = [];

  try {
    source.forEachSplat((index, center, _scales, _quat, opacity) => {
      if (index % step !== 0) return;
      // Near-transparent splats are usually reconstruction haze, not subject.
      if (typeof opacity === 'number' && opacity < minOpacity) return;
      xs.push(center.x);
      ys.push(center.y);
      zs.push(center.z);
    });
  } catch {
    return null;
  }

  if (xs.length < 8) return null;

  const range = (arr) => {
    arr.sort((a, b) => a - b);
    const lo = arr[Math.floor(arr.length * percentile)];
    const hi = arr[Math.min(arr.length - 1, Math.ceil(arr.length * (1 - percentile)))];
    return [lo, hi];
  };

  const [x0, x1] = range(xs);
  const [y0, y1] = range(ys);
  const [z0, z1] = range(zs);

  const box = new THREE.Box3(
    new THREE.Vector3(x0, y0, z0),
    new THREE.Vector3(x1, y1, z1),
  );
  if (splat.matrixWorld) box.applyMatrix4(splat.matrixWorld);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  return { box, center, size, radius: size.length() * 0.5, count: total };
}

/**
 * A wide establishing shot that fits the capture in frame.
 * @param {{center: THREE.Vector3, radius: number}} bounds
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} margin  >1 pulls back further. Kept close to 1 on purpose:
 *   a hero shot wants the capture filling the frame, not floating in dead space.
 */
export function frameBounds(bounds, camera, margin = 1.12) {
  const fov = THREE.MathUtils.degToRad(camera.fov);
  // Distance at which a sphere of `radius` fills the vertical FOV.
  let dist = (bounds.radius / Math.sin(fov * 0.5)) * margin;

  // Account for narrow windows, where horizontal FOV is the binding constraint.
  const hFov = 2 * Math.atan(Math.tan(fov * 0.5) * camera.aspect);
  const hDist = (bounds.radius / Math.sin(hFov * 0.5)) * margin;
  dist = Math.max(dist, hDist);

  const c = bounds.center;
  return {
    // Three-quarter view, slightly above: reads as a considered shot rather
    // than a straight-on elevation.
    position: [
      c.x + dist * 0.55,
      c.y + dist * 0.32,
      c.z + dist * 0.75,
    ],
    target: [c.x, c.y, c.z],
    distance: dist,
  };
}

/**
 * Resolve a content anchor's normalised coordinates into world space.
 *
 * Anchors are authored as `at: [nx, ny, nz]` in 0..1 within the capture's
 * bounding box, so the content file never has to know the capture's units.
 * When the real room scan lands, only these three numbers per anchor need
 * nudging — no camera maths, no rebuild of the stage.
 */
export function resolveAnchor(anchor, bounds, camera) {
  const { box, size, radius } = bounds;
  const [nx, ny, nz] = anchor.at ?? [0.5, 0.5, 0.5];

  const pos = [
    box.min.x + size.x * nx,
    box.min.y + size.y * ny,
    box.min.z + size.z * nz,
  ];

  // Park the camera off the anchor along the capture's dominant viewing axis,
  // at a fraction of the overall radius so close-ups scale with the capture.
  const dolly = anchor.dolly ?? 0.55;
  const d = radius * dolly;

  return {
    ...anchor,
    position: pos,
    view: {
      position: [pos[0] + d * 0.45, pos[1] + d * 0.35, pos[2] + d * 0.95],
      target: pos,
    },
  };
}
