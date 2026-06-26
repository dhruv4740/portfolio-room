// src/Shell.jsx — the v2 shell: HashRouter + shared Nav + lazy routes.
// HashRouter so it works on any static host without server rewrites.
import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';

const Flagship = lazy(() => import('./routes/Flagship.jsx'));
const Lab = lazy(() => import('./routes/Lab.jsx'));
const LabEntry = lazy(() => import('./routes/LabEntry.jsx'));
const Anthology = lazy(() => import('./routes/Anthology.jsx'));

function Fallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#070708',
        color: '#38e1ff',
        font: "12px 'JetBrains Mono', monospace",
        letterSpacing: '0.24em',
      }}
    >
      LOADING…
    </div>
  );
}

export default function Shell() {
  return (
    <HashRouter>
      <Nav />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Flagship />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/lab/:id" element={<LabEntry />} />
          <Route path="/anthology" element={<Anthology />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
