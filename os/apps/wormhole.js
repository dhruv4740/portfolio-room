// os/apps/wormhole.js — hyperdrive tunnel repurposed as spatial app-switcher
// Hex rings become labeled portals. Click a ring → open that app.
export default {
  id: 'wormhole',
  title: 'wormhole',
  icon: '◎',
  width: 700,
  height: 540,

  mount(body, ctx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;cursor:crosshair;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    // ── Navigation portals ────────────────────────────────────────────────────
    // App ids + labels for the 6 rings (exclude wormhole itself and contact which has menubar btn)
    const PORTALS = [
      { id: 'about',     label: 'ABOUT',     icon: '◈' },
      { id: 'terminal',  label: 'TERMINAL',  icon: '>_' },
      { id: 'projects',  label: 'PROJECTS',  icon: '◇' },
      { id: 'cosmos',    label: 'COSMOS',    icon: '◉' },
      { id: 'gallery',   label: 'GALLERY',   icon: '⊞' },
      { id: 'wallpaper', label: 'WALLPAPER', icon: '≋' },
    ];

    let W, H, dpr, cx, cy;
    let t = 0, last = 0, rafId = null;
    let offset = { x: 0, y: 0 }, targetOff = { x: 0, y: 0 };
    const STAR_COUNT = 120;
    let stars = [];

    // Hit-state per ring index
    const RING_COUNT = PORTALS.length;
    let hoveredRing = -1;
    let flashRing = -1, flashT = 0;

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
        speed: 0.15 + Math.random() * 0.45,
        size: 0.4 + Math.random() * 1.2,
        phase: Math.random(),
      }));
    }

    // Compute ring radius for portal index (innermost = smallest, outermost = largest)
    function ringR(i, maxR) {
      // 6 rings spread evenly from 14% to 92% of maxR
      const frac = 0.14 + (i / (RING_COUNT - 1)) * 0.78;
      return frac * maxR;
    }

    // Check if a point is on/near a ring stroke
    function getHitRing(mx, my, ocx, ocy, maxR) {
      const dx = mx - ocx, dy = my - ocy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      for (let i = 0; i < RING_COUNT; i++) {
        const rr = ringR(i, maxR);
        if (Math.abs(dist - rr) < 14) return i;
      }
      return -1;
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;

      if (flashRing >= 0) {
        flashT += dt * 3;
        if (flashT > 1) { flashRing = -1; flashT = 0; }
      }

      offset.x += (targetOff.x - offset.x) * 0.06;
      offset.y += (targetOff.y - offset.y) * 0.06;

      c.fillStyle = '#050a08';
      c.fillRect(0, 0, W, H);

      const ocx = cx + offset.x * 0.08;
      const ocy = cy + offset.y * 0.08;
      const maxR = Math.min(W, H) * 0.46;

      // radial vignette
      const bg = c.createRadialGradient(ocx, ocy, 0, ocx, ocy, maxR * 1.1);
      bg.addColorStop(0, 'rgba(5,20,14,0.55)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      c.beginPath(); c.arc(ocx, ocy, maxR * 1.1, 0, Math.PI * 2);
      c.fillStyle = bg; c.fill();

      // stars
      for (const s of stars) {
        const p = ((s.phase + t * s.speed * 0.22) % 1 + 1) % 1;
        const r = p * maxR;
        const sx = ocx + Math.cos(s.angle) * r;
        const sy = ocy + Math.sin(s.angle) * r;
        const alpha = Math.sin(p * Math.PI) * 0.6;
        c.beginPath(); c.arc(sx, sy, s.size * (0.4 + p * 0.6), 0, Math.PI * 2);
        c.fillStyle = `rgba(92,255,208,${alpha})`; c.fill();
      }

      // ── Portal rings ──────────────────────────────────────────────────────
      c.save();
      c.font = `bold 9px 'JetBrains Mono',monospace`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      for (let i = 0; i < RING_COUNT; i++) {
        // Each ring phases in from innermost to outermost (no speed scroll — they're fixed)
        const rr       = ringR(i, maxR);
        const isHov    = i === hoveredRing;
        const isFlash  = i === flashRing;
        const flashAmt = isFlash ? Math.sin(flashT * Math.PI) : 0;

        const baseAlpha = 0.12 + (i / RING_COUNT) * 0.18;
        const hoverAlpha = isHov ? 0.65 : baseAlpha;
        const alpha = hoverAlpha + flashAmt * 0.45;

        const hue = 155 + (i / RING_COUNT) * 30;
        const lum = 55 + (i / RING_COUNT) * 12;

        const sides = 6;
        const spin  = t * 0.04 * (i % 2 === 0 ? 1 : -1);
        const thick = isHov ? 2.2 : 1 + (i / RING_COUNT) * 1.2;

        // Ring stroke
        c.beginPath();
        for (let j = 0; j <= sides; j++) {
          const a = (j / sides) * Math.PI * 2 + spin;
          const wobble = 1 + 0.025 * Math.sin(a * 4 + t * 2 + i * 0.7);
          const rx = ocx + Math.cos(a) * rr * wobble;
          const ry = ocy + Math.sin(a) * rr * wobble;
          j === 0 ? c.moveTo(rx, ry) : c.lineTo(rx, ry);
        }
        c.closePath();
        c.strokeStyle = `hsla(${hue},100%,${lum}%,${alpha})`;
        c.lineWidth = thick;
        c.stroke();

        // Hover glow
        if (isHov || isFlash) {
          c.beginPath();
          for (let j = 0; j <= sides; j++) {
            const a = (j / sides) * Math.PI * 2 + spin;
            const wobble = 1 + 0.025 * Math.sin(a * 4 + t * 2 + i * 0.7);
            const rx = ocx + Math.cos(a) * rr * wobble;
            const ry = ocy + Math.sin(a) * rr * wobble;
            j === 0 ? c.moveTo(rx, ry) : c.lineTo(rx, ry);
          }
          c.closePath();
          c.strokeStyle = `rgba(92,255,208,${0.12 + flashAmt * 0.18})`;
          c.lineWidth = thick + 10;
          c.stroke();
        }

        // Label: icon glyph + name on top of ring (at 12 o'clock position)
        const portal = PORTALS[i];
        const labelAngle = -Math.PI / 2 + spin * 0.3; // near top
        const lx = ocx + Math.cos(labelAngle) * rr;
        const ly = ocy + Math.sin(labelAngle) * rr;

        const labelAlpha = isHov ? 0.95 : 0.35 + (i / RING_COUNT) * 0.25;
        c.fillStyle = `rgba(92,255,208,${labelAlpha})`;

        // Background pill for readability
        if (isHov) {
          const textW = c.measureText(portal.icon + ' ' + portal.label).width + 12;
          c.fillStyle = 'rgba(5,10,8,0.85)';
          c.fillRect(lx - textW / 2, ly - 10, textW, 20);
          c.fillStyle = '#5cffd0';
        }

        c.fillText(portal.icon + ' ' + portal.label, lx, ly);
      }
      c.restore();

      // Center bloom
      const bloom = c.createRadialGradient(ocx, ocy, 0, ocx, ocy, maxR * 0.14);
      bloom.addColorStop(0, 'rgba(92,255,208,0.45)');
      bloom.addColorStop(0.4, 'rgba(92,255,208,0.06)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      c.beginPath(); c.arc(ocx, ocy, maxR * 0.14, 0, Math.PI * 2);
      c.fillStyle = bloom; c.fill();

      // Center label
      c.save();
      c.font = `9px 'JetBrains Mono',monospace`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(92,255,208,0.35)';
      c.fillText('NAVIGATE', ocx, ocy);
      c.restore();

      rafId = requestAnimationFrame(loop);
    }

    function getCanvasXY(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerMove(e) {
      const { x: mx, y: my } = getCanvasXY(e);
      const ocx = cx + offset.x * 0.08, ocy = cy + offset.y * 0.08;
      const maxR = Math.min(W, H) * 0.46;
      const hit = getHitRing(mx, my, ocx, ocy, maxR);
      if (hit !== hoveredRing) {
        hoveredRing = hit;
        canvas.style.cursor = hit >= 0 ? 'pointer' : 'crosshair';
      }
      targetOff.x = e.clientX - canvas.getBoundingClientRect().left - W / 2;
      targetOff.y = e.clientY - canvas.getBoundingClientRect().top  - H / 2;
    }

    function onPointerLeave() {
      targetOff.x = 0; targetOff.y = 0;
      hoveredRing = -1;
      canvas.style.cursor = 'crosshair';
    }

    function onClick(e) {
      const { x: mx, y: my } = getCanvasXY(e);
      const ocx = cx + offset.x * 0.08, ocy = cy + offset.y * 0.08;
      const maxR = Math.min(W, H) * 0.46;
      const hit = getHitRing(mx, my, ocx, ocy, maxR);
      if (hit >= 0) {
        flashRing = hit; flashT = 0;
        const portal = PORTALS[hit];
        setTimeout(() => ctx?.openApp?.(portal.id), 80);
      }
    }

    canvas.addEventListener('pointermove',  onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click',        onClick);

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    resize();
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointermove',  onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click',        onClick);
      canvas.remove();
    };
  },
};
