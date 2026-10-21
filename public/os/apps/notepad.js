// os/apps/notepad.js — plain large-type notepad. Keys typed on the room keyboard land here.
// (Ask about Dhruv now lives in the always-visible pill, shell/ask-pill.js.)
// To restore the old behaviour (terminal as the typing target), set USE_NOTEPAD = false in main.js.

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
    body.append(pane);
    pane.replaceChildren(ta);
    if (document.documentElement.dataset.v3State !== 'room') ta.focus();
  },
};
