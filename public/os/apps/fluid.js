// os/apps/fluid.js — dependency-free cursor-driven flow sketch
export default {
  id: 'fluid',
  title: 'Flux',
  icon: '≈',
  width: 700,
  height: 500,

  mount(body) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#071015;';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Flux');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, rafId = 0, last = 0, time = 0, visible = false;
    const pointer = { x: 0.5, y: 0.5, active: false };
    let particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: 180 }, (_, i) => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0, hue: 175 + (i % 70), size: 0.6 + Math.random() * 1.8,
      }));
      draw(0);
    }
    function draw(dt) {
      if (!W || !H) return;
      c.fillStyle = 'rgba(7,16,21,0.18)'; c.fillRect(0, 0, W, H);
      const mx = pointer.x * W, my = pointer.y * H;
      for (const p of particles) {
        const dx = mx - p.x, dy = my - p.y, dist = Math.hypot(dx, dy) + 1;
        const flow = Math.sin(p.x * 0.012 + time * 0.0012) + Math.cos(p.y * 0.009 - time * 0.001) ;
        p.vx += Math.cos(flow + p.y * 0.002) * 0.06 + dx / dist * (pointer.active ? 0.018 : 0);
        p.vy += Math.sin(flow + p.x * 0.002) * 0.06 + dy / dist * (pointer.active ? 0.018 : 0);
        p.vx *= 0.965; p.vy *= 0.965;
        const ox = p.x, oy = p.y;
        p.x = (p.x + p.vx * dt * 60 + W) % W; p.y = (p.y + p.vy * dt * 60 + H) % H;
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(p.x, p.y);
        c.strokeStyle = `hsla(${p.hue},85%,68%,${pointer.active ? 0.34 : 0.2})`;
        c.lineWidth = p.size; c.stroke();
      }
      const glow = c.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.32);
      glow.addColorStop(0, 'rgba(72,220,210,0.12)'); glow.addColorStop(1, 'rgba(72,220,210,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, H);
    }
    function loop(now) {
      if (!visible) { rafId = 0; return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt * 1000;
      draw(dt); rafId = requestAnimationFrame(loop);
    }
    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }
    function move(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height; pointer.active = true;
    }
    function leave() { pointer.active = false; }
    const ro = new ResizeObserver(resize); ro.observe(body);
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
    resize();
    return {
      setVisible,
      cleanup() {
        setVisible(false); ro.disconnect();
        canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.remove();
      },
    };
  },
};
