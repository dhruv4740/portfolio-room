// Readable project catalog. Content stays shared with /work and the phone deck.
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

const desktopApps = new Set(['darksentinel', 'focuslock', 'crisiswatch', 'fraud']);
const CSS = `
.ql-root { height:100%; display:flex; flex-direction:column; background:#101516; color:#e9ebe5; font-family:Inter,system-ui,sans-serif; }
.ql-heading { padding:24px 28px 18px; border-bottom:1px solid #35413c; }
.ql-heading p { color:#aebcb4; margin:0 0 8px; font-size:12px; letter-spacing:.12em; }
.ql-heading h1 { margin:0; font-size:28px; font-weight:500; letter-spacing:-.03em; }
.ql-scroll { padding:22px 28px; overflow:auto; flex:1; min-height:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(min(290px,100%),1fr)); gap:16px; align-content:start; }
.ql-card { padding:20px; border:1px solid #3a4741; background:#151d1b; border-radius:8px; }
.ql-card h2 { margin:0 0 12px; font-size:21px; font-weight:550; }
.ql-type { font:12px monospace; color:#aab9b0; margin:0 0 10px; }
.ql-desc-text { font-size:15px; line-height:1.65; color:#c5d0c9; margin:0 0 18px; }
.ql-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.ql-actions button,.ql-links a { font:13px system-ui,sans-serif; min-height:40px; padding:10px 14px; border:1px solid #677b6d; border-radius:4px; background:transparent; color:#e9ebe5; cursor:pointer; text-decoration:none; }
.ql-actions .ql-demo { background:#d8e4d8; color:#142018; border-color:#d8e4d8; }
.ql-actions button:hover,.ql-links a:hover { border-color:#edf6eb; }
.ql-actions button:focus-visible,.ql-links a:focus-visible { outline:2px solid #edf6eb; outline-offset:3px; }
.ql-details { margin-top:16px; padding-top:16px; border-top:1px solid #35413c; }
.ql-details[hidden] { display:none; }
.ql-tags { font:13px monospace; line-height:1.8; color:#aebfb2; margin-bottom:12px; }
.ql-links { display:flex; gap:10px; flex-wrap:wrap; }
.ql-mobile-note { color:#b9c6bc; font-size:13px; margin:14px 0 0; }
`;

function node(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export default {
  id: 'projects', title: 'projects', icon: '◇', width: 1080, height: 740,
  mount(body, ctx) {
    const root = node('div', 'ql-root');
    const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
    const heading = node('header', 'ql-heading');
    heading.append(node('p', '', 'SELECTED WORK'), node('h1', '', 'Open a project. Try it yourself.'));
    root.appendChild(heading);
    const scroll = node('div', 'ql-scroll'); root.appendChild(scroll); body.appendChild(root);
    const cards = new Map();
    const ordered = [...content.projects].sort((a,b) => Number(desktopApps.has(b.id))-Number(desktopApps.has(a.id)));
    for (const project of ordered) {
      const card = node('article', 'ql-card'); cards.set(project.id, card);
      card.append(node('p', 'ql-type', `${desktopApps.has(project.id) ? 'INTERACTIVE DESKTOP DEMO' : 'PROJECT'} · ${project.year}`));
      card.append(node('h2', '', project.name), node('p', 'ql-desc-text', project.description));
      const actions = node('div', 'ql-actions'); card.appendChild(actions);
      if (desktopApps.has(project.id)) {
        const launch = node('button', 'ql-demo', 'Open demo ↗'); launch.type = 'button';
        launch.addEventListener('click', () => ctx.openApp(project.id)); actions.appendChild(launch);
      }
      const toggle = node('button', 'ql-detail-toggle', 'Details & source'); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false'); actions.appendChild(toggle);
      const details = node('div', 'ql-details'); details.hidden = true;
      details.appendChild(node('div', 'ql-tags', project.tech.join(' · ')));
      const links = node('div', 'ql-links');
      for (const [key,label] of [['github','Source ↗'],['live','Live site ↗']]) {
        if (!project.links[key]) continue;
        const link = node('a', '', label); link.href = project.links[key]; link.target = '_blank'; link.rel = 'noopener noreferrer'; links.appendChild(link);
      }
      details.appendChild(links); card.appendChild(details);
      if (['expense','basket'].includes(project.id)) card.appendChild(node('p','ql-mobile-note','Explore the Android UI through Mobile projects in the room.'));
      const expand = () => { details.hidden = false; toggle.setAttribute('aria-expanded','true'); card.classList.add('ql-decoded'); };
      toggle.addEventListener('click', () => { if(details.hidden) expand(); else { details.hidden=true;toggle.setAttribute('aria-expanded','false');card.classList.remove('ql-decoded'); } });
      card.expand = expand;
      scroll.appendChild(card);
    }
    const unsubscribe = ctx.store?.on('open-project', ({id}) => { const card=cards.get(id); if(card){card.expand();card.scrollIntoView({block:'nearest'});} });
    const removeStrip = mountContactStrip(root);
    return () => { unsubscribe?.(); removeStrip(); root.remove(); };
  },
};
