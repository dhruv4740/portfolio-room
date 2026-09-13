// os/apps/about.js — readable resume/dossier
import content from '../shell/content.js';

const FONT = "'JetBrains Mono','Courier New',monospace";
const INK = '#1c2622';
const SUBINK = '#4b5b54';
const FAINT = '#8a978f';
const PAPER = '#f4f2ea';
const RULE = 'rgba(28,38,34,0.14)';
const ACCENT = '#0f6b52';

function el(tag, cssText, text) {
  const node = document.createElement(tag);
  if (cssText) node.style.cssText = cssText;
  if (text != null) node.textContent = text;
  return node;
}

function section(root, label) {
  const wrap = el('section', 'margin:0 0 30px;');
  const hdr = el('div', [
    `font-family:${FONT}`, 'font-size:10px', 'letter-spacing:0.28em',
    'text-transform:uppercase', `color:${ACCENT}`, 'font-weight:700',
    'margin-bottom:12px', 'padding-bottom:6px', `border-bottom:1px solid ${RULE}`,
  ].join(';'), label);
  wrap.appendChild(hdr);
  root.appendChild(wrap);
  return wrap;
}

export default {
  id: 'about',
  title: 'about',
  icon: '◈',
  width: 760,
  height: 620,

  mount(body) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden', `background:${PAPER}`,
      `font-family:${FONT}`, `color:${INK}`, 'display:flex', 'flex-direction:column',
    ].join(';');

    const scroller = el('div', [
      'flex:1', 'min-height:0', 'overflow-y:auto', 'box-sizing:border-box',
      'padding:36px 44px 24px',
    ].join(';'));

    const { identity, education, experience, achievements, skills, projects } = content;
    const projectById = Object.fromEntries((projects || []).map(p => [p.id, p.name]));

    // ── Header ──────────────────────────────────────────────────────────────
    const header = el('div', 'margin-bottom:34px;');
    header.appendChild(el('div', `font-size:24px;font-weight:700;letter-spacing:0.01em;color:${INK};margin-bottom:5px;`, identity.name));
    const roleLine = [identity.role, identity.location].filter(Boolean).join('  ·  ');
    if (roleLine) header.appendChild(el('div', `font-size:13px;color:${SUBINK};margin-bottom:14px;`, roleLine));
    if (identity.statement) {
      header.appendChild(el('div', `font-size:13.5px;line-height:1.65;color:${INK};max-width:58ch;`, identity.statement));
    }
    scroller.appendChild(header);

    // ── Experience ──────────────────────────────────────────────────────────
    if (Array.isArray(experience) && experience.length) {
      const s = section(scroller, 'Experience');
      experience.forEach(exp => {
        const row = el('div', 'margin-bottom:18px;');
        const top = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;');
        const titleWrap = el('div', '');
        titleWrap.appendChild(el('span', `font-size:14px;font-weight:700;color:${INK};`, exp.role));
        if (exp.org) {
          titleWrap.appendChild(el('span', `font-size:13px;color:${SUBINK};`, '  —  ' + exp.org));
        }
        top.appendChild(titleWrap);
        const dateRange = [exp.from, exp.to].filter(Boolean).join(' – ');
        if (dateRange) top.appendChild(el('span', `font-size:11.5px;color:${FAINT};white-space:nowrap;`, dateRange));
        row.appendChild(top);
        if (exp.note) row.appendChild(el('div', `font-size:12px;color:${FAINT};margin-top:2px;font-style:italic;`, exp.note));
        if (exp.detail) row.appendChild(el('div', `font-size:13px;line-height:1.6;color:${INK};margin-top:6px;max-width:64ch;`, exp.detail));
        s.appendChild(row);
      });
    }

    // ── Education ───────────────────────────────────────────────────────────
    if (education && (education.school || education.degree)) {
      const s = section(scroller, 'Education');
      const row = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;');
      const left = el('div', '');
      if (education.school) left.appendChild(el('span', `font-size:14px;font-weight:700;color:${INK};`, education.school));
      if (education.degree) left.appendChild(el('div', `font-size:12.5px;color:${SUBINK};margin-top:2px;`, education.degree));
      row.appendChild(left);
      if (education.year) row.appendChild(el('span', `font-size:11.5px;color:${FAINT};white-space:nowrap;`, education.year));
      s.appendChild(row);
    }

    // ── Achievements ────────────────────────────────────────────────────────
    if (Array.isArray(achievements) && achievements.length) {
      const s = section(scroller, 'Achievements');
      achievements.forEach(a => {
        const row = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-bottom:10px;flex-wrap:wrap;');
        row.appendChild(el('span', `font-size:13px;color:${INK};max-width:52ch;`, a.label));
        const right = el('span', 'display:flex;align-items:baseline;gap:8px;white-space:nowrap;');
        const isWinner = a.result === 'Winner';
        right.appendChild(el('span', [
          'font-size:10.5px', 'font-weight:700', 'letter-spacing:0.08em', 'text-transform:uppercase',
          `color:${isWinner ? ACCENT : FAINT}`,
        ].join(';'), a.result));
        if (a.year) right.appendChild(el('span', `font-size:11.5px;color:${FAINT};`, String(a.year)));
        row.appendChild(right);
        s.appendChild(row);
      });
    }

    // ── Skills ──────────────────────────────────────────────────────────────
    if (Array.isArray(skills) && skills.length) {
      const s = section(scroller, 'Skills');
      const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px 24px;');
      skills.forEach(sk => {
        const cell = el('div', '');
        cell.appendChild(el('div', `font-size:13px;font-weight:700;color:${INK};`, sk.label));
        if (sk.note) cell.appendChild(el('div', `font-size:11.5px;color:${SUBINK};margin-top:2px;`, sk.note));
        const proofNames = (sk.projects || []).map(id => projectById[id]).filter(Boolean);
        if (proofNames.length) {
          cell.appendChild(el('div', `font-size:11px;color:${FAINT};margin-top:4px;`, proofNames.join(', ')));
        }
        grid.appendChild(cell);
      });
      s.appendChild(grid);
    }

    body.appendChild(scroller);

    return function cleanup() {
      scroller.remove();
    };
  },
};
