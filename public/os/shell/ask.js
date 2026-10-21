// ask.js — "Ask about Dhruv" box shared by the room notepad and /work. POSTs to /api/ask (see docs/ASK.md).
// mountAsk(el, { dark }) fills `el`; returns the input so callers can focus it. No keys here: the server holds them.
const PROMPTS = ['What did he build at Blink?', 'Which project is he proudest of?', 'What are his strongest skills?', 'Is he open to internships?'];
const LABEL = { groq: 'Groq', gemini: 'Gemini', openrouter: 'OpenRouter', canned: 'quick FAQ' };
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

export function mountAsk(el, { dark = false } = {}) {
  const ink = dark ? '#e9e6dc' : '#17160f', mute = dark ? '#9aa39d' : '#6b685d', line = dark ? '#33403a' : '#d8d2c6', bg = dark ? '#161d1a' : '#fbfaf6', accent = dark ? '#7bd3b0' : '#0f6b52';
  el.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = `font:400 14px/1.5 system-ui,sans-serif;color:${ink};display:flex;flex-direction:column;gap:10px;`;
  const title = Object.assign(document.createElement('div'), { textContent: 'Ask about Dhruv' });
  title.style.cssText = `font:600 15px system-ui,sans-serif;`;
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;';
  const input = document.createElement('input');
  Object.assign(input, { type: 'text', maxLength: 300, placeholder: 'Ask about his projects, Blink work, skills…', spellcheck: false });
  input.setAttribute('aria-label', 'Question about Dhruv');
  input.style.cssText = `flex:1;min-width:0;padding:10px 12px;border:1px solid ${line};background:${bg};color:${ink};font:inherit;border-radius:8px;outline-offset:2px;`;
  const go = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ask' });
  go.style.cssText = `padding:0 16px;border:0;border-radius:8px;background:${accent};color:${dark ? '#08110e' : '#fff'};font:600 14px system-ui,sans-serif;cursor:pointer;min-height:40px;`;
  row.append(input, go);
  const chips = document.createElement('div'); chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
  for (const p of PROMPTS) {
    const c = Object.assign(document.createElement('button'), { type: 'button', textContent: p });
    c.style.cssText = `padding:4px 10px;border:1px solid ${line};border-radius:99px;background:transparent;color:${mute};font:12px system-ui,sans-serif;cursor:pointer;`;
    c.onclick = () => { input.value = p; submit(); };
    chips.appendChild(c);
  }
  const out = document.createElement('div'); out.setAttribute('aria-live', 'polite'); out.style.cssText = 'min-height:1.5em;';
  const ts = document.createElement('div');
  box.append(title, row, chips, out, ts); el.appendChild(box);

  let widget = null, busy = false;
  getConfig().then(async (c) => {
    if (!c.turnstileSiteKey) return;
    const t = await loadTurnstile(); if (!t) return;
    widget = t.render(ts, { sitekey: c.turnstileSiteKey, appearance: 'interaction-only', theme: dark ? 'dark' : 'light' });
  });
  const token = async () => {
    if (widget == null) return '';
    for (let i = 0; i < 40; i++) { const v = window.turnstile.getResponse(widget); if (v) return v; await new Promise((r) => setTimeout(r, 200)); }
    return '';
  };

  async function submit() {
    const q = input.value.trim();
    if (busy || q.length < 3) return;
    busy = true; go.disabled = true; out.textContent = 'Thinking…'; out.style.color = mute;
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, token: await token() }) });
      const d = await r.json();
      out.innerHTML = ''; out.style.color = ink;
      if (d.error) { out.textContent = d.error; }
      else {
        const a = document.createElement('p'); a.textContent = d.answer; a.style.cssText = 'margin:0 0 6px;';
        const m = document.createElement('small');
        m.style.cssText = `color:${mute};font-size:12px;display:block;`;
        m.textContent = [d.source && `Source: ${d.source}`, `answered by ${LABEL[d.provider] || d.provider}`, d.note].filter(Boolean).join(' · ');
        out.append(a, m);
      }
    } catch { out.textContent = 'Could not reach the server. Email dhruvkothari13062006@gmail.com instead.'; }
    if (widget != null) window.turnstile.reset(widget);
    busy = false; go.disabled = false;
  }
  go.onclick = submit;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  return input;
}
