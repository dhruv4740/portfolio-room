import { useCallback, useRef, useState } from 'react';
import '../tokens.css';
import {
  identity, contact, education, experience, achievements, skills, projects, featuredProjectIds,
} from '../content/index.js';
import DemoPanel, { DEMOS } from './DemoPanel.jsx';

/** Resolve a skill's `proof` ids to the project names they reference.
 *  Evidence, not a percentage bar — the whole point of the content model. */
function resolveProof(proofIds) {
  return proofIds
    .map((id) => projects.find((p) => p.id === id)?.name)
    .filter(Boolean);
}

const css = `
  /* ---- skip link --------------------------------------------------------- */

  .work-skip {
    position: absolute;
    left: 1rem;
    top: -4rem;
    background: var(--signal);
    color: var(--void);
    padding: 0.65rem 1rem;
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    z-index: 50;
    transition: top var(--d-feedback) var(--ease);
  }

  .work-skip:focus-visible {
    top: 1rem;
    outline-offset: 0;
  }


  /* Readable secondary text: --dim on --void is ~3.7:1; this is ~7:1. Scoped to /work. */
  .work-root { --dim: #9C9CA4; }

  .work-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.75rem;
  }

  .work-action {
    display: inline-flex;
    align-items: center;
    padding: 0.7rem 1.1rem;
    border: var(--hair) solid var(--faint);
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    transition: background var(--d-feedback) var(--ease), color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
  }

  .work-action:hover,
  .work-action:focus-visible { border-color: var(--dim); color: var(--bone); }

  .work-action--primary { background: var(--signal); border-color: var(--signal); color: var(--void); }
  .work-action--primary:hover,
  .work-action--primary:focus-visible { background: var(--bone); border-color: var(--bone); color: var(--void); }

  .work-wins {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    margin-top: 1.5rem;
  }

  .work-wins li {
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: 0.06em;
    color: var(--bone);
    border: var(--hair) solid var(--faint);
    padding: 0.35rem 0.65rem;
  }

  .work-wins li span { color: var(--signal); margin-right: 0.5em; text-transform: uppercase; }

  /* ---- experience / education ----------------------------------------------- */

  .work-timeline { list-style: none; display: flex; flex-direction: column; gap: 1.5rem; }

  .work-job { display: grid; grid-template-columns: 9.5rem 1fr; gap: 0.25rem 1.5rem; }
  .work-job-when { color: var(--dim); padding-top: 0.2rem; }
  .work-job-role { font-size: 1.15rem; font-weight: 500; }
  .work-job-org { color: var(--dim); }
  .work-job-detail { margin-top: 0.4rem; max-width: 62ch; }

  @media (max-width: 640px) {
    .work-job { grid-template-columns: 1fr; }
  }

  /* ---- project notes fold ---------------------------------------------------- */

  .work-more { margin-top: 1rem; border-top: var(--hair) solid var(--faint); }
  .work-more > summary {
    cursor: pointer;
    padding: 0.8rem 0;
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    color: var(--dim);
    list-style: none;
  }
  .work-more > summary::-webkit-details-marker { display: none; }
  .work-more > summary::before { content: '+ '; color: var(--signal); }
  .work-more[open] > summary::before { content: '− '; }
  .work-more > summary:hover,
  .work-more > summary:focus-visible { color: var(--bone); }

  .work-root {
    background: var(--void);
    color: var(--bone);
    font-family: var(--font-display);
    min-height: 100vh;
    width: 100%;
  }

  .work-inner {
    max-width: 860px;
    margin: 0 auto;
    padding: var(--gutter);
  }

  main:focus {
    outline: none;
  }

  /* ---- header ------------------------------------------------------------ */

  .work-header {
    padding-bottom: 1.25rem;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-masthead {
    color: var(--dim);
  }

  .work-masthead strong {
    color: var(--bone);
    font-weight: 500;
  }

  /* ---- hero / introduction ------------------------------------------------ */

  .work-hero {
    padding: clamp(1.75rem, 5vw, 3rem) 0 clamp(1.75rem, 5vw, 2.5rem);
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-statement {
    font-size: var(--t-lede);
    font-weight: 500;
    letter-spacing: var(--track-hero);
    line-height: 1.1;
    max-width: 34ch;
  }

  .work-tagline {
    margin-top: 1rem;
    color: var(--dim);
  }

  .work-contact-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem 1.5rem;
    list-style: none;
    margin-top: 1.75rem;
  }

  .work-contact-list a {
    transition: color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
    border-bottom: var(--hair) solid var(--faint);
    padding-bottom: 0.15rem;
    display: inline-block;
  }

  .work-contact-list a:hover,
  .work-contact-list a:focus-visible {
    color: var(--bone);
    border-bottom-color: var(--dim);
  }

  /* ---- room callout -------------------------------------------------------- */

  .work-room {
    padding: clamp(2rem, 5vw, 3rem) 0;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-room-panel {
    background: var(--void-lift);
    border: var(--hair) solid var(--faint);
    padding: clamp(1.5rem, 4vw, 2.25rem);
  }

  .work-room-copy {
    max-width: 56ch;
    margin-top: 0.85rem;
  }

  .work-room-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.6em;
    margin-top: 1.5rem;
    padding: 0.85rem 1.4rem;
    border: var(--hair) solid var(--signal);
    color: var(--signal);
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    transition: background var(--d-feedback) var(--ease), color var(--d-feedback) var(--ease);
  }

  .work-room-cta:hover,
  .work-room-cta:focus-visible {
    background: var(--signal);
    color: var(--void);
  }

  .work-room-note {
    margin-top: 1rem;
    color: var(--dim);
  }

  /* ---- shared section head ------------------------------------------------- */

  .work-section {
    padding: clamp(2.25rem, 6vw, 4rem) 0;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-section-head {
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 2rem;
    padding-bottom: 0.75rem;
    border-bottom: var(--hair) solid var(--faint);
  }

  /* ---- projects -------------------------------------------------------------- */

  .work-projects {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .work-project {
    padding: 1.75rem 0;
  }

  .work-project + .work-project {
    border-top: var(--hair) solid var(--faint);
  }

  .work-project-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin-bottom: 0.75rem;
    color: var(--dim);
  }

  .work-project-index {
    color: var(--dim);
  }

  .work-project-name {
    font-size: var(--t-head);
    font-weight: 500;
    letter-spacing: -0.01em;
    margin-bottom: 0.5rem;
  }

  .work-project-tagline {
    color: var(--dim);
    max-width: 52ch;
    margin-bottom: 0.75rem;
  }

  .work-project-desc {
    max-width: 60ch;
    margin-bottom: 1.25rem;
  }

  .work-tech {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    margin-bottom: 1.25rem;
  }

  .work-tech li {
    font-family: var(--font-mono);
    font-size: var(--t-micro);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    color: var(--dim);
    border: var(--hair) solid var(--faint);
    padding: 0.3rem 0.55rem;
  }

  .work-note {
    margin-bottom: 1.25rem;
    max-width: 60ch;
  }

  .work-note-label {
    display: block;
    color: var(--dim);
    margin-bottom: 0.35rem;
  }

  .work-note p {
    color: var(--bone);
  }

  .work-project-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 0.25rem;
  }

  .work-link {
    transition: color var(--d-feedback) var(--ease), border-color var(--d-feedback) var(--ease);
    border-bottom: var(--hair) solid var(--faint);
    padding-bottom: 0.15rem;
  }

  .work-link:hover,
  .work-link:focus-visible {
    color: var(--bone);
    border-bottom-color: var(--dim);
  }

  .work-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0.25rem 0 1.25rem;
  }

  /* Solid bone buttons: the hero CTA already holds the one accent. */
  .work-demo-btn {
    font-family: var(--font-mono);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    padding: 0.95rem 1.5rem;
    min-height: 3rem;
    border: 2px solid var(--bone);
    color: var(--void);
    background: var(--bone);
    cursor: pointer;
    transition: background var(--d-feedback) var(--ease), color var(--d-feedback) var(--ease);
  }

  .work-demo-btn::before {
    content: '▶ ';
  }

  .work-demo-btn:hover,
  .work-demo-btn:focus-visible {
    background: transparent;
    color: var(--bone);
  }

  .work-demo-btn:focus-visible {
    outline: 2px solid var(--bone);
    outline-offset: 3px;
  }

  .work-demo-btn[aria-pressed="true"] {
    background: transparent;
    color: var(--bone);
    box-shadow: inset 0 -4px 0 var(--bone);
  }

  /* ---- live demo panel ---------------------------------------------------------- */

  /* Wide screens: the page keeps its reading column and the demo sits beside
     it, sticky, so a visitor can read about a project while using it. */
  @media (min-width: 1100px) {
    .work-root--split {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(440px, 46vw);
    }

    .work-root--split .work-inner {
      margin: 0 0 0 auto;
      width: 100%;
    }

    .work-root--split .work-demo {
      position: sticky;
      top: 0;
      height: 100vh;
      border-left: var(--hair) solid var(--faint);
    }
  }

  /* Narrow screens: the demo takes the screen until it is closed. */
  @media (max-width: 1099px) {
    .work-demo {
      position: fixed;
      inset: 0;
      z-index: 60;
    }
  }

  .work-demo {
    display: flex;
    flex-direction: column;
    background: var(--void-lift);
    min-width: 0;
  }

  .work-demo-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-demo-kicker {
    color: var(--dim);
    font-size: var(--t-micro);
    letter-spacing: var(--track-data);
  }

  .work-demo-title {
    font-size: var(--t-body);
    font-weight: 500;
    margin-top: 0.3rem;
  }

  .work-demo-title span {
    color: var(--dim);
    font-weight: 400;
    margin-left: 0.4em;
  }

  .work-demo-actions {
    display: flex;
    gap: 0.5rem;
    flex: none;
  }

  .work-demo-action {
    font-size: var(--t-micro);
    letter-spacing: var(--track-data);
    padding: 0.5rem 0.75rem;
    border: var(--hair) solid var(--faint);
    color: var(--bone);
    background: transparent;
    cursor: pointer;
  }

  .work-demo-action:hover,
  .work-demo-action:focus-visible {
    border-color: var(--dim);
  }

  .work-demo-body {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }

  .work-demo-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: #0b0d12;
  }

  .work-demo-loading {
    color: var(--dim);
  }

  /* ---- skills ---------------------------------------------------------------- */

  .work-skills {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .work-skill {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.9rem 0;
  }

  .work-skill + .work-skill {
    border-top: var(--hair) solid var(--faint);
  }

  .work-skill-label {
    font-size: var(--t-body);
  }

  .work-skill-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .work-skill-proof,
  .work-skill-note {
    color: var(--dim);
  }

  /* ---- footer ------------------------------------------------------------------ */

  .work-footer {
    padding: 1.75rem 0 clamp(2rem, 6vw, 3rem);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .work-footer a {
    transition: color var(--d-feedback) var(--ease);
    width: fit-content;
  }

  .work-footer a:hover,
  .work-footer a:focus-visible {
    color: var(--bone);
  }

  /* ---- responsive: widen up from mobile base ----------------------------------- */

  @media (min-width: 560px) {
    .work-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .work-project-meta {
      gap: 1.25rem;
    }

    .work-skill {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.35rem 1rem;
    }

    .work-skill-meta {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.25rem 1.25rem;
      margin-left: auto;
      min-width: 0;
    }

    /* Wraps rather than nowrap: long notes overflowed the page at ~625 px. */
    .work-skill-proof,
    .work-skill-note {
      overflow-wrap: anywhere;
    }

    .work-footer {
      flex-direction: row;
      justify-content: space-between;
      align-items: baseline;
    }
  }

  /* ---- print ---------------------------------------------------------------------- */

  @media print {
    @page {
      margin: 1.6cm;
    }

    html, body, #root {
      height: auto;
    }

    body {
      background: #fff;
      color: #000;
    }

    .work-root {
      background: #fff;
      color: #000;
      min-height: 0;
    }

    .work-skip,
    .work-room,
    .work-demos,
    .work-demo {
      display: none;
    }

    .work-inner {
      max-width: none;
      padding: 0;
    }

    * {
      animation: none !important;
      transition: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    .work-header,
    .work-hero,
    .work-section {
      border-bottom-color: #ccc;
    }

    .work-section-head {
      border-bottom-color: #ccc;
      color: #444;
    }

    .work-masthead,
    .work-tagline,
    .work-project-meta,
    .work-project-tagline,
    .work-project-index,
    .work-note-label,
    .work-skill-proof,
    .work-skill-note {
      color: #444;
    }

    .work-tech li {
      color: #444;
      border-color: #ccc;
    }

    .work-contact-list a,
    .work-link,
    .work-footer a {
      color: #000;
      border-bottom-color: #999;
    }

    a[href^="http"]::after {
      content: " (" attr(href) ")";
      font-size: 0.7em;
      color: #666;
    }

    .work-project {
      break-inside: avoid;
    }

    :focus-visible {
      outline: none;
    }
  }

  .work-metrics {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
    gap: 0.6rem;
  }
  .work-metrics li {
    border: 1px solid var(--line, #26282b);
    padding: 0.6rem 0.75rem;
  }
  .work-metrics strong {
    display: block;
    font-size: 1.35rem;
    line-height: 1.1;
    color: var(--ink, #ececec);
  }
  .work-metrics span { font-size: 0.82rem; color: var(--dim); }
  .work-bullets { margin: 0.9rem 0 0; padding-left: 1.1rem; color: var(--dim); }
  .work-bullets li { margin: 0.3rem 0; }

  .work-project-summary { margin: 0.5rem 0 0; font-size: 1.05rem; }
  .work-project-detail { margin: 0.4rem 0 0; color: var(--dim); }
  .work-project-badge { margin: 0.5rem 0 0; color: var(--signal); font-size: var(--t-data); }
  .work-projects--compact .work-project { padding-block: 1rem; }
  .work-projects--compact .work-project-name { font-size: 1.1rem; }
  .work-projects--compact .work-project-tagline { margin: 0.3rem 0 0; }
`;

export default function Work() {
  const mainRef = useRef(null);
  // { id, index } of the open demo; the trigger gets focus back on close.
  const [open, setOpen] = useState(null);
  const trigger = useRef(null);
  const closeDemo = useCallback(() => {
    setOpen(null);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  // A project with no description yet renders as a bare title and a lone tech
  // chip, which reads as a broken stub rather than as work. Withhold it until
  // there is something true to say about it.
  const listed = projects.filter((p) => p.description || p.tagline);
  const featured = featuredProjectIds
    .map((id) => listed.find((p) => p.id === id))
    .filter(Boolean);
  const more = listed.filter((p) => !featuredProjectIds.includes(p.id));

  const renderProject = (project, index, total, compact) => {
    const hasLinks = project.links?.live || project.links?.github;
    const ordinal = String(index + 1).padStart(2, '0');
    return (
      <li key={project.id} className="work-project">
        <div className="work-project-meta mono">
          <span className="work-project-index">{ordinal}/{String(total).padStart(2, '0')}</span>
          <span>{project.year}</span>
          <span>{project.kind}</span>
        </div>
        <h3 className="work-project-name">{project.name}</h3>
        {compact ? (
          project.tagline && <p className="work-project-tagline">{project.tagline}</p>
        ) : (
          <>
            <p className="work-project-summary">{project.summary || project.tagline}</p>
            {project.detail && <p className="work-project-detail">{project.detail}</p>}
            {project.badge && <p className="mono work-project-badge">{project.badge}</p>}
            {!project.summary && project.description && (
              <p className="work-project-desc">{project.description}</p>
            )}
          </>
        )}

        {DEMOS[project.id] && (
          <div className="work-demos" aria-label={`Try ${project.name}`}>
            {DEMOS[project.id].map((demo, i) => (
              <button
                key={demo.label}
                type="button"
                className="work-demo-btn"
                aria-pressed={open?.id === project.id && open.index === i}
                onClick={(event) => { trigger.current = event.currentTarget; setOpen({ id: project.id, index: i }); }}
              >
                Try it · {demo.label}
              </button>
            ))}
          </div>
        )}

        {project.tech?.length > 0 && (
          <ul className="work-tech" aria-label={`${project.name} technologies`}>
            {project.tech.map((tech) => (<li key={tech}>{tech}</li>))}
          </ul>
        )}

        {!compact && (project.decision || project.broke) && (
          <details className="work-more">
            <summary>Engineering notes</summary>
            {project.decision && (
              <div className="work-note">
                <span className="mono work-note-label">Decision</span>
                <p>{project.decision}</p>
              </div>
            )}
            {project.broke && (
              <div className="work-note">
                <span className="mono work-note-label">What broke</span>
                <p>{project.broke}</p>
              </div>
            )}
          </details>
        )}

        {hasLinks && (
          <div className="work-project-links">
            {project.links.live && (
              <a className="mono work-link" href={project.links.live}
                {...(project.links.live.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                Live
              </a>
            )}
            {project.links.github && (
              <a className="mono work-link" href={project.links.github} target="_blank" rel="noopener noreferrer">
                Source
              </a>
            )}
          </div>
        )}
      </li>
    );
  };

  const hasContact =
    contact.email || contact.github || contact.linkedin || contact.twitter || contact.resume;

  return (
    <>
      <style>{css}</style>
      <button
        type="button"
        className="work-skip mono"
        onClick={() => mainRef.current?.focus()}
      >
        Skip to content
      </button>
      <div className={`work-root${open ? ' work-root--split' : ''}`}>
        <div className="work-inner">
          <header className="work-header">
            <p className="mono work-masthead">
              <strong>{identity.name}</strong> &middot; {identity.role} &middot; {identity.location}
            </p>
          </header>

          <main id="work-main" ref={mainRef} tabIndex={-1}>
            <section className="work-hero" aria-label="Introduction">
              <h1 className="work-statement">{identity.name}</h1>
              {identity.tagline && <p className="work-tagline">{identity.tagline}</p>}

              <ul className="work-wins" aria-label="Highlights">
                {achievements.map((a) => (
                  <li key={a.id}><span>{a.result}</span>{a.label.split(' — ')[0].split(' (')[0]}</li>
                ))}
              </ul>

              {hasContact && (
                <div className="work-actions" aria-label="Contact">
                  {contact.resume && (
                    <a className="work-action work-action--primary" href={contact.resume} target="_blank" rel="noopener noreferrer">
                      Résumé (PDF)
                    </a>
                  )}
                  {contact.github && (
                    <a className="work-action" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                  )}
                  {contact.linkedin && (
                    <a className="work-action" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  )}
                  {contact.twitter && (
                    <a className="work-action" href={contact.twitter} target="_blank" rel="noopener noreferrer">Twitter</a>
                  )}
                </div>
              )}
            </section>

            <section className="work-section" aria-labelledby="work-experience-heading">
              <h2 id="work-experience-heading" className="work-section-head">
                Experience &amp; education
              </h2>
              <ol className="work-timeline">
                {experience.map((job) => (
                  <li key={job.id} className="work-job">
                    <span className="mono work-job-when">{job.from} &ndash; {job.to}</span>
                    <div>
                      <h3 className="work-job-role">{job.role}</h3>
                      <p className="work-job-org">{job.org}{job.note ? ` · ${job.note}` : ''}</p>
                      {job.detail && <p className="work-job-detail">{job.detail}</p>}
                      {job.metrics && (
                        <ul className="work-metrics" aria-label={`${job.org} results`}>
                          {job.metrics.map((m) => (
                            <li key={m.label}><strong>{m.value}</strong><span>{m.label}</span></li>
                          ))}
                        </ul>
                      )}
                      {job.bullets && (
                        <ul className="work-bullets">
                          {job.bullets.map((b) => (<li key={b}>{b}</li>))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
                <li className="work-job">
                  <span className="mono work-job-when">{education.year}</span>
                  <div>
                    <h3 className="work-job-role">{education.degree}</h3>
                    <p className="work-job-org">{education.school}</p>
                  </div>
                </li>
              </ol>
            </section>

            <section className="work-section" aria-labelledby="work-projects-heading">
              <h2 id="work-projects-heading" className="work-section-head">
                Projects
              </h2>
              <ol className="work-projects">
                {featured.map((project, index) => renderProject(project, index, featured.length, false))}
              </ol>
            </section>

            {more.length > 0 && (
              <section className="work-section" aria-labelledby="work-more-projects-heading">
                <h2 id="work-more-projects-heading" className="work-section-head">
                  More projects
                </h2>
                <ol className="work-projects work-projects--compact">
                  {more.map((project, index) => renderProject(project, index, more.length, true))}
                </ol>
              </section>
            )}

            <section className="work-section" aria-labelledby="work-skills-heading">
              <h2 id="work-skills-heading" className="work-section-head">
                Skills
              </h2>
              <ul className="work-skills">
                {skills.map((skill) => {
                  const proof = resolveProof(skill.proof);
                  return (
                    <li key={skill.id} className="work-skill">
                      <span className="work-skill-label">{skill.label}</span>
                      <span className="work-skill-meta">
                        {proof.length > 0 && (
                          <span className="mono work-skill-proof">
                            Evidence &middot; {proof.join(', ')}
                          </span>
                        )}
                        {skill.note && <span className="mono work-skill-note">{skill.note}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="work-room" aria-labelledby="work-room-heading">
              <div className="work-room-panel">
                <h2 id="work-room-heading" className="work-section-head">
                  The 3D room
                </h2>
                <p className="work-room-copy">
                  The same projects, on a desk you can walk up to: a computer and a phone that run them.
                </p>
                <a className="work-room-cta" href="/">
                  Enter the 3D room <span aria-hidden="true">&rarr;</span>
                </a>
                <p className="mono work-room-note">
                  Needs a hardware GPU. If your device can&rsquo;t run it, you&rsquo;ll land back
                  here automatically.
                </p>
              </div>
            </section>
          </main>

          <footer className="work-footer">
            {contact.email && (
              <a className="mono" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            )}
            <p className="mono">{identity.name} &mdash; static build, zero WebGL</p>
          </footer>
        </div>
        {open && (
          <DemoPanel
            project={projects.find((p) => p.id === open.id)}
            demo={DEMOS[open.id][open.index]}
            onClose={closeDemo}
          />
        )}
      </div>
    </>
  );
}
