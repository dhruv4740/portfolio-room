// os/apps/decoder.js — scramble-to-reveal bio/portfolio content reader
import content from '../shell/content.js';

const GLYPHS = '!@#$%^&*?/\\|<>[]{}0123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SPEED  = 4; // chars decoded per tick

function rndGlyph() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }

// Build flat content stages from content.js
function buildStages() {
  const topSkills = content.skills.slice(0, 6).map(s => s.label).join(' · ');
  const restSkills = content.skills.slice(6).map(s => s.label).join(' · ');

  return [
    {
      header: 'RECORD_00 — IDENTITY',
      lines: [
        '',
        '  ' + content.identity.name,
        '  ' + content.identity.role,
        '  ' + content.identity.location,
        '',
      ],
    },
    {
      header: 'RECORD_01 — TAGLINE',
      lines: [
        '',
        '  "' + content.identity.tagline + '"',
        '',
      ],
    },
    {
      header: 'RECORD_02 — SKILLS',
      lines: [
        '',
        '  ' + topSkills,
        '  ' + restSkills,
        '',
      ],
    },
    {
      header: 'RECORD_03 — SELECTED WORK',
      lines: [
        '',
        ...content.projects.map(p =>
          `  ▸ ${p.name.padEnd(30, ' ')}[${p.year}]`
        ),
        '',
      ],
    },
    {
      header: 'RECORD_04 — CONTACT',
      lines: [
        '',
        '  ✉  ' + content.contact.email,
        '  ⌥  ' + content.contact.githubLabel,
        '',
        '  [ OPEN CONTACT CARD ]',
      ],
      finale: true,
    },
  ];
}

export default {
  id: 'decoder',
  title: 'decoder',
  icon: '▓',
  width: 620,
  height: 440,

  mount(body, ctx) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden', 'background:#050a08',
      "font-family:'JetBrains Mono','Courier New',monospace",
      'display:flex', 'flex-direction:column',
    ].join(';');

    // Scanline overlay
    const scan = document.createElement('div');
    scan.style.cssText = [
      'position:absolute', 'inset:0', 'pointer-events:none', 'z-index:20',
      "background:repeating-linear-gradient(transparent 0,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px)",
    ].join(';');
    body.appendChild(scan);

    // Header bar
    const headerEl = document.createElement('div');
    headerEl.style.cssText = [
      'padding:10px 16px 8px', 'border-bottom:1px solid rgba(92,255,208,0.12)',
      "font-size:9px", 'letter-spacing:0.22em', 'color:rgba(92,255,208,0.4)',
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'flex-shrink:0',
    ].join(';');
    body.appendChild(headerEl);

    const headerTitle = document.createElement('span');
    const headerStatus = document.createElement('span');
    headerEl.appendChild(headerTitle);
    headerEl.appendChild(headerStatus);

    // Content area
    const content_ = document.createElement('div');
    content_.style.cssText = [
      'flex:1', 'overflow:hidden', 'padding:14px 16px 8px',
      'position:relative',
    ].join(';');
    body.appendChild(content_);

    // Progress bar
    const progressWrap = document.createElement('div');
    progressWrap.style.cssText = [
      'height:2px', 'background:rgba(92,255,208,0.08)',
      'margin:0 16px 10px', 'flex-shrink:0',
    ].join(';');
    const progressBar = document.createElement('div');
    progressBar.style.cssText = 'height:100%;width:0%;background:#5cffd0;transition:width 0.08s;';
    progressWrap.appendChild(progressBar);
    body.appendChild(progressWrap);

    // Footer / action
    const footer = document.createElement('div');
    footer.style.cssText = [
      'padding:8px 16px 14px', 'border-top:1px solid rgba(92,255,208,0.08)',
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'flex-shrink:0',
    ].join(';');
    body.appendChild(footer);

    const footerCount = document.createElement('span');
    footerCount.style.cssText = "font-size:9px;color:rgba(92,255,208,0.3);letter-spacing:0.15em;";
    const footerAction = document.createElement('button');
    footerAction.style.cssText = [
      "font:9px 'JetBrains Mono',monospace", 'letter-spacing:0.18em',
      'padding:5px 14px', 'border:1px solid rgba(92,255,208,0.3)',
      'background:none', 'color:rgba(92,255,208,0.6)', 'cursor:pointer',
      'transition:all 0.15s', 'opacity:0', 'pointer-events:none',
    ].join(';');
    footerAction.addEventListener('mouseover', () => { footerAction.style.borderColor = '#5cffd0'; footerAction.style.color = '#5cffd0'; });
    footerAction.addEventListener('mouseout',  () => { footerAction.style.borderColor = 'rgba(92,255,208,0.3)'; footerAction.style.color = 'rgba(92,255,208,0.6)'; });
    footer.appendChild(footerCount);
    footer.appendChild(footerAction);

    // ── State ──
    const STAGES = buildStages();
    let stageIdx = 0;
    let intervalId = null;
    let spanItems = [];  // { span, real }
    let decodeIdx = 0;
    let scrambleIntervalId = null;
    let done = false;

    function showStage(idx) {
      done = false;
      const stage = STAGES[idx];
      headerTitle.textContent = stage.header;
      headerStatus.textContent = `[${idx + 1}/${STAGES.length}]`;
      footerCount.textContent = `DECODING...`;
      footerAction.style.opacity = '0';
      footerAction.style.pointerEvents = 'none';
      progressBar.style.width = '0%';

      // Build DOM
      content_.innerHTML = '';
      spanItems = [];
      decodeIdx = 0;

      stage.lines.forEach(line => {
        const lineEl = document.createElement('div');
        lineEl.style.cssText = 'line-height:1.85;min-height:1.85em;';

        if (line === '') {
          lineEl.innerHTML = '&nbsp;';
          content_.appendChild(lineEl);
          return;
        }

        for (const ch of line) {
          const span = document.createElement('span');
          if (ch === ' ') {
            span.innerHTML = '&nbsp;';
            span.dataset.real = ' ';
          } else {
            span.textContent = rndGlyph();
            span.dataset.real = ch;
          }
          span.style.cssText = ch === ' '
            ? 'color:inherit;'
            : 'color:rgba(92,255,208,0.25);font-size:12px;';
          lineEl.appendChild(span);
          spanItems.push(span);
        }
        content_.appendChild(lineEl);
      });

      // Decode animation
      clearInterval(intervalId);
      clearInterval(scrambleIntervalId);

      // Scramble undecoded chars
      scrambleIntervalId = setInterval(() => {
        spanItems.slice(decodeIdx).forEach(span => {
          if (span.dataset.real !== ' ') span.textContent = rndGlyph();
        });
      }, 45);

      // Advance decode cursor
      intervalId = setInterval(() => {
        const end = Math.min(decodeIdx + SPEED, spanItems.length);
        for (let i = decodeIdx; i < end; i++) {
          const span = spanItems[i];
          const real = span.dataset.real;
          span.textContent = real === ' ' ? ' ' : real;
          span.style.color = '#5cffd0';
          span.style.fontSize = '12px';
        }
        decodeIdx = end;
        progressBar.style.width = `${(decodeIdx / spanItems.length) * 100}%`;

        if (decodeIdx >= spanItems.length) {
          clearInterval(intervalId);
          clearInterval(scrambleIntervalId);
          onDecoded(stage);
        }
      }, 38);
    }

    function onDecoded(stage) {
      done = true;
      footerCount.textContent = 'DECODED';
      headerStatus.textContent = headerStatus.textContent.replace(']', ' — OK]');

      if (stage.finale) {
        footerAction.textContent = '✉ OPEN CONTACT';
        footerAction.style.borderColor = 'rgba(255,176,0,0.5)';
        footerAction.style.color = '#ffb000';
        footerAction.style.opacity = '1';
        footerAction.style.pointerEvents = 'auto';
        footerAction._action = () => ctx.openContact();
      } else {
        footerAction.textContent = 'NEXT RECORD →';
        footerAction.style.borderColor = 'rgba(92,255,208,0.3)';
        footerAction.style.color = 'rgba(92,255,208,0.6)';
        footerAction.style.opacity = '1';
        footerAction.style.pointerEvents = 'auto';
        footerAction._action = () => nextStage();
      }
    }

    function nextStage() {
      if (stageIdx < STAGES.length - 1) {
        stageIdx++;
        showStage(stageIdx);
      }
    }

    footerAction.addEventListener('click', () => {
      if (footerAction._action) footerAction._action();
    });

    // Click body to fast-decode current stage
    body.addEventListener('click', (e) => {
      if (e.target === footerAction) return;
      if (!done && decodeIdx < spanItems.length) {
        // Complete immediately
        clearInterval(intervalId);
        clearInterval(scrambleIntervalId);
        spanItems.slice(decodeIdx).forEach(span => {
          const real = span.dataset.real;
          span.textContent = real === ' ' ? ' ' : real;
          span.style.color = '#5cffd0';
          span.style.fontSize = '12px';
        });
        decodeIdx = spanItems.length;
        progressBar.style.width = '100%';
        onDecoded(STAGES[stageIdx]);
      }
    });

    showStage(0);

    return function cleanup() {
      clearInterval(intervalId);
      clearInterval(scrambleIntervalId);
    };
  },
};
