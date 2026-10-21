// ask.js — "Ask about Dhruv" chat body, mounted inside the glass sheet (ask-pill.js).
// POSTs to /api/ask (see docs/ASK.md). No keys here: the server holds them.
// mountAsk(el) fills `el` with a thread, suggested chips and an input; returns { input, ask(q) }.
export const PROMPTS = ['Why should we hire Dhruv?', 'Strongest project for backend work?', 'Summarise his experience', 'Compare FocusLock and Blackout'];
const LABEL = { groq: 'Groq', gemini: 'Gemini', openrouter: 'OpenRouter', canned: 'quick FAQ' };
const INK = '#f6f4ee', MUTE = 'rgba(246,244,238,.66)', LINE = 'rgba(255,255,255,.22)';
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
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountAsk(el) {
  el.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = `font:400 15px/1.55 system-ui,-apple-system,sans-serif;color:${INK};display:flex;flex-direction:column;gap:12px;height:100%;min-height:0;`;
  const thread = document.createElement('div');
  thread.setAttribute('aria-live', 'polite');
  thread.style.cssText = 'flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:2px 2px 6px;scrollbar-width:thin;';
  const intro = Object.assign(document.createElement('p'), { textContent: 'Ask anything about his projects, internships, skills or what he is looking for. Answers come from his résumé and case studies.' });
  intro.style.cssText = `margin:0;color:${MUTE};font-size:14px;`;
  thread.appendChild(intro);
  const chips = document.createElement('div'); chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;';
  const input = document.createElement('input');
  Object.assign(input, { type: 'text', maxLength: 300, placeholder: 'Ask about Dhruv…', spellcheck: false });
  input.setAttribute('aria-label', 'Question about Dhruv');
  input.style.cssText = `flex:1;min-width:0;padding:12px 16px;border:1px solid ${LINE};background:rgba(255,255,255,.12);color:${INK};font:inherit;border-radius:99px;outline-offset:2px;`;
  const go = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ask' });
  go.style.cssText = `padding:0 20px;border:0;border-radius:99px;background:rgba(246,244,238,.92);color:#26251f;font:600 14px system-ui,sans-serif;cursor:pointer;min-height:44px;`;
  row.append(input, go);
  for (const p of PROMPTS) {
    const c = Object.assign(document.createElement('button'), { type: 'button', textContent: p });
    c.style.cssText = `padding:7px 13px;border:1px solid ${LINE};border-radius:99px;background:rgba(255,255,255,.08);color:${INK};font:13px system-ui,sans-serif;cursor:pointer;`;
    c.onclick = () => ask(p);
    chips.appendChild(c);
  }
  const ts = document.createElement('div');
  box.append(thread, chips, row, ts); el.appendChild(box);

  let widget = null, busy = false;
  getConfig().then(async (c) => {
    if (!c.turnstileSiteKey) return;
    const t = await loadTurnstile(); if (!t) return;
    widget = t.render(ts, { sitekey: c.turnstileSiteKey, appearance: 'interaction-only', theme: 'dark' });
  });
  const token = async () => {
    if (widget == null) return '';
    for (let i = 0; i < 40; i++) { const v = window.turnstile.getResponse(widget); if (v) return v; await new Promise((r) => setTimeout(r, 200)); }
    return '';
  };
  const bubble = (text, mine) => {
    const b = Object.assign(document.createElement('div'), { textContent: text });
    b.style.cssText = mine
      ? `align-self:flex-end;max-width:88%;padding:9px 14px;border-radius:18px 18px 4px 18px;background:rgba(246,244,238,.92);color:#26251f;`
      : `align-self:flex-start;max-width:96%;padding:10px 14px;border-radius:18px 18px 18px 4px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.14);white-space:pre-wrap;`;
    thread.appendChild(b); thread.scrollTop = thread.scrollHeight; return b;
  };
  // Typewriter: reveals the answer in word-sized steps (~60 words a second), instant under reduced motion.
  const typeInto = (node, text) => new Promise((resolve) => {
    if (reduced()) { node.textContent = text; return resolve(); }
    const parts = text.match(/\S+\s*/g) || [text]; let i = 0, last = 0;
    const step = (t) => {
      if (t - last >= 16) { last = t; node.textContent += parts[i++] || ''; thread.scrollTop = thread.scrollHeight; }
      if (i < parts.length) requestAnimationFrame(step); else resolve();
    };
    node.textContent = ''; requestAnimationFrame(step);
  });

  async function ask(q) {
    q = String(q ?? input.value).trim();
    if (busy || q.length < 3) return;
    busy = true; go.disabled = true; input.value = ''; chips.style.display = 'none';
    bubble(q, true);
    const a = bubble('Thinking…', false); a.style.color = MUTE;
    let meta = '';
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, token: await token() }) });
      const d = await r.json();
      a.style.color = INK;
      if (d.error) a.textContent = d.error;
      else {
        await typeInto(a, d.answer);
        meta = [d.source && `Source: ${d.source}`, `answered by ${LABEL[d.provider] || d.provider}`, d.note].filter(Boolean).join(' · ');
      }
    } catch { a.style.color = INK; a.textContent = 'Could not reach the server. Email dhruvkothari13062006@gmail.com instead.'; }
    if (meta) {
      const m = document.createElement('small');
      m.style.cssText = `color:${MUTE};font-size:12px;display:block;margin-top:6px;`;
      m.textContent = meta; a.appendChild(m);
    }
    thread.scrollTop = thread.scrollHeight;
    if (widget != null) window.turnstile.reset(widget);
    busy = false; go.disabled = false; chips.style.display = 'flex';
  }
  go.onclick = () => ask();
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
  return { input, ask };
}
