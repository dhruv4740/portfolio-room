// ============================================================================
// Scan — the desktop surface.
//
// A modeled workspace floating in void, annotated with instrument chrome.
// Composes WorkspaceStage (3D) with the presentational UI kit.
// ============================================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkspaceStage from './WorkspaceStage.jsx';
import Telemetry from '../ui/Telemetry.jsx';
import AnchorPanel from '../ui/AnchorPanel.jsx';
import ScanIntro from '../ui/ScanIntro.jsx';
import DhruvOSScreen from './DhruvOSScreen.jsx';
import { anchors, projects, identity } from '../content/index.js';
import {
  prefersReducedMotion,
  hasSeenIntro,
  markIntroSeen,
  setOverride,
} from '../lib/capability.js';

// Must track WorkspaceStage's fly() travel durations (entering/leaving) so
// the phase flips to inside/room exactly when the camera arrives.
const ENTRY_MS = 1200;
const RETURN_MS = 1000;
const PREPARE_TIMEOUT_MS = 9000;

export default function Scan() {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [introDone, setIntroDone] = useState(() => hasSeenIntro());
  const [workspaceProgress, setWorkspaceProgress] = useState(0);
  const [stats, setStats] = useState({
    frameMs: undefined,
    cpuMs: undefined,
    gpuMs: undefined,
    cameraPos: undefined,
  });
  const [seated, setSeated] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [screenPhase, setScreenPhase] = useState('room');
  const [osReady, setOsReady] = useState(false);
  const [screenError, setScreenError] = useState(null);
  const [error, setError] = useState(null);

  const lastTrigger = useRef(null);
  // Focus is restored in a layout effect rather than a rAF: the harness (and a
  // keyboard user) reads activeElement as soon as the room state flips, and a
  // deferred focus loses that race.
  const pendingFocus = useRef(false);
  const dhruvRef = useRef(null);

  const handleScreenRect = useCallback((rect) => {
    dhruvRef.current?.setScreenRect(rect);
  }, []);
  const handleTravel = useCallback((t, travelPhase) => {
    dhruvRef.current?.setTravel(t, travelPhase);
  }, []);

  const activeAnchor = anchors.find((a) => a.id === activeId) || null;
  const activeProject = activeAnchor
    ? projects.find((p) => p.id === activeAnchor.ref) || null
    : null;
  // The notebook carries its text on the page itself, so zooming in IS the
  // content. A side panel repeating it would be the same words twice.
  const panelOpens = !!activeAnchor && activeAnchor.id !== 'notebook';

  // The monitor anchor is the one that opens the embedded OS.
  const monitorIsActive = activeAnchor?.ref === 'lab';

  const handleProgress = useCallback((event) => {
    const value = typeof event === 'number' ? event : event?.progress;
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    setWorkspaceProgress(Math.max(0, Math.min(1, value)));
  }, []);

  const handleWorkspaceReady = useCallback(() => {
    setWorkspaceProgress(1);
  }, []);

  const handleSelect = useCallback((id) => {
    if (screenPhase !== 'room') return;
    lastTrigger.current = document.activeElement;
    setActiveId((cur) => (cur === id ? null : id));
  }, [screenPhase]);

  const handleClose = useCallback(() => {
    if (screenPhase !== 'room') return;
    setActiveId(null);
    setScreenError(null);
    // Return focus to whatever opened the panel.
    if (lastTrigger.current?.focus) lastTrigger.current.focus();
  }, [screenPhase]);

  const handleEnterScreen = useCallback(() => {
    if (screenPhase !== 'room') return;
    // Marker selection already recorded the marker before the cue moved focus
    // into the panel. Preserve it for the cue path; direct canvas hits focus
    // the same marker in WorkspaceStage before calling this handler.
    if (activeId !== 'monitor' || !lastTrigger.current?.isConnected) {
      lastTrigger.current = document.querySelector('[data-object="monitor"]');
    }
    setScreenError(null);
    // The stage can invoke this directly from the modeled monitor. Set the
    // anchor in the same transaction so the camera and OS handoff never rely
    // on a previous marker-selection render.
    setActiveId('monitor');
    setScreenPhase(osReady ? (reduced ? 'inside' : 'entering') : 'preparing');
  }, [activeId, osReady, reduced, screenPhase]);

  const handleLeaveScreen = useCallback(() => {
    if (screenPhase === 'room' || screenPhase === 'leaving') return;
    setScreenPhase('leaving');
    // Clearing the anchor starts the existing rig's flight home. The screen
    // contracts over that same interval, so the handoff has one direction.
    setActiveId(null);
  }, [screenPhase]);

  const handleIntroDone = useCallback(() => {
    setIntroDone(true);
    markIntroSeen();
  }, []);

  // Escape backs out one level: the embedded OS, then the selected anchor.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (screenPhase === 'inside' || screenPhase === 'entering') {
        e.preventDefault();
        handleLeaveScreen();
      } else if (screenPhase === 'preparing') {
        e.preventDefault();
        setScreenPhase('room');
        setActiveId(null);
        pendingFocus.current = true;
      } else if (activeId) handleClose();
      else if (seated) setSeated(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, handleClose, handleLeaveScreen, screenPhase, seated]);

  // The destination is prepared before the camera handoff commits. If the
  // child never answers, restore the room instead of leaving an inert overlay.
  useEffect(() => {
    if (screenPhase !== 'preparing') return undefined;
    const timer = window.setTimeout(() => {
      setScreenError('dhruvOS did not respond. The room is still available.');
      setScreenPhase('room');
      setActiveId(null);
    }, PREPARE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [screenPhase]);

  useEffect(() => {
    if (screenPhase !== 'preparing' || !osReady) return;
    setScreenPhase(reduced ? 'inside' : 'entering');
  }, [osReady, reduced, screenPhase]);

  useEffect(() => {
    if (screenPhase !== 'entering') return undefined;
    const timer = window.setTimeout(() => setScreenPhase('inside'), reduced ? 0 : ENTRY_MS);
    return () => window.clearTimeout(timer);
  }, [reduced, screenPhase]);

  useEffect(() => {
    if (screenPhase !== 'leaving') return undefined;
    const timer = window.setTimeout(() => {
      setScreenPhase('room');
      setScreenError(null);
      pendingFocus.current = true;
    }, reduced ? 0 : RETURN_MS);
    return () => window.clearTimeout(timer);
  }, [reduced, screenPhase]);

  // Runs after WorkspaceStage's own layout effect has restored marker
  // visibility (child effects commit before the parent's), so the marker is
  // focusable by the time we reach for it. The single reassert covers the
  // departing overlay pulling focus back as it unmounts.
  useLayoutEffect(() => {
    if (screenPhase !== 'room' || !pendingFocus.current) return undefined;
    pendingFocus.current = false;
    const target = lastTrigger.current;
    if (!target?.focus) return undefined;
    target.focus();
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement !== target) target.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screenPhase]);

  const handleOSLoadError = useCallback((message) => {
    setOsReady(false);
    setScreenError(message || 'The embedded screen could not be loaded.');
    setScreenPhase('room');
    setActiveId(null);
  }, []);

  const handleOSReady = useCallback(() => {
    setOsReady(true);
    setScreenError(null);
  }, []);

  return (
    <div className="scan-root" data-entrance-state={screenPhase}>
      <style>{css}</style>

      <WorkspaceStage
        entryVisible={introDone}
        seated={seated}
        onSit={() => { setActiveId(null); setSeated(true); }}
        anchors={anchors}
        activeAnchorId={activeId}
        onAnchorSelect={handleSelect}
        onEnterScreen={handleEnterScreen}
        onProgress={handleProgress}
        onReady={handleWorkspaceReady}
        onStats={setStats}
        onError={setError}
        onScreenRect={handleScreenRect}
        onTravel={handleTravel}
        reducedMotion={reduced}
        paused={screenPhase === 'preparing' || screenPhase === 'inside'}
        phase={screenPhase}
      />

      {screenPhase === 'room' && seated && (
        <div className="seat-exit mono">
          <button onClick={() => handleSelect('notebook')}>NOTEBOOK</button>
          <button onClick={handleEnterScreen}>MONITOR</button>
          <button onClick={() => { setActiveId(null); setSeated(false); }}>STAND UP / ESC</button>
        </div>
      )}
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
          <p className="mono signal">WORKSPACE FAILED TO BUILD</p>
          <p>{error?.message || String(error)}</p>
          <Link to="/work" className="mono">CONTINUE TO TEXT VERSION →</Link>
        </div>
      )}

      {/* ---- instrument chrome -------------------------------------------- */}
        <Telemetry
        frameMs={stats.frameMs}
        anchorId={activeId}
      />

      <AnchorPanel
        anchor={activeAnchor}
        project={activeProject}
        open={panelOpens && screenPhase === 'room'}
        onClose={handleClose}
      />

      {monitorIsActive && screenPhase === 'room' && (
        <div className="screen-cue-wrap">
          {screenError && <p className="screen-cue-error mono" role="alert">{screenError}</p>}
          <button className="lab-cue mono" data-testid="enter-screen" onClick={handleEnterScreen}>
            ENTER THE SCREEN <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {screenError && screenPhase === 'room' && !monitorIsActive && (
        <div className="screen-failure mono" role="alert">{screenError}</div>
      )}

      <DhruvOSScreen
        ref={dhruvRef}
        phase={screenPhase}
        reducedMotion={reduced}
        onReady={handleOSReady}
        onLoadError={handleOSLoadError}
        onRequestLeave={handleLeaveScreen}
      />

      {!introDone && (
        <ScanIntro
          progress={workspaceProgress}
          active={!introDone}
          onDone={handleIntroDone}
          skipped={false}
        />
      )}

      {/* Hint shown once the scene is live and nothing is selected. */}
      {introDone && !activeId && !error && (
        <p className="scan-hint mono">{seated ? 'DRAG TO LOOK / SELECT NOTEBOOK OR MONITOR' : 'DRAG TO ORBIT / SELECT A MARKER'}</p>
      )}
    </div>
  );
}

const css = `
.seat-exit { display:flex; gap:18px; position:absolute; bottom:calc(var(--gutter) + 48px); left:var(--gutter); z-index:var(--z-panel); padding:12px 16px; color:var(--bone); background:var(--void); border:1px solid var(--dim); }
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

@media (prefers-reduced-motion: reduce) {
  .scan-hint { animation: none; }
}

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

.screen-cue-wrap {
  position: absolute;
  left: 50%;
  bottom: calc(var(--gutter) * 2.5);
  z-index: var(--z-panel);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transform: translateX(-50%);
}
.screen-cue-error {
  max-width: 18rem;
  color: var(--signal);
  text-align: right;
}
.screen-failure {
  position: absolute;
  left: 50%;
  bottom: var(--gutter);
  z-index: var(--z-panel);
  max-width: min(30rem, 80vw);
  padding: 0.65rem 0.9rem;
  border: var(--hair) solid var(--faint);
  color: var(--signal);
  background: var(--void-lift);
  transform: translateX(-50%);
}

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
