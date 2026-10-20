// Ctrl/⌘+K from anywhere: jump to a project, the phone apps, résumé, contact
// or a room action. Every entry is a route, so the same targets work as links.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contact } from '../content/index.js';

const ENTRIES = [
  { label: 'Open the computer', hint: 'dhruvOS projects', to: '/os/projects' },
  { label: 'DarkSentinel', hint: 'computer app', to: '/os/darksentinel' },
  { label: 'CrisisWatch', hint: 'computer app', to: '/os/crisiswatch' },
  { label: 'Fraud detection', hint: 'computer app', to: '/os/fraud' },
  { label: 'FocusLock (desktop)', hint: 'computer app', to: '/os/focuslock' },
  { label: 'Skills', hint: 'computer app', to: '/os/skills' },
  { label: 'Terminal', hint: 'computer app', to: '/os/terminal' },
  { label: 'Phone', hint: 'pick up the phone', to: '/phone' },
  { label: 'FocusLock (Android)', hint: 'phone app', to: '/phone/focuslock' },
  { label: 'Expense Tracker', hint: 'phone app', to: '/phone/expense' },
  { label: 'BasketProof', hint: 'phone app', to: '/phone/basketproof' },
  { label: 'Résumé & projects', hint: 'one page, 30 seconds', to: '/work' },
  { label: 'About me', hint: 'experience and achievements', to: '/about' },
  { label: 'Contact', hint: 'email, GitHub, LinkedIn', to: '/contact' },
  { label: 'Explore the room', hint: 'sit at the desk', to: '/room/explore' },
  { label: 'Toggle the lamp', hint: 'room action', to: '/room/lamp' },
  { label: 'Look out the window', hint: 'room view', to: '/room/window' },
  { label: 'Put on headphones', hint: 'room action', to: '/room/headphones' },
  { label: 'GitHub', hint: contact.githubLabel, href: contact.github },
  ...(contact.resume ? [{ label: 'Download résumé', hint: 'PDF', href: contact.resume }] : []),
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const returnFocus = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => {
          if (!o) returnFocus.current = document.activeElement;
          return !o;
        });
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (!open) { returnFocus.current?.focus?.(); return; }
    setQuery(''); setIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    // Accent-insensitive, so "resume" finds "Read the résumé".
    const fold = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const q = fold(query.trim());
    return q ? ENTRIES.filter(e => fold(`${e.label} ${e.hint}`).includes(q)) : ENTRIES;
  }, [query]);

  function run(entry) {
    if (!entry) return;
    setOpen(false);
    if (entry.href) window.open(entry.href, '_blank', 'noopener');
    else navigate(entry.to);
  }

  function onKeyDown(e) {
    // Keep keys away from the room, the launchpad shortcuts and the OS.
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[index]); }
  }

  if (!open) return null;
  return (
    <div className="cmdk-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <style>{css}</style>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" data-testid="command-palette" onKeyDown={onKeyDown}>
        <input ref={inputRef} autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
          placeholder="Jump to a project, app or action…" aria-label="Search" aria-controls="cmdk-list"
          aria-activedescendant={results[index] ? `cmdk-${index}` : undefined} />
        <ul id="cmdk-list" role="listbox">
          {results.map((entry, i) => (
            <li key={entry.label} id={`cmdk-${i}`} role="option" aria-selected={i === index}
              onMouseEnter={() => setIndex(i)} onClick={() => run(entry)}>
              <span>{entry.label}</span><small>{entry.hint}</small>
            </li>
          ))}
          {!results.length && <li className="cmdk-empty">No matches</li>}
        </ul>
        <p className="cmdk-foot">↑↓ to move · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}

const css = `
.cmdk-scrim { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.5); display:flex; align-items:flex-start; justify-content:center; padding-top:14vh; }
.cmdk { width:min(560px, calc(100vw - 32px)); max-height:64vh; display:flex; flex-direction:column; border:1px solid #555b59; border-top:2px solid var(--signal, #e4572e); background:#0d1011; color:#d3d4cc; font-family:var(--font-mono, monospace); }
.cmdk input { padding:16px 18px; border:0; border-bottom:1px solid #2a2f30; background:transparent; color:var(--bone, #eee); font:inherit; font-size:15px; outline:none; }
.cmdk ul { margin:0; padding:6px 0; list-style:none; overflow:auto; }
.cmdk li { display:flex; justify-content:space-between; gap:16px; padding:9px 18px; cursor:pointer; font-size:13px; }
.cmdk li[aria-selected="true"] { background:#1b2021; color:var(--bone, #fff); }
.cmdk li small { color:#8d928f; font-size:11px; letter-spacing:.06em; }
.cmdk-empty { color:#8d928f; cursor:default; }
.cmdk-foot { margin:0; padding:8px 18px; border-top:1px solid #2a2f30; color:#8d928f; font-size:10.5px; letter-spacing:.1em; }
`;
