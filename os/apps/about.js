// about.js — neural-graph identity app for dhruvOS
// No build step; plain ES module. No external deps (GSAP replaced with rAF lerp).

const NODE_DEFS = [
  { id: 'dhruv',   label: 'DHRUV KOTHARI',        type: 'identity', desc: 'Developer & builder from India' },
  { id: 'india',   label: 'India',                 type: 'fact',     desc: 'Based in Mumbai, building for the web' },
  { id: 'dev',     label: 'Developer',             type: 'fact',     desc: 'Full-stack, graphics, and creative tech' },
  { id: 'builder', label: 'Builder',               type: 'fact',     desc: 'Prototypes ideas fast, ships often' },
  { id: 'react',   label: 'React',                 type: 'skill',    desc: 'Component-driven UI architecture' },
  { id: 'threejs', label: 'Three.js',              type: 'skill',    desc: '3D scenes and WebGL rendering' },
  { id: 'webgl',   label: 'WebGL',                 type: 'skill',    desc: 'Low-level GPU programming for the browser' },
  { id: 'gsap',    label: 'GSAP',                  type: 'skill',    desc: 'Animation timelines and motion design' },
  { id: 'ts',      label: 'TypeScript',            type: 'skill',    desc: 'Type-safe JavaScript at scale' },
  { id: 'node',    label: 'Node.js',               type: 'skill',    desc: 'Server-side JS, APIs, and tooling' },
  { id: 'shaders', label: 'Shaders',               type: 'skill',    desc: 'GLSL vertex and fragment programs' },
  { id: 'design',  label: 'Design',                type: 'skill',    desc: 'Visual systems, typography, motion' },
  { id: 'reddit',  label: 'Reddit Growth Copilot', type: 'project',  desc: 'AI finds relevant Reddit threads and drafts on-brand replies for growth teams' },
  { id: 'proj2',   label: 'GeoSVG Maps',           type: 'project',  desc: 'Interactive SVG map generator with live coordinates' },
  { id: 'proj3',   label: '3D Portfolio',          type: 'project',  desc: 'R3F-driven immersive portfolio built with React Three Fiber' },
];

const EDGES = [
  ['dhruv','india',0.6], ['dhruv','dev',0.9], ['dhruv','builder',0.7],
  ['dhruv','react',0.8], ['dhruv','threejs',0.8], ['dhruv','design',0.7],
  ['dhruv','reddit',0.9], ['dhruv','proj2',0.8], ['dhruv','proj3',0.8],
  ['dev','react',0.7], ['dev','node',0.7], ['dev','ts',0.6],
  ['builder','india',0.4], ['builder','design',0.5],
  ['react','ts',0.8], ['react','reddit',0.6], ['react','proj3',0.7],
  ['threejs','webgl',0.9], ['threejs','shaders',0.85], ['threejs','proj3',0.9],
  ['webgl','shaders',0.9], ['webgl','gsap',0.3],
  ['gsap','design',0.7], ['gsap','proj3',0.5],
  ['ts','node',0.7], ['ts','reddit',0.5],
  ['node','reddit',0.7],
  ['design','proj2',0.5], ['design','proj3',0.4],
  ['reddit','proj2',0.3],
  ['shaders','design',0.4],
];

const COLORS = {
  identity: { base: '#e9d8fd', glow: '#9f7aea' },
  fact:     { base: '#76e4f7', glow: '#0bc5ea' },
  skill:    { base: '#81e6d9', glow: '#38b2ac' },
  project:  { base: '#fbd38d', glow: '#ed8936' },
};

const REPULSION = 18000;
const SPRING_K  = 0.022;
const REST_LEN  = 240;
const DAMPING   = 0.72;
const CENTER_K  = 0.002;
const MIN_DIST  = 70;

export default {
  id: 'about',
  title: 'about',
  icon: '◈',
  width: 760,
  height: 560,

  mount(body, _ctx) {
    // ── DOM setup ──────────────────────────────────────────────────────────────
    body.style.position = 'relative';
    body.style.overflow = 'hidden';
    body.style.background = '#060810';
    body.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;';
    body.appendChild(canvas);

    // info panel (click detail)
    const panel = document.createElement('div');
    panel.style.cssText = [
      'position:absolute', 'bottom:20px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:10', 'background:rgba(6,8,16,0.9)', 'border:1px solid #1a2a4a',
      'border-radius:6px', 'padding:10px 18px', 'min-width:200px', 'max-width:320px',
      'text-align:center', 'pointer-events:none', 'opacity:0',
      'transition:opacity 0.25s', 'backdrop-filter:blur(8px)',
    ].join(';');
    body.appendChild(panel);

    const panelName = document.createElement('div');
    panelName.style.cssText = 'font-size:12px;letter-spacing:0.12em;color:#81e6d9;margin-bottom:4px;';
    const panelDesc = document.createElement('div');
    panelDesc.style.cssText = 'font-size:10px;color:#718096;line-height:1.5;';
    panel.appendChild(panelName);
    panel.appendChild(panelDesc);

    const c2d = canvas.getContext('2d');

    // ── State ──────────────────────────────────────────────────────────────────
    let W, H, cx, cy, dpr;
    let nodes = [], edges = [], pulses = [];
    let hoveredId = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let panOffset = { x: 0, y: 0 };
    let panStart  = { x: 0, y: 0 };
    let lastIdle  = 0;
    let rafId     = null;
    let last      = 0;
    let panelHideTimer = null;

    // ── Resize ─────────────────────────────────────────────────────────────────
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth;
      H = body.clientHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
    }

    // ── Graph build ────────────────────────────────────────────────────────────
    function buildGraph() {
      const n = NODE_DEFS.length;
      nodes = NODE_DEFS.map((def, i) => {
        const angle = (i / n) * Math.PI * 2;
        const r = def.id === 'dhruv' ? 0 : 220 + Math.random() * 140;
        return {
          ...def,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0, vy: 0,
          radius: def.id === 'dhruv' ? 40 : def.type === 'project' ? 26 : 20,
          glow: 0,
          flash: 0,
          drift: { a: Math.random() * Math.PI * 2, s: 0.15 + Math.random() * 0.1 },
        };
      });

      edges = EDGES.map(([a, b, w]) => ({
        a: nodes.find(nd => nd.id === a),
        b: nodes.find(nd => nd.id === b),
        w,
      })).filter(e => e.a && e.b);
    }

    // ── Physics ────────────────────────────────────────────────────────────────
    function stepPhysics(dt) {
      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy + 1;
          const dist  = Math.sqrt(dist2);
          const f     = REPULSION / dist2;
          const nx = dx / dist, ny = dy / dist;
          a.vx -= nx * f * dt;  a.vy -= ny * f * dt;
          b.vx += nx * f * dt;  b.vy += ny * f * dt;
        }
      }
      // hard collision
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const minD = a.radius + b.radius + MIN_DIST;
          if (dist < minD) {
            const push = (minD - dist) * 0.5;
            const nx = dx / dist, ny = dy / dist;
            if (a.id !== 'dhruv') { a.x -= nx * push; a.y -= ny * push; }
            if (b.id !== 'dhruv') { b.x += nx * push; b.y += ny * push; }
          }
        }
      }
      // spring
      for (const e of edges) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const stretch = dist - REST_LEN;
        const f  = SPRING_K * stretch;
        const nx = dx / dist, ny = dy / dist;
        e.a.vx += nx * f * dt;  e.a.vy += ny * f * dt;
        e.b.vx -= nx * f * dt;  e.b.vy -= ny * f * dt;
      }
      // center + drift + integrate
      for (const nd of nodes) {
        if (nd.id === 'dhruv') {
          nd.x = cx + panOffset.x;
          nd.y = cy + panOffset.y;
          nd.vx = 0; nd.vy = 0;
          continue;
        }
        const pcx = cx + panOffset.x, pcy = cy + panOffset.y;
        nd.vx += (pcx - nd.x) * CENTER_K * dt * 60;
        nd.vy += (pcy - nd.y) * CENTER_K * dt * 60;
        nd.drift.a += 0.4 * dt;
        nd.vx += Math.cos(nd.drift.a) * nd.drift.s * dt;
        nd.vy += Math.sin(nd.drift.a) * nd.drift.s * dt;
        nd.vx *= Math.pow(DAMPING, dt * 60);
        nd.vy *= Math.pow(DAMPING, dt * 60);
        nd.x  += nd.vx * dt * 60;
        nd.y  += nd.vy * dt * 60;
        const margin = nd.radius + 24;
        if (nd.x < margin)       { nd.x = margin;       nd.vx =  Math.abs(nd.vx) * 0.4; }
        if (nd.x > W - margin)   { nd.x = W - margin;   nd.vx = -Math.abs(nd.vx) * 0.4; }
        if (nd.y < margin + 4)   { nd.y = margin + 4;   nd.vy =  Math.abs(nd.vy) * 0.4; }
        if (nd.y > H - margin)   { nd.y = H - margin;   nd.vy = -Math.abs(nd.vy) * 0.4; }
        // decay glow/flash via simple lerp (no GSAP needed)
        nd.flash = nd.flash > 0.001 ? nd.flash * Math.pow(0.006, dt) : 0;
        nd.glow  = nd.glow  > 0.001 ? nd.glow  * Math.pow(0.06,  dt) : 0;
      }
    }

    // ── Fire / propagation ─────────────────────────────────────────────────────
    function fireNode(node, depth, delayMs) {
      if (depth > 2) return;
      setTimeout(() => {
        node.flash = 1;
        node.glow  = Math.min(1, node.glow + 0.6);
        for (const e of edges) {
          let other = null;
          if (e.a === node) other = e.b;
          else if (e.b === node) other = e.a;
          if (!other) continue;
          const pulseDelay = 300 + Math.random() * 150;
          setTimeout(() => {
            pulses.push({ from: node, to: other, t: 0, w: e.w, depth });
          }, pulseDelay);
          fireNode(other, depth + 1, pulseDelay + 550);
        }
      }, delayMs);
    }

    // ── Pulses ─────────────────────────────────────────────────────────────────
    function updatePulses(dt) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += dt * 1.4;
        if (pulses[i].t >= 1) pulses.splice(i, 1);
      }
    }

    // ── Draw ───────────────────────────────────────────────────────────────────
    function drawEdges() {
      for (const e of edges) {
        c2d.beginPath();
        c2d.moveTo(e.a.x, e.a.y);
        c2d.lineTo(e.b.x, e.b.y);
        const glow = Math.max(e.a.glow, e.b.glow) * 0.5;
        c2d.strokeStyle = `rgba(56,178,172,${0.05 + e.w * 0.08 + glow * 0.25})`;
        c2d.lineWidth = 0.8 + e.w * 0.6;
        c2d.stroke();
      }
    }

    function drawPulses() {
      for (const p of pulses) {
        const x = p.from.x + (p.to.x - p.from.x) * p.t;
        const y = p.from.y + (p.to.y - p.from.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI) * p.w;
        const tx = p.from.x + (p.to.x - p.from.x) * Math.max(0, p.t - 0.18);
        const ty = p.from.y + (p.to.y - p.from.y) * Math.max(0, p.t - 0.18);
        c2d.beginPath();
        c2d.moveTo(tx, ty);
        c2d.lineTo(x, y);
        c2d.strokeStyle = `rgba(129,230,217,${alpha * 0.7})`;
        c2d.lineWidth = 1.5;
        c2d.stroke();
        // bead
        const grad = c2d.createRadialGradient(x, y, 0, x, y, 5);
        grad.addColorStop(0, `rgba(225,255,255,${alpha})`);
        grad.addColorStop(1, 'rgba(56,178,172,0)');
        c2d.beginPath();
        c2d.arc(x, y, 5, 0, Math.PI * 2);
        c2d.fillStyle = grad;
        c2d.fill();
      }
    }

    function drawNodes() {
      for (const nd of nodes) {
        const col    = COLORS[nd.type];
        const r      = nd.radius;
        const isHov  = nd.id === hoveredId;
        const glowR  = r + 18 + nd.flash * 28 + nd.glow * 12;
        const glowAlpha = 0.08 + nd.glow * 0.35 + nd.flash * 0.55 + (isHov ? 0.2 : 0);

        // halo
        const halo = c2d.createRadialGradient(nd.x, nd.y, r * 0.4, nd.x, nd.y, glowR);
        halo.addColorStop(0, col.glow + 'cc');
        halo.addColorStop(1, col.glow + '00');
        c2d.beginPath();
        c2d.arc(nd.x, nd.y, glowR, 0, Math.PI * 2);
        c2d.fillStyle = halo;
        c2d.globalAlpha = glowAlpha;
        c2d.fill();
        c2d.globalAlpha = 1;

        // body
        const body = c2d.createRadialGradient(nd.x - r * 0.3, nd.y - r * 0.3, 0, nd.x, nd.y, r);
        body.addColorStop(0, col.glow + 'ff');
        body.addColorStop(1, '#060810');
        c2d.beginPath();
        c2d.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        c2d.fillStyle = body;
        c2d.fill();

        // border
        c2d.beginPath();
        c2d.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        c2d.strokeStyle = col.base;
        c2d.lineWidth = 1 + nd.flash * 1.5;
        c2d.globalAlpha = 0.4 + nd.glow * 0.5 + nd.flash * 0.6 + (isHov ? 0.3 : 0);
        c2d.stroke();
        c2d.globalAlpha = 1;

        // flash ring
        if (nd.flash > 0.01) {
          c2d.beginPath();
          c2d.arc(nd.x, nd.y, r + 10 + (1 - nd.flash) * 30, 0, Math.PI * 2);
          c2d.strokeStyle = col.glow;
          c2d.lineWidth = 1.5;
          c2d.globalAlpha = nd.flash * 0.7;
          c2d.stroke();
          c2d.globalAlpha = 1;
        }

        // label
        const fontSize = nd.id === 'dhruv' ? 10 : 8;
        c2d.font = `bold ${fontSize}px 'JetBrains Mono','Courier New',monospace`;
        c2d.textAlign = 'center';
        c2d.textBaseline = 'middle';
        c2d.fillStyle = col.base;
        c2d.globalAlpha = 0.9 + nd.glow * 0.1;
        if (nd.id === 'dhruv') {
          c2d.fillText('DHRUV', nd.x, nd.y - 6);
          c2d.fillText('KOTHARI', nd.x, nd.y + 6);
        } else {
          c2d.fillText(nd.label, nd.x, nd.y);
        }
        c2d.globalAlpha = 1;
      }
    }

    // ── Pointer helpers ────────────────────────────────────────────────────────
    function getCanvasXY(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function getNodeAt(mx, my) {
      for (const nd of nodes) {
        const dx = nd.x - mx, dy = nd.y - my;
        if (dx * dx + dy * dy < (nd.radius + 6) * (nd.radius + 6)) return nd;
      }
      return null;
    }

    function nudgeNear(mx, my) {
      for (const nd of nodes) {
        if (nd.id === 'dhruv') continue;
        const dx = mx - nd.x, dy = my - nd.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 120 * 120) {
          const dist = Math.sqrt(dist2);
          const f = 0.18 * (1 - dist / 120);
          nd.vx += (dx / dist) * f;
          nd.vy += (dy / dist) * f;
        }
      }
    }

    // ── Idle fire ──────────────────────────────────────────────────────────────
    function maybeIdleFire(now) {
      if (now - lastIdle > 2200) {
        const candidates = nodes.filter(nd => nd.id !== 'dhruv');
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (pick) fireNode(pick, 0, 0);
        lastIdle = now;
      }
    }

    // ── Main loop ──────────────────────────────────────────────────────────────
    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      c2d.clearRect(0, 0, W, H);

      stepPhysics(dt);
      updatePulses(dt);
      maybeIdleFire(now);

      drawEdges();
      drawPulses();
      drawNodes();

      rafId = requestAnimationFrame(loop);
    }

    // ── Event listeners (scoped to canvas) ────────────────────────────────────
    function onPointerMove(e) {
      const { x: mx, y: my } = getCanvasXY(e);
      if (isDragging) {
        panOffset.x = panStart.x + (mx - dragStart.x);
        panOffset.y = panStart.y + (my - dragStart.y);
        return;
      }
      nudgeNear(mx, my);
      const hit = getNodeAt(mx, my);
      if (hit && hit.id !== hoveredId) {
        hoveredId = hit.id;
        fireNode(hit, 0, 0);
        lastIdle = performance.now();
        canvas.style.cursor = 'pointer';
      } else if (!hit) {
        hoveredId = null;
        canvas.style.cursor = 'default';
      }
    }

    function onPointerDown(e) {
      const { x: mx, y: my } = getCanvasXY(e);
      const hit = getNodeAt(mx, my);
      if (!hit) {
        isDragging = true;
        dragStart  = { x: mx, y: my };
        panStart   = { x: panOffset.x, y: panOffset.y };
        canvas.style.cursor = 'grabbing';
      }
    }

    function onPointerUp() {
      isDragging = false;
      canvas.style.cursor = hoveredId ? 'pointer' : 'default';
    }

    function onPointerLeave() {
      isDragging = false;
      hoveredId  = null;
      canvas.style.cursor = 'default';
    }

    function onClick(e) {
      const { x: mx, y: my } = getCanvasXY(e);
      const hit = getNodeAt(mx, my);
      if (hit) {
        panelName.textContent = hit.label;
        panelDesc.textContent = hit.desc;
        panel.style.opacity = '1';
        clearTimeout(panelHideTimer);
        panelHideTimer = setTimeout(() => { panel.style.opacity = '0'; }, 3500);
      }
    }

    // touch pan
    let lastTouch = null;
    function onTouchStart(e) {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        lastTouch = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
          px: panOffset.x, py: panOffset.y,
        };
      }
    }
    function onTouchMove(e) {
      if (e.touches.length === 1 && lastTouch) {
        const rect = canvas.getBoundingClientRect();
        panOffset.x = lastTouch.px + (e.touches[0].clientX - rect.left - lastTouch.x);
        panOffset.y = lastTouch.py + (e.touches[0].clientY - rect.top  - lastTouch.y);
      }
    }

    canvas.addEventListener('pointermove',  onPointerMove);
    canvas.addEventListener('pointerdown',  onPointerDown);
    canvas.addEventListener('pointerup',    onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click',        onClick);
    canvas.addEventListener('touchstart',   onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',    onTouchMove,  { passive: true });

    // ── ResizeObserver ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      resize();
      const dhruv = nodes.find(nd => nd.id === 'dhruv');
      if (dhruv) { dhruv.x = cx + panOffset.x; dhruv.y = cy + panOffset.y; }
    });
    ro.observe(body);

    // ── Boot ──────────────────────────────────────────────────────────────────
    resize();
    buildGraph();

    setTimeout(() => {
      const dhruv = nodes.find(nd => nd.id === 'dhruv');
      if (dhruv) fireNode(dhruv, 0, 0);
      lastIdle = performance.now();
    }, 800);

    rafId = requestAnimationFrame(loop);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return function cleanup() {
      cancelAnimationFrame(rafId);
      rafId = null;
      ro.disconnect();
      clearTimeout(panelHideTimer);
      canvas.removeEventListener('pointermove',  onPointerMove);
      canvas.removeEventListener('pointerdown',  onPointerDown);
      canvas.removeEventListener('pointerup',    onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click',        onClick);
      canvas.removeEventListener('touchstart',   onTouchStart);
      canvas.removeEventListener('touchmove',    onTouchMove);
      // remove DOM nodes
      canvas.remove();
      panel.remove();
    };
  },
};
