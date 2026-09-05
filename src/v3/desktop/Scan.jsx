// ============================================================================
// Scan — the desktop surface.
//
// A photoreal Gaussian-splat capture floating in void, annotated with
// instrument chrome. Composes SplatStage (3D) with the presentational UI kit.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SplatStage from './SplatStage.jsx';
import Telemetry from '../ui/Telemetry.jsx';
import AnchorPanel from '../ui/AnchorPanel.jsx';
import ScanIntro from '../ui/ScanIntro.jsx';
import LabScreen from './LabScreen.jsx';
import { anchors, projects, capture, identity } from '../content/index.js';
import {
  prefersReducedMotion,
  hasSeenIntro,
  markIntroSeen,
  setOverride,
} from '../lib/capability.js';

export default function Scan() {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [introDone, setIntroDone] = useState(() => hasSeenIntro());
  const [load, setLoad] = useState({ progress: 0, loadedMB: 0, totalMB: 0 });
  const [stats, setStats] = useState({ frameMs: undefined, cameraPos: undefined });
  const [splatCount, setSplatCount] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [labOpen, setLabOpen] = useState(false);
  const [error, setError] = useState(null);

  const lastTrigger = useRef(null);

  const activeAnchor = anchors.find((a) => a.id === activeId) || null;
  const activeProject = activeAnchor
    ? projects.find((p) => p.id === activeAnchor.ref) || null
    : null;

  const handleSelect = useCallback((id) => {
    lastTrigger.current = document.activeElement;
    setActiveId((cur) => (cur === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setActiveId(null);
    setLabOpen(false);
    // Return focus to whatever opened the panel.
    if (lastTrigger.current?.focus) lastTrigger.current.focus();
  }, []);

  const handleIntroDone = useCallback(() => {
    setIntroDone(true);
    markIntroSeen();
  }, []);

  // Escape always backs out one level: lab screen, then panel, then home.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (labOpen) setLabOpen(false);
      else if (activeId) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [labOpen, activeId, handleClose]);

  // The monitor anchor is the one that opens the live lab.
  const monitorIsActive = activeAnchor?.ref === 'lab';

  return (
    <div className="scan-root">
      <style>{css}</style>

      <SplatStage
        src={capture.source}
        expectedBytes={capture.bytes}
        anchors={anchors}
        activeAnchorId={activeId}
        onAnchorSelect={handleSelect}
        onProgress={(p) => setLoad((s) => ({ ...s, ...p }))}
        onReady={({ splatCount }) => setSplatCount(splatCount)}
        onStats={setStats}
        onError={setError}
        reducedMotion={reduced}
      />

      {/* ---- masthead ---------------------------------------------------- */}
      <header className="scan-head">
        <div className="scan-id">
          <h1>{identity.name}</h1>
          <p className="mono">{identity.role} — {identity.location}</p>
        </div>
        <nav className="scan-nav mono">
          <Link to="/work">WORK</Link>
          <span className="sep" aria-hidden="true">/</span>
          <button
            onClick={() => { setOverride('deck'); window.location.reload(); }}
            title="Switch to the mobile deck"
          >
            DECK
          </button>
        </nav>
      </header>

      {/* ---- error state -------------------------------------------------- */}
      {error && (
        <div className="scan-error" role="alert">
          <p className="mono signal">SCAN FAILED TO LOAD</p>
          <p>{error.message}</p>
          <Link to="/work" className="mono">CONTINUE TO TEXT VERSION →</Link>
        </div>
      )}

      {/* ---- instrument chrome -------------------------------------------- */}
      <Telemetry
        splatCount={splatCount}
        frameMs={stats.frameMs}
        loadedMB={load.loadedMB}
        totalMB={load.totalMB}
        cameraPos={stats.cameraPos}
        anchorId={activeId}
        capture={capture}
      />

      <AnchorPanel
        anchor={activeAnchor}
        project={activeProject}
        open={!!activeAnchor && !labOpen}
        onClose={handleClose}
      />

      {monitorIsActive && !labOpen && (
        <button className="lab-cue mono" onClick={() => setLabOpen(true)}>
          ENTER THE SCREEN →
        </button>
      )}

      <LabScreen open={labOpen} onClose={() => setLabOpen(false)} />

      {!introDone && (
        <ScanIntro
          progress={load.progress}
          active={!introDone}
          onDone={handleIntroDone}
          skipped={false}
        />
      )}

      {/* Hint shown once the scene is live and nothing is selected. */}
      {introDone && !activeId && !error && (
        <p className="scan-hint mono">DRAG TO ORBIT — SELECT A MARKER</p>
      )}
    </div>
  );
}

const css = `
.scan-root { position: fixed; inset: 0; overflow: hidden; }

.scan-head {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: var(--z-hud);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: var(--gutter);
  pointer-events: none;
}
.scan-head > * { pointer-events: auto; }
.scan-id h1 {
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: var(--track-hero);
}
.scan-id p { margin-top: 0.15rem; }

.scan-nav { display: flex; align-items: center; gap: 0.6rem; }
.scan-nav a, .scan-nav button {
  color: var(--dim);
  transition: color var(--d-feedback) var(--ease);
  font-family: var(--font-mono);
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
}
.scan-nav a:hover, .scan-nav button:hover { color: var(--signal); }
.scan-nav .sep { color: var(--faint); }

.scan-hint {
  position: absolute;
  bottom: var(--gutter);
  right: var(--gutter);
  z-index: var(--z-hud);
  color: var(--dim);
  pointer-events: none;
  animation: hint-in var(--d-reveal) var(--ease) both;
}
@keyframes hint-in { from { opacity: 0 } to { opacity: 0.75 } }

.lab-cue {
  position: absolute;
  left: 50%;
  bottom: calc(var(--gutter) * 2.5);
  transform: translateX(-50%);
  z-index: var(--z-panel);
  padding: 0.7rem 1.1rem;
  border: var(--hair) solid var(--signal);
  color: var(--signal);
  font-family: var(--font-mono);
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
  transition: background-color var(--d-feedback) var(--ease),
              color var(--d-feedback) var(--ease);
}
.lab-cue:hover { background: var(--signal); color: var(--void); }

.scan-error {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--z-panel);
  max-width: 32rem;
  padding: 1.5rem;
  border: var(--hair) solid var(--faint);
  background: var(--void-lift);
  text-align: center;
}
.scan-error p + p { margin-top: 0.5rem; }
.scan-error a { display: inline-block; margin-top: 1rem; color: var(--signal); }

@media (max-width: 640px) {
  .scan-hint { display: none; }
}
`;
