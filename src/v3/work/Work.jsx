import { Link } from 'react-router-dom';
import '../tokens.css';
import { identity, contact, skills, projects } from '../content/index.js';

const css = `
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

  /* ---- header ---------------------------------------------------------- */

  .work-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-back {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    transition: color var(--d-feedback) var(--ease);
  }

  .work-back:hover,
  .work-back:focus-visible {
    color: var(--bone);
  }

  .work-back-arrow {
    color: var(--signal);
  }

  .work-id {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
    text-align: right;
  }

  .work-name {
    font-size: var(--t-body);
    font-weight: 500;
  }

  /* ---- statement --------------------------------------------------------- */

  .work-hero {
    padding: clamp(2.5rem, 8vw, 5rem) 0;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-statement {
    font-size: var(--t-hero);
    font-weight: 500;
    letter-spacing: var(--track-hero);
    line-height: 1.05;
    max-width: 18ch;
  }

  /* ---- contact ------------------------------------------------------------ */

  .work-contact {
    padding: 1.5rem 0;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-contact-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.75rem;
    list-style: none;
  }

  .work-contact-list a {
    transition: color var(--d-feedback) var(--ease);
    border-bottom: var(--hair) solid transparent;
  }

  .work-contact-list a:hover,
  .work-contact-list a:focus-visible {
    color: var(--bone);
    border-bottom-color: var(--dim);
  }

  /* ---- sections ------------------------------------------------------------ */

  .work-section {
    padding: clamp(2.5rem, 6vw, 4rem) 0;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-section-head {
    display: flex;
    align-items: center;
    gap: 0.6em;
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 2rem;
  }

  .work-marker {
    width: 6px;
    height: 6px;
    background: var(--signal);
    flex-shrink: 0;
  }

  /* ---- projects ------------------------------------------------------------ */

  .work-projects {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .work-project {
    padding: 2rem 0;
  }

  .work-project + .work-project {
    border-top: var(--hair) solid var(--faint);
  }

  .work-project-meta {
    display: flex;
    gap: 1.25rem;
    margin-bottom: 0.75rem;
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
    gap: 1.5rem;
  }

  .work-link {
    transition: color var(--d-feedback) var(--ease);
    border-bottom: var(--hair) solid var(--faint);
    padding-bottom: 0.15rem;
  }

  .work-link:hover,
  .work-link:focus-visible {
    color: var(--bone);
    border-bottom-color: var(--dim);
  }

  /* ---- skills ------------------------------------------------------------ */

  .work-skills {
    list-style: none;
    display: flex;
    flex-direction: column;
  }

  .work-skill {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.35rem 1rem;
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
    gap: 1.25rem;
    margin-left: auto;
  }

  .work-skill-proof,
  .work-skill-note {
    color: var(--dim);
    white-space: nowrap;
  }

  /* ---- footer ------------------------------------------------------------ */

  .work-footer {
    padding: 1.75rem 0 clamp(2rem, 6vw, 3rem);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem 1.5rem;
  }

  .work-footer a {
    transition: color var(--d-feedback) var(--ease);
  }

  .work-footer a:hover,
  .work-footer a:focus-visible {
    color: var(--bone);
  }

  /* ---- responsive ---------------------------------------------------------- */

  @media (max-width: 640px) {
    .work-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .work-id {
      align-items: flex-start;
      text-align: left;
    }

    .work-project-meta {
      gap: 0.75rem;
    }

    .work-skill {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
    }

    .work-skill-meta {
      margin-left: 0;
      gap: 1rem;
    }

    .work-footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

export default function Work() {
  const hasContact =
    contact.email || contact.github || contact.linkedin || contact.twitter || contact.resume;

  return (
    <>
      <style>{css}</style>
      <div className="work-root">
        <div className="work-inner">
          <header className="work-header">
            <Link to="/" className="work-back mono" aria-label="Back to scan">
              <span className="work-back-arrow" aria-hidden="true">
                &larr;
              </span>
              SCAN
            </Link>
            <div className="work-id">
              <span className="work-name">{identity.name}</span>
              <span className="mono">
                {identity.role} &middot; {identity.location}
              </span>
            </div>
          </header>

          <main>
            <section className="work-hero" aria-label="Statement">
              <h1 className="work-statement">{identity.statement}</h1>
            </section>

            {hasContact && (
              <section className="work-contact" aria-label="Contact">
                <ul className="work-contact-list">
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
              </section>
            )}

            <section className="work-section" aria-labelledby="work-projects-heading">
              <h2 id="work-projects-heading" className="work-section-head">
                <span className="work-marker" aria-hidden="true" />
                Work
              </h2>
              <ul className="work-projects">
                {projects.map((project) => {
                  const hasLinks = project.links?.live || project.links?.github;
                  return (
                    <li key={project.id} className="work-project">
                      <div className="work-project-meta mono">
                        <span>{project.year}</span>
                        <span>{project.kind}</span>
                      </div>
                      <h3 className="work-project-name">{project.name}</h3>
                      <p className="work-project-tagline">{project.tagline}</p>
                      <p className="work-project-desc">{project.description}</p>

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
              </ul>
            </section>

            <section className="work-section" aria-labelledby="work-skills-heading">
              <h2 id="work-skills-heading" className="work-section-head">
                <span className="work-marker" aria-hidden="true" />
                Skills
              </h2>
              <ul className="work-skills">
                {skills.map((skill) => (
                  <li key={skill.id} className="work-skill">
                    <span className="work-skill-label">{skill.label}</span>
                    <span className="work-skill-meta">
                      <span className="mono work-skill-proof">
                        Proof &middot; {skill.proof.length}
                      </span>
                      {skill.note && <span className="mono work-skill-note">{skill.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </main>

          <footer className="work-footer">
            {contact.email && (
              <a className="mono" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            )}
            <p className="mono">{identity.name} &mdash; technical instrument mode</p>
          </footer>
        </div>
      </div>
    </>
  );
}
