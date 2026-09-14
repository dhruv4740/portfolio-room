import store from './store.js';
import { applyWallpaper } from '../apps/wallpaper.js';

const PALETTES = {
  green:  { bg: '#040c09', r: 92,  g: 255, b: 208 },
  amber:  { bg: '#080600', r: 255, g: 176, b: 0   },
  violet: { bg: '#06040a', r: 192, g: 132, b: 252 },
  blue:   { bg: '#020608', r: 96,  g: 165, b: 250 },
};

function curlXY(x, y, t) {
  const s = 0.0022;
  const n = (px, py) =>
    Math.sin(px * s + t * 0.15) * Math.cos(py * s * 1.3 + t * 0.11) +
    Math.sin(px * s * 0.5 - py * s * 0.4 + t * 0.07) * 0.5;
  const eps = 0.01;
  return {
    dx:  (n(x, y + eps) - n(x, y - eps)) / (2 * eps),
    dy: -(n(x + eps, y) - n(x - eps, y)) / (2 * eps),
  };
}

export function initBeneathCanvas() {
  const canvas = document.getElementById('beneath-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');

  let W, H, dpr, rafId;
  let t = 0, last = 0, fpsLast = 0;
  const N = 80;
  let particles = [];
  let pal = PALETTES[store.get('wallpaper.palette') || 'green'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.offsetWidth || window.innerWidth;
    H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      age: Math.random() * 200, maxAge: 140 + Math.random() * 160,
      speed: 0.5 + Math.random() * 0.9, size: 0.5 + Math.random() * 1.2,
    }));
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    // Cap at ~24fps
    if (now - fpsLast < 40) return;
    const dt = Math.min((now - last) / 1000, 0.06);
    last = now; fpsLast = now; t += dt;

    c.globalAlpha = 0.08;
    c.fillStyle = pal.bg;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;

    const { r, g, b } = pal;
    for (const p of particles) {
      p.age++;
      if (p.age > p.maxAge) {
        p.x = Math.random() * W; p.y = Math.random() * H;
        p.age = 0; p.maxAge = 140 + Math.random() * 160;
        p.speed = 0.5 + Math.random() * 0.9;
        continue;
      }
      const { dx, dy } = curlXY(p.x, p.y, t);
      const speed = p.speed * 60 * dt;
      const nx = p.x + dx * speed;
      const ny = p.y + dy * speed;
      const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.45;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(nx, ny);
      c.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      c.lineWidth = p.size; c.stroke();
      p.x = ((nx % W) + W) % W;
      p.y = ((ny % H) + H) % H;
    }
  }

  store.on('wallpaper:set', ({ palette }) => {
    applyWallpaper(palette);
    if (PALETTES[palette]) {
      pal = PALETTES[palette];
      const beneath = document.getElementById('os-beneath');
      if (beneath) beneath.style.background = pal.bg;
    }
  });

  resize();
  window.addEventListener('resize', resize);
  rafId = requestAnimationFrame(loop);
}
