// ask.js — "Ask about Dhruv" chat body, mounted inside the glass card (ask-pill.js) and dhruvOS's notepad.
// POSTs to /api/ask (see docs/ASK.md). No keys here: the server holds them.
// mountAsk(el) fills `el` with a thread, suggested chips and an input; returns { input, ask(q), reset(), started() }.
// Suggestions rotate through a pool and skip what was already asked.
export const PROMPTS = ['Why should we hire Dhruv?', 'Strongest project for backend work?', 'Summarise his experience', 'Compare FocusLock and Blackout',
  'What did he build at Blink?', 'Has he won any hackathons?', 'What is he looking for next?', 'How was this website built?', 'Which project shows his AI work best?', 'What are his strongest skills?'];
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

const CSS = `.ask-box{font:400 15px/1.55 system-ui,-apple-system,sans-serif;color:${INK};display:flex;flex-direction:column;gap:12px;height:100%;min-height:0}
.ask-thread{position:relative;flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:2px 2px 6px;scrollbar-width:thin;overscroll-behavior:contain}
.ask-intro{margin:0;color:${MUTE};font-size:14px}
.ask-q{align-self:flex-end;max-width:88%;padding:9px 14px;border-radius:18px 18px 4px 18px;background:rgba(246,244,238,.92);color:#26251f}
.ask-a{align-self:flex-start;max-width:96%;padding:10px 14px;border-radius:18px 18px 18px 4px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16)}
.ask-a p{margin:0}.ask-a p+p,.ask-a p+ul,.ask-a ul+p{margin-top:8px}
.ask-a ul{margin:6px 0 0;padding-left:18px}.ask-a li{margin:2px 0}.ask-a strong{font-weight:650}
.ask-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:8px;color:${MUTE};font-size:12px}
.ask-meta a{color:${INK};text-decoration:underline;text-decoration-color:rgba(246,244,238,.4);text-underline-offset:3px}
.ask-meta button{border:0;background:none;color:${INK};font:inherit;text-decoration:underline;text-decoration-color:rgba(246,244,238,.4);text-underline-offset:3px;padding:4px 0;cursor:pointer}
.ask-chips{display:flex;flex-wrap:wrap;gap:8px}
.ask-chips button{padding:7px 13px;border:1px solid ${LINE};border-radius:99px;background:rgba(255,255,255,.08);color:${INK};font:13px system-ui,sans-serif;cursor:pointer}
.ask-row{display:flex;gap:8px}
.ask-row input{flex:1;min-width:0;padding:12px 16px;border:1px solid ${LINE};background:rgba(255,255,255,.12);color:${INK};font:inherit;border-radius:99px;outline-offset:2px}
.ask-row input::placeholder{color:rgba(246,244,238,.55)}
.ask-row button{padding:0 20px;border:0;border-radius:99px;background:rgba(246,244,238,.92);color:#26251f;font:600 14px system-ui,sans-serif;cursor:pointer;min-height:44px}
@media (pointer:coarse){.ask-row input{font-size:16px}}
.ask-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes ask-shim{from{background-position:200% 0}to{background-position:-200% 0}}
.ask-shim{background:linear-gradient(90deg,rgba(246,244,238,.4) 0%,rgba(255,255,255,.95) 20%,rgba(246,244,238,.4) 40%,rgba(246,244,238,.4) 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important;animation:ask-shim 2.2s cubic-bezier(.4,0,.2,1) infinite}
@media (prefers-reduced-motion:reduce){.ask-shim{animation:none}}`;

// Light formatting from model text, built as DOM nodes (never innerHTML): blank-line paragraphs, "- " lists, **bold**.
function inline(parent, text) {
  text.split(/(\*\*[^*\n]+\*\*)/).forEach((part) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) parent.appendChild(document.createElement('strong')).textContent = part.slice(2, -2);
    else if (part) parent.appendChild(document.createTextNode(part));
  });
}
function blocks(text) {
  const out = []; let list = null;
  for (const line of String(text).split('\n')) {
    const t = line.trim();
    if (!t) { list = null; continue; }
    const li = t.match(/^[-*•]\s+(.*)$/);
    if (li) { if (!list) { list = document.createElement('ul'); out.push(list); } inline(list.appendChild(document.createElement('li')), li[1]); continue; }
    list = null; const p = document.createElement('p'); inline(p, t); out.push(p);
  }
  return out;
}

export function mountAsk(el) {
  const doc = el.ownerDocument;
  if (!doc.getElementById('ask-chat-css')) doc.head.appendChild(Object.assign(doc.createElement('style'), { id: 'ask-chat-css', textContent: CSS }));
  el.innerHTML = '';
  const box = Object.assign(document.createElement('div'), { className: 'ask-box' });
  const thread = Object.assign(document.createElement('div'), { className: 'ask-thread' });
  const live = Object.assign(document.createElement('div'), { className: 'ask-sr' });
  live.setAttribute('aria-live', 'polite');
  const chips = Object.assign(document.createElement('div'), { className: 'ask-chips' });
  const row = Object.assign(document.createElement('div'), { className: 'ask-row' });
  const input = Object.assign(document.createElement('input'), { type: 'text', maxLength: 300, placeholder: 'Ask about Dhruv…', spellcheck: false });
  input.setAttribute('aria-label', 'Question about Dhruv');
  const go = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Ask' });
  row.append(input, go);
  const ts = document.createElement('div');
  box.append(thread, chips, row, ts, live); el.appendChild(box);

  const asked = new Set();
  let shown = 0;
  const showChips = (n) => {
    const fresh = PROMPTS.filter((p) => !asked.has(p.toLowerCase()));
    const pool = fresh.length ? fresh : PROMPTS;
    const pick = []; for (let i = 0; i < Math.min(n, pool.length); i++) pick.push(pool[(shown + i) % pool.length]);
    shown += n;
    chips.replaceChildren(...pick.map((p) => { const c = Object.assign(document.createElement('button'), { type: 'button', textContent: p }); c.onclick = () => ask(p); return c; }));
    chips.style.display = 'flex';
  };
  const intro = () => {
    const p = Object.assign(document.createElement('p'), { className: 'ask-intro', textContent: 'Ask anything about his projects, internships, skills or what he is looking for. Answers come from his résumé and case studies.' });
    thread.replaceChildren(p);
  };
  intro(); showChips(4); shown = 0;

  let widget = null, busy = false, seq = 0;
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
  const state = (d) => el.dispatchEvent(new CustomEvent('ask-state', { detail: d, bubbles: true }));
  const appear = (node, delay = 0) => { if (!reduced()) node.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 340, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); };
  const add = (cls) => { const b = Object.assign(document.createElement('div'), { className: cls }); thread.appendChild(b); return b; };

  // The thread follows the conversation only until the reader scrolls it themselves.
  let ours = false, readerMoved = false;
  thread.addEventListener('scroll', () => { if (!ours) readerMoved = true; }, { passive: true });
  const scrollTo = (top) => {
    ours = true; thread.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
    clearTimeout(scrollTo.t); scrollTo.t = setTimeout(() => { ours = false; }, 600);
  };

  // A source on /work scrolls the page there (closing the card); anywhere else it opens /work in a new tab.
  const sourceLink = (label, href) => {
    const a = Object.assign(document.createElement('a'), { textContent: label, href });
    if (location.pathname.startsWith('/work')) {
      a.onclick = (e) => {
        e.preventDefault(); el.dispatchEvent(new CustomEvent('ask-close', { bubbles: true }));
        const id = href.split('#')[1];
        setTimeout(() => { history.replaceState(null, '', '#' + id); document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }, 260);
      };
    } else Object.assign(a, { target: '_blank', rel: 'noopener' });
    return a;
  };
  const metaBtn = (label, fn) => { const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label }); b.onclick = () => fn(b); return b; };

  async function ask(q) {
    q = String(q ?? input.value).trim();
    if (busy || q.length < 3) return;
    busy = true; go.disabled = true; input.value = ''; chips.style.display = 'none'; asked.add(q.toLowerCase());
    const mine = seq;
    if (thread.firstChild?.classList?.contains('ask-intro')) thread.replaceChildren();
    const qb = add('ask-q'); qb.textContent = q; appear(qb);
    const a = add('ask-a'); a.innerHTML = '<span class="ask-shim">Thinking</span>'; appear(a, 60);
    readerMoved = false; scrollTo(qb.offsetTop - 4);
    state('thinking');
    let d;
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, token: await token() }) });
      d = await r.json();
    } catch { d = { failed: true }; }
    if (mine !== seq) return; // the chat was reset while this was in flight
    a.replaceChildren();
    const meta = Object.assign(document.createElement('div'), { className: 'ask-meta' });
    if (d.failed || d.error || typeof d.answer !== 'string') {
      a.appendChild(Object.assign(document.createElement('p'), { textContent: d.error || 'Could not reach the server. Email dhruvkothari13062006@gmail.com instead.' }));
      meta.appendChild(metaBtn('Retry', () => { qb.remove(); a.remove(); busy = false; ask(q); }));
      live.textContent = a.textContent;
    } else {
      state('typing');
      const parts = blocks(d.answer);
      a.append(...parts);
      parts.forEach((n, i) => appear(n, i * 60));
      meta.appendChild(Object.assign(document.createElement('span'), { textContent: d.provider === 'canned' ? 'Saved answer' : 'Live AI answer' }));
      if (d.source) meta.appendChild(d.href ? sourceLink(`Source: ${d.source}`, d.href) : Object.assign(document.createElement('span'), { textContent: `Source: ${d.source}` }));
      if (d.note) meta.appendChild(Object.assign(document.createElement('span'), { textContent: d.note }));
      if (navigator.clipboard) meta.appendChild(metaBtn('Copy', (b) => navigator.clipboard.writeText(d.answer + (d.source ? `\n(Source: ${d.source})` : '')).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); }, () => {})));
      live.textContent = d.answer;
      appear(meta, parts.length * 60);
      setTimeout(() => state('idle'), 300 + parts.length * 60);
    }
    a.appendChild(meta);
    if (!readerMoved) scrollTo(qb.offsetTop - 4);
    if (widget != null) window.turnstile.reset(widget);
    if (d.failed || d.error) state('idle');
    busy = false; go.disabled = false; showChips(3);
  }
  // Back to the empty state; an answer still in flight is dropped when it lands.
  const reset = () => { seq++; busy = false; go.disabled = false; asked.clear(); shown = 0; intro(); showChips(4); shown = 0; input.value = ''; state('idle'); };
  go.onclick = () => ask();
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
  return { input, ask, reset, started: () => !thread.firstChild?.classList?.contains('ask-intro') };
}
