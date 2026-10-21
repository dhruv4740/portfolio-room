// os/apps/notepad.js — plain large-type notepad. Keys typed on the room keyboard land here.
// A second tab, "Ask about Dhruv", answers questions from his résumé and project text (see docs/ASK.md).
// To restore the old behaviour (terminal as the typing target), set USE_NOTEPAD = false in main.js.
import { mountAsk } from '../shell/ask.js';

export default {
  id: 'notepad',
  title: 'notepad',
  icon: '✎',
  hideIcon: true, // opened by room-keyboard typing, not a desktop icon
  width: 640,
  height: 420,

  mount(body) {
    body.style.cssText = 'position:relative;overflow:hidden;background:#fbfaf6;display:flex;flex-direction:column;';
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:4px;padding:6px 10px 0;border-bottom:1px solid #d8d2c6;flex:none;';
    const pane = document.createElement('div');
    pane.style.cssText = 'flex:1;min-height:0;position:relative;overflow:auto;';
    const ta = document.createElement('textarea');
    ta.setAttribute('aria-label', 'Notepad');
    ta.placeholder = 'type something…';
    ta.spellcheck = false;
    ta.style.cssText = [
      'width:100%', 'height:100%', 'border:0', 'outline:0', 'resize:none', 'box-sizing:border-box',
      'padding:28px 32px', "font:500 30px/1.45 'JetBrains Mono','Courier New',monospace",
      'color:#1c2622', 'background:transparent', 'caret-color:#0f6b52',
    ].join(';');
    const askHost = document.createElement('div');
    askHost.style.cssText = 'padding:20px 24px;';
    let askMounted = false;
    const tabs = {};
    const show = (which) => {
      for (const [k, b] of Object.entries(tabs)) { b.style.borderBottomColor = k === which ? '#0f6b52' : 'transparent'; b.style.color = k === which ? '#1c2622' : '#6b685d'; b.setAttribute('aria-selected', String(k === which)); }
      pane.replaceChildren(which === 'notes' ? ta : askHost);
      if (which === 'ask') {
        if (!askMounted) { mountAsk(askHost); askMounted = true; }
        // Room-keyboard keys go to the first editable in this window: the Ask input, while this tab is open.
        if (document.documentElement.dataset.v3State !== 'room') askHost.querySelector('input')?.focus();
      } else if (document.documentElement.dataset.v3State !== 'room') ta.focus();
    };
    for (const [k, label] of [['notes', 'Notes'], ['ask', 'Ask about Dhruv']]) {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label });
      b.setAttribute('role', 'tab');
      b.style.cssText = 'border:0;border-bottom:2px solid transparent;background:transparent;font:600 13px system-ui,sans-serif;padding:6px 10px;cursor:pointer;';
      b.onclick = () => show(k);
      tabs[k] = b; bar.appendChild(b);
    }
    body.append(bar, pane);
    show('notes');
  },
};
