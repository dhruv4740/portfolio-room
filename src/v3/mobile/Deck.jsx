// ============================================================================
// Deck — mobile surface. A vertical, full-bleed, swipeable card deck
// (Stories/Reels format) where the phone's gyroscope drives parallax.
// Not a degraded copy of the desktop splat scan — a different genre.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../tokens.css';
import { identity, contact, projects, featuredProjectIds, moreProjectIds } from '../content/index.js';
import { prefersReducedMotion, setOverride } from '../lib/capability.js';
import { useGyro } from './useGyro.js';

const BG_MULT = 18;
const FG_MULT = 6;

const css = `
  .deck-root {
    position: relative;
    background: var(--void);
    color: var(--bone);
    font-family: var(--font-display);
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }

  .deck-scroll {
    height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .deck-scroll::-webkit-scrollbar {
    display: none;
  }

  .deck-card {
    position: relative;
    height: 100dvh;
    width: 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  .deck-card + .deck-card {
    border-top: var(--hair) solid var(--faint);
  }

  .deck-bg {
    position: absolute;
    inset: -24px;
    will-change: transform;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .deck-bg-index {
    font-size: clamp(9rem, 42vw, 15rem);
    font-weight: 600;
    color: var(--void-lift);
    letter-spacing: 0;
    user-select: none;
  }

  .deck-fg {
    position: relative;
    z-index: 2;
    will-change: transform;
    width: 100%;
    padding: var(--gutter);
    padding-right: 1.75rem;
    padding-bottom: clamp(4.5rem, 14vh, 6rem);
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .escape-link { display: none !important; }

  .deck-kicker {
    color: var(--dim);
    font-size: 0.875rem;
  }

  .deck-cta {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .deck-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0 1.4rem;
    font-size: 0.95rem;
    color: var(--bone);
    border: var(--hair) solid var(--faint);
    text-decoration: none;
  }

  .deck-btn--primary {
    background: var(--signal);
    color: var(--void);
    border-color: var(--signal);
  }

  .deck-hint {
    color: var(--dim);
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .deck-more {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .deck-more li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    border-bottom: var(--hair) solid var(--faint);
    font-size: 0.95rem;
  }

  .deck-more span:last-child {
    color: var(--dim);
    text-align: right;
  }

  .deck-title {
    font-size: var(--t-hero);
    font-weight: 600;
    letter-spacing: var(--track-hero);
    line-height: 1.02;
  }

  .deck-title--card {
    font-size: var(--t-head);
  }

  .deck-statement,
  .deck-tagline,
  .deck-desc {
    color: var(--bone);
    max-width: 34ch;
  }

  .deck-tagline {
    color: var(--dim);
  }

  .deck-tap {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 0.2rem;
    color: var(--signal);
    border-bottom: var(--hair) solid var(--signal);
    transition: opacity var(--d-feedback) var(--ease);
  }

  .deck-tap:active {
    opacity: 0.6;
  }

  .deck-note {
    max-width: 34ch;
    color: var(--bone);
  }

  .deck-note-label {
    display: block;
    margin-bottom: 0.25rem;
  }

  .deck-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
  }

  .deck-tech li {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    color: var(--dim);
    border: var(--hair) solid var(--faint);
    padding: 0.3rem 0.55rem;
  }

  .deck-links,
  .deck-contact-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
  }

  .deck-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--bone);
    border-bottom: var(--hair) solid var(--faint);
    transition: color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
  }

  .deck-link:hover,
  .deck-link:focus-visible {
    color: var(--signal);
    border-color: var(--signal);
  }

  .deck-progress {
    position: fixed;
    right: max(0.9rem, env(safe-area-inset-right));
    top: 50%;
    transform: translateY(-50%);
    z-index: var(--z-hud);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    pointer-events: none;
  }

  .deck-progress-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--faint);
    transition: background var(--d-transition) var(--ease), transform var(--d-transition) var(--ease);
  }

  .deck-progress-dot.is-active {
    background: var(--signal);
    transform: scale(1.6);
  }

  .deck-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: max(0.6rem, env(safe-area-inset-bottom));
    z-index: var(--z-hud);
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    pointer-events: none;
  }

  .deck-footer-link {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 0.6rem;
    font-size: 0.875rem;
    color: var(--dim);
    transition: color var(--d-feedback) var(--ease);
  }

  .deck-footer-link:hover,
  .deck-footer-link:focus-visible {
    color: var(--bone);
  }

  @media (prefers-reduced-motion: reduce) {
    .deck-bg,
    .deck-fg {
      transform: none !important;
    }
  }
`;

function ProjectCard({ project }) {
  const live = project.links?.live?.startsWith('http') ? project.links.live : '';
  const hasLinks = Boolean(live || project.links?.github);

  return (
    <>
      <p className="mono deck-kicker">
        {project.kind} &middot; {project.year}
      </p>
      <h2 className="deck-title deck-title--card">{project.name}</h2>
      <p className="deck-desc">{project.summary || project.tagline}</p>

      {project.tech?.length > 0 && (
        <ul className="deck-tech" aria-label={`${project.name} technologies`}>
          {project.tech.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      )}

      {hasLinks && (
        <div className="deck-links">
          {live && (
            <a className="mono deck-link" href={live} target="_blank" rel="noopener noreferrer">
              VIEW LIVE
            </a>
          )}
          {project.links.github && (
            <a className="mono deck-link" href={project.links.github} target="_blank" rel="noopener noreferrer">
              SOURCE
            </a>
          )}
        </div>
      )}
    </>
  );
}

function MoreCard() {
  const list = moreProjectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean);
  return (
    <>
      <p className="mono deck-kicker">MORE PROJECTS</p>
      <ul className="deck-more">
        {list.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            <span>{p.tagline}</span>
          </li>
        ))}
      </ul>
      <a className="mono deck-link" href="/work/">ALL DETAILS</a>
    </>
  );
}

function ContactCard() {
  const hasAny =
    contact.email || contact.github || contact.linkedin || contact.twitter || contact.resume;

  return (
    <>
      <p className="mono deck-kicker">GET IN TOUCH</p>
      <h2 className="deck-title deck-title--card">Let&rsquo;s talk.</h2>
      {hasAny && (
        <div className="deck-contact-list">
          {contact.email && (
            <a className="mono deck-link" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          )}
          {contact.github && (
            <a className="mono deck-link" href={contact.github} target="_blank" rel="noopener noreferrer">
              {contact.githubLabel || contact.github}
            </a>
          )}
          {contact.linkedin && (
            <a className="mono deck-link" href={contact.linkedin} target="_blank" rel="noopener noreferrer">
              LINKEDIN
            </a>
          )}
          {contact.twitter && (
            <a className="mono deck-link" href={contact.twitter} target="_blank" rel="noopener noreferrer">
              TWITTER
            </a>
          )}
          {contact.resume && (
            <a className="mono deck-link" href={contact.resume} target="_blank" rel="noopener noreferrer">
              RESUME
            </a>
          )}
        </div>
      )}
    </>
  );
}

function buildCards() {
  return [
    { type: 'intro', id: 'intro' },
    ...featuredProjectIds
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean)
      .map((project) => ({ type: 'project', id: project.id, project })),
    { type: 'more', id: 'more' },
    { type: 'contact', id: 'contact' },
  ];
}

export default function Deck() {
  const { tilt, permission, request } = useGyro();
  const reduced = prefersReducedMotion();
  const cards = useMemo(buildCards, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef([]);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        const idx = Number(top.target.dataset.index);
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { threshold: 0.6 }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [cards.length]);

  useEffect(() => {
    if (activeIndex !== prevIndexRef.current) {
      prevIndexRef.current = activeIndex;
      navigator.vibrate?.(8);
    }
  }, [activeIndex]);

  const setCardRef = useCallback((index) => (el) => {
    cardRefs.current[index] = el;
  }, []);

  const layerStyle = (mult) =>
    reduced
      ? undefined
      : { transform: `translate3d(${(tilt.x * mult).toFixed(2)}px, ${(tilt.y * mult).toFixed(2)}px, 0)` };

  const switchToScan = () => {
    setOverride('scan');
    window.location.reload();
  };

  return (
    <>
      <style>{css}</style>
      <div className="deck-root">
        <div className="deck-progress" aria-hidden="true">
          {cards.map((card, i) => (
            <span
              key={card.id}
              className={`deck-progress-dot${i === activeIndex ? ' is-active' : ''}`}
            />
          ))}
        </div>

        <div className="deck-scroll" role="region" aria-label="Portfolio deck">
          {cards.map((card, i) => (
            <section key={card.id} className="deck-card" data-index={i} ref={setCardRef(i)}>
              <div className="deck-bg" style={layerStyle(BG_MULT)} aria-hidden="true">
                <span className="deck-bg-index mono">{String(i + 1).padStart(2, '0')}</span>
              </div>

              <div className="deck-fg" style={layerStyle(FG_MULT)}>
                {card.type === 'intro' && (
                  <>
                    <p className="mono deck-kicker">{identity.role}</p>
                    <h1 className="deck-title">{identity.name}</h1>
                    <p className="deck-statement">{identity.tagline}</p>
                    <div className="deck-cta">
                      <a className="mono deck-btn deck-btn--primary" href={contact.resume} target="_blank" rel="noopener noreferrer">
                        RESUME
                      </a>
                      <a className="mono deck-btn" href={`mailto:${contact.email}`}>EMAIL</a>
                    </div>
                    {permission === 'prompt' && (
                      <button type="button" className="mono deck-tap" onClick={request}>
                        TAP TO ENABLE TILT
                      </button>
                    )}
                    <p className="mono deck-hint">SWIPE UP FOR PROJECTS &uarr;</p>
                  </>
                )}

                {card.type === 'more' && <MoreCard />}

                {card.type === 'project' && <ProjectCard project={card.project} />}

                {card.type === 'contact' && <ContactCard />}
              </div>
            </section>
          ))}
        </div>

        <footer className="deck-footer">
          <a className="mono deck-footer-link" href="/work/">
            TEXT VERSION
          </a>
          <button type="button" className="mono deck-footer-link" onClick={switchToScan}>
            DESKTOP VERSION
          </button>
        </footer>
      </div>
    </>
  );
}
