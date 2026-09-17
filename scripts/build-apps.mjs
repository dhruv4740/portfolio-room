// Builds each real project UI under apps/<name>/ and copies its static output
// into public/apps/<name>/ (committed). Run after changing an app; the portfolio
// build itself never needs the apps' toolchains.
//   node scripts/build-apps.mjs            # all apps
//   node scripts/build-apps.mjs darksentinel
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
for (const name of readdirSync(join(root, 'apps'))) {
  if (only.length && !only.includes(name)) continue;
  const dir = join(root, 'apps', name), pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  // package.json "portfolio": { "outDir": "out", "command": "npm run build" } overrides the defaults.
  const { outDir = 'out', command = 'npm run build' } = pkg.portfolio || {};
  if (!existsSync(join(dir, 'node_modules'))) execSync('npm install --no-audit --no-fund', { cwd: dir, stdio: 'inherit' });
  execSync(command, { cwd: dir, stdio: 'inherit' });
  const dest = join(root, 'public', 'apps', name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(dir, outDir), dest, { recursive: true });
  console.log(`[build-apps] ${name} -> public/apps/${name}`);
}
