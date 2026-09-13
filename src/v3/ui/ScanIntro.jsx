// ============================================================================
// ScanIntro.jsx — boot sequence overlay, driven entirely by real build progress.
// Presentational only: never fakes progress, never runs its own timer.
//
// Props:
//   progress  number   — 0..1 real workspace-build progress
//   active    boolean  — whether the overlay should currently be shown
//   onDone    () => void — called once when progress reaches 1, and on SKIP
//   skipped   boolean  — when true, render nothing at all
// ============================================================================

import { useEffect, useRef, useState } from 'react';

function clamp01(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function statusFor(p) {
  if (p >= 1) return 'READY';
  if (p >= 0.7) return 'CALIBRATING MARKERS';
  if (p >= 0.34) return 'LIGHTING SCENE';
  return 'ASSEMBLING WORKSPACE';
}

export default function ScanIntro({ progress, active = true, onDone, skipped }) {
  const p = clamp01(progress);
  const pct = Math.round(p * 100);
  const donePctRef = useRef(false);

  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (p >= 1 && !donePctRef.current) {
      donePctRef.current = true;
      setFinished(true);
      onDone && onDone();
    }
  }, [p, onDone]);

  function handleSkip() {
    if (donePctRef.current) return;
    donePctRef.current = true;
    setFinished(true);
    onDone && onDone();
  }

  if (skipped) return null;

  const visible = active && !finished;

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`scan-intro-root${visible ? ' is-visible' : ' is-hidden'}`}
        aria-hidden={!visible}
      >
        <div className="scan-panel">
          <div className="scan-label mono">WORKSPACE INITIALIZATION</div>
          <div className="scan-bar">
            <div className="scan-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="scan-row mono">
            <span className="scan-status">{statusFor(p)}</span>
            <span className="scan-pct">{pct}%</span>
          </div>
        </div>
        <button type="button" className="scan-skip mono" onClick={handleSkip}>
          SKIP
        </button>
      </div>
    </>
  );
}

const CSS = `
.scan-intro-root {
  position: fixed;
  inset: 0;
  z-index: var(--z-intro);
  background: var(--void);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity var(--d-reveal) var(--ease);
}

.scan-intro-root.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.scan-intro-root .scan-panel {
  width: min(420px, 80vw);
}

.scan-intro-root .scan-label {
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  text-transform: uppercase;
  margin-bottom: 1.2em;
  text-align: center;
}

.scan-intro-root .scan-bar {
  height: var(--hair);
  background: var(--faint);
  margin-bottom: 0.8em;
  position: relative;
}

.scan-intro-root .scan-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--signal);
  transition: width var(--d-feedback) var(--ease);
}

.scan-intro-root .scan-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
  color: var(--dim);
  text-transform: uppercase;
}

.scan-intro-root .scan-pct {
  color: var(--bone);
}

.scan-intro-root .scan-skip {
  position: fixed;
  bottom: var(--gutter);
  right: var(--gutter);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  text-transform: uppercase;
  color: var(--dim);
  border: var(--hair) solid var(--faint);
  padding: 0.6em 1em;
  transition: color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
}

.scan-intro-root .scan-skip:hover {
  color: var(--signal);
  border-color: var(--signal);
}

@media (prefers-reduced-motion: reduce) {
  .scan-intro-root { transition: none; }
  .scan-intro-root .scan-bar-fill { transition: none; }
}
`;
