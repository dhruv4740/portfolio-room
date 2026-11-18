// BlackoutApp.jsx — a browser stand-in for the Blackout Android app.
// A fake player keeps "playing" (a timer, no audio) while the screen is pure black.
// Unlock is a 600 ms press-and-hold, standing in for the fingerprint sensor.
import { useEffect, useRef, useState } from 'react';

const T = { bg: '#0A0E17', card: '#141B2A', line: '#243049', ink: '#F8FAFC', mute: '#9AA7BD', go: '#34D399' };
const LENGTH = 1500; // 25:00 made-up track
const HOLD_MS = 600;
const CALL_MS = 4000;

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const css = `
.bo-root{position:absolute;inset:0;background:${T.bg};color:${T.ink};display:flex;flex-direction:column;padding:40px 18px 34px;box-sizing:border-box;font:15px system-ui,sans-serif;overflow:auto;gap:14px}
.bo-root button{font:inherit;cursor:pointer}
.bo-root button:focus-visible,.bo-black:focus-visible{outline:2px solid ${T.ink};outline-offset:2px}
.bo-art{align-self:center;width:120px;height:120px;border-radius:24px;background:linear-gradient(160deg,#1f2a44,#0d1220);border:1px solid ${T.line};display:grid;place-items:center;font-size:40px}
.bo-bar{height:6px;border-radius:3px;background:${T.line};overflow:hidden}
.bo-bar i{display:block;height:100%;background:${T.go}}
.bo-row{display:flex;justify-content:space-between;color:${T.mute};font-size:13px}
.bo-play{align-self:center;width:56px;height:56px;border-radius:50%;border:0;background:${T.ink};color:#04130D;font-size:20px}
.bo-main{padding:16px;border:0;border-radius:14px;background:${T.go};color:#04130D;font-weight:700;font-size:18px}
.bo-tile{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid ${T.line};background:${T.card};color:${T.ink};text-align:left}
.bo-tile b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#000;border:1px solid #fff;font-size:0}
.bo-ghost{border:0;background:none;color:${T.mute};font-size:14px;text-decoration:underline;padding:6px}
.bo-note{margin:0;padding:10px 12px;border-radius:12px;background:${T.card};border:1px solid ${T.line};font-size:14px}
.bo-cap{margin:auto 0 0;color:${T.mute};font-size:12px;text-align:center}
.bo-black{position:absolute;inset:0;z-index:100;background:#000;opacity:0;visibility:hidden;transition:opacity .25s ease,visibility 0s linear .25s;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;outline-offset:-4px}
.bo-black.is-on{opacity:1;visibility:visible;transition:opacity .25s ease}
.bo-hint{position:absolute;left:0;right:0;bottom:22%;text-align:center;color:#4a4a4a;font-size:14px;opacity:0;transition:opacity .4s ease;pointer-events:none}
.bo-hint.is-on{opacity:1}
.bo-ring{width:64px;height:64px;opacity:0;pointer-events:none}
.bo-ring.is-on{opacity:1}
.bo-ring circle{fill:none;stroke:#6b6b6b;stroke-width:2;stroke-dasharray:176;stroke-dashoffset:176;transform:rotate(-90deg);transform-origin:center}
.bo-ring.is-on circle{animation:bo-fill ${HOLD_MS}ms linear forwards}
@keyframes bo-fill{to{stroke-dashoffset:0}}
.bo-sr{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}
@media (prefers-reduced-motion:reduce){.bo-black,.bo-black.is-on,.bo-hint{transition:none!important}.bo-ring.is-on circle{animation:none!important;stroke-dashoffset:0}}
`;

export default function BlackoutApp() {
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [black, setBlack] = useState(false);
  const [hint, setHint] = useState(false);
  const [holding, setHolding] = useState(false);
  const [msg, setMsg] = useState('');
  const [armed, setArmed] = useState(false);
  const [call, setCall] = useState(false);
  const posRef = useRef(0);
  const playingRef = useRef(true);
  const blackRef = useRef(false);
  const startPos = useRef(0);
  const holdStart = useRef(0);
  const hintTimer = useRef(0);
  const overlay = useRef(null);

  playingRef.current = playing;

  // The player keeps advancing while the screen is black. That is the point.
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (playingRef.current) {
        posRef.current = Math.min(LENGTH, posRef.current + (now - last) / 1000);
        setPos(posRef.current);
      }
      last = now;
    }, 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function showHint(ms) {
    clearTimeout(hintTimer.current);
    setHint(true);
    hintTimer.current = setTimeout(() => setHint(false), ms);
  }

  function goBlack() {
    if (blackRef.current) return;
    blackRef.current = true;
    startPos.current = posRef.current;
    setMsg('');
    setCall(false);
    setBlack(true);
    showHint(2500);
    setTimeout(() => overlay.current?.focus({ preventScroll: true }), 0);
  }

  function unblack(note = true) {
    if (!blackRef.current) return;
    blackRef.current = false;
    clearTimeout(hintTimer.current);
    setHint(false);
    setHolding(false);
    holdStart.current = 0;
    setBlack(false);
    if (note) setMsg(`Played ${fmt(posRef.current - startPos.current)} with the screen off.`);
  }

  function pressStart() {
    if (holdStart.current) return;
    holdStart.current = performance.now();
    setHolding(true);
  }
  function pressEnd(cancel) {
    if (!holdStart.current) return;
    const held = performance.now() - holdStart.current;
    holdStart.current = 0;
    setHolding(false);
    if (cancel) return;
    if (held >= HOLD_MS) unblack();
    else showHint(2000);
  }

  // A simulated call arms a timer. It only matters if the screen is black when it fires.
  useEffect(() => {
    if (!armed) return undefined;
    const id = setTimeout(() => {
      setArmed(false);
      if (blackRef.current) { unblack(false); setCall(true); }
    }, CALL_MS);
    return () => clearTimeout(id);
  }, [armed]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); unblack(); }
    else if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); pressStart(); }
  };
  const onKeyUp = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pressEnd(false); }
  };

  return (
    <div className="bo-root" data-testid="blackout-app" data-black={black ? 'true' : 'false'}>
      <style>{css}</style>
      <div className="bo-art" aria-hidden="true">♪</div>
      <div style={{ textAlign: 'center' }}>
        <b style={{ fontSize: 19 }}>Night Shift Lo-fi</b>
        <div style={{ color: T.mute, fontSize: 13, marginTop: 2 }}>Episode 12 · Quiet Hours Mix</div>
      </div>
      <div>
        <div className="bo-bar" role="progressbar" aria-label="Playback position" aria-valuemin={0} aria-valuemax={LENGTH} aria-valuenow={Math.floor(pos)} aria-valuetext={`${fmt(pos)} of ${fmt(LENGTH)}`} data-testid="blackout-progress">
          <i style={{ width: `${(pos / LENGTH) * 100}%` }} />
        </div>
        <div className="bo-row" aria-hidden="true"><span>{fmt(pos)}</span><span>{fmt(LENGTH)}</span></div>
      </div>
      <button type="button" className="bo-play" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
      <button type="button" className="bo-main" onClick={goBlack}>Black out screen</button>
      <button type="button" className="bo-tile" aria-label="Blackout quick settings tile" onClick={goBlack}>
        <b aria-hidden="true">·</b><span>Blackout<br /><small style={{ color: T.mute }}>Quick Settings tile</small></span>
      </button>
      <button type="button" className="bo-ghost" disabled={armed} onClick={() => setArmed(true)}>{armed ? 'Call arrives in 4 seconds' : 'Simulate incoming call'}</button>
      <div aria-live="polite">
        {msg && <p className="bo-note">{msg}</p>}
        {call && <p className="bo-note" role="status"><b>Incoming call</b><br />Blackout uncovers for calls and alarms.</p>}
      </div>
      <p className="bo-cap">Demo of the Android app. On an OLED screen, black pixels are switched off.</p>
      <div
        ref={overlay}
        className={`bo-black${black ? ' is-on' : ''}`}
        role="dialog"
        aria-label="Screen blacked out. Press and hold to unlock."
        tabIndex={black ? 0 : -1}
        inert={!black}
        data-testid="blackout-screen"
        onPointerDown={pressStart}
        onPointerUp={() => pressEnd(false)}
        onPointerCancel={() => pressEnd(true)}
        onPointerLeave={() => pressEnd(true)}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg className={`bo-ring${holding ? ' is-on' : ''}`} viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" /></svg>
        <p className={`bo-hint${hint ? ' is-on' : ''}`} aria-hidden="true">Audio keeps playing. Hold to unlock.</p>
        <button type="button" className="bo-sr" tabIndex={-1} data-phone-dialog-close="" aria-label="Unlock screen" onClick={() => unblack()} />
      </div>
    </div>
  );
}
