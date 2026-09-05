// ============================================================================
// v3 app shell.
//
// One content source, three surfaces:
//   scan   — desktop: the Gaussian-splat capture of the room
//   deck   — touch: vertical gyro-driven card deck
//   static — no WebGL2 / software GPU / data-saver: straight to /work
//
// HashRouter so it deploys to any static host with no rewrite rules.
// Every surface is lazy so the fast path never downloads the 3D bundle.
// ============================================================================

import { Suspense, lazy, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './tokens.css';
import { resolveSurface } from './lib/capability.js';

const Scan = lazy(() => import('./desktop/Scan.jsx'));
const Deck = lazy(() => import('./mobile/Deck.jsx'));
const Work = lazy(() => import('./work/Work.jsx'));

/** Minimal first paint. Never a blank screen — see ScanIntro's same rule. */
function Booting() {
  return (
    <div className="boot-root">
      <style>{`
        .boot-root {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--void);
        }
        .boot-root p {
          font-family: var(--font-mono);
          font-size: var(--t-data);
          letter-spacing: var(--track-data);
          color: var(--dim);
        }
      `}</style>
      <p>INITIALISING</p>
    </div>
  );
}

function Home() {
  // Resolved once per load. A visitor who overrides surface reloads the page,
  // so there is no need to react to live media-query changes here.
  const surface = useMemo(() => resolveSurface(), []);

  if (surface === 'static') return <Navigate to="/work" replace />;
  return surface === 'deck' ? <Deck /> : <Scan />;
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Booting />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          {/* Old v2 deep links land somewhere sensible rather than blank. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
