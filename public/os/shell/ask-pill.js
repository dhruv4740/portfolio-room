// ask-pill.js — the always-visible "Ask about Dhruv" pill on every surface (/work, room, scan, deck).
// A small field floats bottom-centre (bottom-right in the room, clear of the HUD). Submitting morphs it into a
// full-page grey glass sheet (clip-path from the pill's rect, spring easing); Esc or a tap outside morphs it back.
// The blur exists only while the sheet is open, so the room's frame rate is untouched the rest of the time.
import { mountAsk } from './ask.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Damped spring sampled into a CSS linear() easing (iOS-like: fast start, one soft overshoot). Falls back to a bezier.
function spring(zeta = 0.78, w = 13, n = 40) {
  const wd = w * Math.sqrt(1 - zeta * zeta), pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push((1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t))).toFixed(4)); }
  pts[n] = '1';
  const e = `linear(${pts.join(',')})`;
  return window.CSS?.supports?.('animation-timing-function', e) ? e : 'cubic-bezier(.2,.9,.25,1.04)';
}

export function mountAskPill() {
  if (document.getElementById('ask-pill-root')) return;
  const root = document.createElement('div');
  root.id = 'ask-pill-root';
  root.innerHTML = `<style>
#ask-pill-root{position:fixed;z-index:2147483000;left:0;top:0;width:0;height:0;font:400 14px/1.4 system-ui,-apple-system,sans-serif}
#ask-wrap{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;width:min(280px,calc(100vw - 32px));height:46px}
#ask-wrap.hide{visibility:hidden}
#ask-pill{position:relative;width:100%;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:4px 4px 4px 16px;border:1px solid rgba(255,255,255,.2);border-radius:99px;background:rgba(30,30,34,.72);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);box-shadow:0 10px 30px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(255,255,255,.05);margin:0;transition:transform .35s cubic-bezier(.2,.9,.25,1.2),box-shadow .35s}
#ask-pill:hover,#ask-pill:focus-within{box-shadow:0 14px 38px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.3)}
#ask-pill input{flex:1;min-width:0;border:0;background:transparent;color:#f6f4ee;font:15px system-ui,-apple-system,sans-serif;outline:none;padding:0}
#ask-pill input::placeholder{color:rgba(246,244,238,.62)}
#ask-pill button{flex:none;width:38px;height:38px;border:0;border-radius:50%;background:rgba(246,244,238,.92);color:#26251f;cursor:pointer;font:600 17px/1 system-ui,sans-serif;padding:0}
#ask-pill:focus-within{border-color:rgba(255,255,255,.5)}
#ask-pill button:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
#ask-pill-root[data-ctx=room] #ask-wrap{left:auto;right:16px;bottom:68px;transform:none;width:min(250px,calc(100vw - 32px))}
@media (max-width:699px){#ask-pill-root[data-ctx=work] #ask-wrap{bottom:calc(84px + env(safe-area-inset-bottom))}}
#ask-sheet{position:fixed;inset:0;display:none;color:#f6f4ee;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,0) 28%),rgba(24,24,28,.68);-webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%);box-shadow:inset 0 1px 0 rgba(255,255,255,.22)}
@media (prefers-reduced-transparency:reduce){#ask-pill,#ask-sheet{-webkit-backdrop-filter:none;backdrop-filter:none;background:#26262a}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){#ask-pill,#ask-sheet{background:#26262a}}
#ask-sheet.open{display:block}
#ask-sheet .col{box-sizing:border-box;max-width:720px;height:calc(100% - 40px);margin:40px auto 0;padding:18px 20px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column}
#ask-sheet header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font:600 17px system-ui,-apple-system,sans-serif}
#ask-sheet header button{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#f6f4ee;font:20px/1 system-ui,sans-serif;cursor:pointer}
#ask-sheet .body{flex:1;min-height:0}
#ask-sheet input::placeholder{color:rgba(246,244,238,.55)}
#ask-sheet input:focus-visible,#ask-sheet button:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
@property --ask-a{syntax:'<angle>';initial-value:0deg;inherits:true}
@keyframes ask-spin{to{--ask-a:360deg}}
@keyframes ask-shim{from{background-position:200% 0}to{background-position:-200% 0}}
#ask-pill-root{--ask-g:conic-gradient(from var(--ask-a),#ff6ad5,#a77bff,#5b8cff,#3fd6c4,#ffc46b,#ff7a8a,#ff6ad5);animation:ask-spin 7s linear infinite}
#ask-wrap .halo{position:absolute;inset:-3px;border-radius:99px;background:var(--ask-g);filter:blur(12px);opacity:.38;transition:opacity .4s,filter .4s;pointer-events:none}
#ask-wrap:hover .halo,#ask-wrap:focus-within .halo{opacity:.7;filter:blur(16px)}
#ask-pill::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:var(--ask-g);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);opacity:.85;pointer-events:none}
#ask-edge{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .7s cubic-bezier(.2,.8,.2,1)}
#ask-edge.on{opacity:1}#ask-edge.calm{opacity:.28}
#ask-edge i{position:absolute;inset:0;background:var(--ask-g);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
#ask-edge .ring{padding:2px;filter:saturate(1.3) brightness(1.15)}
#ask-edge .bloom{padding:0;--f:linear-gradient(90deg,#000,transparent 70px,transparent calc(100% - 70px),#000),linear-gradient(180deg,#000,transparent 70px,transparent calc(100% - 70px),#000);-webkit-mask:var(--f);-webkit-mask-composite:source-over;mask:var(--f);mask-composite:add;opacity:.75;filter:saturate(1.3)}
.ask-shim{background:linear-gradient(90deg,rgba(246,244,238,.45) 0%,#fff 25%,rgba(246,244,238,.45) 50%,rgba(246,244,238,.45) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important;animation:ask-shim 1.6s linear infinite}
@media (prefers-reduced-motion:reduce){#ask-pill-root,.ask-shim{animation:none}#ask-edge{transition:none}}
</style>
<div id="ask-wrap"><span class="halo"></span><form id="ask-pill" role="search" autocomplete="off"><input type="text" maxlength="300" placeholder="Ask about Dhruv" aria-label="Ask about Dhruv" spellcheck="false"><button type="submit" aria-label="Ask">↑</button></form></div>
<section id="ask-sheet" role="dialog" aria-modal="true" aria-label="Ask about Dhruv"><div class="col"><header><span>Ask about Dhruv</span><button type="button" aria-label="Close">×</button></header><div class="body"></div></div></section><div id="ask-edge" aria-hidden="true"><i class="bloom"></i><i class="ring"></i></div>`;
  document.body.appendChild(root);
  const wrap = root.querySelector('#ask-wrap'), edge = root.querySelector('#ask-edge'), pill = root.querySelector('#ask-pill'), pillInput = pill.querySelector('input'), sheet = root.querySelector('#ask-sheet'), body = sheet.querySelector('.body'), col = sheet.querySelector('.col');
  let chat = null, isOpen = false, anim = null;

  // Where the pill lives: bottom-right in the room (its HUD and object list sit bottom-left/centre), above the CTA bar on /work.
  const place = () => { root.dataset.ctx = document.querySelector('.scan-root') ? 'room' : document.querySelector('.w-root') ? 'work' : 'page'; };
  place(); setInterval(place, 1000); addEventListener('resize', place);

  let edgeT = 0;
  const glow = (state) => {
    clearTimeout(edgeT); edge.classList.remove('on', 'calm');
    if (state === 'on') edge.classList.add('on');
    else if (state === 'calm') { edge.classList.add('calm'); edgeT = setTimeout(() => edge.classList.remove('calm'), 1400); }
  };
  root.addEventListener('ask-state', (e) => glow(e.detail === 'thinking' ? 'on' : e.detail === 'typing' ? 'calm' : 'off'));
  const clipFrom = () => {
    const r = pill.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    return `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round ${r.height / 2}px)`;
  };
  const open = (q) => {
    if (isOpen) return; isOpen = true;
    const from = clipFrom();
    wrap.classList.add('hide'); pillInput.blur(); glow('on'); if (!q) edgeT = setTimeout(() => glow('off'), 1100);
    sheet.classList.add('open'); pill.setAttribute('aria-expanded', 'true');
    chat ||= mountAsk(body);
    if (!reduced()) {
      anim?.cancel();
      anim = sheet.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 720, easing: spring(), fill: 'none' });
      col.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 160, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    }
    addEventListener('keydown', onKey, true);
    if (q) chat.ask(q); else setTimeout(() => chat.input.focus(), 60);
  };
  const finish = () => { sheet.classList.remove('open'); wrap.classList.remove('hide'); pill.focus?.({ preventScroll: true }); pillInput.focus({ preventScroll: true }); };
  const close = () => {
    if (!isOpen) return; isOpen = false; removeEventListener('keydown', onKey, true); glow('off');
    if (reduced()) return finish();
    anim?.cancel();
    anim = sheet.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: clipFrom() }], { duration: 440, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    anim.onfinish = () => { anim.cancel(); finish(); };
  };
  // While open, the sheet owns the keyboard: nothing reaches the room's shortcuts, Escape closes the sheet (not the room).
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (e.key === 'Tab') {
      const f = [...sheet.querySelectorAll('button,input,[tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled && n.offsetParent);
      if (f.length) { const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length; e.preventDefault(); f[n].focus(); }
    }
    if (!sheet.contains(e.target)) { e.stopImmediatePropagation(); }
  }
  pill.addEventListener('submit', (e) => { e.preventDefault(); const q = pillInput.value.trim(); pillInput.value = ''; open(q.length >= 3 ? q : ''); });
  for (const t of ['keydown', 'keyup', 'keypress']) { pill.addEventListener(t, (e) => e.stopPropagation()); sheet.addEventListener(t, (e) => e.stopPropagation()); }
  sheet.querySelector('header button').onclick = close;
  sheet.addEventListener('pointerdown', (e) => { if (e.target === sheet) close(); });
}
