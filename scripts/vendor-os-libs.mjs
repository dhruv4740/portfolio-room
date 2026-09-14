import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const vendorDir = resolve(root, 'public/os/vendor');
if (!existsSync(vendorDir)) {
  mkdirSync(vendorDir, { recursive: true });
}

// 1. Copy three.module.js and three.core.js (if it exists)
const threeBuildDir = resolve(root, 'node_modules/three/build');
copyFileSync(resolve(threeBuildDir, 'three.module.js'), resolve(vendorDir, 'three.module.js'));
console.log('copied three.module.js');

const threeCoreSrc = resolve(threeBuildDir, 'three.core.js');
if (existsSync(threeCoreSrc)) {
  copyFileSync(threeCoreSrc, resolve(vendorDir, 'three.core.js'));
  console.log('copied three.core.js');
}

// 2. three-addons: copy any imported examples/jsm files and rewrite bare 'three' imports
// None of our 4 ports import from three/examples/jsm/, but if addons are specified here:
const addonImports = [
  // List relative paths under three/examples/jsm/ if needed
];

for (const addon of addonImports) {
  const srcPath = resolve(root, 'node_modules/three/examples/jsm', addon);
  const destPath = resolve(vendorDir, 'three-addons', addon);
  const destDir = dirname(destPath);
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  let content = readFileSync(srcPath, 'utf8');
  // Rewrite bare 'three' import to relative path to three.module.js
  // Depth depends on addon relative path
  const depth = addon.split(/[\\/]/).length;
  const relThree = '../'.repeat(depth) + 'three.module.js';
  content = content.replace(/from\s+['"]three['"]/g, `from '${relThree}'`);
  writeFileSync(destPath, content, 'utf8');
  console.log(`copied addon ${addon} -> ${relThree}`);
}

// 3. GSAP
const gsapDistDir = resolve(root, 'node_modules/gsap/dist');
copyFileSync(resolve(gsapDistDir, 'gsap.min.js'), resolve(vendorDir, 'gsap.min.js'));
console.log('copied gsap.min.js');

copyFileSync(resolve(gsapDistDir, 'ScrollTrigger.min.js'), resolve(vendorDir, 'ScrollTrigger.min.js'));
console.log('copied ScrollTrigger.min.js');

console.log('[vendor-os-libs] done');
