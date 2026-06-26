// os/apps/about.js — neural-graph identity, OS green palette, slide-in drawer, cross-linked
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

// ── Node definitions built from content ─────────────────────────────────────
function buildNodeDefs() {
  const { identity, skills, projects } = content;
  const defs = [
    { id: 'dhruv',   label: identity.name,      type: 'identity', desc: identity.tagline,    action: 'contact' },
    { id: 'india',   label: identity.location,   type: 'fact',     desc: 'Based in Mumbai, building for the web' },
    { id: 'dev',     label: 'Developer',         type: 'fact',     desc: 'Full-stack, graphics, and creative tech' },
    { id: 'builder', label: 'Builder',           type: 'fact',     desc: 'Prototypes ideas fast, ships often' },
  ];
  skills.forEach(s => defs.push({ id: s.id, label: s.label, type: 'skill', desc: s.label + ' — used in ' + (s.projects.length) + ' projects' }));
  projects.forEach(p => defs.push({ id: p.id, label: p.name, type: 'project', desc: p.tagline, action: 'project', projectId: p.id }));
  return defs;
}

function buildEdges(nodes) {
  const edge = (a, b, w) => {
    const na = nodes.find(n => n.id === a);
    const nb = nodes.find(n => n.id === b);
    if (na && nb) return { a: na, b: nb, w };
    return null;
  };
  const raw = [
    ['dhruv','india',0.6], ['dhruv','dev',0.9], ['dhruv','builder',0.7],
    ['dhruv','react',0.8], ['dhruv','three',0.8], ['dhruv','design',0.7],
    ['dev','react',0.7], ['dev','node',0.7], ['dev','ts',0.6],
    ['builder','design',0.5], ['builder','canvas',0.6],
    ['react','ts',0.8], ['three','webgl',0.9], ['three','shaders',0.85],
    ['webgl','shaders',0.9], ['gsap','design',0.7],
    ['ts','node',0.7], ['node','python',0.4], ['shaders','design',0.4],
  ];
  // Connect projects to relevant skills
  content.projects.forEach(proj => {
    content.skills.forEach(sk => {
      if (sk.projects.includes(proj.id)) raw.push([sk.id, proj.id, 0.7]);
    });
  });
  return raw.map(([a, b, w]) => edge(a, b, w)).filter(Boolean);
}

// ── Colors — all derived from OS green palette ───────────────────────────────
const COLORS = {
  identity: { base: '#5cffd0', glow: '#5cffd0' },
  project:  { base: '#ffb000', glow: '#ffb000' },
  skill:    { base: 'rgba(92,255,208,0.85)', glow: '#5cffd0' },
  fact:     { base: 'rgba(92,255,208,0.45)', glow: '#5cffd0' },
};

const REPULSION = 18000;
const SPRING_K  = 0.022;
const REST_LEN  = 230;
const DAMPING   = 0.72;
const CENTER_K  = 0.002;
const MIN_DIST  = 65;

export default {
  id: 'about',
  title: 'about',
  icon: '◈',
  width: 800,
  height: 560,

  mount(body, ctx) {
    body.style.position = 'relative';
    body.style.overflow = 'hidden';
    body.style.background = '#050a08';
    body.style.fontFamily = "'JetBrains Mono','Courier New',monospace";

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;inset:0;';
    body.appendChild(canvas);
    const c2d = canvas.getContext('2d');

    // ── Side drawer ──────────────────────────────────────────────────────────
    const drawer = document.createElement('div');
    drawer.style.cssText = [
      'position:absolute', 'right:0', 'top:0', 'bottom:0', 'width:220px',
      'background:rgba(5,10,8,0.96)', 'border-left:1px solid rgba(92,255,208,0.15)',
      'z-index:10', 'display:flex', 'flex-direction:column', 'padding:20px 18px',
      'transform:translateX(100%)', 'transition:transform 0.22s ease',
      'pointer-events:none', 'backdrop-filter:blur(6px)',
    ].join(';');

    const drawerLabel = document.createElement('div');
    drawerLabel.style.cssText = 'font-size:8px;letter-spacing:0.3em;color:rgba(92,255,208,0.3);margin-bottom:12px;';

    const drawerName = document.createElement('div');
    drawerName.style.cssText = 'font-size:14px;letter-spacing:0.06em;color:#5cffd0;font-weight:700;margin-bottom:6px;line-height:1.3;';

    const drawerDesc = document.createElement('div');
    drawerDesc.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.55);line-height:1.65;flex:1;';

    const drawerAction = document.createElement('button');
    drawerAction.style.cssText = [
      'display:none', 'margin-top:16px',
      'background:none', 'border:1px solid rgba(92,255,208,0.3)',
      "font:9px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.7)',
      'letter-spacing:0.12em', 'padding:6px 12px', 'cursor:pointer',
      'text-align:left', 'transition:all 0.15s',
    ].join(';');
    drawerAction.addEventListener('mouseover', () => {
      drawerAction.style.borderColor = '#5cffd0';
      drawerAction.style.color = '#5cffd0';
    });
    drawerAction.addEventListener('mouseout', () => {
      drawerAction.style.borderColor = 'rgba(92,255,208,0.3)';
      drawerAction.style.color = 'rgba(92,255,208,0.7)';
    });

    drawer.append(drawerLabel, drawerName, drawerDesc, drawerAction);
    body.appendChild(drawer);

    // ── State ─────────────────────────────────────────────────────────────────
    const NODE_DEFS = buildNodeDefs();
    let W, H, cx, cy, dpr;
    let nodes = [], edges = [], pulses = [];
    let hoveredId = null, selectedId = null;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let panOffset = { x: 0, y: 0 };
    let panStart  = { x: 0, y: 0 };
    let lastIdle  = 0, rafId = null, last = 0;

    // ── Resize ────────────────────────────────────────────────────────────────
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth; H = body.clientHeight;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
    }

    function buildGraph() {
      const n = NODE_DEFS.length;
      nodes = NODE_DEFS.map((def, i) => {
        const angle = (i / n) * Math.PI * 2;
        const r = def.id === 'dhruv' ? 0 : 210 + Math.random() * 130;
        return {
          ...def,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: 0, vy: 0,
          radius: def.id === 'dhruv' ? 40 : def.type === 'project' ? 26 : 20,
          glow: 0, flash: 0,
          drift: { a: Math.random() * Math.PI * 2, s: 0.12 + Math.random() * 0.1 },
        };
      });
      edges = buildEdges(nodes);
    }

    // ── Physics ───────────────────────────────────────────────────────────────
    function stepPhysics(dt) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy + 1;
          const dist  = Math.sqrt(dist2);
          const f = REPULSION / dist2;
          const nx = dx / dist, ny = dy / dist;
          a.vx -= nx * f * dt; a.vy -= ny * f * dt;
          b.vx += nx * f * dt; b.vy += ny * f * dt;
        }
      }
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
      for (const e of edges) {
        const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const stretch = dist - REST_LEN;
        const f = SPRING_K * stretch;
        const nx = dx / dist, ny = dy / dist;
        e.a.vx += nx * f * dt; e.a.vy += ny * f * dt;
        e.b.vx -= nx * f * dt; e.b.vy -= ny * f * dt;
      }
      for (const nd of nodes) {
        if (nd.id === 'dhruv') {
          nd.x = cx + panOffset.x; nd.y = cy + panOffset.y;
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
        if (nd.x < margin)     { nd.x = margin;     nd.vx =  Math.abs(nd.vx) * 0.4; }
        if (nd.x > W - margin) { nd.x = W - margin; nd.vx = -Math.abs(nd.vx) * 0.4; }
        if (nd.y < margin + 4) { nd.y = margin + 4; nd.vy =  Math.abs(nd.vy) * 0.4; }
        if (nd.y > H - margin) { nd.y = H - margin; nd.vy = -Math.abs(nd.vy) * 0.4; }
        nd.flash = nd.flash > 0.001 ? nd.flash * Math.pow(0.006, dt) : 0;
        nd.glow  = nd.glow  > 0.001 ? nd.glow  * Math.pow(0.06,  dt) : 0;
      }
    }

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
          setTimeout(() => { pulses.push({ from: node, to: other, t: 0, w: e.w, depth }); }, pulseDelay);
          fireNode(other, depth + 1, pulseDelay + 550);
        }
      }, delayMs);
    }

    function updatePulses(dt) {
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += dt * 1.4;
        if (pulses[i].t >= 1) pulses.splice(i, 1);
      }
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function drawEdges() {
      for (const e of edges) {
        c2d.beginPath();
        c2d.moveTo(e.a.x, e.a.y);
        c2d.lineTo(e.b.x, e.b.y);
        const glow = Math.max(e.a.glow, e.b.glow) * 0.5;
        c2d.strokeStyle = `rgba(92,255,208,${0.04 + e.w * 0.07 + glow * 0.22})`;
        c2d.lineWidth = 0.7 + e.w * 0.6;
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
        c2d.beginPath(); c2d.moveTo(tx, ty); c2d.lineTo(x, y);
        c2d.strokeStyle = `rgba(92,255,208,${alpha * 0.6})`;
        c2d.lineWidth = 1.5; c2d.stroke();
        const grad = c2d.createRadialGradient(x, y, 0, x, y, 5);
        grad.addColorStop(0, `rgba(200,255,240,${alpha})`);
        grad.addColorStop(1, 'rgba(92,255,208,0)');
        c2d.beginPath(); c2d.arc(x, y, 5, 0, Math.PI * 2);
        c2d.fillStyle = grad; c2d.fill();
      }
    }

    function drawNodes() {
      for (const nd of nodes) {
        const col   = COLORS[nd.type];
        const r     = nd.radius;
        const isHov = nd.id === hoveredId;
        const isSel = nd.id === selectedId;
        const glowR     = r + 18 + nd.flash * 28 + nd.glow * 12 + (isSel ? 12 : 0);
        const glowAlpha = 0.07 + nd.glow * 0.32 + nd.flash * 0.50 + (isHov || isSel ? 0.22 : 0);

        const halo = c2d.createRadialGradient(nd.x, nd.y, r * 0.4, nd.x, nd.y, glowR);
        halo.addColorStop(0, col.glow + 'cc');
        halo.addColorStop(1, col.glow + '00');
        c2d.beginPath(); c2d.arc(nd.x, nd.y, glowR, 0, Math.PI * 2);
        c2d.fillStyle = halo; c2d.globalAlpha = glowAlpha; c2d.fill(); c2d.globalAlpha = 1;

        const bodyG = c2d.createRadialGradient(nd.x - r * 0.3, nd.y - r * 0.3, 0, nd.x, nd.y, r);
        bodyG.addColorStop(0, col.glow + 'ff');
        bodyG.addColorStop(1, '#050a08');
        c2d.beginPath(); c2d.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        c2d.fillStyle = bodyG; c2d.fill();

        c2d.beginPath(); c2d.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        c2d.strokeStyle = col.base;
        c2d.lineWidth = 1 + nd.flash * 1.5 + (isSel ? 1 : 0);
        c2d.globalAlpha = 0.4 + nd.glow * 0.5 + nd.flash * 0.6 + ((isHov || isSel) ? 0.35 : 0);
        c2d.stroke(); c2d.globalAlpha = 1;

        if (nd.flash > 0.01) {
          c2d.beginPath(); c2d.arc(nd.x, nd.y, r + 10 + (1 - nd.flash) * 28, 0, Math.PI * 2);
          c2d.strokeStyle = col.glow; c2d.lineWidth = 1.5;
          c2d.globalAlpha = nd.flash * 0.65; c2d.stroke(); c2d.globalAlpha = 1;
        }

        const fontSize = nd.id === 'dhruv' ? 11 : nd.type === 'project' ? 10 : 9;
        c2d.font = `bold ${fontSize}px 'JetBrains Mono','Courier New',monospace`;
        c2d.textAlign = 'center'; c2d.textBaseline = 'middle';
        c2d.fillStyle = col.base;
        c2d.globalAlpha = 0.9 + nd.glow * 0.1;
        if (nd.id === 'dhruv') {
          const parts = nd.label.split(' ');
          c2d.fillText(parts[0], nd.x, nd.y - 6);
          c2d.fillText(parts[1] || '', nd.x, nd.y + 7);
        } else {
          // Truncate long labels
          const maxW = r * 1.75;
          let lbl = nd.label;
          while (lbl.length > 4 && c2d.measureText(lbl).width > maxW) lbl = lbl.slice(0, -2);
          if (lbl !== nd.label) lbl += '…';
          c2d.fillText(lbl, nd.x, nd.y);
        }
        c2d.globalAlpha = 1;
      }
    }

    // ── Drawer show/hide ──────────────────────────────────────────────────────
    function openDrawer(nd) {
      selectedId = nd.id;
      const typeLabel = nd.type.toUpperCase();
      drawerLabel.textContent = typeLabel;
      drawerLabel.style.color = nd.type === 'project' ? 'rgba(255,176,0,0.5)' : 'rgba(92,255,208,0.3)';
      drawerName.textContent  = nd.label;
      drawerName.style.color  = nd.type === 'project' ? '#ffb000' : '#5cffd0';
      drawerDesc.textContent  = nd.desc;

      if (nd.action === 'project') {
        drawerAction.textContent  = '→ open project';
        drawerAction.style.display = 'block';
        drawerAction.onclick = () => ctx.openProject(nd.projectId);
      } else if (nd.action === 'contact') {
        drawerAction.textContent  = '→ open contact';
        drawerAction.style.display = 'block';
        drawerAction.onclick = () => ctx.openContact();
      } else {
        drawerAction.style.display = 'none';
      }

      drawer.style.transform = 'translateX(0)';
      drawer.style.pointerEvents = 'auto';
    }

    function closeDrawer() {
      selectedId = null;
      drawer.style.transform = 'translateX(100%)';
      drawer.style.pointerEvents = 'none';
    }

    // ── Loop ─────────────────────────────────────────────────────────────────
    function maybeIdleFire(now) {
      if (now - lastIdle > 2400) {
        const candidates = nodes.filter(nd => nd.id !== 'dhruv');
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (pick) fireNode(pick, 0, 0);
        lastIdle = now;
      }
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      c2d.clearRect(0, 0, W, H);
      stepPhysics(dt); updatePulses(dt); maybeIdleFire(now);
      drawEdges(); drawPulses(); drawNodes();
      rafId = requestAnimationFrame(loop);
    }

    // ── Events ────────────────────────────────────────────────────────────────
    function getXY(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function getNodeAt(mx, my) {
      for (const nd of nodes) {
        const dx = nd.x - mx, dy = nd.y - my;
        if (dx * dx + dy * dy < (nd.radius + 8) * (nd.radius + 8)) return nd;
      }
      return null;
    }
    function nudgeNear(mx, my) {
      for (const nd of nodes) {
        if (nd.id === 'dhruv') continue;
        const dx = mx - nd.x, dy = my - nd.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 110 * 110) {
          const dist = Math.sqrt(dist2);
          const f = 0.16 * (1 - dist / 110);
          nd.vx += (dx / dist) * f;
          nd.vy += (dy / dist) * f;
        }
      }
    }

    function onPointerMove(e) {
      const { x: mx, y: my } = getXY(e);
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
      const { x: mx, y: my } = getXY(e);
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
      isDragging = false; hoveredId = null;
      canvas.style.cursor = 'default';
    }
    function onClick(e) {
      const { x: mx, y: my } = getXY(e);
      const hit = getNodeAt(mx, my);
      if (hit) {
        if (selectedId === hit.id) { closeDrawer(); return; }
        openDrawer(hit);
        fireNode(hit, 0, 0);
        lastIdle = performance.now();
      } else {
        closeDrawer();
      }
    }

    let lastTouch = null;
    function onTouchStart(e) {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect();
        lastTouch = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top, px: panOffset.x, py: panOffset.y };
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

    const ro = new ResizeObserver(() => {
      resize();
      const dhruv = nodes.find(nd => nd.id === 'dhruv');
      if (dhruv) { dhruv.x = cx + panOffset.x; dhruv.y = cy + panOffset.y; }
    });
    ro.observe(body);

    // ── Contact strip ─────────────────────────────────────────────────────────
    const removeStrip = mountContactStrip(body);

    resize();
    buildGraph();
    setTimeout(() => {
      const dhruv = nodes.find(nd => nd.id === 'dhruv');
      if (dhruv) fireNode(dhruv, 0, 0);
      lastIdle = performance.now();
    }, 600);
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId); rafId = null;
      ro.disconnect();
      removeStrip();
      canvas.removeEventListener('pointermove',  onPointerMove);
      canvas.removeEventListener('pointerdown',  onPointerDown);
      canvas.removeEventListener('pointerup',    onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click',        onClick);
      canvas.removeEventListener('touchstart',   onTouchStart);
      canvas.removeEventListener('touchmove',    onTouchMove);
      canvas.remove();
      drawer.remove();
    };
  },
};
