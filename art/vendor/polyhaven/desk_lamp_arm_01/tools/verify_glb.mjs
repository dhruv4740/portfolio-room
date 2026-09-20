// Parses the exported GLB container directly (header + JSON chunk + BIN chunk)
// and checks bounds, scale, node/material/texture presence and dependency
// completeness. No renderer, no three.js.
//   node tools/verify_glb.mjs export/desk_lamp_arm_01.glb
import { readFileSync } from 'node:fs';

// Cross-checked against the Blender-side evaluated measurements so the two
// independent passes must agree, rather than against a number typed by hand.
const src = JSON.parse(readFileSync(new URL('./export-report.json', import.meta.url), 'utf8'));
const EXPECT_TRIS = src.rerooted_evaluated_bounds.eval_tris;
const EXACT = src.rerooted_evaluated_bounds;   // Blender Z-up, vertex-exact

const path = process.argv[2];
const buf = readFileSync(path);

const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) throw new Error('not a GLB (bad magic)');
const version = buf.readUInt32LE(4);
const total = buf.readUInt32LE(8);
let off = 12, json = null, binLength = 0;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  const body = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(body.toString('utf8'));
  if (type === 0x004e4942) binLength = len;
  off += 8 + len + ((4 - (len % 4)) % 4) * 0;
  off += (4 - (off % 4)) % 4;
}
const g = json;
const fail = [];
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fail.push(msg); };

console.log(`container: version ${version}, declared ${total}B, actual ${buf.length}B, BIN chunk ${binLength}B`);
check(version === 2, 'glTF version is 2');
check(total === buf.length, 'declared length matches file size');
console.log(`generator: ${g.asset.generator}  copyright: ${g.asset.copyright ?? '(none)'}`);

// --- nodes / meshes ---
console.log(`nodes ${g.nodes.length}, meshes ${g.meshes.length}, materials ${g.materials.length}, images ${(g.images||[]).length}, textures ${(g.textures||[]).length}, samplers ${(g.samplers||[]).length}`);
check(!g.cameras, 'no cameras exported');
check(!g.extensions?.KHR_lights_punctual, 'no punctual lights exported');
check(!g.skins, 'no skins exported');
check(!g.animations, 'no animations exported');
check(g.meshes.length >= 27, `${g.meshes.length} meshes (expect 27 separate parts, not one baked mesh)`);

// --- triangles ---
let tris = 0;
const primModes = new Set();
for (const m of g.meshes) for (const p of m.primitives) {
  primModes.add(p.mode ?? 4);
  const count = p.indices != null ? g.accessors[p.indices].count : g.accessors[p.attributes.POSITION].count;
  tris += count / 3;
}
console.log(`triangles: ${tris}`);
check(primModes.size === 1 && primModes.has(4), 'all primitives are TRIANGLES');
check(Math.abs(tris - EXPECT_TRIS) < 1, `triangle count ${tris} matches Blender's evaluated count (${EXPECT_TRIS}) — Array/Curve wire modifiers and the posed armature were applied`);
check(tris > 25000, `${tris} triangles is the full model, not the 23070-triangle unevaluated stub`);

// --- world bounds, honouring node transforms ---
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const ident = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
function local(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const r = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    tx, ty, tz, 1];
  for (let i = 0; i < 3; i++) { r[i] *= sx; r[4 + i] *= sy; r[8 + i] *= sz; }
  return r;
}
const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
const missingMinMax = [];
function walk(idx, parent) {
  const n = g.nodes[idx];
  const m = mul(parent, local(n));
  if (n.mesh != null) for (const p of g.meshes[n.mesh].primitives) {
    const a = g.accessors[p.attributes.POSITION];
    if (!a.min || !a.max) { missingMinMax.push(n.name); continue; }
    for (let i = 0; i < 8; i++) {
      const v = [i & 1 ? a.max[0] : a.min[0], i & 2 ? a.max[1] : a.min[1], i & 4 ? a.max[2] : a.min[2]];
      for (let r = 0; r < 3; r++) {
        const w = m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r];
        mn[r] = Math.min(mn[r], w); mx[r] = Math.max(mx[r], w);
      }
    }
  }
  for (const c of n.children ?? []) walk(c, m);
}
for (const r of g.scenes[g.scene ?? 0].nodes) walk(r, ident);
const size = mx.map((v, i) => v - mn[i]);
console.log(`bounds min [${mn.map(v => v.toFixed(5))}]  max [${mx.map(v => v.toFixed(5))}]`);
console.log(`size      [${size.map(v => v.toFixed(5))}] metres`);
check(missingMinMax.length === 0, 'every POSITION accessor carries min/max');
check(mn.concat(mx).every(Number.isFinite), 'bounds are finite');
// These bounds are the union of each primitive's local AABB pushed through its
// node matrix, so for rotated nodes they over-estimate. The vertex-exact extent
// comes from Blender; assert the two agree where they must.
const exactYup = {
  min: [EXACT.min[0], EXACT.min[2], -EXACT.max[1]],
  max: [EXACT.max[0], EXACT.max[2], -EXACT.min[1]],
};
console.log(`vertex-exact (Blender) min [${exactYup.min.map(v => v.toFixed(5))}]  max [${exactYup.max.map(v => v.toFixed(5))}]`);
console.log(`vertex-exact size [${exactYup.max.map((v, i) => (v - exactYup.min[i]).toFixed(5))}] metres`);
check(size[1] > 0.7 && size[1] < 0.95, `height ${size[1].toFixed(4)} m is a plausible desk lamp (metre scale, Y up)`);
check(mn.every((v, i) => v <= exactYup.min[i] + 1e-4) && mx.every((v, i) => v >= exactYup.max[i] - 1e-4),
  'accessor bounds enclose the vertex-exact extent (consistent, AABB over-estimate only)');
check(Math.abs(mn[1] - exactYup.min[1]) < 1e-4,
  `lowest point ${mn[1].toFixed(5)} m matches Blender exactly — the clamp hangs below the desk plane by design`);
check(mn[1] < 0 && mx[1] > 0, 'Y = 0 is the desk-contact plane, inside the model (clamp below, lamp above)');
const em = src.emitter_delivered;
console.log(`emitter: centroid (glTF Y-up) [${em.centroid_gltf_yup}]  aim [${em.aim_gltf_yup}]`);
check(em.aim_gltf_yup[1] < -0.99, `emitter aims straight down (Y component ${em.aim_gltf_yup[1]})`);
check(src.contact_after_reroot.every(v => Math.abs(v) < 1e-5),
  `clamp desk-contact pad centre is on the origin (residual ${JSON.stringify(src.contact_after_reroot)})`);

// --- materials / textures ---
for (const [i, m] of g.materials.entries()) {
  const p = m.pbrMetallicRoughness ?? {};
  console.log(`material[${i}] ${m.name}`);
  console.log(`   baseColorTexture=${p.baseColorTexture?.index ?? '-'} metallicRoughnessTexture=${p.metallicRoughnessTexture?.index ?? '-'} normalTexture=${m.normalTexture?.index ?? '-'} occlusionTexture=${m.occlusionTexture?.index ?? '-'} emissiveTexture=${m.emissiveTexture?.index ?? '-'}`);
  console.log(`   baseColorFactor=${JSON.stringify(p.baseColorFactor ?? null)} metallicFactor=${p.metallicFactor ?? 1} roughnessFactor=${p.roughnessFactor ?? 1} emissiveFactor=${JSON.stringify(m.emissiveFactor ?? [0,0,0])} alphaMode=${m.alphaMode ?? 'OPAQUE'} doubleSided=${!!m.doubleSided}`);
  if (m.extensions) console.log(`   extensions: ${Object.keys(m.extensions).join(', ')}`);
}
check(g.materials.length === 2, `${g.materials.length} materials (source has 2)`);

let imageBytes = 0;
for (const [i, im] of (g.images ?? []).entries()) {
  if (im.uri) { fail.push(`image[${i}] is an external URI: ${im.uri}`); console.log(`FAIL  image[${i}] external URI ${im.uri}`); continue; }
  const bv = g.bufferViews[im.bufferView];
  imageBytes += bv.byteLength;
  console.log(`image[${i}] ${im.name ?? ''} ${im.mimeType} ${bv.byteLength}B embedded`);
}
check((g.images ?? []).every(im => im.bufferView != null), 'all images are embedded in the GLB (no external dependencies)');
check((g.buffers ?? []).every(b => b.uri == null), 'the buffer is embedded (no external .bin)');
console.log(`embedded image bytes: ${imageBytes} (${(imageBytes / 1048576).toFixed(2)} MiB of ${(buf.length / 1048576).toFixed(2)} MiB)`);
check(buf.length < 4 * 1048576, `file is ${(buf.length / 1048576).toFixed(2)} MiB, under the 4 MiB target`);

// --- named nodes ---
const named = g.nodes.filter(n => n.name).map(n => n.name);
console.log(`named nodes (${named.length}): ${named.join(', ')}`);
check(named.some(n => /head/i.test(n)) && named.some(n => /arm/i.test(n)) && named.some(n => /pivot-holder/i.test(n)),
  'head, arm and clamp parts are individually named and addressable');

console.log(fail.length ? `\n${fail.length} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(fail.length ? 1 : 0);
