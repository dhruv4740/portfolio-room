import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'out');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'index.css', 'mock-electron.js', 'renderer.js']) {
  cpSync(join(root, 'src', file), join(out, file));
}
cpSync(join(root, 'config', 'icon.png'), join(out, 'icon.png'));
