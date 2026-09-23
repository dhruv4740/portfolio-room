// ============================================================================
// PhoneScreen — the held phone's live screen.
//
// Rides the phone display's projected quad (the same projective map the
// monitor uses), so the camera zooms into a real, clickable surface rather
// than a texture.
//
// Features:
// 1. Home screen with Instagram (.ps-app) and FocusLock (.ps-app-focuslock).
// 2. Faithful browser reconstruction of the FocusLock Android app, based on
//    the original source layouts, strings, and colors:
//    - Visual style from res/values/colors.xml (#0A0E17, #111827, #1E293B, #6366F1).
//    - Layout & strings from activity_main.xml & strings.xml.
//    - 5 full screens: Dashboard, Apps & Limits, Modes & Surfaces, Stats & History, Settings.
//    - Interactive toggles, duration adjustments, and task checklists.
//    - State persisted to localStorage['v3:focuslock'].
// 3. Instagram integration:
//    - If Instagram is blocked in FocusLock, tapping Instagram shows the Lock Overlay
//      (matching overlay_lock.xml with math friction challenge).
//    - If Instagram is unblocked in FocusLock, tapping Instagram shows the mock feed.
// ============================================================================

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { INSTAGRAM_ICON_UV_RECT } from './buildWorkspace.js';
import ExpenseApp from './phone-apps/ExpenseApp.jsx';
import BasketProofApp from './phone-apps/BasketProofApp.jsx';

import { PHONE_SCREEN, PHONE_STAGE } from './phoneScreenSize.js';
export { PHONE_SCREEN, PHONE_STAGE };

const STORAGE_KEY = 'v3:focuslock';
const TARGET = 'com.instagram.android';
const BLOCK_SECONDS = 300;
const GRANTED = 'Extension granted for 5 minutes. Stay intentional.';
// Walkthrough beside the phone in the stage view: what each app is and what
// to try. Facts only from docs/PROJECT-MATERIAL.md.
const WALKTHROUGH = {
  home: {
    title: 'Android apps, running in the browser',
    body: 'Each one is rebuilt from its own source and runs here on sample data. Instagram is here as the app FocusLock guards.',
    steps: ['Open FocusLock to see its rules.', 'Then open Instagram and meet them.', 'Expense Tracker and BasketProof open full screen.'],
  },
  focuslock: {
    title: 'FocusLock',
    body: 'A screen-time enforcer: this Android app and a Windows agent share one daily limit, kept in sync through Firestore.',
    steps: ['Settings → Friction & blockers picks the steps that stand in front of Instagram.', 'Apps sets the daily limit and the blocked apps.', 'Go home and open Instagram to try them.'],
  },
  friction: {
    title: 'FocusLock friction',
    body: 'Before Instagram opens, FocusLock walks you through every step turned on in its settings.',
    steps: ['Finish the steps to reach Instagram, or give up and go home.'],
  },
  locked: {
    title: 'FocusLock hard block',
    body: 'With hard block after the limit, or a focus session running, Instagram stays locked.',
    steps: ['Solve the problem to ask for an extension.'],
  },
  expense: {
    title: 'Expense Tracker',
    body: 'Reads bank SMS and UPI notifications and parses them on the phone into a local SQLite database. No backend, no accounts.',
    steps: ['The bottom bar has the feed, Uber splits and stats.'],
  },
  basketproof: {
    title: 'BasketProof',
    body: 'A private grocery comparison across Blinkit, Zepto and Swiggy Instamart, built for my family. It shows UNKNOWN rather than a total it can’t verify.',
    steps: ['Build a list, then compare the platforms.'],
  },
};

const QUOTES = [
  'Focus on being productive instead of busy.',
  'Your focus determines your reality.',
  'Disconnect to reconnect with what matters.',
  "Opportunities don't happen. You create them.",
  'Do not let social media control your attention.',
  'Stay intentional, stay present.',
];

const REFLECTION_PHRASES = [
  'I am choosing to use this app mindfully',
  'This will not distract me from my priorities',
  'I will close this app after what I need to do',
  'My time and attention are valuable',
];

const INTENTION_PRESETS = [
  'Just checking notifications (quick)',
  'Need to post/message someone specific',
  'Boredom / Dopamine craving',
];

function getTimeScale() {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('v3:test') === '1') {
      const scale = window.__phoneTimeScale;
      if (typeof scale === 'number' && scale > 0) return scale;
    }
  } catch (_) {}
  return 1;
}

function mathQuestion() {
  const a = 10 + Math.floor(Math.random() * 35), b = 10 + Math.floor(Math.random() * 35);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

function generateFrictionMath(difficulty = 'easy') {
  if (difficulty === 'hard') {
    const a = 3 + Math.floor(Math.random() * 13);
    const b = 3 + Math.floor(Math.random() * 13);
    const c = 1 + Math.floor(Math.random() * 50);
    return { text: `${a} × ${b} + ${c} = ?`, answer: a * b + c };
  }
  if (difficulty === 'medium') {
    const a = 2 + Math.floor(Math.random() * 11);
    const b = 2 + Math.floor(Math.random() * 11);
    return { text: `${a} × ${b} = ?`, answer: a * b };
  }
  const a = 1 + Math.floor(Math.random() * 20);
  const b = 1 + Math.floor(Math.random() * 20);
  return { text: `${a} + ${b} = ?`, answer: a + b };
}

const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function getDefaultFocusLockState() {
  return {
    activeTab: 'dashboard',
    protectionActive: true,
    focusDuration: 25,
    focusActive: false,
    focusEndsAt: null,
    dailyLimitMinutes: 0,
    extensionMinutes: 15,
    dailyExtensionLimit: 1,
    hardBlockAfterLimit: false,
    targetApps: {
      'com.instagram.android': true,
      'com.google.android.youtube': true,
      'com.twitter.android': false,
      'com.zhiliaoapp.musically': true,
    },
    blockWindows: [
      { id: 'bw-1', start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
    ],
    reelsMode: 'block', // 'off' | 'block' | 'one_at_a_time'
    shortsMode: 'block',
    reelsLimit: 0,
    shortsLimit: 0,
    strictMode: true,
    emergencyCooldown: 15,
    friction: {
      breathing: true,
      delay: true,
      intention: true,
      shake: true,
      reflection: true,
      stats: true,
      math: true,
      deviceAdmin: true,
      mathDifficulty: 'easy',
    },
    todos: [],
    syncCode: 'user_default',
  };
}

function loadSavedState() {
  const defaults = getDefaultFocusLockState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        targetApps: { ...defaults.targetApps, ...(parsed.targetApps || {}) },
        friction: { ...defaults.friction, ...(parsed.friction || {}) },
      };
    }
  } catch (_) {}
  return defaults;
}

const PhoneScreen = forwardRef(function PhoneScreen({
  interactive = false,
  onOpenApp,
  onHome,
  onExit,
  mode = 'projected',
}, ref) {
  const rootRef = useRef(null);
  const modeRef = useRef(mode);
  const projectedRectRef = useRef(null);
  modeRef.current = mode;
  const stageMode = mode === 'stage';
  const [app, setApp] = useState('home'); // 'home' | 'focuslock' | 'locked' | 'friction'
  const [flState, setFlState] = useState(loadSavedState);
  const [flTab, setFlTab] = useState('dashboard');
  const [savedBanner, setSavedBanner] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [newAppPkg, setNewAppPkg] = useState('');

  // Instagram Lock Screen State
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

  // Friction Sequence State
  const [frictionSteps, setFrictionSteps] = useState(['decision']);
  const [frictionStepIndex, setFrictionStepIndex] = useState(0);
  const [breathingSec, setBreathingSec] = useState(12);
  const [delayRemaining, setDelayRemaining] = useState(10);
  const [delayProgress, setDelayProgress] = useState(0);
  const [intentionSelected, setIntentionSelected] = useState('');
  const [intentionInput, setIntentionInput] = useState('');
  const [shakeProgress, setShakeProgress] = useState(0);
  const [shakePulsing, setShakePulsing] = useState(false);
  const [reflectionPhrase, setReflectionPhrase] = useState(REFLECTION_PHRASES[0]);
  const [reflectionInput, setReflectionInput] = useState('');
  const [frictionMath, setFrictionMath] = useState(null);
  const [frictionMathAnswer, setFrictionMathAnswer] = useState('');
  const [decisionGranted, setDecisionGranted] = useState(false);

  const frictionTimers = useRef([]);
  const frictionStepsRef = useRef(frictionSteps);
  frictionStepsRef.current = frictionSteps;
  const lastShakeX = useRef(null);
  const lastDirection = useRef(0);
  const shakeReversals = useRef([]);
  const shakeIdleTimerRef = useRef(null);
  const shakeProgressRef = useRef(0);

  function clearShakeIdleTimer() {
    if (shakeIdleTimerRef.current) {
      clearTimeout(shakeIdleTimerRef.current);
      shakeIdleTimerRef.current = null;
    }
  }

  function resetShakeIdleTimer() {
    clearShakeIdleTimer();
    if (shakeProgressRef.current === 0) {
      const scale = getTimeScale();
      const idleMs = 2000 / scale;
      shakeIdleTimerRef.current = setTimeout(() => {
        if (shakeProgressRef.current === 0) {
          setShakePulsing(true);
        }
      }, idleMs);
    }
  }

  function clearFrictionTimers() {
    clearShakeIdleTimer();
    setShakePulsing(false);
    frictionTimers.current.forEach((id) => {
      clearTimeout(id);
      clearInterval(id);
    });
    frictionTimers.current = [];
  }

  function advanceFrictionStep() {
    clearFrictionTimers();
    setFrictionStepIndex((prev) => {
      if (prev + 1 < frictionStepsRef.current.length) {
        return prev + 1;
      }
      return prev;
    });
  }

  const currentStep = frictionSteps[frictionStepIndex] || 'decision';

  function handleShakeMove(e) {
    if (app !== 'friction' || currentStep !== 'shake') return;
    if (shakePulsing) {
      setShakePulsing(false);
    }
    resetShakeIdleTimer();
    const currentX = e.clientX;
    if (lastShakeX.current === null) {
      lastShakeX.current = currentX;
      return;
    }
    const dx = currentX - lastShakeX.current;
    if (Math.abs(dx) > 8) {
      const dir = dx > 0 ? 1 : -1;
      if (lastDirection.current !== 0 && dir !== lastDirection.current) {
        const timestamp = Date.now();
        shakeReversals.current.push(timestamp);
        shakeReversals.current = shakeReversals.current.filter((t) => timestamp - t <= 2000);
        const count = shakeReversals.current.length;
        const progress = Math.min(100, Math.round((count / 6) * 100));
        shakeProgressRef.current = progress;
        setShakeProgress(progress);
        if (progress > 0) {
          clearShakeIdleTimer();
        }
        if (count >= 6) {
          advanceFrictionStep();
        }
      }
      lastDirection.current = dir;
      lastShakeX.current = currentX;
    }
  }

  function handleOpenAnyway() {
    setDecisionGranted(true);
    const scale = getTimeScale();
    const timer = setTimeout(() => {
      setOpens((n) => n + 1);
      goHome();
    }, 2000 / scale);
    frictionTimers.current.push(timer);
  }

  // Sync state changes to localStorage
  function updateFlState(updater) {
    setFlState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }

  function goHome(notify = true) {
    clearFrictionTimers();
    setApp('home');
    setMath(null);
    setAnswer('');
    setStatus('');
    setToast('');
    setTime(clock());
    setDecisionGranted(false);
    if (notify) onHome?.();
  }

  function handleStageEscape(event) {
    if (event.key !== 'Escape' || !stageMode || !interactive) return;

    // App dialogs own Escape before the phone navigation does. The two
    // Android reconstructions mark their dialogs explicitly so this remains
    // true even when focus is inside a form control.
    const dialog = [...(rootRef.current?.querySelectorAll('[role="dialog"]') || [])]
      .find((candidate) => {
        if (candidate.closest('[inert]') || candidate.closest('[aria-hidden="true"]')) return false;
        const style = window.getComputedStyle(candidate);
        return style.visibility !== 'hidden' && style.display !== 'none';
      });
    if (dialog) {
      const close = dialog.querySelector('[data-phone-dialog-close], button[title="Close"], button');
      if (close) {
        event.preventDefault();
        event.stopPropagation();
        close.click();
        return;
      }
    }

    event.preventDefault();
    event.stopPropagation();
    if (app !== 'home') goHome();
    else onExit?.();
  }

  function handleStageKeydown(event) {
    if (event.key === 'Escape') {
      handleStageEscape(event);
      return;
    }
    if (event.key !== 'Tab' || !stageMode || !interactive) return;

    const presentation = rootRef.current?.closest('.phone-presentation');
    if (!presentation) return;
    const focusable = [...presentation.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )].filter((node) => {
      if (node.closest('[inert]') || node.closest('[aria-hidden="true"]')) return false;
      const style = window.getComputedStyle(node);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    if (!focusable.length) return;

    const current = document.activeElement;
    const index = focusable.indexOf(current);
    const next = event.shiftKey
      ? focusable[index <= 0 ? focusable.length - 1 : index - 1]
      : focusable[index === focusable.length - 1 || index < 0 ? 0 : index + 1];
    event.preventDefault();
    event.stopPropagation();
    next?.focus({ preventScroll: true });
  }

  useImperativeHandle(ref, () => ({
    setRect(matrix) {
      const el = rootRef.current;
      if (!el) return;
      // The stage is a normal portrait layout. WorkspaceStage may continue to
      // send projected matrices while it is mounted; they must never distort
      // the readable stage viewport.
      if (modeRef.current === 'stage') {
        el.style.visibility = 'visible';
        el.style.transform = '';
        return;
      }
      if (matrix) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          projectedRectRef.current = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }
      }
      el.style.visibility = matrix ? 'visible' : 'hidden';
      el.style.transform = matrix ? `matrix3d(${matrix.join(',')})` : '';
    },
    reset() { goHome(false); },
  }), []);

  // Clear any projected transform immediately when a persistent PhoneScreen
  // switches into stage mode. The component and every app below it stay
  // mounted, so navigation and form state survive the presentation handoff.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (stageMode) {
      el.style.visibility = 'visible';
      const presentation = el.closest('.phone-presentation');
      const from = projectedRectRef.current;
      const to = el.getBoundingClientRect();
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const duration = reduced ? 0 : 250;
      let cleanupTimer = null;

      presentation?.classList.add('phone-stage-entering');
      el.style.transformOrigin = '0 0';
      if (from && to.width > 0 && to.height > 0 && duration > 0) {
        const sx = from.width / to.width;
        const sy = from.height / to.height;
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        el.classList.add('phone-stage-flip');
        el.style.setProperty('transform', `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`, 'important');
        requestAnimationFrame(() => {
          el.style.setProperty('transform', 'none', 'important');
        });
        cleanupTimer = window.setTimeout(() => {
          el.classList.remove('phone-stage-flip');
          el.style.removeProperty('transform');
          el.style.removeProperty('transform-origin');
        }, duration + 40);
      } else {
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
      }

      const focusTarget = presentation?.querySelector('[data-phone-stage-control="exit"]')
        || presentation?.querySelector('[data-phone-stage-control="home"]');
      focusTarget?.focus({ preventScroll: true });
      const fadeTimer = window.setTimeout(() => presentation?.classList.remove('phone-stage-entering'), duration);
      return () => {
        if (cleanupTimer) window.clearTimeout(cleanupTimer);
        window.clearTimeout(fadeTimer);
        presentation?.classList.remove('phone-stage-entering');
        el.classList.remove('phone-stage-flip');
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
      };
    } else {
      el.style.visibility = 'hidden';
      el.style.transform = '';
    }
  }, [stageMode]);

  useEffect(() => {
    if (!stageMode || !interactive) return undefined;
    window.addEventListener('keydown', handleStageKeydown, true);
    return () => window.removeEventListener('keydown', handleStageKeydown, true);
  }, [stageMode, interactive, app]);

  // Hidden projected screens should not keep friction timers alive. State is
  // intentionally retained; when the screen becomes interactive again the
  // current step resumes from its existing state.
  useEffect(() => {
    if (!interactive) clearFrictionTimers();
  }, [interactive]);

  function handleOpenInstagram() {
    const isHardBlocked = flState.hardBlockAfterLimit || flState.focusActive;
    if (isHardBlocked) {
      setOpens((n) => n + 1);
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      setStatsReady(false);
      setBlockStart(Date.now());
      setNow(Date.now());
      setMath(null);
      setStatus('');
      setApp('locked');
      onOpenApp?.();
    } else {
      const steps = [];
      if (flState.friction.breathing) steps.push('breathing');
      if (flState.friction.delay) steps.push('delay');
      if (flState.friction.intention) steps.push('intention');
      if (flState.friction.shake) steps.push('shake');
      if (flState.friction.reflection) steps.push('reflection');
      if (flState.friction.stats) steps.push('stats');
      if (flState.friction.math) steps.push('math');
      steps.push('decision');

      setFrictionSteps(steps);
      setFrictionStepIndex(0);
      setDecisionGranted(false);
      setApp('friction');
      onOpenApp?.();
    }
  }

  // The full-screen apps are DOM panels outside the phone's projected quad;
  // putting the phone down must close them or they stay over the room.
  useEffect(() => {
    if (!interactive) setApp(current => (current === 'expense' || current === 'basketproof' ? 'home' : current));
  }, [interactive]);

  // Deep links (/#/phone/<app>) arrive once the phone is in hand.
  useEffect(() => {
    const onOpen = (event) => {
      const open = { focuslock: handleOpenFocusLock, expense: handleOpenExpense, basketproof: handleOpenBasket }[event.detail?.app];
      open?.();
    };
    window.addEventListener('phone:open-app', onOpen);
    return () => window.removeEventListener('phone:open-app', onOpen);
  });

  function handleOpenFocusLock() {
    setApp('focuslock');
    onOpenApp?.();
  }

  function handleOpenExpense() {
    setApp('expense');
    onOpenApp?.();
  }

  function handleOpenBasket() {
    setApp('basketproof');
    onOpenApp?.();
  }

  function submitMath(event) {
    event.preventDefault();
    const value = answer.trim();
    if (/^\d+$/.test(value) && Number(value) === math.answer) {
      setMath(null);
      setAnswer('');
      setStatus('Checking extension availability...');
    } else {
      setToast('Incorrect! Try again.');
      setAnswer('');
      setMath(mathQuestion());
    }
  }

  useEffect(() => {
    if (app !== 'friction' || !interactive) return undefined;
    clearFrictionTimers();
    const step = frictionSteps[frictionStepIndex] || 'decision';
    const scale = getTimeScale();

    if (step === 'breathing') {
      setBreathingSec(12);
      const interval = setInterval(() => {
        setBreathingSec((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            advanceFrictionStep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000 / scale);
      frictionTimers.current.push(interval);
    } else if (step === 'delay') {
      setDelayRemaining(10);
      setDelayProgress(0);
      const totalMs = 10000 / scale;
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(100, Math.round((elapsed / totalMs) * 100));
        const remainingSec = Math.max(0, Math.ceil((totalMs - elapsed) / (1000 / scale)));
        setDelayProgress(progress);
        setDelayRemaining(remainingSec);
        if (elapsed >= totalMs) {
          clearInterval(interval);
          advanceFrictionStep();
        }
      }, 50);
      frictionTimers.current.push(interval);
    } else if (step === 'intention') {
      setIntentionSelected('');
      setIntentionInput('');
    } else if (step === 'shake') {
      shakeProgressRef.current = 0;
      setShakeProgress(0);
      setShakePulsing(false);
      shakeReversals.current = [];
      lastShakeX.current = null;
      lastDirection.current = 0;
      resetShakeIdleTimer();
    } else if (step === 'reflection') {
      setReflectionPhrase(REFLECTION_PHRASES[Math.floor(Math.random() * REFLECTION_PHRASES.length)]);
      setReflectionInput('');
    } else if (step === 'math') {
      setFrictionMath(generateFrictionMath(flState.friction.mathDifficulty));
      setFrictionMathAnswer('');
    } else if (step === 'decision') {
      setDecisionGranted(false);
    }

    return () => clearFrictionTimers();
  }, [app, frictionStepIndex, frictionSteps, flState.friction.mathDifficulty, interactive]);

  useEffect(() => {
    if (!interactive) return undefined;
    const frame = requestAnimationFrame(() => {
      const root = rootRef.current;
      const target = stageMode
        ? root?.closest('.phone-presentation')?.querySelector('[data-phone-stage-control="exit"]')
        : app === 'home'
        ? root?.querySelector('.ps-app')
        : root?.querySelector(math ? 'input' : '.ps-btn, .fl-back, .fl-nav-item');
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [interactive, app, math, stageMode]);

  useEffect(() => {
    if (app !== 'locked' || !interactive) return undefined;
    const load = setTimeout(() => setStatsReady(true), 450);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(load); clearInterval(tick); };
  }, [app, blockStart, interactive]);

  useEffect(() => {
    if (!interactive || app !== 'home') return undefined;
    const tick = setInterval(() => setTime(clock()), 15000);
    return () => clearInterval(tick);
  }, [interactive, app]);

  useEffect(() => {
    if (!status || !interactive) return undefined;
    const timer = status === GRANTED
      ? setTimeout(() => goHome(), 1800)
      : setTimeout(() => setStatus(GRANTED), 700);
    return () => clearTimeout(timer);
  }, [status, interactive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast || !interactive) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast, interactive]);

  function triggerSavedBanner(msg = '✓ Policy saved') {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 2000);
  }

  const remaining = Math.max(0, BLOCK_SECONDS - Math.floor((now - blockStart) / 1000));
  const countdown = remaining > 0
    ? `Blocked for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
    : 'Block expired. Tap the button below to close.';

  // UV coordinates from workspace:
  const r = INSTAGRAM_ICON_UV_RECT;
  const igIcon = {
    left: 80,
    top: 470,
    size: 130,
  };
  const flIcon = {
    left: 330,
    top: 470,
    size: 130,
  };
  const expenseIcon = {
    left: 80,
    top: 650,
    size: 130,
  };
  const basketIcon = {
    left: 330,
    top: 650,
    size: 130,
  };

  return (
    <div
      className={`phone-presentation phone-presentation--${mode}`}
      data-phone-mode={mode}
      role={stageMode ? 'dialog' : undefined}
      aria-modal={stageMode ? true : undefined}
      aria-label={stageMode ? 'Interactive mobile project stage' : undefined}
    >
      {stageMode && <div className="phone-stage-backdrop" aria-hidden="true" />}
      <div
        ref={rootRef}
        className={`phone-screen phone-screen--${mode}`}
        role="region"
        aria-label="Phone screen"
        data-app={app}
        data-fl-tab={flTab}
        data-friction-step={app === 'friction' ? currentStep : undefined}
        inert={!interactive}
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        onPointerMove={handleShakeMove}
        onKeyDown={handleStageKeydown}
      >
      <style>{css}</style>

      {/* ==================================================================== */}
      {/* 1. HOME SCREEN                                                       */}
      {/* ==================================================================== */}
      {app === 'home' && (
        <div className="ps-home">
          <div className="ps-statusbar">
            <span className="ps-clock">{time}</span>
            <div className="ps-status-icons">
              <span className="ps-stat-icon">5G</span>
              <span className="ps-stat-icon">100%</span>
            </div>
          </div>

          <div className="ps-apps-grid">
            {/* Instagram Icon (Tested by verify-held-objects.mjs) */}
            <button
              type="button"
              className="ps-app"
              aria-label="Open Instagram"
              onClick={handleOpenInstagram}
              style={{ left: igIcon.left, top: igIcon.top, width: igIcon.size }}
            >
              <span className="ps-tile" style={{ width: igIcon.size, height: igIcon.size }}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <rect x="21" y="21" width="58" height="58" rx="20" />
                  <circle cx="50" cy="50" r="17" />
                  <circle className="ps-dot" cx="72" cy="28" r="4.65" />
                </svg>
              </span>
              <span className="ps-label">Instagram</span>
            </button>

            {/* FocusLock Native App Icon */}
            <button
              type="button"
              className="ps-app-focuslock"
              aria-label="Open FocusLock"
              onClick={handleOpenFocusLock}
              style={{ left: flIcon.left, top: flIcon.top, width: flIcon.size }}
            >
              <span className="ps-tile-fl" style={{ width: flIcon.size, height: flIcon.size }}>
                <svg viewBox="0 0 100 100" aria-hidden="true" className="fl-shield-icon">
                  <path d="M50 14 L80 26 C80 62 50 84 50 86 C50 84 20 62 20 26 Z" fill="#1E293B" stroke="#6366F1" strokeWidth="6" strokeLinejoin="round" />
                  <circle cx="50" cy="46" r="8" fill="none" stroke="#A78BFA" strokeWidth="5" />
                  <rect x="44" y="52" width="12" height="15" rx="3" fill="#6366F1" />
                </svg>
              </span>
              <span className="ps-label">FocusLock</span>
            </button>

            {/* Expense Tracker App Icon */}
            <button
              type="button"
              className="ps-app-expense"
              aria-label="Open Expense Tracker"
              onClick={handleOpenExpense}
              style={{ left: expenseIcon.left, top: expenseIcon.top, width: expenseIcon.size }}
            >
              <span className="ps-tile-expense" style={{ width: expenseIcon.size, height: expenseIcon.size }}>
                <svg viewBox="0 0 100 100" aria-hidden="true" className="expense-icon">
                  <rect x="18" y="18" width="64" height="64" rx="18" fill="#0E0E0E" stroke="#3DDC84" strokeWidth="5" />
                  <path d="M28 62 L42 46 L58 54 L72 36" fill="none" stroke="#3DDC84" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="72" cy="36" r="4.5" fill="#3DDC84" />
                </svg>
              </span>
              <span className="ps-label">Expense</span>
            </button>

            {/* BasketProof App Icon */}
            <button
              type="button"
              className="ps-app-basket"
              aria-label="Open BasketProof"
              onClick={handleOpenBasket}
              style={{ left: basketIcon.left, top: basketIcon.top, width: basketIcon.size }}
            >
              <span className="ps-tile-basket" style={{ width: basketIcon.size, height: basketIcon.size }}>
                <svg viewBox="0 0 100 100" aria-hidden="true" className="basket-icon">
                  <rect x="18" y="18" width="64" height="64" rx="18" fill="#1C1D22" stroke="#7C4DFF" strokeWidth="5" />
                  <path d="M26 46 L74 46 L67 76 L33 76 Z" fill="none" stroke="#A78BFA" strokeWidth="5" strokeLinejoin="round" />
                  <path d="M36 46 C36 32 64 32 64 46" fill="none" stroke="#7C4DFF" strokeWidth="5" />
                </svg>
              </span>
              <span className="ps-label">BasketProof</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. INSTAGRAM LOCK SCREEN (When blocked)                              */}
      {/* ==================================================================== */}
      {app === 'locked' && (
        <div className="ps-lock">
          <span className="ps-pill">Locked</span>
          <h2 className="ps-title">FocusLock paused {TARGET}</h2>
          <div className="ps-card">
            <span className="ps-caption">TODAY&apos;S USAGE</span>
            <span className="ps-stats">{statsReady ? `${opens} opens • 0 min spent today` : "Loading today's stats..."}</span>
          </div>
          <div className="ps-card ps-quote-card"><p className="ps-quote">&quot;{quote}&quot;</p></div>
          {math && (
            <form className="ps-card ps-math" onSubmit={submitMath}>
              <span className="ps-math-label">Solve to verify intention:</span>
              <span className="ps-math-q">{math.text}</span>
              <div className="ps-math-row">
                <input
                  inputMode="numeric"
                  aria-label="Answer"
                  placeholder="Answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />
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

      {/* ==================================================================== */}
      {/* 3. REAL FOCUSLOCK NATIVE APP                                         */}
      {/* ==================================================================== */}
      {app === 'focuslock' && (
        <div className="fl-root">
          {/* Header App Bar */}
          <div className="fl-appbar">
            <button type="button" className="fl-back" onClick={() => goHome()} aria-label="Back to phone home">
              ◀ Home
            </button>
            <div className="fl-header-info">
              <h1 className="fl-app-title">FocusLock</h1>
              <span className="fl-app-version">Stay Mindful • Break Habit Loops</span>
              <span className="fl-app-demo">BROWSER DEMO · ANDROID UI</span>
            </div>
          </div>

          {/* Toast / Save confirmation */}
          {savedBanner && (
            <div className="fl-banner" role="alert">
              {savedBanner}
            </div>
          )}

          {/* Scrollable Screen Content */}
          <div className="fl-content">
            {/* TAB 1: DASHBOARD */}
            {flTab === 'dashboard' && (
              <div className="fl-screen" data-screen="dashboard">
                {/* Protection Status Card */}
                <div className="fl-card">
                  <div className="fl-card-header">
                    <span className="fl-card-title">PROTECTION &amp; PERMISSIONS</span>
                    <button
                      type="button"
                      className={`fl-switch ${flState.protectionActive ? 'is-on' : ''}`}
                      onClick={() => updateFlState({ protectionActive: !flState.protectionActive })}
                      aria-label="Toggle Protection"
                    >
                      <span className="fl-switch-thumb" />
                    </button>
                  </div>
                  <p className="fl-status-text">
                    {flState.protectionActive
                      ? '🛡️ FocusLock Active protection enabled.'
                      : '⚠️ Protection degraded. Grant missing permissions.'}
                  </p>
                  <div className="fl-badge-grid">
                    <span className="fl-badge">Usage access: ✅ ACTIVE</span>
                    <span className="fl-badge">Accessibility: ✅ ACTIVE</span>
                    <span className="fl-badge">Overlay draw: ✅ ACTIVE</span>
                    <span className="fl-badge">Notifications: ✅ ACTIVE</span>
                  </div>
                </div>

                {/* Focus Session Control Card */}
                <div className="fl-card">
                  <span className="fl-card-title">FOCUS SESSION CONTROL</span>
                  <p className="fl-session-status">
                    {flState.focusActive
                      ? `Focus session active until ${flState.focusEndsAt || '15:45'}`
                      : 'Focus session inactive'}
                  </p>
                  <div className="fl-duration-row">
                    <label htmlFor="fl-focus-duration" className="fl-duration-label">Duration (min):</label>
                    <input
                      id="fl-focus-duration"
                      type="number"
                      className="fl-input-number fl-duration-input"
                      value={flState.focusDuration}
                      onChange={(e) => updateFlState({ focusDuration: Math.max(1, Number(e.target.value) || 25) })}
                      aria-label="Focus duration in minutes"
                    />
                  </div>
                  <button
                    type="button"
                    className={`fl-btn ${flState.focusActive ? 'fl-btn-danger' : 'fl-btn-primary'}`}
                    onClick={() => {
                      const active = !flState.focusActive;
                      const endsAt = active ? new Date(Date.now() + flState.focusDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                      updateFlState({ focusActive: active, focusEndsAt: endsAt });
                    }}
                  >
                    {flState.focusActive ? 'Stop' : 'Start Focus'}
                  </button>

                  {/* Task Checklist inside Focus Session */}
                  <div className="fl-todo-section">
                    <span className="fl-subhead">PENDING TASK LIST</span>
                    <div className="fl-todo-input-row">
                      <input
                        type="text"
                        className="fl-input"
                        placeholder="Add task to complete..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        aria-label="New task description"
                      />
                      <button
                        type="button"
                        className="fl-btn-small"
                        onClick={() => {
                          if (!newTodoText.trim()) return;
                          updateFlState({
                            todos: [...flState.todos, { id: String(Date.now()), text: newTodoText.trim(), completed: false }],
                          });
                          setNewTodoText('');
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="fl-todo-list">
                      {flState.todos.length === 0 ? (
                        <p className="fl-todo-empty">No pending tasks. You are all set!</p>
                      ) : (
                        flState.todos.map((todo) => (
                          <div key={todo.id} className="fl-todo-row">
                            <label className="fl-checkbox-label">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={(e) => {
                                  const nextTodos = flState.todos.map((t) => (t.id === todo.id ? { ...t, completed: e.target.checked } : t));
                                  updateFlState({ todos: nextTodos });
                                }}
                              />
                              <span className={todo.completed ? 'fl-todo-done' : ''}>{todo.text}</span>
                            </label>
                            <button
                              type="button"
                              className="fl-del-btn"
                              aria-label={`Delete task ${todo.text}`}
                              onClick={() => {
                                updateFlState({ todos: flState.todos.filter((t) => t.id !== todo.id) });
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Today's Usage Stats Card */}
                <div className="fl-card">
                  <span className="fl-card-title">TODAY&apos;S USAGE</span>
                  <div className="fl-usage-metric">
                    <span className="fl-usage-val"><strong className="fl-minutes-val">0</strong> min used</span>
                  </div>
                  <p className="fl-opens-stat">{opens} opens today · 0 Reels · 0 Shorts</p>
                </div>
              </div>
            )}

            {/* TAB 2: BLOCK LIST */}
            {flTab === 'blocklist' && (
              <div className="fl-screen" data-screen="blocklist">
                {/* Daily Limits Config */}
                <div className="fl-card">
                  <span className="fl-card-title">BLOCKING RULES</span>
                  <div className="fl-field-row">
                    <label htmlFor="fl-daily-limit">Daily limit (minutes)</label>
                    <input
                      id="fl-daily-limit"
                      type="number"
                      className="fl-input-number"
                      value={flState.dailyLimitMinutes}
                      onChange={(e) => updateFlState({ dailyLimitMinutes: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="fl-field-row">
                    <label htmlFor="fl-ext-mins">Mins per extension</label>
                    <input
                      id="fl-ext-mins"
                      type="number"
                      className="fl-input-number"
                      value={flState.extensionMinutes}
                      onChange={(e) => updateFlState({ extensionMinutes: Number(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="fl-field-row">
                    <label htmlFor="fl-ext-limit">Max extensions per day</label>
                    <input
                      id="fl-ext-limit"
                      type="number"
                      className="fl-input-number"
                      value={flState.dailyExtensionLimit}
                      onChange={(e) => updateFlState({ dailyExtensionLimit: Number(e.target.value) || 2 })}
                    />
                  </div>
                  <div className="fl-toggle-row">
                    <span>Hard block after limit</span>
                    <button
                      type="button"
                      className={`fl-switch ${flState.hardBlockAfterLimit ? 'is-on' : ''}`}
                      onClick={() => updateFlState({ hardBlockAfterLimit: !flState.hardBlockAfterLimit })}
                      aria-label="Toggle Hard block after limit"
                    >
                      <span className="fl-switch-thumb" />
                    </button>
                  </div>
                </div>

                {/* Target Apps Selector */}
                <div className="fl-card">
                  <span className="fl-card-title">BLOCKED APPS</span>
                  <p className="fl-card-desc">Daily limit, blocked apps, and scheduled block windows.</p>
                  <div className="fl-apps-list">
                    {Object.entries(flState.targetApps).map(([pkg, isBlocked]) => {
                      const displayName = pkg.split('.').slice(-2, -1)[0] || pkg;
                      return (
                        <div key={pkg} className="fl-app-item" data-package={pkg}>
                          <div className="fl-app-item-info">
                            <span className="fl-app-item-name">{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</span>
                            <span className="fl-app-item-pkg">{pkg}</span>
                          </div>
                          <button
                            type="button"
                            className={`fl-switch ${isBlocked ? 'is-on' : ''}`}
                            onClick={() => {
                              updateFlState({
                                targetApps: { ...flState.targetApps, [pkg]: !isBlocked },
                              });
                            }}
                            aria-label={`Toggle blocking for ${pkg}`}
                          >
                            <span className="fl-switch-thumb" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add target app */}
                  <div className="fl-add-app-row">
                    <input
                      type="text"
                      className="fl-input"
                      placeholder="Add package (e.g. com.reddit.frontpage)"
                      value={newAppPkg}
                      onChange={(e) => setNewAppPkg(e.target.value)}
                      aria-label="Package name to add"
                    />
                    <button
                      type="button"
                      className="fl-btn-small"
                      onClick={() => {
                        if (!newAppPkg.trim()) return;
                        updateFlState({
                          targetApps: { ...flState.targetApps, [newAppPkg.trim()]: true },
                        });
                        setNewAppPkg('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Block Windows */}
                <div className="fl-card">
                  <span className="fl-card-title">BLOCK WINDOWS</span>
                  <div className="fl-window-list">
                    {flState.blockWindows.map((bw) => (
                      <div key={bw.id} className="fl-window-item">
                        <span>{bw.start} – {bw.end} (Weekdays)</span>
                        <span className="fl-active-pill">Active</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="fl-btn fl-btn-primary"
                    onClick={() => triggerSavedBanner('✓ Policy saved')}
                  >
                    Save Policy
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: MODES & SURFACES */}
            {flTab === 'modes' && (
              <div className="fl-screen" data-screen="modes">
                <div className="fl-card">
                  <span className="fl-card-title">SHORT-FORM VIDEO CONTROL</span>
                  <p className="fl-card-desc">Keep the app usable, just neutralize the doomscroll feed.</p>

                  <div className="fl-mode-block">
                    <span className="fl-subhead">Instagram Reels</span>
                    <div className="fl-mode-pills">
                      {['off', 'block', 'one_at_a_time'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`fl-pill-btn ${flState.reelsMode === mode ? 'is-selected' : ''}`}
                          onClick={() => updateFlState({ reelsMode: mode })}
                        >
                          {mode === 'off' ? 'Off' : mode === 'block' ? 'Block entirely' : 'One at a time'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fl-mode-block">
                    <span className="fl-subhead">YouTube Shorts</span>
                    <div className="fl-mode-pills">
                      {['off', 'block', 'one_at_a_time'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`fl-pill-btn ${flState.shortsMode === mode ? 'is-selected' : ''}`}
                          onClick={() => updateFlState({ shortsMode: mode })}
                        >
                          {mode === 'off' ? 'Off' : mode === 'block' ? 'Block entirely' : 'One at a time'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fl-intercept-stat">
                    Today: 0 Reels · 0 Shorts
                  </div>

                  <button
                    type="button"
                    className="fl-btn fl-btn-primary"
                    onClick={() => triggerSavedBanner('✓ Reels policy saved')}
                  >
                    Save Reels Policy
                  </button>
                </div>

                <div className="fl-card">
                  <span className="fl-card-title">STRICT MODE (DEVICE ADMIN)</span>
                  <p className="fl-card-desc">Prevents the uninstallation of FocusLock while blocking features are active.</p>
                  <div className="fl-toggle-row">
                    <span>Device Admin Protection</span>
                    <button
                      type="button"
                      className={`fl-switch ${flState.strictMode ? 'is-on' : ''}`}
                      onClick={() => updateFlState({ strictMode: !flState.strictMode })}
                      aria-label="Toggle Strict Mode"
                    >
                      <span className="fl-switch-thumb" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STATS & HISTORY */}
            {flTab === 'stats' && (
              <div className="fl-screen" data-screen="stats">
                <div className="fl-card">
                  <span className="fl-card-title">TODAY&apos;S METRICS</span>
                  <div className="fl-metric-grid">
                    <div className="fl-metric-box">
                      <span className="fl-metric-num">0m</span>
                      <span className="fl-metric-lbl">Time Spent</span>
                    </div>
                    <div className="fl-metric-box">
                      <span className="fl-metric-num">0m</span>
                      <span className="fl-metric-lbl">Remaining</span>
                    </div>
                    <div className="fl-metric-box">
                      <span className="fl-metric-num">{opens}</span>
                      <span className="fl-metric-lbl">Blocks Today</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Bar Chart */}
                <div className="fl-card">
                  <span className="fl-card-title">WEEKLY USAGE</span>
                  <div className="fl-chart">
                    {[
                      { day: 'Sun', mins: 0 },
                      { day: 'Mon', mins: 0 },
                      { day: 'Tue', mins: 0 },
                      { day: 'Wed', mins: 0 },
                      { day: 'Thu', mins: 0 },
                      { day: 'Fri', mins: 0 },
                      { day: 'Sat', mins: 0 },
                    ].map((d) => (
                      <div key={d.day} className="fl-chart-row">
                        <span className="fl-chart-day">{d.day}</span>
                        <div className="fl-chart-track">
                          <div className="fl-chart-fill" style={{ width: `${(d.mins / 60) * 100}%` }} />
                        </div>
                        <span className="fl-chart-val">{d.mins}m</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Block Log */}
                <div className="fl-card">
                  <span className="fl-card-title">RECENT SESSIONS</span>
                  <div className="fl-log-list">
                    <p className="fl-todo-empty">No recent sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {flTab === 'settings' && (
              <div className="fl-screen" data-screen="settings">
                <div className="fl-card">
                  <span className="fl-card-title">FRICTION &amp; BLOCKERS</span>
                  <p className="fl-card-desc">Barriers to bypass when opening social apps.</p>

                  {[
                    { key: 'breathing', label: 'Breathing Pause (12 seconds)' },
                    { key: 'delay', label: 'Wait Delay (10 seconds)' },
                    { key: 'intention', label: 'Intention Setting Prompt' },
                    { key: 'shake', label: 'Shake Challenge (Accelerometer)' },
                    { key: 'reflection', label: 'Cognitive Reflection (Mindful typing)' },
                    { key: 'stats', label: 'Stats & Checklist display' },
                    { key: 'math', label: 'Math Gate (Verification check)' },
                  ].map((f) => (
                    <div key={f.key} className="fl-toggle-row">
                      <span>{f.label}</span>
                      <button
                        type="button"
                        className={`fl-switch ${flState.friction[f.key] ? 'is-on' : ''}`}
                        onClick={() => {
                          updateFlState({
                            friction: { ...flState.friction, [f.key]: !flState.friction[f.key] },
                          });
                        }}
                        aria-label={`Toggle ${f.label}`}
                      >
                        <span className="fl-switch-thumb" />
                      </button>
                    </div>
                  ))}

                  <div className="fl-subhead" style={{ marginTop: 18 }}>Math Difficulty</div>
                  <div className="fl-mode-pills">
                    {['easy', 'medium', 'hard'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        className={`fl-pill-btn ${flState.friction.mathDifficulty === diff ? 'is-selected' : ''}`}
                        onClick={() => {
                          updateFlState({
                            friction: { ...flState.friction, mathDifficulty: diff },
                          });
                        }}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cloud Sync Code */}
                <div className="fl-card">
                  <span className="fl-card-title">SYNC CODE</span>
                  <p className="fl-card-desc">Use the same code on your phone and desktop to keep them in sync.</p>
                  <div className="fl-sync-row">
                    <input
                      type="text"
                      className="fl-input"
                      value={flState.syncCode}
                      onChange={(e) => updateFlState({ syncCode: e.target.value })}
                      aria-label="Sync Code"
                    />
                    <button
                      type="button"
                      className="fl-btn-small"
                      onClick={() => triggerSavedBanner('✓ Sync code saved')}
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Reset to defaults */}
                <div className="fl-card">
                  <button
                    type="button"
                    className="fl-btn fl-btn-danger"
                    onClick={() => {
                      const def = getDefaultFocusLockState();
                      updateFlState(def);
                      triggerSavedBanner('✓ Reset to defaults');
                    }}
                  >
                    Reset Policy to Default
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="fl-nav" aria-label="FocusLock navigation">
            <button
              type="button"
              className={`fl-nav-item ${flTab === 'dashboard' ? 'is-active' : ''}`}
              data-tab="dashboard"
              onClick={() => setFlTab('dashboard')}
            >
              <span className="fl-nav-icon">🛡️</span>
              <span className="fl-nav-label">Dashboard</span>
            </button>
            <button
              type="button"
              className={`fl-nav-item ${flTab === 'blocklist' ? 'is-active' : ''}`}
              data-tab="blocklist"
              onClick={() => setFlTab('blocklist')}
            >
              <span className="fl-nav-icon">📱</span>
              <span className="fl-nav-label">Apps</span>
            </button>
            <button
              type="button"
              className={`fl-nav-item ${flTab === 'modes' ? 'is-active' : ''}`}
              data-tab="modes"
              onClick={() => setFlTab('modes')}
            >
              <span className="fl-nav-icon">⚡</span>
              <span className="fl-nav-label">Modes</span>
            </button>
            <button
              type="button"
              className={`fl-nav-item ${flTab === 'stats' ? 'is-active' : ''}`}
              data-tab="stats"
              onClick={() => setFlTab('stats')}
            >
              <span className="fl-nav-icon">📊</span>
              <span className="fl-nav-label">Stats</span>
            </button>
            <button
              type="button"
              className={`fl-nav-item ${flTab === 'settings' ? 'is-active' : ''}`}
              data-tab="settings"
              onClick={() => setFlTab('settings')}
            >
              <span className="fl-nav-icon">⚙️</span>
              <span className="fl-nav-label">Settings</span>
            </button>
          </nav>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. FOCUSLOCK FRICTION SEQUENCE (Before Instagram)                    */}
      {/* ==================================================================== */}
      {app === 'friction' && (
        <div className="fl-friction-root">
          <div className="ps-statusbar">
            <span className="ps-clock">{time}</span>
            <div className="ps-status-icons">
              <span className="ps-stat-icon">5G</span>
              <span className="ps-stat-icon">100%</span>
            </div>
          </div>

          <div className="fl-friction-content">
            {currentStep === 'breathing' && (
              <div className="fl-step fl-step-breathing" data-step="breathing">
                <span className="fl-step-badge">BREATHE</span>
                <h2 className="fl-step-title">Take a Breath</h2>
                <p className="fl-step-desc">Take a deep breath before you continue</p>
                <div
                  className="fl-circle-breathing"
                  style={{
                    '--breathing-duration': `${12 / getTimeScale()}s`,
                    backgroundColor: breathingSec > 8 ? '#2ECC71' : breathingSec > 4 ? '#F1C40F' : '#E67E22',
                  }}
                />
                <span className="txt-breathing-instruction fl-breathe-text">
                  {breathingSec > 8 ? 'Inhale...' : breathingSec > 4 ? 'Hold...' : 'Exhale...'}
                </span>
                <span className="txt-breathing-timer fl-breathe-timer">{breathingSec}s</span>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'delay' && (
              <div className="fl-step fl-step-delay" data-step="delay">
                <span className="fl-step-badge">WAIT</span>
                <h2 className="fl-step-title">Pause and Reflect</h2>
                <p className="fl-step-desc">&quot;Disconnect to reconnect with what matters.&quot;</p>
                <div className="fl-progress-track">
                  <div className="fl-progress-fill" style={{ width: `${delayProgress}%` }} />
                </div>
                <p className="fl-delay-sec txt-delay-seconds">{delayRemaining} seconds remaining</p>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'intention' && (
              <div className="fl-step fl-step-intention" data-step="intention">
                <span className="fl-step-badge">INTENTION</span>
                <h2 className="fl-step-title">What is your intention?</h2>
                <p className="fl-step-desc">Be intentional about opening this app</p>
                <div className="fl-chip-group">
                  {INTENTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`fl-chip ${intentionSelected === preset ? 'is-selected' : ''}`}
                      onClick={() => {
                        setIntentionSelected(preset);
                        setIntentionInput(preset);
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="fl-input fl-intention-input"
                  placeholder="Or type a custom reason..."
                  value={intentionInput}
                  onChange={(e) => {
                    setIntentionInput(e.target.value);
                    if (intentionSelected && e.target.value !== intentionSelected) {
                      setIntentionSelected('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="ps-btn ps-primary btn-confirm-intention"
                  onClick={() => {
                    const reason = intentionInput.trim() || intentionSelected;
                    if (!reason) {
                      setToast('Please select or type your intention');
                      return;
                    }
                    advanceFrictionStep();
                  }}
                >
                  Confirm Intention
                </button>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'shake' && (
              <div className="fl-step fl-step-shake" data-step="shake">
                <span className="fl-step-badge">SHAKE</span>
                <h2 className="fl-step-title">Shake Challenge</h2>
                <p className="fl-step-desc fl-shake-line1">Shake your phone to continue</p>
                <p className="fl-shake-hint fl-shake-line2">On the real phone you physically shake it. Here, move your mouse left and right quickly.</p>
                <div className="fl-shake-visual" style={{ '--shake-pulse-period': `${1 / getTimeScale()}s` }}>
                  <span className={`fl-shake-arrow fl-shake-arrow-left ${shakePulsing ? 'is-pulsing' : ''}`} aria-hidden="true">←</span>
                  <div className="fl-rocking-phone" aria-hidden="true" title="Rocking phone">
                    <svg viewBox="0 0 28 44" width="32" height="50" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="24" height="40" rx="5" stroke="#6366F1" fill="#1E293B" />
                      <line x1="10" y1="37" x2="18" y2="37" stroke="#A78BFA" strokeWidth="2.5" />
                      <circle cx="14" cy="7" r="1.5" fill="#94A3B8" />
                    </svg>
                  </div>
                  <div className="fl-shake-mouse" aria-hidden="true" title="Mouse movement">
                    <svg viewBox="0 0 24 32" width="26" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="26" rx="9" stroke="#6366F1" fill="#1E293B" />
                      <line x1="12" y1="7" x2="12" y2="13" stroke="#A78BFA" strokeWidth="2" />
                    </svg>
                  </div>
                  <span className={`fl-shake-arrow fl-shake-arrow-right ${shakePulsing ? 'is-pulsing' : ''}`} aria-hidden="true">→</span>
                </div>
                <div className="fl-shake-box">
                  <div className="fl-progress-track">
                    <div className="fl-progress-fill" style={{ width: `${shakeProgress}%` }} />
                  </div>
                  <span className="txt-shake-count">Shake meter: {shakeProgress}%</span>
                </div>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'reflection' && (
              <div className="fl-step fl-step-reflection" data-step="reflection">
                <span className="fl-step-badge">REFLECTION</span>
                <h2 className="fl-step-title">Cognitive Reflection</h2>
                <p className="fl-step-desc">Type the phrase below to continue:</p>
                <div className="fl-phrase-card">
                  <p className="txt-reflection-phrase">{reflectionPhrase}</p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reflectionInput.trim().toLowerCase() === reflectionPhrase.toLowerCase()) {
                      advanceFrictionStep();
                    } else {
                      setToast("Text doesn't match! Try again.");
                    }
                  }}
                >
                  <input
                    type="text"
                    className="fl-input fl-reflection-input"
                    placeholder="Type the phrase here..."
                    value={reflectionInput}
                    onChange={(e) => setReflectionInput(e.target.value)}
                  />
                  <button type="submit" className="ps-btn ps-primary btn-verify-reflection">
                    Verify &amp; Continue
                  </button>
                </form>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'stats' && (
              <div className="fl-step fl-step-stats" data-step="stats">
                <span className="fl-step-badge">TODAY&apos;S USAGE</span>
                <h2 className="fl-step-title">Mindful Check</h2>
                <div className="fl-stats-grid">
                  <div className="fl-card fl-stat-box">
                    <span className="fl-stat-lbl">Opened Today</span>
                    <span className="fl-stat-val txt-stats-opens">{opens} times</span>
                  </div>
                  <div className="fl-card fl-stat-box">
                    <span className="fl-stat-lbl">Time Spent</span>
                    <span className="fl-stat-val txt-stats-duration">0 min</span>
                  </div>
                </div>
                <div className="fl-card fl-stats-todos">
                  <span className="fl-card-title">PENDING TASKS</span>
                  {flState.todos.length > 0 ? (
                    <div className="fl-todo-list">
                      {flState.todos.map((t) => (
                        <div key={t.id} className="fl-todo-row">
                          <span className="fl-todo-text">{t.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="fl-todo-empty">All caught up! No pending tasks.</p>
                  )}
                </div>
                <button
                  type="button"
                  className="ps-btn ps-primary btn-stats-next"
                  onClick={() => advanceFrictionStep()}
                >
                  I Understand, Next
                </button>
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'math' && (
              <div className="fl-step fl-step-math" data-step="math">
                <span className="fl-step-badge">MATH GATE</span>
                <h2 className="fl-step-title">Verify Intention</h2>
                <p className="fl-step-desc">Solve the math problem to proceed</p>
                {frictionMath && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (Number(frictionMathAnswer.trim()) === frictionMath.answer) {
                        advanceFrictionStep();
                      } else {
                        setToast('Incorrect! Try again.');
                        setFrictionMathAnswer('');
                        setFrictionMath(generateFrictionMath(flState.friction.mathDifficulty));
                      }
                    }}
                  >
                    <div className="fl-math-problem txt-math-question">{frictionMath.text}</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="fl-input fl-math-input"
                      placeholder="Enter answer"
                      value={frictionMathAnswer}
                      onChange={(e) => setFrictionMathAnswer(e.target.value)}
                    />
                    <button type="submit" className="ps-btn ps-primary btn-verify-math">
                      Verify Answer
                    </button>
                  </form>
                )}
                <button type="button" className="ps-btn ps-secondary btn-take-break" onClick={() => goHome()}>
                  I will take a break now
                </button>
              </div>
            )}

            {currentStep === 'decision' && (
              <div className="fl-step fl-step-decision" data-step="decision">
                <span className="fl-step-badge">DECISION</span>
                <h2 className="fl-step-title txt-decision-title">Do you still want to proceed?</h2>
                <p className="fl-step-desc txt-decision-subtitle">Taking a break now will help you focus on your goals.</p>
                {decisionGranted ? (
                  <div className="fl-granted-box" role="status">
                    <p className="fl-granted-text">{GRANTED}</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ps-btn ps-primary btn-close-app-decision"
                      onClick={() => goHome()}
                    >
                      Yes, Close App &amp; Focus (Recommended)
                    </button>
                    <button
                      type="button"
                      className="ps-btn ps-secondary btn-open-anyway"
                      onClick={handleOpenAnyway}
                    >
                      Open Anyway
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {toast && <span className="ps-toast" role="status">{toast}</span>}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. EXPENSE TRACKER APP                                               */}
      {/* ==================================================================== */}
      <div
        className={`ps-full-app${app === 'expense' ? ' is-active' : ''}`}
        aria-hidden={app !== 'expense'}
        inert={app !== 'expense'}
      >
          <ExpenseApp onClose={() => goHome()} />
          <button type="button" className="ps-home-bar-btn" aria-label="Go home" onClick={() => goHome()}>
            <span className="ps-home-bar" />
          </button>
      </div>

      {/* ==================================================================== */}
      {/* 6. BASKETPROOF APP                                                   */}
      {/* ==================================================================== */}
      <div
        className={`ps-full-app${app === 'basketproof' ? ' is-active' : ''}`}
        aria-hidden={app !== 'basketproof'}
        inert={app !== 'basketproof'}
      >
          <BasketProofApp onClose={() => goHome()} />
          <button type="button" className="ps-home-bar-btn" aria-label="Go home" onClick={() => goHome()}>
            <span className="ps-home-bar" />
          </button>
      </div>

      </div>
      {stageMode && (
        <div className="phone-stage-chrome" role="toolbar" aria-label="Phone navigation">
          <div className="phone-stage-heading">
            <span className="phone-stage-kicker">MOBILE PROJECTS</span>
            <span className="phone-stage-title">Interactive phone demo</span>
          </div>
          <div className="phone-stage-actions">
            <button
              type="button"
              className="phone-stage-home"
              data-phone-stage-control="home"
              onClick={() => goHome()}
              disabled={app === 'home'}
            >
              Phone home
            </button>
            <button
              type="button"
              className="phone-stage-exit"
              data-phone-stage-control="exit"
              onClick={() => onExit?.()}
            >
              Back to room <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}
      {stageMode && interactive && WALKTHROUGH[app] && (
        <aside className="phone-walkthrough" aria-live="polite" aria-label="About this app">
          <span className="phone-walkthrough-kicker">WALKTHROUGH</span>
          <h2 className="phone-walkthrough-title">{WALKTHROUGH[app].title}</h2>
          <p>{WALKTHROUGH[app].body}</p>
          <ul>{WALKTHROUGH[app].steps.map((step) => <li key={step}>{step}</li>)}</ul>
        </aside>
      )}
    </div>
  );
});

export default PhoneScreen;

// CSS Design System matching values/colors.xml:
// bg_dark: #0A0E17, surface_dark: #111827, surface_dark_card: #1E293B,
// color_primary: #6366F1, color_accent: #A78BFA, border_color: #334155
const css = `
.phone-presentation {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
}
.phone-presentation--stage {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 36px 16px;
  background: #0A0A0B;
  pointer-events: auto;
  isolation: isolate;
}
.phone-presentation--stage.phone-stage-entering {
  background: transparent;
}
.phone-stage-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #0A0A0B;
  opacity: 1;
  transition: opacity 250ms cubic-bezier(.22, 1, .36, 1);
}
.phone-presentation--stage.phone-stage-entering .phone-stage-backdrop {
  opacity: 0;
}
.phone-screen.phone-screen--stage {
  position: relative;
  top: auto;
  left: auto;
  z-index: 2;
  flex: 0 0 auto;
  width: min(390px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  height: min(844px, calc(100dvh - 72px));
  max-height: calc(100dvh - 72px);
  border: 10px solid #15151B;
  border-radius: 34px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .62), 0 0 0 1px rgba(255, 255, 255, .08);
  visibility: visible !important;
  transform: none !important;
  container-type: inline-size;
  pointer-events: auto !important;
}
.phone-screen.phone-screen--stage.phone-stage-flip {
  transform-origin: 0 0;
  transition: transform 250ms cubic-bezier(.22, 1, .36, 1);
}
.phone-stage-chrome {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  left: max(18px, env(safe-area-inset-left));
  right: max(18px, env(safe-area-inset-right));
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #E8E4DC;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  pointer-events: none;
}
.phone-stage-heading, .phone-stage-actions { pointer-events: auto; }
.phone-stage-heading { display: flex; flex-direction: column; gap: 2px; }
.phone-stage-kicker {
  color: #8D8D95;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.phone-stage-title { font-size: 14px; color: #E8E4DC; }
.phone-stage-actions { display: flex; align-items: center; gap: 8px; }
.phone-stage-actions button {
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid #3B3B42;
  border-radius: 999px;
  color: #E8E4DC;
  background: #16161A;
  font-size: 13px;
  white-space: nowrap;
}
.phone-stage-actions button:hover,
.phone-stage-actions button:focus-visible { border-color: #E8E4DC; }
.phone-stage-actions button:disabled { opacity: .46; cursor: default; }
/* Beside the phone, only where there is room for it. */
.phone-walkthrough {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: max(24px, calc(50% - 195px - 48px - 300px));
  width: min(300px, calc(50% - 195px - 72px));
  transform: translateY(-50%);
  padding-left: 16px;
  border-left: 1px solid #3B3B42;
  color: #B7B9B2;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 13.5px;
  line-height: 1.55;
  pointer-events: none;
}
.phone-walkthrough-kicker {
  color: #8D8D95;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .16em;
}
.phone-walkthrough-title { margin: 6px 0 8px; color: #E8E4DC; font-size: 17px; font-weight: 500; }
.phone-walkthrough p { margin: 0 0 12px; }
.phone-walkthrough ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.phone-walkthrough li { color: #D6D3CB; }
@media (max-width: 1099px) { .phone-walkthrough { display: none; } }
.phone-stage-exit { color: #FFB394 !important; border-color: rgba(255, 95, 31, .55) !important; }
.phone-stage-exit:hover, .phone-stage-exit:focus-visible { border-color: #FF5F1F !important; }

.phone-screen {
  position: absolute;
  top: 0; left: 0;
  z-index: 2;
  width: 540px;
  height: 1200px;
  overflow: hidden;
  visibility: hidden;
  transform-origin: 0 0;
  background: #0A0E17;
  color: #F8FAFC;
  font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.phone-screen button, .phone-screen input { font-family: inherit; }

/* The stage is a real portrait viewport. Projected mode keeps the historical
   540×1200 surface above so the three.js affine map remains unchanged. */
.phone-screen--stage .ps-home {
  overflow: hidden;
}
.phone-screen--stage .ps-statusbar {
  padding: 5.5cqw 6cqw 0;
}
.phone-screen--stage .ps-clock { font-size: clamp(17px, 5.2cqw, 21px); }
.phone-screen--stage .ps-status-icons { font-size: clamp(12px, 3.5cqw, 15px); gap: 3cqw; }
.phone-screen--stage .ps-apps-grid {
  inset: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 7cqw 5cqw;
  padding: 28cqw 9cqw 0;
}
.phone-screen--stage .ps-app,
.phone-screen--stage .ps-app-focuslock,
.phone-screen--stage .ps-app-expense,
.phone-screen--stage .ps-app-basket {
  position: static !important;
  width: auto !important;
  min-width: 0;
  min-height: 44px;
}
.phone-screen--stage .ps-tile,
.phone-screen--stage .ps-tile-fl,
.phone-screen--stage .ps-tile-expense,
.phone-screen--stage .ps-tile-basket {
  width: clamp(64px, 21cqw, 82px) !important;
  height: clamp(64px, 21cqw, 82px) !important;
}
.phone-screen--stage .ps-label {
  margin-top: 3cqw;
  font-size: clamp(13px, 3.8cqw, 16px);
}

/* ── Home screen ─────────────────────────────────────────────────────────── */
.ps-home { position: absolute; inset: 0; background: #0A0E17; }
.ps-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 36px 0;
}
.ps-clock { font-size: 24px; font-weight: 600; color: #F8FAFC; }
.ps-status-icons { font-size: 16px; color: #94A3B8; font-weight: 500; display: flex; gap: 12px; }
.ps-apps-grid { position: absolute; inset: 0; }

.ps-app, .ps-app-focuslock, .ps-app-expense, .ps-app-basket {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.ps-app:focus-visible, .ps-app-focuslock:focus-visible, .ps-app-expense:focus-visible, .ps-app-basket:focus-visible { outline: none; }

.ps-tile {
  display: block;
  border-radius: 24%;
  background: linear-gradient(45deg, #FFD521 0%, #F50000 35%, #B900B4 70%, #4C68D7 100%);
  transition: box-shadow .15s ease;
}
.ps-tile-fl {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24%;
  background: #1E293B;
  border: 2px solid #6366F1;
  box-shadow: 0 4px 18px rgba(99, 102, 241, 0.25);
  transition: box-shadow .15s ease, transform .15s ease;
}
.ps-tile-expense {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24%;
  background: #0E0E0E;
  border: 2px solid #3DDC84;
  box-shadow: 0 4px 18px rgba(61, 220, 132, 0.25);
  transition: box-shadow .15s ease, transform .15s ease;
}
.ps-tile-basket {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24%;
  background: #1C1D22;
  border: 2px solid #7C4DFF;
  box-shadow: 0 4px 18px rgba(124, 77, 255, 0.25);
  transition: box-shadow .15s ease, transform .15s ease;
}
.ps-app:hover .ps-tile, .ps-app:focus-visible .ps-tile,
.ps-app-focuslock:hover .ps-tile-fl, .ps-app-focuslock:focus-visible .ps-tile-fl,
.ps-app-expense:hover .ps-tile-expense, .ps-app-expense:focus-visible .ps-tile-expense,
.ps-app-basket:hover .ps-tile-basket, .ps-app-basket:focus-visible .ps-tile-basket {
  box-shadow: 0 0 34px rgba(255, 255, 255, .55);
}
.ps-tile svg { display: block; width: 100%; height: 100%; fill: none; stroke: #fff; stroke-width: 7.5; }
.ps-tile .ps-dot { fill: #fff; stroke: none; }
.fl-shield-icon, .expense-icon, .basket-icon { width: 75%; height: 75%; }
.ps-label { margin-top: 18px; font-size: 24px; color: #F8FAFC; white-space: nowrap; font-weight: 500; }

.ps-full-app {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  z-index: 10;
  background: #000;
  visibility: hidden;
  pointer-events: none;
  z-index: 0;
}
.ps-full-app.is-active {
  visibility: visible;
  pointer-events: auto;
  z-index: 10;
}
.ps-home-bar-btn {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
}
.ps-home-bar {
  width: 140px;
  height: 5px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  transition: background 0.15s ease;
}
.ps-home-bar-btn:hover .ps-home-bar {
  background: rgba(255, 255, 255, 0.8);
}

/* ── Lock Overlay (Instagram Paused) ─────────────────────────────────────── */
.ps-lock {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px;
  background: #121820;
  text-align: center;
}
.ps-pill {
  margin-bottom: 24px;
  padding: 6px 18px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: #EF4444;
  background: #1E293B;
  border: 1.5px solid #334155;
  border-radius: 24px;
}
.ps-title { width: 100%; margin: 0 0 12px; font-size: 36px; font-weight: 700; line-height: 1.2; color: #F8FAFC; overflow-wrap: anywhere; }
.ps-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: #1E293B;
  border: 1.5px solid #334155;
  border-radius: 24px;
}
.ps-caption { margin-bottom: 6px; font-size: 16.5px; font-weight: 700; color: #94A3B8; }
.ps-stats { font-size: 21px; color: #F8FAFC; }
.ps-quote-card { margin-bottom: 30px; }
.ps-quote { margin: 0; font-size: 22.5px; font-style: italic; line-height: 1.35; color: #6366F1; }
.ps-math { margin-bottom: 24px; }
.ps-math-label { margin-bottom: 12px; font-size: 21px; font-weight: 700; color: #F8FAFC; }
.ps-math-q { margin-bottom: 12px; font-size: 33px; font-weight: 700; color: #A78BFA; }
.ps-math-row { display: flex; gap: 12px; width: 100%; }
.ps-math-row input {
  flex: 1; min-width: 0;
  padding: 15px;
  font-size: 22.5px;
  text-align: center;
  color: #F8FAFC;
  background: #111827;
  border: 1.5px solid #334155;
  border-radius: 15px;
}
.ps-math-row input::placeholder { color: #94A3B8; }
.ps-btn { width: 100%; min-height: 68px; padding: 0 24px; font-size: 20px; border-radius: 18px; cursor: pointer; }
.ps-secondary { margin-bottom: 15px; color: #F8FAFC; background: #111827; border: 1.5px solid #334155; }
.ps-primary { color: #0A0E17; font-weight: 700; background: #6366F1; border: 0; }
.ps-close { margin-bottom: 20px; }
.ps-math-row .ps-btn { width: auto; }
.ps-btn:focus-visible, .ps-math-row input:focus-visible { outline: 3px solid #A78BFA; outline-offset: 3px; }
.ps-status { width: 100%; margin: 0; font-size: 20px; color: #94A3B8; }
.ps-toast {
  position: absolute;
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  padding: 16px 28px;
  font-size: 20px;
  white-space: nowrap;
  color: #F8FAFC;
  background: rgba(40,40,40,.92);
  border-radius: 36px;
}



/* ── FocusLock Native App UI ─────────────────────────────────────────────── */
.fl-root {
  position: absolute;
  inset: 0;
  background: #0A0E17;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.fl-appbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  padding: 0 24px;
  background: #111827;
  border-bottom: 1.5px solid #334155;
  flex-shrink: 0;
}
.fl-back {
  background: #1E293B;
  border: 1px solid #334155;
  color: #F8FAFC;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
}
.fl-back:hover { background: #334155; }
.fl-header-info { text-align: right; }
.fl-app-title { margin: 0; font-size: 22px; font-weight: 700; color: #F8FAFC; }
.fl-app-version { font-size: 12px; color: #6366F1; font-weight: 500; }
.fl-app-demo { display: block; margin-top: 3px; font-size: 10px; color: #94A3B8; letter-spacing: .08em; }

.fl-banner {
  background: #4F46E5;
  color: #fff;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  animation: flFadeIn .2s ease;
}
@keyframes flFadeIn { from { opacity: 0; } to { opacity: 1; } }

.fl-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 90px;
}

.fl-card {
  background: #1E293B;
  border: 1.5px solid #334155;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}
.fl-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.fl-card-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
  color: #94A3B8;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.fl-card-desc { font-size: 13px; color: #94A3B8; margin-top: -4px; margin-bottom: 16px; line-height: 1.4; }
.fl-subhead { display: block; font-size: 14px; font-weight: 600; color: #F8FAFC; margin-bottom: 10px; }

.fl-status-text { font-size: 16px; font-weight: 600; color: #F8FAFC; margin-bottom: 14px; }
.fl-badge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fl-badge {
  background: #111827;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: #F8FAFC;
  font-weight: 500;
}

.fl-session-status { font-size: 18px; font-weight: 600; color: #A78BFA; margin-bottom: 16px; }
.fl-duration-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; background: #111827; padding: 12px 16px; border-radius: 12px; border: 1px solid #334155; }
.fl-duration-label { font-size: 14px; color: #94A3B8; font-weight: 500; }
.fl-duration-input { width: 72px; text-align: center; font-size: 16px; font-weight: 600; padding: 8px; background: #0A0E17; border: 1px solid #334155; border-radius: 8px; color: #F8FAFC; }
.fl-todo-empty { font-size: 14px; color: #94A3B8; padding: 16px 8px; text-align: center; margin: 0; font-style: italic; }
.fl-minutes-val { font-size: 28px; font-weight: 700; color: #F8FAFC; }
.fl-usage-val { font-size: 22px; color: #94A3B8; font-weight: 500; display: block; margin-bottom: 8px; }
.fl-pill-btn {
  flex: 1;
  background: #111827;
  border: 1px solid #334155;
  color: #94A3B8;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
}
.fl-pill-btn.is-selected {
  background: #6366F1;
  color: #0A0E17;
  border-color: #6366F1;
}

.fl-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 14px;
  cursor: pointer;
  border: 0;
}
.fl-btn-primary { background: #6366F1; color: #0A0E17; }
.fl-btn-danger { background: #EF4444; color: #fff; }

.fl-todo-section { margin-top: 24px; border-top: 1px solid #334155; padding-top: 18px; }
.fl-todo-input-row { display: flex; gap: 8px; margin-bottom: 14px; }
.fl-input {
  flex: 1;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 14px;
  color: #F8FAFC;
  font-size: 14px;
}
.fl-input::placeholder { color: #94A3B8; }
.fl-btn-small {
  background: #4F46E5;
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
}
.fl-todo-list { display: flex; flex-direction: column; gap: 10px; }
.fl-todo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111827;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #334155;
}
.fl-checkbox-label { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; }
.fl-checkbox-label input { width: 18px; height: 18px; accent-color: #6366F1; cursor: pointer; }
.fl-todo-done { text-decoration: line-through; color: #94A3B8; }
.fl-del-btn { background: none; border: 0; color: #EF4444; font-size: 14px; cursor: pointer; padding: 4px 8px; }

.fl-usage-metric { margin-bottom: 12px; }
.fl-usage-val { font-size: 20px; font-weight: 700; color: #F8FAFC; display: block; margin-bottom: 8px; }
.fl-progress-track { height: 12px; background: #111827; border-radius: 6px; overflow: hidden; border: 1px solid #334155; }
.fl-progress-bar { height: 100%; background: #6366F1; border-radius: 6px; }
.fl-opens-stat { font-size: 14px; color: #94A3B8; margin: 0; }

/* ── Form Controls & Switches ────────────────────────────────────────────── */
.fl-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(51,65,85,.5);
}
.fl-field-row label { font-size: 14px; color: #F8FAFC; }
.fl-input-number {
  width: 70px;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px;
  color: #F8FAFC;
  font-size: 15px;
  text-align: center;
}

.fl-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(51,65,85,.5);
}
.fl-toggle-row span { font-size: 14px; color: #F8FAFC; }

.fl-switch {
  position: relative;
  width: 52px;
  height: 28px;
  background: #334155;
  border-radius: 14px;
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: background .2s ease;
}
.fl-switch.is-on { background: #6366F1; }
.fl-switch-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 22px; height: 22px;
  background: #F8FAFC;
  border-radius: 50%;
  transition: transform .2s ease;
}
.fl-switch.is-on .fl-switch-thumb { transform: translateX(24px); }

/* ── Apps list in blocklist tab ──────────────────────────────────────────── */
.fl-apps-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.fl-app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111827;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #334155;
}
.fl-app-item-info { display: flex; flex-direction: column; gap: 2px; }
.fl-app-item-name { font-size: 15px; font-weight: 600; color: #F8FAFC; }
.fl-app-item-pkg { font-size: 11px; color: #94A3B8; font-family: monospace; }
.fl-add-app-row { display: flex; gap: 8px; }

.fl-window-list { margin-bottom: 16px; }
.fl-window-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #111827;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
}
.fl-active-pill {
  background: #1E293B;
  color: #6366F1;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.fl-mode-block { margin-bottom: 18px; }
.fl-mode-pills { display: flex; gap: 8px; margin-top: 8px; }
.fl-intercept-stat {
  font-size: 13px;
  color: #A78BFA;
  margin-bottom: 16px;
  background: #111827;
  padding: 10px 14px;
  border-radius: 10px;
}

/* ── Stats & History ─────────────────────────────────────────────────────── */
.fl-metric-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.fl-metric-box {
  background: #111827;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
}
.fl-metric-num { display: block; font-size: 24px; font-weight: 700; color: #6366F1; }
.fl-metric-lbl { font-size: 11px; color: #94A3B8; margin-top: 4px; display: block; }

.fl-chart { display: flex; flex-direction: column; gap: 10px; }
.fl-chart-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.fl-chart-day { width: 32px; color: #94A3B8; font-weight: 600; }
.fl-chart-track { flex: 1; height: 10px; background: #111827; border-radius: 5px; overflow: hidden; }
.fl-chart-fill { height: 100%; background: #6366F1; border-radius: 5px; }
.fl-chart-val { width: 35px; text-align: right; color: #94A3B8; }

.fl-log-list { display: flex; flex-direction: column; gap: 10px; }
.fl-log-item {
  display: flex;
  gap: 12px;
  font-size: 13px;
  background: #111827;
  padding: 10px 14px;
  border-radius: 10px;
}
.fl-log-time { color: #6366F1; font-weight: 600; font-family: monospace; }
.fl-log-detail { color: #F8FAFC; }

.fl-sync-row { display: flex; gap: 8px; margin-top: 8px; }

/* ── Bottom Navigation Bar ───────────────────────────────────────────────── */
.fl-nav {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  height: 76px;
  background: #111827;
  border-top: 1.5px solid #334155;
  display: flex;
  z-index: 10;
}
.fl-nav-item {
  flex: 1;
  background: none;
  border: 0;
  color: #94A3B8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: color .15s ease;
}
.fl-nav-item:hover, .fl-nav-item.is-active { color: #6366F1; }
.fl-nav-icon { font-size: 20px; line-height: 1; }
.fl-nav-label { font-size: 11px; font-weight: 600; letter-spacing: .02em; }

/* ── Friction Sequence ─────────────────────────────────────────────────── */
.fl-friction-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #0A0E17;
  color: #F8FAFC;
  overflow: hidden;
  z-index: 5;
}
.fl-friction-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 36px 40px;
  overflow-y: auto;
}
.fl-step {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}
.fl-step-badge {
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .15em;
  color: #A78BFA;
  background: #1E293B;
  border-radius: 999px;
  border: 1px solid #334155;
}
.fl-step-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  color: #F8FAFC;
}
.fl-step-desc {
  font-size: 14px;
  color: #94A3B8;
  margin: 0;
  line-height: 1.4;
}
.fl-circle-breathing {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  margin: 44px auto;
  animation: fl-breathe-anim var(--breathing-duration, 12s) ease-in-out infinite;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}
@keyframes fl-breathe-anim {
  0% { transform: scale(1); }
  33.3% { transform: scale(1.6); }
  66.6% { transform: scale(1.6); }
  100% { transform: scale(1); }
}
.fl-breathe-text {
  font-size: 22px;
  font-weight: 600;
  color: #F8FAFC;
}
.fl-breathe-timer {
  font-size: 16px;
  color: #94A3B8;
  font-family: monospace;
}
.fl-progress-track {
  width: 100%;
  height: 12px;
  background: #1E293B;
  border-radius: 6px;
  overflow: hidden;
  margin: 12px 0;
}
.fl-progress-fill {
  height: 100%;
  background: #6366F1;
  border-radius: 6px;
  transition: width 0.1s linear;
}
.fl-delay-sec {
  font-size: 16px;
  color: #A78BFA;
  font-weight: 600;
}
.fl-chip-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 8px 0;
}
.fl-chip {
  background: #1E293B;
  color: #F8FAFC;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}
.fl-chip:hover, .fl-chip.is-selected {
  background: #2E3856;
  border-color: #6366F1;
  color: #A78BFA;
}
.fl-shake-line1 {
  font-size: 14px;
  color: #94A3B8;
  margin: 0;
  line-height: 1.4;
}
.fl-shake-line2 {
  font-size: 13px;
  color: #A78BFA;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  max-width: 380px;
}
.fl-shake-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 14px 0 6px;
}
.fl-shake-arrow {
  font-size: 26px;
  font-weight: 800;
  color: #6366F1;
  user-select: none;
  display: inline-block;
  transition: transform 0.2s ease, color 0.2s ease;
}
.fl-shake-arrow.is-pulsing {
  animation: fl-arrow-pulse var(--shake-pulse-period, 1s) ease-in-out infinite;
}
@keyframes fl-arrow-pulse {
  0%, 100% {
    transform: scale(1);
    color: #6366F1;
    opacity: 0.5;
  }
  50% {
    transform: scale(1.4);
    color: #FF5F1F;
    opacity: 1;
    text-shadow: 0 0 10px rgba(255, 95, 31, 0.7);
  }
}
.fl-rocking-phone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform-origin: 50% 90%;
  animation: fl-phone-rock 1.2s ease-in-out infinite;
}
@keyframes fl-phone-rock {
  0%, 100% {
    transform: rotate(-16deg);
  }
  50% {
    transform: rotate(16deg);
  }
}
.fl-shake-mouse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fl-shake-box {
  width: 100%;
  margin: 12px 0 16px;
}
.txt-shake-count {
  font-size: 16px;
  font-weight: 600;
  color: #F8FAFC;
}
.fl-phrase-card {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  margin: 8px 0;
}
.txt-reflection-phrase {
  font-size: 16px;
  font-weight: 600;
  color: #A78BFA;
  font-style: italic;
  margin: 0;
}
.fl-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}
.fl-stat-box {
  padding: 14px;
  text-align: center;
}
.fl-stat-lbl {
  display: block;
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 4px;
}
.fl-stat-val {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #6366F1;
}
.fl-stats-todos {
  width: 100%;
  padding: 14px;
  text-align: left;
}
.fl-math-problem {
  font-size: 32px;
  font-weight: 700;
  color: #6366F1;
  margin: 16px 0;
  letter-spacing: 2px;
}
.fl-granted-box {
  background: #064E3B;
  border: 1px solid #059669;
  border-radius: 14px;
  padding: 20px;
  margin-top: 16px;
}
.fl-granted-text {
  font-size: 16px;
  font-weight: 600;
  color: #A7F3D0;
  margin: 0;
}
.fl-step form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Readable portrait stage ------------------------------------------------
   The source apps were originally tuned for a projected 540×1200 surface.
   These rules reflow their existing markup at the stage's 320–430px width;
   they do not scale a smaller screenshot into the viewport. */
.phone-screen--stage .ps-full-app,
.phone-screen--stage .fl-root,
.phone-screen--stage .fl-friction-root {
  border-radius: 22px;
}
.phone-screen--stage .ps-home-bar-btn { display: none; }
.phone-screen--stage .ps-full-app button,
.phone-screen--stage .ps-full-app input,
.phone-screen--stage .ps-full-app select,
.phone-screen--stage .fl-root button,
.phone-screen--stage .fl-root input,
.phone-screen--stage .fl-root select,
.phone-screen--stage .fl-friction-root button,
.phone-screen--stage .fl-friction-root input {
  min-height: 44px;
}
.phone-screen--stage .ps-lock {
  justify-content: flex-start;
  overflow-y: auto;
  padding: 28px 18px 36px;
}
.phone-screen--stage .ps-pill { margin-bottom: 18px; font-size: 13px; }
.phone-screen--stage .ps-title { font-size: clamp(24px, 7cqw, 30px); }
.phone-screen--stage .ps-card { padding: 18px; margin-bottom: 16px; border-radius: 16px; }
.phone-screen--stage .ps-caption { font-size: 13px; }
.phone-screen--stage .ps-stats,
.phone-screen--stage .ps-status { font-size: 16px; }
.phone-screen--stage .ps-quote { font-size: 18px; }
.phone-screen--stage .ps-math-label { font-size: 16px; }
.phone-screen--stage .ps-math-q { font-size: 26px; }
.phone-screen--stage .ps-btn { min-height: 48px; padding: 10px 16px; font-size: 16px; }
.phone-screen--stage .ps-math-row { flex-wrap: wrap; }
.phone-screen--stage .ps-math-row .ps-btn { flex: 1 1 120px; width: auto; }

.phone-screen--stage .fl-appbar {
  height: auto;
  min-height: 80px;
  padding: 8px 14px;
}
.phone-screen--stage .fl-back { min-height: 44px; padding: 8px 11px; font-size: 13px; }
.phone-screen--stage .fl-app-title { font-size: 19px; }
.phone-screen--stage .fl-app-version { font-size: 11px; }
.phone-screen--stage .fl-app-demo { font-size: 10px; }
.phone-screen--stage .fl-banner { padding: 9px 12px; font-size: 13px; }
.phone-screen--stage .fl-content { padding: 14px 12px 88px; }
.phone-screen--stage .fl-card { padding: 16px; margin-bottom: 14px; border-radius: 16px; }
.phone-screen--stage .fl-card-title { font-size: 13px; margin-bottom: 10px; }
.phone-screen--stage .fl-card-desc {
  font-size: 14px;
}
.phone-screen--stage .fl-subhead,
.phone-screen--stage .fl-status-text,
.phone-screen--stage .fl-duration-label,
.phone-screen--stage .fl-field-row label,
.phone-screen--stage .fl-toggle-row span,
.phone-screen--stage .fl-window-item,
.phone-screen--stage .fl-checkbox-label,
.phone-screen--stage .fl-mode-pills,
.phone-screen--stage .fl-intercept-stat,
.phone-screen--stage .fl-log-item,
.phone-screen--stage .fl-opens-stat { font-size: 16px; }
.phone-screen--stage .fl-card-desc { line-height: 1.45; }
.phone-screen--stage .fl-status-text,
.phone-screen--stage .fl-session-status { line-height: 1.4; }
.phone-screen--stage .fl-badge-grid { grid-template-columns: 1fr; gap: 8px; }
.phone-screen--stage .fl-badge { min-height: 44px; display: flex; align-items: center; font-size: 13px; }
.phone-screen--stage .fl-duration-row { padding: 10px 12px; }
.phone-screen--stage .fl-duration-input,
.phone-screen--stage .fl-input-number { min-height: 44px; font-size: 16px; }
.phone-screen--stage .fl-input,
.phone-screen--stage .fl-fl-input,
.phone-screen--stage .fl-checkbox-label,
.phone-screen--stage .fl-todo-empty,
.phone-screen--stage .fl-app-item-name,
.phone-screen--stage .fl-btn,
.phone-screen--stage .fl-pill-btn,
.phone-screen--stage .fl-chip,
.phone-screen--stage .fl-step-desc,
.phone-screen--stage .fl-shake-line1,
.phone-screen--stage .fl-shake-line2 {
  font-size: 16px;
}
.phone-screen--stage .fl-app-item-pkg,
.phone-screen--stage .fl-metric-lbl,
.phone-screen--stage .fl-chart,
.phone-screen--stage .fl-chart-row,
.phone-screen--stage .fl-chart-day,
.phone-screen--stage .fl-chart-val,
.phone-screen--stage .fl-log-time { font-size: 13px; }
.phone-screen--stage .fl-input,
.phone-screen--stage .fl-input-number { padding: 10px 12px; }
.phone-screen--stage .fl-btn { padding: 11px 14px; }
.phone-screen--stage .fl-btn-small { min-height: 44px; padding: 0 13px; font-size: 14px; }
.phone-screen--stage .fl-todo-input-row,
.phone-screen--stage .fl-add-app-row,
.phone-screen--stage .fl-sync-row { align-items: stretch; }
.phone-screen--stage .fl-todo-input-row .fl-input,
.phone-screen--stage .fl-add-app-row .fl-input,
.phone-screen--stage .fl-sync-row .fl-input { min-width: 0; }
.phone-screen--stage .fl-todo-row { padding: 10px 12px; }
.phone-screen--stage .fl-del-btn { min-width: 44px; }
.phone-screen--stage .fl-switch { flex: 0 0 52px; min-height: 28px !important; }
.phone-screen--stage .fl-mode-pills { flex-wrap: wrap; gap: 8px; }
.phone-screen--stage .fl-pill-btn { min-width: 92px; min-height: 44px; }
.phone-screen--stage .fl-nav { height: 72px; }
.phone-screen--stage .fl-nav-item { min-height: 44px; }
.phone-screen--stage .fl-nav-icon { font-size: 18px; }
.phone-screen--stage .fl-nav-label { font-size: 13px; }
.phone-screen--stage .fl-friction-content { padding: 22px 18px 30px; }
.phone-screen--stage .fl-step { max-width: none; gap: 12px; }
.phone-screen--stage .fl-step-title { font-size: 24px; line-height: 1.2; }
.phone-screen--stage .fl-step-badge { font-size: 12px; }
.phone-screen--stage .fl-chip { min-height: 48px; padding: 12px 14px; }
.phone-screen--stage .fl-circle-breathing { margin: 28px auto; }
.phone-screen--stage .fl-stats-grid { gap: 8px; }
.phone-screen--stage .fl-stat-lbl { font-size: 13px; }
.phone-screen--stage .fl-stat-val { font-size: 17px; }

/* Expense Tracker and BasketProof are reconstructed from their original
   React Native / Compose screens. Keep their markup and copy intact while
   lifting the small projected labels to a readable mobile baseline. */
.phone-screen--stage .expense-app-root,
.phone-screen--stage .basketproof-app-root {
  font-size: 16px;
}
.phone-screen--stage .expense-app-root [style*="font-size: 9px"],
.phone-screen--stage .expense-app-root [style*="font-size: 10px"],
.phone-screen--stage .expense-app-root [style*="font-size: 11px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 9px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 10px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 11px"] { font-size: 13px !important; }
.phone-screen--stage .expense-app-root [style*="font-size: 12px"],
.phone-screen--stage .expense-app-root [style*="font-size: 13px"],
.phone-screen--stage .expense-app-root [style*="font-size: 14px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 12px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 13px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 14px"] { font-size: 16px !important; }
.phone-screen--stage .expense-app-root [style*="font-size: 15px"],
.phone-screen--stage .basketproof-app-root [style*="font-size: 15px"] { font-size: 17px !important; }
.phone-screen--stage .expense-app-root button,
.phone-screen--stage .expense-app-root input,
.phone-screen--stage .expense-app-root select,
.phone-screen--stage .basketproof-app-root button,
.phone-screen--stage .basketproof-app-root input,
.phone-screen--stage .basketproof-app-root select {
  min-height: 44px;
}
.phone-screen--stage .expense-app-root input,
.phone-screen--stage .expense-app-root select,
.phone-screen--stage .basketproof-app-root input,
.phone-screen--stage .basketproof-app-root select { font-size: 16px !important; }
.phone-screen--stage .expense-app-root > header,
.phone-screen--stage .basketproof-app-root > header { padding: 10px 12px; }
.phone-screen--stage .expense-app-root > div,
.phone-screen--stage .basketproof-app-root > div { padding-left: 12px; padding-right: 12px; }
.phone-screen--stage .expense-app-root nav button,
.phone-screen--stage .basketproof-app-root footer { font-size: 13px !important; }

@media (max-width: 560px) {
  .phone-stage-chrome { gap: 8px; }
  .phone-stage-title { display: none; }
  .phone-stage-actions button { padding-inline: 11px; }
}
@media (max-height: 620px) {
  .phone-presentation--stage { align-items: flex-start; padding-block: 62px 18px; }
  .phone-screen.phone-screen--stage { width: clamp(280px, calc(100vw - 32px), 390px); max-height: none; }
  .phone-stage-chrome { position: fixed; }
}
@media (prefers-reduced-motion: reduce) {
  .phone-stage-backdrop,
  .phone-screen.phone-screen--stage.phone-stage-flip { transition: none; }
}
`;
