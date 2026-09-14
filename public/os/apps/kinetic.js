// os/apps/kinetic.js — dependency-free motion study
export default {
  id: 'kinetic',
  title: 'Kinetic',
  icon: '↝',
  width: 700,
  height: 500,

  mount(body) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#f1eee7;';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Kinetic');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;cursor:ew-resize;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, rafId = 0, last = 0, time = 0, visible = false;
    let speed = 1, pointerX = 0.5;
    const bands = Array.from({ length: 13 }, (_, i) => ({
      y: i / 13, width: 0.16 + (i % 5) * 0.07, phase: i * 0.72, tone: i % 3,
    }));
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = body.clientWidth; H = body.clientHeight;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0); draw(time);
    }
    function draw(now) {
      if (!W || !H) return;
      c.fillStyle = '#f1eee7'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(18,22,26,0.08)';
      for (let y = 0; y < H; y += 5) c.fillRect(0, y, W, 1);
      bands.forEach((band, i) => {
        const wave = Math.sin(now * 0.001 * speed + band.phase) * W * 0.06;
        const x = ((now * 0.04 * speed * (i % 2 ? -1 : 1) + wave + pointerX * W * 0.3) % (W * 1.5)) - W * 0.25;
        const width = W * band.width;
        c.fillStyle = band.tone === 0 ? '#101820' : band.tone === 1 ? '#ff5f1f' : '#9da9a5';
        c.globalAlpha = 0.82 - i * 0.025;
        c.fillRect(x, H * band.y, width, Math.max(4, H / 26));
        c.globalAlpha = 1;
      });
      c.strokeStyle = 'rgba(16,24,32,0.35)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(pointerX * W, 0); c.lineTo(pointerX * W, H); c.stroke();
    }
    function loop(now) {
      if (!visible) { rafId = 0; return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt * 1000; draw(time); rafId = requestAnimationFrame(loop);
    }
    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }
    function move(event) {
      const rect = canvas.getBoundingClientRect(); pointerX = (event.clientX - rect.left) / rect.width;
      speed = 0.7 + pointerX * 1.7;
    }
    function wheel(event) { speed = Math.max(0.35, Math.min(3, speed + (event.deltaY > 0 ? 0.12 : -0.12))); }
    const ro = new ResizeObserver(resize); ro.observe(body);
    canvas.addEventListener('pointermove', move); canvas.addEventListener('wheel', wheel, { passive: true });
    resize();
    return {
      setVisible,
      cleanup() {
        setVisible(false); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('wheel', wheel); canvas.remove();
      },
    };
  },
};
