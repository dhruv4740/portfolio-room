// ============================================================================
// v3 app shell.
//
// One content source, three surfaces:
//   scan   — desktop: the modeled 3D room
//   deck   — touch: vertical gyro-driven card deck
//   static — no WebGL2 / software GPU / data-saver: straight to /work
//
// HashRouter so it deploys to any static host with no rewrite rules.
// Every surface is lazy so the fast path never downloads the 3D bundle.
// ============================================================================

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './tokens.css';
import { resolveSurface } from './lib/capability.js';
import { reportProgress, subscribeProgress } from './lib/loadProgress.js';

// The scan bundle is one weighted task; the hand bake reports its own bytes.
const Scan = lazy(() => {
  reportProgress('bundle', 0, 1_000_000);
  return import('./desktop/Scan.jsx').then(m => { reportProgress('bundle', 1_000_000, 1_000_000); return m; });
});
const Deck = lazy(() => import('./mobile/Deck.jsx'));
const CommandPalette = lazy(() => import('./ui/CommandPalette.jsx'));

/** Minimal first paint. Never a blank screen — see ScanIntro's same rule. */
function Booting() {
  const [progress, setProgress] = useState(0);
  useEffect(() => subscribeProgress(s => setProgress(p => Math.max(p, s.progress))), []);
  return (
    <div className="boot-root">
      <style>{`
        .boot-root {
          position: fixed; inset: 0;
          display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center;
          background: var(--void);
        }
        .boot-bar { width: 220px; height: 2px; background: #1d2122; overflow: hidden; }
        .boot-bar i { display: block; height: 100%; background: var(--signal, #e4572e); transform-origin: left; transition: transform .2s; }
        .boot-root p {
          font-family: var(--font-mono);
          font-size: var(--t-data);
          letter-spacing: var(--track-data);
          color: var(--dim);
        }
      `}</style>
      <p>LOADING THE ROOM · {Math.round(progress * 100)}%</p>
      <div className="boot-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

/** /work is a static page (work/index.html), not a route in this app. Old
 *  /#/work links and the no-WebGL surface both land there with a real load,
 *  so the router and the 3D chunks are never part of the recruiter path. */
function GoToWork() {
  useEffect(() => { window.location.replace('/work/'); }, []);
  return null;
}

function Home() {
  // Resolved once per load. A visitor who overrides surface reloads the page,
  // so there is no need to react to live media-query changes here.
  const surface = useMemo(() => {
    const s = resolveSurface();
    // Overlap the hand bake with the scan bundle download. This runs during
    // render because <Scan> suspends, so Home's effects would not run until
    // the bundle had already arrived. ?hands=authored loads its own later.
    if (s === 'scan' && !new URLSearchParams(window.location.search).get('hands')) {
      import('./desktop/handAssets.js').then(m => m.prefetchHandAssets('hands-v1')).catch(() => {});
    }
    return s;
  }, []);

  if (surface === 'static') return <GoToWork />;
  return surface === 'deck' ? <Deck /> : <Scan />;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}><CommandPalette /></Suspense>
      <Suspense fallback={<Booting />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<GoToWork />} />
          {/* Deep links into the room; Scan consumes them once it is ready. */}
          {['/os/:app', '/phone', '/phone/:app', '/about', '/contact', '/room/:object'].map(path => (
            <Route key={path} path={path} element={<Home />} />
          ))}
          {/* Old v2 deep links land somewhere sensible rather than blank. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
