// Renders the favicon set from art/icons/*.svg into public/. Run: node scripts/build-icons.mjs
// Small design (DK on rust) for 16/32/48, favicon.ico and favicon.svg. Large design (monitor) for the app icons.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const small = readFileSync(join(root, 'art/icons/favicon-small.svg'));
const large = readFileSync(join(root, 'art/icons/favicon-large.svg'));
const out = (f) => join(root, 'public', f);
const png = (svg, size) => sharp(svg, { density: 72 * Math.max(1, size / 64) * 2 }).resize(size, size).png().toBuffer();

writeFileSync(out('favicon.svg'), small);
const ico = [];
for (const s of [16, 32, 48]) {
  const b = await png(small, s);
  writeFileSync(out(`favicon-${s}.png`), b);
  ico.push([s, b]);
}
// ICO container with PNG-encoded entries.
const head = Buffer.alloc(6 + 16 * ico.length);
head.writeUInt16LE(1, 2); head.writeUInt16LE(ico.length, 4);
let off = head.length;
ico.forEach(([s, b], i) => {
  const o = 6 + 16 * i;
  head[o] = s; head[o + 1] = s; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(b.length, o + 8); head.writeUInt32LE(off, o + 12); off += b.length;
});
writeFileSync(out('favicon.ico'), Buffer.concat([head, ...ico.map(([, b]) => b)]));

// iOS rounds the corners itself, so the touch icon is full-bleed and opaque.
const flat = Buffer.from(large.toString().replace('rx="14"', 'rx="0"'));
writeFileSync(out('apple-touch-icon.png'), await sharp(await png(flat, 180)).flatten({ background: '#17160f' }).png().toBuffer());
writeFileSync(out('icon-192.png'), await png(large, 192));
writeFileSync(out('icon-512.png'), await png(large, 512));
console.log('icons written');
