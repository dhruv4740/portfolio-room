// ask-pill.js — the always-visible "Ask about Dhruv" pill on every surface (/work, room, scan, deck).
// Click opens a side sheet (wide screens) or a bottom sheet (narrow). Loaded once from src/main.jsx and the /work entry.
import { mountAsk } from './ask.js';

export function mountAskPill() {
  if (document.getElementById('ask-pill-root')) return;
  const root = document.createElement('div');
  root.id = 'ask-pill-root';
  root.innerHTML = `<style>
#ask-pill-root{position:fixed;z-index:2147483000;right:0;bottom:0;font:400 14px/1.4 system-ui,sans-serif}
#ask-pill{position:fixed;right:16px;bottom:16px;display:flex;align-items:center;gap:8px;padding:10px 16px;border:1px solid #4a4842;border-radius:99px;background:#2b2a26;color:#f2efe8;font:600 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.28)}
#ask-pill:hover{background:#38362f}#ask-pill:focus-visible{outline:2px solid #f2efe8;outline-offset:3px}
#ask-pill i{width:7px;height:7px;border-radius:50%;background:#c9c4b6}
html[data-v3-state=room] #ask-pill,html[data-v3-state=seated] #ask-pill{bottom:56px}
#ask-sheet{position:fixed;display:none;flex-direction:column;box-sizing:border-box;padding:14px 16px 16px;background:#f2efe8;color:#1d1c18;border:1px solid #d9d5ca;box-shadow:0 12px 40px rgba(0,0,0,.32)}
#ask-sheet.open{display:flex}
#ask-sheet input:focus-visible,#ask-sheet button:focus-visible{outline:2px solid #2b2a26;outline-offset:2px}
#ask-sheet header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font:600 15px system-ui,sans-serif}
#ask-sheet header button{border:0;background:transparent;color:#6d6a62;font:20px/1 system-ui,sans-serif;cursor:pointer;padding:4px 8px}
#ask-sheet .body{flex:1;min-height:0}
@media (min-width:700px){#ask-sheet{top:16px;right:16px;bottom:16px;width:400px;border-radius:14px}}
@media (max-width:699px){#ask-sheet{left:0;right:0;bottom:0;height:72vh;border-radius:16px 16px 0 0}}
</style>
<button id="ask-pill" type="button" aria-expanded="false" aria-controls="ask-sheet"><i></i>Ask about Dhruv</button>
<section id="ask-sheet" role="dialog" aria-label="Ask about Dhruv"><header><span>Ask about Dhruv</span><button type="button" aria-label="Close">×</button></header><div class="body"></div></section>`;
  document.body.appendChild(root);
  const pill = root.querySelector('#ask-pill'), sheet = root.querySelector('#ask-sheet'), body = sheet.querySelector('.body');
  let input = null;
  const set = (open) => {
    sheet.classList.toggle('open', open); pill.setAttribute('aria-expanded', String(open)); pill.style.display = open ? 'none' : 'flex';
    if (open) { input ||= mountAsk(body); setTimeout(() => input?.focus(), 30); } else pill.focus({ preventScroll: true });
  };
  pill.onclick = () => set(true);
  sheet.querySelector('header button').onclick = () => set(false);
  // Keys typed in the sheet must not reach the room's keyboard, shortcuts or Escape-to-stand-up handlers.
  for (const t of ['keydown', 'keyup', 'keypress']) sheet.addEventListener(t, (e) => { e.stopPropagation(); if (t === 'keydown' && e.key === 'Escape') set(false); });
}
