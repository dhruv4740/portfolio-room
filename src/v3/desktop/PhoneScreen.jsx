// ============================================================================
// PhoneScreen — the held phone's live screen.
//
// Rides the phone display's projected quad (the same projective map the
// monitor uses), so the camera zooms into a real, clickable surface rather
// than a texture. The lock screen is FocusLock's own Android overlay rebuilt
// from its source: overlay_lock.xml for layout, LockOverlayService.kt for
// strings and behaviour, values/colors.xml for colour. Where the app would ask
// its backend, this uses what is true for the visitor instead of invented
// numbers. 1dp = 1.5px on this 540 x 1200 surface.
// ============================================================================

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { INSTAGRAM_ICON_UV_RECT } from './buildWorkspace.js';

export const PHONE_SCREEN = Object.freeze({ width: 540, height: 1200 });

// LockOverlayService titles the overlay with the package name it was handed.
const TARGET = 'com.instagram.android';
const BLOCK_SECONDS = 300;
const GRANTED = 'Extension granted for 5 minutes. Stay intentional.';
const QUOTES = [
  'Focus on being productive instead of busy.',
  'Your focus determines your reality.',
  'Disconnect to reconnect with what matters.',
  "Opportunities don't happen. You create them.",
  'Do not let social media control your attention.',
  'Stay intentional, stay present.',
];

// generateExtensionMathQuestion() at its default "easy" difficulty.
function mathQuestion() {
  const a = 10 + Math.floor(Math.random() * 35), b = 10 + Math.floor(Math.random() * 35);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}
const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const PhoneScreen = forwardRef(function PhoneScreen({ interactive = false, onOpenApp, onHome }, ref) {
  const rootRef = useRef(null);
  const [app, setApp] = useState('home');
  const [opens, setOpens] = useState(0);
  const [quote, setQuote] = useState(QUOTES[1]);
  const [statsReady, setStatsReady] = useState(false);
  const [blockStart, setBlockStart] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [math, setMath] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState('');
  const [time, setTime] = useState(clock);

  function goHome(notify = true) {
    setApp('home'); setMath(null); setAnswer(''); setStatus(''); setToast(''); setTime(clock());
    if (notify) onHome?.();
  }

  useImperativeHandle(ref, () => ({
    // Per-frame from WorkspaceStage during the zoom: style only, no re-render.
    setRect(matrix) {
      const el = rootRef.current;
      if (!el) return;
      el.style.visibility = matrix ? 'visible' : 'hidden';
      el.style.transform = matrix ? `matrix3d(${matrix.join(',')})` : '';
    },
    // The phone was put back on the desk: it wakes to the home screen.
    reset() { goHome(false); },
  }), []);

  function openInstagram() {
    setOpens((n) => n + 1);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setStatsReady(false); setBlockStart(Date.now()); setNow(Date.now());
    setMath(null); setStatus(''); setApp('locked');
    onOpenApp?.();
  }

  function submit(event) {
    event.preventDefault();
    const value = answer.trim();
    if (/^\d+$/.test(value) && Number(value) === math.answer) {
      setMath(null); setAnswer(''); setStatus('Checking extension availability...');
    } else {
      setToast('Incorrect! Try again.'); setAnswer(''); setMath(mathQuestion());
    }
  }

  // Keyboard users land on the thing to press. preventScroll matters: the
  // stage clips overflow, and a focus scroll would shift the whole room.
  useEffect(() => {
    if (!interactive) return undefined;
    const frame = requestAnimationFrame(() => {
      const root = rootRef.current;
      const target = app === 'home' ? root?.querySelector('.ps-app') : root?.querySelector(math ? 'input' : '.ps-btn');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [interactive, app, math]);

  // Stats load, then the block countdown ticks once a second. DOM text only;
  // the WebGL canvas does not render for any of this.
  useEffect(() => {
    if (app !== 'locked') return undefined;
    const load = setTimeout(() => setStatsReady(true), 450);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(load); clearInterval(tick); };
  }, [app, blockStart]);

  useEffect(() => {
    if (!interactive || app !== 'home') return undefined;
    const tick = setInterval(() => setTime(clock()), 15000);
    return () => clearInterval(tick);
  }, [interactive, app]);

  // There is no backend to ask, so the request resolves the way a granted one
  // does in the app: the status confirms it and the overlay is dismissed.
  useEffect(() => {
    if (!status) return undefined;
    const timer = status === GRANTED ? setTimeout(() => goHome(), 1800) : setTimeout(() => setStatus(GRANTED), 700);
    return () => clearTimeout(timer);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const remaining = Math.max(0, BLOCK_SECONDS - Math.floor((now - blockStart) / 1000));
  const countdown = remaining > 0
    ? `Blocked for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
    : 'Block expired. Tap the button below to close.';
  // The DOM icon sits exactly where the texture draws it, so the handoff at
  // the start of the zoom does not jump.
  const r = INSTAGRAM_ICON_UV_RECT;
  const icon = { left: r.uMin * PHONE_SCREEN.width, top: (1 - r.vMax) * PHONE_SCREEN.height, size: (r.uMax - r.uMin) * PHONE_SCREEN.width };

  return (
    <div ref={rootRef} className="phone-screen" role="region" aria-label="Phone screen" data-app={app}
      inert={!interactive} style={{ pointerEvents: interactive ? 'auto' : 'none' }}>
      <style>{css}</style>
      {app === 'home' ? (
        <div className="ps-home">
          <span className="ps-clock">{time}</span>
          <button type="button" className="ps-app" aria-label="Open Instagram" onClick={openInstagram}
            style={{ left: icon.left, top: icon.top, width: icon.size }}>
            <span className="ps-tile" style={{ width: icon.size, height: icon.size }}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <rect x="21" y="21" width="58" height="58" rx="20" />
                <circle cx="50" cy="50" r="17" />
                <circle className="ps-dot" cx="72" cy="28" r="4.65" />
              </svg>
            </span>
            <span className="ps-label">Instagram</span>
          </button>
        </div>
      ) : (
        <div className="ps-lock">
          <span className="ps-pill">Locked</span>
          <h2 className="ps-title">FocusLock paused {TARGET}</h2>
          <div className="ps-card">
            <span className="ps-caption">TODAY&apos;S USAGE</span>
            <span className="ps-stats">{statsReady ? `${opens} opens • 0 min spent today` : "Loading today's stats..."}</span>
          </div>
          <div className="ps-card ps-quote-card"><p className="ps-quote">&quot;{quote}&quot;</p></div>
          {math && (
            <form className="ps-card ps-math" onSubmit={submit}>
              <span className="ps-math-label">Solve to verify intention:</span>
              <span className="ps-math-q">{math.text}</span>
              <div className="ps-math-row">
                <input inputMode="numeric" aria-label="Answer" placeholder="Answer" value={answer}
                  onChange={(event) => setAnswer(event.target.value)} />
                <button type="submit" className="ps-btn ps-primary">Submit</button>
              </div>
            </form>
          )}
          {!math && !status && (
            <button type="button" className="ps-btn ps-secondary" onClick={() => setMath(mathQuestion())}>
              Request 5 Minute Extension
            </button>
          )}
          <button type="button" className="ps-btn ps-primary ps-close" onClick={() => goHome()}>
            {remaining > 0 ? 'I will take a break now' : 'Close and continue'}
          </button>
          <p className="ps-status" aria-live="polite">{status || countdown}</p>
          {toast && <span className="ps-toast" role="status">{toast}</span>}
        </div>
      )}
    </div>
  );
});

export default PhoneScreen;

const css = `
.phone-screen { position:absolute; top:0; left:0; z-index:2; width:540px; height:1200px; overflow:hidden; visibility:hidden; transform-origin:0 0; background:#15171a; color:#F8FAFC; font-family:Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing:antialiased; }
.phone-screen button, .phone-screen input { font-family:inherit; }
.ps-home { position:absolute; inset:0; background:#15171a; }
.ps-clock { position:absolute; top:24px; left:36px; font-size:24px; font-weight:500; color:#e9e9ea; }
.ps-app { position:absolute; display:flex; flex-direction:column; align-items:center; padding:0; border:0; background:none; cursor:pointer; }
.ps-app:focus-visible { outline:none; }
.ps-tile { display:block; border-radius:24%; background:linear-gradient(45deg, #FFD521 0%, #F50000 35%, #B900B4 70%, #4C68D7 100%); transition:box-shadow .15s ease; }
.ps-app:hover .ps-tile, .ps-app:focus-visible .ps-tile { box-shadow:0 0 34px rgba(255,255,255,.55); }
.ps-tile svg { display:block; width:100%; height:100%; fill:none; stroke:#fff; stroke-width:7.5; }
.ps-tile .ps-dot { fill:#fff; stroke:none; }
.ps-label { margin-top:18px; font-size:26px; color:#e9e9ea; white-space:nowrap; }

.ps-lock { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:36px; background:#121820; text-align:center; }
.ps-pill { margin-bottom:24px; padding:6px 18px; font-size:18px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:#EF4444; background:#1E293B; border:1.5px solid #334155; border-radius:24px; }
.ps-title { width:100%; margin:0 0 12px; font-size:36px; font-weight:700; line-height:1.2; color:#F8FAFC; overflow-wrap:anywhere; }
.ps-card { width:100%; display:flex; flex-direction:column; align-items:center; margin-bottom:30px; padding:24px; background:#1E293B; border:1.5px solid #334155; border-radius:24px; }
.ps-caption { margin-bottom:6px; font-size:16.5px; font-weight:700; color:#94A3B8; }
.ps-stats { font-size:21px; color:#F8FAFC; }
.ps-quote-card { margin-bottom:36px; }
.ps-quote { margin:0; font-size:22.5px; font-style:italic; line-height:1.35; color:#6366F1; }
.ps-math { margin-bottom:24px; }
.ps-math-label { margin-bottom:12px; font-size:21px; font-weight:700; color:#F8FAFC; }
.ps-math-q { margin-bottom:12px; font-size:33px; font-weight:700; color:#A78BFA; }
.ps-math-row { display:flex; gap:12px; width:100%; }
.ps-math-row input { flex:1; min-width:0; padding:15px; font-size:22.5px; text-align:center; color:#F8FAFC; background:#111827; border:1.5px solid #334155; border-radius:15px; }
.ps-math-row input::placeholder { color:#94A3B8; }
.ps-btn { width:100%; min-height:72px; padding:0 24px; font-size:21px; border-radius:18px; cursor:pointer; }
.ps-secondary { margin-bottom:15px; color:#F8FAFC; background:#111827; border:1.5px solid #334155; }
.ps-primary { color:#0A0E17; font-weight:700; background:#6366F1; border:0; }
.ps-close { margin-bottom:24px; }
.ps-math-row .ps-btn { width:auto; }
.ps-btn:focus-visible, .ps-math-row input:focus-visible { outline:3px solid #A78BFA; outline-offset:3px; }
.ps-status { width:100%; margin:0; font-size:21px; color:#94A3B8; }
.ps-toast { position:absolute; left:50%; bottom:120px; transform:translateX(-50%); padding:16px 28px; font-size:21px; white-space:nowrap; color:#F8FAFC; background:rgba(40,40,40,.92); border-radius:36px; }
`;
