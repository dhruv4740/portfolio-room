// wormhole.js — hyperdrive tunnel for dhruvOS
export default {
  id: 'wormhole',
  title: 'wormhole',
  icon: '◎',
  width: 680,
  height: 520,

  mount(body, _ctx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#000;';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;cursor:crosshair;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    let W, H, dpr, cx, cy;
    let t = 0, last = 0, rafId = null;
    let offset = { x: 0, y: 0 }, targetOff = { x: 0, y: 0 };
    const RING_COUNT = 28;
    const STAR_COUNT = 140;
    let stars = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      stars = Array.from({ length: STAR_COUNT }, () => ({
        angle: Math.random() * Math.PI * 2,
        baseDist: 0.04 + Math.random() * 0.46,
        speed: 0.18 + Math.random() * 0.55,
        size: 0.4 + Math.random() * 1.4,
        phase: Math.random(),
      }));
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      offset.x += (targetOff.x - offset.x) * 0.06;
      offset.y += (targetOff.y - offset.y) * 0.06;

      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);

      const ocx = cx + offset.x * 0.1;
      const ocy = cy + offset.y * 0.1;
      const maxR = Math.min(W, H) * 0.47;

      // tunnel shading — dark radial gradient
      const bg = c.createRadialGradient(ocx, ocy, 0, ocx, ocy, maxR * 1.1);
      bg.addColorStop(0, 'rgba(0,20,15,0.6)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      c.beginPath();
      c.arc(ocx, ocy, maxR * 1.1, 0, Math.PI * 2);
      c.fillStyle = bg;
      c.fill();

      // stars (streak outward)
      for (const s of stars) {
        const p = ((s.phase + t * s.speed * 0.22) % 1 + 1) % 1;
        const r = p * maxR;
        const sx = ocx + Math.cos(s.angle) * r;
        const sy = ocy + Math.sin(s.angle) * r;
        const alpha = Math.sin(p * Math.PI) * 0.75;
        c.beginPath();
        c.arc(sx, sy, s.size * (0.4 + p * 0.6), 0, Math.PI * 2);
        c.fillStyle = `rgba(92,255,208,${alpha})`;
        c.fill();
      }

      // rings zooming outward
      for (let i = 0; i < RING_COUNT; i++) {
        const phase = ((i / RING_COUNT + t * 0.20) % 1 + 1) % 1;
        const rr = phase * maxR;
        // bell-curve alpha: brightest at mid-tunnel, dims at center+edge
        const alpha = Math.sin(phase * Math.PI) * 0.92;
        const hue = 155 + phase * 50;
        const lum = 55 + phase * 10;
        const thick = 0.6 + phase * 2.8;
        // 6-sided polygon with temporal rotation + slight wobble
        const sides = 6;
        const spin = t * 0.06 * (i % 2 === 0 ? 1 : -1);
        c.beginPath();
        for (let j = 0; j <= sides; j++) {
          const a = (j / sides) * Math.PI * 2 + spin;
          const wobble = 1 + 0.035 * Math.sin(a * 4 + t * 2.2 + i * 0.6);
          const rx = ocx + Math.cos(a) * rr * wobble;
          const ry = ocy + Math.sin(a) * rr * wobble;
          j === 0 ? c.moveTo(rx, ry) : c.lineTo(rx, ry);
        }
        c.closePath();
        c.strokeStyle = `hsla(${hue},100%,${lum}%,${alpha})`;
        c.lineWidth = thick;
        c.stroke();
      }

      // center bloom
      const bloom = c.createRadialGradient(ocx, ocy, 0, ocx, ocy, maxR * 0.18);
      bloom.addColorStop(0, 'rgba(92,255,208,0.55)');
      bloom.addColorStop(0.4, 'rgba(92,255,208,0.08)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      c.beginPath();
      c.arc(ocx, ocy, maxR * 0.18, 0, Math.PI * 2);
      c.fillStyle = bloom;
      c.fill();

      rafId = requestAnimationFrame(loop);
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      targetOff.x = e.clientX - rect.left - W / 2;
      targetOff.y = e.clientY - rect.top  - H / 2;
    }
    function onPointerLeave() { targetOff.x = 0; targetOff.y = 0; }

    canvas.addEventListener('pointermove',  onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    resize();
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointermove',  onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.remove();
    };
  },
};
