import * as THREE from '../vendor/three.module.js';
import content from '../shell/content.js';

function loadScript(src) {
  return window.gsap
    ? Promise.resolve()
    : new Promise((ok, fail) => {
        const s = document.createElement('script');
        s.src = new URL(src, import.meta.url).href;
        s.onload = ok;
        s.onerror = fail;
        document.head.appendChild(s);
      });
}

export default {
  id: 'tear',
  title: 'Reality Tear',
  icon: '╱',
  width: 900,
  height: 640,

  mount(body) {
    let visible = false;
    let rafId = 0;
    let cleanedUp = false;

    const root = document.createElement('div');
    root.className = 'app-tear';
    root.tabIndex = 0;
    body.appendChild(root);

    const style = document.createElement('style');
    style.textContent = `
      .app-tear {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
        outline: none;
        user-select: none;
      }

      .app-tear *, .app-tear *::before, .app-tear *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .app-tear #webgl-canvas {
        position: absolute;
        inset: 0;
        z-index: 1;
        display: block;
        width: 100%;
        height: 100%;
      }

      .app-tear #tear-shadow {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        -webkit-mask-image: var(--mask-url, none);
        mask-image: var(--mask-url, none);
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
        -webkit-mask-composite: exclude;
        mask-composite: exclude;
      }
      .app-tear #shadow-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .app-tear #flat-site {
        position: absolute;
        inset: 0;
        z-index: 3;
        background: #f4f3ee;
        -webkit-mask-image: var(--mask-url, none);
        mask-image: var(--mask-url, none);
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
        transition: opacity 0.3s ease;
        user-select: none;
        overflow-y: auto;
      }

      .app-tear .flat-inner {
        max-width: 680px;
        margin: 0 auto;
        padding: 60px 32px 48px;
        pointer-events: none;
      }
      .app-tear .flat-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 60px;
      }
      .app-tear .flat-nav .logo {
        font: 600 13px/1 'Arial', sans-serif;
        letter-spacing: 0.08em;
        color: #1a1a1a;
        text-transform: uppercase;
      }
      .app-tear .flat-nav .nav-links {
        display: flex;
        gap: 28px;
      }
      .app-tear .flat-nav .nav-links span {
        font: 400 12px/1 'Arial', sans-serif;
        color: #888;
      }
      .app-tear .flat-hero { margin-bottom: 56px; }
      .app-tear .flat-hero h1 {
        font: 300 46px/1.05 Georgia, serif;
        color: #1a1a1a;
        letter-spacing: -0.02em;
        margin-bottom: 20px;
      }
      .app-tear .flat-hero p {
        font: 400 15px/1.65 'Arial', sans-serif;
        color: #555;
        max-width: 440px;
      }
      .app-tear .flat-section-label {
        font: 600 10px/1 'Arial', sans-serif;
        letter-spacing: 0.18em;
        color: #bbb;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .app-tear .flat-work-list { list-style: none; }
      .app-tear .flat-work-list li {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 14px 0;
        border-bottom: 1px solid #e8e6e0;
      }
      .app-tear .flat-work-list li:first-child { border-top: 1px solid #e8e6e0; }
      .app-tear .flat-work-list .project-name {
        font: 500 15px/1 Georgia, serif;
        color: #1a1a1a;
      }
      .app-tear .flat-work-list .project-year {
        font: 400 11px/1 'Arial', sans-serif;
        color: #bbb;
      }
      .app-tear .flat-divider {
        height: 1px;
        background: #e0ddd6;
        margin: 40px 0;
      }
      .app-tear .flat-footer-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .app-tear .flat-footer-row span {
        font: 400 11px/1 'Arial', sans-serif;
        color: #bbb;
      }

      .app-tear #reveal-overlay {
        position: absolute;
        inset: 0;
        z-index: 5;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
      }
      .app-tear #reveal-title {
        font: 700 clamp(32px, 6vw, 76px)/1 'Courier New', monospace;
        letter-spacing: 0.12em;
        color: #fff;
        text-shadow: 0 0 60px rgba(100,200,255,0.6), 0 0 120px rgba(80,140,255,0.3);
        mix-blend-mode: screen;
        transform: scale(0.85);
      }
      .app-tear #reveal-project {
        margin-top: 18px;
        font: 400 13px/1 'Courier New', monospace;
        letter-spacing: 0.28em;
        color: rgba(150,220,255,0.7);
        text-transform: uppercase;
        transform: translateY(10px);
        opacity: 0;
      }
      .app-tear #reset-btn {
        position: absolute;
        bottom: 24px;
        right: 24px;
        z-index: 99;
        padding: 8px 16px;
        font: 600 10px/1 'Courier New', monospace;
        letter-spacing: 0.14em;
        color: rgba(255,255,255,0.5);
        text-transform: uppercase;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        backdrop-filter: blur(6px);
        transition: background 0.2s, color 0.2s;
      }
      .app-tear #reset-btn:hover {
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.8);
      }

      .app-tear #concept-label {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99;
        text-align: center;
        pointer-events: none;
      }
      .app-tear #concept-label .title {
        font: 700 10px/1 'Courier New', monospace;
        letter-spacing: 0.25em;
        color: rgba(255,255,255,0.35);
      }
      .app-tear #concept-label .hint {
        font: 400 10px/1.6 'Courier New', monospace;
        color: rgba(255,255,255,0.2);
        letter-spacing: 0.1em;
        margin-top: 4px;
      }

      .app-tear #no-webgl {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: none;
        align-items: center;
        justify-content: center;
        background: #111;
        color: #666;
        font: 400 14px/1 'Courier New', monospace;
      }
    `;
    root.appendChild(style);

    const first3Projects = content.projects.slice(0, 3);
    const topProject = first3Projects[0] || { name: 'FocusLock', year: 2025 };
    const nameLines = content.identity.name.split(' ');

    root.insertAdjacentHTML('beforeend', `
      <div id="no-webgl">WebGL unavailable in this browser.</div>
      <canvas id="webgl-canvas"></canvas>

      <div id="tear-shadow"><canvas id="shadow-canvas"></canvas></div>

      <div id="flat-site">
        <div class="flat-inner">
          <nav class="flat-nav">
            <span class="logo">${content.identity.name}</span>
            <div class="nav-links">
              <span>Work</span>
              <span>About</span>
              <span>Contact</span>
            </div>
          </nav>
          <div class="flat-hero">
            <h1>${nameLines[0]}<br>${nameLines.slice(1).join(' ')}</h1>
            <p>${content.identity.role} based in ${content.identity.location}.</p>
          </div>
          <div class="flat-section-label">Selected Work</div>
          <ul class="flat-work-list">
            ${first3Projects.map((p) => `
              <li><span class="project-name">${p.name}</span><span class="project-year">${p.year}</span></li>
            `).join('')}
          </ul>
          <div class="flat-divider"></div>
          <div class="flat-footer-row">
            <span>${content.contact.email}</span>
          </div>
        </div>
      </div>

      <div id="reveal-overlay">
        <div id="reveal-title">${content.identity.name.toUpperCase()}</div>
        <div id="reveal-project">${topProject.name} — ${topProject.year}</div>
      </div>

      <button id="reset-btn">↺ restore</button>

      <div id="concept-label">
        <div class="title">REALITY TEAR</div>
        <div class="hint">drag across the page to tear reality open</div>
      </div>
    `);

    // Three.js setup
    const canvas3d = root.querySelector('#webgl-canvas');
    let renderer = null;
    let scene = null;
    let camera = null;
    let tunnel = null;
    let tunnelGeo = null;
    let tunnelMat = null;
    let shapes = [];
    let pGeo = null;
    let pMat = null;
    let points = null;
    let pointLights = [];
    let ambientLight = null;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: false });
    } catch (_) {
      const nw = root.querySelector('#no-webgl');
      if (nw) nw.style.display = 'flex';
    }

    const TUNNEL_SEGS = 40, TUNNEL_LEN = 120;

    if (renderer) {
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;
      const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(DPR);
      renderer.setSize(W, H);
      renderer.setClearColor(0x000510, 1);

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000510, 0.018);

      camera = new THREE.PerspectiveCamera(65, (W || 1) / (H || 1), 0.1, 200);
      camera.position.set(0, 0, 14);

      // Tunnel
      tunnelGeo = new THREE.CylinderGeometry(10, 10, TUNNEL_LEN, TUNNEL_SEGS, 80, true);
      tunnelMat = new THREE.MeshBasicMaterial({
        color: 0x0033ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
      tunnel.rotation.x = Math.PI / 2;
      tunnel.position.z = -TUNNEL_LEN / 2 + 14;
      scene.add(tunnel);

      // Iridescent floating shapes
      const iridMat = (hue) => new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.6),
        metalness: 1.0,
        roughness: 0.05,
      });

      const lights = [
        [0x4488ff, 0, 3, -5],
        [0xff44aa, -6, -2, -8],
        [0x44ffcc, 6, 2, -6],
        [0xffaa22, 0, -5, -10],
      ];
      lights.forEach(([col, x, y, z]) => {
        const l = new THREE.PointLight(col, 3, 35);
        l.position.set(x, y, z);
        scene.add(l);
        pointLights.push(l);
      });
      ambientLight = new THREE.AmbientLight(0x112233, 0.6);
      scene.add(ambientLight);

      for (let i = 0; i < 14; i++) {
        const r = 0.3 + Math.random() * 1.1;
        const geo = (i % 3 === 0)
          ? new THREE.IcosahedronGeometry(r, 1)
          : (i % 3 === 1)
          ? new THREE.OctahedronGeometry(r, 0)
          : new THREE.TetrahedronGeometry(r, 0);
        const mat = iridMat(Math.random());
        const mesh = new THREE.Mesh(geo, mat);
        const spread = 12;
        mesh.position.set(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread * 0.7,
          -4 - Math.random() * 20
        );
        mesh.userData = {
          geo,
          mat,
          rx: (Math.random() - 0.5) * 0.008,
          ry: (Math.random() - 0.5) * 0.012,
          floatAmp: 0.3 + Math.random() * 0.5,
          floatSpd: 0.4 + Math.random() * 0.6,
          floatOff: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        };
        scene.add(mesh);
        shapes.push(mesh);
      }

      // Particle field
      const PARTS = 1600;
      const pPositions = new Float32Array(PARTS * 3);
      for (let i = 0; i < PARTS; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 40;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 24;
        pPositions[i * 3 + 2] = -2 - Math.random() * 60;
      }
      pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      pMat = new THREE.PointsMaterial({
        color: 0x88ccff,
        size: 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
      });
      points = new THREE.Points(pGeo, pMat);
      scene.add(points);
    }

    // Mask & Shadow Canvases
    const maskCanvas = document.createElement('canvas');
    const mCtx = maskCanvas.getContext('2d');
    const shadowCanvas = root.querySelector('#shadow-canvas');
    const sCtx = shadowCanvas.getContext('2d');
    const flatSite = root.querySelector('#flat-site');
    const tearShadow = root.querySelector('#tear-shadow');
    const revealOverlay = root.querySelector('#reveal-overlay');
    const revealTitle = root.querySelector('#reveal-title');
    const revealProject = root.querySelector('#reveal-project');
    const resetBtn = root.querySelector('#reset-btn');
    const hintEl = root.querySelector('#concept-label');

    let thresholdCrossed = false;
    let sampleTimer = 0;

    function updateMask() {
      const url = maskCanvas.toDataURL();
      const val = `url("${url}")`;
      flatSite.style.webkitMaskImage = val;
      flatSite.style.maskImage = val;
      tearShadow.style.webkitMaskImage = val;
      tearShadow.style.maskImage = val;
    }

    function resizeMask() {
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;
      maskCanvas.width = W;
      maskCanvas.height = H;
      shadowCanvas.width = W;
      shadowCanvas.height = H;
      mCtx.fillStyle = '#fff';
      mCtx.fillRect(0, 0, W, H);
      sCtx.clearRect(0, 0, W, H);
      updateMask();
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
      sCtx.fillStyle = 'rgba(0,0,0,0.45)';
      sCtx.fill();
      sCtx.restore();
    }

    function estimateTorn() {
      const sample = 1200;
      try {
        const data = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        let black = 0;
        const step = Math.floor(data.data.length / 4 / sample);
        for (let i = 0; i < sample; i++) {
          const idx = i * step * 4;
          if (data.data[idx + 3] < 128) black++;
        }
        return black / sample;
      } catch (_) {
        return 0;
      }
    }

    let gsapTweens = [];

    function triggerFullTear() {
      thresholdCrossed = true;
      mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      updateMask();

      const H = root.clientHeight || 640;
      const { gsap } = window;
      if (gsap) {
        const tw1 = gsap.to(flatSite, {
          duration: 0.7,
          opacity: 0,
          y: H * 0.06,
          scaleY: 0.92,
          filter: 'blur(8px)',
          ease: 'power3.in',
          onComplete: () => {
            flatSite.style.display = 'none';
            tearShadow.style.display = 'none';
          },
        });
        const tw2 = gsap.to(revealOverlay, { opacity: 1, duration: 0.1, delay: 0.5 });
        const tw3 = gsap.to(revealTitle, {
          scale: 1,
          duration: 1.1,
          delay: 0.55,
          ease: 'expo.out',
          filter: 'blur(0px)',
        });
        const tw4 = gsap.to(revealProject, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 1.0,
          ease: 'power2.out',
        });
        const tw5 = gsap.to(hintEl, { opacity: 0, duration: 0.4, delay: 0.4 });
        const tw6 = gsap.to(resetBtn, {
          opacity: 1,
          duration: 0.5,
          delay: 1.4,
          onComplete: () => { resetBtn.style.pointerEvents = 'auto'; },
        });
        gsapTweens.push(tw1, tw2, tw3, tw4, tw5, tw6);
      } else {
        flatSite.style.display = 'none';
        tearShadow.style.display = 'none';
        revealOverlay.style.opacity = '1';
        revealTitle.style.transform = 'scale(1)';
        revealProject.style.opacity = '1';
        revealProject.style.transform = 'translateY(0)';
        resetBtn.style.opacity = '1';
        resetBtn.style.pointerEvents = 'auto';
      }
    }

    const onResetClick = () => {
      thresholdCrossed = false;
      flatSite.style.display = '';
      tearShadow.style.display = '';
      const { gsap } = window;
      if (gsap) {
        const tw1 = gsap.to(flatSite, { opacity: 1, y: 0, scaleY: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power2.out' });
        const tw2 = gsap.to(revealOverlay, { opacity: 0, duration: 0.4 });
        const tw3 = gsap.to(revealTitle, { scale: 0.85, duration: 0.4 });
        gsap.set(revealProject, { opacity: 0, y: 10 });
        const tw4 = gsap.to(hintEl, { opacity: 1, duration: 0.5 });
        const tw5 = gsap.to(resetBtn, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => { resetBtn.style.pointerEvents = 'none'; },
        });
        gsapTweens.push(tw1, tw2, tw3, tw4, tw5);
      } else {
        flatSite.style.opacity = '1';
        revealOverlay.style.opacity = '0';
        resetBtn.style.opacity = '0';
        resetBtn.style.pointerEvents = 'none';
      }
      resizeMask();
    };
    resetBtn.addEventListener('click', onResetClick);

    // Pointer events for dragging tear
    let isDown = false;
    let lastX = -1, lastY = -1;
    let mouseX = 0, mouseY = 0;

    const onPointerDown = (e) => {
      isDown = true;
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastX = x;
      lastY = y;
      stampTear(x, y, 32 + Math.random() * 18);
      updateMask();
    };

    const onPointerMove = (e) => {
      const rect = root.getBoundingClientRect();
      const rw = rect.width || 1;
      const rh = rect.height || 1;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / rw) * 2 - 1;
      mouseY = (y / rh) * 2 - 1;

      if (!isDown || thresholdCrossed) return;

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
      lastX = x;
      lastY = y;

      sampleTimer++;
      if (sampleTimer % 6 === 0) {
        const torn = estimateTorn();
        if (torn > 0.55 && !thresholdCrossed) triggerFullTear();
      }
      updateMask();
    };

    const onPointerUp = () => {
      isDown = false;
      lastX = -1;
      lastY = -1;
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointerleave', onPointerUp);

    function resize() {
      if (cleanedUp) return;
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;
      if (renderer && camera) {
        camera.aspect = (W || 1) / (H || 1);
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      }
      if (!thresholdCrossed) resizeMask();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resizeMask();

    // Async GSAP load
    (async () => {
      try {
        await loadScript('../vendor/gsap.min.js');
      } catch (err) {
        console.error('[tear] GSAP load failed:', err);
      }
    })();

    const clock = new THREE.Clock();
    let tParX = 0, tParY = 0;

    function animate() {
      if (!visible || cleanedUp) {
        rafId = 0;
        return;
      }

      const t = clock.getElapsedTime();

      if (renderer && scene && camera) {
        tParX += (mouseX * 1.8 - tParX) * 0.04;
        tParY += (-mouseY * 1.0 - tParY) * 0.04;
        camera.position.x = tParX;
        camera.position.y = tParY;
        camera.lookAt(tParX * 0.3, tParY * 0.3, -8);

        if (tunnel) {
          tunnel.position.z = ((t * 2.2) % TUNNEL_LEN) - TUNNEL_LEN / 2 + 14;
        }

        shapes.forEach((s) => {
          s.rotation.x += s.userData.rx;
          s.rotation.y += s.userData.ry;
          s.position.y = s.userData.baseY
            + Math.sin(t * s.userData.floatSpd + s.userData.floatOff) * s.userData.floatAmp;
          s.material.color.setHSL(
            ((t * 0.08 + s.userData.floatOff * 0.15) % 1),
            0.85,
            0.58
          );
        });

        renderer.render(scene, camera);
      }

      rafId = requestAnimationFrame(animate);
    }

    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId && !cleanedUp) {
        rafId = requestAnimationFrame(animate);
        if (window.gsap) window.gsap.ticker.wake();
        gsapTweens.forEach((tw) => tw && tw.resume && tw.resume());
      }
      if (!visible && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        if (window.gsap) window.gsap.ticker.sleep();
        gsapTweens.forEach((tw) => tw && tw.pause && tw.pause());
      }
    }

    setVisible(true);

    return {
      setVisible,
      cleanup() {
        cleanedUp = true;
        setVisible(false);
        ro.disconnect();

        root.removeEventListener('pointerdown', onPointerDown);
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerup', onPointerUp);
        root.removeEventListener('pointerleave', onPointerUp);
        resetBtn.removeEventListener('click', onResetClick);

        gsapTweens.forEach((tw) => {
          try { tw.kill(); } catch (_) {}
        });

        const g = window.gsap;
        if (g) {
          g.ticker.sleep();
          window.gsap = undefined;
          setTimeout(() => { window.gsap = g; }, 50);
        }

        if (renderer) {
          if (tunnelGeo) tunnelGeo.dispose();
          if (tunnelMat) tunnelMat.dispose();
          shapes.forEach((s) => {
            if (s.userData.geo) s.userData.geo.dispose();
            if (s.userData.mat) s.userData.mat.dispose();
          });
          if (pGeo) pGeo.dispose();
          if (pMat) pMat.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
        }

        root.remove();
      },
    };
  },
};
