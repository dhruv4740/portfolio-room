// Downloads the Poly Haven desk_lamp_arm_01 native Blender source and the glTF
// 1K variant, following manifest URLs only. Verifies the manifest MD5 for every
// file and records SHA-256. Run from the repo root:
//   node art/vendor/polyhaven/desk_lamp_arm_01/tools/fetch.mjs
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = 'art/vendor/polyhaven/desk_lamp_arm_01';
const MANIFEST = 'art/after-hours/lamp-download-manifest.json';

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const plan = [];
const add = (entry, dest) => plan.push({ dest, url: entry.url, md5: entry.md5, size: entry.size });

const blend = manifest.blend['1k'].blend;
add(blend, `${ROOT}/source/blend/desk_lamp_arm_01_1k.blend`);
for (const [rel, file] of Object.entries(blend.include)) add(file, `${ROOT}/source/blend/${rel}`);

const gltf = manifest.gltf['1k'].gltf;
add(gltf, `${ROOT}/source/gltf/desk_lamp_arm_01_1k.gltf`);
for (const [rel, file] of Object.entries(gltf.include)) add(file, `${ROOT}/source/gltf/${rel}`);

const records = [];
for (const item of plan) {
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${item.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const md5 = createHash('md5').update(bytes).digest('hex');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const md5Match = md5 === item.md5;
  const sizeMatch = bytes.length === item.size;
  await mkdir(dirname(item.dest), { recursive: true });
  await writeFile(item.dest, bytes);
  records.push({ path: item.dest, url: item.url, bytes: bytes.length, expectedBytes: item.size, sizeMatch, md5, expectedMd5: item.md5, md5Match, sha256 });
  console.log(`${md5Match && sizeMatch ? 'OK  ' : 'FAIL'} ${item.dest} ${bytes.length}B`);
}

await writeFile(join(ROOT, 'CHECKSUMS.json'), `${JSON.stringify({
  source: 'https://polyhaven.com/a/desk_lamp_arm_01',
  api: 'https://api.polyhaven.com/files/desk_lamp_arm_01',
  manifest: MANIFEST,
  fetched: new Date().toISOString(),
  files: records,
}, null, 2)}\n`);

const bad = records.filter((r) => !r.md5Match || !r.sizeMatch);
console.log(bad.length ? `MISMATCHES: ${bad.length}` : `All ${records.length} files verified against manifest MD5 and size.`);
