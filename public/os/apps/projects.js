// os/apps/projects.js — quest log, driven by content.js, with link chips + store deep-links
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

const GLYPHS = '░▒▓■▪□▫◆◇●○▲△▼▽⌷⌸⌹⌺⌻⌼⌽⌾⌿⍀⍁⌦⌧ÆØ¥ÐΩ∑∞≠≈√∫∂ℵ';

const CSS = `
  .ql-root {
    display: flex; flex-direction: column; height: 100%;
    background: #050a08;
    font-family: 'JetBrains Mono', monospace; color: #5cffd0; overflow: hidden;
    background-image: repeating-linear-gradient(
      transparent 0, transparent 3px,
      rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px
    );
  }
  .ql-header {
    flex-shrink: 0; padding: 12px 18px 10px;
    border-bottom: 1px solid rgba(92,255,208,0.1);
    display: flex; align-items: center; gap: 14px;
  }
  .ql-title { font-size: 10px; letter-spacing: 0.28em; color: rgba(92,255,208,0.55); }
  .ql-integrity-wrap {
    display: flex; align-items: center; gap: 8px;
    margin-left: auto; font-size: 9px; color: rgba(92,255,208,0.35); letter-spacing: 0.1em;
  }
  .ql-integrity-track {
    width: 80px; height: 5px;
    background: rgba(92,255,208,0.06); border: 1px solid rgba(92,255,208,0.12);
    overflow: hidden;
  }
  .ql-integrity-fill {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, rgba(92,255,208,0.3), #5cffd0);
    box-shadow: 0 0 6px rgba(92,255,208,0.5);
    transition: width 0.5s ease;
  }
  .ql-integrity-pct { min-width: 32px; text-align: right; color: #5cffd0; }

  .ql-scroll {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 14px 18px 20px;
    scrollbar-width: thin; scrollbar-color: rgba(92,255,208,0.15) transparent;
  }
  .ql-scroll::-webkit-scrollbar { width: 4px; }
  .ql-scroll::-webkit-scrollbar-thumb { background: rgba(92,255,208,0.15); }

  .ql-card {
    border: 1px solid rgba(92,255,208,0.1);
    background: rgba(5,10,8,0.8);
    margin-bottom: 10px; cursor: pointer; position: relative; overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  /* locked state — dramatic */
  .ql-card:not(.ql-decoded) {
    background-image:
      repeating-conic-gradient(rgba(255,0,128,0.08) 0% 25%, transparent 0% 50%),
      repeating-linear-gradient(transparent 0, transparent 3px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0.35) 4px);
    background-size: 10px 10px, 100% 100%;
  }
  .ql-card:not(.ql-decoded):hover { border-color: rgba(92,255,208,0.25); }
  .ql-card.ql-decoded {
    border-color: rgba(92,255,208,0.3);
    box-shadow: 0 0 20px rgba(92,255,208,0.04) inset;
  }
  .ql-card.ql-main-quest.ql-decoded {
    border-color: rgba(255,176,0,0.4);
    box-shadow: 0 0 28px rgba(255,176,0,0.06) inset;
  }
  .ql-card-inner { position: relative; z-index: 2; padding: 14px 16px; }

  .ql-type-tag {
    font-size: 8px; letter-spacing: 0.22em; margin-bottom: 7px;
    display: flex; align-items: center; gap: 5px;
    color: rgba(92,255,208,0.35);
  }
  .ql-card.ql-main-quest .ql-type-tag { color: rgba(255,176,0,0.4); }
  .ql-card.ql-decoded .ql-type-tag    { color: rgba(92,255,208,0.55); }
  .ql-card.ql-main-quest.ql-decoded .ql-type-tag { color: #ffb000; }

  .ql-card-title {
    font-size: 16px; letter-spacing: 0.03em; color: #5cffd0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: color 0.25s; margin-bottom: 3px;
  }
  .ql-card:not(.ql-decoded) .ql-card-title {
    color: rgba(92,255,208,0.25);
    text-shadow: 2px 0 rgba(255,0,64,0.7), -2px 0 rgba(0,68,255,0.7);
    animation: ql-flicker 0.38s steps(1) infinite, ql-rgb 0.13s steps(1) infinite;
  }
  .ql-card.ql-main-quest.ql-decoded .ql-card-title { color: #ffb000; }

  @keyframes ql-flicker { 0%,100%{opacity:1} 28%{opacity:0.35} 55%{opacity:0.8} }
  @keyframes ql-rgb {
    0%   { text-shadow:  3px 0 rgba(255,0,64,.8), -3px 0 rgba(0,68,255,.8); }
    20%  { text-shadow: -2px 0 rgba(255,0,64,.8),  2px 0 rgba(0,68,255,.8); }
    40%  { text-shadow:  4px 1px rgba(255,0,64,.6),-4px -1px rgba(0,68,255,.6); }
    60%  { text-shadow:  0   0 rgba(255,0,64,.4),  0   0 rgba(0,68,255,.4); }
    80%  { text-shadow: -3px 0 rgba(255,0,64,.8),  3px 0 rgba(0,68,255,.8); }
    100% { text-shadow:  2px 0 rgba(255,0,64,.6), -2px 0 rgba(0,68,255,.6); }
  }

  .ql-locked-badge {
    display: inline-block; font-size: 8px; color: rgba(255,79,79,0.8);
    letter-spacing: 0.12em; margin-top: 4px;
    animation: ql-blink 1.1s steps(1) infinite;
  }
  @keyframes ql-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .ql-hint { display:none; }

  .ql-desc { display: none; margin-top: 10px; border-top: 1px solid rgba(92,255,208,0.1); padding-top: 10px; }
  .ql-card.ql-decoded .ql-desc { display: block; }
  .ql-card.ql-main-quest.ql-decoded .ql-desc { border-top-color: rgba(255,176,0,0.15); }
  .ql-desc-text {
    font-size: 11px; color: rgba(92,255,208,0.55); line-height: 1.6; white-space: pre-line;
  }
  .ql-card.ql-main-quest.ql-decoded .ql-desc-text { color: rgba(255,176,0,0.65); }

  .ql-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
  .ql-tag {
    font-size: 8px; letter-spacing: 0.14em; padding: 2px 7px;
    border: 1px solid rgba(92,255,208,0.18); color: rgba(92,255,208,0.45);
  }
  .ql-card.ql-main-quest.ql-decoded .ql-tag { border-color: rgba(255,176,0,0.2); color: rgba(255,176,0,0.55); }

  .ql-links { display: flex; gap: 7px; margin-top: 10px; flex-wrap: wrap; }
  .ql-link-chip {
    font-size: 8px; letter-spacing: 0.14em; padding: 3px 10px;
    border: 1px solid rgba(92,255,208,0.3); color: rgba(92,255,208,0.7);
    text-decoration: none; cursor: pointer; transition: all 0.15s;
    display: inline-block;
  }
  .ql-link-chip:hover { border-color: #5cffd0; color: #5cffd0; }
  .ql-card.ql-main-quest.ql-decoded .ql-link-chip { border-color: rgba(255,176,0,0.4); color: rgba(255,176,0,0.8); }
  .ql-card.ql-main-quest.ql-decoded .ql-link-chip:hover { border-color: #ffb000; color: #ffb000; }

  .ql-footer {
    flex-shrink: 0; padding: 7px 18px;
    border-top: 1px solid rgba(92,255,208,0.08);
    font-size: 8px; color: rgba(92,255,208,0.25); letter-spacing: 0.15em;
    display: flex; justify-content: space-between;
  }
`;

function scrambleTo(el, target, duration, onDone) {
  const chars = target.split('');
  const total = chars.length;
  const resolved = new Array(total).fill(false);
  const start = performance.now();
  let raf;
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const solveCount = Math.floor(t * total);
    let out = '';
    for (let i = 0; i < total; i++) {
      if (resolved[i]) { out += chars[i]; }
      else if (i < solveCount) { resolved[i] = true; out += chars[i]; }
      else { out += chars[i] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0]; }
    }
    el.textContent = out;
    if (t < 1) { raf = requestAnimationFrame(tick); }
    else { el.textContent = target; if (onDone) onDone(); }
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

const TYPE_GLYPHS = { 'MAIN QUEST': '◆', 'SIDE QUEST': '◇' };

function makeCorruptTitle(name) {
  return name.split('').map((c, i) => {
    if (i % 4 === 0 && /[a-zA-Z]/.test(c)) return ['█', '░', 'Ξ', 'Δ', '0'][i % 5];
    return c;
  }).join('');
}

export default {
  id: 'projects',
  title: 'projects',
  icon: '◇',
  width: 740,
  height: 540,

  mount(body, ctx) {
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    body.appendChild(styleEl);

    const root = document.createElement('div');
    root.className = 'ql-root';
    body.appendChild(root);

    // header
    const header = document.createElement('div');
    header.className = 'ql-header';
    header.innerHTML = `
      <span class="ql-title">◈ QUEST LOG // PROJECTS</span>
      <div class="ql-integrity-wrap">
        <span>DECODED</span>
        <div class="ql-integrity-track"><div class="ql-integrity-fill" id="ql-ifill"></div></div>
        <span class="ql-integrity-pct" id="ql-ipct">0%</span>
      </div>`;
    root.appendChild(header);

    const scroll = document.createElement('div');
    scroll.className = 'ql-scroll';
    root.appendChild(scroll);

    const footer = document.createElement('div');
    footer.className = 'ql-footer';
    footer.innerHTML = `<span>▶ INTERACT WITH ENTRY TO DECODE</span><span id="ql-fcount">0 / ${content.projects.length} DECODED</span>`;
    root.appendChild(footer);

    const intFill  = root.querySelector('#ql-ifill');
    const intPct   = root.querySelector('#ql-ipct');
    const fCount   = root.querySelector('#ql-fcount');
    const cleanups = [];
    let decodedCount = 0;

    function updateIntegrity() {
      const pct = Math.round((decodedCount / content.projects.length) * 100);
      intFill.style.width = pct + '%';
      intPct.textContent = pct + '%';
      fCount.textContent = `${decodedCount} / ${content.projects.length} DECODED`;
      if (pct >= 100) {
        ctx?.store?.emit('xp-maxed', {});
      }
    }

    // Map: projectId → card scroll target
    const cardMap = {};

    content.projects.forEach((proj) => {
      const isMain = proj.type === 'MAIN QUEST';
      const glyph  = TYPE_GLYPHS[proj.type] || '◇';

      const card = document.createElement('div');
      card.className = 'ql-card' + (isMain ? ' ql-main-quest' : '');
      cardMap[proj.id] = card;

      const corruptTitle = makeCorruptTitle(proj.name);

      card.innerHTML = `
        <div class="ql-card-inner">
          <div class="ql-type-tag"><span>${glyph}</span><span>${proj.type} · ${proj.year}</span></div>
          <div class="ql-card-title" data-corrupt="${corruptTitle}" data-real="${proj.name}">${corruptTitle}</div>
          <div class="ql-locked-badge">[CORRUPTED] ▓▓ LOCKED ▓▓</div>
          <div class="ql-desc">
            <div class="ql-desc-text"></div>
            <div class="ql-tags">${proj.tech.map(t => `<span class="ql-tag">${t}</span>`).join('')}</div>
            <div class="ql-links"></div>
          </div>
        </div>`;

      let decoding = false, decoded = false;

      function decode() {
        if (decoding || decoded) return;
        decoding = true;

        const titleEl = card.querySelector('.ql-card-title');
        const badge   = card.querySelector('.ql-locked-badge');
        const descEl  = card.querySelector('.ql-desc-text');
        const linksEl = card.querySelector('.ql-links');

        card.classList.add('ql-decoded');
        badge.style.display = 'none';

        const cancel = scrambleTo(titleEl, proj.name, 900, () => {
          const cancelDesc = scrambleTo(descEl, proj.description, 700, () => {
            decoded = true; decoding = false;
            decodedCount++;
            updateIntegrity();

            // Render link chips (only non-empty)
            if (proj.links.live) {
              const a = document.createElement('a');
              a.href = proj.links.live; a.target = '_blank'; a.rel = 'noopener noreferrer';
              a.className = 'ql-link-chip'; a.textContent = '↗ live';
              linksEl.appendChild(a);
            }
            if (proj.links.github) {
              const a = document.createElement('a');
              a.href = proj.links.github; a.target = '_blank'; a.rel = 'noopener noreferrer';
              a.className = 'ql-link-chip'; a.textContent = '⌥ github';
              linksEl.appendChild(a);
            }
          });
          cleanups.push(cancelDesc);
        });
        cleanups.push(cancel);
      }

      const onEnter = () => decode();
      const onClick = () => decode();
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('click', onClick);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('click', onClick);
      });

      scroll.appendChild(card);
    });

    // Deep-link: store emits 'open-project' → scroll to that card + decode it
    const unsubOpenProject = ctx?.store?.on('open-project', ({ id }) => {
      const card = cardMap[id];
      if (!card) return;
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.dispatchEvent(new Event('mouseenter'));
      }, 120);
    });

    // ── Contact strip ──
    const removeStrip = mountContactStrip(root);

    return function cleanup() {
      cleanups.forEach(fn => fn());
      if (typeof unsubOpenProject === 'function') unsubOpenProject();
      removeStrip();
    };
  },
};
