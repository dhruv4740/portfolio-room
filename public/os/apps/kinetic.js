import * as THREE from '../vendor/three.module.js';
import content from '../shell/content.js';

function loadScript(src) {
  return window.gsap && (!src.includes('ScrollTrigger') || window.ScrollTrigger)
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
  id: 'kinetic',
  title: 'Kinetic',
  icon: '↝',
  width: 900,
  height: 640,

  mount(body) {
    let visible = false;
    let rafId = 0;
    let cleanedUp = false;

    const root = document.createElement('div');
    root.className = 'app-kinetic';
    root.tabIndex = 0;
    body.appendChild(root);

    const fontAnton = new URL('../fonts/anton-400.woff2', import.meta.url).href;
    const fontJb400 = new URL('../fonts/jetbrains-mono-400.woff2', import.meta.url).href;
    const fontJb500 = new URL('../fonts/jetbrains-mono-500.woff2', import.meta.url).href;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Anton';
        src: url('${fontAnton}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'JetBrains Mono';
        src: url('${fontJb400}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'JetBrains Mono';
        src: url('${fontJb500}') format('woff2');
        font-weight: 500;
        font-style: normal;
      }

      .app-kinetic {
        --bg: #0b0b0c;
        --fg: #ECEAE4;
        --mut: #6b6b66;
        --acid: #c6ff3a;

        position: relative;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        background: var(--bg);
        color: var(--fg);
        font-family: "JetBrains Mono", monospace;
        -webkit-font-smoothing: antialiased;
        outline: none;
      }

      .app-kinetic *, .app-kinetic *::before, .app-kinetic *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .app-kinetic a { color: inherit; }

      .app-kinetic #gl {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }

      .app-kinetic .wrap {
        position: relative;
        z-index: 5;
        transform-origin: center top;
      }

      .app-kinetic .hero {
        min-height: 85%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 10vh 6vw 6vh;
      }
      .app-kinetic .kicker {
        font-size: 12px;
        letter-spacing: .3em;
        color: var(--mut);
        text-transform: uppercase;
        margin-bottom: 24px;
      }
      .app-kinetic .display {
        font-family: "Anton", sans-serif;
        font-weight: 400;
        line-height: .88;
        letter-spacing: -.01em;
        text-transform: uppercase;
        font-size: clamp(48px, 9vw, 120px);
      }
      .app-kinetic .line {
        overflow: hidden;
        display: block;
      }
      .app-kinetic .line span {
        display: block;
        will-change: transform;
      }
      .app-kinetic .display .acid { color: var(--acid); }
      .app-kinetic .sub {
        margin-top: 30px;
        max-width: 640px;
        font-size: clamp(13px, 1.4vw, 16px);
        line-height: 1.6;
        color: #b8b8b2;
      }
      .app-kinetic .scrollhint {
        margin-top: 40px;
        font-size: 11px;
        letter-spacing: .2em;
        color: var(--mut);
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .app-kinetic .scrollhint i {
        width: 34px;
        height: 1px;
        background: var(--mut);
        display: inline-block;
      }

      .app-kinetic .marquee {
        overflow: hidden;
        white-space: nowrap;
        border-top: 1px solid #1d1d1e;
        border-bottom: 1px solid #1d1d1e;
        padding: 16px 0;
        margin: 6vh 0;
      }
      .app-kinetic .marquee .track {
        display: inline-block;
        font-family: "Anton", sans-serif;
        font-size: clamp(24px, 4vw, 54px);
        text-transform: uppercase;
        letter-spacing: .02em;
        will-change: transform;
      }
      .app-kinetic .marquee .track span {
        padding: 0 24px;
        color: var(--fg);
      }
      .app-kinetic .marquee .track span:nth-child(even) {
        color: transparent;
        -webkit-text-stroke: 1px var(--mut);
      }

      .app-kinetic .projects { padding: 4vh 6vw 10vh; }
      .app-kinetic .sec-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        border-bottom: 1px solid #1d1d1e;
        padding-bottom: 16px;
        margin-bottom: 6vh;
      }
      .app-kinetic .sec-head h2 {
        font-family: "Anton", sans-serif;
        font-size: clamp(22px, 3vw, 40px);
        text-transform: uppercase;
        letter-spacing: .01em;
      }
      .app-kinetic .sec-head em {
        font-style: normal;
        color: var(--mut);
        font-size: 12px;
        letter-spacing: .1em;
      }

      .app-kinetic .proj {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5vw;
        align-items: center;
        margin-bottom: 12vh;
      }
      .app-kinetic .proj:nth-child(even) { grid-template-columns: 1fr 1fr; }
      .app-kinetic .proj:nth-child(even) .pmeta { order: 2; }
      .app-kinetic .proj:nth-child(even) .pimg { order: 1; }
      .app-kinetic .pimg {
        position: relative;
        width: 100%;
        aspect-ratio: 4/3;
        border: 1px solid #1d1d1e;
      }
      .app-kinetic .pmeta .idx {
        font-family: "Anton", sans-serif;
        font-size: clamp(36px, 6vw, 84px);
        color: transparent;
        -webkit-text-stroke: 1px #3a3a38;
        line-height: 1;
      }
      .app-kinetic .pmeta h3 {
        font-family: "Anton", sans-serif;
        font-size: clamp(24px, 3.5vw, 48px);
        text-transform: uppercase;
        margin: 10px 0 16px;
        line-height: .95;
      }
      .app-kinetic .pmeta p {
        max-width: 440px;
        font-size: 13px;
        line-height: 1.7;
        color: #a7a7a1;
      }
      .app-kinetic .pmeta .tags {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .app-kinetic .pmeta .tags b {
        font-weight: 400;
        font-size: 11px;
        letter-spacing: .08em;
        color: var(--mut);
        border: 1px solid #26261f;
        padding: 5px 10px;
        border-radius: 40px;
      }
      .app-kinetic .reveal { will-change: transform, opacity; }

      .app-kinetic .outro {
        min-height: 50vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 24px;
        border-top: 1px solid #1d1d1e;
        padding: 8vh 0;
      }
      .app-kinetic .outro .big {
        font-family: "Anton", sans-serif;
        font-size: clamp(36px, 8vw, 110px);
        text-transform: uppercase;
        line-height: .9;
      }
      .app-kinetic .outro .big .acid { color: var(--acid); }
      .app-kinetic .outro a.cta {
        pointer-events: auto;
        font-size: 12px;
        letter-spacing: .15em;
        text-transform: uppercase;
        color: var(--bg);
        background: var(--acid);
        padding: 14px 26px;
        border-radius: 40px;
        text-decoration: none;
        font-weight: 600;
        transition: transform .2s, opacity .2s;
      }
      .app-kinetic .outro a.cta:hover { transform: scale(1.05); opacity: 0.95; }

      .app-kinetic #grain {
        position: absolute;
        inset: -50%;
        z-index: 40;
        pointer-events: none;
        opacity: .05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        animation: app-grain 1.1s steps(3) infinite;
      }
      @keyframes app-grain {
        0% { transform: translate(0,0); }
        33% { transform: translate(-4%,3%); }
        66% { transform: translate(3%,-4%); }
        100% { transform: translate(0,0); }
      }
    `;
    root.appendChild(style);

    // Three-line kinetic layout for role
    const roleWords = (content.identity.role || 'Full-stack developer').split(' ');
    let line1 = '', line2 = '', line3 = '';
    if (roleWords.length >= 2) {
      line1 = roleWords.slice(0, -1).join(' ');
      line2 = '&amp;';
      line3 = `<span class="acid">${roleWords[roleWords.length - 1]}</span>`;
    } else {
      line1 = roleWords[0] || 'Developer';
      line2 = '';
      line3 = `<span class="acid">${roleWords[0] || 'Developer'}</span>`;
    }

    const totalProjects = content.projects.length;
    const counterText = `(01—${String(totalProjects).padStart(2, '0')})`;

    const hues = [
      [14, 1.0], [150, 0.7], [265, 0.8], [330, 0.85],
      [200, 0.9], [45, 0.95], [280, 0.75], [170, 0.8],
    ];

    root.insertAdjacentHTML('beforeend', `
      <canvas id="gl"></canvas>
      <div id="grain"></div>

      <div class="wrap" id="skewer">
        <section class="hero">
          <div class="kicker">${content.identity.name} — Portfolio</div>
          <h1 class="display">
            <span class="line"><span>${line1}</span></span>
            ${line2 ? `<span class="line"><span>${line2}</span></span>` : ''}
            <span class="line"><span>${line3}</span></span>
          </h1>
          <p class="sub">${content.identity.statement}</p>
          <div class="scrollhint"><i></i> scroll</div>
        </section>

        <div class="marquee"><div class="track" id="mq1"></div></div>

        <section class="projects">
          <div class="sec-head">
            <h2>Selected Work</h2>
            <em>${counterText}</em>
          </div>
          <div id="projlist"></div>
        </section>

        <div class="marquee"><div class="track" id="mq2"></div></div>

        <section class="outro">
          <div class="big reveal">Let's<br /><span class="acid">build</span> it.</div>
          <a class="cta" href="mailto:${content.contact.email}">Get in touch</a>
        </section>
      </div>
    `);

    // Marquee content
    const mq1 = root.querySelector('#mq1');
    const mq2 = root.querySelector('#mq2');
    const mqHTML = (txt) => Array.from({ length: 8 }).map(() => `<span>${txt}</span>`).join('');
    mq1.innerHTML = mqHTML('Selected Work');
    mq2.innerHTML = mqHTML(content.identity.name.toUpperCase());

    // Project rows
    const projlist = root.querySelector('#projlist');
    projlist.innerHTML = content.projects.map((p, i) => `
      <article class="proj">
        <div class="pmeta">
          <div class="idx reveal">${String(i + 1).padStart(2, '0')}</div>
          <h3 class="reveal">${p.name}</h3>
          <p class="reveal">${p.tagline}</p>
          <div class="tags reveal">
            ${(p.tech || []).slice(0, 4).map((t) => `<b>${t}</b>`).join('')}
          </div>
        </div>
        <div class="pimg" data-proj="${i}"></div>
      </article>
    `).join('');

    // Marquee drift tracks
    const tracks = [...root.querySelectorAll('.marquee .track')];
    let mqX = [0, 0];
    tracks.forEach((t) => { t.innerHTML += t.innerHTML; });

    // Scroll tracking & velocity
    let scrollVel = 0;
    let lastScrollTop = 0;
    let lastScrollTime = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastScrollTime);
      const st = root.scrollTop;
      scrollVel = ((st - lastScrollTop) / dt) * 16;
      lastScrollTop = st;
      lastScrollTime = now;
      canvas.style.transform = `translateY(${st}px)`;
      const grain = root.querySelector('#grain');
      if (grain) grain.style.transform = `translateY(${st}px)`;
      if (window.ScrollTrigger) window.ScrollTrigger.update();
    };
    root.addEventListener('scroll', onScroll, { passive: true });

    // Three.js WebGL layer
    const canvas = root.querySelector('#gl');
    let renderer = null;
    let scene = null;
    let camera = null;
    let planes = [];
    let setSkew = null;
    let gsapTweens = [];
    let stInstances = [];

    function makeTexture(name, hue, sat) {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 768;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 1024, 768);
      g.addColorStop(0, `hsl(${hue}, ${Math.round(sat * 70)}%, 16%)`);
      g.addColorStop(0.55, `hsl(${(hue + 24) % 360}, ${Math.round(sat * 80)}%, 30%)`);
      g.addColorStop(1, `hsl(${(hue + 50) % 360}, ${Math.round(sat * 60)}%, 10%)`);
      x.fillStyle = g;
      x.fillRect(0, 0, 1024, 768);

      x.strokeStyle = 'rgba(255,255,255,0.05)';
      x.lineWidth = 1;
      for (let i = 64; i < 1024; i += 64) {
        x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 768); x.stroke();
      }
      for (let j = 64; j < 768; j += 64) {
        x.beginPath(); x.moveTo(0, j); x.lineTo(1024, j); x.stroke();
      }

      x.fillStyle = 'rgba(236,234,228,0.92)';
      x.font = '600 64px "JetBrains Mono", monospace';
      x.textBaseline = 'bottom';
      const words = name.toUpperCase().split(' ');
      let yy = 700;
      for (let k = words.length - 1; k >= 0; k--) {
        x.fillText(words[k], 48, yy);
        yy -= 70;
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const vert = `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `;
    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform float uVel;
      uniform float uTime;
      void main(){
        vec2 uv = vUv;
        vec2 d = uv - uMouse;
        float dist = length(d);
        float wave = sin(dist*22.0 - uTime*3.0) * 0.018 * uHover * smoothstep(0.6,0.0,dist);
        uv += normalize(d + 1e-5) * wave;
        float v = clamp(uVel*0.018, -0.25, 0.25);
        uv.y += (uv.y-0.5) * v * 0.4;
        float shift = (abs(v)*0.5 + uHover*0.12) * 0.04 + 0.002;
        float r = texture2D(uTex, uv + vec2(shift,0.0)).r;
        float g = texture2D(uTex, uv).g;
        float b = texture2D(uTex, uv - vec2(shift,0.0)).b;
        vec3 col = vec3(r,g,b);
        col += uHover * 0.06;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const PERSPECTIVE = 1000;
    function makeCamera(W, H) {
      const fov = 2 * Math.atan((H / 2) / PERSPECTIVE) * 180 / Math.PI;
      const cam = new THREE.PerspectiveCamera(fov, (W || 1) / (H || 1), 1, 4000);
      cam.position.z = PERSPECTIVE;
      return cam;
    }

    function initThree() {
      let W = root.clientWidth || 900;
      let H = root.clientHeight || 640;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(W, H);

      scene = new THREE.Scene();
      camera = makeCamera(W, H);

      planes = [];
      root.querySelectorAll('.pimg').forEach((el) => {
        const i = +el.dataset.proj;
        const p = content.projects[i];
        const h = hues[i % hues.length];
        const tex = makeTexture(p.name, h[0], h[1]);
        const mat = new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms: {
            uTex: { value: tex },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uHover: { value: 0 },
            uVel: { value: 0 },
            uTime: { value: 0 },
          },
        });
        const geo = new THREE.PlaneGeometry(1, 1, 32, 32);
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const rec = { el, mesh, mat, geo, tex, hoverTarget: 0 };
        planes.push(rec);

        el.style.pointerEvents = 'auto';
        const onEnter = () => { rec.hoverTarget = 1; };
        const onLeave = () => { rec.hoverTarget = 0; };
        const onMove = (e) => {
          const r = el.getBoundingClientRect();
          rec.mat.uniforms.uMouse.value.set(
            (e.clientX - r.left) / r.width,
            1 - (e.clientY - r.top) / r.height
          );
        };
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('pointermove', onMove);

        rec.cleanupListeners = () => {
          el.removeEventListener('pointerenter', onEnter);
          el.removeEventListener('pointerleave', onLeave);
          el.removeEventListener('pointermove', onMove);
        };
      });
    }

    function layout() {
      if (!renderer || cleanedUp) return;
      const rootRect = root.getBoundingClientRect();
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;

      const st = root.scrollTop;
      canvas.style.transform = `translateY(${st}px)`;
      const grain = root.querySelector('#grain');
      if (grain) grain.style.transform = `translateY(${st}px)`;

      for (const { el, mesh } of planes) {
        const r = el.getBoundingClientRect();
        mesh.scale.set(r.width, r.height, 1);
        mesh.position.set(
          r.left - rootRect.left + r.width / 2 - W / 2,
          -(r.top - rootRect.top + r.height / 2 - H / 2),
          0
        );
      }
    }

    function resize() {
      if (!renderer || cleanedUp) return;
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;
      renderer.setSize(W, H);
      camera = makeCamera(W, H);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      layout();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(root);

    // Async GSAP loader and initialization
    (async () => {
      try {
        await loadScript('../vendor/gsap.min.js');
        await loadScript('../vendor/ScrollTrigger.min.js');
        if (cleanedUp) return;

        initThree();
        layout();

        const { gsap } = window;
        if (gsap && window.ScrollTrigger) {
          gsap.registerPlugin(window.ScrollTrigger);

          setSkew = gsap.quickTo(root.querySelector('#skewer'), 'skewY', { duration: 0.5, ease: 'power3.out' });

          const heroTween1 = gsap.set(root.querySelectorAll('.display .line span'), { yPercent: 115 });
          const heroTween2 = gsap.to(root.querySelectorAll('.display .line span'), {
            yPercent: 0,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.09,
            delay: 0.15,
          });
          const heroTween3 = gsap.from(root.querySelectorAll('.kicker, .sub, .scrollhint'), {
            opacity: 0,
            y: 20,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.08,
            delay: 0.5,
          });
          gsapTweens.push(heroTween1, heroTween2, heroTween3);

          root.querySelectorAll('.reveal').forEach((el, idx) => {
            const st = window.ScrollTrigger.create({
              id: `kinetic-${idx}`,
              trigger: el,
              scroller: root,
              start: 'top 88%',
              animation: gsap.from(el, { yPercent: 40, opacity: 0, duration: 1, ease: 'power3.out' }),
            });
            stInstances.push(st);
          });
        }
      } catch (err) {
        console.error('[kinetic] initialization error:', err);
      }
    })();

    const clock = new THREE.Clock();

    function loop() {
      if (!visible || cleanedUp) {
        rafId = 0;
        return;
      }

      const t = clock.getElapsedTime();

      if (setSkew && window.gsap) {
        setSkew(window.gsap.utils.clamp(-7, 7, scrollVel * 0.6));
      }

      tracks.forEach((tr, i) => {
        mqX[i] -= (0.6 + Math.abs(scrollVel) * 0.06) * (i ? -1 : 1);
        const half = tr.scrollWidth / 2;
        if (Math.abs(mqX[i]) > half) mqX[i] = 0;
        tr.style.transform = `translateX(${mqX[i]}px)`;
      });

      layout();

      for (const rec of planes) {
        rec.mat.uniforms.uHover.value += (rec.hoverTarget - rec.mat.uniforms.uHover.value) * 0.12;
        rec.mat.uniforms.uVel.value = scrollVel;
        rec.mat.uniforms.uTime.value = t;
      }
      scrollVel *= 0.9;

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      rafId = requestAnimationFrame(loop);
    }

    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId && !cleanedUp) {
        rafId = requestAnimationFrame(loop);
        gsapTweens.forEach((t) => t && t.resume && t.resume());
      }
      if (!visible && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        gsapTweens.forEach((t) => t && t.pause && t.pause());
      }
    }

    setVisible(true);

    return {
      setVisible,
      cleanup() {
        cleanedUp = true;
        setVisible(false);
        ro.disconnect();
        root.removeEventListener('scroll', onScroll);

        stInstances.forEach((st) => {
          try { st.kill(); } catch (_) {}
        });
        if (window.ScrollTrigger) {
          window.ScrollTrigger.getAll().forEach((st) => {
            if (st.vars?.id && typeof st.vars.id === 'string' && st.vars.id.startsWith('kinetic-')) {
              try { st.kill(); } catch (_) {}
            }
          });
        }

        gsapTweens.forEach((t) => {
          try { t.kill(); } catch (_) {}
        });

        planes.forEach((rec) => {
          if (rec.cleanupListeners) rec.cleanupListeners();
          if (rec.geo) rec.geo.dispose();
          if (rec.mat) rec.mat.dispose();
          if (rec.tex) rec.tex.dispose();
        });

        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss();
        }

        root.remove();
      },
    };
  },
};
