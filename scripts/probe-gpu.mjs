import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const variants = [
  { name: 'default', opts: {} },
  { name: 'chromium-new-headless+d3d11', opts: { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] } },
  { name: 'chrome-new-headless+d3d11', opts: { channel: 'chrome', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] } },
];
for (const v of variants) {
  try {
    const b = await chromium.launch(v.opts);
    const p = await b.newPage();
    await p.goto(BASE + '/');
    const r = await p.evaluate(() => { const c=document.createElement('canvas');const gl=c.getContext('webgl2');const d=gl&&gl.getExtension('WEBGL_debug_renderer_info');return {renderer:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):null,timer:!!(gl&&gl.getExtension('EXT_disjoint_timer_query_webgl2'))}; });
    console.log(v.name, JSON.stringify(r));
    await b.close();
  } catch (e) { console.log(v.name, 'ERR', e.message.split('\n')[0]); }
}
