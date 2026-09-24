// Skills: a readable list. Each skill names the projects that prove it, and a
// project opens its card in the projects app. Content is shared with /work.
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

const GROUPS = [
  ['Web', ['react', 'ts', 'node']],
  ['Mobile', ['kotlin', 'firebase']],
  ['Backend and data', ['python', 'ml']],
  ['Hardware', ['iot']],
  ['Graphics', ['three']],
];

const CSS = `
.sk-root { height:100%; display:flex; flex-direction:column; background:#101516; color:#e9ebe5; font-family:Inter,system-ui,sans-serif; }
.sk-heading { padding:22px 28px 16px; border-bottom:1px solid #35413c; }
.sk-heading p { color:#aebcb4; margin:0 0 8px; font-size:12px; letter-spacing:.12em; }
.sk-heading h1 { margin:0; font-size:24px; font-weight:500; letter-spacing:-.02em; }
.sk-scroll { padding:18px 28px 24px; overflow:auto; flex:1; min-height:0; }
.sk-group { margin:0 0 22px; }
.sk-group h2 { margin:0 0 10px; font:12px monospace; letter-spacing:.14em; color:#aab9b0; text-transform:uppercase; }
.sk-row { display:grid; grid-template-columns:minmax(150px,220px) 1fr; gap:6px 18px; padding:12px 0; border-top:1px solid #26302c; align-items:baseline; }
.sk-name { font-size:16px; font-weight:550; }
.sk-note { font-size:13px; color:#b9c6bc; margin:0 0 8px; line-height:1.5; }
.sk-proof { display:flex; flex-wrap:wrap; gap:8px; }
.sk-proof button { font:13px system-ui,sans-serif; min-height:32px; padding:6px 12px; border:1px solid #677b6d; border-radius:4px; background:transparent; color:#e9ebe5; cursor:pointer; }
.sk-proof button:hover { border-color:#edf6eb; }
.sk-proof button:focus-visible { outline:2px solid #edf6eb; outline-offset:3px; }
`;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export default {
  id: 'skills', title: 'Skills', icon: '⊚', width: 760, height: 600,
  mount(body, ctx) {
    const root = node('div', 'sk-root');
    const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
    const heading = node('header', 'sk-heading');
    heading.append(node('p', '', 'SKILLS'), node('h1', '', 'What I use, and where you can see it.'));
    root.appendChild(heading);
    const scroll = node('div', 'sk-scroll'); root.appendChild(scroll);
    const byId = new Map(content.skills.map((s) => [s.id, s]));
    const projectName = new Map(content.projects.map((p) => [p.id, p.name]));
    for (const [title, ids] of GROUPS) {
      const skills = ids.map((id) => byId.get(id)).filter(Boolean);
      if (!skills.length) continue;
      const group = node('section', 'sk-group');
      group.appendChild(node('h2', '', title));
      for (const skill of skills) {
        const row = node('div', 'sk-row');
        row.appendChild(node('div', 'sk-name', skill.label));
        const detail = node('div');
        if (skill.note) detail.appendChild(node('p', 'sk-note', skill.note));
        const proof = node('div', 'sk-proof');
        for (const id of skill.projects) {
          if (!projectName.has(id)) continue;
          const button = node('button', '', projectName.get(id)); button.type = 'button';
          button.addEventListener('click', () => ctx.openProject(id));
          proof.appendChild(button);
        }
        if (proof.childElementCount) detail.appendChild(proof);
        row.appendChild(detail);
        group.appendChild(row);
      }
      scroll.appendChild(group);
    }
    body.appendChild(root);
    const removeStrip = mountContactStrip(root);
    return () => { removeStrip(); root.remove(); };
  },
};
