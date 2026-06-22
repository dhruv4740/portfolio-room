// os/apps/wallpaper.js — curl-noise flow field with store persistence + improved UI
import store from '../shell/store.js';

const PALETTES = {
  green:  { key: 'green',  bg: '#050a08', r: 92,  g: 255, b: 208, label: 'GRN', hex: '#5cffd0' },
  amber:  { key: 'amber',  bg: '#0a0800', r: 255, g: 176, b: 0,   label: 'AMB', hex: '#ffb000' },
  violet: { key: 'violet', bg: '#080510', r: 192, g: 132, b: 252, label: 'VIO', hex: '#c084fc' },
  blue:   { key: 'blue',   bg: '#020810', r: 96,  g: 165, b: 250, label: 'BLU', hex: '#60a5fa' },
};

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
    palLabel.textContent = 'PALETTE';
    ui.appendChild(palLabel);

    const btnMap = {};
    let activePal = PALETTES[store.get('wallpaper.palette') || 'green'];

    function applyPal(key) {
      activePal = PALETTES[key];
      body.style.background = activePal.bg;
      store.set('wallpaper.palette', key);
      Object.entries(btnMap).forEach(([k, btn]) => {
        const isActive = k === key;
        btn.style.outline = isActive
          ? `2px solid ${PALETTES[k].hex}`
          : '2px solid transparent';
        btn.style.opacity = isActive ? '1' : '0.45';
      });
    }

    // Swatch buttons: 28×28 color squares
    Object.values(PALETTES).forEach(p => {
      const btn = document.createElement('button');
      btn.title = p.label;
      btn.style.cssText = [
        `width:28px`, `height:28px`, 'border:none', 'cursor:pointer',
        `background:rgb(${p.r},${p.g},${p.b})`,
        'outline:2px solid transparent', 'outline-offset:2px',
        'opacity:0.45', 'transition:opacity 0.15s, outline 0.15s',
        'flex-shrink:0',
      ].join(';');
      btn.addEventListener('click', () => applyPal(p.key));
      btn.addEventListener('mouseover', () => { if (activePal.key !== p.key) btn.style.opacity = '0.75'; });
      btn.addEventListener('mouseout',  () => { if (activePal.key !== p.key) btn.style.opacity = '0.45'; });
      btnMap[p.key] = btn;
      ui.appendChild(btn);
    });

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
      const beneath   = document.getElementById('os-beneath');
      const workspace = document.getElementById('workspace');
      const { r, g, b, bg } = activePal;
      if (beneath)   beneath.style.background = bg;
      const bc = document.getElementById('beneath-canvas');
      if (bc) bc.style.filter = `hue-rotate(${activePal.key === 'green' ? 0 : activePal.key === 'amber' ? 200 : activePal.key === 'violet' ? 270 : 150}deg)`;
      if (workspace) workspace.style.background = `radial-gradient(ellipse at 30% 40%, rgba(${r},${g},${b},0.06) 0%, transparent 65%)`;
      store.emit('wallpaper:set', { palette: activePal.key });
      const prev = setBtn.textContent;
      setBtn.textContent = '✓ APPLIED';
      setTimeout(() => { setBtn.textContent = prev; }, 2200);
    });
    ui.appendChild(setBtn);

    // ── Particle state ────────────────────────────────────────────────────────
    let W, H, dpr, particles = [];
    let t = 0, last = 0, rafId = null;
    const N = 260; // slightly fewer than 300 for performance headroom

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        age: Math.random() * 220, maxAge: 160 + Math.random() * 180,
        speed: 0.6 + Math.random() * 1.1, size: 0.8 + Math.random() * 1.8,
      }));
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;

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
        const speed = p.speed * 60 * dt;
        const nx = p.x + dx * speed;
        const ny = p.y + dy * speed;
        const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.72;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(nx, ny);
        c.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        c.lineWidth = p.size; c.stroke();
        p.x = ((nx % W) + W) % W;
        p.y = ((ny % H) + H) % H;
      }

      rafId = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    applyPal(activePal.key);
    resize();
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.remove();
      ui.remove();
    };
  },
};
