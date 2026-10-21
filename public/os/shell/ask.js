// ask.js — "Ask about Dhruv" chat body, mounted inside the always-visible pill's sheet (ask-pill.js).
// POSTs to /api/ask (see docs/ASK.md). No keys here: the server holds them.
// mountAsk(el) fills `el` with a thread, input and suggested chips; returns the input so callers can focus it.
export const PROMPTS = ['Why should we hire Dhruv?', 'Strongest project for backend work?', 'Summarise his experience', 'Compare FocusLock and Blackout'];
const LABEL = { groq: 'Groq', gemini: 'Gemini', openrouter: 'OpenRouter', canned: 'quick FAQ' };
const INK = '#1d1c18', MUTE = '#6d6a62', LINE = '#d9d5ca', BG = '#faf8f3', BUBBLE = '#ebe8df', BTN = '#2b2a26';
let config = null, tsLoad = null;

function getConfig() {
  return (config ||= fetch('/api/ask').then((r) => r.json()).catch(() => ({ llm: false, turnstileSiteKey: null })));
}
function loadTurnstile() {
  return (tsLoad ||= new Promise((resolve) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = () => resolve(window.turnstile); s.onerror = () => resolve(null);
    document.head.appendChild(s);
  }));
}

export function mountAsk(el) {
  el.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = `font:400 14px/1.5 system-ui,sans-serif;color:${INK};display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;`;
  const thread = document.createElement('div');
  thread.setAttribute('aria-live', 'polite');
  thread.style.cssText = 'flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px;';
  const intro = Object.assign(document.createElement('p'), { textContent: 'Ask anything about his projects, internships, skills or what he is looking for. Answers come from his résumé and case studies.' });
  intro.style.cssText = `margin:0;color:${MUTE};font-size:13px;`;
  thread.appendChild(intro);
  const chips = document.createElement('div'); chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;';
  const input = document.createElement('input');
  Object.assign(input, { type: 'text', maxLength: 300, placeholder: 'Ask about Dhruv…', spellcheck: false });
  input.setAttribute('aria-label', 'Question about Dhruv');
  input.style.cssText = `flex:1;min-width:0;padding:10px 12px;border:1px solid ${LINE};background:${BG};color:${INK};font:inherit;border-radius:10px;outline-offset:2px;`;
  const go = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ask' });
  go.style.cssText = `padding:0 16px;border:0;border-radius:10px;background:${BTN};color:#f2efe8;font:600 14px system-ui,sans-serif;cursor:pointer;min-height:40px;`;
  row.append(input, go);
  for (const p of PROMPTS) {
    const c = Object.assign(document.createElement('button'), { type: 'button', textContent: p });
    c.style.cssText = `padding:5px 11px;border:1px solid ${LINE};border-radius:99px;background:transparent;color:${MUTE};font:12px system-ui,sans-serif;cursor:pointer;`;
    c.onclick = () => { input.value = p; submit(); };
    chips.appendChild(c);
  }
  const ts = document.createElement('div');
  box.append(thread, chips, row, ts); el.appendChild(box);

  let widget = null, busy = false;
  getConfig().then(async (c) => {
    if (!c.turnstileSiteKey) return;
    const t = await loadTurnstile(); if (!t) return;
    widget = t.render(ts, { sitekey: c.turnstileSiteKey, appearance: 'interaction-only', theme: 'light' });
  });
  const token = async () => {
    if (widget == null) return '';
    for (let i = 0; i < 40; i++) { const v = window.turnstile.getResponse(widget); if (v) return v; await new Promise((r) => setTimeout(r, 200)); }
    return '';
  };
  const bubble = (text, mine) => {
    const b = Object.assign(document.createElement('div'), { textContent: text });
    b.style.cssText = mine
      ? `align-self:flex-end;max-width:88%;padding:8px 12px;border-radius:12px 12px 2px 12px;background:${BTN};color:#f2efe8;`
      : `align-self:flex-start;max-width:94%;padding:8px 12px;border-radius:12px 12px 12px 2px;background:${BUBBLE};white-space:pre-wrap;`;
    thread.appendChild(b); thread.scrollTop = thread.scrollHeight; return b;
  };

  async function submit() {
    const q = input.value.trim();
    if (busy || q.length < 3) return;
    busy = true; go.disabled = true; input.value = ''; chips.style.display = 'none';
    bubble(q, true);
    const a = bubble('Thinking…', false); a.style.color = MUTE;
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, token: await token() }) });
      const d = await r.json();
      a.style.color = INK;
      if (d.error) a.textContent = d.error;
      else {
        a.textContent = d.answer;
        const m = document.createElement('small');
        m.style.cssText = `color:${MUTE};font-size:11.5px;display:block;margin-top:6px;`;
        m.textContent = [d.source && `Source: ${d.source}`, `answered by ${LABEL[d.provider] || d.provider}`, d.note].filter(Boolean).join(' · ');
        a.appendChild(m);
      }
    } catch { a.style.color = INK; a.textContent = 'Could not reach the server. Email dhruvkothari13062006@gmail.com instead.'; }
    thread.scrollTop = thread.scrollHeight;
    if (widget != null) window.turnstile.reset(widget);
    busy = false; go.disabled = false; chips.style.display = 'flex';
  }
  go.onclick = submit;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  return input;
}
