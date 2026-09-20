// Transfer the BAMEN genuine bare arms surface into the existing seatedHands rig.
// Bone-local frames align and straighten fingers and forearms to the bind pose.
// UVs, skin weights, and 100% biological bare skin textures survive.
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { seatedHands } from '../src/v3/desktop/seatedHands.js';

const source = JSON.parse(await readFile('art/after-hours/authored-hands/source-skin.json', 'utf8'));
const rig = seatedHands();
const vec = a => new THREE.Vector3(...a);

function frame(origin, z, y) {
  z = z.clone().normalize();
  y = y.clone().addScaledVector(z, -y.dot(z)).normalize();
  return new THREE.Matrix4().makeBasis(y.clone().cross(z).normalize(), y, z).setPosition(origin);
}

const chunks = [], stats = [];
function header(values) {
  const b = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => b.writeUInt32LE(v, i * 4));
  chunks.push(b);
}

function serialize(g) {
  const n = g.attributes.position.count;
  const index = g.index?.array || Uint32Array.from({ length: n }, (_, i) => i);
  header([n, index.length, g.attributes.uv ? 1 : 0]);
  for (const key of ['position', 'normal', 'skinIndex', 'skinWeight', ...(g.attributes.uv ? ['uv'] : [])]) {
    const a = g.attributes[key].array;
    chunks.push(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
  }
  chunks.push(Buffer.from(Uint32Array.from(index).buffer));
}

header([0x48414e44, 1]);

// BAMEN finger numbering: 1=Pinky, 2=Ring, 3=Middle, 4=Index, 5=Thumb
const fingerMap = [4, 3, 2, 1]; // index, middle, ring, pinky

for (const [h, suffix] of [[rig.left, 'L'], [rig.right, 'R']]) {
  const bones = h.skeleton.boneInverses.map(m => m.clone().invert());
  const sb = name => source.bones[name];

  const wrist = vec(sb('Hand.' + suffix).head);
  const knuckle_mid = vec(sb('Finger_3.1.' + suffix).tail);
  const knuckle_idx = vec(sb('Finger_4.1.' + suffix).tail);
  const knuckle_pky = vec(sb('Finger_1.1.' + suffix).tail);

  // Local hand frame
  const srcZ = wrist.clone().sub(knuckle_mid).normalize();
  const across = knuckle_idx.clone().sub(knuckle_pky).normalize();
  // Dorsal points +Z in BAMEN geometry for both hands
  const srcY = (h.side === -1
    ? srcZ.clone().cross(across)
    : across.clone().cross(srcZ)).normalize();

  const palmFrame = frame(wrist, srcZ, srcY);
  const palmTarget = bones[0].clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.001, 0.050));
  const width = knuckle_idx.distanceTo(knuckle_pky);
  const radial = 0.066 / width;
  const palmScale = new THREE.Matrix4().makeScale(radial, radial, 0.123 / wrist.distanceTo(knuckle_mid));
  const palmTransfer = palmTarget.clone().multiply(palmScale).multiply(palmFrame.clone().invert());

  const transfer = new Map();
  // Hand palm & metacarpals
  transfer.set('Hand.' + suffix, { index: 0, matrix: palmTransfer });
  for (let f = 1; f <= 4; f++) {
    transfer.set('Finger_' + f + '.1.' + suffix, { index: 0, matrix: palmTransfer });
  }

  // Forearm & Upper Arm / Elbow
  const forearmAxis=vec(sb('Forearm.'+suffix).head).sub(wrist).normalize();
  const forearmFrame = frame(wrist, forearmAxis, srcY);
  const forearmTarget = bones[1].clone().multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  const forearmScale = new THREE.Matrix4().makeScale(radial / 1.15, radial / 0.72, 1 / 0.3112);
  const forearmTransfer = forearmTarget.multiply(forearmScale).multiply(forearmFrame.invert());
  transfer.set('Forearm.' + suffix, { index: 1, matrix: forearmTransfer });
  transfer.set('Shoulder_2.' + suffix, { index: 1, matrix: forearmTransfer });

  // Fingers 0..3: Index (4), Middle (3), Ring (2), Pinky (1)
  for (let f = 0; f < 4; f++) {
    const bamenF = fingerMap[f];
    const lengths = h.digits[f].userData.L;
    for (let j = 0; j < 3; j++) {
      const bname = 'Finger_' + bamenF + '.' + (j + 2) + '.' + suffix;
      const b = sb(bname);
      const head = vec(b.head), tail = vec(b.tail);
      const z = head.clone().sub(tail);
      const sourceFrame = frame(head, z, srcY);
      const index = 2 + f * 3 + j;
      const scale = new THREE.Matrix4().makeScale(radial, radial, lengths[j] / head.distanceTo(tail));
      transfer.set(bname, { index, matrix: bones[index].clone().multiply(scale).multiply(sourceFrame.invert()) });
    }
  }

  // Finger 4: Thumb (5)
  const thumbLengths = h.thumb.userData.L;
  for (let j = 0; j < 3; j++) {
    const bname = 'Finger_5.' + (j + 1) + '.' + suffix;
    const b = sb(bname);
    const head = vec(b.head), tail = vec(b.tail);
    const z = head.clone().sub(tail);
    const sourceFrame = frame(head, z, srcY);
    const index = 14 + j;
    const scale = new THREE.Matrix4().makeScale(radial, radial, thumbLengths[j] / head.distanceTo(tail));
    transfer.set(bname, { index, matrix: bones[index].clone().multiply(scale).multiply(sourceFrame.invert()) });
  }

  // Transform Vertices
  const converted = source.vertices.map(v => {
    const p = vec(v.p);
    const weights = v.weights.filter(([name]) => transfer.has(name));
    if (weights.length === 0) return null;
    const total = weights.reduce((s, [, w]) => s + w, 0);
    if (total < 0.001) return null;

    // End inside the overlapping rolled sleeve, not on its visible edge.
    if (p.clone().sub(wrist).dot(forearmAxis) > 0.065) return null;

    const out = new THREE.Vector3(), merged = new Map();
    for (const [name, w] of weights) {
      const t = transfer.get(name);
      out.addScaledVector(p.clone().applyMatrix4(t.matrix), w / total);
      merged.set(t.index, (merged.get(t.index) || 0) + w / total);
    }
    const top = [...merged].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = top.reduce((s, [, w]) => s + w, 0);
    return { p: out, top: top.map(([i, w]) => [i, w / sum]) };
  });

  const positions = [], uvs = [], indices = [], skinWeights = [];
  for (const tri of source.triangles) {
    if (tri.some(c => !converted[c.v])) continue;
    for (const c of tri) {
      const v = converted[c.v];
      positions.push(...v.p);
      uvs.push(...c.uv);
      for (let lane = 0; lane < 4; lane++) {
        indices.push(v.top[lane]?.[0] || 0);
        skinWeights.push(v.top[lane]?.[1] || 0);
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  // Average shared vertex normals across UV seams
  g.computeVertexNormals();
  const normals = g.attributes.normal, smooth = new Map();
  const key = i => positions.slice(i * 3, i * 3 + 3).map(val => Math.round(val * 1e6)).join(',');
  for (let i = 0; i < normals.count; i++) {
    const k = key(i);
    if (!smooth.has(k)) smooth.set(k, new THREE.Vector3());
    smooth.get(k).add(new THREE.Vector3().fromBufferAttribute(normals, i));
  }
  for (let i = 0; i < normals.count; i++) {
    const n = smooth.get(key(i)).normalize();
    normals.setXYZ(i, n.x, n.y, n.z);
  }

  const indexed=mergeVertices(g,1e-6);serialize(indexed);indexed.dispose();g.dispose();
  serialize(h.clothMesh.geometry); // Dummy/fallback slot to preserve 4-mesh binary schema
  stats.push({ side: suffix, triangles: positions.length / 9, radialScale: radial });
}

const output = Buffer.concat(chunks);
await writeFile('public/models/hands-authored.bin', output);
await writeFile('public/models/hands-authored.bin.gz', gzipSync(output, { level: 9 }));
console.log(JSON.stringify({ stats, bytes: output.length, gzip: gzipSync(output).length }));
