// os/apps/tear.js — dependency-free pointer-driven reveal sketch
export default {
  id: 'tear',
  title: 'Reality Tear',
  icon: '╱',
  width: 700,
  height: 500,

  mount(body) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#02040a;';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Reality Tear');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, rafId = 0, last = 0, time = 0, visible = false;
    let dragging = false, pointer = { x: 0, y: 0 }, marks = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = body.clientWidth; H = body.clientHeight;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    function draw() {
      if (!W || !H) return;
      c.fillStyle = '#02040a'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,190,255,0.08)'; c.lineWidth = 1;
      for (let i = -H; i < W; i += 28) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); }
      c.save(); c.translate(W / 2, H / 2); c.rotate(Math.sin(time * 0.0004) * 0.02);
      c.strokeStyle = 'rgba(92,255,208,0.28)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-W * 0.38, 0); c.lineTo(-W * 0.04, 0); c.moveTo(W * 0.04, 0); c.lineTo(W * 0.38, 0); c.stroke();
      c.restore();
      marks = marks.filter(mark => mark.life > 0);
      for (const mark of marks) {
        mark.life -= 0.012;
        c.save(); c.translate(mark.x, mark.y); c.rotate(mark.angle);
        c.strokeStyle = `rgba(255,95,31,${mark.life * 0.75})`; c.lineWidth = 1 + mark.life * 2;
        c.beginPath(); c.moveTo(-mark.length, 0); c.lineTo(mark.length, 0); c.stroke(); c.restore();
      }
      if (dragging) {
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(pointer.x, pointer.y, 2.5, 0, Math.PI * 2); c.fill();
      }
    }
    function loop(now) {
      if (!visible) { rafId = 0; return; }
      const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt * 1000; draw(); rafId = requestAnimationFrame(loop);
    }
    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); }
      if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }
    function point(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
    function down(event) { dragging = true; pointer = point(event); marks.push({ ...pointer, angle: Math.random() * Math.PI, length: 12 + Math.random() * 20, life: 1 }); }
    function move(event) { if (!dragging) return; pointer = point(event); marks.push({ ...pointer, angle: Math.random() * Math.PI, length: 8 + Math.random() * 18, life: 1 }); }
    function up() { dragging = false; }
    const ro = new ResizeObserver(resize); ro.observe(body);
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('pointerleave', up);
    resize();
    return {
      setVisible,
      cleanup() {
        setVisible(false); ro.disconnect();
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('pointerleave', up); canvas.remove();
      },
    };
  },
};
