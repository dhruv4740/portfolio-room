import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Nearfield driver fronts for the existing speaker cabinets.
//
// The cabinets are solid rounded boxes .18 x .28 x .16 centred at
// (±~.955, 1.305, -.45), so their flat front face sits at z = -.37 and its
// untapered area reaches r ≈ .07 from the cabinet centre. Every surface here
// lives in the 18mm band between z = -.368 and z = -.350, standing proud of
// that face: a driver cannot be sunk into geometry that is already solid, so
// the recess is sculpted forward instead. Each lathe closes with a short
// cylindrical skirt back to -.368, leaving 2mm of clearance to the cabinet so
// nothing is coincident while the silhouette still reads as a solid basket
// from oblique seated angles.
//
// World coordinates throughout — the returned root is meant to be added to the
// scene root untransformed.

const WOOFER_SEGMENTS = 24;
const TWEETER_SEGMENTS = 24;
const FRONT_X = [-0.96, 0.95];
const WOOFER_Y = 1.265;
const TWEETER_Y = 1.385;
const FLANGE_FACE_Z = -0.352;
const SKIRT_BACK_Z = -0.368;

// Profiles are (radius, z) pairs traversed from the outer rim inward along the
// surface. Order is uniform across every lathe so a single winding convention
// governs all of them.
const FLANGE_PROFILE = [
  [0.0685, SKIRT_BACK_Z],
  [0.0685, -0.3545],
  [0.0660, FLANGE_FACE_Z],
  [0.0620, FLANGE_FACE_Z],
  [0.0600, -0.3535],
];
const SURROUND_PROFILE = [
  [0.0600, -0.3535],
  [0.0576, -0.3512],
  [0.0540, -0.3502],
  [0.0504, -0.3512],
  [0.0480, -0.3538],
  [0.0468, -0.3562],
];
const CONE_PROFILE = [
  [0.0468, -0.3562],
  [0.0400, -0.3598],
  [0.0300, -0.3638],
  [0.0200, -0.3662],
  [0.0150, -0.3672],
  [0.0140, -0.3675],
];
const DUST_CAP_PROFILE = [
  [0.0140, -0.3675],
  [0.0126, -0.3645],
  [0.0098, -0.3633],
  [0.0055, -0.3627],
  [0.0000, -0.3625],
];
const WAVEGUIDE_PROFILE = [
  [0.0210, -0.3660],
  [0.0210, -0.3560],
  [0.0198, -0.3548],
  [0.0150, -0.3570],
  [0.0100, -0.3605],
  [0.0070, -0.3625],
];
const TWEETER_DOME_PROFILE = [
  [0.0070, -0.3625],
  [0.0060, -0.3585],
  [0.0040, -0.3565],
  [0.0000, -0.3558],
];

const SCREW_RADIUS = 0.0022;
const SCREW_RING_RADIUS = 0.064;
// Heads sit fractionally behind the flange face so only a shallow cap shows.
// A lathe cannot carry counterbores, so this transverse intersection is what
// reads as recessed; it is deliberately not a modelled bore.
const SCREW_Z = FLANGE_FACE_Z - 0.0008;
const SCREW_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

// LatheGeometry revolves around +Y; rotating +90° about X aims the local axis
// at +Z. Profile y carries the absolute world z, so only x/y need translating.
function lathe(profile, segments, x, y) {
  const geometry = new THREE.LatheGeometry(
    profile.map(([r, z]) => new THREE.Vector2(r, z)),
    segments,
  );
  geometry.rotateX(Math.PI / 2);
  geometry.translate(x, y, 0);
  return geometry;
}

function screws(x) {
  return SCREW_ANGLES.map((angle) => {
    const geometry = new THREE.SphereGeometry(SCREW_RADIUS, 6, 4);
    geometry.translate(
      x + Math.cos(angle) * SCREW_RING_RADIUS,
      WOOFER_Y + Math.sin(angle) * SCREW_RING_RADIUS,
      SCREW_Z,
    );
    return geometry;
  });
}

function combine(parts, material, name) {
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error(`speakerDetails: ${name} merge failed`);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.raycast = () => {};
  return mesh;
}

export function createSpeakerDetails() {
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
  for (const x of FRONT_X) {
    metalParts.push(lathe(FLANGE_PROFILE, WOOFER_SEGMENTS, x, WOOFER_Y));
    metalParts.push(lathe(WAVEGUIDE_PROFILE, TWEETER_SEGMENTS, x, TWEETER_Y));
    metalParts.push(lathe(TWEETER_DOME_PROFILE, TWEETER_SEGMENTS, x, TWEETER_Y));
    metalParts.push(...screws(x));
    rubberParts.push(lathe(SURROUND_PROFILE, WOOFER_SEGMENTS, x, WOOFER_Y));
    paperParts.push(lathe(CONE_PROFILE, WOOFER_SEGMENTS, x, WOOFER_Y));
    paperParts.push(lathe(DUST_CAP_PROFILE, WOOFER_SEGMENTS, x, WOOFER_Y));
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
