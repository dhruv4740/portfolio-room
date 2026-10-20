// ============================================================================
// AnchorPanel.jsx — slide-in detail panel for a selected room anchor.
// Presentational only: receives anchor/project data and open state via props.
//
// Props:
//   anchor   { id, label, ref, readout, body, ... } | undefined
//   project  { name, year, tagline, description, decision, broke, tech, links } | undefined
//   open     boolean
//   onClose  () => void
// ============================================================================

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

export default function AnchorPanel({ anchor, project, open, onClose }) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Open/close: move focus in, trap it, and restore it on close.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement;
      const raf = requestAnimationFrame(() => {
        const focusable = getFocusable(panelRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else if (panelRef.current) {
          panelRef.current.focus();
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
    return undefined;
  }, [open]);

  // Escape to close + Tab trap, only while open.
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  const label = anchor && anchor.label ? anchor.label : '';
  const readout = anchor && anchor.readout ? anchor.readout : '';
  const body = anchor && anchor.body ? anchor.body : '';

  const hasProject = Boolean(project);
  const tech = hasProject && Array.isArray(project.tech) ? project.tech.filter(Boolean) : [];
  const hasDecision = hasProject && Boolean(project.decision);
  const hasBroke = hasProject && Boolean(project.broke);
  const links = hasProject && project.links ? project.links : {};
  const hasLive = Boolean(links.live);
  const hasGithub = Boolean(links.github);
  const hasLinks = hasLive || hasGithub;

  const dialogLabel = label || (hasProject && project.name) || 'Anchor detail';

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`anchor-panel-root${open ? ' is-open' : ''}`}
        aria-hidden={!open}
      >
        <div
          ref={panelRef}
          className="panel"
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          tabIndex={-1}
        >
          <button type="button" className="close-btn mono" onClick={onClose} aria-label="Close panel">
            CLOSE [ESC]
          </button>

          {(label || readout) && (
            <header className="panel-header">
              {label && <div className="panel-label mono">{label}</div>}
              {readout && <div className="panel-readout mono">{readout}</div>}
            </header>
          )}

          {hasProject ? (
            <div className="panel-body">
              {project.name && <h2 className="proj-name">{project.name}</h2>}

              {(project.year || project.tagline) && (
                <div className="proj-meta mono">
                  {project.year && <span className="proj-year">{project.year}</span>}
                  {project.year && project.tagline && <span className="meta-sep">&middot;</span>}
                  {project.tagline && <span className="proj-tagline">{project.tagline}</span>}
                </div>
              )}

              {project.description && <p className="proj-desc">{project.description}</p>}

              {tech.length > 0 && (
                <ul className="proj-tech">
                  {tech.map((t) => (
                    <li key={t} className="tech-tag mono">
                      {t}
                    </li>
                  ))}
                </ul>
              )}

              {hasDecision && (
                <div className="proj-block">
                  <div className="block-label mono">DECISION</div>
                  <p className="block-body">{project.decision}</p>
                </div>
              )}

              {hasBroke && (
                <div className="proj-block">
                  <div className="block-label mono">WHAT BROKE</div>
                  <p className="block-body">{project.broke}</p>
                </div>
              )}

              {hasLinks && (
                <div className="proj-links mono">
                  {hasLive && (
                    <a href={links.live} target="_blank" rel="noreferrer" className="proj-link">
                      LIVE &rarr;
                    </a>
                  )}
                  {hasGithub && (
                    <a href={links.github} target="_blank" rel="noreferrer" className="proj-link">
                      GITHUB &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            body && (
              <div className="panel-body">
                <p className="anchor-body">{body}</p>
                {anchor.href && (
                  <div className="proj-links mono">
                    <a href={anchor.href} target="_blank" rel="noreferrer" className="proj-link">{anchor.hrefLabel || 'OPEN'}</a>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

const CSS = `
.anchor-panel-root {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(420px, 100vw);
  z-index: var(--z-panel);
  pointer-events: none;
}

.anchor-panel-root .panel {
  position: absolute;
  inset: 0;
  background: var(--void-lift);
  border-left: var(--hair) solid var(--faint);
  padding: calc(var(--gutter) * 1.4) var(--gutter) var(--gutter);
  overflow-y: auto;
  transform: translateX(100%);
  opacity: 0;
  transition: transform var(--d-transition) var(--ease), opacity var(--d-transition) var(--ease);
}

.anchor-panel-root.is-open {
  pointer-events: auto;
}

.anchor-panel-root.is-open .panel {
  transform: translateX(0);
  opacity: 1;
}

.anchor-panel-root .close-btn {
  position: absolute;
  top: var(--gutter);
  right: var(--gutter);
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  border: var(--hair) solid var(--faint);
  padding: 0.5em 0.75em;
  transition: color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
}

.anchor-panel-root .close-btn:hover {
  color: var(--signal);
  border-color: var(--signal);
}

.anchor-panel-root .panel-header {
  padding-bottom: 1em;
  margin-bottom: 1.2em;
  border-bottom: var(--hair) solid var(--faint);
}

.anchor-panel-root .panel-label {
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
  color: var(--bone);
  text-transform: uppercase;
}

.anchor-panel-root .panel-readout {
  margin-top: 0.4em;
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  text-transform: uppercase;
}

.anchor-panel-root .proj-name {
  font-family: var(--font-display);
  font-size: var(--t-head);
  letter-spacing: var(--track-hero);
  color: var(--bone);
  margin-bottom: 0.5em;
}

.anchor-panel-root .proj-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  text-transform: uppercase;
  margin-bottom: 1em;
}

.anchor-panel-root .meta-sep {
  color: var(--faint);
}

.anchor-panel-root .proj-desc,
.anchor-panel-root .anchor-body {
  font-family: var(--font-display);
  font-size: var(--t-body);
  color: var(--bone);
  line-height: 1.6;
  margin-bottom: 1.2em;
}

.anchor-panel-root .proj-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  list-style: none;
  margin-bottom: 1.2em;
}

.anchor-panel-root .tech-tag {
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--dim);
  border: var(--hair) solid var(--faint);
  padding: 0.3em 0.6em;
  text-transform: uppercase;
}

.anchor-panel-root .proj-block {
  margin-bottom: 1.2em;
  padding-top: 0.9em;
  border-top: var(--hair) solid var(--faint);
}

.anchor-panel-root .block-label {
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  color: var(--signal);
  text-transform: uppercase;
  margin-bottom: 0.5em;
}

.anchor-panel-root .block-body {
  font-family: var(--font-display);
  font-size: var(--t-body);
  color: var(--bone);
  line-height: 1.6;
}

.anchor-panel-root .proj-links {
  display: flex;
  gap: 1.2em;
  padding-top: 1em;
  border-top: var(--hair) solid var(--faint);
}

.anchor-panel-root .proj-link {
  font-size: var(--t-data);
  letter-spacing: var(--track-data);
  color: var(--bone);
  text-transform: uppercase;
  transition: color var(--d-feedback) var(--ease);
}

.anchor-panel-root .proj-link:hover {
  color: var(--signal);
}

@media (max-width: 768px) {
  .anchor-panel-root {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: min(80vh, 640px);
  }

  .anchor-panel-root .panel {
    transform: translateY(100%);
    border-left: none;
    border-top: var(--hair) solid var(--faint);
  }

  .anchor-panel-root.is-open .panel {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .anchor-panel-root .panel {
    transition: opacity var(--d-transition) var(--ease);
    transform: none;
  }

  .anchor-panel-root.is-open .panel {
    transform: none;
  }
}
`;
