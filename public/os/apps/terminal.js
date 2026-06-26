// os/apps/terminal.js — working shell with content.js, colorized output, ASCII contact card
import content from '../shell/content.js';

const { identity, contact, projects, skills } = content;

// ASCII contact card
function contactCard() {
  const email = contact.email;
  const gh    = contact.githubLabel;
  const w = Math.max(email.length, gh.length) + 4;
  const bar = '─'.repeat(w);
  const pad = (s) => s + ' '.repeat(w - s.length);
  return [
    `┌${bar}┐`,
    `│  ${pad(identity.name)}│`,
    `│  ${pad(identity.role + ' · ' + identity.location)}│`,
    `│  ${pad('')}│`,
    `│  ${pad('✉  ' + email)}│`,
    `│  ${pad('⌥  ' + gh)}│`,
    `└${bar}┘`,
  ];
}

const CSS = `
  :host { display: block; width: 100%; height: 100%; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .term-root {
    width: 100%; height: 100%;
    background: #050a08;
    font-family: 'JetBrains Mono', 'Fira Mono', monospace;
    font-size: 13px;
    line-height: 1.75;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .term-output {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px 6px;
    scroll-behavior: smooth;
    word-break: break-word;
  }
  .term-output::-webkit-scrollbar { width: 4px; }
  .term-output::-webkit-scrollbar-track { background: transparent; }
  .term-output::-webkit-scrollbar-thumb { background: rgba(92,255,208,0.2); border-radius: 2px; }
  .line { white-space: pre-wrap; }
  .line.prompt-echo .prompt-user { color: #ffb000; }
  .line.prompt-echo .prompt-sep  { color: rgba(92,255,208,0.35); }
  .line.output-line { color: rgba(92,255,208,0.72); }
  .line.info-line   { color: rgba(92,255,208,0.55); }
  .line.err-line    { color: rgba(255,79,79,0.85); }
  .line.card-line   { color: rgba(92,255,208,0.65); }
  .line.blank-line  { color: transparent; user-select: none; }
  .term-input-row {
    display: flex;
    align-items: center;
    padding: 6px 16px 12px;
    gap: 8px;
    border-top: 1px solid rgba(92,255,208,0.08);
    flex-shrink: 0;
  }
  .term-prompt-label { white-space: nowrap; user-select: none; font-size: 13px; }
  .term-prompt-label .p-user { color: #ffb000; }
  .term-prompt-label .p-sep  { color: rgba(92,255,208,0.35); }
  .term-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #5cffd0; font-family: inherit; font-size: 13px; caret-color: #5cffd0;
  }
  .term-input::placeholder { color: rgba(92,255,208,0.25); }
  .blink-cursor {
    display: inline-block; width: 7px; height: 14px;
    background: #5cffd0; vertical-align: text-bottom; margin-left: 1px;
    animation: blink 1s step-start infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
`;

export default {
  id: 'terminal',
  title: 'terminal',
  icon: '>_',
  width: 660,
  height: 440,

  mount(body, ctx) {
    const host = document.createElement('div');
    host.style.cssText = 'width:100%;height:100%;';
    body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'term-root';
    shadow.appendChild(root);

    const output = document.createElement('div');
    output.className = 'term-output';
    output.setAttribute('aria-live', 'polite');
    root.appendChild(output);

    const inputRow = document.createElement('div');
    inputRow.className = 'term-input-row';
    root.appendChild(inputRow);

    const promptLabel = document.createElement('span');
    promptLabel.className = 'term-prompt-label';
    promptLabel.innerHTML = '<span class="p-user">dhruv@dhruvOS</span><span class="p-sep"> ─ $ </span>';
    inputRow.appendChild(promptLabel);

    const input = document.createElement('input');
    input.className = 'term-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    inputRow.appendChild(input);

    const cursor = document.createElement('span');
    cursor.className = 'blink-cursor';
    inputRow.appendChild(cursor);

    // ── history ──
    const history = [];
    let histIdx = -1, draft = '';

    // ── helpers ──
    function addLine(text, cls = 'output-line') {
      const div = document.createElement('div');
      div.className = 'line ' + cls;
      div.textContent = text || ' ';
      if (!text) div.classList.add('blank-line');
      output.appendChild(div);
    }

    function addPromptEcho(cmd) {
      const div = document.createElement('div');
      div.className = 'line prompt-echo';
      div.innerHTML = '<span class="prompt-user">dhruv@dhruvOS</span><span class="prompt-sep"> ─ $ </span>' + escHTML(cmd);
      output.appendChild(div);
    }

    function escHTML(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function scrollBottom() { output.scrollTop = output.scrollHeight; }
    function print(...lines) { lines.forEach(t => addLine(t)); scrollBottom(); }
    function clearOutput()   { output.innerHTML = ''; }

    // ── boot banner ──
    addLine(`dhruvOS terminal v2.0 — type 'help' for commands`, 'info-line');
    addLine('', '');
    scrollBottom();

    // ── command handlers ──
    const COMMANDS = {
      help(_, print) {
        print(
          '  help          show this list',
          '  ls            list all apps',
          '  about         open about app',
          '  projects      open projects',
          '  gallery       open gallery',
          '  wormhole      open wormhole',
          '  wallpaper     open wallpaper',
          '  cosmos        open cosmos',
          '  contact       show contact info',
          '  gravity       open gravity (physics)',
          '  decoder       open decoder (bio reveal)',
          '  resonance     open resonance (audio viz)',
          '  whoami        identity',
          '  open <app>    open any app by name',
          '  clear         clear screen',
        );
      },
      ls(_, print) {
        const appList = ['about', 'terminal', 'projects', 'cosmos', 'wormhole', 'gallery', 'wallpaper', 'contact', 'gravity', 'decoder', 'resonance'];
        print('  ' + appList.join('  '));
      },
      about(ctx, print) {
        print(
          '  ' + identity.name,
          '  ' + identity.role + ' · ' + identity.location,
          '  ' + identity.tagline,
        );
        ctx?.openApp?.('about');
      },
      projects(ctx, print) {
        print('  Projects:');
        projects.forEach(p => print(`  ${p.year}  ${p.name}  — ${p.tagline}`));
        ctx?.openApp?.('projects');
      },
      gallery(ctx) { ctx?.openApp?.('gallery'); },
      wormhole(ctx) { ctx?.openApp?.('wormhole'); },
      wallpaper(ctx) { ctx?.openApp?.('wallpaper'); },
      cosmos(ctx) { ctx?.openApp?.('cosmos'); },
      contact(_, print) {
        contactCard().forEach(l => addLine(l, 'card-line'));
        scrollBottom();
        navigator.clipboard.writeText(contact.email).catch(() => {});
        addLine('  ↑ email copied to clipboard', 'info-line');
        scrollBottom();
      },
      whoami(_, print) {
        print(
          '  ' + identity.name,
          '  ' + identity.role,
          '  ' + identity.location,
          '',
          '  skills: ' + skills.map(s => s.label).join(', '),
        );
      },
      open(ctx, print, args) {
        const id = args.trim().toLowerCase();
        if (!id) { print('  usage: open <app-id>', 'err-line'); return; }
        ctx?.openApp?.(id);
        addLine(`  → opening ${id}`, 'info-line');
        scrollBottom();
      },
      sudo(_, print) { print('  nice try. root access denied.'); },
      rm(_, print, args) {
        if (args.trim() === '-rf /') {
          print('  initiating full system wipe...', '  jk. nice easter egg hunt though.');
        } else {
          addLine('  rm: permission denied', 'err-line'); scrollBottom();
        }
      },
      clear: null,
    };

    // ── runner ──
    function runCommand(raw) {
      const trimmed = raw.trim();
      const lower   = trimmed.toLowerCase();

      addPromptEcho(trimmed);

      if (!trimmed) { scrollBottom(); return; }
      if (history[0] !== trimmed) history.unshift(trimmed);
      if (history.length > 80) history.pop();
      histIdx = -1; draft = '';

      const spaceIdx = lower.indexOf(' ');
      const verb = spaceIdx === -1 ? lower : lower.slice(0, spaceIdx);
      const args = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);

      if (lower === 'clear') { clearOutput(); return; }

      if (verb in COMMANDS) {
        const fn = COMMANDS[verb];
        if (fn) fn(ctx, print, args);
      } else {
        addLine(`  command not found: ${trimmed}  (try 'help')`, 'err-line');
        scrollBottom();
      }
    }

    // ── keyboard ──
    function onKeydown(e) {
      if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        runCommand(val);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx === -1) draft = input.value;
        if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
        else if (histIdx === 0) { histIdx = -1; input.value = draft; }
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        return;
      }
      if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); clearOutput(); }
    }

    input.addEventListener('keydown', onKeydown);

    function focusInput() { input.focus(); }
    body.addEventListener('click', focusInput);
    body.addEventListener('focus', focusInput, true);
    requestAnimationFrame(focusInput);

    return function cleanup() {
      input.removeEventListener('keydown', onKeydown);
      body.removeEventListener('click', focusInput);
      body.removeEventListener('focus', focusInput, true);
    };
  },
};
