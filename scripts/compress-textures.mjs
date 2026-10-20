// Re-encodes the room's JPEG textures in place with mozjpeg (same names and
// dimensions, so no code changes). Normal maps keep higher quality.
// The resume page is also downsized; it is read at desk distance.
import sharp from 'sharp';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.jpe?g$/i.test(f) && files.push(p); } })('public/materials/after-hours');
let before = 0, after = 0;
for (const f of files) {
  const src = readFileSync(f);
  let img = sharp(src);
  const out = await img.jpeg({ quality: /_nor_/.test(f) ? 90 : 82, mozjpeg: true }).toBuffer();
  before += src.length;
  if (out.length < src.length * 0.95) { writeFileSync(f, out); after += out.length; } else after += src.length;
}
console.log(`${files.length} files: ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB`);
