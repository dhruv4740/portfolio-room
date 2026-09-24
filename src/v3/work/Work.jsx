import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../tokens.css';
import { identity, contact, skills, projects } from '../content/index.js';
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
              <h1 className="work-statement">{identity.statement}</h1>
              {identity.tagline && <p className="mono work-tagline">{identity.tagline}</p>}

              {hasContact && (
                <ul className="work-contact-list" aria-label="Contact">
                  {contact.email && (
                    <li>
                      <a className="mono" href={`mailto:${contact.email}`}>
                        {contact.email}
                      </a>
                    </li>
                  )}
                  {contact.github && (
                    <li>
                      <a
                        className="mono"
                        href={contact.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {contact.githubLabel || contact.github}
                      </a>
                    </li>
                  )}
                  {contact.linkedin && (
                    <li>
                      <a
                        className="mono"
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </a>
                    </li>
                  )}
                  {contact.twitter && (
                    <li>
                      <a
                        className="mono"
                        href={contact.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Twitter
                      </a>
                    </li>
                  )}
                  {contact.resume && (
                    <li>
                      <a
                        className="mono"
                        href={contact.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Resume
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </section>

            <section className="work-room" aria-labelledby="work-room-heading">
              <div className="work-room-panel">
                <h2 id="work-room-heading" className="work-section-head">
                  Full 3D room
                </h2>
                <p className="work-room-copy">
                  There is also a modeled 3D workspace — desk, monitor, notebook — that you orbit
                  and click into. This page is the fast, GPU-free path; that one needs a real
                  graphics card.
                </p>
                <Link className="work-room-cta" to="/">
                  Enter the 3D room <span aria-hidden="true">&rarr;</span>
                </Link>
                <p className="mono work-room-note">
                  Needs a hardware GPU. If your device can&rsquo;t run it, you&rsquo;ll land back
                  here automatically.
                </p>
              </div>
            </section>

            <section className="work-section" aria-labelledby="work-projects-heading">
              <h2 id="work-projects-heading" className="work-section-head">
                Projects
              </h2>
              <ol className="work-projects">
                {listed.map((project, index) => {
                  const hasLinks = project.links?.live || project.links?.github;
                  const ordinal = String(index + 1).padStart(2, '0');
                  const total = String(listed.length).padStart(2, '0');
                  return (
                    <li key={project.id} className="work-project">
                      <div className="work-project-meta mono">
                        <span className="work-project-index">
                          {ordinal}/{total}
                        </span>
                        <span>{project.year}</span>
                        <span>{project.kind}</span>
                      </div>
                      <h3 className="work-project-name">{project.name}</h3>
                      {project.tagline && (
                        <p className="work-project-tagline">{project.tagline}</p>
                      )}
                      {project.description && (
                        <p className="work-project-desc">{project.description}</p>
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
                          {project.tech.map((tech) => (
                            <li key={tech}>{tech}</li>
                          ))}
                        </ul>
                      )}

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

                      {hasLinks && (
                        <div className="work-project-links">
                          {project.links.live && (
                            <a
                              className="mono work-link"
                              href={project.links.live}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Live
                            </a>
                          )}
                          {project.links.github && (
                            <a
                              className="mono work-link"
                              href={project.links.github}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Source
                            </a>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

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
