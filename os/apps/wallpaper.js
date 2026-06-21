// wallpaper.js — Flux/Liminal ambient flow-field for dhruvOS
const PALETTES = {
  green:  { key: 'green',  bg: '#050a08', r: 92,  g: 255, b: 208, label: 'GRN' },
  amber:  { key: 'amber',  bg: '#0a0800', r: 255, g: 176, b: 0,   label: 'AMB' },
  violet: { key: 'violet', bg: '#080510', r: 192, g: 132, b: 252, label: 'VIO' },
  blue:   { key: 'blue',   bg: '#020810', r: 96,  g: 165, b: 250, label: 'BLU' },
};

// pseudo-curl via layered sin/cos
function curlXY(x, y, t) {
  const s = 0.0028;
  const n  = (px, py) =>
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
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;font-family:"JetBrains Mono","Courier New",monospace;';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    // ── UI bar ──────────────────────────────────────────────────────────────────
    const ui = document.createElement('div');
    ui.style.cssText = [
      'position:absolute', 'bottom:0', 'left:0', 'right:0',
      'padding:14px 20px', 'display:flex', 'align-items:center', 'gap:8px',
      'background:linear-gradient(transparent,rgba(5,10,8,0.85))', 'z-index:10',
    ].join(';');
    body.appendChild(ui);

    const palLabel = document.createElement('span');
    palLabel.textContent = 'PALETTE';
    palLabel.style.cssText = 'font-size:9px;letter-spacing:0.2em;color:rgba(92,255,208,0.35);margin-right:4px;';
    ui.appendChild(palLabel);

    const btnMap = {};
    let activePal = PALETTES.green;

    function applyPal(key) {
      activePal = PALETTES[key];
      body.style.background = activePal.bg;
      Object.entries(btnMap).forEach(([k, btn]) => {
        const isActive = k === key;
        const { r, g, b } = PALETTES[k];
        btn.style.borderColor = isActive ? `rgb(${r},${g},${b})` : 'rgba(92,255,208,0.2)';
        btn.style.color       = isActive ? `rgb(${r},${g},${b})` : 'rgba(92,255,208,0.45)';
      });
    }

    Object.values(PALETTES).forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.style.cssText = [
        'font-size:9px', 'letter-spacing:0.15em', 'padding:3px 10px',
        'border:1px solid rgba(92,255,208,0.2)', 'border-radius:2px',
        'background:transparent', 'color:rgba(92,255,208,0.45)',
        'cursor:pointer', 'font-family:inherit', 'transition:all 0.2s',
      ].join(';');
      btn.addEventListener('click', () => applyPal(p.key));
      btnMap[p.key] = btn;
      ui.appendChild(btn);
    });

    const setBtn = document.createElement('button');
    setBtn.textContent = 'SET AS WALLPAPER';
    setBtn.style.cssText = [
      'margin-left:auto', 'font-size:9px', 'letter-spacing:0.15em',
      'padding:4px 14px', 'border:1px solid rgba(92,255,208,0.35)',
      'border-radius:2px', 'background:rgba(92,255,208,0.07)',
      'color:#5cffd0', 'cursor:pointer', 'font-family:inherit', 'transition:all 0.2s',
    ].join(';');
    setBtn.addEventListener('click', () => {
      const beneath = document.getElementById('os-beneath');
      const workspace = document.getElementById('workspace');
      const { r, g, b } = activePal;
      if (beneath) beneath.style.background = activePal.bg;
      const bc = document.getElementById('beneath-canvas');
      if (bc) bc.style.filter = `hue-rotate(${activePal.key === 'green' ? 0 : activePal.key === 'amber' ? 200 : activePal.key === 'violet' ? 270 : 150}deg)`;
      if (workspace) workspace.style.background = `radial-gradient(ellipse at 30% 40%, rgba(${r},${g},${b},0.06) 0%, transparent 65%)`;
      const prev = setBtn.textContent;
      setBtn.textContent = '✓ APPLIED';
      setTimeout(() => { setBtn.textContent = prev; }, 2200);
    });
    ui.appendChild(setBtn);

    // ── Particle state ──────────────────────────────────────────────────────────
    let W, H, dpr, particles = [];
    let t = 0, last = 0, rafId = null;
    const N = 300;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        age: Math.random() * 220,
        maxAge: 160 + Math.random() * 180,
        speed: 0.6 + Math.random() * 1.1,
        size: 0.8 + Math.random() * 1.8,
      }));
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;

      // fade trail
      c.globalAlpha = 0.11;
      c.fillStyle = activePal.bg;
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;

      const { r, g, b } = activePal;

      for (const p of particles) {
        p.age++;
        if (p.age > p.maxAge) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.age = 0;
          p.maxAge = 160 + Math.random() * 180;
          p.speed  = 0.6 + Math.random() * 1.1;
          continue;
        }
        const { dx, dy } = curlXY(p.x, p.y, t);
        const speed = p.speed * 60 * dt;
        const nx = p.x + dx * speed;
        const ny = p.y + dy * speed;

        const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.75;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(nx, ny);
        c.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        c.lineWidth = p.size;
        c.stroke();

        p.x = ((nx % W) + W) % W;
        p.y = ((ny % H) + H) % H;
      }

      rafId = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    applyPal('green');
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
