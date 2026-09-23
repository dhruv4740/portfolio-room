// ============================================================================
// DhruvOSScreen — the monitor destination for the v3 entrance prototype.
//
// The iframe is mounted once and then kept alive while the visitor returns to
// the room. That makes the OS feel like a running machine and preserves its
// app/window state across repeated entries. The parent/child bridge accepts
// messages only from this iframe and this origin; the OS itself has the
// matching validation in os/main.js.
// ============================================================================

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// A dependency-free document entry avoids parser-blocking CDN scripts from
// the historical standalone OS page. main.js still receives embed=1 and
// bypasses the tear/boot sequence in this path.
const OS_SRC = `${import.meta.env.BASE_URL}os/embed.html?embed=1`;
const TRUSTED_ORIGIN = window.location.origin;

const PHASE_LABELS = {
  preparing: 'CONNECTING',
  entering: 'ENTERING SCREEN',
  inside: 'ONLINE',
  leaving: 'RETURNING TO ROOM',
};

const DhruvOSScreen = forwardRef(function DhruvOSScreen({
  phase = 'room',
  reducedMotion = false,
  onReady,
  onLoadError,
  onRequestLeave,
}, ref) {
  const frameRef = useRef(null);
  const pendingKeys=useRef([]);
  // Apps asked for before the OS reports ready, in order (a single slot dropped all but the last).
  const pendingApps=useRef([]);
  const lastRect=useRef(null);
  const backRef = useRef(null);
  const rootRef = useRef(null);
  const frameBoxRef = useRef(null);
  const vignetteRef = useRef(null);
  const flashRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [frameState, setFrameState] = useState('idle');
  const [src, setSrc] = useState(OS_SRC);
  const previousPhase = useRef(phase);

  // Imperative bridge from WorkspaceStage's per-frame camera math. Both fire at
  // up to 60fps during travel — routing them through refs instead of React
  // state avoids a re-render per frame for what is pure style mutation.
  useImperativeHandle(ref, () => ({
    openApp(app) {
      const frame = frameRef.current;
      if (frame?.contentWindow && frame.dataset.ready === 'true') {
        frame.contentWindow.postMessage({ source: 'v3-scan', type: 'open-app', app }, TRUSTED_ORIGIN);
      } else { pendingApps.current.push(app); setMounted(true); }
    },
    typeKey(key) {
      if(frameRef.current?.contentWindow && frameRef.current?.dataset.ready === "true") {
        frameRef.current.contentWindow.postMessage({source:"v3-scan",type:"room-key",key},TRUSTED_ORIGIN);
      } else {pendingKeys.current.push(key);setMounted(true);}
    },
    setScreenRect(rect) {
      lastRect.current=rect;
      const root = rootRef.current, box = frameBoxRef.current;
      if (!root || !box) return;
      if (!rect) {
        root.removeAttribute('data-aligning');
        box.style.transform = '';
        box.style.width = '';
        box.style.height = '';
        return;
      }
      root.setAttribute('data-aligning', 'true');
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      box.style.transform = `matrix3d(${rect.matrix.join(',')})`;
    },
    setTravel(t, travelPhase) {
      const vg = vignetteRef.current, fl = flashRef.current;
      if (!vg || !fl) return;
      if (travelPhase === 'entering' || travelPhase === 'leaving') {
        vg.style.opacity = String(Math.min(1, t * 1.15));
        fl.style.opacity = String(Math.max(0, (t - 0.84) / 0.16) * 0.32);
      } else {
        vg.style.opacity = '0';
        fl.style.opacity = '0';
      }
    },
  }), []);

  // Safety net: if a phase change lands without a matching final onScreenRect
  // / onTravel(0|1, …) call — e.g. under reduced motion's early-return paths —
  // don't leave the frame stuck mid-transform or the fx layers lit.
  useEffect(() => {
    if (phase === 'inside' || phase === 'room') {
      rootRef.current?.removeAttribute('data-aligning');
      if (frameBoxRef.current) {
        frameBoxRef.current.style.transform = '';
        frameBoxRef.current.style.width = '';
        frameBoxRef.current.style.height = '';
      }
      if (vignetteRef.current) vignetteRef.current.style.opacity = '0';
      if (flashRef.current) flashRef.current.style.opacity = '0';
    }
  }, [phase]);

  // Mount lazily on the first attempt, but never unmount after that. The
  // hidden iframe is one OS instance, so its windows and experiments survive
  // a room ↔ screen round trip.
  useEffect(() => {
    if (phase !== 'room') setMounted(true);
  }, [phase]);

  const postToOS = useCallback((message) => {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      { source: 'v3-scan', version: 1, ...message },
      TRUSTED_ORIGIN,
    );
  }, []);

  // The iframe owns the ready signal and asks the parent to leave when Escape
  // is pressed while focus is inside the OS document.
  useEffect(() => {
    if (!mounted) return undefined;

    function onMessage(event) {
      if (event.origin !== TRUSTED_ORIGIN || event.source !== frameRef.current?.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data || data.source !== 'dhruvOS') return;

      if (data.type === 'ready') {
        setFrameState('ready');
        frameRef.current.dataset.ready='true';
        for(const key of pendingKeys.current.splice(0))frameRef.current.contentWindow.postMessage({source:'v3-scan',type:'room-key',key},TRUSTED_ORIGIN);
        for(const app of pendingApps.current.splice(0))frameRef.current.contentWindow.postMessage({source:'v3-scan',type:'open-app',app},TRUSTED_ORIGIN);
        const rect=lastRect.current,root=rootRef.current,box=frameBoxRef.current;
        if(rect&&root&&box){root.setAttribute('data-aligning','true');box.style.width=rect.width+'px';box.style.height=rect.height+'px';box.style.transform=`matrix3d(${rect.matrix.join(',')})`;}
        onReady?.(data);
      } else if (data.type === 'load-error') {
        setFrameState('error');
        onLoadError?.(data.message || 'The computer failed to start.');
      } else if (data.type === 'user-input') {
        window.dispatchEvent(new Event('os:user-input'));
      } else if (data.type === 'request-leave') {
        onRequestLeave?.();
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mounted, onLoadError, onReady, onRequestLeave]);

  // Retry the handshake after navigation or a delayed module load. This is a
  // no-op for older embedded copies that do not implement the bridge.
  useEffect(() => {
    if (!mounted) return undefined;
    postToOS({ type: 'host-hello' });
    if (frameState === 'ready') return undefined;
    const timer = window.setInterval(() => postToOS({ type: 'host-hello' }), 1000);
    return () => window.clearInterval(timer);
  }, [frameState, mounted, postToOS]);

  // A failed iframe can be retried on the next explicit entry while keeping
  // the normal success path as a single persistent document.
  useEffect(() => {
    if (phase === 'preparing' && previousPhase.current === 'room' && frameState === 'error') {
      setFrameState('idle');
      setSrc(`${OS_SRC}&retry=${Date.now()}`);
    }
    previousPhase.current = phase;
  }, [frameState, phase]);

  // Tell the OS when it has become the foreground destination and when the
  // camera is leaving it. The OS can pause optional loops/audio on leave.
  useEffect(() => {
    if (!mounted) return;
    if (phase === 'entering' || phase === 'inside') postToOS({ type: 'enter' });
    if (phase === 'leaving') postToOS({ type: 'leave' });
  }, [mounted, phase, postToOS]);

  useEffect(() => {
    if (phase !== 'inside') return undefined;
    const frame = window.requestAnimationFrame(() => backRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const handleLoad = useCallback(() => {
    setFrameState('loaded');
    postToOS({ type: 'host-hello' });
  }, [postToOS]);

  const handleError = useCallback(() => {
    setFrameState('error');
    onLoadError?.('The computer could not be loaded.');
  }, [onLoadError]);

  if (!mounted) return null;

  const visible = phase !== 'room';
  const label = PHASE_LABELS[phase] || PHASE_LABELS.preparing;
  const error = frameState === 'error';

  return (
    <div
      ref={rootRef}
      className={`dhruv-os-screen is-${phase}${reducedMotion ? ' is-reduced' : ''}`}
      data-screen-state={phase}
      aria-hidden={!visible}
      aria-busy={!error && frameState !== 'ready'}
      role="dialog"
      aria-modal={phase === 'inside' ? 'true' : undefined}
      aria-label="Desk computer screen"
    >
      <style>{css}</style>
      <div ref={vignetteRef} className="os-screen-vignette" aria-hidden="true" />
      <div ref={flashRef} className="os-screen-flash" aria-hidden="true" />
      <div ref={frameBoxRef} className="os-screen-frame">
        <div className="os-screen-bar">
          <span className="mono os-screen-title">MONITOR // {label}</span>
          <button
            ref={backRef}
            type="button"
            className="mono os-screen-back"
            data-testid="back-to-room"
            onClick={onRequestLeave}
            disabled={phase === 'leaving'}
          >
            BACK TO ROOM <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="os-screen-viewport">
          <iframe
            ref={frameRef}
            src={src}
            title="Desk computer"
            data-testid="dhruv-os-frame"
            loading="eager"
            onLoad={handleLoad}
            onError={handleError}
            tabIndex={phase === 'inside' ? 0 : -1}
            allow="autoplay"
          />
          {error && (
            <div className="os-screen-error" role="alert">
              <span className="mono">SCREEN LINK FAILED</span>
              <button type="button" className="mono" onClick={onRequestLeave}>
                RETURN TO ROOM
              </button>
            </div>
          )}
        </div>

        <div className="os-screen-foot mono">
          <span>STATE RETAINED BETWEEN VISITS</span>
          <span>ESC TO RETURN</span>
        </div>
      </div>
    </div>
  );
});

export default DhruvOSScreen;

const css = `
/* Aligned to the monitor's projected screen quad during travel — see
   setScreenRect() above. The bar/foot chrome would not exist on the real
   monitor, so it is hidden for the duration of the alignment. */
.dhruv-os-screen[data-aligning="true"] {
  visibility:visible; opacity:1;
  padding: 0;
  background: transparent;
}
.dhruv-os-screen[data-aligning="true"] .os-screen-bar,
.dhruv-os-screen[data-aligning="true"] .os-screen-foot {
  display: none;
}
.dhruv-os-screen[data-aligning="true"] .os-screen-frame {
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  max-width: none;
  border: 0;
  display: block;
  transform-origin: 0 0;
  opacity: 1;
  animation: none;
}
.dhruv-os-screen[data-aligning="true"] .os-screen-viewport {
  height: 100%;
}

.os-screen-vignette,
.os-screen-flash {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-panel) + 1);
  pointer-events: none;
  opacity: 0;
}
.os-screen-vignette { box-shadow: inset 0 0 18vmin 6vmin rgba(0, 0, 0, 0.9); }
.os-screen-flash { background: #eaf4ff; }

@media (prefers-reduced-motion: reduce) {
  .os-screen-vignette, .os-screen-flash { display: none; }
}

.dhruv-os-screen {
  position: fixed;
  inset: 0;
  z-index: var(--z-panel);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gutter);
  background: transparent;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
}

.dhruv-os-screen.is-preparing,
.dhruv-os-screen.is-entering,
.dhruv-os-screen.is-inside,
.dhruv-os-screen.is-leaving {
  visibility: visible;
}

.dhruv-os-screen.is-inside {
  opacity: 1;
  background: var(--void);
  pointer-events: auto;
}

.dhruv-os-screen.is-preparing,
.dhruv-os-screen.is-entering {
  opacity: 1;
  background: transparent;
}

.dhruv-os-screen.is-leaving {
  opacity: 1;
}

.os-screen-frame {
  width: 100%;
  max-width: 1440px;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: var(--hair) solid var(--faint);
  background: var(--void);
  overflow: hidden;
  opacity: 0;
  will-change: opacity;
}

.dhruv-os-screen.is-preparing .os-screen-frame { opacity: 0; }

/* Entering/leaving no longer fade — the frame is visible throughout and its
   position/size is driven by setScreenRect() so it visually rides the
   monitor's projected quad instead of cross-fading over it. */
.dhruv-os-screen.is-entering .os-screen-frame,
.dhruv-os-screen.is-leaving .os-screen-frame {
  opacity: 1;
  animation: none;
}

.dhruv-os-screen.is-inside .os-screen-frame {
  opacity: 1;
}

.dhruv-os-screen.is-reduced .os-screen-frame {
  animation: none;
  opacity: 1;
}

.os-screen-bar,
.os-screen-foot {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 2.4rem;
  padding: 0.65rem 0.9rem;
  background: var(--void-lift);
  border-bottom: var(--hair) solid var(--faint);
}

.os-screen-title { color: var(--signal); }

.os-screen-back {
  margin-left: auto;
  color: var(--bone);
  transition: color var(--d-feedback) var(--ease);
}
.os-screen-back:hover,
.os-screen-back:focus-visible { color: var(--signal); }
.os-screen-back:disabled { color: var(--dim); cursor: wait; }

.os-screen-viewport {
  position: relative;
  min-height: 0;
  background: #000;
  overflow: hidden;
}
.os-screen-viewport iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #000;
}

.os-screen-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-direction: column;
  background: var(--void);
}
.os-screen-error span { color: var(--signal); }
.os-screen-error button { color: var(--bone); }
.os-screen-error button:hover { color: var(--signal); }

.os-screen-foot {
  justify-content: space-between;
  color: var(--dim);
  border-top: var(--hair) solid var(--faint);
  border-bottom: 0;
}

@media (max-width: 640px) {
  .os-screen-foot span:first-child { display: none; }
  .os-screen-foot { justify-content: flex-end; }
}
`;

// Keep the style local to this component so the screen can be removed from
// the scan surface without adding a global stylesheet dependency.
export { css as dhruvOSScreenCss };
