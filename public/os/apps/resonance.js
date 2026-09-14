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

    // ── Audio Element & Graph ──
    const audio = document.createElement('audio');
    audio.className = 'resonance-audio';
    audio.src = new URL('../audio/song.mp3', import.meta.url).href;
    audio.loop = true;
    audio.preload = 'none';
    body.appendChild(audio);

    let mediaSource = null;
    let songGain = null;
    let volume = 0.6;
    audio.volume = volume;
    let mode = 'SONG'; // 'SONG' | 'SYNTH'
    let wasPlayingBeforeHide = false;

    function ensureAudioGraph() {
      if (mediaSource) return;
      const ctx = appCtx.audio.context;
      if (ctx.state === 'suspended') ctx.resume();
      mediaSource = ctx.createMediaElementSource(audio);
      songGain = ctx.createGain();
      songGain.gain.value = volume;
      mediaSource.connect(songGain);
      songGain.connect(appCtx.audio.analyser);
    }

    // ── Overlay (shown when paused / initial state) ──
    const overlay = document.createElement('div');
    overlay.className = 'resonance-overlay';
    overlay.style.cssText = [
      'position:absolute', 'inset:0', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'gap:14px',
      'pointer-events:none', 'transition:opacity 0.4s', 'z-index:10',
    ].join(';');
    body.appendChild(overlay);

    const hint = document.createElement('span');
    hint.style.cssText = "font:9px 'JetBrains Mono',monospace;color:rgba(92,255,208,0.4);letter-spacing:0.2em;";
    hint.textContent = 'RESONANCE AUDIO';

    const overlayPlayBtn = document.createElement('button');
    overlayPlayBtn.className = 'res-overlay-play-btn';
    overlayPlayBtn.textContent = '▶ PLAY SONG';
    overlayPlayBtn.style.cssText = [
      "font:10px 'JetBrains Mono',monospace", 'letter-spacing:0.2em',
      'padding:10px 28px', 'border:1px solid rgba(92,255,208,0.4)',
      'background:rgba(92,255,208,0.06)', 'color:#5cffd0', 'cursor:pointer',
      'pointer-events:auto', 'transition:all 0.2s', 'border-radius:4px',
    ].join(';');
    overlayPlayBtn.addEventListener('mouseover', () => { overlayPlayBtn.style.borderColor = '#5cffd0'; overlayPlayBtn.style.background = 'rgba(92,255,208,0.12)'; });
    overlayPlayBtn.addEventListener('mouseout',  () => { overlayPlayBtn.style.borderColor = 'rgba(92,255,208,0.4)'; overlayPlayBtn.style.background = 'rgba(92,255,208,0.06)'; });

    overlay.appendChild(hint);
    overlay.appendChild(overlayPlayBtn);

    // ── Persistent Controls Bar ──
    const controlsBar = document.createElement('div');
    controlsBar.className = 'resonance-controls';
    controlsBar.style.cssText = [
      'position:absolute', 'bottom:14px', 'left:50%', 'transform:translateX(-50%)',
      'display:flex', 'align-items:center', 'gap:14px',
      'background:rgba(5,10,8,0.88)', 'border:1px solid rgba(92,255,208,0.25)',
      'padding:6px 16px', 'border-radius:20px', 'backdrop-filter:blur(8px)',
      'z-index:20', 'user-select:none',
    ].join(';');
    body.appendChild(controlsBar);

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.className = 'res-btn res-play-btn';
    playPauseBtn.textContent = '▶ PLAY';
    playPauseBtn.style.cssText = [
      "font:9px 'JetBrains Mono',monospace", 'letter-spacing:0.15em',
      'padding:4px 12px', 'border:1px solid rgba(92,255,208,0.4)',
      'background:rgba(92,255,208,0.06)', 'color:#5cffd0', 'cursor:pointer',
      'border-radius:4px', 'transition:all 0.2s',
    ].join(';');
    controlsBar.appendChild(playPauseBtn);

    // Mode toggle button (SONG / SYNTH)
    const modeBtn = document.createElement('button');
    modeBtn.className = 'res-btn res-mode-btn';
    modeBtn.textContent = 'SRC: SONG';
    modeBtn.style.cssText = [
      "font:9px 'JetBrains Mono',monospace", 'letter-spacing:0.1em',
      'padding:4px 10px', 'border:1px solid rgba(92,255,208,0.25)',
      'background:transparent', 'color:rgba(92,255,208,0.7)', 'cursor:pointer',
      'border-radius:4px', 'transition:all 0.2s',
    ].join(';');
    controlsBar.appendChild(modeBtn);

    // Volume Slider
    const volWrap = document.createElement('div');
    volWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const volLabel = document.createElement('span');
    volLabel.style.cssText = "font:8px 'JetBrains Mono',monospace;color:rgba(92,255,208,0.5);letter-spacing:0.1em;";
    volLabel.textContent = 'VOL';
    const volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '1';
    volSlider.step = '0.01';
    volSlider.value = String(volume);
    volSlider.style.cssText = 'width:64px;height:4px;cursor:pointer;accent-color:#5cffd0;';
    volSlider.setAttribute('aria-label', 'Volume');
    const volVal = document.createElement('span');
    volVal.style.cssText = "font:8px 'JetBrains Mono',monospace;color:rgba(92,255,208,0.7);width:26px;";
    volVal.textContent = Math.round(volume * 100) + '%';
    volWrap.appendChild(volLabel);
    volWrap.appendChild(volSlider);
    volWrap.appendChild(volVal);
    controlsBar.appendChild(volWrap);

    function updateUI() {
      const isPlaying = mode === 'SONG' ? !audio.paused : appCtx.audio.running;
      playPauseBtn.textContent = isPlaying ? '❚❚ PAUSE' : '▶ PLAY';
      overlayPlayBtn.textContent = isPlaying ? '❚❚ PAUSE' : (mode === 'SONG' ? '▶ PLAY SONG' : '▶ PLAY SYNTH');
      modeBtn.textContent = `SRC: ${mode}`;
      if (isPlaying) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      } else {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      }
    }

    function play() {
      if (mode === 'SONG') {
        ensureAudioGraph();
        const ctx = appCtx.audio.context;
        if (ctx.state === 'suspended') ctx.resume();
        audio.play().then(() => updateUI()).catch((e) => console.warn('[resonance] play error:', e));
      } else {
        appCtx.audio.start();
        updateUI();
      }
    }

    function pause() {
      if (mode === 'SONG') {
        audio.pause();
      } else {
        appCtx.audio.stop();
      }
      updateUI();
    }

    function togglePlay() {
      const isPlaying = mode === 'SONG' ? !audio.paused : appCtx.audio.running;
      if (isPlaying) pause(); else play();
    }

    overlayPlayBtn.addEventListener('click', () => play());
    playPauseBtn.addEventListener('click', () => togglePlay());

    volSlider.addEventListener('input', (e) => {
      volume = parseFloat(e.target.value);
      audio.volume = volume;
      if (songGain) songGain.gain.value = volume;
      if (appCtx.audio.masterGain) appCtx.audio.masterGain.gain.value = volume;
      volVal.textContent = Math.round(volume * 100) + '%';
    });

    modeBtn.addEventListener('click', () => {
      const wasPlaying = mode === 'SONG' ? !audio.paused : appCtx.audio.running;
      pause();
      mode = mode === 'SONG' ? 'SYNTH' : 'SONG';
      if (wasPlaying) play(); else updateUI();
    });

    updateUI();

    // Label at bottom-left
    const label = document.createElement('div');
    label.style.cssText = [
      'position:absolute', 'bottom:16px', 'left:16px',
      "font:8px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.25)',
      'letter-spacing:0.2em', 'pointer-events:none', 'z-index:5',
    ].join(';');
    label.textContent = 'RESONANCE';
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

      const isPlaying = mode === 'SONG' ? !audio.paused : appCtx.audio.running;

      // ── Read FFT or idle ──
      let freqData = null;
      let bassEnergy = 0, overallEnergy = 0;

      const analyser = appCtx.audio.analyser;
      if (isPlaying && analyser) {
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

    function setVisible(v) {
      if (!v) {
        if (mode === 'SONG') {
          if (!audio.paused) {
            wasPlayingBeforeHide = true;
            pause();
          }
        } else {
          if (appCtx.audio.running) {
            wasPlayingBeforeHide = true;
            pause();
          }
        }
      } else {
        if (wasPlayingBeforeHide) {
          wasPlayingBeforeHide = false;
          play();
        }
      }
    }

    function onV3Visibility(e) {
      if (e.detail?.state === 'room') {
        setVisible(false);
      }
    }
    window.addEventListener('v3:visibility', onV3Visibility);

    const ro = new ResizeObserver(resize);
    ro.observe(body);
    resize();
    rafId = requestAnimationFrame(loop);

    return {
      setVisible,
      cleanup() {
        window.removeEventListener('v3:visibility', onV3Visibility);
        cancelAnimationFrame(rafId);
        ro.disconnect();
        pause();
        if (mediaSource) {
          try { mediaSource.disconnect(); } catch (_) {}
          try { songGain.disconnect(); } catch (_) {}
        }
        audio.remove();
      },
    };
  },
};
