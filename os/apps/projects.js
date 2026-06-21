// projects.js — dhruvOS "QUEST LOG" app
// Merges: RPG quest-log framing + corrupted.html glitch aesthetic + text-scramble decoder

const GLYPHS = '░▒▓■▪□▫◆◇●○▲△▼▽⌷⌸⌹⌺⌻⌼⌽⌾⌿⍀⍁⌦⌧ÆØ¥ÐΩ∑∞≠≈√∫∂ℵ';
const MOJIBAKE = '▓▓▓▓ LOCKED ▓▓▓▓';

const PROJECTS = [
  {
    id: 'reddit-copilot',
    type: 'MAIN QUEST',
    typeGlyph: '◆',
    corruptTitle: 'R█DΔ1T GR0WTH C░PΨL0T',
    title: 'Reddit Growth Copilot',
    description: 'AI that scans Reddit in real-time to surface the most relevant threads for\nyour product — then drafts on-brand, non-spammy replies that drive\ngenuine growth. Built with Next.js, OpenAI, and Reddit API.',
    tags: ['AI', 'Next.js', 'Growth', 'OpenAI'],
    reward: '+500 XP',
  },
  {
    id: 'geomaps',
    type: 'SIDE QUEST',
    typeGlyph: '◇',
    corruptTitle: 'G░░SVG M█PS DΞM0',
    title: 'GeoSVG Maps Demo',
    description: 'Interactive map explorer built with Leaflet.js and custom SVG overlays.\nLive coordinate display, refresh controls, and modern in-page notifications.',
    tags: ['Leaflet', 'SVG', 'Maps'],
    reward: '+200 XP',
  },
  {
    id: '3d-portfolio',
    type: 'SIDE QUEST',
    typeGlyph: '◇',
    corruptTitle: '3D P░RTFΞL10 // R3F',
    title: '3D Portfolio',
    description: 'Immersive portfolio experience using React Three Fiber.\nFloating geometry, ambient lighting, and smooth camera transitions.',
    tags: ['R3F', 'Three.js', 'React'],
    reward: '+300 XP',
  },
  {
    id: 'project-four',
    type: 'SIDE QUEST',
    typeGlyph: '◇',
    corruptTitle: 'S1DE QU3ST // UN█NOWN',
    title: 'Project Four',
    description: 'Placeholder — new quest incoming. Check back soon for updates.',
    tags: ['TBD'],
    reward: '+??? XP',
  },
];

const CSS = `
  .ql-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0b0b0d;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    color: #5cffd0;
    overflow: hidden;
  }

  /* ── header bar ── */
  .ql-header {
    flex-shrink: 0;
    padding: 10px 16px 8px;
    border-bottom: 1px solid #1a2a22;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .ql-title {
    font-size: 11px;
    letter-spacing: 0.3em;
    color: #5cffd0;
    text-transform: uppercase;
  }
  .ql-integrity-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    font-size: 9px;
    color: #3a8a68;
    letter-spacing: 0.1em;
  }
  .ql-integrity-track {
    width: 90px;
    height: 6px;
    background: #0d1a14;
    border: 1px solid #1a3328;
    position: relative;
    overflow: hidden;
  }
  .ql-integrity-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #1a6644, #5cffd0);
    box-shadow: 0 0 6px #5cffd0;
    transition: width 0.5s ease;
  }
  .ql-integrity-pct {
    min-width: 34px;
    text-align: right;
    color: #5cffd0;
  }

  /* ── scroll area ── */
  .ql-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 14px 16px 20px;
    scrollbar-width: thin;
    scrollbar-color: #1a3328 #0b0b0d;
  }
  .ql-scroll::-webkit-scrollbar { width: 5px; }
  .ql-scroll::-webkit-scrollbar-track { background: #0b0b0d; }
  .ql-scroll::-webkit-scrollbar-thumb { background: #1a3328; border-radius: 2px; }

  /* ── quest card ── */
  .ql-card {
    border: 1px solid #1a2a22;
    background: #0e1510;
    margin-bottom: 10px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
  }
  .ql-card:hover { border-color: #2a4a38; }
  .ql-card.ql-decoded { border-color: #5cffd0; cursor: default; }
  .ql-card.ql-main-quest { border-color: #2a3a18; }
  .ql-card.ql-main-quest.ql-decoded { border-color: #ffb000; }

  /* checkerboard noise overlay on corrupted cards */
  .ql-card:not(.ql-decoded)::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-conic-gradient(rgba(255,0,255,0.05) 0% 25%, transparent 0% 50%);
    background-size: 12px 12px;
    pointer-events: none;
    z-index: 1;
  }

  .ql-card-inner { position: relative; z-index: 2; padding: 12px 14px; }

  /* type tag */
  .ql-type-tag {
    font-size: 8px;
    letter-spacing: 0.2em;
    color: #2a6a4a;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .ql-card.ql-main-quest .ql-type-tag { color: #8a6a00; }
  .ql-card.ql-decoded.ql-main-quest .ql-type-tag { color: #ffb000; }
  .ql-card.ql-decoded .ql-type-tag { color: #5cffd0; }

  /* title row */
  .ql-card-title {
    font-size: 15px;
    letter-spacing: 0.05em;
    color: #5cffd0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }
  .ql-card:not(.ql-decoded) .ql-card-title {
    color: #1a5a3a;
    animation: ql-title-flicker 0.4s steps(1) infinite;
  }
  .ql-card.ql-main-quest.ql-decoded .ql-card-title { color: #ffb000; }

  @keyframes ql-title-flicker {
    0%   { opacity: 1; }
    25%  { opacity: 0.4; filter: hue-rotate(120deg); }
    50%  { opacity: 1; }
    80%  { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* RGB-split glitch on corrupted title */
  .ql-card:not(.ql-decoded) .ql-card-title {
    text-shadow: 2px 0 #ff0044, -2px 0 #0044ff;
    animation: ql-title-flicker 0.4s steps(1) infinite, ql-rgb-split 0.15s steps(1) infinite;
  }
  @keyframes ql-rgb-split {
    0%   { text-shadow:  3px 0 #ff0044, -3px 0 #0044ff; clip-path: inset(0 0 80% 0); }
    15%  { text-shadow: -2px 0 #ff0044,  2px 0 #0044ff; clip-path: inset(40% 0 30% 0); }
    30%  { text-shadow:  4px 0 #ff0044, -4px 0 #0044ff; clip-path: inset(0 0 0 0); }
    50%  { text-shadow:  0   0 #ff0044,  0   0 #0044ff; clip-path: inset(60% 0 10% 0); }
    70%  { text-shadow: -3px 1px #ff0044, 3px -1px #0044ff; clip-path: inset(0 0 0 0); }
    85%  { text-shadow:  2px 0 #ff0044, -2px 0 #0044ff; clip-path: inset(20% 0 60% 0); }
    100% { text-shadow: -2px 0 #ff0044,  2px 0 #0044ff; clip-path: inset(0 0 0 0); }
  }

  /* locked badge */
  .ql-locked-badge {
    display: inline-block;
    font-size: 8px;
    color: #ff4444;
    letter-spacing: 0.1em;
    margin-top: 5px;
    animation: ql-badge-blink 1.2s steps(1) infinite;
  }
  @keyframes ql-badge-blink { 0%,100%{opacity:1;} 50%{opacity:0;} }

  /* expanded description */
  .ql-desc {
    display: none;
    margin-top: 8px;
    border-top: 1px solid #1a2a22;
    padding-top: 8px;
  }
  .ql-card.ql-decoded .ql-desc { display: block; }
  .ql-card.ql-main-quest.ql-decoded .ql-desc { border-top-color: #3a2a00; }

  .ql-desc-text {
    font-size: 11px;
    color: #3aa080;
    line-height: 1.55;
    white-space: pre-line;
  }
  .ql-card.ql-main-quest.ql-decoded .ql-desc-text { color: #c08000; }

  .ql-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 8px;
  }
  .ql-tag {
    font-size: 8px;
    letter-spacing: 0.12em;
    padding: 2px 6px;
    border: 1px solid #1a4a2a;
    color: #2a8a5a;
  }
  .ql-card.ql-main-quest.ql-decoded .ql-tag {
    border-color: #4a3a00;
    color: #aa8000;
  }

  .ql-reward {
    font-size: 9px;
    color: #2a6a4a;
    margin-top: 8px;
    letter-spacing: 0.15em;
  }
  .ql-card.ql-decoded .ql-reward { color: #5cffd0; }
  .ql-card.ql-main-quest.ql-decoded .ql-reward { color: #ffb000; }

  /* hover hint on corrupted */
  .ql-hint {
    font-size: 8px;
    color: #1a4a2a;
    margin-top: 6px;
    letter-spacing: 0.1em;
  }
  .ql-card:not(.ql-decoded):hover .ql-hint { color: #2a7a4a; }

  /* footer */
  .ql-footer {
    flex-shrink: 0;
    padding: 7px 16px;
    border-top: 1px solid #1a2a22;
    font-size: 8px;
    color: #1a4a2a;
    letter-spacing: 0.15em;
    display: flex;
    justify-content: space-between;
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
      if (resolved[i]) {
        out += chars[i];
      } else if (i < solveCount) {
        resolved[i] = true;
        out += chars[i];
      } else {
        out += chars[i] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0];
      }
    }
    el.textContent = out;
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      el.textContent = target;
      if (onDone) onDone();
    }
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export default {
  id: 'projects',
  title: 'projects',
  icon: '◇',
  width: 720,
  height: 520,

  mount(body, ctx) {
    // inject scoped styles
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    body.appendChild(styleEl);

    // root
    const root = document.createElement('div');
    root.className = 'ql-root';
    body.appendChild(root);

    // ── header
    const header = document.createElement('div');
    header.className = 'ql-header';
    header.innerHTML = `
      <span class="ql-title">◈ QUEST LOG // PROJECTS</span>
      <div class="ql-integrity-wrap">
        <span>DECODED</span>
        <div class="ql-integrity-track"><div class="ql-integrity-fill" id="ql-ifill"></div></div>
        <span class="ql-integrity-pct" id="ql-ipct">0%</span>
      </div>
    `;
    root.appendChild(header);

    // ── scroll area
    const scroll = document.createElement('div');
    scroll.className = 'ql-scroll';
    root.appendChild(scroll);

    // ── footer
    const footer = document.createElement('div');
    footer.className = 'ql-footer';
    footer.innerHTML = `<span>▶ HOVER/CLICK ENTRY TO DECODE</span><span id="ql-fcount">0 / ${PROJECTS.length} DECODED</span>`;
    root.appendChild(footer);

    const intFill = root.querySelector('#ql-ifill');
    const intPct  = root.querySelector('#ql-ipct');
    const fCount  = root.querySelector('#ql-fcount');

    let decodedCount = 0;
    const cleanups = [];

    function updateIntegrity() {
      const pct = Math.round((decodedCount / PROJECTS.length) * 100);
      intFill.style.width = pct + '%';
      intPct.textContent = pct + '%';
      fCount.textContent = `${decodedCount} / ${PROJECTS.length} DECODED`;
    }

    // build cards
    PROJECTS.forEach((proj) => {
      const isMain = proj.type === 'MAIN QUEST';

      const card = document.createElement('div');
      card.className = 'ql-card' + (isMain ? ' ql-main-quest' : '');

      card.innerHTML = `
        <div class="ql-card-inner">
          <div class="ql-type-tag">
            <span>${proj.typeGlyph}</span>
            <span>${proj.type}</span>
          </div>
          <div class="ql-card-title" data-corrupt="${proj.corruptTitle}" data-real="${proj.title}">
            ${proj.corruptTitle}
          </div>
          <div class="ql-locked-badge">[CORRUPTED] ▓▓ LOCKED ▓▓</div>
          <div class="ql-hint">▶ INTERACT TO DECODE</div>
          <div class="ql-desc">
            <div class="ql-desc-text"></div>
            <div class="ql-tags">${proj.tags.map(t => `<span class="ql-tag">${t}</span>`).join('')}</div>
            <div class="ql-reward">⟨ REWARD: ${proj.reward} ⟩</div>
          </div>
        </div>
      `;

      let decoding = false;
      let decoded  = false;

      function decode() {
        if (decoding || decoded) return;
        decoding = true;

        const titleEl = card.querySelector('.ql-card-title');
        const badge   = card.querySelector('.ql-locked-badge');
        const hint    = card.querySelector('.ql-hint');
        const descEl  = card.querySelector('.ql-desc-text');

        // stop glitch animations by marking decoded early for CSS
        card.classList.add('ql-decoded');
        badge.style.display = 'none';
        hint.style.display  = 'none';

        const cancel = scrambleTo(titleEl, proj.title, 900, () => {
          // decode description after title settles
          const cancelDesc = scrambleTo(descEl, proj.description, 700, () => {
            decoded = true;
            decoding = false;
            decodedCount++;
            updateIntegrity();
          });
          cleanups.push(cancelDesc);
        });
        cleanups.push(cancel);
      }

      // hover triggers decode
      const onEnter = () => decode();
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('click', onEnter);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('click', onEnter);
      });

      scroll.appendChild(card);
    });

    // cleanup: cancel all rAF + remove listeners
    return function cleanup() {
      cleanups.forEach(fn => fn());
    };
  },
};
