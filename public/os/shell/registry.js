/**
 * registry.js — App registry.
 * Each app default-exports: { id, title, icon, width, height, mount(body, ctx) }
 * Missing apps are silently skipped so the shell always boots.
 */

const apps = [];

async function load(path) {
  try {
    const mod = await import(path);
    if (mod.default && mod.default.id) apps.push(mod.default);
  } catch (e) {
    console.warn(`[registry] could not load ${path}:`, e.message);
  }
}

await load('../apps/about.js');
await load('../apps/terminal.js');
await load('../apps/projects.js');
await load('../apps/cosmos.js');
await load('../apps/wormhole.js');
await load('../apps/gallery.js');
await load('../apps/wallpaper.js');
await load('../apps/contact.js');
await load('../apps/gravity.js');
await load('../apps/decoder.js');
await load('../apps/resonance.js');

export default apps;
