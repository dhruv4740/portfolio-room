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
#ask-pill{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;width:min(360px,calc(100vw - 32px));height:46px;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:4px 4px 4px 16px;border:1px solid rgba(255,255,255,.2);border-radius:99px;background:rgba(48,47,44,.94);box-shadow:0 6px 22px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.12);margin:0}
#ask-pill input{flex:1;min-width:0;border:0;background:transparent;color:#f6f4ee;font:15px system-ui,-apple-system,sans-serif;outline:none;padding:0}
#ask-pill input::placeholder{color:rgba(246,244,238,.62)}
#ask-pill button{flex:none;width:38px;height:38px;border:0;border-radius:50%;background:rgba(246,244,238,.92);color:#26251f;cursor:pointer;font:600 17px/1 system-ui,sans-serif;padding:0}
#ask-pill:focus-within{border-color:rgba(255,255,255,.5)}
#ask-pill button:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
#ask-pill-root[data-ctx=room] #ask-pill{left:auto;right:16px;bottom:68px;transform:none;width:min(250px,calc(100vw - 32px))}
@media (max-width:699px){#ask-pill-root[data-ctx=work] #ask-pill{bottom:calc(84px + env(safe-area-inset-bottom))}}
#ask-sheet{position:fixed;inset:0;display:none;color:#f6f4ee;background:rgba(92,92,98,.52);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.28)}
#ask-sheet.open{display:block}
#ask-sheet .col{box-sizing:border-box;max-width:720px;height:calc(100% - 40px);margin:40px auto 0;padding:18px 20px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column}
#ask-sheet header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font:600 17px system-ui,-apple-system,sans-serif}
#ask-sheet header button{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#f6f4ee;font:20px/1 system-ui,sans-serif;cursor:pointer}
#ask-sheet .body{flex:1;min-height:0}
#ask-sheet input:focus-visible,#ask-sheet button:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
</style>
<form id="ask-pill" role="search" autocomplete="off"><input type="text" maxlength="300" placeholder="Ask about Dhruv" aria-label="Ask about Dhruv" spellcheck="false"><button type="submit" aria-label="Ask">↑</button></form>
<section id="ask-sheet" role="dialog" aria-modal="true" aria-label="Ask about Dhruv"><div class="col"><header><span>Ask about Dhruv</span><button type="button" aria-label="Close">×</button></header><div class="body"></div></div></section>`;
  document.body.appendChild(root);
  const pill = root.querySelector('#ask-pill'), pillInput = pill.querySelector('input'), sheet = root.querySelector('#ask-sheet'), body = sheet.querySelector('.body'), col = sheet.querySelector('.col');
  let chat = null, isOpen = false, anim = null;

  // Where the pill lives: bottom-right in the room (its HUD and object list sit bottom-left/centre), above the CTA bar on /work.
  const place = () => { root.dataset.ctx = document.querySelector('.scan-root') ? 'room' : document.querySelector('.w-root') ? 'work' : 'page'; };
  place(); setInterval(place, 1000); addEventListener('resize', place);

  const clipFrom = () => {
    const r = pill.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    return `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round ${r.height / 2}px)`;
  };
  const open = (q) => {
    if (isOpen) return; isOpen = true;
    const from = clipFrom();
    pill.style.visibility = 'hidden'; pillInput.blur();
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
  const finish = () => { sheet.classList.remove('open'); pill.style.visibility = ''; pill.focus?.({ preventScroll: true }); pillInput.focus({ preventScroll: true }); };
  const close = () => {
    if (!isOpen) return; isOpen = false; removeEventListener('keydown', onKey, true);
    if (reduced()) return finish();
    anim?.cancel();
    anim = sheet.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: clipFrom() }], { duration: 440, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
    anim.onfinish = () => { anim.cancel(); finish(); };
  };
  // While open, the sheet owns the keyboard: nothing reaches the room's shortcuts, Escape closes the sheet (not the room).
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (!sheet.contains(e.target)) { e.stopImmediatePropagation(); }
  }
  pill.addEventListener('submit', (e) => { e.preventDefault(); const q = pillInput.value.trim(); pillInput.value = ''; open(q.length >= 3 ? q : ''); });
  for (const t of ['keydown', 'keyup', 'keypress']) { pill.addEventListener(t, (e) => e.stopPropagation()); sheet.addEventListener(t, (e) => e.stopPropagation()); }
  sheet.querySelector('header button').onclick = close;
  sheet.addEventListener('pointerdown', (e) => { if (e.target === sheet) close(); });
}
