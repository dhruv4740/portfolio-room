/**
 * tear.js — Reality-tear intro.
 * Shows a flat off-white landing page; dragging tears the alpha mask
 * to reveal the dark OS beneath. Past ~55% torn, gsap drops the flat
 * layer and calls onComplete().
 *
 * The "beneath" layer is a lightweight canvas (dark gradient + drifting
 * points + faint glow) — no Three.js to keep shell cheap.
 *
 * Export: runIntro(onComplete) → void
 */

export function runIntro(onComplete) {
  // ── Beneath layer: lightweight canvas ──────────────────────────────
  const beneathCanvas = document.getElementById('beneath-canvas');
  const bCtx = beneathCanvas.getContext('2d');
  let bW = innerWidth, bH = innerHeight;

  function resizeBeneath() {
    bW = beneathCanvas.width = innerWidth;
    bH = beneathCanvas.height = innerHeight;
  }
  resizeBeneath();

  // Drifting points
  const POINT_COUNT = 55;
  const points = Array.from({ length: POINT_COUNT }, () => ({
    x: Math.random() * bW,
    y: Math.random() * bH,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: 0.8 + Math.random() * 1.8,
    a: 0.2 + Math.random() * 0.5,
  }));

  let beneathRafId;
  function animateBeneath() {
    beneathRafId = requestAnimationFrame(animateBeneath);
    bCtx.clearRect(0, 0, bW, bH);

    // Central glow
    const grd = bCtx.createRadialGradient(bW * 0.45, bH * 0.5, 0, bW * 0.45, bH * 0.5, bW * 0.55);
    grd.addColorStop(0, 'rgba(92,255,208,0.07)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    bCtx.fillStyle = grd;
    bCtx.fillRect(0, 0, bW, bH);

    // Points
    points.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = bW;
      if (p.x > bW) p.x = 0;
      if (p.y < 0) p.y = bH;
      if (p.y > bH) p.y = 0;
      bCtx.beginPath();
      bCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bCtx.fillStyle = `rgba(92,255,208,${p.a})`;
      bCtx.fill();
    });
  }
  animateBeneath();

  // ── Mask canvas ─────────────────────────────────────────────────────
  const maskCanvas = document.createElement('canvas');
  const mCtx = maskCanvas.getContext('2d');

  const shadowCanvas = document.getElementById('shadow-canvas');
  const sCtx = shadowCanvas.getContext('2d');

  let thresholdCrossed = false;

  function resizeMask() {
    maskCanvas.width = innerWidth;
    maskCanvas.height = innerHeight;
    shadowCanvas.width = innerWidth;
    shadowCanvas.height = innerHeight;
    mCtx.fillStyle = '#fff';
    mCtx.fillRect(0, 0, innerWidth, innerHeight);
    sCtx.clearRect(0, 0, innerWidth, innerHeight);
    updateMask();
  }

  function updateMask() {
    const url = maskCanvas.toDataURL();
    const val = `url("${url}")`;
    const flatSite = document.getElementById('flat-site');
    flatSite.style.webkitMaskImage = val;
    flatSite.style.maskImage = val;
    document.getElementById('tear-shadow').style.webkitMaskImage = val;
    document.getElementById('tear-shadow').style.maskImage = val;
  }

  function stampTear(x, y, radius) {
    const pts = 11 + Math.floor(Math.random() * 8);

    mCtx.save();
    mCtx.globalCompositeOperation = 'destination-out';
    mCtx.translate(x, y);
    mCtx.beginPath();
    for (let i = 0; i < pts; i++) {
      const angle = (i / pts) * Math.PI * 2;
      const jag = 0.45 + Math.random() * 0.6;
      const rx = (radius * (0.5 + Math.random() * 0.9)) * jag * (1 + 0.4 * Math.cos(angle * 3.7));
      const ry = (radius * (0.5 + Math.random() * 0.9)) * jag * (1 + 0.4 * Math.sin(angle * 2.3));
      const px = Math.cos(angle + Math.random() * 0.5) * rx;
      const py = Math.sin(angle + Math.random() * 0.5) * ry;
      i === 0 ? mCtx.moveTo(px, py) : mCtx.lineTo(px, py);
    }
    mCtx.closePath();
    mCtx.fillStyle = '#000';
    mCtx.fill();
    mCtx.restore();

    // torn-edge shadow
    sCtx.save();
    sCtx.translate(x, y);
    sCtx.beginPath();
    for (let i = 0; i < pts; i++) {
      const angle = (i / pts) * Math.PI * 2;
      const jag = 0.45 + Math.random() * 0.6;
      const sr = (radius * 1.22 * (0.5 + Math.random() * 0.9)) * jag * (1 + 0.4 * Math.cos(angle * 3.7));
      const sry = (radius * 1.22 * (0.5 + Math.random() * 0.9)) * jag * (1 + 0.4 * Math.sin(angle * 2.3));
      const px = Math.cos(angle + Math.random() * 0.5) * sr;
      const py = Math.sin(angle + Math.random() * 0.5) * sry;
      i === 0 ? sCtx.moveTo(px, py) : sCtx.lineTo(px, py);
    }
    sCtx.closePath();
    sCtx.fillStyle = 'rgba(0,0,0,0.4)';
    sCtx.fill();
    sCtx.restore();
  }

  let sampleTimer = 0;
  function estimateTorn() {
    const sample = 1200;
    const data = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    let holes = 0;
    const step = Math.floor(data.data.length / 4 / sample);
    for (let i = 0; i < sample; i++) {
      if (data.data[i * step * 4 + 3] < 128) holes++;
    }
    return holes / sample;
  }

  // ── Pointer interaction ─────────────────────────────────────────────
  let isDown = false, lastX = -1, lastY = -1;

  function onPointerMove(e) {
    if (!isDown || thresholdCrossed) return;
    const x = e.clientX, y = e.clientY;
    const dx = lastX < 0 ? 0 : x - lastX;
    const dy = lastY < 0 ? 0 : y - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.min(dist, 60);
    const radius = 28 + speed * 1.4;
    const steps = Math.max(1, Math.floor(dist / (radius * 0.35)));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const sx = lastX < 0 ? x : lastX + dx * t;
      const sy = lastY < 0 ? y : lastY + dy * t;
      stampTear(sx, sy, radius * (0.7 + Math.random() * 0.55));
    }
    lastX = x; lastY = y;
    sampleTimer++;
    if (sampleTimer % 6 === 0) {
      const torn = estimateTorn();
      if (torn > 0.55) triggerFullTear();
    }
    updateMask();
  }

  function onPointerDown(e) {
    isDown = true; lastX = e.clientX; lastY = e.clientY;
    stampTear(e.clientX, e.clientY, 32 + Math.random() * 18);
    updateMask();
  }

  function onPointerUp() { isDown = false; lastX = -1; lastY = -1; }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointerleave', onPointerUp);

  window.addEventListener('resize', () => {
    resizeBeneath();
    if (!thresholdCrossed) resizeMask();
  });

  // ── Full tear → hand off ────────────────────────────────────────────
  function triggerFullTear() {
    if (thresholdCrossed) return;
    thresholdCrossed = true;

    // Remove pointer listeners
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointerleave', onPointerUp);

    // Erase entire mask
    mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    updateMask();

    const flatSite = document.getElementById('flat-site');
    const tearShadow = document.getElementById('tear-shadow');
    const hintEl = document.getElementById('tear-hint');
    const skipBtn = document.getElementById('intro-skip');

    gsap.to(flatSite, {
      duration: 0.65, opacity: 0, y: innerHeight * 0.05, scaleY: 0.93,
      filter: 'blur(6px)', ease: 'power3.in',
      onComplete: () => {
        flatSite.style.display = 'none';
        tearShadow.style.display = 'none';
        if (hintEl) hintEl.style.display = 'none';
        if (skipBtn) skipBtn.style.display = 'none';
        cancelAnimationFrame(beneathRafId);
        onComplete();
      }
    });
  }

  // ── Skip button ─────────────────────────────────────────────────────
  const skipBtn = document.getElementById('intro-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!thresholdCrossed) triggerFullTear();
    });
  }

  resizeMask();
}
