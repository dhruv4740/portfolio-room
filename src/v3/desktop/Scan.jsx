// ============================================================================
// Scan — the desktop surface.
//
// A modeled workspace floating in void, annotated with instrument chrome.
// Composes WorkspaceStage (3D) with the presentational UI kit.
// ============================================================================

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import WorkspaceStage from './WorkspaceStage.jsx';
import Telemetry from '../ui/Telemetry.jsx';
import AnchorPanel from '../ui/AnchorPanel.jsx';
import DhruvOSScreen from './DhruvOSScreen.jsx';
import { istParts } from '../lib/mumbai.js';
import { setCityRain, startCityAmbience, stopCityAmbience, disposeCityAmbience, setCityAmbienceMuted, suspendCityAmbience } from './cityAudio.js';
import { disposeRoomAudio, isRoomMuted, playRoomFoley, setRoomMuted, unlockRoomAudio } from './roomAudio.js';
import { subscribeProgress } from '../lib/loadProgress.js';
import { dismissFrontDoor } from '../lib/frontDoor.js';
import { anchors, projects, identity, contact, education, experience, achievements } from '../content/index.js';
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
const ARRIVAL_SEEN_KEY = 'v3:arrival-seen';

// The cold open plays once per visitor (localStorage). The session key is
// still honoured because the harnesses set it to skip the shot.
function hasSeenArrival() {
  try { return sessionStorage.getItem(ARRIVAL_SEEN_KEY) === '1' || localStorage.getItem(ARRIVAL_SEEN_KEY) === '1'; } catch { return false; }
}

function markArrivalSeen() {
  try { sessionStorage.setItem(ARRIVAL_SEEN_KEY, '1'); localStorage.setItem(ARRIVAL_SEEN_KEY, '1'); } catch { /* private mode */ }
}

// The guided tour. `scene` is where the step puts the visitor; `hold` is how
// long it stays once it is there.
const TOUR = [
  { caption: 'This is my desk in Mumbai. Everything in the room works.', hold: 5000, scene: 'room' },
  { caption: 'The computer runs my real web projects. This is CrisisWatch, a fact-checker.', hold: 9500, scene: 'os', app: 'crisiswatch' },
  { caption: 'Fraud detection: an XGBoost model scoring transactions.', hold: 9000, scene: 'os', app: 'fraud' },
  { caption: 'Back to the desk.', hold: 3000, scene: 'room' },
  { caption: 'The phone runs my Android apps. FocusLock puts friction in front of distracting apps.', hold: 10000, scene: 'phone', app: 'focuslock' },
  { caption: 'Expense Tracker: shared costs and Uber splits.', hold: 8500, scene: 'phone', app: 'expense' },
  { caption: 'That was the one-minute version.', hold: 3000, scene: 'room' },
];
const tourInRoom = () => document.querySelector('.scan-root')?.dataset.entranceState === 'room';
const tourPhoneUp = () => { const s = document.querySelector('.workspace-stage')?.dataset.phoneState; return !!s && s !== 'desk'; };

function LiveTelemetry({ sink, anchorId }) {
  const [stats, setStats] = useState({});
  useEffect(() => { sink.current = setStats; return () => { sink.current = null; }; }, [sink]);
  return <Telemetry frameMs={stats.frameMs} gpuMs={stats.gpuMs} anchorId={anchorId} />;
}

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
  const [arrivalToken, setArrivalToken] = useState(0);
  const nextArrivalToken = useRef(1);
  const arrivalTokenRef = useRef(0);
  // Frame stats arrive every 300 ms while the loop runs. Only the debug HUD
  // reads them, so they go straight to it instead of re-rendering this tree.
  const statsSink = useRef(null);
  const handleStats = useCallback((stats) => statsSink.current?.(stats), []);
  const [liveMonitor,setLiveMonitor]=useState(false);
  const [seated, setSeated] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [coffeeEmpty, setCoffeeEmpty] = useState(false);
  const [roomMuted, setRoomMutedState] = useState(() => isRoomMuted());
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
  useEffect(() => { if (error) dismissFrontDoor(); }, [error]);
  const [aboutOpen, setAboutOpen] = useState(false);
  // "Mumbai · 01:40 · 27°C · light rain", refreshed every minute.
  const [weather, setWeather] = useState(null);
  const [clock, setClock] = useState(() => istParts().label);
  useEffect(() => {
    const onWeather = (event) => { setWeather(event.detail); setCityRain(event.detail.raining); };
    window.addEventListener('workspace:weather', onWeather);
    const timer = setInterval(() => setClock(istParts().label), 30000);
    return () => { window.removeEventListener('workspace:weather', onWeather); clearInterval(timer); };
  }, []);
  // Only the room's own GLB/texture loads; the boot screen covered the rest.
  const [load, setLoad] = useState({ progress: 0, pending: 0 });
  useEffect(() => subscribeProgress(s => {
    const f = s.tasks.room;
    setLoad({ progress: f ?? 0, pending: f !== undefined && f < 1 ? 1 : 0 });
  }), []);
  const navigate = useNavigate();

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

  // arrivalTokenRef is the authoritative live token, written synchronously at
  // every mutation site. It used to be assigned during render from
  // `arrivalToken`, which left a window between a user action and React's
  // re-render in which the ref still held the old token: a natural completion
  // landing in that window passed the guard below and re-settled the camera on
  // top of whatever the user had just chosen, and a second Escape pressed
  // inside it was swallowed by the still-active arrival branch.
  const setArrival = useCallback((token) => {
    arrivalTokenRef.current = token;
    setArrivalToken(token);
  }, []);

  const cancelArrival = useCallback(() => {
    if (arrivalTokenRef.current !== 0) setArrival(0);
  }, [setArrival]);

  const replayArrival = useCallback(() => {
    if (screenPhase !== 'room' || !seated || activeId) return;
    setActiveId(null);
    setControlsOpen(false);
    setSeated(false);
    setOverviewOpen(true);
    returnOrigin.current = 'room';
    launchLocked.current = false;
    setArrival(nextArrivalToken.current++);
  }, [activeId, screenPhase, seated, setArrival]);

  const handleArrivalComplete = useCallback((token) => {
    if (token !== arrivalTokenRef.current) return;
    setActiveId(null);
    setControlsOpen(false);
    setSeated(false);
    setOverviewOpen(true);
    returnOrigin.current = 'room';
    launchLocked.current = false;
    setArrival(0);
  }, [setArrival]);

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

  // Room-dependent launchpad actions clicked before the room is revealed wait for it
  // (a dead click would look broken) and show a short "preparing" line meanwhile.
  const [roomRevealed, setRoomRevealed] = useState(false);
  const [queuedAction, setQueuedAction] = useState(null);
  const queued = useRef(null);
  useEffect(() => {
    const open = () => {
      setRoomRevealed(true);
      const q = queued.current; queued.current = null; setQueuedAction(null);
      if (q) q.handler({ currentTarget: q.button, preventDefault() {} });
    };
    if (document.querySelector('.workspace-stage')?.dataset.roomRevealed === '1') open();
    window.addEventListener('workspace:revealed', open);
    return () => window.removeEventListener('workspace:revealed', open);
  }, []);
  const gate = (handler) => (event) => {
    if (roomRevealed) return handler(event);
    queued.current = { handler, button: event.currentTarget };
    setQueuedAction(event.currentTarget?.dataset?.launchpadAction || 'pending');
  };

  const handleWorkspaceReady = useCallback(() => {
    // Keep the old persistent intro flag for existing harnesses and returning
    // visitors, while the cold open itself is once per visitor.
    if (!hasSeenIntro()) markIntroSeen();
    setIntroDone(true);
    if (!reduced && !hasSeenArrival()) {
      markArrivalSeen();
      setArrival(nextArrivalToken.current++);
    }
  }, [reduced, setArrival]);

  // Sit first, then pick the phone up. Starting the pick-up during the seat's
  // camera flight made its lean snap the camera straight into the chair.
  const phoneAfterSit = useRef(0);
  const pickUpAfterSit = useCallback(() => {
    clearTimeout(phoneAfterSit.current);
    phoneAfterSit.current = setTimeout(() => setActiveId('phone'), reduced ? 0 : 1250);
  }, [reduced]);
  useEffect(() => () => clearTimeout(phoneAfterSit.current), []);

  const handleSelect = useCallback((id, meta) => {
    if (screenPhase !== 'room') return;
    if (meta?.completed) {
      setActiveId(current => current === id ? null : current);
      return;
    }
    if (id === 'phone' && !seated) {
      cancelArrival();
      returnOrigin.current = 'overview';
      overviewFocusAction.current = 'mobile-projects';
      setOverviewOpen(false); setSeated(true);
      pickUpAfterSit();
      return;
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
  }, [cancelArrival, screenPhase, activeId, seated, pickUpAfterSit]);

  const beginLaunch = useCallback((origin, trigger) => {
    if (launchLocked.current || screenPhase !== 'room') return false;
    cancelArrival();
    launchLocked.current = true;
    returnOrigin.current = origin;
    lastTrigger.current = trigger || document.activeElement;
    overviewFocusAction.current = trigger?.dataset?.launchpadAction || 'desktop-projects';
    setOverviewOpen(false);
    return true;
  }, [cancelArrival, screenPhase]);

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
    pickUpAfterSit();
  }, [beginLaunch, pickUpAfterSit]);

  const handleOpenContact = useCallback((event) => {
    if (!beginLaunch('overview', event.currentTarget)) return;
    // Contact is content, not a prerequisite room interaction. Selecting the
    // informational anchor opens its panel directly; the window mechanism is
    // still available separately from the Objects menu.
    setActiveId('window');
    launchLocked.current = false;
  }, [beginLaunch]);

  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    setTimeout(() => document.querySelector('[data-launchpad-action="about"]')?.focus(), 0);
  }, []);

  // The launchpad's WORK link is the single recruiter entry while it is open.
  useEffect(() => {
    const on = introDone && overviewOpen && screenPhase === 'room';
    document.body.toggleAttribute('data-launchpad-open', on);
    return () => document.body.removeAttribute('data-launchpad-open');
  }, [introDone, overviewOpen, screenPhase]);

  // Keys 1–5 mirror the launchpad buttons while it is on screen.
  useEffect(() => {
    if (!introDone || !overviewOpen || screenPhase !== 'room' || aboutOpen) return undefined;
    const order = ['desktop-projects', 'explore-room', 'mobile-projects', 'tour'];
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.target?.closest?.('input, textarea, [contenteditable="true"]')) return;
      const i = '1234'.indexOf(e.key);
      if (i < 0) return;
      const button = document.querySelector(`[data-launchpad-action="${order[i]}"]`);
      if (!button) return;
      e.preventDefault();
      button.focus();
      button.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aboutOpen, introDone, overviewOpen, screenPhase]);

  useEffect(() => {
    if (!aboutOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      closeAbout();
    };
    window.addEventListener('keydown', onKey, true);
    setTimeout(() => document.querySelector('.about-close')?.focus(), 0);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [aboutOpen, closeAbout]);

  // Deep links: /os/<app>, /phone[/<app>], /about, /contact, /room/<object>.
  // Each is consumed once the room is ready, then the URL returns to /.
  const location = useLocation();
  const consumedLink = useRef(null);
  useEffect(() => {
    const [kind, arg] = location.pathname.split('/').filter(Boolean);
    if (!kind || !introDone || screenPhase !== 'room') return undefined;
    // Development StrictMode runs this effect twice on mount; a second
    // handleSelect toggled the object straight back off.
    if (consumedLink.current === location.key) return undefined;
    consumedLink.current = location.key;
    // Only clear the URL if it is still this link. After a long main-thread
    // stall this effect can run after a newer navigation (the tour's next
    // step), and replacing that one dropped it: the tour skipped the OS.
    if (window.location.hash.replace(/^#/, '').split('?')[0] === location.pathname) navigate('/', { replace: true });
    const fake = (action) => ({ currentTarget: document.querySelector(`[data-launchpad-action="${action}"]`) });
    if (kind === 'about') { setAboutOpen(true); return undefined; }
    if (kind === 'contact') { handleOpenContact(fake('contact')); return undefined; }
    if (kind === 'os') {
      if (arg) dhruvRef.current?.openApp(arg);
      if (overviewOpen) handleLaunchDesktop(fake('desktop-projects')); else handleEnterScreen();
      return undefined;
    }
    if (kind === 'phone') {
      if (overviewOpen) handleOpenPhone(fake('mobile-projects')); else handleSelect('phone');
      if (!arg) return undefined;
      const timer = setInterval(() => {
        if (document.querySelector('.workspace-stage')?.dataset.phoneState !== 'zoomed' || !document.querySelector('.phone-screen')) return;
        clearInterval(timer);
        window.dispatchEvent(new CustomEvent('phone:open-app', { detail: { app: arg } }));
      }, 150);
      // Not tied to the effect cleanup: resetting the URL re-runs this effect.
      setTimeout(() => clearInterval(timer), 15000);
      return undefined;
    }
    if (kind === 'room') {
      if (overviewOpen) handleExploreRoom(fake('explore-room'));
      // Select once the seat has reached the stage and a frame has drawn, then
      // 400 ms more: a select that lands first is undone by the seat's own
      // camera move. A fixed timer started before the first-load stall fired
      // right after it, so /room/drawer opened cold never opened the drawer.
      if (arg && arg !== 'explore') {
        const select = () => tourApi.current.handleSelect(arg === 'window' ? 'windowOpen' : arg);
        const whenSeated = () => document.querySelector('.scan-root')?.dataset.seated === 'true'
          ? requestAnimationFrame(() => setTimeout(select, 400)) : requestAnimationFrame(whenSeated);
        whenSeated();
      }
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, introDone]);

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

  // Unlock room foley from a real gesture. Arrival itself never creates or
  // starts audio, and every event is short enough to clean up without a loop.
  useEffect(() => {
    const onPointerDown = () => unlockRoomAudio();
    const onKeyDown = () => unlockRoomAudio();
    const onFoley = (event) => playRoomFoley(event.detail);
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('workspace:foley', onFoley);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('workspace:foley', onFoley);
      disposeRoomAudio();
    };
  }, []);

  // Hidden tabs stop ambience and suspend its oscillators; returning restores
  // it only when the sash is still open and the room is still the live view.
  // Own effect so it reads current `seated`/`screenPhase` rather than the
  // values captured when the gesture listeners above were bound.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopCityAmbience();
        suspendCityAmbience();
        return;
      }
      // startCityAmbience resumes the context itself. If the sash is shut the
      // context stays suspended, which is the point of suspending it.
      if (windowIntent.current && seated && screenPhase === 'room') startCityAmbience();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [seated, screenPhase]);

  useEffect(() => {
    setCityAmbienceMuted(roomMuted);
  }, [roomMuted]);

  const toggleRoomMute = useCallback(() => {
    const next = setRoomMuted(!roomMuted);
    setRoomMutedState(next);
    setCityAmbienceMuted(next);
    if (!next) {
      unlockRoomAudio();
      if (windowIntent.current && seated && screenPhase === 'room') startCityAmbience();
    }
  }, [roomMuted, screenPhase, seated]);

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
    cancelArrival();
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
  }, [activeId, cancelArrival, osReady, reduced, screenPhase, seated]);

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

  // The OS projects app can send a visitor to an Android demo: leave the
  // computer, then follow the /phone/<app> deep link once back in the room
  // (deep links are only consumed there).
  const pendingPhone = useRef(null);
  useEffect(() => {
    const onOpenPhone = (event) => {
      const app = event.detail?.app;
      if (!['focuslock', 'expense', 'basketproof'].includes(app)) return;
      pendingPhone.current = app;
      handleLeaveScreen();
    };
    window.addEventListener('os:open-phone', onOpenPhone);
    return () => window.removeEventListener('os:open-phone', onOpenPhone);
  }, [handleLeaveScreen]);
  useEffect(() => {
    if (screenPhase !== 'room' || !pendingPhone.current) return;
    const app = pendingPhone.current;
    pendingPhone.current = null;
    navigate(`/phone/${app}`);
  }, [screenPhase, navigate]);

  // Guided tour: steps over the same deep-link routes a visitor could use,
  // with captions and Previous / Pause / Next / Exit. Each step first brings
  // the scene to its place (leaving the OS or putting the phone down as
  // needed), and its hold only starts once that has happened, so a load stall
  // can't eat a step. Real input pauses the tour rather than ending it, and a
  // hidden page pauses it too; modifier keys (Alt-Tab) are ignored.
  const [tour, setTour] = useState(null); // null | { step, paused, done }
  const tourApi = useRef({});
  tourApi.current = { navigate, handleLeaveScreen, handleSelect, screenPhase, activeId, seated };
  // id bumps on every step change or stop, so a stale step's waits give up.
  const tourRun = useRef({ id: 0, step: 0, timer: 0, holdStart: 0, remaining: 0, paused: false, autoPaused: false });
  const goTourRef = useRef(null);
  const stopTour = useCallback(() => {
    const r = tourRun.current;
    clearTimeout(r.timer); r.id++; r.paused = false; r.autoPaused = false;
    setTour(null);
  }, []);
  const holdTour = useCallback((ms) => {
    const r = tourRun.current;
    clearTimeout(r.timer); r.timer = 0;
    r.remaining = ms; r.holdStart = performance.now();
    if (r.paused) return;
    const id = r.id;
    r.timer = setTimeout(() => { if (tourRun.current.id === id) goTourRef.current(tourRun.current.step + 1); }, ms);
  }, []);
  goTourRef.current = async (step) => {
    const r = tourRun.current;
    clearTimeout(r.timer); r.timer = 0;
    const id = ++r.id;
    if (step >= TOUR.length) { setTour({ step: TOUR.length, done: true }); return; }
    r.step = Math.max(0, step);
    const s = TOUR[r.step], api = () => tourApi.current;
    const alive = () => tourRun.current.id === id;
    const until = (test, timeout = 30000) => new Promise((resolve) => {
      const t0 = performance.now();
      const poll = () => {
        if (!alive()) return resolve(false);
        if (test() || performance.now() - t0 > timeout) return resolve(true);
        setTimeout(poll, 100);
      };
      poll();
    });
    setTour({ step: r.step, paused: r.paused, done: false });
    try {
      // Undo whatever the previous step (or the visitor) left open.
      if (s.scene !== 'os' && api().screenPhase !== 'room') { api().handleLeaveScreen(); if (!await until(tourInRoom)) return; }
      if (s.scene !== 'phone' && api().activeId === 'phone') { api().handleSelect('phone'); if (!await until(() => !tourPhoneUp())) return; }
      if (s.scene === 'room') {
        if (!api().seated) { api().navigate('/room/explore'); if (!await until(() => document.querySelector('.scan-root')?.dataset.seated === 'true')) return; }
      } else if (s.scene === 'os') {
        if (api().screenPhase === 'inside' && dhruvRef.current) dhruvRef.current.openApp(s.app);
        else api().navigate(`/os/${s.app}`);
        if (!await until(() => document.querySelector('.scan-root')?.dataset.entranceState === 'inside')) return;
      } else if (s.scene === 'phone') {
        if (api().activeId === 'phone' && document.querySelector('.phone-screen')) window.dispatchEvent(new CustomEvent('phone:open-app', { detail: { app: s.app } }));
        else api().navigate(`/phone/${s.app}`);
        if (!await until(() => document.querySelector('.phone-screen')?.dataset.app === s.app)) return;
      }
    } catch { /* a step failing must not strand the tour */ }
    if (alive()) holdTour(s.hold);
  };
  const startTour = useCallback(() => {
    const r = tourRun.current;
    r.paused = false; r.autoPaused = false;
    goTourRef.current(0);
  }, []);
  const pauseTour = useCallback((auto = false) => {
    const r = tourRun.current;
    if (r.paused) return;
    r.paused = true; r.autoPaused = auto === true;
    if (r.timer) { clearTimeout(r.timer); r.timer = 0; r.remaining = Math.max(0, r.remaining - (performance.now() - r.holdStart)); }
    setTour((t) => (t && !t.done ? { ...t, paused: true } : t));
  }, []);
  const resumeTour = useCallback(() => {
    const r = tourRun.current;
    if (!r.paused) return;
    r.paused = false; r.autoPaused = false;
    // Put the scene back where this step had it (the visitor may have moved
    // on while paused), then finish what was left of its hold.
    const { step, remaining } = r;
    goTourRef.current(step).then(() => {
      const now = tourRun.current;
      if (now.step === step && !now.paused && now.timer) holdTour(Math.max(1500, remaining));
    });
  }, [holdTour]);
  useEffect(() => () => clearTimeout(tourRun.current.timer), []);
  useEffect(() => {
    if (!tour || tour.done) return undefined;
    const interrupt = (e) => {
      if (!e.isTrusted || e.target?.closest?.('.tour-ui')) return;
      pauseTour();
    };
    // Relayed from inside the OS, so not trusted here; the OS only sends it for real input.
    const onOSInput = () => pauseTour();
    const onKey = (e) => {
      if (!e.isTrusted || e.target?.closest?.('.tour-ui')) return;
      if (e.altKey || e.ctrlKey || e.metaKey || ['Alt', 'AltGraph', 'Control', 'Shift', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTourRef.current(tourRun.current.step + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTourRef.current(tourRun.current.step - 1); return; }
      if (e.key === ' ') { e.preventDefault(); if (tourRun.current.paused) resumeTour(); else pauseTour(); return; }
      if (e.key === 'Escape') { stopTour(); return; }
      pauseTour();
    };
    // A click into the OS only reaches this window as focus moving into the
    // iframe. Switching to another window also blurs, but then the document
    // has no focus at all; that isn't the visitor taking over.
    const onBlur = () => setTimeout(() => { if (document.hasFocus() && document.activeElement?.tagName === 'IFRAME') pauseTour(); }, 0);
    const onVisibility = () => {
      if (document.hidden) pauseTour(true);
      else if (tourRun.current.autoPaused) resumeTour();
    };
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', interrupt, true);
      window.addEventListener('wheel', interrupt, true);
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('os:user-input', onOSInput);
      window.addEventListener('blur', onBlur);
    }, 300);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', interrupt, true);
      window.removeEventListener('wheel', interrupt, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('os:user-input', onOSInput);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tour, stopTour, pauseTour, resumeTour]);

  // Escape backs out one level: the embedded OS, then the selected anchor.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // Leaving the monitor or standing up also stops the song; it is otherwise hard to find the off switch.
      if (screenPhase === 'inside' || screenPhase === 'entering' || (seated && !overviewOpen && !activeId)) window.__v3Music?.pause();
      if (arrivalTokenRef.current !== 0) {
        e.preventDefault();
        cancelArrival();
      } else if (screenPhase === 'inside' || screenPhase === 'entering') {
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
  }, [activeId, cancelArrival, handleClose, handleLeaveScreen, overviewOpen, returnToOverview, screenPhase, seated]);

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
        onSit={() => { cancelArrival(); returnOrigin.current = 'room'; setOverviewOpen(false); setActiveId(null); setSeated(true); if (windowIntent.current) startCityAmbience(); }}
        windowIntent={windowIntent.current}
        anchors={anchors}
        activeAnchorId={activeId}
        onAnchorSelect={handleSelect}
        onEnterScreen={handleEnterScreen}
        onReady={handleWorkspaceReady}
        arrivalToken={arrivalToken}
        onArrivalComplete={handleArrivalComplete}
        onStats={handleStats}
        onError={setError}
        onScreenRect={handleScreenRect}
        onTravel={handleTravel}
        onPhoneExit={handlePhoneExit}
        reducedMotion={reduced}
        paused={screenPhase === 'preparing' || screenPhase === 'inside'}
        phase={screenPhase}
      />

      {load.pending > 0 && (
        <div className="room-load mono" role="progressbar" aria-label="Loading room detail" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(load.progress * 100)}>
          <i style={{ transform: `scaleX(${load.progress})` }} />
          <span>LOADING ROOM DETAIL · {Math.round(load.progress * 100)}%</span>
        </div>
      )}

      {introDone && screenPhase === 'room' && (
        <p className="mumbai-readout mono" data-testid="mumbai-readout">
          MUMBAI · {clock}{weather?.temperature != null ? ` · ${weather.temperature}°C` : ''}{weather ? ` · ${weather.label}` : ''}
        </p>
      )}

      {introDone && overviewOpen && screenPhase === 'room' && !error && (
        <section className="launchpad" aria-labelledby="launchpad-name" data-testid="room-overview">
          <p className="launchpad-kicker mono">WELCOME TO THE WORKSPACE</p>
          <h1 id="launchpad-name">{identity.name}</h1>
          <p className="launchpad-role mono">{identity.role} · {identity.location}</p>
          <p className="launchpad-statement">{identity.statement}</p>
          <div className="launchpad-actions">
            <Link className="launchpad-primary" to="/work" onClick={cancelArrival}>
              <span className="mono">RÉSUMÉ &amp; WORK →</span><small>One page: projects, experience, résumé PDF · 30 s</small>
            </Link>
            <button className="launchpad-secondary" data-launchpad-action="desktop-projects" onClick={gate(handleLaunchDesktop)}>
              <span className="mono">TRY MY LIVE APPS</span><small>Run the real web apps on the computer · ~3 min</small>
            </button>
          </div>
          <p className="launchpad-more mono">
            <span>or</span>
            <button data-launchpad-action="explore-room" onClick={gate(handleExploreRoom)}>explore the room</button>
            <button data-launchpad-action="mobile-projects" onClick={gate(handleOpenPhone)}>phone apps</button>
            <button data-launchpad-action="tour" onClick={gate(startTour)}>guided tour</button>
          </p>
          {queuedAction && <p className="launchpad-pending mono" role="status">PREPARING THE ROOM… YOUR CHOICE STARTS AUTOMATICALLY</p>}
        </section>
      )}

      {tour && !tour.done && (
        <div className="tour-ui tour-caption" role="status" aria-live="polite" data-testid="tour-caption" data-paused={tour.paused ? 'true' : 'false'} data-step={tour.step}>
          {/* Paused, the caption shrinks so it doesn't cover what the visitor stopped to use. */}
          {tour.paused ? <p className="tour-paused mono">PAUSED · LOOK AROUND, THEN RESUME</p> : <p>{TOUR[tour.step].caption}</p>}
          <div className="tour-controls">
            <span className="mono tour-count">{tour.step + 1} / {TOUR.length}</span>
            <button className="mono" onClick={() => goTourRef.current(tour.step - 1)} disabled={tour.step === 0} aria-label="Previous step">◀ PREV</button>
            <button className="mono tour-play" data-testid="tour-pause" onClick={() => (tour.paused ? resumeTour() : pauseTour())}>{tour.paused ? '▶ RESUME' : '❚❚ PAUSE'}</button>
            <button className="mono" onClick={() => goTourRef.current(tour.step + 1)} aria-label="Next step">NEXT ▶</button>
            <button className="mono tour-exit" onClick={stopTour} aria-label="Exit tour">✕</button>
          </div>
        </div>
      )}
      {tour?.done && (
        <div className="tour-ui tour-end" role="dialog" aria-label="Tour finished" data-testid="tour-end">
          <p className="mono">THAT WAS THE TOUR</p>
          <div>
            <button className="mono" onClick={() => { stopTour(); navigate(contact.resume ? '/' : '/room/drawer'); if (contact.resume) window.open(contact.resume, '_blank', 'noopener'); }}>RÉSUMÉ</button>
            <button className="mono" onClick={() => { stopTour(); navigate('/contact'); }}>CONTACT</button>
            <button className="mono" onClick={() => { stopTour(); navigate('/work'); }}>RECRUITER VERSION</button>
          </div>
          <button className="mono tour-close" onClick={stopTour} aria-label="Close">✕</button>
        </div>
      )}

      {aboutOpen && (
        <div className="about-scrim" onClick={(e) => { if (e.target === e.currentTarget) closeAbout(); }}>
          <section className="about-panel" role="dialog" aria-modal="true" aria-labelledby="about-name" data-testid="about-panel">
            <button className="about-close mono" onClick={closeAbout} aria-label="Close about">ESC ✕</button>
            <p className="mono about-kicker">ABOUT</p>
            <h2 id="about-name">{identity.name}</h2>
            <p className="mono about-role">{identity.role} · {identity.location}</p>
            <p>{identity.statement}</p>
            <p className="about-muted">{education.degree}, {education.school} · {education.year}</p>
            <h3 className="mono">EXPERIENCE</h3>
            <ul>
              {experience.map((x) => (
                <li key={x.id}><strong>{x.role}</strong> · {x.org} <span className="about-muted mono">{x.from} – {x.to}</span><br /><span className="about-muted">{x.detail}</span></li>
              ))}
            </ul>
            <h3 className="mono">ACHIEVEMENTS</h3>
            <ul>
              {achievements.map((a) => (
                <li key={a.id}><strong>{a.result}</strong> · {a.label}</li>
              ))}
            </ul>
            <p className="mono about-links">
              <a href={`mailto:${contact.email}`}>EMAIL</a>
              <a href={contact.github} target="_blank" rel="noreferrer">GITHUB</a>
              <a href={contact.linkedin} target="_blank" rel="noreferrer">LINKEDIN</a>
              {contact.resume && <a href={contact.resume} download>RÉSUMÉ</a>}
            </p>
          </section>
        </div>
      )}

      {screenPhase === 'room' && seated && !overviewOpen && (
        <div className="seat-exit mono" data-open={controlsOpen}>
          <button className="seat-exit-toggle" aria-expanded={controlsOpen} onClick={toggleControls}>OBJECTS {controlsOpen ? '▾' : '▸'}</button>
          {controlsOpen && <>
            <button type="button" aria-pressed={!roomMuted} onClick={toggleRoomMute}>ROOM SOUND {roomMuted ? 'OFF' : 'ON'}</button>
            {arrivalToken === 0 && !activeId && <button data-testid="replay-arrival" onClick={replayArrival}>REPLAY ARRIVAL</button>}
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
          <Link to="/work" onClick={cancelArrival}>WORK</Link>
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
      {showDebug && <LiveTelemetry sink={statsSink} anchorId={activeId} />}

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

      {arrivalToken !== 0 && (
        <div className="arrival-cue" role="status">
          <span className="arrival-cue-label mono">ARRIVAL</span>
          <button type="button" className="arrival-skip mono" data-testid="arrival-skip" onClick={cancelArrival}>SKIP</button>
        </div>
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
.arrival-cue { position:absolute; top:78px; right:var(--gutter); z-index:var(--z-panel); display:flex; align-items:center; gap:.75rem; padding:7px 9px; border:1px solid color-mix(in srgb, var(--dim) 70%, transparent); background:color-mix(in srgb, var(--void) 82%, transparent); color:var(--dim); pointer-events:auto; }
.arrival-cue-label { font-size:10px; letter-spacing:.16em; }
.arrival-skip { min-height:28px; padding:4px 7px; border:1px solid var(--faint); color:var(--bone); font-size:10px; letter-spacing:.12em; }
.arrival-skip:hover,.arrival-skip:focus-visible { border-color:var(--signal); color:var(--signal); }
.launchpad > * { position:absolute; left:var(--gutter); }
.launchpad-kicker { top:32px; color:#b7b9b2; font-size:11px; letter-spacing:.18em; }
.launchpad h1 { top:56px; margin:0; font-size:clamp(30px,3.5vw,52px); font-weight:500; line-height:1; letter-spacing:-.04em; text-shadow:0 2px 18px #000; }
.launchpad-role { top:118px; color:#c0c2bd; font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
.launchpad-statement { top:146px; width:420px; max-width:calc(100vw - 64px); margin:0; color:#d3d4cc; font-size:14px; line-height:1.55; text-shadow:0 1px 12px #000; }
.launchpad-actions { top:222px; width:372px; max-width:calc(100vw - 2*var(--gutter)); display:flex; flex-direction:column; gap:8px; pointer-events:auto; }
.launchpad-actions button { position:relative; min-height:64px; padding:13px 18px 13px 58px; border:1px solid #555b59; color:var(--bone); background:rgba(16,20,21,.92); text-align:left; transition:transform .18s,border-color .18s; }
.launchpad-actions button:first-child { border-left:2px solid var(--signal); }
.launchpad-actions button:hover,.launchpad-actions button:focus-visible { border-color:var(--bone); transform:translateX(4px); }
.launchpad-actions kbd { position:absolute; left:16px; top:50%; transform:translateY(-50%); width:26px; height:26px; display:grid; place-items:center; border:1px solid #6b716e; color:#d3d4cc; font-size:12px; }
.launchpad-actions span { display:block; font-size:14px; letter-spacing:.10em; }
.launchpad-actions small { display:block; margin-top:5px; color:#b2b7b4; font-size:12.5px; }
.room-load { position:fixed; left:0; right:0; top:0; z-index:calc(var(--z-panel) + 1); height:2px; background:#1d2122; pointer-events:none; }
.room-load i { position:absolute; inset:0; background:var(--signal); transform-origin:left; transition:transform .25s; }
.room-load span { position:absolute; top:8px; left:50%; transform:translateX(-50%); color:#9ea39f; font-size:10px; letter-spacing:.16em; }
.mumbai-readout { position:fixed; right:var(--gutter); bottom:14px; z-index:var(--z-panel); margin:0; padding:5px 9px; background:rgba(10,12,13,.72); color:#b2b7b4; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; pointer-events:none; text-shadow:0 1px 8px #000; }
.tour-caption { position:fixed; left:50%; bottom:64px; transform:translateX(-50%); z-index:calc(var(--z-panel) + 4); width:min(640px, calc(100vw - 32px)); padding:14px 18px; border:1px solid #555b59; border-left:2px solid var(--signal); background:rgba(13,16,17,.92); color:var(--bone); display:flex; gap:16px; align-items:center; justify-content:space-between; }
.tour-caption p { margin:0; font-size:15px; line-height:1.45; }
.tour-caption { flex-direction:column; align-items:stretch; }
.tour-caption .tour-paused { font-size:10.5px; letter-spacing:.14em; color:var(--signal); }
.tour-controls { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.tour-controls .tour-count { color:#9ea39f; font-size:10.5px; letter-spacing:.12em; margin-right:auto; }
.tour-controls button { padding:0 10px; border:1px solid #3d4341; }
.tour-controls button:hover:not(:disabled), .tour-controls button:focus-visible { border-color:#9ea39f; color:var(--bone); }
.tour-controls button:disabled { opacity:.35; cursor:default; }
/* The phone stage (fixed, z-index 100) covered the caption on the tour's phone steps.
   Above it, and in the free column right of the phone where there is room. */
.scan-root:has(.phone-presentation--stage) .tour-caption { z-index:101; }
@media (min-width:1100px) { .scan-root:has(.phone-presentation--stage) .tour-caption { left:auto; right:max(24px, calc(50% - 543px)); top:50%; bottom:auto; transform:translateY(-50%); width:300px; flex-direction:column; align-items:flex-start; } }
.tour-caption button { flex:none; color:#9ea39f; font-size:10.5px; letter-spacing:.12em; min-height:32px; }
.tour-end { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:calc(var(--z-panel) + 4); padding:26px 30px; border:1px solid #555b59; border-top:2px solid var(--signal); background:#0d1011; color:var(--bone); text-align:center; }
.tour-end p { margin:0 0 16px; color:#b7b9b2; font-size:11px; letter-spacing:.18em; }
.tour-end div { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.tour-end div button { padding:12px 16px; border:1px solid #555b59; color:var(--bone); font-size:12px; letter-spacing:.1em; }
.tour-end div button:hover,.tour-end div button:focus-visible { border-color:var(--signal); }
.tour-close { position:absolute; top:6px; right:10px; color:#9ea39f; min-height:28px; }
.about-scrim { position:fixed; inset:0; z-index:calc(var(--z-panel) + 5); background:rgba(0,0,0,.55); display:grid; place-items:center; padding:24px; }
.about-panel { position:relative; width:min(620px,100%); max-height:calc(100vh - 48px); overflow:auto; padding:28px 30px; border:1px solid #555b59; border-left:2px solid var(--signal); background:#0d1011; color:#d3d4cc; font-size:14px; line-height:1.6; }
.about-panel h2 { margin:4px 0 2px; color:var(--bone); font-size:30px; font-weight:500; letter-spacing:-.03em; }
.about-panel h3 { margin:22px 0 8px; color:#b7b9b2; font-size:11px; font-weight:400; letter-spacing:.18em; }
.about-panel ul { margin:0; padding:0; list-style:none; display:grid; gap:10px; }
.about-panel strong { color:var(--bone); font-weight:500; }
.about-kicker,.about-role { margin:0; color:#b7b9b2; font-size:11px; letter-spacing:.14em; text-transform:uppercase; }
.about-muted { color:#9ea39f; }
.about-close { position:absolute; top:14px; right:14px; color:#b7b9b2; font-size:11px; letter-spacing:.1em; min-height:32px; }
.about-links { display:flex; gap:20px; margin-top:22px; font-size:12px; letter-spacing:.1em; }
.about-links a { color:var(--bone); }
.launchpad-pending { top:auto; bottom:28px; margin:0; color:#d3d4cc; font-size:11px; letter-spacing:.14em; text-shadow:0 1px 10px #000; }
.launchpad-links { top:36px; left:auto; right:var(--gutter); display:flex; gap:24px; font-size:12px; letter-spacing:.1em; pointer-events:auto; }
.launchpad-links a,.launchpad-links button { color:var(--bone); min-height:32px; }
@keyframes launchpad-in { from { opacity:0; } }
@media(max-height:650px) { .launchpad-statement { display:none; } .launchpad-actions {top:136px;} .launchpad-actions button {min-height:52px;padding-top:8px;padding-bottom:8px;} .launchpad h1 {font-size:30px;} .launchpad-role {top:98px;} }
body[data-launchpad-open] .escape-link { display:none; }
.launchpad-actions { width:min(420px,calc(100vw - 2*var(--gutter))); }
.launchpad-actions a, .launchpad-actions button { position:relative; display:block; min-height:64px; padding:14px 20px; text-align:left; text-decoration:none; transition:transform .18s,border-color .18s,background .18s; }
.launchpad-actions .launchpad-primary { background:var(--signal); color:#0A0A0B; border:1px solid var(--signal); }
.launchpad-actions .launchpad-primary span { color:#0A0A0B; font-size:15px; font-weight:600; letter-spacing:.08em; }
.launchpad-actions .launchpad-primary small { color:#2b1a12; }
.launchpad-actions .launchpad-primary:hover,.launchpad-actions .launchpad-primary:focus-visible { background:var(--bone); border-color:var(--bone); transform:translateX(4px); }
.launchpad-actions .launchpad-secondary { padding-left:20px; }
.launchpad-more { top:400px; display:flex; flex-wrap:wrap; gap:6px 16px; align-items:center; pointer-events:auto; font-size:12px; letter-spacing:.1em; color:#b7b9b2; text-shadow:0 1px 10px #000; }
.launchpad-more button { color:var(--bone); border-bottom:1px solid #6b716e; min-height:32px; }
.launchpad-more button:hover,.launchpad-more button:focus-visible { color:var(--signal); border-color:var(--signal); }
@media(max-height:650px) { .launchpad-more {top:284px;} }
@media(max-height:450px) { .launchpad-kicker {display:none;} .launchpad h1 {top:20px;font-size:26px;} .launchpad-role {top:54px;} .launchpad-actions {top:84px;} .launchpad-more {top:226px;} .launchpad-actions a,.launchpad-actions button {min-height:52px;padding:8px 16px;} }
@media(pointer:coarse) and (max-height:450px) { .escape-link { display:none !important; } }
@media(max-width:640px) { .arrival-cue { top:68px; right:12px; } }

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
/* The room is an interface, not a document: Ctrl+A must not paint everything blue. */
.scan-root, .scan-root * { -webkit-user-select: none; user-select: none; }
.scan-root input, .scan-root textarea { -webkit-user-select: text; user-select: text; }

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
  .launchpad-actions { top:auto; bottom:16px; gap:6px; }
  .launchpad-actions button { min-height:52px; padding:8px 12px 8px 50px; } .launchpad-actions small { font-size:11.5px; }
}
`;
