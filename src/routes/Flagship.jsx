import RealityTear from '../flagship/RealityTear.jsx';
import { identity, contact, projects } from '../content/index.js';

// ── Section styles (inline, dark theme) ──────────────────────────────────────
const S = {
  page: {
    background: '#070708',
    color: '#e8e8f0',
    fontFamily: "'Space Grotesk', sans-serif",
    minHeight: '100vh',
  },
  hero: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  section: {
    maxWidth: '840px',
    margin: '0 auto',
    padding: '80px 32px',
  },
  sectionLabel: {
    font: "600 10px/1 'JetBrains Mono', monospace",
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#38e1ff',
    marginBottom: '36px',
    display: 'block',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    border: 'none',
    margin: '0',
  },

  // About
  aboutName: {
    font: "300 clamp(40px,6vw,80px)/1.05 'Space Grotesk', sans-serif",
    letterSpacing: '-0.02em',
    color: '#fff',
    marginBottom: '16px',
  },
  aboutRole: {
    font: "400 18px/1 'JetBrains Mono', monospace",
    color: '#a06bff',
    marginBottom: '10px',
  },
  aboutMeta: {
    font: "400 13px/1 'JetBrains Mono', monospace",
    color: 'rgba(255,255,255,0.35)',
    marginBottom: '28px',
  },
  aboutTagline: {
    font: "300 20px/1.5 'Space Grotesk', sans-serif",
    color: 'rgba(232,232,240,0.7)',
    maxWidth: '480px',
  },

  // Projects grid
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'border-color 0.2s',
  },
  cardType: {
    font: "600 9px/1 'JetBrains Mono', monospace",
    letterSpacing: '0.2em',
    color: '#a06bff',
    textTransform: 'uppercase',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '12px',
  },
  cardName: {
    font: "500 17px/1.2 'Space Grotesk', sans-serif",
    color: '#fff',
  },
  cardYear: {
    font: "400 11px/1 'JetBrains Mono', monospace",
    color: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  cardTagline: {
    font: "400 13px/1.55 'Space Grotesk', sans-serif",
    color: 'rgba(232,232,240,0.6)',
  },
  techRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px',
  },
  chip: {
    font: "400 10px/1 'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
    color: 'rgba(56,225,255,0.7)',
    background: 'rgba(56,225,255,0.07)',
    border: '1px solid rgba(56,225,255,0.15)',
    borderRadius: '4px',
    padding: '4px 8px',
  },
  linksRow: {
    display: 'flex',
    gap: '14px',
    marginTop: '6px',
  },
  linkAnchor: {
    font: "500 11px/1 'JetBrains Mono', monospace",
    letterSpacing: '0.08em',
    color: '#38e1ff',
    textDecoration: 'none',
    textTransform: 'uppercase',
  },

  // Contact
  contactGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  contactItem: {
    font: "400 15px/1 'JetBrains Mono', monospace",
    color: 'rgba(232,232,240,0.55)',
  },
  contactLink: {
    color: '#38e1ff',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section style={S.section} aria-label="About">
      <span style={S.sectionLabel}>About</span>
      <h1 style={S.aboutName}>{identity.name}</h1>
      <p style={S.aboutRole}>{identity.role}</p>
      <p style={S.aboutMeta}>{identity.location}</p>
      <p style={S.aboutTagline}>{identity.tagline}</p>
    </section>
  );
}

function ProjectCard({ project }) {
  const hasLive = project.links.live && project.links.live.length > 0;
  const hasGithub = project.links.github && project.links.github.length > 0;

  return (
    <article style={S.card}>
      <span style={S.cardType}>{project.type}</span>
      <div style={S.cardHeader}>
        <span style={S.cardName}>{project.name}</span>
        <span style={S.cardYear}>{project.year}</span>
      </div>
      <p style={S.cardTagline}>{project.tagline}</p>
      <div style={S.techRow}>
        {project.tech.map((t) => (
          <span key={t} style={S.chip}>{t}</span>
        ))}
      </div>
      {(hasLive || hasGithub) && (
        <div style={S.linksRow}>
          {hasLive && (
            <a
              href={project.links.live}
              target="_blank"
              rel="noreferrer"
              style={S.linkAnchor}
            >
              Live ↗
            </a>
          )}
          {hasGithub && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noreferrer"
              style={S.linkAnchor}
            >
              GitHub ↗
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function ProjectsSection() {
  return (
    <section style={S.section} aria-label="Projects">
      <span style={S.sectionLabel}>Selected Work</span>
      <div style={S.projectsGrid}>
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section style={{ ...S.section, paddingBottom: '120px' }} aria-label="Contact">
      <span style={S.sectionLabel}>Contact</span>
      <div style={S.contactGroup}>
        <p style={S.contactItem}>
          <a href={`mailto:${contact.email}`} style={S.contactLink}>
            {contact.email}
          </a>
        </p>
        {contact.github && (
          <p style={S.contactItem}>
            <a
              href={contact.github}
              target="_blank"
              rel="noreferrer"
              style={S.contactLink}
            >
              {contact.githubLabel || contact.github}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Flagship() {
  return (
    <div style={S.page}>
      {/* Full-viewport hero with tear effect */}
      <div style={S.hero}>
        <RealityTear />
      </div>

      {/* Scrollable content beneath */}
      <hr style={S.divider} />
      <AboutSection />
      <hr style={S.divider} />
      <ProjectsSection />
      <hr style={S.divider} />
      <ContactSection />
    </div>
  );
}
