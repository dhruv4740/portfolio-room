// src/routes/Anthology.jsx
// Single smooth-scroll page: 5 full-bleed effect sections.
// NO Nav rendered. No external deps beyond lenis + gsap (already installed).
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { identity, contact, skills } from '../content/index.js';

gsap.registerPlugin(ScrollTrigger);

/* ─── palette / font (mirrors Nav.jsx / kinetic.html) ─── */
const C = {
  bg:     '#0b0b0c',
  fg:     '#ECEAE4',
  mut:    '#6b6b66',
  acid:   '#c6ff3a',
  chipBg: '#1a1a1f',
  edge:   '#2e2e38',
  font:   "'JetBrains Mono', ui-monospace, monospace",
};

/* ─── prefers-reduced-motion check ─── */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ════════════════════════════════════════════════════════
   SECTION 1 — Particle Hero
   Canvas 2D particle cloud that forms identity.name text,
   then floats. No WebGL/Three.js — pure 2D Canvas.
   ════════════════════════════════════════════════════════ */
function ParticleHero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W, H, raf, observer;
    let particles = [];
    let running = false;
    const MAX_PARTICLES = 600;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.scale(DPR, DPR);
      if (!reduced) buildParticles();
    }

    function sampleText(text) {
      // offscreen canvas to sample pixel positions
      const OW = Math.min(W, 512), OH = 140;
      const oc = document.createElement('canvas');
      oc.width = OW; oc.height = OH;
      const ox = oc.getContext('2d');
      ox.fillStyle = '#fff';
      const fs = text.length > 10 ? 52 : 76;
      ox.font = `bold ${fs}px monospace`;
      ox.textAlign = 'center';
      ox.textBaseline = 'middle';
      ox.fillText(text, OW / 2, OH / 2);
      const data = ox.getImageData(0, 0, OW, OH).data;
      const pts = [];
      const step = 4;
      for (let y = 0; y < OH; y += step) {
        for (let x = 0; x < OW; x += step) {
          if (data[(y * OW + x) * 4 + 3] > 128) {
            pts.push([
              (x / OW - 0.5) * W * 0.9 + W * 0.5,
              (y / OH - 0.5) * OH * 1.2 + H * 0.5,
            ]);
          }
        }
      }
      return pts;
    }

    function buildParticles() {
      const pts = sampleText(identity.name);
      const count = Math.min(pts.length, MAX_PARTICLES);
      particles = [];
      for (let i = 0; i < count; i++) {
        const [tx, ty] = pts[i % pts.length];
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          tx, ty,
          vx: 0, vy: 0,
          r: Math.random() * 1.4 + 0.4,
          speed: 0.045 + Math.random() * 0.035,
          // cyan → violet
          hue: Math.random() > 0.5 ? 188 : 265,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function tick(now) {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      ctx.clearRect(0, 0, W, H);
      // background
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const t = now * 0.001;
      for (const p of particles) {
        // spring to target + tiny drift
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * 0.06 + Math.sin(t * 0.7 + p.phase) * 0.18;
        p.vy += dy * 0.06 + Math.cos(t * 0.5 + p.phase) * 0.18;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x  += p.vx;
        p.y  += p.vy;

        const speed = Math.hypot(p.vx, p.vy);
        const alpha = 0.55 + Math.min(speed * 0.15, 0.45);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 188
          ? `rgba(56,225,255,${alpha})`
          : `rgba(160,107,255,${alpha})`;
        ctx.fill();
      }
    }

    function startLoop() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }
    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduced) {
      // Static render: just draw the text
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.fg;
      ctx.font = `bold 64px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(identity.name, W / 2, H / 2);
      return () => { window.removeEventListener('resize', resize); };
    }

    observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? startLoop() : stopLoop(); },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section style={styles.section}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {/* Text overlay — visible even without canvas */}
      <div style={styles.heroOverlay}>
        <p style={styles.kicker}>{identity.role}</p>
        <p style={styles.tagline}>{identity.tagline}</p>
        <p style={styles.scrollHint}>↓ scroll</p>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   SECTION 2 — Kinetic Typography
   Words slide/clip in reaction to scroll position via GSAP.
   ════════════════════════════════════════════════════════ */
const KINETIC_LINES = [
  { text: 'Designer',     accent: false },
  { text: '& Developer',  accent: true  },
  { text: 'of the web.',  accent: false },
];

function KineticSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    if (!section) return;

    const spans = section.querySelectorAll('.k-line-inner');
    const triggers = [];

    spans.forEach((span, i) => {
      gsap.set(span, { yPercent: 110 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 30%',
          scrub: false,
        },
      });
      tl.to(span, {
        yPercent: 0,
        duration: 1.1,
        ease: 'expo.out',
        delay: i * 0.1,
      });
      // collect for cleanup
      triggers.push(tl.scrollTrigger);
    });

    // marquee row
    const marquee = section.querySelector('.k-marquee-track');
    if (marquee) {
      let x = 0;
      let mRaf;
      let mRunning = false;
      const half = () => marquee.scrollWidth / 2;

      const mObs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          mRunning = true;
          const loop = () => {
            if (!mRunning) return;
            x -= 0.8;
            if (Math.abs(x) > half()) x = 0;
            marquee.style.transform = `translateX(${x}px)`;
            mRaf = requestAnimationFrame(loop);
          };
          mRaf = requestAnimationFrame(loop);
        } else {
          mRunning = false;
          cancelAnimationFrame(mRaf);
        }
      }, { threshold: 0.05 });
      mObs.observe(section);

      return () => {
        mRunning = false;
        cancelAnimationFrame(mRaf);
        mObs.disconnect();
        triggers.forEach(t => t && t.kill());
      };
    }

    return () => { triggers.forEach(t => t && t.kill()); };
  }, []);

  const marqueeWords = Array.from({ length: 12 }, (_, i) =>
    i % 2 === 0 ? 'Selected Work' : 'Available 2026'
  );

  return (
    <section ref={sectionRef} style={{ ...styles.section, background: C.bg, padding: '0 6vw', justifyContent: 'center' }}>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <p style={styles.kicker}>Dhruv Kothari — Portfolio</p>
        <h2 style={styles.display}>
          {KINETIC_LINES.map(({ text, accent }, i) => (
            <span
              key={i}
              className="k-line"
              style={{ overflow: 'hidden', display: 'block' }}
            >
              <span
                className="k-line-inner"
                style={{
                  display: 'block',
                  color: accent ? C.acid : C.fg,
                }}
              >
                {text}
              </span>
            </span>
          ))}
        </h2>
        <p style={{ ...styles.sub, marginTop: 32 }}>
          I build fast, expressive interfaces and interactive experiences.
          Scroll to move through it.
        </p>
      </div>

      {/* Marquee */}
      <div style={styles.marqueeWrap}>
        <div className="k-marquee-track" style={styles.marqueeTrack}>
          {marqueeWords.map((w, i) => (
            <span key={i} style={{
              padding: '0 28px',
              color: i % 2 === 0 ? C.fg : 'transparent',
              WebkitTextStroke: i % 2 !== 0 ? `1px ${C.mut}` : undefined,
            }}>
              {w}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   SECTION 3 — Gravity / Skill Chips
   Canvas 2D physics simulation WITHOUT Matter.js.
   Simple Euler integration with gravity + wall bounce.
   ════════════════════════════════════════════════════════ */
function GravitySection() {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W, H, raf, running = false, observer;

    const CHIP_H = 34;
    const PAD_X  = 18;
    const RADIUS  = 7;
    const GRAV    = 0.35;
    const RESTITUTION = 0.42;
    const FRICTION = 0.88;
    const FONT_MAIN = `600 12px ${C.font}`;

    // accent set matches gravity.html
    const ACCENT_IDS = new Set(['react', 'three', 'webgl', 'gsap', 'canvas']);

    let chips = [];

    function measureW(label) {
      ctx.save();
      ctx.font = FONT_MAIN;
      const tw = ctx.measureText(label).width;
      ctx.restore();
      return tw + PAD_X * 2;
    }

    function buildChips() {
      chips = skills.map(skill => {
        const cw = Math.max(measureW(skill.label), 70);
        const isAccent = ACCENT_IDS.has(skill.id);
        return {
          label: skill.label,
          isAccent,
          w: cw,
          h: CHIP_H,
          x: PAD_X + Math.random() * Math.max(0, W - cw - PAD_X * 2),
          y: -CHIP_H * 2 - Math.random() * H * 0.6, // spawn above viewport
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 1,
          angle: (Math.random() - 0.5) * 0.3,
          va: (Math.random() - 0.5) * 0.01,
        };
      });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.scale(DPR, DPR);
      buildChips();
    }

    function drawRoundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y,     x + w, y + r,     r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x,     y + h, x,       y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x,     y,     x + r,   y,         r);
      ctx.closePath();
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      for (const c of chips) {
        // gravity
        c.vy += GRAV;
        c.x  += c.vx;
        c.y  += c.vy;
        c.angle += c.va;

        // wall bounce (treat chip as AABB centered at x+w/2, y+h/2)
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;

        // floor
        if (c.y + c.h > H) {
          c.y = H - c.h;
          c.vy = -Math.abs(c.vy) * RESTITUTION;
          c.vx *= FRICTION;
          c.va *= 0.85;
        }
        // left wall
        if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx) * RESTITUTION; }
        // right wall
        if (c.x + c.w > W) { c.x = W - c.w; c.vx = -Math.abs(c.vx) * RESTITUTION; }
        // ceiling (allow chips to start off-screen, but bounce if they get here from below)
        if (c.y < -c.h * 4) { c.y = -c.h; c.vy = Math.abs(c.vy) * 0.3; }

        // draw
        ctx.save();
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
        ctx.rotate(c.angle);

        const lx = -c.w / 2, ly = -c.h / 2;

        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        drawRoundRect(lx + 2, ly + 3, c.w, c.h, RADIUS);
        ctx.fill();

        // chip fill
        ctx.fillStyle = c.isAccent ? '#1e2410' : C.chipBg;
        drawRoundRect(lx, ly, c.w, c.h, RADIUS);
        ctx.fill();

        // border
        ctx.strokeStyle = c.isAccent ? C.acid : C.edge;
        ctx.lineWidth   = c.isAccent ? 1.5 : 1;
        drawRoundRect(lx, ly, c.w, c.h, RADIUS);
        ctx.stroke();

        // accent left bar
        if (c.isAccent) {
          ctx.fillStyle = C.acid;
          drawRoundRect(lx, ly + 6, 3, c.h - 12, 1.5);
          ctx.fill();
        }

        // label
        ctx.font         = FONT_MAIN;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = c.isAccent ? C.acid : C.fg;
        ctx.fillText(c.label, 0, 0);

        ctx.restore();
      }
    }

    function startLoop() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }
    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduced) {
      // static list of chips
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      let ox = 24, oy = H / 2 - 60;
      for (const c of chips) {
        if (ox + c.w + 12 > W - 24) { ox = 24; oy += 50; }
        ctx.fillStyle = c.isAccent ? '#1e2410' : C.chipBg;
        drawRoundRect(ox, oy, c.w, c.h, RADIUS);
        ctx.fill();
        ctx.strokeStyle = c.isAccent ? C.acid : C.edge;
        ctx.lineWidth = 1;
        drawRoundRect(ox, oy, c.w, c.h, RADIUS);
        ctx.stroke();
        ctx.font = FONT_MAIN;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = c.isAccent ? C.acid : C.fg;
        ctx.fillText(c.label, ox + c.w / 2, oy + c.h / 2);
        ox += c.w + 12;
      }
      return () => { window.removeEventListener('resize', resize); };
    }

    observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? startLoop() : stopLoop(); },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section ref={sectionRef} style={{ ...styles.section, position: 'relative' }}>
      {/* Label overlay */}
      <div style={styles.gravOverlay}>
        <p style={{ ...styles.kicker, color: C.mut }}>Skills</p>
        <p style={{ ...styles.sub, color: C.mut, marginTop: 6 }}>drag · fling · bounce</p>
      </div>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   SECTION 4 — Powers-of-Ten / Scale
   Canvas 2D, scroll-driven (GSAP ScrollTrigger scrub).
   Six procedural layers fade in/out as user scrolls.
   ════════════════════════════════════════════════════════ */
const SCALE_LABELS = [
  '10²⁶ m — galactic scale',
  '10⁷ m — planetary scale',
  '10⁴ m — city scale',
  '10⁰ m — human scale',
  '10⁻² m — cellular scale',
  '10⁻¹⁰ m — quantum scale',
];

const CARDS_DEF = [
  { start: 0, peak: 0.4, end: 0.9,   head: identity.name,         sub: 'explore every scale' },
  { start: 0.7, peak: 1.2, end: 1.8, head: 'Pale Blue Dot',       sub: 'somewhere in all of this — a developer' },
  { start: 1.7, peak: 2.2, end: 2.8, head: 'City Scale',          sub: `based in ${identity.location}` },
  { start: 2.7, peak: 3.2, end: 3.8, head: 'Selected Work',       sub: 'Reddit Growth Copilot · dhruvOS · 3D Portfolio' },
  { start: 3.7, peak: 4.2, end: 4.8, head: 'The Builder',         sub: 'I build things that work at every scale.' },
  { start: 4.6, peak: 4.9, end: 5.2, head: 'Core Craft',          sub: 'Canvas · WebGL · GSAP · TypeScript · Python' },
];

function cardAlpha(card, s) {
  if (s < card.start || s > card.end) return 0;
  if (s <= card.peak) return (s - card.start) / (card.peak - card.start);
  return 1 - (s - card.peak) / (card.end - card.peak);
}

function ScaleSection() {
  const wrapRef   = useRef(null);
  const canvasRef = useRef(null);
  const scrollVal = useRef(0); // 0..5

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduced = prefersReducedMotion();
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W, H, raf, running = false, t = 0, lastTs = 0, observer;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.scale(DPR, DPR);
    }

    /* ─── layer draw fns (adapted from zoom.html) ─── */
    const rng = (seed) => (i) => { const x = Math.sin(i * 127.1 + seed) * 43758.5; return x - Math.floor(x); };
    const R1 = rng(42), R2 = rng(91), R3 = rng(53), R4 = rng(17), R5 = rng(7);

    function drawGalaxy(a) {
      ctx.save(); ctx.globalAlpha = a;
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
      bg.addColorStop(0, '#0a0418'); bg.addColorStop(1, '#000');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 300; i++) {
        const sx = R1(i*3)*W, sy = R1(i*3+1)*H, sr = R1(i*3+2)*1.5+0.3;
        const tw = 0.5 + 0.5*Math.sin(t*0.5+i*0.7);
        ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
        ctx.fillStyle = `rgba(200,200,255,${(0.3+0.4*tw)*a})`; ctx.fill();
      }
      ctx.translate(W/2, H/2);
      for (let arm = 0; arm < 3; arm++) {
        const aOff = arm*(Math.PI*2/3) + t*0.04;
        for (let j = 0; j < 140; j++) {
          const ang = aOff + j*0.08, r = j*2.0;
          const x = Math.cos(ang)*r, y = Math.sin(ang)*r*0.42;
          const bright = Math.max(0, 1-j/140);
          ctx.beginPath(); ctx.arc(x, y, Math.max(0.5,2-j*0.012), 0, Math.PI*2);
          ctx.fillStyle = `rgba(${140+arm*20},${110+arm*10},${210-arm*20},${bright*0.7})`; ctx.fill();
        }
      }
      const glow = ctx.createRadialGradient(0,0,0,0,0,70);
      glow.addColorStop(0,'rgba(255,220,180,.6)'); glow.addColorStop(0.4,'rgba(180,100,255,.15)'); glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0,0,70,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    function drawPlanet(a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = '#000508'; ctx.fillRect(0,0,W,H);
      for (let i = 0; i < 80; i++) {
        ctx.beginPath(); ctx.arc(R2(i)*W, R2(i+1)*H, R2(i+2)*0.8+0.2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.15+R2(i+3)*0.5})`; ctx.fill();
      }
      ctx.translate(W/2, H/2);
      const PR = Math.min(W,H)*0.26;
      const planet = ctx.createRadialGradient(-PR*0.3,-PR*0.3,PR*0.05,-PR*0.1,-PR*0.1,PR*1.1);
      planet.addColorStop(0,'#7ab8ff'); planet.addColorStop(0.35,'#3a7acf'); planet.addColorStop(0.7,'#1a4a8f'); planet.addColorStop(1,'#020810');
      ctx.beginPath(); ctx.arc(0,0,PR,0,Math.PI*2); ctx.fillStyle=planet; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(60,120,60,.65)';
      [[-0.2,-0.1,0.18],[0.1,0.2,0.12],[-0.15,0.25,0.09],[0.25,-0.2,0.14]].forEach(([bx,by,br])=>{
        ctx.beginPath(); ctx.arc(bx*PR,by*PR,br*PR,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
      const atm = ctx.createRadialGradient(0,0,PR*0.9,0,0,PR*1.18);
      atm.addColorStop(0,'rgba(100,160,255,.35)'); atm.addColorStop(1,'rgba(0,40,120,0)');
      ctx.beginPath(); ctx.arc(0,0,PR*1.18,0,Math.PI*2); ctx.fillStyle=atm; ctx.fill();
      ctx.restore();
    }

    function drawCity(a) {
      ctx.save(); ctx.globalAlpha = a;
      const sky = ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#020612'); sky.addColorStop(0.6,'#0a0f28'); sky.addColorStop(1,'#1a1020');
      ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
      // moon
      ctx.save(); ctx.translate(W*0.78,H*0.15);
      const moonG = ctx.createRadialGradient(-4,-4,2,-2,-2,26);
      moonG.addColorStop(0,'#fffde8'); moonG.addColorStop(0.7,'#c8c89a'); moonG.addColorStop(1,'rgba(200,200,160,0)');
      ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fillStyle=moonG; ctx.fill();
      ctx.restore();
      const ground = H*0.68;
      ctx.fillStyle = '#080818';
      const buildings=[[0,.28],[.05,.35],[.1,.22],[.14,.42],[.18,.3],[.22,.38],[.27,.55],[.31,.45],[.35,.35],[.39,.6],[.43,.48],[.47,.38],[.51,.65],[.55,.5],[.59,.42],[.63,.58],[.67,.44],[.71,.36],[.75,.5],[.79,.38],[.83,.28],[.87,.44],[.91,.32],[.95,.38],[1,.3]];
      ctx.beginPath(); ctx.moveTo(0,H);
      for (let i = 0; i < buildings.length-1; i++) {
        const [bx,bh]=buildings[i],[nx]=buildings[i+1];
        const bw=(nx-bx)*W, bX=bx*W, bY=ground-bh*H*0.5;
        ctx.lineTo(bX,ground); ctx.lineTo(bX,bY); ctx.lineTo(bX+bw,bY); ctx.lineTo(bX+bw,ground);
      }
      ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 160; i++) {
        if (R3(i) > 0.5) continue;
        const wx=R3(i+1)*W, wy=ground - R3(i+2)*(H*0.5)*0.9;
        const warm = R3(i+3) > 0.6;
        const flicker = 0.7+0.3*Math.sin(t*2+i*3.7);
        ctx.fillStyle = warm ? `rgba(255,220,120,${0.4*flicker})` : `rgba(150,200,255,${0.35*flicker})`;
        ctx.fillRect(wx,wy,2,2);
      }
      ctx.restore();
    }

    function drawDesk(a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = '#0d0d14'; ctx.fillRect(0,0,W,H);
      ctx.translate(W/2, H/2);
      const dW=Math.min(W*0.7,460), mW=Math.min(W*0.35,220), mH=mW*0.6;
      ctx.fillStyle = '#222230';
      ctx.fillRect(-mW/2-8,-mH-26,mW+16,mH+8);
      const screen = ctx.createLinearGradient(-mW/2,-mH-24,mW/2,-24);
      screen.addColorStop(0,'#0a1428'); screen.addColorStop(1,'#081428');
      ctx.fillStyle=screen; ctx.fillRect(-mW/2,-mH-24,mW,mH);
      const codeLines=['> Reddit Growth Copilot','  phase 6 complete ✓','  mock-mode active','> git push origin main','  [main] feat: dashboard'];
      ctx.font = `${Math.max(7,mW*0.038)}px monospace`; ctx.textAlign='left';
      codeLines.forEach((line,i)=>{
        ctx.fillStyle = line.startsWith('>') ? 'rgba(80,160,255,.9)' : 'rgba(60,180,100,.7)';
        ctx.fillText(line, -mW/2+8, -mH-20+i*(mH*0.15));
      });
      ctx.fillStyle='#1c1c2a'; ctx.fillRect(-dW*0.32,-4,dW*0.64,24);
      const sglow=ctx.createRadialGradient(0,-mH/2-24,10,0,-mH/2-24,mW*0.8);
      sglow.addColorStop(0,`rgba(40,100,200,${0.12+0.05*Math.sin(t)})`); sglow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sglow; ctx.fillRect(-mW,-mH-80,mW*2,mH+60);
      ctx.restore();
    }

    function drawNeuron(a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = '#000206'; ctx.fillRect(0,0,W,H);
      ctx.translate(W/2,H/2);
      const NR = Math.min(W,H)*0.17;
      for (let d = 0; d < 6; d++) {
        const baseAng = d*(Math.PI*2/6)+t*0.03;
        ctx.strokeStyle = `rgba(60,${120+d*15},200,0.35)`;
        ctx.lineWidth = 1.5;
        let x=0, y=0;
        ctx.beginPath(); ctx.moveTo(x,y);
        for (let seg = 0; seg < 4; seg++) {
          const segAng = baseAng+Math.sin(t*0.2+d+seg)*0.4;
          x += Math.cos(segAng)*NR*0.5; y += Math.sin(segAng)*NR*0.5;
          ctx.lineTo(x,y);
        }
        ctx.stroke();
        const pulse = 0.5+0.5*Math.sin(t*2+d*1.3);
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
        ctx.fillStyle = `rgba(100,200,255,${pulse*0.7})`; ctx.fill();
      }
      const body = ctx.createRadialGradient(0,0,NR*0.05,0,0,NR);
      body.addColorStop(0,'rgba(120,180,255,.8)'); body.addColorStop(0.5,'rgba(60,100,200,.5)'); body.addColorStop(1,'rgba(20,40,100,.05)');
      ctx.beginPath(); ctx.arc(0,0,NR,0,Math.PI*2); ctx.fillStyle=body; ctx.fill();
      const nuc = ctx.createRadialGradient(0,0,1,0,0,NR*0.38);
      nuc.addColorStop(0,'rgba(200,230,255,.85)'); nuc.addColorStop(1,'rgba(80,120,200,.25)');
      ctx.beginPath(); ctx.arc(0,0,NR*0.38,0,Math.PI*2); ctx.fillStyle=nuc; ctx.fill();
      const pRad = NR*(1+0.28*((t*0.5)%1));
      const pA = Math.max(0, 0.5-((t*0.5)%1)*0.5);
      ctx.beginPath(); ctx.arc(0,0,pRad,0,Math.PI*2);
      ctx.strokeStyle = `rgba(100,180,255,${pA})`; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }

    const LAYERS = [
      { draw: drawGalaxy, sIn: 0,   sOut: 1.3 },
      { draw: drawPlanet, sIn: 0.7, sOut: 2.3 },
      { draw: drawCity,   sIn: 1.7, sOut: 3.3 },
      { draw: drawDesk,   sIn: 2.7, sOut: 4.3 },
      { draw: drawNeuron, sIn: 4.3, sOut: 6.0 },
    ];
    function layerAlpha(layer, s) {
      const fl = 0.4;
      if (s < layer.sIn || s > layer.sOut) return 0;
      return Math.min(
        Math.min(1, (s - layer.sIn) / fl),
        Math.min(1, (layer.sOut - s) / fl)
      );
    }

    function tick(ts) {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min((ts - lastTs) * 0.001, 0.05);
      lastTs = ts; t += dt;

      const s = scrollVal.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      LAYERS.forEach(layer => {
        const a = layerAlpha(layer, s);
        if (a > 0.005) layer.draw(a);
      });
    }

    function startLoop() {
      if (running) return;
      running = true;
      lastTs = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stopLoop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener('resize', resize);

    // GSAP ScrollTrigger scrub drives scrollVal
    let st;
    if (!reduced) {
      st = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          scrollVal.current = self.progress * 5; // 0..5
        },
      });

      observer = new IntersectionObserver(
        ([entry]) => { entry.isIntersecting ? startLoop() : stopLoop(); },
        { threshold: 0.01 }
      );
      observer.observe(canvas);
    } else {
      // reduced: static galaxy
      resize();
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.fg;
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Powers of Ten', W/2, H/2);
    }

    return () => {
      stopLoop();
      st && st.kill();
      observer && observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    /* tall scroll container — 6× viewport height */
    <div ref={wrapRef} style={{ position: 'relative', height: '600vh' }}>
      {/* sticky canvas + overlay */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        {/* content cards */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 2,
        }}>
          <ScaleCards scrollVal={scrollVal} />
        </div>
        {/* scale label */}
        <ScaleIndicator scrollVal={scrollVal} />
        {/* section label */}
        <p style={{
          position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
          font: `700 11px/1 ${C.font}`, color: C.mut, letterSpacing: '0.2em',
          textTransform: 'uppercase', zIndex: 10, pointerEvents: 'none',
        }}>
          POWERS OF TEN
        </p>
      </div>
    </div>
  );
}

// Tiny stateful sub-component — reads scrollVal ref each rAF via a polling approach
// but we keep it simple: re-render on scroll events from a local state
function ScaleCards({ scrollVal }) {
  // We drive visibility via inline style mutation in the parent canvas tick;
  // here we just provide the DOM elements with IDs.
  // Actually we'll use a shared approach: attach a custom event.
  const refs = useRef(CARDS_DEF.map(() => null));

  useEffect(() => {
    let raf;
    function update() {
      raf = requestAnimationFrame(update);
      const s = scrollVal.current;
      CARDS_DEF.forEach((card, i) => {
        const el = refs.current[i];
        if (!el) return;
        const a = cardAlpha(card, s);
        el.style.opacity = a;
      });
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scrollVal]);

  return (
    <div style={{ position: 'relative', textAlign: 'center', maxWidth: 520, padding: '0 32px' }}>
      {CARDS_DEF.map((card, i) => (
        <div
          key={i}
          ref={el => { refs.current[i] = el; }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            opacity: 0,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <h3 style={{
            font: `300 clamp(24px,4vw,48px)/1.1 Georgia, serif`,
            color: '#e8e4dc',
            letterSpacing: '0.06em',
            textShadow: '0 0 40px rgba(180,160,255,.4)',
          }}>
            {card.head}
          </h3>
          <p style={{
            font: `400 14px/1.5 ${C.font}`,
            color: '#9090b0',
            letterSpacing: '0.1em',
            marginTop: 8,
          }}>
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

function ScaleIndicator({ scrollVal }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    function update() {
      raf = requestAnimationFrame(update);
      const s = Math.floor(Math.min(scrollVal.current, 4.99));
      if (ref.current) ref.current.textContent = SCALE_LABELS[s] || SCALE_LABELS[0];
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [scrollVal]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', bottom: 26, right: 26,
        font: `11px/1 ${C.font}`, color: '#3a7a5a',
        letterSpacing: '0.05em', zIndex: 10, pointerEvents: 'none',
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════
   SECTION 5 — Contact Closer
   ════════════════════════════════════════════════════════ */
function ContactSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const section = sectionRef.current;
    if (!section) return;

    const els = section.querySelectorAll('.contact-reveal');
    const triggers = [];
    els.forEach((el, i) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          scrub: false,
        },
      });
      tl.from(el, {
        yPercent: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: i * 0.12,
      });
      triggers.push(tl.scrollTrigger);
    });

    return () => { triggers.forEach(t => t && t.kill()); };
  }, []);

  return (
    <section ref={sectionRef} style={{ ...styles.section, background: C.bg, borderTop: `1px solid #1d1d1e` }}>
      <div style={{ textAlign: 'center', padding: '0 6vw', position: 'relative', zIndex: 2 }}>
        <h2 className="contact-reveal" style={{
          font: `400 clamp(48px,10vw,140px)/0.9 Anton, ${C.font}`,
          textTransform: 'uppercase',
          color: C.fg,
          letterSpacing: '-0.01em',
        }}>
          Let's<br />
          <span style={{ color: C.acid }}>build</span> it.
        </h2>

        <p className="contact-reveal" style={{
          ...styles.sub,
          marginTop: 36,
          color: C.mut,
        }}>
          {identity.name} · {identity.location}
        </p>

        <div className="contact-reveal" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <a
            href={`mailto:${contact.email}`}
            style={styles.cta}
          >
            {contact.email}
          </a>
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.cta, background: 'transparent', color: C.acid, border: `1px solid ${C.acid}` }}
          >
            {contact.githubLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════
   ROOT — Anthology
   ════════════════════════════════════════════════════════ */
export default function Anthology() {
  useEffect(() => {
    // Inject Anton font (not in index.html) — cleaned up on unmount
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    // Lenis smooth scroll
    let lenis;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);

      let lenisRaf;
      const rafLoop = (time) => {
        lenis.raf(time);
        lenisRaf = requestAnimationFrame(rafLoop);
      };
      lenisRaf = requestAnimationFrame(rafLoop);

      return () => {
        lenis.destroy();
        cancelAnimationFrame(lenisRaf);
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div style={{ background: C.bg, color: C.fg, fontFamily: C.font, overflowX: 'hidden' }}>
      {/* 1 — Particle Hero */}
      <ParticleHero />

      {/* 2 — Kinetic Typography */}
      <KineticSection />

      {/* 3 — Gravity Skill Chips */}
      <GravitySection />

      {/* 4 — Powers of Ten / Scale */}
      <ScaleSection />

      {/* 5 — Contact Closer */}
      <ContactSection />
    </div>
  );
}

/* ─── shared styles ─── */
const styles = {
  section: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '0 6vw 6vh',
    overflow: 'hidden',
    background: C.bg,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: '6vh',
    left: '6vw',
    right: '6vw',
    zIndex: 2,
    pointerEvents: 'none',
  },
  kicker: {
    fontSize: 12,
    letterSpacing: '0.3em',
    color: C.mut,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: C.font,
  },
  tagline: {
    fontSize: 'clamp(14px, 1.6vw, 18px)',
    lineHeight: 1.6,
    color: '#b8b8b2',
    maxWidth: 560,
    fontFamily: C.font,
  },
  scrollHint: {
    marginTop: 40,
    fontSize: 11,
    letterSpacing: '0.2em',
    color: C.mut,
    textTransform: 'uppercase',
    fontFamily: C.font,
  },
  display: {
    fontFamily: 'Anton, sans-serif',
    fontWeight: 400,
    lineHeight: 0.88,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    fontSize: 'clamp(54px,12vw,200px)',
    color: C.fg,
  },
  sub: {
    maxWidth: 580,
    fontSize: 'clamp(13px,1.4vw,16px)',
    lineHeight: 1.65,
    color: '#b8b8b2',
    fontFamily: C.font,
  },
  marqueeWrap: {
    position: 'absolute',
    bottom: '12vh',
    left: 0,
    right: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderTop: '1px solid #1d1d1e',
    borderBottom: '1px solid #1d1d1e',
    padding: '16px 0',
  },
  marqueeTrack: {
    display: 'inline-block',
    fontFamily: 'Anton, sans-serif',
    fontSize: 'clamp(28px,5vw,60px)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    willChange: 'transform',
  },
  gravOverlay: {
    position: 'absolute',
    top: 18,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  cta: {
    display: 'inline-block',
    fontSize: 12,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: C.bg,
    background: C.acid,
    padding: '14px 24px',
    borderRadius: 40,
    textDecoration: 'none',
    fontFamily: C.font,
    border: '1px solid transparent',
    transition: 'opacity 0.2s',
  },
};
