// os/apps/corrupted.js — dependency-free canvas sketch
export default {
  id: 'corrupted',
  title: 'Corrupted',
  icon: '▧',
  width: 620,
  height: 430,

  mount(body) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050505;';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Corrupted');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, rafId = 0, last = 0, time = 0;
    let visible = false, pulse = 0, pointer = { x: 0.5, y: 0.5 };
    const bars = Array.from({ length: 42 }, (_, i) => ({
      y: (i + 0.5) / 42,
      phase: (i * 1.73) % 6.28,
      width: 0.12 + ((i * 17) % 31) / 100,
    }));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(time);
    }

    function draw(now) {
      if (!W || !H) return;
      c.fillStyle = '#050505'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(92,255,208,0.07)'; c.lineWidth = 1;
      for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      bars.forEach((bar, i) => {
        const glitch = Math.sin(now * 0.002 + bar.phase) * 0.5 + 0.5;
        const x = ((i * 47 + Math.sin(now * 0.001 + bar.phase) * 18) % (W + 100)) - 50;
        const width = W * bar.width * (0.7 + glitch * 0.45);
        const y = H * bar.y;
        c.fillStyle = i % 5 === 0 ? `rgba(255,95,31,${0.16 + glitch * 0.28})` : `rgba(92,255,208,${0.08 + glitch * 0.2})`;
        c.fillRect(x, y, width, Math.max(1, H / 180));
        if ((i + Math.floor(now / 180)) % 9 === 0) {
          c.fillStyle = 'rgba(255,255,255,0.35)';
          c.fillRect((W - x + width) % W, y + 2, width * 0.32, 1);
        }
      });
      const radius = Math.min(W, H) * (0.08 + pulse * 0.12);
      const px = pointer.x * W, py = pointer.y * H;
      const glow = c.createRadialGradient(px, py, 0, px, py, radius * 3);
      glow.addColorStop(0, 'rgba(255,95,31,0.25)'); glow.addColorStop(1, 'rgba(255,95,31,0)');
      c.fillStyle = glow; c.fillRect(px - radius * 3, py - radius * 3, radius * 6, radius * 6);
      pulse *= 0.94;
    }

    function loop(now) {
      if (!visible) { rafId = 0; return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt * 1000;
      draw(time); rafId = requestAnimationFrame(loop);
    }
    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }
    function onPointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    }
    function onClick() { pulse = 1; }
    const ro = new ResizeObserver(resize); ro.observe(body);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('click', onClick);
    resize();
    return {
      setVisible,
      cleanup() {
        setVisible(false); ro.disconnect();
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('click', onClick); canvas.remove();
      },
    };
  },
};
