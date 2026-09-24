// The live demo beside /work's reading column: a project's real web UI (its
// static build under /apps/<name>/) or its Android app on a phone. Nothing here
// touches three.js; the phone UI is loaded only when a phone demo opens.
import { lazy, Suspense, useEffect, useRef } from 'react';

const PhoneScreen = lazy(() => import('../desktop/PhoneScreen.jsx'));

// Which projects can be tried, and how. FocusLock has a Windows half and an
// Android half.
export const DEMOS = {
  focuslock: [
    { kind: 'web', label: 'Windows app', src: '/apps/focuslock/' },
    { kind: 'phone', label: 'Android app', app: 'focuslock' },
  ],
  expense: [{ kind: 'phone', label: 'Android app', app: 'expense' }],
  basket: [{ kind: 'phone', label: 'Android app', app: 'basketproof' }],
  darksentinel: [{ kind: 'web', label: 'Dashboard', src: '/apps/darksentinel/' }],
  crisiswatch: [{ kind: 'web', label: 'Web app', src: '/apps/crisiswatch/' }],
  fraud: [{ kind: 'web', label: 'Dashboard', src: '/apps/fraud/' }],
};

function PhoneDemo({ app, onClose }) {
  // PhoneScreen listens for this on mount; a child's effects run first, so
  // the listener is in place by the time this fires.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('phone:open-app', { detail: { app } }));
  }, [app]);
  return <PhoneScreen mode="stage" embedded interactive onExit={onClose} />;
}

export default function DemoPanel({ project, demo, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [project.id, demo.label]);
  useEffect(() => {
    const onKey = (event) => {
      // The phone handles its own Escape (back to its home screen first).
      if (event.key === 'Escape' && !event.target?.closest?.('.phone-screen')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="work-demo" aria-label={`${project.name} live demo`} data-testid="work-demo" data-demo-kind={demo.kind}>
      <header className="work-demo-head">
        <div>
          <p className="mono work-demo-kicker">LIVE DEMO · SAMPLE DATA</p>
          <h2 className="work-demo-title">{project.name} <span>{demo.label}</span></h2>
        </div>
        <div className="work-demo-actions">
          {demo.kind === 'web' && (
            <a className="mono work-demo-action" href={demo.src} target="_blank" rel="noopener noreferrer">NEW TAB ↗</a>
          )}
          <button ref={closeRef} type="button" className="mono work-demo-action" onClick={onClose} aria-label="Close demo">CLOSE ✕</button>
        </div>
      </header>
      <div className="work-demo-body">
        {demo.kind === 'web' ? (
          <iframe key={demo.src} className="work-demo-frame" src={demo.src} title={`${project.name} ${demo.label}`} />
        ) : (
          <Suspense fallback={<p className="mono work-demo-loading">LOADING THE PHONE…</p>}>
            <PhoneDemo app={demo.app} onClose={onClose} />
          </Suspense>
        )}
      </div>
    </aside>
  );
}
