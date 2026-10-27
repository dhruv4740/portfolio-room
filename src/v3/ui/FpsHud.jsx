// Tiny frame-rate readout for checking smoothness on a real machine. Off by default; turn it on with
// ?fps=1 (remembered in localStorage, ?fps=0 clears it) or Alt+Shift+F. It counts frames the scene
// actually rendered, so the idle 30 Hz mode shows as ~30 rather than the display rate.
import { useEffect, useRef, useState } from 'react';

const KEY = 'v3:fps-hud';

function initial() {
  try {
    const q = new URLSearchParams(window.location.search).get('fps') ?? new URLSearchParams(window.location.hash.split('?')[1] || '').get('fps');
    if (q === '1') localStorage.setItem(KEY, '1');
    else if (q === '0') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch { return false; }
}

export default function FpsHud() {
  const [on, setOn] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.altKey && e.shiftKey && e.code === 'KeyF')) return;
      setOn((v) => { const next = !v; try { next ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch { /* ignore */ } return next; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!on) return undefined;
    let last = performance.now(), count = window.__perfGovernor?.getRenderCount?.() ?? 0;
    const id = setInterval(() => {
      const gov = window.__perfGovernor; if (!gov || !ref.current) return;
      const now = performance.now(), c = gov.getRenderCount(), fps = ((c - count) * 1000) / (now - last);
      last = now; count = c;
      const p = gov.getPacing();
      ref.current.textContent = `${Math.round(fps)} fps${p.idle ? ' (idle)' : ''} · ${Math.round(p.refreshHz)} Hz display`;
    }, 1000);
    return () => clearInterval(id);
  }, [on]);
  if (!on) return null;
  return <div ref={ref} aria-hidden="true" data-testid="fps-hud" style={{ position: 'fixed', left: 8, bottom: 8, zIndex: 9999, padding: '3px 7px', font: '11px/1.3 ui-monospace,monospace', color: '#cfd8d3', background: 'rgba(8,10,12,.72)', borderRadius: 4, pointerEvents: 'none' }}>– fps</div>;
}
