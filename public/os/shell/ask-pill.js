// ask-pill.js — the always-visible "Ask about Dhruv" pill on every surface (/work, room, scan).
// A small field floats bottom-centre (bottom-right in the room, clear of the HUD). Submitting morphs it into a
// rounded glass card (a JS spring drives its real box from the pill's rect); Esc or a tap outside morphs it back.
// The blur and the WebGL glow are created on first touch of the pill and run only while the card is open, so pages
// that never use Ask (and the room's frame rate) pay nothing.
import { mountAsk } from './ask.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = () => matchMedia('(pointer: coarse)').matches;
export function mountAskPill() {
  if (document.getElementById('ask-pill-root')) return;
  const root = document.createElement('div');
  root.id = 'ask-pill-root';
  root.innerHTML = `<style>
#ask-pill-root{position:fixed;z-index:2147483000;left:0;top:0;width:0;height:0;font:400 14px/1.4 system-ui,-apple-system,sans-serif}
html[data-overlay] #ask-pill-root{display:none}
#ask-wrap{position:fixed;z-index:2;left:50%;transform:translateX(-50%);bottom:16px;width:min(280px,calc(100vw - 32px));height:46px}
#ask-pill{position:relative;width:100%;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:4px 4px 4px 16px;border:1px solid rgba(255,255,255,.16);border-radius:99px;background:rgba(30,30,34,.72);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);box-shadow:0 10px 30px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(255,255,255,.05);margin:0;transition:transform .35s cubic-bezier(.2,.9,.25,1.2),box-shadow .35s}
#ask-pill:hover,#ask-pill:focus-within{box-shadow:0 14px 38px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.3)}
#ask-pill input{flex:1;min-width:0;border:0;background:transparent;color:#f6f4ee;font:15px system-ui,-apple-system,sans-serif;outline:none;padding:0}
#ask-pill input::placeholder{color:rgba(246,244,238,.62)}
#ask-pill button{flex:none;width:38px;height:38px;border:0;border-radius:50%;background:rgba(246,244,238,.92);color:#26251f;cursor:pointer;font:600 17px/1 system-ui,sans-serif;padding:0;transition:transform .12s ease-out}
#ask-pill button:active{transform:scale(.9)}
#ask-pill:focus-within{border-color:rgba(255,255,255,.5)}
#ask-pill button:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
@media (pointer:coarse){#ask-pill input{font-size:16px}}
/* While the card is out, the pill keeps only its text and button (fading over the first stretch of the morph) on top of
   the card's own glass, so two half-transparent glass layers never stack. */
#ask-wrap.morph #ask-pill{background:transparent;border-color:transparent;-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none;transition:none}
#ask-wrap.morph .halo{display:none}
#ask-pill-root[data-ctx=room] #ask-wrap{left:auto;right:16px;bottom:68px;transform:none;width:min(250px,calc(100vw - 32px))}
@media (max-width:699px){#ask-pill-root[data-ctx=work] #ask-wrap{bottom:calc(84px + env(safe-area-inset-bottom))}}
#ask-scrim{position:fixed;z-index:0;inset:0;display:none;background:rgba(8,8,12,.42);opacity:0}
#ask-card{position:fixed;z-index:1;display:none;overflow:hidden;contain:layout paint;will-change:transform,clip-path;color:#f6f4ee;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,0) 30%),rgba(22,22,26,.74);-webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%);box-shadow:0 24px 70px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.2)}
#ask-card:focus{outline:none}
#ask-card.fallback{box-shadow:0 24px 70px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.22),0 0 36px rgba(188,130,243,.38),0 0 90px rgba(141,159,255,.22)}
@media (prefers-reduced-transparency:reduce){#ask-pill,#ask-card{-webkit-backdrop-filter:none;backdrop-filter:none;background:#26262a}}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){#ask-pill,#ask-card{background:#26262a}}
#ask-scrim.open,#ask-card.open{display:block}
#ask-card .col{position:absolute;left:50%;bottom:0;box-sizing:border-box;padding:16px 20px 18px;display:flex;flex-direction:column}
#ask-card header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;font:600 17px system-ui,-apple-system,sans-serif}
#ask-card header .hb{display:flex;gap:8px}
#ask-card header button{height:36px;border:0;border-radius:99px;background:rgba(255,255,255,.14);color:#f6f4ee;cursor:pointer}
#ask-card header .x{width:36px;font:20px/1 system-ui,sans-serif}
#ask-card header .new{padding:0 14px;font:500 13px system-ui,sans-serif}
#ask-card header .new[hidden]{display:none}
#ask-card .body{flex:1;min-height:0}
#ask-card input:focus-visible,#ask-card button:focus-visible,#ask-card a:focus-visible{outline:2px solid #f6f4ee;outline-offset:2px}
#ask-glow{position:fixed;z-index:1;left:0;top:0;width:100vw;height:100vh;pointer-events:none;visibility:hidden}
#ask-safe{position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom)}
/* idle pill: quiet glass, a faint iridescent sheen that only wakes on hover/focus */
#ask-wrap .halo{position:absolute;inset:2px;border-radius:99px;background:linear-gradient(100deg,#f5b9ea,#bc82f3 40%,#8d9fff 70%,#ffba71);filter:blur(14px);opacity:0;transform:scale(.92);transition:opacity .9s cubic-bezier(.2,.8,.2,1),transform .9s cubic-bezier(.2,.8,.2,1);pointer-events:none}
#ask-wrap:hover .halo,#ask-wrap:focus-within .halo{opacity:.32;transform:scale(1)}
</style>
<div id="ask-wrap"><span class="halo"></span><form id="ask-pill" role="search" autocomplete="off"><input type="text" maxlength="300" placeholder="Ask about Dhruv" aria-label="Ask about Dhruv" spellcheck="false"><button type="submit" aria-label="Ask">↑</button></form></div>
<div id="ask-scrim"></div><section id="ask-card" role="dialog" aria-modal="true" aria-label="Ask about Dhruv" tabindex="-1"><div class="col"><header><span>Ask about Dhruv</span><span class="hb"><button type="button" class="new" hidden>New chat</button><button type="button" class="x" aria-label="Close">×</button></span></header><div class="body"></div></div></section><canvas id="ask-glow" aria-hidden="true"></canvas><div id="ask-safe"></div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const wrap = $('#ask-wrap'), pill = $('#ask-pill'), pillInput = pill.querySelector('input'), scrim = $('#ask-scrim'), card = $('#ask-card'), body = card.querySelector('.body'), col = card.querySelector('.col'), cvs = $('#ask-glow'), newBtn = card.querySelector('.new'), safe = $('#ask-safe');
  let chat = null, isOpen = false, settled = false, byKey = false;

  // Where the pill lives: bottom-right in the room (its HUD and object list sit bottom-left/centre), above the CTA bar on /work.
  const place = () => { root.dataset.ctx = document.querySelector('.scan-root') ? 'room' : document.querySelector('.w-root') ? 'work' : 'page'; };
  place(); setInterval(place, 1000); addEventListener('resize', place);

  // Geometry: the card morphs between the pill's rect (p = 0) and the card (p = 1). Desktop: a centred card. Phones: a
  // floating card inset from the edges and sitting low, near the pill. Once the open has landed, the card follows the
  // visual viewport, so an on-screen keyboard pushes it up instead of covering its input.
  const vv = window.visualViewport;
  const pillBox = () => { const r = pill.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.height / 2 }; };
  const cardBox = () => {
    const W = innerWidth, top = settled && vv ? vv.offsetTop : 0, H = settled && vv ? vv.height : innerHeight;
    if (W < 700) {
      const kb = H < innerHeight * 0.8, sb = kb ? 0 : parseFloat(getComputedStyle(safe).paddingBottom) || 0;
      const h = Math.max(200, Math.min(600, H - sb - (kb ? 32 : 112)));
      return { x: 16, y: top + H - sb - h - 16, w: W - 32, h, r: 24 };
    }
    const w = Math.min(640, W - 24), h = Math.min(620, H - 48);
    return { x: (W - w) / 2, y: top + (H - h) / 2, w, h, r: 28 };
  };
  let A = null, B = null, box = null;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, t) => { const x = Math.min(Math.max((t - a) / (b - a), 0), 1); return x * x * (3 - 2 * x); };
  const apply = (p) => {
    // Geometry never passes the card's own size: a spring overshoot would otherwise invert the clip insets.
    const g = Math.min(Math.max(p, 0), 1);
    box = { x: lerp(A.x, B.x, g), y: lerp(A.y, B.y, g), w: Math.max(lerp(A.w, B.w, g), 1), h: Math.max(lerp(A.h, B.h, g), 1), r: lerp(A.r, B.r, g) };
    box.r = Math.min(box.r, box.w / 2, box.h / 2);
    // The card keeps its final size (resizing a backdrop-blurred layer every frame reallocates GPU surfaces and stutters);
    // the visible shape is a rounded clip, translated so it sits exactly on the morphing box.
    const ix = (B.w - box.w) / 2, iy = B.h - box.h;
    card.style.clipPath = `inset(${iy}px ${ix}px 0px ${ix}px round ${box.r}px)`;
    card.style.transform = `translate(${box.x - B.x - ix}px,${box.y - B.y - iy}px)`;
    scrim.style.opacity = g;
    // The card is opaque from the first frame and starts exactly on the pill; the pill's text fades out over it.
    wrap.style.opacity = 1 - ease(0, 0.15, g);
    // Content stays centred in the growing shape and fades in late, so header, thread and input arrive together.
    const c = ease(0.4, 0.9, g);
    col.style.opacity = c; col.style.transform = `translateY(${iy / 2 + (1 - c) * 10}px)`;
  };
  const sizeCol = () => {
    Object.assign(card.style, { left: B.x + 'px', top: B.y + 'px', width: B.w + 'px', height: B.h + 'px', borderRadius: B.r + 'px' });
    Object.assign(col.style, { width: B.w + 'px', height: B.h + 'px', marginLeft: -B.w / 2 + 'px' });
  };

  // Spring on the morph progress (position + velocity), so a close mid-open reverses from where it is with its momentum.
  // Response/damping follow Apple's sheet values: open 0.42 s at 0.86 (a breath of overshoot), close 0.34 s critically damped.
  // Both start with some velocity, so the first frame after a tap already moves.
  const S = { x: 0, v: 0, to: 0, resp: 0.42, damp: 0.86, live: false };
  const stepSpring = (dt) => {
    const k = (2 * Math.PI / S.resp) ** 2, c = 4 * Math.PI * S.damp / S.resp, n = 4, h = dt / n;
    for (let i = 0; i < n; i++) { S.v += (-k * (S.x - S.to) - c * S.v) * h; S.x += S.v * h; }
    if (Math.abs(S.x - S.to) < 0.0008 && Math.abs(S.v) < 0.01) { S.x = S.to; S.v = 0; S.live = false; }
  };

  // Siri-style light: one WebGL pass draws a continuous glow that hugs the card's rounded outline (thin bright core,
  // soft mid band, wide bloom outside, gentle wash inside). Apple's palette flows slowly and unevenly around it; the
  // whole outline is always lit. On open it ignites from the pill and sweeps round both sides.
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 uRes;uniform vec4 uBox;uniform float uR,uT,uI,uSw,uO,uS;
float sd(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 pal(float h){h=fract(h)*6.;
vec3 c0=vec3(.553,.624,1.),c1=vec3(.737,.510,.953),c2=vec3(.961,.725,.918),c3=vec3(1.,.404,.471),c4=vec3(1.,.729,.443),c5=vec3(.776,.525,1.);
float i=floor(h),f=smoothstep(0.,1.,fract(h));
vec3 a=i<1.?c0:i<2.?c1:i<3.?c2:i<4.?c3:i<5.?c4:c5;
vec3 b=i<1.?c1:i<2.?c2:i<3.?c3:i<4.?c4:i<5.?c5:c0;
return mix(a,b,f);}
void main(){
vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uS;
vec2 q=p-uBox.xy;float d=sd(q,uBox.zw,uR);
float T=6.2832,a=atan(q.y/uBox.w,q.x/uBox.z)/T+.5;
float h=a+uT*.045+.07*sin(T*2.*a-uT*.6)+.04*sin(T*3.*a+uT*.9);
vec3 c=pal(h);
float br=.82+.18*sin(T*3.*a-uT*1.1+1.3*sin(uT*.37));
float da=abs(fract(a-uO+.5)-.5),fr=uSw*.52;
float m=1.-smoothstep(fr-.1,fr+.01,da);
float fl=exp(-pow((da-fr)/.05,2.))*(1.-uSw)*1.2;
float core=exp(-abs(d)/1.4),mid=exp(-abs(d)/8.);
float wash=d>0.?exp(-d/38.)*.38:exp(d/20.)*.42;
float al=clamp((core*.85+mid*.5+wash)*br*(m+fl)*uI,0.,1.);
gl_FragColor=vec4(mix(c,vec3(1.),.45*core)*al,al);}`;
  let gl = null, U = null, glFailed = false, scale = 1;
  const initGL = () => {
    if (gl || glFailed || reduced()) return !!gl;
    try {
      const g = cvs.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
      const sh = (t, src) => { const s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
      const pr = g.createProgram(); g.attachShader(pr, sh(g.VERTEX_SHADER, VS)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(pr);
      if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error('link');
      g.useProgram(pr); g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      U = Object.fromEntries(['uRes', 'uBox', 'uR', 'uT', 'uI', 'uSw', 'uO', 'uS'].map((n) => [n, g.getUniformLocation(pr, n)]));
      g.clearColor(0, 0, 0, 0); gl = g; sizeGL();
      // Warm the pipeline once so the first real frame doesn't stall inside the open animation.
      g.uniform1f(U.uI, 0); g.drawArrays(g.TRIANGLES, 0, 3); g.clear(g.COLOR_BUFFER_BIT);
      cvs.addEventListener('webglcontextlost', () => { gl = null; glFailed = true; card.classList.add('fallback'); });
    } catch { gl = null; glFailed = true; }
    return !!gl;
  };
  // A soft glow needs no retina detail; on phones the canvas covers most of the screen, so it renders at 1x there.
  // CSS size is pinned to innerWidth/innerHeight, the frame the shader draws in: on a phone 100vh is the height with
  // the address bar hidden, so a 100vh canvas was stretched and the glow slid off the card's edges.
  function sizeGL() { if (!gl) return; scale = Math.min(devicePixelRatio || 1, coarse() ? 1 : 1.5); cvs.width = Math.round(innerWidth * scale); cvs.height = Math.round(innerHeight * scale); cvs.style.width = innerWidth + 'px'; cvs.style.height = innerHeight + 'px'; }
  const refit = () => { if (isOpen) { B = cardBox(); sizeCol(); if (!S.live) apply(S.x); kick(); } };
  addEventListener('resize', () => { sizeGL(); refit(); });
  if (vv) { vv.addEventListener('resize', () => { if (settled) refit(); }); vv.addEventListener('scroll', () => { if (settled) refit(); }); }
  // Build the chat and lay the card out once, hidden, as soon as the visitor reaches for the pill (hover, focus or touch),
  // so the first open has nothing to construct mid-morph. Nothing is built for visitors who never touch it.
  const warm = () => {
    initGL();
    if (chat || isOpen) return;
    B = cardBox(); sizeCol(); chat = mountAsk(body);
    // Paint every GPU path once at near-zero opacity (backdrop blur, the glow shader): the first
    // use of each compiles GPU programs, which otherwise stalls the first open in a fresh browser.
    A = pillBox(); apply(1); wrap.style.opacity = ''; scrim.style.opacity = 0; card.style.opacity = '0.002'; card.classList.add('open');
    if (gl) { cvs.style.opacity = '0.002'; cvs.style.visibility = 'visible'; G.i = 0.5; draw(performance.now()); }
    let n = 0; const tick = () => {
      if (isOpen) { card.style.opacity = cvs.style.opacity = ''; G.i = 0; return; }
      if (gl) draw(performance.now());
      if (++n < 4) return requestAnimationFrame(tick);
      card.classList.remove('open'); card.style.opacity = cvs.style.opacity = ''; G.i = 0;
      if (gl) { draw(performance.now()); cvs.style.visibility = 'hidden'; }
    };
    requestAnimationFrame(tick);
  };
  for (const [t, el] of [['pointerenter', pill], ['pointerdown', pill], ['focus', pillInput]]) el.addEventListener(t, warm, { once: true });

  // Glow level eases toward a target: ignite on open, full while thinking, softer while the answer lands, a quiet rim at rest.
  const G = { i: 0, to: 0, sw: 1, sw0: 0, o: 0.75, t0: performance.now() };
  const LEVEL = { thinking: 1, typing: 0.55, idle: 0.32 };
  root.addEventListener('ask-state', (e) => { if (isOpen) G.to = LEVEL[e.detail] ?? LEVEL.idle; newBtn.hidden = !chat?.started(); kick(); });
  const draw = (now) => {
    if (!gl) return;
    const W = cvs.width, H = cvs.height, pad = 150;
    gl.viewport(0, 0, W, H); gl.disable(gl.SCISSOR_TEST); gl.clear(gl.COLOR_BUFFER_BIT);
    if (G.i < 0.002 || !box) return;
    const x0 = Math.max(0, Math.floor((box.x - pad) * scale)), y0 = Math.max(0, Math.floor(H - (box.y + box.h + pad) * scale));
    gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, y0, Math.ceil((box.w + 2 * pad) * scale), Math.ceil((box.h + 2 * pad) * scale));
    gl.uniform2f(U.uRes, W, H); gl.uniform4f(U.uBox, box.x + box.w / 2, box.y + box.h / 2, box.w / 2, box.h / 2);
    gl.uniform1f(U.uR, box.r); gl.uniform1f(U.uT, (now - G.t0) / 1000); gl.uniform1f(U.uI, G.i);
    gl.uniform1f(U.uSw, G.sw); gl.uniform1f(U.uO, G.o); gl.uniform1f(U.uS, scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  let raf = 0, last = 0;
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    if (S.live) {
      stepSpring(dt);
      // The close lands on the pill's exact rect (0.3% of the way is under a pixel), then hands over in the same frame.
      if (!isOpen && S.x < 0.003) Object.assign(S, { x: 0, v: 0, live: false });
      apply(S.x);
    }
    if (isOpen && !S.live && !settled) { settled = true; refit(); }
    G.i += (G.to - G.i) * (1 - Math.exp(-dt / (G.to > G.i ? 0.16 : G.to ? 0.32 : 0.2)));
    if (G.sw < 1) { const t = Math.min((now - G.sw0) / 1100, 1); G.sw = 1 - (1 - t) ** 3; }
    draw(now);
    if (!isOpen && !S.live && card.classList.contains('open')) finish();
    if (S.live || isOpen || G.i > 0.002) raf = requestAnimationFrame(frame);
    else { raf = 0; cvs.style.visibility = 'hidden'; }
  };
  function kick() { if (!raf && (gl || S.live)) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  const open = (q) => {
    if (isOpen) return; isOpen = true; settled = false; byKey = false;
    chat ||= mountAsk(body);
    A = pillBox(); B = cardBox(); sizeCol();
    wrap.style.pointerEvents = 'none'; wrap.classList.add('morph'); pillInput.blur();
    card.style.opacity = '';
    scrim.classList.add('open'); card.classList.add('open'); pill.setAttribute('aria-expanded', 'true');
    newBtn.hidden = !chat.started();
    const lit = !reduced() && initGL();
    card.classList.toggle('fallback', !lit);
    if (reduced()) { Object.assign(S, { x: 1, v: 0, to: 1, live: false }); apply(1); settled = true; refit(); }
    else {
      if (G.i < 0.05) {
        const pc = { x: A.x + A.w / 2, y: A.y + A.h / 2 }, cc = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
        G.sw = 0; G.sw0 = performance.now(); G.o = Math.atan2((pc.y - cc.y) / (B.h / 2), (pc.x - cc.x) / (B.w / 2)) / (2 * Math.PI) + 0.5;
      }
      G.to = q ? LEVEL.thinking : 0.75;
      if (!q) setTimeout(() => { if (isOpen && G.to === 0.75) G.to = LEVEL.idle; }, 1200);
      Object.assign(S, { to: 1, resp: 0.42, damp: 0.86, live: true, v: S.v + 2 }); apply(S.x);
      if (lit) cvs.style.visibility = 'visible';
      kick();
    }
    addEventListener('keydown', onKey, true);
    // Phones: no auto-focus into the card's input, or the keyboard would jump up mid-morph over the suggestions.
    if (q) chat.ask(q);
    if (q || coarse()) card.focus({ preventScroll: true }); else setTimeout(() => chat.input.focus({ preventScroll: true }), 60);
  };
  function finish() {
    if (isOpen) return;
    scrim.classList.remove('open'); card.classList.remove('open'); wrap.classList.remove('morph'); wrap.style.pointerEvents = wrap.style.opacity = '';
    // Back to the pill's field for keyboard users; on a touch screen that would just pop the keyboard back up.
    if (byKey || !coarse()) pillInput.focus({ preventScroll: true });
  }
  const close = () => {
    if (!isOpen) return; isOpen = false; settled = false; removeEventListener('keydown', onKey, true); pill.setAttribute('aria-expanded', 'false');
    if (document.activeElement && card.contains(document.activeElement)) document.activeElement.blur();
    if (reduced()) { Object.assign(S, { x: 0, v: 0, to: 0, live: false }); return finish(); }
    A = pillBox(); G.to = 0;
    Object.assign(S, { to: 0, resp: 0.34, damp: 1, live: true, v: S.v - 1.5 });
    kick();
  };
  // While open, the card owns the keyboard: nothing reaches the room's shortcuts, Escape closes the card (not the room).
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); byKey = true; close(); return; }
    if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button,input,a[href],[tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled && n.offsetParent);
      if (f.length) { const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length; e.preventDefault(); f[n].focus(); }
    }
    if (!card.contains(e.target)) { e.stopImmediatePropagation(); }
  }
  pill.addEventListener('submit', (e) => { e.preventDefault(); const q = pillInput.value.trim(); pillInput.value = ''; open(q.length >= 3 ? q : ''); });
  for (const t of ['keydown', 'keyup', 'keypress']) { pill.addEventListener(t, (e) => e.stopPropagation()); card.addEventListener(t, (e) => e.stopPropagation()); }
  card.querySelector('header .x').onclick = close;
  newBtn.onclick = () => { chat.reset(); newBtn.hidden = true; if (coarse()) card.focus({ preventScroll: true }); else chat.input.focus(); };
  root.addEventListener('ask-close', close);
  scrim.addEventListener('pointerdown', close);
}
