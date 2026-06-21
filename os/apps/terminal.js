const PROMPT = 'dhruv@os:~$';

const COMMANDS = {
  help(_, lines) {
    lines(
      '  help       — show this list',
      '  ls         — list apps',
      '  about      — who is dhruv',
      '  projects   — recent work',
      '  cosmos     — open cosmos',
      '  whoami     — identity',
      '  contact    — reach out',
      '  clear      — clear screen',
    );
  },
  ls(_, lines) {
    lines('  about  projects  terminal  cosmos');
  },
  about(ctx, lines) {
    lines(
      '  dhruv kothari — developer & designer based in india.',
      '  building interfaces that sit at the edge of code and craft.',
    );
    ctx?.openApp?.('about');
  },
  projects(ctx, lines) {
    lines(
      '  geosvg-maps-demo  reddit-dashboard  dhruvOS  3d-portfolio',
    );
    ctx?.openApp?.('projects');
  },
  cosmos(ctx, lines) {
    ctx?.openApp?.('cosmos');
  },
  whoami(_, lines) {
    lines('  dhruv kothari — developer / designer');
  },
  contact(_, lines) {
    lines(
      '  email   dhruvkothari13062006@gmail.com',
      '  github  github.com/dhruv4740',
    );
  },
  sudo(_, lines) {
    lines('  nice try. root access denied.');
  },
  'rm'(args, lines) {
    if (args.trim() === '-rf /') {
      lines(
        '  initiating full system wipe...',
        '  jk. nice easter egg hunt though.',
      );
    } else {
      lines(`  rm: permission denied`);
    }
  },
  clear: null, // handled specially
};

const CSS = `
  :host { display: block; width: 100%; height: 100%; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .term-root {
    width: 100%; height: 100%;
    background: #050a08;
    color: #5cffd0;
    font-family: 'JetBrains Mono', 'Fira Mono', 'Cascadia Code', monospace;
    font-size: 13px;
    line-height: 1.75;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: inherit;
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
  .term-output::-webkit-scrollbar-thumb { background: rgba(92,255,208,0.25); border-radius: 2px; }
  .line { white-space: pre-wrap; }
  .line.prompt-line { color: #5cffd0; }
  .line.output-line { color: rgba(92,255,208,0.72); }
  .line.err-line { color: rgba(255,79,79,0.85); }
  .term-input-row {
    display: flex;
    align-items: center;
    padding: 6px 16px 12px;
    gap: 8px;
    border-top: 1px solid rgba(92,255,208,0.1);
    flex-shrink: 0;
  }
  .term-prompt-label {
    color: #5cffd0;
    white-space: nowrap;
    user-select: none;
    font-size: 13px;
  }
  .term-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #5cffd0;
    font-family: inherit;
    font-size: 13px;
    caret-color: #5cffd0;
  }
  .term-input::placeholder { color: rgba(92,255,208,0.3); }
  .blink-cursor {
    display: inline-block;
    width: 7px; height: 14px;
    background: #5cffd0;
    vertical-align: text-bottom;
    margin-left: 1px;
    animation: blink 1s step-start infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
`;

export default {
  id: 'terminal',
  title: 'terminal',
  icon: '>_',
  width: 640,
  height: 420,

  mount(body, ctx) {
    /* ── shadow DOM keeps styles scoped ── */
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
    promptLabel.textContent = PROMPT;
    inputRow.appendChild(promptLabel);

    const input = document.createElement('input');
    input.className = 'term-input';
    input.setAttribute('type', 'text');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', 'terminal input');
    inputRow.appendChild(input);

    const cursor = document.createElement('span');
    cursor.className = 'blink-cursor';
    inputRow.appendChild(cursor);

    /* ── history ── */
    const history = [];
    let histIdx = -1;
    let draft = '';

    /* ── helpers ── */
    function addLine(text, cls = 'output-line') {
      const div = document.createElement('div');
      div.className = `line ${cls}`;
      div.textContent = text;
      output.appendChild(div);
    }

    function scrollBottom() {
      output.scrollTop = output.scrollHeight;
    }

    function printLines(...texts) {
      texts.forEach(t => addLine(t));
      scrollBottom();
    }

    function clearOutput() {
      output.innerHTML = '';
    }

    /* ── boot banner ── */
    addLine('dhruvOS terminal v1.0', 'output-line');
    addLine("type 'help' for available commands.", 'output-line');
    addLine('', 'output-line');
    scrollBottom();

    /* ── command runner ── */
    function runCommand(raw) {
      const trimmed = raw.trim();
      const lower = trimmed.toLowerCase();

      /* echo the prompt line */
      addLine(`${PROMPT} ${trimmed}`, 'prompt-line');

      if (!trimmed) {
        scrollBottom();
        return;
      }

      /* push to history (dedupe consecutive) */
      if (history[0] !== trimmed) history.unshift(trimmed);
      if (history.length > 80) history.pop();
      histIdx = -1;
      draft = '';

      /* parse verb + rest */
      const spaceIdx = lower.indexOf(' ');
      const verb = spaceIdx === -1 ? lower : lower.slice(0, spaceIdx);
      const args = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);

      if (lower === 'clear') {
        clearOutput();
        return;
      }

      if (verb in COMMANDS) {
        const fn = COMMANDS[verb];
        if (fn) fn(ctx, printLines, args);
      } else {
        addLine(`  command not found: ${trimmed} (try 'help')`, 'err-line');
        scrollBottom();
      }
    }

    /* ── keyboard ── */
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
        if (histIdx < history.length - 1) {
          histIdx++;
          input.value = history[histIdx];
          // move cursor to end
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx > 0) {
          histIdx--;
          input.value = history[histIdx];
        } else if (histIdx === 0) {
          histIdx = -1;
          input.value = draft;
        }
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        return;
      }
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        clearOutput();
      }
    }

    input.addEventListener('keydown', onKeydown);

    /* ── focus management ── */
    function focusInput() {
      input.focus();
    }

    body.addEventListener('click', focusInput);
    body.addEventListener('focus', focusInput, true);

    /* autofocus on mount */
    requestAnimationFrame(focusInput);

    /* ── cleanup ── */
    return function cleanup() {
      input.removeEventListener('keydown', onKeydown);
      body.removeEventListener('click', focusInput);
      body.removeEventListener('focus', focusInput, true);
    };
  },
};
