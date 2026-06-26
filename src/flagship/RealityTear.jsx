import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Reduced-motion fallback — static dark gradient, no animation.
function StaticFallback() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at 50% 40%, #0d1a2a 0%, #070708 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <span
        style={{
          font: "700 clamp(24px,6vw,72px)/1 'JetBrains Mono', monospace",
          letterSpacing: '0.14em',
          color: '#38e1ff',
          textShadow: '0 0 40px rgba(56,225,255,0.5)',
        }}
      >
        DHRUV KOTHARI
      </span>
      <span
        style={{
          font: "400 12px/1 'JetBrains Mono', monospace",
          letterSpacing: '0.28em',
          color: 'rgba(160,107,255,0.8)',
          textTransform: 'uppercase',
        }}
      >
        Developer &amp; Builder
      </span>
    </div>
  );
}

export default function RealityTear({ onTorn }) {
  const containerRef = useRef(null);
  const tornFiredRef = useRef(false);

  // Respect prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return;

    const container = containerRef.current;
    if (!container) return;

    // ── WebGL guard ───────────────────────────────────────────────
    function isWebGLOk() {
      try {
        const c = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (c.getContext('webgl') || c.getContext('experimental-webgl'))
        );
      } catch (_) {
        return false;
      }
    }
    if (!isWebGLOk()) return;

    // ── State ─────────────────────────────────────────────────────
    let thresholdCrossed = false;
    let isDown = false;
    let lastX = -1;
    let lastY = -1;
    let mouseX = 0;
    let mouseY = 0;
    let sampleTimer = 0;
    let rafId = null;
    let tParX = 0;
    let tParY = 0;

    // ── THREE renderer ────────────────────────────────────────────
    const DPR = Math.min(window.devicePixelRatio, 1.5);

    const canvas3d = document.createElement('canvas');
    canvas3d.style.cssText =
      'position:absolute;inset:0;z-index:1;display:block;width:100%;height:100%;';
    container.appendChild(canvas3d);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas3d,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(DPR);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000510, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000510, 0.018);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 0, 14);

    // ── Grid tunnel ───────────────────────────────────────────────
    const TUNNEL_LEN = 120;
    const tunnelGeo = new THREE.CylinderGeometry(10, 10, TUNNEL_LEN, 40, 80, true);
    const tunnelMat = new THREE.MeshBasicMaterial({
      color: 0x0033ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.z = -TUNNEL_LEN / 2 + 14;
    scene.add(tunnel);

    // ── Lights ────────────────────────────────────────────────────
    const lightDefs = [
      [0x4488ff, 0, 3, -5],
      [0xff44aa, -6, -2, -8],
      [0x44ffcc, 6, 2, -6],
      [0xffaa22, 0, -5, -10],
    ];
    const pointLights = lightDefs.map(([col, x, y, z]) => {
      const l = new THREE.PointLight(col, 3, 35);
      l.position.set(x, y, z);
      scene.add(l);
      return l;
    });
    const ambientLight = new THREE.AmbientLight(0x112233, 0.6);
    scene.add(ambientLight);

    // ── Floating shapes ───────────────────────────────────────────
    const shapes = [];
    const shapeMeshes = [];
    const shapeGeos = [];
    const shapeMats = [];

    for (let i = 0; i < 14; i++) {
      const r = 0.3 + Math.random() * 1.1;
      let geo;
      if (i % 3 === 0) geo = new THREE.IcosahedronGeometry(r, 1);
      else if (i % 3 === 1) geo = new THREE.OctahedronGeometry(r, 0);
      else geo = new THREE.TetrahedronGeometry(r, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
        metalness: 1.0,
        roughness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8.4,
        -4 - Math.random() * 20,
      );
      mesh.userData = {
        rx: (Math.random() - 0.5) * 0.008,
        ry: (Math.random() - 0.5) * 0.012,
        floatAmp: 0.3 + Math.random() * 0.5,
        floatSpd: 0.4 + Math.random() * 0.6,
        floatOff: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
      };
      scene.add(mesh);
      shapes.push(mesh.userData);
      shapeMeshes.push(mesh);
      shapeGeos.push(geo);
      shapeMats.push(mat);
    }

    // ── Particle field ────────────────────────────────────────────
    const PARTS = 1600;
    const pPositions = new Float32Array(PARTS * 3);
    for (let i = 0; i < PARTS; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 40;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pPositions[i * 3 + 2] = -2 - Math.random() * 60;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Mask canvas ───────────────────────────────────────────────
    const maskCanvas = document.createElement('canvas');
    const mCtx = maskCanvas.getContext('2d');

    // ── Flat site DOM layer ───────────────────────────────────────
    const flatSite = document.createElement('div');
    flatSite.style.cssText =
      'position:absolute;inset:0;z-index:3;background:#f4f3ee;user-select:none;transition:opacity 0.3s ease;';
    flatSite.innerHTML = `
      <div style="max-width:680px;margin:0 auto;padding:80px 32px 64px;pointer-events:none;">
        <nav style="display:flex;align-items:center;justify-content:space-between;margin-bottom:80px;">
          <span style="font:600 13px/1 Arial,sans-serif;letter-spacing:0.08em;color:#1a1a1a;text-transform:uppercase;">Dhruv Kothari</span>
          <div style="display:flex;gap:28px;">
            <span style="font:400 12px/1 Arial,sans-serif;color:#888;">Work</span>
            <span style="font:400 12px/1 Arial,sans-serif;color:#888;">About</span>
            <span style="font:400 12px/1 Arial,sans-serif;color:#888;">Contact</span>
          </div>
        </nav>
        <div style="margin-bottom:72px;">
          <h1 style="font:300 52px/1.05 Georgia,serif;color:#1a1a1a;letter-spacing:-0.02em;margin-bottom:20px;">Dhruv<br>Kothari</h1>
          <p style="font:400 15px/1.65 Arial,sans-serif;color:#555;max-width:440px;">Developer &amp; designer interested in interfaces, systems, and the space between them. Based in Mumbai.</p>
        </div>
        <div style="font:600 10px/1 Arial,sans-serif;letter-spacing:0.18em;color:#bbb;text-transform:uppercase;margin-bottom:24px;">Selected Work</div>
        <ul style="list-style:none;">
          <li style="display:flex;align-items:baseline;justify-content:space-between;padding:16px 0;border-top:1px solid #e8e6e0;border-bottom:1px solid #e8e6e0;">
            <span style="font:500 15px/1 Georgia,serif;color:#1a1a1a;">Reddit Growth Copilot</span><span style="font:400 11px/1 Arial,sans-serif;color:#bbb;">2024</span>
          </li>
          <li style="display:flex;align-items:baseline;justify-content:space-between;padding:16px 0;border-bottom:1px solid #e8e6e0;">
            <span style="font:500 15px/1 Georgia,serif;color:#1a1a1a;">dhruvOS</span><span style="font:400 11px/1 Arial,sans-serif;color:#bbb;">2026</span>
          </li>
        </ul>
        <div style="height:1px;background:#e0ddd6;margin:48px 0;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font:400 11px/1 Arial,sans-serif;color:#bbb;">dhruvkothari13062006@gmail.com</span>
          <span style="font:400 11px/1 Arial,sans-serif;color:#bbb;">© 2026</span>
        </div>
      </div>
    `;
    container.appendChild(flatSite);

    // ── Hint label ────────────────────────────────────────────────
    const hintEl = document.createElement('div');
    hintEl.style.cssText =
      'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:9;text-align:center;pointer-events:none;transition:opacity 0.4s;';
    hintEl.innerHTML = `
      <div style="font:700 10px/1 'JetBrains Mono',monospace;letter-spacing:0.25em;color:rgba(255,255,255,0.35);">REALITY TEAR</div>
      <div style="font:400 10px/1.6 'JetBrains Mono',monospace;color:rgba(255,255,255,0.2);letter-spacing:0.1em;margin-top:4px;">drag across the page to tear reality open</div>
    `;
    container.appendChild(hintEl);

    // ── Reveal overlay ────────────────────────────────────────────
    const revealOverlay = document.createElement('div');
    revealOverlay.style.cssText =
      'position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity 0.1s;';
    revealOverlay.innerHTML = `
      <div id="rt-reveal-title" style="font:700 clamp(36px,7vw,96px)/1 'JetBrains Mono',monospace;letter-spacing:0.12em;color:#fff;text-shadow:0 0 60px rgba(56,225,255,0.6),0 0 120px rgba(160,107,255,0.3);mix-blend-mode:screen;transform:scale(0.85);transition:transform 1.1s cubic-bezier(0.16,1,0.3,1);">DHRUV KOTHARI</div>
      <div id="rt-reveal-sub" style="margin-top:20px;font:400 13px/1 'JetBrains Mono',monospace;letter-spacing:0.28em;color:rgba(56,225,255,0.7);text-transform:uppercase;opacity:0;transform:translateY(10px);transition:opacity 0.8s ease,transform 0.8s ease;">Developer &amp; Builder — Mumbai</div>
    `;
    container.appendChild(revealOverlay);

    // ── Mask helpers ──────────────────────────────────────────────
    function applyMask() {
      const url = maskCanvas.toDataURL();
      const val = `url("${url}")`;
      flatSite.style.webkitMaskImage = val;
      flatSite.style.maskImage = val;
      flatSite.style.webkitMaskSize = '100% 100%';
      flatSite.style.maskSize = '100% 100%';
    }

    function resizeMask() {
      maskCanvas.width = container.clientWidth;
      maskCanvas.height = container.clientHeight;
      mCtx.fillStyle = '#fff';
      mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      applyMask();
    }

    // ── Tear stamp ────────────────────────────────────────────────
    function stampTear(x, y, radius) {
      const pts = 11 + Math.floor(Math.random() * 8);
      mCtx.save();
      mCtx.globalCompositeOperation = 'destination-out';
      mCtx.translate(x, y);
      mCtx.beginPath();
      for (let i = 0; i < pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const jag = 0.45 + Math.random() * 0.6;
        const rx =
          radius * (0.5 + Math.random() * 0.9) * jag * (1 + 0.4 * Math.cos(angle * 3.7));
        const ry =
          radius * (0.5 + Math.random() * 0.9) * jag * (1 + 0.4 * Math.sin(angle * 2.3));
        const px = Math.cos(angle + Math.random() * 0.5) * rx;
        const py = Math.sin(angle + Math.random() * 0.5) * ry;
        i === 0 ? mCtx.moveTo(px, py) : mCtx.lineTo(px, py);
      }
      mCtx.closePath();
      mCtx.fillStyle = '#000';
      mCtx.fill();
      mCtx.restore();
    }

    // ── Torn fraction sampler ─────────────────────────────────────
    function estimateTorn() {
      const sample = 1200;
      const data = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      let black = 0;
      const step = Math.max(1, Math.floor(data.data.length / 4 / sample));
      for (let i = 0; i < sample; i++) {
        const idx = i * step * 4;
        if (data.data[idx + 3] < 128) black++;
      }
      return black / sample;
    }

    // ── Full-tear escalation (CSS transitions instead of GSAP) ────
    function triggerFullTear() {
      thresholdCrossed = true;
      mCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      applyMask();

      // Shatter flat site
      flatSite.style.transition =
        'opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease';
      flatSite.style.opacity = '0';
      flatSite.style.transform = 'translateY(4%) scaleY(0.92)';
      flatSite.style.filter = 'blur(8px)';
      setTimeout(() => {
        flatSite.style.display = 'none';
      }, 700);

      // Fade hint
      hintEl.style.opacity = '0';

      // Reveal overlay
      setTimeout(() => {
        revealOverlay.style.opacity = '1';
        const titleEl = revealOverlay.querySelector('#rt-reveal-title');
        if (titleEl) titleEl.style.transform = 'scale(1)';
      }, 500);
      setTimeout(() => {
        const subEl = revealOverlay.querySelector('#rt-reveal-sub');
        if (subEl) {
          subEl.style.opacity = '1';
          subEl.style.transform = 'translateY(0)';
        }
      }, 1000);

      // Fire onTorn callback once
      if (onTorn && !tornFiredRef.current) {
        tornFiredRef.current = true;
        setTimeout(onTorn, 1200);
      }
    }

    // ── Pointer handlers ──────────────────────────────────────────
    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / container.clientWidth) * 2 - 1;
      mouseY = (y / container.clientHeight) * 2 - 1;

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
        if (torn > 0.55) triggerFullTear();
      }
      applyMask();
    }

    function onPointerDown(e) {
      isDown = true;
      const rect = container.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      stampTear(lastX, lastY, 32 + Math.random() * 18);
      applyMask();
    }
    function onPointerUp() {
      isDown = false;
      lastX = -1;
      lastY = -1;
    }

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);

    // ── Animation loop ────────────────────────────────────────────
    const startTime = performance.now();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) / 1000;

      tParX += (mouseX * 1.8 - tParX) * 0.04;
      tParY += (-mouseY * 1.0 - tParY) * 0.04;
      camera.position.x = tParX;
      camera.position.y = tParY;
      camera.lookAt(tParX * 0.3, tParY * 0.3, -8);

      tunnel.position.z = ((t * 2.2) % TUNNEL_LEN) - TUNNEL_LEN / 2 + 14;

      shapeMeshes.forEach((mesh, i) => {
        const ud = shapes[i];
        mesh.rotation.x += ud.rx;
        mesh.rotation.y += ud.ry;
        mesh.position.y =
          ud.baseY + Math.sin(t * ud.floatSpd + ud.floatOff) * ud.floatAmp;
        mesh.material.color.setHSL(
          ((t * 0.08 + ud.floatOff * 0.15) % 1),
          0.85,
          0.58,
        );
      });

      renderer.render(scene, camera);
    }
    animate();

    // ── Resize ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (!thresholdCrossed) resizeMask();
    });
    ro.observe(container);

    // ── Init ──────────────────────────────────────────────────────
    resizeMask();

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerUp);

      // Dispose THREE objects
      tunnelGeo.dispose();
      tunnelMat.dispose();
      shapeGeos.forEach((g) => g.dispose());
      shapeMats.forEach((m) => m.dispose());
      pGeo.dispose();
      pMat.dispose();
      pointLights.forEach((l) => scene.remove(l));
      scene.remove(ambientLight);
      renderer.dispose();

      // Remove DOM nodes we created
      if (container.contains(canvas3d)) container.removeChild(canvas3d);
      if (container.contains(flatSite)) container.removeChild(flatSite);
      if (container.contains(hintEl)) container.removeChild(hintEl);
      if (container.contains(revealOverlay)) container.removeChild(revealOverlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (prefersReduced) {
    return (
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        <StaticFallback />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000510',
        cursor: 'crosshair',
      }}
    />
  );
}
