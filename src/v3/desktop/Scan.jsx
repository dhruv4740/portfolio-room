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
import { startCityAmbience, stopCityAmbience, disposeCityAmbience } from './cityAudio.js';
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
  const showDebug = useMemo(() => {
    try {
      const hashQuery = window.location.hash.split('?')[1] || '';
      return new URLSearchParams(window.location.search).get('debug') === '1'
        || new URLSearchParams(hashQuery).get('debug') === '1'
        || localStorage.getItem('v3:test') === '1';
    } catch { return false; }
  }, []);
  const [introDone, setIntroDone] = useState(() => hasSeenIntro());
  const [workspaceProgress, setWorkspaceProgress] = useState(0);
  const [stats, setStats] = useState({
    frameMs: undefined,
    cpuMs: undefined,
    gpuMs: undefined,
    cameraPos: undefined,
  });
  const [liveMonitor,setLiveMonitor]=useState(false);
  const [seated, setSeated] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [coffeeEmpty, setCoffeeEmpty] = useState(false);
  useEffect(() => {
    const onCoffee = (event) => setCoffeeEmpty(event.detail.level <= 0.001);
    window.addEventListener('workspace:coffee', onCoffee);
    return () => window.removeEventListener('workspace:coffee', onCoffee);
  }, []);
  // Collapsed by default; tests (v3:test) start expanded so they can click the buttons.
  const [controlsOpen, setControlsOpen] = useState(() => {
    try { return sessionStorage.getItem('v3:controls') === 'open' || localStorage.getItem('v3:test') === '1'; } catch { return false; }
  });
  const toggleControls = () => setControlsOpen(open => {
    try { sessionStorage.setItem('v3:controls', open ? 'closed' : 'open'); } catch {}
    return !open;
  });
  const [activeId, setActiveId] = useState(null);
  const [screenPhase, setScreenPhase] = useState('room');
  const [osReady, setOsReady] = useState(false);
  const [screenError, setScreenError] = useState(null);
  const [error, setError] = useState(null);

  const lastTrigger = useRef(null);
  const returnOrigin = useRef('room');
  const launchLocked = useRef(false);
  const overviewFocusAction = useRef('desktop-projects');
  const restoreOverviewFocus = useRef(false);
  // Focus is restored in a layout effect rather than a rAF: the harness (and a
  // keyboard user) reads activeElement as soon as the room state flips, and a
  // deferred focus loses that race.
  const pendingFocus = useRef(false);
  const dhruvRef = useRef(null);
  const windowIntent = useRef(false);

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

  const handleSelect = useCallback((id, meta) => {
    if (screenPhase !== 'room') return;
    if (meta?.completed) {
      setActiveId(current => current === id ? null : current);
      return;
    }
    if (id === 'phone' && !seated) {
      returnOrigin.current = 'overview';
      overviewFocusAction.current = 'mobile-projects';
      setOverviewOpen(false); setSeated(true);
    }
    if (id === 'windowOpen') {
      const stage = document.querySelector('.workspace-stage');
      const actionState = stage?.dataset.actionState;
      // Ignore repeat visitor clicks until the sash has finished moving.
      if (actionState && actionState !== 'idle') return;
      windowIntent.current = !windowIntent.current;
      if (windowIntent.current) startCityAmbience(); else stopCityAmbience();
    }
    lastTrigger.current = document.activeElement;
    setActiveId((cur) => (cur === id ? null : id));
  }, [screenPhase, activeId, seated]);

  const beginLaunch = useCallback((origin, trigger) => {
    if (launchLocked.current || screenPhase !== 'room') return false;
    launchLocked.current = true;
    returnOrigin.current = origin;
    lastTrigger.current = trigger || document.activeElement;
    overviewFocusAction.current = trigger?.dataset?.launchpadAction || 'desktop-projects';
    setOverviewOpen(false);
    return true;
  }, [screenPhase]);

  const returnToOverview = useCallback(() => {
    returnOrigin.current = 'room';
    launchLocked.current = false;
    restoreOverviewFocus.current = true;
    setActiveId(null);
    setControlsOpen(false);
    setSeated(false);
    setOverviewOpen(true);
  }, []);

  const handleExploreRoom = useCallback((event) => {
    if (!beginLaunch('overview', event.currentTarget)) return;
    setActiveId(null);
    setSeated(true);
    returnOrigin.current = 'room';
    launchLocked.current = false;
    if (windowIntent.current) startCityAmbience();
  }, [beginLaunch]);

  const handleOpenPhone = useCallback((event) => {
    if (!beginLaunch('overview', event.currentTarget)) return;
    setSeated(true);
    setActiveId('phone');
  }, [beginLaunch]);

  const handleOpenContact = useCallback((event) => {
    if (!beginLaunch('overview', event.currentTarget)) return;
    // Contact is content, not a prerequisite room interaction. Selecting the
    // informational anchor opens its panel directly; the window mechanism is
    // still available separately from the Objects menu.
    setActiveId('window');
    launchLocked.current = false;
  }, [beginLaunch]);

  const handlePhoneExit = useCallback(() => {
    launchLocked.current = false;
    if (returnOrigin.current === 'overview') returnToOverview();
  }, [returnToOverview]);

  useEffect(() => {
    if (!seated || screenPhase !== 'room') {
      stopCityAmbience();
    }
  }, [seated, screenPhase]);

  useEffect(() => {
    return () => disposeCityAmbience();
  }, []);

  // Wearing the headphones loops the song; taking them off stops it. The event
  // fires from a click, so playback has a user gesture.
  useEffect(() => {
    let player = null;
    import('./musicPlayer.js').then((mod) => {
      player = mod.musicPlayer || mod.default;
    });
    const onHeadphones = (event) => {
      const p = player || window.__v3Music;
      if (!p) return;
      if (event.detail?.on) {
        p.play()?.catch(() => {});
      } else {
        p.pause();
      }
    };
    window.addEventListener('workspace:headphones', onHeadphones);
    return () => {
      window.removeEventListener('workspace:headphones', onHeadphones);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (screenPhase !== 'room') return;
    const returnsToOverview = returnOrigin.current === 'overview';
    setActiveId(null);
    setScreenError(null);
    if (returnsToOverview) {
      returnToOverview();
      return;
    }
    // Return focus to whatever opened the panel.
    if (lastTrigger.current?.focus) lastTrigger.current.focus();
  }, [returnToOverview, screenPhase]);

  const handleEnterScreen = useCallback((origin = 'room', trigger = null) => {
    if (screenPhase !== 'room') return;
    // Marker selection already recorded the marker before the cue moved focus
    // into the panel. Preserve it for the cue path; direct canvas hits focus
    // the same marker in WorkspaceStage before calling this handler.
    if (trigger) lastTrigger.current = trigger;
    if (origin !== 'overview' && (activeId !== 'monitor' || !lastTrigger.current?.isConnected)) {
      lastTrigger.current = document.querySelector('[data-object="monitor"]');
    }
    returnOrigin.current = !seated ? 'overview' : origin;
    setOverviewOpen(false);
    setSeated(true);
    setScreenError(null);
    // The stage can invoke this directly from the modeled monitor. Set the
    // anchor in the same transaction so the camera and OS handoff never rely
    // on a previous marker-selection render.
    setActiveId('monitor');
    setScreenPhase(osReady ? (reduced ? 'inside' : 'entering') : 'preparing');
  }, [activeId, osReady, reduced, screenPhase, seated]);

  const handleLaunchDesktop = useCallback((event) => {
    if (!beginLaunch('overview', event.currentTarget)) return;
    handleEnterScreen('overview', event.currentTarget);
  }, [beginLaunch, handleEnterScreen]);

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
        launchLocked.current = false;
        if (returnOrigin.current === 'overview') returnToOverview();
        else pendingFocus.current = true;
      } else if (activeId) handleClose();
      else if (seated && !overviewOpen) returnToOverview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, handleClose, handleLeaveScreen, overviewOpen, returnToOverview, screenPhase, seated]);

  // The destination is prepared before the camera handoff commits. If the
  // child never answers, restore the room instead of leaving an inert overlay.
  useEffect(() => {
    if (screenPhase !== 'preparing') return undefined;
    const timer = window.setTimeout(() => {
      setScreenError('The computer did not respond. The room is still available.');
      setScreenPhase('room');
      setActiveId(null);
      launchLocked.current = false;
      if (returnOrigin.current === 'overview') returnToOverview();
    }, PREPARE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [returnToOverview, screenPhase]);

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
      if (returnOrigin.current === 'overview') {
        returnToOverview();
      } else {
        pendingFocus.current = true;
        launchLocked.current = false;
      }
    }, reduced ? 0 : RETURN_MS);
    return () => window.clearTimeout(timer);
  }, [reduced, returnToOverview, screenPhase]);

  useLayoutEffect(() => {
    if (!overviewOpen || !restoreOverviewFocus.current) return;
    restoreOverviewFocus.current = false;
    const action = overviewFocusAction.current;
    document.querySelector(`[data-launchpad-action="${action}"]`)?.focus();
  }, [overviewOpen]);

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
    launchLocked.current = false;
    if (returnOrigin.current === 'overview') returnToOverview();
  }, [returnToOverview]);

  const handleOSReady = useCallback(() => {
    setOsReady(true);
    setScreenError(null);
  }, []);

  return (
    <div className="scan-root" data-entrance-state={screenPhase} data-seated={seated} data-overview={overviewOpen}>
      <style>{css}</style>

      <WorkspaceStage
        entryVisible={introDone}
        seated={seated}
        liveMonitor={liveMonitor && seated && !activeId}
        onTypeKey={key=>{setLiveMonitor(true);dhruvRef.current?.typeKey(key);}}
        onSit={() => { returnOrigin.current = 'room'; setOverviewOpen(false); setActiveId(null); setSeated(true); if (windowIntent.current) startCityAmbience(); }}
        windowIntent={windowIntent.current}
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
        onPhoneExit={handlePhoneExit}
        reducedMotion={reduced}
        paused={screenPhase === 'preparing' || screenPhase === 'inside'}
        phase={screenPhase}
      />

      {introDone && overviewOpen && screenPhase === 'room' && !error && (
        <section className="launchpad" aria-labelledby="launchpad-name" data-testid="room-overview">
          <p className="launchpad-kicker mono">WELCOME TO THE WORKSPACE</p>
          <h1 id="launchpad-name">{identity.name}</h1>
          <p className="launchpad-role mono">{identity.role} · {identity.location}</p>
          <p className="launchpad-statement">{identity.statement}</p>
          <div className="launchpad-actions">
            <button data-launchpad-action="desktop-projects" onClick={handleLaunchDesktop}>
              <span className="mono">DESKTOP PROJECTS</span><small>Open the computer</small>
            </button>
            <button data-launchpad-action="mobile-projects" onClick={handleOpenPhone}>
              <span className="mono">MOBILE PROJECTS</span><small>Pick up the phone</small>
            </button>
            <button data-launchpad-action="explore-room" onClick={handleExploreRoom}>
              <span className="mono">EXPLORE THE ROOM</span><small>Sit at the desk</small>
            </button>
          </div>
          <nav className="launchpad-links mono" aria-label="Portfolio links">
            <Link to="/work">WORK</Link>
            <button data-launchpad-action="contact" onClick={handleOpenContact}>CONTACT</button>
          </nav>
        </section>
      )}

      {screenPhase === 'room' && seated && !overviewOpen && (
        <div className="seat-exit mono" data-open={controlsOpen}>
          <button className="seat-exit-toggle" aria-expanded={controlsOpen} onClick={toggleControls}>OBJECTS {controlsOpen ? '▾' : '▸'}</button>
          {controlsOpen && <>
            <button onClick={() => handleSelect('notebook')}>NOTEBOOK</button>
            <button onClick={() => handleSelect('phone')}>PHONE</button>
            {['lamp','coffee','award','drawer','pen','blinds','headphones','keyboard'].map(id=><button key={id} onClick={()=>handleSelect(id)}>{id==='drawer'?'RESUME':id==='coffee'&&coffeeEmpty?'REFILL COFFEE':id.toUpperCase()}</button>)}
            <button onClick={() => handleSelect('windowOpen')}>WINDOW</button>
            <button onClick={() => handleSelect('window')}>CONTACT</button>
            <button onClick={() => handleEnterScreen()}>MONITOR</button>
          </>}
          {activeId && <button className="seat-exit-back" onClick={handleClose}>BACK TO SEAT</button>}
          {!activeId && <button className="seat-exit-back" onClick={returnToOverview}>BACK TO OVERVIEW</button>}
          {controlsOpen && <button className="seat-exit-back" onClick={() => { setActiveId(null); setSeated(false); returnToOverview(); }}>STAND UP / ESC</button>}
        </div>
      )}
      {/* ---- masthead ---------------------------------------------------- */}
      <header className="scan-head" aria-hidden={overviewOpen || seated} inert={overviewOpen || seated}>
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
      {showDebug && <Telemetry
        frameMs={stats.frameMs}
        gpuMs={stats.gpuMs}
        anchorId={activeId}
      />}

      <AnchorPanel
        anchor={activeAnchor}
        project={activeProject}
        open={panelOpens && screenPhase === 'room'}
        onClose={handleClose}
      />

      {monitorIsActive && screenPhase === 'room' && (
        <div className="screen-cue-wrap">
          {screenError && <p className="screen-cue-error mono" role="alert">{screenError}</p>}
          <button className="lab-cue mono" data-testid="enter-screen" onClick={() => handleEnterScreen()}>
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
      {introDone && !overviewOpen && !activeId && !error && (
        <p className="scan-hint mono">{seated ? 'DRAG TO LOOK / SELECT AN OBJECT' : 'SIT TO ENTER'}</p>
      )}
    </div>
  );
}

const css = `
.launchpad { position:absolute; inset:0; z-index:var(--z-panel); pointer-events:none; color:var(--bone); animation:launchpad-in .6s var(--ease) both; }
.launchpad > * { position:absolute; left:var(--gutter); }
.launchpad-kicker { top:32px; color:#b7b9b2; font-size:11px; letter-spacing:.18em; }
.launchpad h1 { top:56px; margin:0; font-size:clamp(30px,3.5vw,52px); font-weight:500; line-height:1; letter-spacing:-.04em; text-shadow:0 2px 18px #000; }
.launchpad-role { top:118px; color:#c0c2bd; font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
.launchpad-statement { bottom:164px; width:360px; max-width:calc(100vw - 64px); padding:14px 16px; border-left:1px solid #727872; background:rgba(10,10,11,.82); color:#d3d4cc; font-size:14px; line-height:1.6; }
.launchpad-actions { bottom:52px; right:var(--gutter); display:flex; gap:10px; pointer-events:auto; }
.launchpad-actions button { flex:0 1 230px; min-height:82px; padding:18px 20px; border:1px solid #555b59; color:var(--bone); background:#101415; text-align:left; transition:transform .18s,border-color .18s; }
.launchpad-actions button:first-child { border-top:2px solid var(--signal); }
.launchpad-actions button:hover,.launchpad-actions button:focus-visible { border-color:var(--bone); transform:translateY(-3px); }
.launchpad-actions span { display:block; font-size:12px; letter-spacing:.10em; }
.launchpad-actions small { display:block; margin-top:8px; color:#b2b7b4; font-size:12px; }
.launchpad-links { top:36px; left:auto; right:var(--gutter); display:flex; gap:24px; font-size:12px; letter-spacing:.1em; pointer-events:auto; }
.launchpad-links a,.launchpad-links button { color:var(--bone); min-height:32px; }
@keyframes launchpad-in { from { opacity:0; } }
@media(max-height:650px) { .launchpad-statement { display:none; } .launchpad-actions {bottom:20px;} .launchpad h1 {font-size:30px;} .launchpad-role {top:98px;} }

.seat-exit { display:flex; align-items:center; gap:10px; flex-wrap:wrap; max-width:calc(100% - 280px); position:absolute; bottom:calc(var(--gutter) + 48px); left:var(--gutter); z-index:var(--z-panel); padding:9px 12px; color:var(--bone); background:color-mix(in srgb, var(--void) 92%, transparent); border:1px solid var(--dim); }
.workspace-stage[data-phone-state="zoomed"] ~ .seat-exit,
.workspace-stage[data-phone-state="focuslock"] ~ .seat-exit {
  max-width: 260px;
  padding: 8px 12px;
  gap: 8px;
}
.workspace-stage[data-phone-state="zoomed"] ~ .seat-exit button:not(.seat-exit-back),
.workspace-stage[data-phone-state="focuslock"] ~ .seat-exit button:not(.seat-exit-back),
.workspace-stage[data-action-state$="-reading"] ~ .seat-exit button:not(.seat-exit-back),
.workspace-stage[data-action-state="drawing"] ~ .seat-exit button:not(.seat-exit-back) {
  display: none;
}
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
.scan-head { transition: opacity .3s var(--ease); }
.scan-root[data-overview="true"] .scan-head { opacity: 0; visibility: hidden; }
.scan-root[data-seated="true"] .scan-head { opacity: 0; }
.scan-root[data-seated="true"] .scan-head > * { pointer-events: none; }
.seat-exit-toggle { color: var(--signal); }
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
  .launchpad { animation: none; }
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
  .launchpad { inset:0; width:100%; }
  .launchpad-role {max-width:240px;line-height:1.6;}
  .launchpad-statement {display:none;}
  .launchpad-actions { flex-direction:column; bottom:20px; }
  .launchpad-actions button { flex:0 0 auto;min-height:64px; }
}
`;
