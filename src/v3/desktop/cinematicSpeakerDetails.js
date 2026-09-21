import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SPEAKER } from './cinematicLayout.js';

// Nearfield driver fronts for the cinematic room's cabinets.
//
// Candidate module; the live `speakerDetails.js` is untouched and still used by
// the live builder. This is not a copy with new numbers: the live file bakes
// absolute world coordinates for .18 x .28 x .16 cabinets at (±.955, 1.305,
// -.45) into every profile, so at true scale none of them land or fit.
//
// The shapes are kept and re-expressed. A profile is (radius, depth-proud-of-
// the-front-face); both are multiplied by SPEAKER.scale, and the front face
// comes from the cabinet. That keeps the driver proportionate to its cabinet
// instead of a 137 mm flange sitting on a 110 mm box.
//
// The same constraint as the live file still holds: the cabinets are solid
// rounded boxes, so a driver cannot be sunk into them. Every surface here
// stands proud of the front face, and each lathe closes with a short skirt
// back toward it, leaving clearance so nothing is coincident while the
// silhouette still reads as a recessed basket from oblique seated angles.

const WOOFER_SEGMENTS = 24;
const TWEETER_SEGMENTS = 24;

// Source geometry, as authored in speakerDetails.js. Radii are absolute; the
// second column is converted from that file's absolute world z to a depth
// proud of its cabinet's front face (-0.37) so it can be re-placed here.
const SRC_FRONT = SPEAKER.sourceFrontZ;
const proud = (z) => z - SRC_FRONT;

const FLANGE_PROFILE = [
  [0.0685, proud(-0.3680)],
  [0.0685, proud(-0.3545)],
  [0.0660, proud(-0.3520)],
  [0.0620, proud(-0.3520)],
  [0.0600, proud(-0.3535)],
];
const SURROUND_PROFILE = [
  [0.0600, proud(-0.3535)],
  [0.0576, proud(-0.3512)],
  [0.0540, proud(-0.3502)],
  [0.0504, proud(-0.3512)],
  [0.0480, proud(-0.3538)],
  [0.0468, proud(-0.3562)],
];
const CONE_PROFILE = [
  [0.0468, proud(-0.3562)],
  [0.0400, proud(-0.3598)],
  [0.0300, proud(-0.3638)],
  [0.0200, proud(-0.3662)],
  [0.0150, proud(-0.3672)],
  [0.0140, proud(-0.3675)],
];
const DUST_CAP_PROFILE = [
  [0.0140, proud(-0.3675)],
  [0.0126, proud(-0.3645)],
  [0.0098, proud(-0.3633)],
  [0.0055, proud(-0.3627)],
  [0.0000, proud(-0.3625)],
];
const WAVEGUIDE_PROFILE = [
  [0.0210, proud(-0.3660)],
  [0.0210, proud(-0.3560)],
  [0.0198, proud(-0.3548)],
  [0.0150, proud(-0.3570)],
  [0.0100, proud(-0.3605)],
  [0.0070, proud(-0.3625)],
];
const TWEETER_DOME_PROFILE = [
  [0.0070, proud(-0.3625)],
  [0.0060, proud(-0.3585)],
  [0.0040, proud(-0.3565)],
  [0.0000, proud(-0.3558)],
];

const SCREW_RADIUS = 0.0022;
const SCREW_RING_RADIUS = 0.064;
const SCREW_PROUD = proud(-0.3528);
const SCREW_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

// Largest radius any profile reaches, before scaling. Exported so the review
// harness can check the driver fits its cabinet face rather than trusting it.
export const SOURCE_FLANGE_RADIUS = 0.0685;
export const FLANGE_RADIUS = SOURCE_FLANGE_RADIUS * SPEAKER.scale;
export const TWEETER_RADIUS = 0.0210 * SPEAKER.scale;

// LatheGeometry revolves around +Y; rotating +90° about X aims the local axis
// at +Z. Profile y carries the world z, so only x/y need translating.
function lathe(profile, segments, x, y) {
  const s = SPEAKER.scale;
  const geometry = new THREE.LatheGeometry(
    profile.map(([r, d]) => new THREE.Vector2(r * s, SPEAKER.frontZ + d * s)),
    segments,
  );
  geometry.rotateX(Math.PI / 2);
  geometry.translate(x, y, 0);
  return geometry;
}

function screws(x) {
  const s = SPEAKER.scale;
  return SCREW_ANGLES.map((angle) => {
    const geometry = new THREE.SphereGeometry(SCREW_RADIUS * s, 6, 4);
    geometry.translate(
      x + Math.cos(angle) * SCREW_RING_RADIUS * s,
      SPEAKER.wooferY + Math.sin(angle) * SCREW_RING_RADIUS * s,
      SPEAKER.frontZ + SCREW_PROUD * s,
    );
    return geometry;
  });
}

function combine(parts, material, name) {
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error(`cinematicSpeakerDetails: ${name} merge failed`);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.raycast = () => {};
  return mesh;
}

export function createCinematicSpeakerDetails() {
  const root = new THREE.Group();
  root.name = 'Speaker driver details';

  const metal = new THREE.MeshStandardMaterial({
    name: 'Speaker satin metal', color: '#3a3d42', roughness: 0.46, metalness: 0.62,
  });
  const rubber = new THREE.MeshStandardMaterial({
    name: 'Speaker surround rubber', color: '#17181a', roughness: 0.74, metalness: 0.0,
  });
  const paper = new THREE.MeshStandardMaterial({
    name: 'Speaker graphite paper', color: '#2a2c2f', roughness: 0.93, metalness: 0.0,
  });

  const metalParts = [], rubberParts = [], paperParts = [];
  for (const x of SPEAKER.x) {
    metalParts.push(lathe(FLANGE_PROFILE, WOOFER_SEGMENTS, x, SPEAKER.wooferY));
    metalParts.push(lathe(WAVEGUIDE_PROFILE, TWEETER_SEGMENTS, x, SPEAKER.tweeterY));
    metalParts.push(lathe(TWEETER_DOME_PROFILE, TWEETER_SEGMENTS, x, SPEAKER.tweeterY));
    metalParts.push(...screws(x));
    rubberParts.push(lathe(SURROUND_PROFILE, WOOFER_SEGMENTS, x, SPEAKER.wooferY));
    paperParts.push(lathe(CONE_PROFILE, WOOFER_SEGMENTS, x, SPEAKER.wooferY));
    paperParts.push(lathe(DUST_CAP_PROFILE, WOOFER_SEGMENTS, x, SPEAKER.wooferY));
  }

  const meshes = [
    combine(metalParts, metal, 'Speaker metalwork'),
    combine(rubberParts, rubber, 'Speaker surrounds'),
    combine(paperParts, paper, 'Speaker cones'),
  ];
  meshes.forEach((mesh) => root.add(mesh));

  return {
    root,
    dispose() {
      for (const mesh of meshes) mesh.geometry.dispose();
      for (const material of [metal, rubber, paper]) material.dispose();
      root.clear();
    },
  };
}
