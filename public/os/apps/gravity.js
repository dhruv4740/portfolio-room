// os/apps/gravity.js — Matter.js chip physics — skills + projects as bouncing tags
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

// Matter.js is loaded from CDN in index.html; embedded path runs self-contained 2D chip physics
const M = typeof Matter !== 'undefined' ? Matter : null;

const BG     = '#050a08';
const FONT   = "600 12px 'JetBrains Mono',monospace";
const FONT_S = "500 10px 'JetBrains Mono',monospace";
const WALL_T = 60;
const CHIP_H = 32;
const PAD_X  = 18;
const RAD    = 6;

export default {
  id: 'skills',
  title: 'Skills',
  icon: '⊚',
  width: 700,
  height: 540,

  mount(body, appCtx) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#050a08;display:flex;flex-direction:column;';

    // One-line project header
    const projHeader = document.createElement('div');
    projHeader.className = 'app-project-header';
    projHeader.style.cssText = [
      'height:28px', 'display:flex', 'align-items:center', 'padding:0 16px',
      'background:#0c1610', 'border-bottom:1px solid rgba(92,255,208,0.22)',
      'color:#5cffd0', "font:11px/1 'JetBrains Mono',monospace",
      'letter-spacing:0.05em', 'flex-shrink:0', 'user-select:none',
      'position:relative', 'z-index:20',
    ].join(';');
    projHeader.textContent = 'Skills — Interactive skill physics';
    body.appendChild(projHeader);

    // ── Canvas (leaves 36px for contact strip) ──
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;position:absolute;top:28px;left:0;right:0;bottom:36px;cursor:grab;';
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
      if (!M) return;
      if (walls.length) { M.Composite.remove(world, walls); walls = []; }
      const opts = { isStatic: true, friction: 0.3, restitution: 0.3 };
      walls = [
        M.Bodies.rectangle(w / 2, h + WALL_T / 2, w * 3, WALL_T, opts),
        M.Bodies.rectangle(-WALL_T / 2, h / 2, WALL_T, h * 3, opts),
        M.Bodies.rectangle(w + WALL_T / 2, h / 2, WALL_T, h * 3, opts),
        M.Bodies.rectangle(w / 2, -WALL_T / 2, w * 3, WALL_T, opts),
      ];
      M.Composite.add(world, walls);
    }

    function buildChips(w, h) {
      if (M && world) {
        chips.forEach(ch => M.Composite.remove(world, ch.body));
      }
      chips = [];
      const shuffled = [...CHIP_DATA].sort(() => Math.random() - 0.5);
      shuffled.forEach(chip => {
        const tw = measureLabel(chip.label);
        const cw = Math.max(tw + PAD_X * 2, 72);
        const sx = WALL_T + 10 + Math.random() * Math.max(1, w - WALL_T * 2 - cw - 10);
        const sy = 50 + Math.random() * (h * 0.42 - 50);
        if (M) {
          const b = M.Bodies.rectangle(sx + cw / 2, sy, cw, CHIP_H, {
            restitution: 0.28, friction: 0.5, frictionAir: 0.016, density: 0.003,
            chamfer: { radius: RAD }, label: chip.label,
          });
          M.Body.setAngle(b, (Math.random() - 0.5) * 0.3);
          M.Composite.add(world, b);
          chips.push({ body: b, label: chip.label, w: cw, h: CHIP_H, type: chip.type, action: chip.action });
        } else {
          const b = {
            position: { x: sx + cw / 2, y: sy },
            angle: (Math.random() - 0.5) * 0.3,
            velocity: { x: (Math.random() - 0.5) * 2, y: Math.random() * 2 },
            angularVelocity: (Math.random() - 0.5) * 0.02,
          };
          chips.push({ body: b, label: chip.label, w: cw, h: CHIP_H, type: chip.type, action: chip.action });
        }
      });
    }

    function initPhysics(w, h) {
      if (M) {
        if (!engine) {
          engine = M.Engine.create({ gravity: { x: 0, y: 1.3 } });
          world = engine.world;
        } else {
          M.World.clear(world, false);
          M.Engine.clear(engine);
          engine.gravity.y = 1.3;
          walls = []; chips = [];
        }
        buildWalls(w, h);
        buildChips(w, h);
        if (mouse) {
          mc = M.MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } },
          });
          M.Composite.add(world, mc);
        }
      } else {
        chips = [];
        buildChips(w, h);
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = body.clientWidth;
      H = body.clientHeight - 36;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (M) {
        if (!mouse) {
          mouse = M.Mouse.create(canvas);
          mouse.pixelRatio = dpr;
        } else {
          M.Mouse.setElement(mouse, canvas);
          mouse.pixelRatio = dpr;
        }
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
      if (M && engine) {
        M.Engine.update(engine, 1000 / 60);
      } else {
        chips.forEach((ch) => {
          if (draggedChip === ch) return;
          const b = ch.body;
          b.velocity.y += 0.45;
          b.position.x += b.velocity.x;
          b.position.y += b.velocity.y;
          b.angle += b.angularVelocity;

          // Floor
          if (b.position.y + ch.h / 2 > H) {
            b.position.y = H - ch.h / 2;
            b.velocity.y *= -0.35;
            b.velocity.x *= 0.85;
            b.angularVelocity *= 0.7;
          }
          // Walls
          if (b.position.x - ch.w / 2 < 0) {
            b.position.x = ch.w / 2;
            b.velocity.x *= -0.5;
          } else if (b.position.x + ch.w / 2 > W) {
            b.position.x = W - ch.w / 2;
            b.velocity.x *= -0.5;
          }
        });
      }

      // recover escaped chips
      chips.forEach(({ body: b }) => {
        const { x, y } = b.position;
        if (y > H + 100 || y < -H || x < -W || x > W * 2) {
          if (M) {
            M.Body.setPosition(b, { x: W / 2 + (Math.random() - 0.5) * 60, y: 40 });
            M.Body.setVelocity(b, { x: 0, y: 0 });
            M.Body.setAngularVelocity(b, 0);
          } else {
            b.position.x = W / 2 + (Math.random() - 0.5) * 60;
            b.position.y = 40;
            b.velocity.x = 0;
            b.velocity.y = 0;
            b.angularVelocity = 0;
          }
        }
      });
      render();
    }

    function shake() {
      chips.forEach(({ body: b }) => {
        if (M) {
          M.Body.applyForce(b, b.position, {
            x: (Math.random() - 0.5) * 0.05,
            y: -(Math.random() * 0.035 + 0.015),
          });
        } else {
          b.velocity.x = (Math.random() - 0.5) * 14;
          b.velocity.y = -(Math.random() * 12 + 6);
          b.angularVelocity = (Math.random() - 0.5) * 0.2;
        }
      });
    }

    // ── Click & drag ──
    let downPos = null;
    let draggedChip = null;
    let dragOffset = { x: 0, y: 0 };
    let lastDragPos = { x: 0, y: 0 };

    function onPointerDown(e) {
      const rect = canvas.getBoundingClientRect();
      const ux = e.clientX - rect.left, uy = e.clientY - rect.top;
      downPos = { x: ux, y: uy };
      if (!M) {
        const hit = chips.find(ch => {
          const bx = ch.body.position.x - ux, by = ch.body.position.y - uy;
          return Math.abs(bx) < ch.w / 2 && Math.abs(by) < ch.h / 2;
        });
        if (hit) {
          draggedChip = hit;
          dragOffset = { x: hit.body.position.x - ux, y: hit.body.position.y - uy };
          lastDragPos = { x: ux, y: uy };
        }
      }
    }

    function onPointerMove(e) {
      if (!M && draggedChip) {
        const rect = canvas.getBoundingClientRect();
        const ux = e.clientX - rect.left, uy = e.clientY - rect.top;
        draggedChip.body.position.x = ux + dragOffset.x;
        draggedChip.body.position.y = uy + dragOffset.y;
        draggedChip.body.velocity.x = (ux - lastDragPos.x) * 0.5;
        draggedChip.body.velocity.y = (uy - lastDragPos.y) * 0.5;
        lastDragPos = { x: ux, y: uy };
      }
    }

    function onPointerUp(e) {
      draggedChip = null;
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
    canvas.addEventListener('pointermove', onPointerMove);
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
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup',   onPointerUp);
      if (mouse && M?.Mouse?.clearSourceEvents) M.Mouse.clearSourceEvents(mouse);
      if (engine && M) { try { M.World.clear(world, false); M.Engine.clear(engine); } catch (_) {} }
    };
  },
};
