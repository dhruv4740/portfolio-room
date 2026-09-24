// os/apps/wallpaper.js — curl-noise flow field and live skyline wallpapers with store persistence
import store from '../shell/store.js';

export const PALETTES = {
  green:  { key: 'green',  bg: '#050a08', r: 92,  g: 255, b: 208, label: 'Aurora', hex: '#5cffd0' },
  amber:  { key: 'amber',  bg: '#0a0800', r: 255, g: 176, b: 0,   label: 'Ember',  hex: '#ffb000' },
  violet: { key: 'violet', bg: '#080510', r: 192, g: 132, b: 252, label: 'Nebula', hex: '#c084fc' },
  blue:   { key: 'blue',   bg: '#020810', r: 96,  g: 165, b: 250, label: 'Tide',   hex: '#60a5fa' },
};
const SKY_LABEL = 'Mumbai, live';

export function getSkyState() {
  if (window.parent !== window) {
    try {
      const stage = window.parent.document.querySelector('.workspace-stage');
      const s = stage?.dataset.skyState;
      if (s === 'day' || s === 'dusk' || s === 'night') return s;
    } catch (_) {}
  }
  const h = new Date().getHours();
  if (h >= 7 && h <= 16) return 'day';
  if ((h >= 5 && h <= 6) || (h >= 17 && h <= 18)) return 'dusk';
  return 'night';
}

function createPrng(seed = 1306) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function renderSkylineDataUrl(skyState, width, height, dpr = 1) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width * dpr));
  c.height = Math.max(1, Math.round(height * dpr));
  const ctx = c.getContext('2d');
  const W = c.width;
  const H = c.height;

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (skyState === 'day') {
    grad.addColorStop(0, '#9cc3e6');
    grad.addColorStop(1, '#dfeaf2');
  } else if (skyState === 'dusk') {
    grad.addColorStop(0, '#2b2f55');
    grad.addColorStop(1, '#e0875a');
  } else {
    grad.addColorStop(0, '#070b16');
    grad.addColorStop(1, '#1a2238');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Seeded skyline: 28 rectangles covering bottom 38%
  const rng = createPrng(1306);
  const skylineH = H * 0.38;
  const bColor = skyState === 'day' ? '#6d7f93' : skyState === 'dusk' ? '#2a2438' : '#0d1119';
  const litRate = skyState === 'day' ? 0.10 : skyState === 'dusk' ? 0.35 : 0.55;

  const rects = [];
  const count = 28;
  for (let i = 0; i < count; i++) {
    const rw = (W / 20) * (0.8 + rng() * 0.7);
    const rh = skylineH * (0.3 + rng() * 0.7);
    const rx = (i / (count - 1)) * (W - rw);
    const ry = H - rh;
    rects.push({ rx, ry, rw, rh });
  }

  ctx.fillStyle = bColor;
  for (const b of rects) {
    ctx.fillRect(b.rx, b.ry, b.rw, b.rh);
  }

  // Windows grid
  ctx.fillStyle = '#ffd98a';
  for (const b of rects) {
    const winW = Math.max(1, Math.round(2 * dpr));
    const winH = Math.max(2, Math.round(3 * dpr));
    const gapX = Math.max(2, Math.round(3 * dpr));
    const gapY = Math.max(2, Math.round(4 * dpr));
    const margin = Math.max(2, Math.round(3 * dpr));
    const cols = Math.floor((b.rw - margin * 2) / (winW + gapX));
    const rows = Math.floor((b.rh - margin * 2) / (winH + gapY));
    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        if (rng() < litRate) {
          ctx.fillRect(
            b.rx + margin + cl * (winW + gapX),
            b.ry + margin + r * (winH + gapY),
            winW,
            winH
          );
        }
      }
    }
  }

  // Readability: the desktop icons sit in a column on the left, and a bright
  // day sky washed them out. Dim the day sky and shade that column.
  if (skyState === 'day') {
    ctx.fillStyle = 'rgba(10,16,26,0.38)';
    ctx.fillRect(0, 0, W, H);
  }
  const scrim = ctx.createLinearGradient(0, 0, W * 0.22, 0);
  scrim.addColorStop(0, 'rgba(0,0,0,0.5)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W * 0.22, H);

  return c.toDataURL('image/png');
}

// A still of the preview's flow field, so the desktop shows the palette you
// picked rather than an 8% glow on near-black. Same seed every time.
const flowCache = new Map();
export function renderFlowDataUrl(p, width, height, dpr = 1) {
  const cacheKey = `${p.key}:${width}x${height}@${dpr}`;
  if (flowCache.has(cacheKey)) return flowCache.get(cacheKey);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width * dpr));
  c.height = Math.max(1, Math.round(height * dpr));
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.62, height * 0.42, 0, width * 0.62, height * 0.42, Math.max(width, height) * 0.7);
  glow.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.16)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const rng = createPrng(4740);
  ctx.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    let x = rng() * width, y = rng() * height;
    const steps = 40 + Math.floor(rng() * 70), size = 0.6 + rng() * 1.4, t = rng() * 6;
    for (let s = 0; s < steps; s++) {
      const { dx, dy } = curlXY(x, y, t);
      const len = Math.hypot(dx, dy) || 1;
      const nx = x + (dx / len) * 2.2, ny = y + (dy / len) * 2.2;
      ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${Math.sin((s / steps) * Math.PI) * 0.24})`;
      ctx.lineWidth = size;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
      x = nx; y = ny;
    }
  }
  const scrim = ctx.createLinearGradient(0, 0, width * 0.22, 0);
  scrim.addColorStop(0, 'rgba(0,0,0,0.45)');
  scrim.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width * 0.22, height);
  const url = c.toDataURL('image/png');
  flowCache.set(cacheKey, url);
  return url;
}

let skyObserver = null;

export function stopSkyObserver() {
  if (skyObserver) {
    skyObserver.disconnect();
    skyObserver = null;
  }
}

export function startSkyObserver(onChange) {
  stopSkyObserver();
  if (window.parent !== window) {
    try {
      const stage = window.parent.document.querySelector('.workspace-stage');
      if (stage) {
        skyObserver = new MutationObserver(() => {
          onChange();
        });
        skyObserver.observe(stage, { attributes: true, attributeFilter: ['data-sky-state'] });
      }
    } catch (_) {}
  }
}

export function applyWallpaper(key) {
  const desktop = document.getElementById('desktop');
  const workspace = document.getElementById('workspace');
  // 'plain' was removed; a saved choice falls back to the default.
  if (key !== 'sky' && !PALETTES[key]) key = 'green';
  if (key === 'sky') {
    const redraw = () => {
      const W = desktop?.clientWidth || window.innerWidth || 900;
      const H = desktop?.clientHeight || window.innerHeight || 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const skyState = getSkyState();
      const url = `url("${renderSkylineDataUrl(skyState, W, H, dpr)}")`;
      if (desktop) {
        desktop.style.backgroundImage = url;
        desktop.style.backgroundSize = 'cover';
      }
      if (workspace) {
        workspace.style.backgroundImage = url;
        workspace.style.backgroundSize = 'cover';
      }
    };
    redraw();
    startSkyObserver(redraw);
  } else if (PALETTES[key]) {
    stopSkyObserver();
    const p = PALETTES[key];
    const W = desktop?.clientWidth || window.innerWidth || 900;
    const H = desktop?.clientHeight || window.innerHeight || 640;
    const url = `url("${renderFlowDataUrl(p, W, H, Math.min(window.devicePixelRatio || 1, 1.5))}")`;
    for (const el of [desktop, workspace]) {
      if (!el) continue;
      el.style.backgroundColor = p.bg;
      el.style.backgroundImage = url;
      el.style.backgroundSize = 'cover';
    }
  }
}

function curlXY(x, y, t) {
  const s = 0.0028;
  const n = (px, py) =>
    Math.sin(px * s + t * 0.18) * Math.cos(py * s * 1.4 + t * 0.13) +
    Math.sin(px * s * 0.6 - py * s * 0.5 + t * 0.09) * 0.55;
  const eps = 0.01;
  return {
    dx:  (n(x, y + eps) - n(x, y - eps)) / (2 * eps),
    dy: -(n(x + eps, y) - n(x - eps, y)) / (2 * eps),
  };
}

export default {
  id: 'wallpaper',
  title: 'wallpaper',
  icon: '≋',
  width: 700,
  height: 540,

  mount(body, _ctx) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden', 'background:#050a08',
      "font-family:'JetBrains Mono','Courier New',monospace",
    ].join(';');

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    // ── UI bar ────────────────────────────────────────────────────────────────
    const ui = document.createElement('div');
    ui.style.cssText = [
      'position:absolute', 'bottom:0', 'left:0', 'right:0',
      'padding:12px 20px 14px', 'display:flex', 'align-items:center', 'gap:10px',
      'background:linear-gradient(transparent,rgba(5,10,8,0.9))', 'z-index:10',
      'border-top:1px solid rgba(92,255,208,0.06)',
    ].join(';');
    body.appendChild(ui);

    const palLabel = document.createElement('span');
    palLabel.style.cssText = 'font-size:8px;letter-spacing:0.24em;color:rgba(92,255,208,0.3);margin-right:6px;flex-shrink:0;';
    palLabel.style.minWidth = '92px';
    ui.appendChild(palLabel);

    const btnMap = {};
    let currentKey = store.get('wallpaper.palette') || 'green';
    if (currentKey !== 'sky' && !PALETTES[currentKey]) currentKey = 'green';

    // ── Particle state ────────────────────────────────────────────────────────
    let W, H, dpr, particles = [];
    let t = 0, last = 0, rafId = null;
    const N = 260;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth || 700;
      H = body.clientHeight || 540;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        age: Math.random() * 220, maxAge: 160 + Math.random() * 180,
        speed: 0.6 + Math.random() * 1.1, size: 0.8 + Math.random() * 1.8,
      }));
      if (currentKey === 'sky') drawSkyPreview();
    }

    // Draws in CSS pixels under the dpr transform. Resetting the transform
    // here (as it used to) left the particle loop painting only 1/dpr of the
    // canvas after switching back from SKY.
    function drawSkyPreview() {
      const dataUrl = renderSkylineDataUrl(getSkyState(), W, H, dpr);
      const img = new Image();
      img.onload = () => { if (currentKey === 'sky') c.drawImage(img, 0, 0, W, H); };
      img.src = dataUrl;
    }

    function loop(now) {
      if (currentKey === 'sky') {
        rafId = null;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;

      const activePal = PALETTES[currentKey] || PALETTES.green;
      c.globalAlpha = 0.1;
      c.fillStyle = activePal.bg;
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;

      const { r, g, b } = activePal;
      for (const p of particles) {
        p.age++;
        if (p.age > p.maxAge) {
          p.x = Math.random() * W; p.y = Math.random() * H;
          p.age = 0; p.maxAge = 160 + Math.random() * 180;
          p.speed = 0.6 + Math.random() * 1.1;
          continue;
        }
        const { dx, dy } = curlXY(p.x, p.y, t);
        // The curl's raw magnitude is ~0.004, which moved each particle a
        // fraction of a pixel and left the preview dark; follow its direction.
        const len = Math.hypot(dx, dy) || 1;
        const speed = p.speed * 60 * dt;
        const nx = p.x + (dx / len) * speed;
        const ny = p.y + (dy / len) * speed;
        const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.72;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(nx, ny);
        c.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        c.lineWidth = p.size; c.stroke();
        p.x = ((nx % W) + W) % W;
        p.y = ((ny % H) + H) % H;
      }

      rafId = requestAnimationFrame(loop);
    }

    function applyPal(key) {
      currentKey = key;
      store.set('wallpaper.palette', key);
      applyWallpaper(key);
      palLabel.textContent = (PALETTES[key]?.label || SKY_LABEL).toUpperCase();

      Object.entries(btnMap).forEach(([k, btn]) => {
        const isActive = k === key;
        btn.style.outline = isActive ? '2px solid #5cffd0' : '2px solid transparent';
        btn.style.opacity = isActive ? '1' : '0.45';
      });

      if (key === 'sky') {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        body.style.background = '#2b2f55';
        drawSkyPreview();
      } else {
        const pal = PALETTES[key] || PALETTES.green;
        body.style.background = pal.bg;
        c.fillStyle = pal.bg;
        c.fillRect(0, 0, W, H);
        if (!rafId) {
          last = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      }
    }

    // 4 Palette Swatch buttons: 28×28
    Object.values(PALETTES).forEach(p => {
      const btn = document.createElement('button');
      btn.title = p.label;
      btn.style.cssText = [
        'width:28px', 'height:28px', 'border:none', 'cursor:pointer',
        `background:rgb(${p.r},${p.g},${p.b})`,
        'outline:2px solid transparent', 'outline-offset:2px',
        'opacity:0.45', 'transition:opacity 0.15s, outline 0.15s',
        'flex-shrink:0',
      ].join(';');
      btn.addEventListener('click', () => applyPal(p.key));
      btn.addEventListener('mouseover', () => { if (currentKey !== p.key) btn.style.opacity = '0.75'; });
      btn.addEventListener('mouseout',  () => { if (currentKey !== p.key) btn.style.opacity = '0.45'; });
      btnMap[p.key] = btn;
      ui.appendChild(btn);
    });

    // SKY button
    const skyBtn = document.createElement('button');
    skyBtn.title = SKY_LABEL;
    skyBtn.textContent = 'SKY';
    skyBtn.style.cssText = [
      'width:28px', 'height:28px', 'border:none', 'cursor:pointer',
      'background:linear-gradient(135deg, #2b2f55, #e0875a)',
      'color:#fff', "font:8px 'JetBrains Mono',monospace", 'font-weight:600',
      'display:flex', 'align-items:center', 'justify-content:center',
      'outline:2px solid transparent', 'outline-offset:2px',
      'opacity:0.45', 'transition:opacity 0.15s, outline 0.15s',
      'flex-shrink:0',
    ].join(';');
    skyBtn.addEventListener('click', () => applyPal('sky'));
    skyBtn.addEventListener('mouseover', () => { if (currentKey !== 'sky') skyBtn.style.opacity = '0.75'; });
    skyBtn.addEventListener('mouseout',  () => { if (currentKey !== 'sky') skyBtn.style.opacity = '0.45'; });
    btnMap.sky = skyBtn;
    ui.appendChild(skyBtn);

    const setBtn = document.createElement('button');
    setBtn.textContent = 'SET AS WALLPAPER';
    setBtn.style.cssText = [
      'margin-left:auto', 'font-size:8px', 'letter-spacing:0.18em',
      'padding:5px 14px', 'border:1px solid rgba(255,176,0,0.45)',
      'background:rgba(255,176,0,0.06)', 'color:#ffb000', 'cursor:pointer',
      "font-family:inherit", 'transition:all 0.15s', 'flex-shrink:0',
    ].join(';');
    setBtn.addEventListener('mouseover', () => { setBtn.style.borderColor = '#ffb000'; setBtn.style.background = 'rgba(255,176,0,0.1)'; });
    setBtn.addEventListener('mouseout',  () => { setBtn.style.borderColor = 'rgba(255,176,0,0.45)'; setBtn.style.background = 'rgba(255,176,0,0.06)'; });
    setBtn.addEventListener('click', () => {
      applyWallpaper(currentKey);
      store.emit('wallpaper:set', { palette: currentKey });
      const prev = setBtn.textContent;
      setBtn.textContent = '✓ APPLIED';
      setTimeout(() => { setBtn.textContent = prev; }, 2200);
    });
    ui.appendChild(setBtn);

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    resize();
    applyPal(currentKey);

    return function cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      stopSkyObserver();
      ro.disconnect();
      canvas.remove();
      ui.remove();
    };
  },
};
