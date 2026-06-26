import React, { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LAB_ENTRIES } from '../lab/registry.js';

const overlayCSS = `
  .lab-entry-overlay {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    background: rgba(7,7,8,0.82);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-family: 'JetBrains Mono', 'Fira Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: #e8e8ec;
  }

  .lab-entry-overlay a {
    color: #38e1ff;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .lab-entry-overlay a:hover { color: #fff; }

  .lab-entry-sep {
    color: rgba(255,255,255,0.2);
    user-select: none;
  }

  .lab-entry-frame {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    background: #000;
  }

  .lab-entry-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #070708;
    color: #e8e8ec;
    font-family: 'Space Grotesk', sans-serif;
    gap: 16px;
    text-align: center;
    padding: 24px;
  }

  .lab-entry-not-found h2 {
    font-size: 20px;
    font-weight: 600;
    color: #6b6b78;
  }

  .lab-entry-not-found a {
    font-size: 14px;
    color: #38e1ff;
    text-decoration: none;
  }

  .lab-entry-not-found a:hover { color: #fff; }

  .lab-entry-react {
    position: fixed;
    inset: 0;
    background: #000;
  }

  .lab-entry-suspense {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #070708;
    color: #6b6b78;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

const Room = React.lazy(() => import('../App.jsx'));

function Overlay({ entry }) {
  return (
    <div className="lab-entry-overlay">
      <Link to="/lab">← lab</Link>
      <span className="lab-entry-sep">|</span>
      {entry.src && (
        <a href={entry.src} target="_blank" rel="noreferrer">
          open in new tab ↗
        </a>
      )}
      {!entry.src && (
        <span style={{ color: '#6b6b78' }}>{entry.title}</span>
      )}
    </div>
  );
}

export default function LabEntry() {
  const { id } = useParams();
  const entry = LAB_ENTRIES.find((e) => e.id === id);

  if (!entry) {
    return (
      <>
        <style>{overlayCSS}</style>
        <div className="lab-entry-not-found">
          <h2>concept not found</h2>
          <Link to="/lab">← back to lab</Link>
        </div>
      </>
    );
  }

  if (entry.kind === 'react') {
    return (
      <>
        <style>{overlayCSS}</style>
        <Overlay entry={entry} />
        <div className="lab-entry-react">
          <Suspense
            fallback={
              <div className="lab-entry-suspense">loading…</div>
            }
          >
            <Room />
          </Suspense>
        </div>
      </>
    );
  }

  // kind === 'iframe'
  return (
    <>
      <style>{overlayCSS}</style>
      <Overlay entry={entry} />
      <iframe
        className="lab-entry-frame"
        src={entry.src}
        title={entry.title}
        allow="autoplay; microphone; fullscreen"
      />
    </>
  );
}
