import content from '../shell/content.js';

export default {
  id: 'corrupted',
  title: 'Corrupted',
  icon: '▧',
  width: 900,
  height: 640,

  mount(body) {
    let visible = false;
    let rafId = 0;
    let cleanedUp = false;

    // Root container
    const root = document.createElement('div');
    root.className = 'app-corrupted';
    root.tabIndex = 0;
    body.appendChild(root);

    const fontVt323 = new URL('../fonts/vt323-400.woff2', import.meta.url).href;
    const fontPressStart = new URL('../fonts/press-start-2p-400.woff2', import.meta.url).href;

    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'VT323';
        src: url('${fontVt323}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Press Start 2P';
        src: url('${fontPressStart}') format('woff2');
        font-weight: 400;
        font-style: normal;
      }

      .app-corrupted {
        --bg: #0a0008;
        --scanline: rgba(0,255,100,0.03);
        --crt-green: #00ff66;
        --crt-dim: #009944;
        --magenta: #ff00ff;
        --black: #000;
        --red: #ff2200;
        --blue: #0033ff;
        --panel-bg: rgba(0,20,10,0.85);
        --panel-border: #003322;
        --glitch-r: #ff0044;
        --glitch-b: #0044ff;
        --gold: #ffd700;

        position: relative;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        background: var(--bg);
        color: var(--crt-green);
        font-family: 'VT323', monospace;
        font-size: 18px;
        box-sizing: border-box;
        outline: none;
      }

      .app-corrupted *, .app-corrupted *::before, .app-corrupted *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .app-corrupted #noise {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        width: 100%;
        height: 100%;
      }

      .app-corrupted #vignette {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 49;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.85) 100%);
      }

      .app-corrupted #stage {
        max-width: 860px;
        margin: 0 auto;
        padding: 24px 24px 48px;
        position: relative;
        z-index: 10;
      }

      .app-corrupted #integrity-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        color: #226622;
      }
      .app-corrupted #integrity-label { white-space: nowrap; }
      .app-corrupted #integrity-track {
        flex: 1;
        height: 10px;
        background: #0a1a0a;
        border: 1px solid #224422;
        position: relative;
        overflow: hidden;
      }
      .app-corrupted #integrity-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #006622, #00ff66);
        transition: width .6s ease;
        box-shadow: 0 0 8px #00ff66;
      }
      .app-corrupted #integrity-pct { min-width: 38px; text-align: right; }

      .app-corrupted #save-header {
        border: 2px solid var(--panel-border);
        background: var(--panel-bg);
        padding: 18px 22px;
        margin-bottom: 24px;
        position: relative;
        cursor: pointer;
        transition: border-color .4s;
      }
      .app-corrupted #save-header:hover { border-color: #00aa44; }
      .app-corrupted #save-header.repaired { border-color: #00ff66; cursor: default; }

      .app-corrupted .save-tag {
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        color: #224422;
        margin-bottom: 8px;
        letter-spacing: .15em;
      }
      .app-corrupted #save-name {
        font-family: 'VT323', monospace;
        font-size: 44px;
        line-height: 1;
        letter-spacing: .04em;
        color: var(--crt-green);
        text-shadow: 2px 0 var(--glitch-r), -2px 0 var(--glitch-b);
      }
      .app-corrupted #save-status {
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        color: var(--red);
        margin-top: 6px;
      }
      .app-corrupted .panel-hint {
        font-family: monospace;
        font-size: 11px;
        color: #224422;
        margin-top: 10px;
        display: none;
      }
      .app-corrupted .unrep:hover .panel-hint { display: block; }

      .app-corrupted .glitching #save-name { animation: app-glitch-name 0.12s infinite steps(1); }
      @keyframes app-glitch-name {
        0%  { text-shadow: 3px 0 var(--glitch-r), -3px 0 var(--glitch-b); clip-path: inset(0 0 90% 0); }
        10% { text-shadow: -2px 0 var(--glitch-r), 2px 0 var(--glitch-b); clip-path: inset(30% 0 50% 0); }
        20% { text-shadow: 4px 0 var(--glitch-r), -4px 0 var(--glitch-b); clip-path: inset(60% 0 10% 0); }
        30% { text-shadow: -1px 0 var(--glitch-r), 1px 0 var(--glitch-b); clip-path: inset(0 0 0 0); }
        40% { text-shadow: 2px 2px var(--glitch-r), -2px -2px var(--glitch-b); clip-path: inset(80% 0 5% 0); }
        50% { text-shadow: 0 0 var(--glitch-r), 0 0 var(--glitch-b); clip-path: inset(0 0 0 0); }
        60% { text-shadow: -3px 1px var(--glitch-r), 3px -1px var(--glitch-b); clip-path: inset(10% 0 70% 0); }
        70% { text-shadow: 1px 0 var(--glitch-r), -1px 0 var(--glitch-b); clip-path: inset(0 0 0 0); }
        80% { text-shadow: -4px 0 var(--glitch-r), 4px 0 var(--glitch-b); clip-path: inset(40% 0 40% 0); }
        90% { text-shadow: 2px 0 var(--glitch-r), -2px 0 var(--glitch-b); clip-path: inset(0 0 0 0); }
        100% { text-shadow: -2px 0 var(--glitch-r), 2px 0 var(--glitch-b); clip-path: inset(50% 0 30% 0); }
      }

      .app-corrupted #panels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }
      @media (max-width: 600px) {
        .app-corrupted #panels { grid-template-columns: 1fr; }
      }

      .app-corrupted .panel {
        border: 2px solid var(--panel-border);
        background: var(--panel-bg);
        padding: 16px 18px;
        cursor: pointer;
        position: relative;
        transition: border-color .4s;
        min-height: 220px;
      }
      .app-corrupted .panel:hover { border-color: #006633; }
      .app-corrupted .panel.repaired { border-color: #00ff66; cursor: default; }
      .app-corrupted .panel-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        color: #224422;
        letter-spacing: .15em;
        margin-bottom: 14px;
        border-bottom: 1px solid #112211;
        padding-bottom: 6px;
      }
      .app-corrupted .panel.repaired .panel-title { color: #008844; }

      .app-corrupted .panel:not(.repaired)::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: repeating-conic-gradient(var(--magenta) 0% 25%, #000 0% 50%);
        background-size: 14px 14px;
        opacity: 0.07;
        pointer-events: none;
        z-index: 1;
      }
      .app-corrupted .panel-body { position: relative; z-index: 2; }

      .app-corrupted .stat-row {
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        border-bottom: 1px dashed rgba(0,255,102,0.1);
        padding-bottom: 4px;
      }
      .app-corrupted .stat-label {
        font-family: 'VT323', monospace;
        font-size: 20px;
        color: var(--crt-dim);
        letter-spacing: .08em;
        white-space: nowrap;
      }
      .app-corrupted .stat-proof {
        font-family: 'VT323', monospace;
        font-size: 16px;
        color: var(--crt-green);
        text-align: right;
        line-height: 1.2;
      }

      .app-corrupted .quest { margin-bottom: 14px; }
      .app-corrupted .quest-tag {
        font-family: 'Press Start 2P', monospace;
        font-size: 6px;
        color: #004422;
        letter-spacing: .1em;
        margin-bottom: 4px;
      }
      .app-corrupted .quest.main .quest-tag { color: #446600; }
      .app-corrupted .quest-title {
        font-family: 'VT323', monospace;
        font-size: 22px;
        color: var(--crt-green);
        line-height: 1.1;
      }
      .app-corrupted .quest-desc {
        font-family: 'VT323', monospace;
        font-size: 16px;
        color: var(--crt-dim);
        margin-top: 3px;
        line-height: 1.3;
      }

      .app-corrupted .corrupt-text { animation: app-text-flicker .3s steps(1) infinite; }
      @keyframes app-text-flicker {
        0%  { opacity: 1; filter: none; }
        20% { opacity: .4; filter: hue-rotate(180deg); }
        40% { opacity: 1; filter: none; }
        70% { opacity: .7; filter: hue-rotate(90deg) blur(0.5px); }
        100% { opacity: 1; filter: none; }
      }

      .app-corrupted #contact {
        border: 2px solid var(--panel-border);
        background: var(--panel-bg);
        padding: 18px 22px;
        cursor: pointer;
        text-align: center;
        position: relative;
        transition: border-color .4s;
      }
      .app-corrupted #contact:hover { border-color: #006633; }
      .app-corrupted #contact.repaired { border-color: #00ff66; cursor: default; }
      .app-corrupted #contact:not(.repaired)::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: repeating-conic-gradient(var(--magenta) 0% 25%, #000 0% 50%);
        background-size: 14px 14px;
        opacity: 0.06;
        pointer-events: none;
      }
      .app-corrupted #contact-body { position: relative; z-index: 2; }
      .app-corrupted #contact-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        letter-spacing: .2em;
        margin-bottom: 16px;
        color: #004422;
      }
      .app-corrupted #contact.repaired #contact-title { color: var(--gold); }
      .app-corrupted #contact-links {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      .app-corrupted #contact-links a {
        font-family: 'VT323', monospace;
        font-size: 20px;
        color: var(--crt-dim);
        text-decoration: none;
        border: 1px solid #112211;
        padding: 4px 12px;
        transition: all .2s;
      }
      .app-corrupted #contact-links a:hover {
        color: var(--crt-green);
        border-color: #00ff66;
        box-shadow: 0 0 6px #00ff66;
      }

      .app-corrupted #restored {
        display: none;
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.85);
        z-index: 200;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 20px;
      }
      .app-corrupted #restored.show { display: flex; }
      .app-corrupted #restored-text {
        font-family: 'Press Start 2P', monospace;
        font-size: 16px;
        color: var(--gold);
        letter-spacing: .25em;
        animation: app-pulse-gold 1s ease infinite alternate;
      }
      @keyframes app-pulse-gold {
        from { text-shadow: 0 0 8px var(--gold); }
        to { text-shadow: 0 0 28px var(--gold), 0 0 60px #ff8800; }
      }
      .app-corrupted #restored-sub {
        font-family: 'VT323', monospace;
        font-size: 22px;
        color: var(--crt-green);
        letter-spacing: .1em;
      }
      .app-corrupted #restored-close {
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        background: none;
        border: 1px solid var(--gold);
        color: var(--gold);
        padding: 8px 20px;
        cursor: pointer;
        margin-top: 10px;
      }
      .app-corrupted #restored-close:hover { background: rgba(255,215,0,.1); }
    `;
    root.appendChild(style);

    // Markup
    root.insertAdjacentHTML('beforeend', `
      <canvas id="noise"></canvas>
      <div id="vignette"></div>

      <div id="stage">
        <div id="integrity-wrap">
          <div id="integrity-label">SAVE INTEGRITY</div>
          <div id="integrity-track"><div id="integrity-fill"></div></div>
          <div id="integrity-pct">0%</div>
        </div>

        <div id="save-header" class="glitching unrep">
          <div class="save-tag">FILE: SAVE_01 · SLOT A</div>
          <div id="save-name">D⌷RUV K0THΛRI</div>
          <div id="save-status">[CORRUPTED]</div>
          <div class="panel-hint">▶ CLICK TO REPAIR HEADER</div>
        </div>

        <div id="panels">
          <div class="panel unrep" id="panel-stats">
            <div class="panel-title">CHARACTER STATS</div>
            <div class="panel-body" id="stats-body">
              <div class="corrupt-text" id="stats-corrupt">
                ■■▒▒░ STAT DATA MISSING ░▒▒■■<br>
                ░▒■ RE-initialize ■▒░<br>
                ERROR 0x4F: MEMORY FAULT<br>
                ▓▒░▒▓ NULL ▓▒░▒▓
              </div>
            </div>
            <div class="panel-hint">▶ CLICK TO REPAIR STATS</div>
          </div>

          <div class="panel unrep" id="panel-quests">
            <div class="panel-title">QUEST LOG</div>
            <div class="panel-body" id="quests-body">
              <div class="corrupt-text" id="quests-corrupt">
                MJNQ WUEST: ■■■■■■■■■<br>
                ░▒▓ QUEST DATA CORRUPTED ▓▒░<br>
                ░░ side_qst.dat MISSING ░░<br>
                CHECKSUM FAIL — 0xFF
              </div>
            </div>
            <div class="panel-hint">▶ CLICK TO REPAIR LOG</div>
          </div>
        </div>

        <div id="contact" class="unrep">
          <div id="contact-body">
            <div id="contact-title" class="corrupt-text">■■■ GAME ■■■ / ■■■■■■■■</div>
            <div style="font-family:'VT323',monospace;font-size:16px;color:#002211;" id="contact-corrupt">
              PLAYER DATA UNAVAILABLE — CANNOT LOAD SAVE<br>
              press any key to throw controller
            </div>
            <div class="panel-hint" style="display:block;margin-top:8px;">▶ CLICK TO REPAIR CONTACT</div>
          </div>
        </div>
      </div>

      <div id="restored">
        <div id="restored-text">✦ SAVE RESTORED ✦</div>
        <div id="restored-sub">INTEGRITY 100% — ALL DATA RECOVERED</div>
        <button id="restored-close">[ CONTINUE ]</button>
      </div>
    `);

    // Elements
    const cv = root.querySelector('#noise');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, frame = 0, integrity = 0;

    function resize() {
      W = cv.width = root.clientWidth || 900;
      H = cv.height = root.clientHeight || 640;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();

    // Text Scrambler subsystem (stepped in main rAF loop)
    const GLYPHS = '░▒▓■▪□▫◆◇●○▲△▼▽⌷⌸⌹⌺⌻⌼⌽⌾⌿⍀⍁⌦⌧';
    const activeScramblers = [];

    function scrambleTo(el, target, duration, onDone) {
      const chars = target.split('');
      const total = chars.length;
      const resolved = new Array(total).fill(false);
      activeScramblers.push({
        el,
        target,
        chars,
        total,
        resolved,
        start: performance.now(),
        duration,
        onDone,
      });
    }

    // Single rAF loop
    function loop(now) {
      if (!visible || cleanedUp) {
        rafId = 0;
        return;
      }
      frame++;

      // Step scramblers
      for (let i = activeScramblers.length - 1; i >= 0; i--) {
        const sc = activeScramblers[i];
        const t = Math.min(1, (now - sc.start) / sc.duration);
        const solveCount = Math.floor(t * sc.total);
        let out = '';
        for (let j = 0; j < sc.total; j++) {
          if (sc.resolved[j]) {
            out += sc.chars[j];
          } else if (j < solveCount && !sc.resolved[j]) {
            sc.resolved[j] = true;
            out += sc.chars[j];
          } else {
            out += sc.chars[j] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0];
          }
        }
        sc.el.textContent = out;
        if (t >= 1) {
          sc.el.textContent = sc.target;
          activeScramblers.splice(i, 1);
          if (sc.onDone) sc.onDone();
        }
      }

      // Draw noise
      if (W && H) {
        ctx.clearRect(0, 0, W, H);
        const lineH = 3;
        const scanAlpha = 0.04 - (integrity * 0.00025);
        ctx.fillStyle = `rgba(0,0,0,${Math.max(0.01, scanAlpha)})`;
        for (let y = 0; y < H; y += lineH * 2) {
          ctx.fillRect(0, y, W, lineH);
        }

        const noiseAmt = Math.max(0, 1 - (integrity / 100));
        if (noiseAmt > 0 && frame % 2 === 0) {
          try {
            const id = ctx.getImageData(0, 0, W, H);
            const d = id.data;
            const dots = Math.floor(W * H * 0.0012 * noiseAmt);
            for (let i = 0; i < dots; i++) {
              const px = (Math.random() * W * H | 0) * 4;
              const v = Math.random() * 255 | 0;
              d[px] = v;
              d[px + 1] = v * 0.8 | 0;
              d[px + 2] = v * 0.4 | 0;
              d[px + 3] = 180;
            }
            ctx.putImageData(id, 0, 0);
          } catch (_) {}
        }

        if (integrity < 80 && Math.random() < 0.04) {
          const y = Math.random() * H | 0;
          const h = Math.random() * 4 + 1 | 0;
          const shift = (Math.random() - 0.5) * 30;
          ctx.drawImage(cv, 0, y, W, h, shift, y, W, h);
        }
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

    // Stats HTML builder with real content skills
    function buildStatsHTML() {
      return content.skills.map((s) => {
        const proofProjects = (s.projects || []).map((pid) => {
          const p = content.projects.find((proj) => proj.id === pid);
          return p ? p.name : pid;
        }).join(', ');
        return `
          <div class="stat-row">
            <span class="stat-label">${s.label.toUpperCase()}</span>
            <span class="stat-proof">${proofProjects || (s.note ? s.note.toUpperCase() : 'VERIFIED')}</span>
          </div>
        `;
      }).join('');
    }

    // Quest log HTML builder with real content projects
    function buildQuestsHTML() {
      return content.projects.map((p, idx) => `
        <div class="quest ${p.type === 'MAIN QUEST' ? 'main' : ''}" style="${idx > 0 ? 'margin-top:12px;border-top:1px solid #112211;padding-top:8px;' : ''}">
          <div class="quest-tag">${p.type === 'MAIN QUEST' ? '◆ MAIN QUEST' : '◇ SIDE QUEST'}</div>
          <div class="quest-title" id="q-${p.id}-title">${p.name}</div>
          <div class="quest-desc" id="q-${p.id}-desc">${p.tagline}</div>
        </div>
      `).join('');
    }

    // Integrity & repair logic
    const PANELS = ['header', 'stats', 'quests', 'contact'];
    const repairedSet = new Set();

    function updateIntegrity() {
      const pct = Math.round((repairedSet.size / PANELS.length) * 100);
      integrity = pct;
      root.querySelector('#integrity-fill').style.width = pct + '%';
      root.querySelector('#integrity-pct').textContent = pct + '%';
      if (pct === 100) {
        setTimeout(() => {
          if (!cleanedUp) root.querySelector('#restored').classList.add('show');
        }, 600);
      }
    }

    function repairPanel(id) {
      if (repairedSet.has(id)) return;
      repairedSet.add(id);

      if (id === 'header') {
        const el = root.querySelector('#save-header');
        el.classList.remove('glitching', 'unrep');
        el.classList.add('repaired');
        const nameEl = root.querySelector('#save-name');
        scrambleTo(nameEl, content.identity.name.toUpperCase(), 1200, () => {
          const statusEl = root.querySelector('#save-status');
          scrambleTo(statusEl, `[LOADED — LV.21 ${content.identity.role.toUpperCase()}]`, 800);
        });
      }

      if (id === 'stats') {
        const panel = root.querySelector('#panel-stats');
        panel.classList.remove('unrep');
        panel.classList.add('repaired');
        const sBody = root.querySelector('#stats-body');
        sBody.innerHTML = buildStatsHTML();
      }

      if (id === 'quests') {
        const panel = root.querySelector('#panel-quests');
        panel.classList.remove('unrep');
        panel.classList.add('repaired');
        const qBody = root.querySelector('#quests-body');
        qBody.innerHTML = buildQuestsHTML();

        // Scramble first few project titles
        content.projects.slice(0, 3).forEach((p, idx) => {
          const titleEl = root.querySelector(`#q-${p.id}-title`);
          if (titleEl) {
            setTimeout(() => {
              scrambleTo(titleEl, p.name, 700);
            }, idx * 250);
          }
        });
      }

      if (id === 'contact') {
        const el = root.querySelector('#contact');
        el.classList.remove('unrep');
        el.classList.add('repaired');
        const cBody = root.querySelector('#contact-body');
        cBody.innerHTML = `
          <div id="contact-title" style="font-family:'Press Start 2P',monospace;font-size:10px;letter-spacing:.2em;color:var(--gold);margin-bottom:16px;">NEW GAME / CONTINUE</div>
          <div id="ct" style="font-family:'VT323',monospace;font-size:20px;color:var(--crt-dim);"></div>
          <div id="contact-links">
            <a href="mailto:${content.contact.email}">[ EMAIL ]</a>
            <a href="${content.contact.github}" target="_blank" rel="noopener">[ GITHUB ]</a>
            <a href="${content.contact.linkedin}" target="_blank" rel="noopener">[ LINKEDIN ]</a>
          </div>
        `;
        const ct = root.querySelector('#ct');
        scrambleTo(ct, `LOAD PLAYER: ${content.identity.name} — ready to connect`, 900);
      }

      updateIntegrity();
    }

    // Click handlers
    const saveHeader = root.querySelector('#save-header');
    const panelStats = root.querySelector('#panel-stats');
    const panelQuests = root.querySelector('#panel-quests');
    const contactEl = root.querySelector('#contact');
    const restoredClose = root.querySelector('#restored-close');

    const onHeaderClick = () => repairPanel('header');
    const onStatsClick = () => repairPanel('stats');
    const onQuestsClick = () => repairPanel('quests');
    const onContactClick = () => repairPanel('contact');
    const onRestoredClose = () => root.querySelector('#restored').classList.remove('show');

    saveHeader.addEventListener('click', onHeaderClick);
    panelStats.addEventListener('click', onStatsClick);
    panelQuests.addEventListener('click', onQuestsClick);
    contactEl.addEventListener('click', onContactClick);
    restoredClose.addEventListener('click', onRestoredClose);

    // Keyboard listener on root: press 'R' to repair all
    const onKeyDown = (e) => {
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        PANELS.forEach((id) => {
          if (!repairedSet.has(id)) repairPanel(id);
        });
      }
    };
    root.addEventListener('keydown', onKeyDown);

    // Initial rAF loop trigger if mounted visible
    setVisible(true);

    return {
      setVisible,
      cleanup() {
        cleanedUp = true;
        setVisible(false);
        ro.disconnect();

        saveHeader.removeEventListener('click', onHeaderClick);
        panelStats.removeEventListener('click', onStatsClick);
        panelQuests.removeEventListener('click', onQuestsClick);
        contactEl.removeEventListener('click', onContactClick);
        restoredClose.removeEventListener('click', onRestoredClose);
        root.removeEventListener('keydown', onKeyDown);

        root.remove();
      },
    };
  },
};
