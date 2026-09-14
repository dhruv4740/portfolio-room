import * as THREE from '../vendor/three.module.js';
import content from '../shell/content.js';

export default {
  id: 'fluid',
  title: 'Flux',
  icon: '≈',
  width: 900,
  height: 640,

  mount(body) {
    let visible = false;
    let rafId = 0;
    let cleanedUp = false;

    const root = document.createElement('div');
    root.className = 'app-fluid';
    root.tabIndex = 0;
    body.appendChild(root);

    const fontSpace400 = new URL('../fonts/space-grotesk-400.woff2', import.meta.url).href;
    const fontSpace500 = new URL('../fonts/space-grotesk-500.woff2', import.meta.url).href;
    const fontSpace600 = new URL('../fonts/space-grotesk-600.woff2', import.meta.url).href;
    const fontSpace700 = new URL('../fonts/space-grotesk-700.woff2', import.meta.url).href;
    const fontJb400 = new URL('../fonts/jetbrains-mono-400.woff2', import.meta.url).href;
    const fontJb500 = new URL('../fonts/jetbrains-mono-500.woff2', import.meta.url).href;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Space Grotesk';
        src: url('${fontSpace400}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Space Grotesk';
        src: url('${fontSpace500}') format('woff2');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'Space Grotesk';
        src: url('${fontSpace600}') format('woff2');
        font-weight: 600;
        font-style: normal;
      }
      @font-face {
        font-family: 'Space Grotesk';
        src: url('${fontSpace700}') format('woff2');
        font-weight: 700;
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

      .app-fluid {
        --fg: #f3f1ff;
        --mut: rgba(243,241,255,.6);
        --glass: rgba(255,255,255,.06);
        --line: rgba(255,255,255,.16);

        position: relative;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        background: #05030f;
        color: var(--fg);
        font-family: "Space Grotesk", sans-serif;
        -webkit-font-smoothing: antialiased;
        cursor: none;
        scroll-behavior: smooth;
        outline: none;
      }

      .app-fluid *, .app-fluid *::before, .app-fluid *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .app-fluid a { color: inherit; }

      .app-fluid #gl {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
      }

      .app-fluid #cursor {
        position: absolute;
        top: 0;
        left: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,.9), rgba(255,255,255,0) 70%);
        transform: translate(-50%,-50%);
        pointer-events: none;
        z-index: 60;
        mix-blend-mode: screen;
        transition: width .2s, height .2s;
      }

      .app-fluid .content {
        position: relative;
        z-index: 10;
      }

      .app-fluid section {
        min-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8vh 5vw;
      }

      .app-fluid .glass {
        background: var(--glass);
        backdrop-filter: blur(22px) saturate(1.4);
        -webkit-backdrop-filter: blur(22px) saturate(1.4);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: 0 30px 80px rgba(0,0,0,.35);
      }

      .app-fluid .hero {
        flex-direction: column;
        text-align: center;
        gap: 26px;
        min-height: 100%;
      }

      .app-fluid .hero .card {
        padding: 44px 50px;
        max-width: 760px;
      }

      .app-fluid .hero .kick {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        letter-spacing: .34em;
        color: var(--mut);
        text-transform: uppercase;
        margin-bottom: 22px;
      }

      .app-fluid .hero h1 {
        font-size: clamp(38px, 6vw, 76px);
        font-weight: 600;
        letter-spacing: -.02em;
        line-height: .96;
      }

      .app-fluid .hero p {
        margin-top: 22px;
        font-size: clamp(14px, 1.5vw, 17px);
        color: var(--mut);
        line-height: 1.6;
      }

      .app-fluid .hint {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: .18em;
        color: var(--mut);
        text-transform: uppercase;
      }

      .app-fluid .bento {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 22px;
        width: min(1080px, 100%);
      }

      .app-fluid .reveal {
        opacity: 0;
        transform: translateY(40px);
        transition: opacity 1s ease, transform 1s cubic-bezier(.16, 1, .3, 1);
      }

      .app-fluid .reveal.in {
        opacity: 1;
        transform: none;
      }

      .app-fluid .b { padding: 30px; }
      .app-fluid .b h2 {
        font-size: 13px;
        font-family: "JetBrains Mono", monospace;
        letter-spacing: .2em;
        text-transform: uppercase;
        color: var(--mut);
        margin-bottom: 18px;
      }

      .app-fluid .b.about { grid-column: span 3; }
      .app-fluid .b.contact { grid-column: span 3; }
      .app-fluid .b.projects { grid-column: span 6; }

      @media (max-width: 700px) {
        .app-fluid .b.about { grid-column: span 6; }
        .app-fluid .b.contact { grid-column: span 6; }
      }

      .app-fluid .b.about p {
        font-size: clamp(16px, 2vw, 24px);
        font-weight: 500;
        line-height: 1.45;
        letter-spacing: -.01em;
      }

      .app-fluid .plist {
        display: flex;
        flex-direction: column;
      }

      .app-fluid .plist .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 16px 4px;
        border-top: 1px solid var(--line);
      }
      .app-fluid .plist .row:first-child { border-top: 0; }
      .app-fluid .plist .row .n {
        font-size: clamp(16px, 2vw, 22px);
        font-weight: 600;
      }
      .app-fluid .plist .row .d {
        font-size: 13px;
        color: var(--mut);
        max-width: 520px;
        text-align: right;
        line-height: 1.5;
      }
      .app-fluid .plist .row .a {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: var(--mut);
        white-space: nowrap;
      }

      .app-fluid .contact .links {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 6px;
      }
      .app-fluid .contact a {
        font-size: clamp(16px, 2vw, 22px);
        font-weight: 600;
        text-decoration: none;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--line);
        padding-bottom: 12px;
      }
      .app-fluid .contact a span {
        color: var(--mut);
        font-size: 12px;
        font-family: "JetBrains Mono", monospace;
        align-self: flex-end;
      }
      .app-fluid .contact a:hover { color: #fff; }

      .app-fluid .fallback {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        color: var(--mut);
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
        z-index: 5;
      }
    `;
    root.appendChild(style);

    const first3Projects = content.projects.slice(0, 3).map((p) => ({
      n: p.name,
      d: p.tagline,
      a: String(p.year),
    }));

    root.insertAdjacentHTML('beforeend', `
      <canvas id="gl"></canvas>
      <div id="cursor"></div>
      <div class="fallback" id="fallback">WebGL unavailable — the fluid backdrop can't render here.</div>

      <main class="content">
        <section class="hero">
          <div class="card glass">
            <div class="kick">${content.identity.name}</div>
            <h1>Calm surfaces,<br />living depth.</h1>
            <p>${content.identity.role} based in ${content.identity.location}. Move your cursor to stir the field.</p>
          </div>
          <div class="hint">↓ scroll</div>
        </section>

        <section>
          <div class="bento">
            <div class="b about glass reveal">
              <h2>About</h2>
              <p>${content.identity.statement}</p>
            </div>
            <div class="b contact glass reveal">
              <h2>Contact</h2>
              <div class="links">
                <a href="mailto:${content.contact.email}">Email <span>↗</span></a>
                <a href="${content.contact.github}" target="_blank" rel="noopener">GitHub <span>↗</span></a>
                <a href="${content.contact.linkedin}" target="_blank" rel="noopener">LinkedIn <span>↗</span></a>
              </div>
            </div>
            <div class="b projects glass reveal">
              <h2>Selected Projects</h2>
              <div class="plist" id="plist">
                ${first3Projects.map((p) => `
                  <div class="row">
                    <div class="n">${p.n}</div>
                    <div class="d">${p.d}</div>
                    <div class="a">${p.a}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
      </main>
    `);

    // Reveal on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { root: root, threshold: 0.15 });
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // Custom cursor
    const cur = root.querySelector('#cursor');
    const onPointerMoveCursor = (e) => {
      const rect = root.getBoundingClientRect();
      cur.style.left = (e.clientX - rect.left) + 'px';
      cur.style.top = (e.clientY - rect.top) + 'px';
    };
    root.addEventListener('pointermove', onPointerMoveCursor);

    // Three.js fluid shader setup
    const canvas = root.querySelector('#gl');
    let renderer = null;
    let scene = null;
    let camera = null;
    let geometry = null;
    let material = null;
    let uniforms = null;

    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    } catch (err) {
      const fb = root.querySelector('#fallback');
      if (fb) fb.style.display = 'flex';
    }

    const smouse = new THREE.Vector2(0.5, 0.5);

    if (renderer) {
      const initialW = root.clientWidth || 900;
      const initialH = root.clientHeight || 640;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(initialW, initialH);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      uniforms = {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(initialW, initialH) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uScroll: { value: 0 },
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `void main(){ gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          precision highp float;
          uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uScroll;

          float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
          float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
            float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
            return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
          mat2 m2 = mat2(1.6,1.2,-1.2,1.6);
          float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<6;i++){ s+=a*noise(p); p=m2*p; a*=0.5; } return s; }

          void main(){
            vec2 uv = gl_FragCoord.xy/uRes.xy;
            float asp = uRes.x/uRes.y;
            vec2 auv = vec2(uv.x*asp, uv.y);
            vec2 am = vec2(uMouse.x*asp, uMouse.y);
            float md = length(auv-am);

            float t = uTime*0.06;
            vec2 p = uv*2.4;
            p += normalize(auv-am+1e-5) * sin(md*26.0 - uTime*3.0) * exp(-md*4.5) * 0.12;

            vec2 q = vec2(fbm(p+vec2(0.0,0.0)+t), fbm(p+vec2(5.2,1.3)-t));
            vec2 r = vec2(fbm(p+2.0*q+vec2(1.7,9.2)+t*1.2), fbm(p+2.0*q+vec2(8.3,2.8)-t));
            float f = fbm(p+3.0*r);

            vec3 colA = mix(vec3(0.04,0.03,0.16), vec3(0.36,0.22,0.92), f);
            vec3 colB = mix(vec3(0.02,0.09,0.12), vec3(0.10,0.80,0.72), f);
            vec3 colC = mix(vec3(0.12,0.02,0.12), vec3(0.96,0.24,0.62), f);
            vec3 col = mix(colA, colB, smoothstep(0.0,0.5,uScroll));
            col = mix(col, colC, smoothstep(0.5,1.0,uScroll));

            col += 0.14*vec3(q.x, r.y, f);
            col += vec3(0.5,0.65,1.0) * exp(-md*5.0) * 0.28;

            col *= 1.0 - 0.55*pow(length(uv-0.5), 2.2);
            col += (hash(gl_FragCoord.xy+uTime)-0.5)*0.03;

            gl_FragColor = vec4(max(col,0.0), 1.0);
          }
        `,
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));
    }

    const onPointerMoveShader = (e) => {
      const rect = root.getBoundingClientRect();
      const rw = rect.width || 1;
      const rh = rect.height || 1;
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rw));
      const ny = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rh));
      smouse.set(nx, ny);
    };
    root.addEventListener('pointermove', onPointerMoveShader);

    function resize() {
      if (!renderer || cleanedUp) return;
      const W = root.clientWidth || 900;
      const H = root.clientHeight || 640;
      renderer.setSize(W, H);
      if (uniforms) uniforms.uRes.value.set(W, H);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const clock = new THREE.Clock();

    function loop() {
      if (!visible || cleanedUp) {
        rafId = 0;
        return;
      }
      if (renderer && uniforms && scene && camera) {
        uniforms.uTime.value = clock.getElapsedTime();
        uniforms.uMouse.value.lerp(smouse, 0.08);
        const max = Math.max(1, root.scrollHeight - root.clientHeight);
        uniforms.uScroll.value += (Math.min(1, root.scrollTop / max) - uniforms.uScroll.value) * 0.06;
        renderer.render(scene, camera);
      }
      rafId = requestAnimationFrame(loop);
    }

    function setVisible(next) {
      visible = Boolean(next);
      if (visible && !rafId && !cleanedUp) {
        rafId = requestAnimationFrame(loop);
      }
      if (!visible && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    setVisible(true);

    return {
      setVisible,
      cleanup() {
        cleanedUp = true;
        setVisible(false);
        ro.disconnect();
        io.disconnect();

        root.removeEventListener('pointermove', onPointerMoveCursor);
        root.removeEventListener('pointermove', onPointerMoveShader);

        if (renderer) {
          if (geometry) geometry.dispose();
          if (material) material.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
        }

        root.remove();
      },
    };
  },
};
