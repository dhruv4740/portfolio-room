// os/apps/gravity.js — Matter.js chip physics — skills + projects as bouncing tags
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

// Matter.js is a CDN global loaded in index.html
const { Engine, Composite, Bodies, Body, MouseConstraint, Mouse, World } = Matter;

const BG     = '#050a08';
const FONT   = "600 12px 'JetBrains Mono',monospace";
const FONT_S = "500 10px 'JetBrains Mono',monospace";
const WALL_T = 60;
const CHIP_H = 32;
const PAD_X  = 18;
const RAD    = 6;

export default {
  id: 'gravity',
  title: 'gravity',
  icon: '⊚',
  width: 700,
  height: 540,

  mount(body, appCtx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;';

    // ── Canvas (leaves 36px for contact strip) ──
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;top:0;left:0;right:0;bottom:36px;cursor:grab;';
    body.appendChild(canvas);
    const c = canvas.getContext('2d');

    // ── Controls ──
    const ui = document.createElement('div');
    ui.style.cssText = [
      'position:absolute', 'bottom:42px', 'left:0', 'right:0',
      'display:flex', 'justify-content:center', 'gap:10px',
      'z-index:10', 'pointer-events:none',
    ].join(';');
    body.appendChild(ui);

    function mkBtn(label) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = [
        'pointer-events:auto', 'background:#0c1610',
        'border:1px solid rgba(92,255,208,0.25)',
        "color:rgba(92,255,208,0.7)", "font:9px 'JetBrains Mono',monospace",
        'letter-spacing:0.18em', 'padding:5px 16px', 'cursor:pointer',
        'transition:border-color 0.15s,color 0.15s',
      ].join(';');
      btn.addEventListener('mouseover', () => { btn.style.borderColor = '#5cffd0'; btn.style.color = '#5cffd0'; });
      btn.addEventListener('mouseout',  () => { btn.style.borderColor = 'rgba(92,255,208,0.25)'; btn.style.color = 'rgba(92,255,208,0.7)'; });
      ui.appendChild(btn);
      return btn;
    }
    const shakeBtn = mkBtn('SHAKE');
    const resetBtn = mkBtn('RESET');

    // ── Chip data ──
    const CHIP_DATA = [
      { label: content.identity.name, type: 'identity', action: () => appCtx.openContact() },
      ...content.projects.map(p => ({
        label: p.name, type: 'project', action: () => appCtx.openProject(p.id),
      })),
      ...content.skills.map(s => ({
        label: s.label, type: 'skill',
        action: s.projects?.length ? () => appCtx.openProject(s.projects[0]) : null,
      })),
    ];

    // ── Physics state ──
    let engine, world, mc, mouse;
    let chips = [];   // { body, label, w, h, type, action }
    let walls = [];
    let rafId = null;
    let W = 0, H = 0, dpr = 1;

    function measureLabel(label) {
      c.save(); c.font = FONT;
      const w = c.measureText(label).width;
      c.restore(); return w;
    }

    function buildWalls(w, h) {
      if (walls.length) { Composite.remove(world, walls); walls = []; }
      const opts = { isStatic: true, friction: 0.3, restitution: 0.3 };
      walls = [
        Bodies.rectangle(w / 2, h + WALL_T / 2, w * 3, WALL_T, opts),
        Bodies.rectangle(-WALL_T / 2, h / 2, WALL_T, h * 3, opts),
        Bodies.rectangle(w + WALL_T / 2, h / 2, WALL_T, h * 3, opts),
        Bodies.rectangle(w / 2, -WALL_T / 2, w * 3, WALL_T, opts),
      ];
      Composite.add(world, walls);
    }

    function buildChips(w, h) {
      chips.forEach(ch => Composite.remove(world, ch.body));
      chips = [];
      const shuffled = [...CHIP_DATA].sort(() => Math.random() - 0.5);
      shuffled.forEach(chip => {
        const tw = measureLabel(chip.label);
        const cw = Math.max(tw + PAD_X * 2, 72);
        const sx = WALL_T + 10 + Math.random() * Math.max(1, w - WALL_T * 2 - cw - 10);
        const sy = 50 + Math.random() * (h * 0.42 - 50);
        const b = Bodies.rectangle(sx + cw / 2, sy, cw, CHIP_H, {
          restitution: 0.28, friction: 0.5, frictionAir: 0.016, density: 0.003,
          chamfer: { radius: RAD }, label: chip.label,
        });
        Body.setAngle(b, (Math.random() - 0.5) * 0.3);
        Composite.add(world, b);
        chips.push({ body: b, label: chip.label, w: cw, h: CHIP_H, type: chip.type, action: chip.action });
      });
    }

    function initPhysics(w, h) {
      if (!engine) {
        engine = Engine.create({ gravity: { x: 0, y: 1.3 } });
        world = engine.world;
      } else {
        World.clear(world, false);
        Engine.clear(engine);
        engine.gravity.y = 1.3;
        walls = []; chips = [];
      }
      buildWalls(w, h);
      buildChips(w, h);
      if (mouse) {
        mc = MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } },
        });
        Composite.add(world, mc);
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth;
      H = body.clientHeight - 36;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!mouse) {
        // Create mouse after canvas is sized
        mouse = Mouse.create(canvas);
        mouse.pixelRatio = dpr;
      } else {
        Mouse.setElement(mouse, canvas);
        mouse.pixelRatio = dpr;
      }
      initPhysics(W, H);
    }

    // ── Drawing ──
    function roundRect(x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
      c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
      c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
      c.closePath();
    }

    function render() {
      c.clearRect(0, 0, W, H);
      c.fillStyle = BG; c.fillRect(0, 0, W, H);

      chips.forEach(({ body: b, label, w: cw, h: ch, type }) => {
        const { x: px, y: py } = b.position;
        const angle = b.angle;
        c.save(); c.translate(px, py); c.rotate(angle);
        const x = -cw / 2, y = -ch / 2;

        // shadow
        c.fillStyle = 'rgba(0,0,0,0.3)';
        roundRect(x + 2, y + 3, cw, ch, RAD); c.fill();

        // fill
        c.fillStyle = type === 'project' ? '#091a0f' :
                      type === 'identity' ? '#100d00' : '#080e0b';
        roundRect(x, y, cw, ch, RAD); c.fill();

        // border
        c.strokeStyle = type === 'project' ? 'rgba(92,255,208,0.55)' :
                        type === 'identity' ? 'rgba(255,176,0,0.55)' :
                        'rgba(92,255,208,0.2)';
        c.lineWidth = type === 'skill' ? 0.8 : 1.2;
        roundRect(x, y, cw, ch, RAD); c.stroke();

        // accent bar
        if (type !== 'skill') {
          c.fillStyle = type === 'identity' ? 'rgba(255,176,0,0.7)' : 'rgba(92,255,208,0.7)';
          roundRect(x, y + 5, 3, ch - 10, 1.5); c.fill();
        }

        // label
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = type === 'skill' ? FONT_S : FONT;
        c.fillStyle = type === 'project' ? '#5cffd0' :
                      type === 'identity' ? '#ffb000' :
                      'rgba(92,255,208,0.65)';
        c.fillText(label, 0, 0);
        c.restore();
      });
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      Engine.update(engine, 1000 / 60);
      // recover escaped chips
      chips.forEach(({ body: b }) => {
        const { x, y } = b.position;
        if (y > H + 100 || y < -H || x < -W || x > W * 2) {
          Body.setPosition(b, { x: W / 2 + (Math.random() - 0.5) * 60, y: 40 });
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
        }
      });
      render();
    }

    function shake() {
      chips.forEach(({ body: b }) => {
        Body.applyForce(b, b.position, {
          x: (Math.random() - 0.5) * 0.05,
          y: -(Math.random() * 0.035 + 0.015),
        });
      });
    }

    // ── Click-to-navigate: short click (< 6px drag) ──
    let downPos = null;
    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      downPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onPointerUp(e) {
      if (!downPos) return;
      const rect = canvas.getBoundingClientRect();
      const ux = e.clientX - rect.left, uy = e.clientY - rect.top;
      const dx = ux - downPos.x, dy = uy - downPos.y;
      downPos = null;
      if (dx * dx + dy * dy > 36) return; // was a drag
      const hit = chips.find(ch => {
        const bx = ch.body.position.x - ux, by = ch.body.position.y - uy;
        return Math.sqrt(bx * bx + by * by) < Math.max(ch.w, ch.h) / 2;
      });
      if (hit?.action) hit.action();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup',   onPointerUp);
    shakeBtn.addEventListener('click', shake);
    resetBtn.addEventListener('click', () => {
      if (rafId) cancelAnimationFrame(rafId);
      resize();
      rafId = requestAnimationFrame(loop);
    });

    const ro = new ResizeObserver(resize);
    ro.observe(body);

    const removeStrip = mountContactStrip(body);

    resize();
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      removeStrip();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup',   onPointerUp);
      if (mouse && Matter.Mouse.clearSourceEvents) Matter.Mouse.clearSourceEvents(mouse);
      if (engine) { try { World.clear(world, false); Engine.clear(engine); } catch (_) {} }
    };
  },
};
