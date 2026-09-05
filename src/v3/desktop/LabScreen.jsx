// ============================================================================
// LabScreen — "the monitor in the room is alive".
//
// The 17 lab experiments already ship as standalone pages in public/lab/.
// Rather than reimplement them, this overlay runs them in an iframe, framed as
// the monitor's screen. The camera has already parked at the monitor anchor by
// the time this opens, so it reads as pushing INTO the screen in the capture.
//
// The iframe is only mounted while open — 17 WebGL contexts would otherwise
// sit idle burning GPU.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { LAB_ENTRIES } from '../../lab/registry.js';

export default function LabScreen({ open, onClose }) {
  const [index, setIndex] = useState(0);
  const closeRef = useRef(null);
  const entry = LAB_ENTRIES[index];

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Reset to the first experiment each time the screen is entered.
  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  return (
    <div
      className={`lab-screen-root${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      role="dialog"
      aria-modal={open ? 'true' : undefined}
      aria-label="Lab experiments"
    >
      <style>{css}</style>

      <div className="lab-frame">
        <div className="lab-bar">
          <span className="mono lab-count">
            {String(index + 1).padStart(2, '0')} / {String(LAB_ENTRIES.length).padStart(2, '0')}
          </span>
          <span className="lab-title">{entry?.title}</span>
          <button ref={closeRef} className="mono lab-close" onClick={onClose}>
            ESC — CLOSE
          </button>
        </div>

        <div className="lab-viewport">
          {open && entry && (
            <iframe
              key={entry.id}
              src={entry.src}
              title={entry.title}
              loading="lazy"
              // Experiments are first-party static pages, but sandbox them
              // anyway so a stray script can't reach the parent document.
              sandbox="allow-scripts allow-same-origin allow-pointer-lock"
            />
          )}
        </div>

        <div className="lab-rail">
          {LAB_ENTRIES.map((e, i) => (
            <button
              key={e.id}
              className={`lab-chip mono${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
              title={e.blurb}
            >
              <span className="lab-letter">{e.letter}</span>
              <span className="lab-name">{e.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const css = `
.lab-screen-root {
  position: fixed;
  inset: 0;
  z-index: var(--z-panel);
  background: var(--void);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gutter);
  opacity: 0;
  visibility: hidden;
  /* Scale from the monitor's approximate position rather than fading flat —
     it reads as entering the screen instead of a modal appearing. */
  transform: scale(0.94);
  transition: opacity var(--d-transition) var(--ease),
              transform var(--d-transition) var(--ease),
              visibility 0s linear var(--d-transition);
}
.lab-screen-root.is-open {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  transition-delay: 0s;
}

.lab-frame {
  width: 100%;
  max-width: 1400px;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border: var(--hair) solid var(--faint);
  background: var(--void-lift);
}

.lab-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-bottom: var(--hair) solid var(--faint);
}
.lab-count { color: var(--signal); }
.lab-title { font-size: 0.9rem; font-weight: 500; flex: 1; }
.lab-close {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
  transition: color var(--d-feedback) var(--ease);
}
.lab-close:hover { color: var(--signal); }

.lab-viewport { position: relative; background: var(--void); overflow: hidden; }
.lab-viewport iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.lab-rail {
  display: flex;
  gap: 0;
  overflow-x: auto;
  border-top: var(--hair) solid var(--faint);
  scrollbar-width: thin;
}
.lab-chip {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  flex: none;
  padding: 0.6rem 0.85rem;
  border-right: var(--hair) solid var(--faint);
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  text-transform: uppercase;
  white-space: nowrap;
  transition: color var(--d-feedback) var(--ease),
              background-color var(--d-feedback) var(--ease);
}
.lab-chip:hover { color: var(--bone); background: rgba(255,255,255,0.03); }
.lab-chip.is-active { color: var(--void); background: var(--signal); }
.lab-letter { font-weight: 500; }

@media (max-width: 640px) {
  .lab-name { display: none; }
}
`;
