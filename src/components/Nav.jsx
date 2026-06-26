// src/components/Nav.jsx — shared top nav for the v2 shell.
// Fixed, minimal, theme-neutral so it sits over any full-bleed effect.
import { NavLink } from 'react-router-dom';
import { contact } from '../content/index.js';

const LINKS = [
  { to: '/', label: 'Work', end: true },
  { to: '/lab', label: 'Lab', end: false },
  { to: '/anthology', label: 'Anthology', end: false },
];

const barStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '14px 22px',
  font: "600 12px/1 'JetBrains Mono', monospace",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  mixBlendMode: 'difference',
  color: '#fff',
  pointerEvents: 'none',
};

const brandStyle = { marginRight: 'auto', pointerEvents: 'auto', textDecoration: 'none', color: 'inherit' };
const linkBase = { pointerEvents: 'auto', textDecoration: 'none', color: 'inherit', padding: '6px 10px', opacity: 0.65, transition: 'opacity 0.2s' };
const linkActive = { ...linkBase, opacity: 1 };

export default function Nav() {
  return (
    <nav style={barStyle} aria-label="primary">
      <NavLink to="/" style={brandStyle}>DK</NavLink>
      {LINKS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => (isActive ? linkActive : linkBase)}
        >
          {label}
        </NavLink>
      ))}
      <a href={`mailto:${contact.email}`} style={linkBase}>Contact</a>
    </nav>
  );
}
