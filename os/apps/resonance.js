// os/apps/resonance.js — Canvas 2D audio-reactive visualizer using ctx.audio.analyser
export default {
  id: 'resonance',
  title: 'resonance',
  icon: '♫',
  width: 700,
  height: 540,

  mount(body, appCtx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    // ── Overlay (shown when audio is off) ──
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute', 'inset:0', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:14px',
      'pointer-events:none', 'transition:opacity 0.4s', 'z-index:10',
    ].join(';');
    body.appendChild(overlay);

    const hint = document.createElement('span');
    hint.style.cssText = "font:9px 'JetBrains Mono',monospace;color:rgba(92,255,208,0.3);letter-spacing:0.2em;";
    hint.textContent = 'AUDIO REACTIVE';
    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ ENABLE AUDIO';
    playBtn.style.cssText = [
      "font:10px 'JetBrains Mono',monospace", 'letter-spacing:0.2em',
      'padding:10px 28px', 'border:1px solid rgba(92,255,208,0.4)',
      'background:rgba(92,255,208,0.04)', 'color:#5cffd0', 'cursor:pointer',
      'pointer-events:auto', 'transition:all 0.2s',
    ].join(';');
    playBtn.addEventListener('mouseover', () => { playBtn.style.borderColor = '#5cffd0'; playBtn.style.background = 'rgba(92,255,208,0.08)'; });
    playBtn.addEventListener('mouseout',  () => { playBtn.style.borderColor = 'rgba(92,255,208,0.4)'; playBtn.style.background = 'rgba(92,255,208,0.04)'; });
    playBtn.addEventListener('click', () => {
      appCtx.audio.start();
      // Update the OS sound toggle label
      const btn = document.getElementById('sound-toggle');
      if (btn) { btn.textContent = '♪ ON'; btn.classList.add('on'); }
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    });
    const subHint = document.createElement('span');
    subHint.style.cssText = "font:8px 'JetBrains Mono',monospace;color:rgba(92,255,208,0.2);letter-spacing:0.12em;";
    subHint.textContent = 'or toggle ♪ ON in menubar';
    overlay.appendChild(hint);
    overlay.appendChild(playBtn);
    overlay.appendChild(subHint);

    // Label
    const label = document.createElement('div');
    label.style.cssText = [
      'position:absolute', 'bottom:14px', 'left:0', 'right:0', 'text-align:center',
      "font:8px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.18)',
      'letter-spacing:0.22em', 'pointer-events:none', 'z-index:5',
    ].join(';');
    label.textContent = 'RESONANCE — AUDIO VISUALIZER';
    body.appendChild(label);

    // ── Dimensions ──
    let W, H, dpr, cx, cy, rafId;
    let t = 0, last = 0;
    const BAR_COUNT = 64;
    const ORBIT_N   = 24;
    let orbitAngle  = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
    }

    // Color lerp: green → amber based on energy [0,1]
    function energyColor(e) {
      const r = Math.round(92  + (255 - 92)  * e);
      const g = Math.round(255 + (176 - 255) * e);
      const b = Math.round(208 + (0   - 208) * e);
      return { r, g, b };
    }

    function loop(now) {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now; t += dt;

      const analyser = appCtx.audio.analyser;

      // Check if audio just started
      if (analyser && overlay.style.opacity !== '0') {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
      if (!analyser && overlay.style.opacity === '0') {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }

      // ── Read FFT or idle ──
      let freqData = null;
      let bassEnergy = 0, overallEnergy = 0;

      if (analyser) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        for (let i = 0; i < 8; i++)  bassEnergy    += freqData[i] / 255;
        bassEnergy /= 8;
        for (let i = 0; i < freqData.length; i++) overallEnergy += freqData[i] / 255;
        overallEnergy /= freqData.length;
      } else {
        // idle breathing
        bassEnergy    = 0.05 + 0.04 * Math.sin(t * 0.9);
        overallEnergy = 0.03 + 0.025 * Math.sin(t * 0.7);
      }

      const energyT = Math.min(overallEnergy * 3.5, 1.0);
      const { r, g, b } = energyColor(energyT);

      // ── Background (fade) ──
      c.globalAlpha = 0.22;
      c.fillStyle = '#050a08';
      c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;

      // ── Radial bars ──
      const BAR_INNER = Math.min(W, H) * 0.22;
      const BAR_MAX   = Math.min(W, H) * 0.38;

      for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
        let val;
        if (freqData) {
          const binIdx = Math.floor((i / BAR_COUNT) * freqData.length * 0.6);
          val = freqData[binIdx] / 255;
        } else {
          val = 0.06 + 0.05 * Math.sin(t * 1.5 + i * 0.25);
        }
        const barH = BAR_INNER + val * BAR_MAX;
        const alpha = 0.35 + val * 0.65;
        const x1 = cx + Math.cos(angle) * BAR_INNER;
        const y1 = cy + Math.sin(angle) * BAR_INNER;
        const x2 = cx + Math.cos(angle) * barH;
        const y2 = cy + Math.sin(angle) * barH;

        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
        c.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        c.lineWidth = 1.5 + val * 1.5;
        c.stroke();
      }

      // ── Central sphere (polygon pulsing with bass) ──
      const sphereR = BAR_INNER * 0.75 + bassEnergy * BAR_INNER * 0.6;
      const verts = 18;
      c.beginPath();
      for (let i = 0; i <= verts; i++) {
        const a = (i / verts) * Math.PI * 2;
        const wobble = 1 + 0.12 * Math.sin(a * 3 + t * 2.5 + bassEnergy * 4);
        const px = cx + Math.cos(a) * sphereR * wobble;
        const py = cy + Math.sin(a) * sphereR * wobble;
        i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
      }
      c.closePath();
      const sphereGrad = c.createRadialGradient(cx, cy, 0, cx, cy, sphereR);
      sphereGrad.addColorStop(0, `rgba(${r},${g},${b},${0.18 + bassEnergy * 0.3})`);
      sphereGrad.addColorStop(1, `rgba(${r},${g},${b},0.0)`);
      c.fillStyle = sphereGrad;
      c.fill();
      c.strokeStyle = `rgba(${r},${g},${b},${0.25 + bassEnergy * 0.5})`;
      c.lineWidth = 1;
      c.stroke();

      // Wireframe inner rings
      for (let ring = 1; ring <= 2; ring++) {
        const rr = sphereR * (0.4 + ring * 0.2);
        c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2);
        c.strokeStyle = `rgba(${r},${g},${b},${0.08 + bassEnergy * 0.12})`;
        c.lineWidth = 0.5; c.stroke();
      }

      // ── Orbit ring ──
      orbitAngle += dt * (0.3 + overallEnergy * 0.8);
      const orbitR = BAR_INNER + BAR_MAX * 0.55 + overallEnergy * 20;
      for (let i = 0; i < ORBIT_N; i++) {
        const a = orbitAngle + (i / ORBIT_N) * Math.PI * 2;
        const spread = 1 + overallEnergy * 0.3 * Math.sin(t * 2 + i);
        const ox = cx + Math.cos(a) * orbitR * spread;
        const oy = cy + Math.sin(a) * orbitR * spread;
        const size = 1.2 + overallEnergy * 2.5;
        c.beginPath(); c.arc(ox, oy, size, 0, Math.PI * 2);
        c.fillStyle = `rgba(${r},${g},${b},${0.4 + overallEnergy * 0.5})`;
        c.fill();
      }

      // ── Center bloom ──
      const bloom = c.createRadialGradient(cx, cy, 0, cx, cy, sphereR * 0.4);
      bloom.addColorStop(0, `rgba(${r},${g},${b},${0.3 + bassEnergy * 0.4})`);
      bloom.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.beginPath(); c.arc(cx, cy, sphereR * 0.4, 0, Math.PI * 2);
      c.fillStyle = bloom; c.fill();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(body);
    resize();
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  },
};
