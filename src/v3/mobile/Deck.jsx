// ============================================================================
// Deck — mobile surface. A dense, scrolling page: who I am, the résumé one tap
// away, and project cards with real previews. The phone's gyroscope still
// nudges the preview images; taps and section changes give haptic feedback.
// The 3D room is optional (best in landscape).
// ============================================================================

import { useEffect, useMemo, useRef } from 'react';
import '../tokens.css';
import { identity, contact, projects, featuredProjectIds, moreProjectIds } from '../content/index.js';
import { prefersReducedMotion, setOverride } from '../lib/capability.js';
import { useGyro } from './useGyro.js';

const PREVIEW = {
  focuslock: '/previews/focuslock.jpg',
  darksentinel: '/previews/darksentinel.jpg',
  crisiswatch: '/previews/crisiswatch.jpg',
  fraud: '/previews/fraud.jpg',
  portfolio3d: '/og.jpg',
};
const SHIFT = 10;

const css = `
  .escape-link { display: none !important; }
  .deck-root { background: var(--void); color: var(--bone); font-family: var(--font-display); min-height: 100dvh; padding-bottom: env(safe-area-inset-bottom); }
  .deck-wrap { max-width: 560px; margin: 0 auto; padding: max(1.25rem, env(safe-area-inset-top)) 1.1rem 2rem; display: flex; flex-direction: column; gap: 1.1rem; }
  .deck-pill { align-self: flex-start; display: inline-flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--bone); border: var(--hair) solid var(--faint); padding: .4rem .75rem; border-radius: 999px; }
  .deck-pill i { width: 7px; height: 7px; border-radius: 50%; background: #3ddc84; }
  .deck-name { font-size: clamp(2.4rem, 12vw, 3.2rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.02; margin: 0; }
  .deck-role { color: var(--dim); font-size: .875rem; }
  .deck-lede { font-size: 1.05rem; line-height: 1.45; max-width: 36ch; }
  .deck-cta { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
  .deck-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; font-size: .9rem; color: var(--bone); border: var(--hair) solid var(--faint); text-decoration: none; background: var(--void-lift); font-family: inherit; cursor: pointer; }
  .deck-btn--primary { background: var(--signal); color: var(--void); border-color: var(--signal); font-weight: 600; }
  .deck-btn:active { opacity: .7; }
  .deck-links { display: flex; gap: 1.4rem; }
  .deck-link { display: inline-flex; align-items: center; min-height: 44px; font-size: .875rem; color: var(--bone); border: 0; border-bottom: var(--hair) solid var(--faint); text-decoration: none; background: none; font-family: inherit; cursor: pointer; padding: 0; }
  .deck-room { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .85rem 1rem; background: var(--void-lift); border: var(--hair) solid var(--faint); text-align: left; color: var(--bone); font-family: inherit; cursor: pointer; width: 100%; }
  .deck-room b { display: block; font-weight: 500; font-size: .95rem; }
  .deck-room span span { display: block; color: var(--dim); font-size: .8125rem; margin-top: .15rem; }
  .deck-room .deck-rot { font-size: 1.5rem; color: var(--signal); }
  .deck-h { font-size: .8125rem; color: var(--dim); letter-spacing: .12em; text-transform: uppercase; margin: .6rem 0 -.2rem; }
  .deck-card { background: var(--void-lift); border: var(--hair) solid var(--faint); overflow: hidden; display: flex; flex-direction: column; opacity: 0; transform: translateY(14px); transition: opacity .5s var(--ease), transform .5s var(--ease); }
  .deck-card.is-in { opacity: 1; transform: none; }
  .deck-shot { aspect-ratio: 3 / 2; overflow: hidden; background: #0d0d10; }
  .deck-shot img { width: calc(100% + ${SHIFT * 2}px); height: calc(100% + ${SHIFT * 2}px); margin: -${SHIFT}px; object-fit: cover; object-position: top; display: block; will-change: transform; }
  .deck-body { padding: .9rem 1rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
  .deck-kicker { color: var(--dim); font-size: .8125rem; }
  .deck-title { font-size: 1.45rem; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
  .deck-desc { color: var(--bone); font-size: .95rem; line-height: 1.4; }
  .deck-tech { display: flex; flex-wrap: wrap; gap: .4rem; list-style: none; margin: 0; padding: 0; }
  .deck-tech li { font-family: var(--font-mono); font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); border: var(--hair) solid var(--faint); padding: .25rem .5rem; }
  .deck-more { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .deck-more li { display: flex; align-items: center; gap: .8rem; padding: .7rem 0; border-bottom: var(--hair) solid var(--faint); }
  .deck-more img { width: 64px; height: 48px; object-fit: cover; object-position: top; border: var(--hair) solid var(--faint); flex: none; }
  .deck-more .deck-ph { display: grid; place-items: center; color: var(--dim); font-size: 1.3rem; width: 64px; height: 48px; flex: none; background: var(--void-lift); border: var(--hair) solid var(--faint); }
  .deck-more b { display: block; font-weight: 500; font-size: .95rem; }
  .deck-more span { display: block; color: var(--dim); font-size: .8125rem; line-height: 1.3; }
  .deck-foot { display: flex; justify-content: space-between; margin-top: .5rem; }
  @media (prefers-reduced-motion: reduce) { .deck-card { opacity: 1; transform: none; transition: none; } .deck-shot img { transform: none !important; } }
`;

const buzz = (ms = 8) => {
  if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(ms);
};

function ProjectCard({ project, tilt, reduced }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('is-in');
        buzz(6);
        io.disconnect();
      }
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const src = PREVIEW[project.id];
  const live = project.links?.live?.startsWith('http') ? project.links.live : '';
  const shift = reduced ? undefined : { transform: `translate3d(${(tilt.x * SHIFT).toFixed(1)}px, ${(tilt.y * SHIFT).toFixed(1)}px, 0)` };

  return (
    <article className="deck-card" ref={ref}>
      {src && (
        <div className="deck-shot">
          <img src={src} alt={`${project.name} screenshot`} loading="lazy" style={shift} />
        </div>
      )}
      <div className="deck-body">
        <p className="mono deck-kicker">{project.kind} &middot; {project.year}</p>
        <h2 className="deck-title">{project.name}</h2>
        <p className="deck-desc">{project.summary || project.tagline}</p>
        {project.tech?.length > 0 && (
          <ul className="deck-tech" aria-label={`${project.name} technologies`}>
            {project.tech.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        {(live || project.links?.github) && (
          <div className="deck-links">
            {live && <a className="mono deck-link" href={live} target="_blank" rel="noopener noreferrer" onClick={() => buzz()}>VIEW LIVE</a>}
            {project.links?.github && <a className="mono deck-link" href={project.links.github} target="_blank" rel="noopener noreferrer" onClick={() => buzz()}>SOURCE</a>}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Deck() {
  const { tilt, permission, request } = useGyro();
  const reduced = prefersReducedMotion();
  const featured = useMemo(() => featuredProjectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean), []);
  const more = useMemo(() => moreProjectIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean), []);

  const enterRoom = () => {
    buzz(12);
    setOverride('scan');
    window.location.reload();
  };

  return (
    <>
      <style>{css}</style>
      <main className="deck-root">
        <div className="deck-wrap">
          <span className="deck-pill"><i /> Open to remote internships</span>
          <div>
            <h1 className="deck-name">{identity.name}</h1>
            <p className="mono deck-role">{identity.role} &middot; {identity.location}</p>
          </div>
          <p className="deck-lede">{identity.tagline}</p>
          <div className="deck-cta">
            <a className="mono deck-btn deck-btn--primary" href={contact.resume} target="_blank" rel="noopener noreferrer" onClick={() => buzz()}>RESUME</a>
            <a className="mono deck-btn" href={`mailto:${contact.email}`} onClick={() => buzz()}>EMAIL</a>
          </div>
          <div className="deck-links">
            <a className="mono deck-link" href={contact.github} target="_blank" rel="noopener noreferrer">GITHUB</a>
            <a className="mono deck-link" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LINKEDIN</a>
            <a className="mono deck-link" href="/work/">FULL DETAILS</a>
          </div>

          <button type="button" className="deck-room" onClick={enterRoom}>
            <span>
              <b>Step into the 3D room</b>
              <span>Optional. Best with your phone turned sideways.</span>
            </span>
            <span className="deck-rot" aria-hidden="true">&#x21BB;</span>
          </button>
          {permission === 'prompt' && (
            <button type="button" className="mono deck-link" onClick={request}>TAP TO ENABLE TILT</button>
          )}

          <h2 className="mono deck-h">Selected projects</h2>
          {featured.map((p) => <ProjectCard key={p.id} project={p} tilt={tilt} reduced={reduced} />)}

          <h2 className="mono deck-h">More projects</h2>
          <ul className="deck-more">
            {more.map((p) => (
              <li key={p.id}>
                {PREVIEW[p.id] ? <img src={PREVIEW[p.id]} alt="" loading="lazy" /> : <span className="deck-ph" aria-hidden="true">{p.name[0]}</span>}
                <div><b>{p.name}</b><span>{p.tagline}</span></div>
              </li>
            ))}
          </ul>

          <div className="deck-foot">
            <a className="mono deck-link" href="/work/">TEXT VERSION</a>
            <button type="button" className="mono deck-link" onClick={enterRoom}>DESKTOP VERSION</button>
          </div>
        </div>
      </main>
    </>
  );
}
