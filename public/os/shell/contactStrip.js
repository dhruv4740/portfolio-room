// os/shell/contactStrip.js — one-line contact footer, mountable by any app
import content from './content.js';

export function mountContactStrip(el) {
  const { email, github, githubLabel, resume } = content.contact;

  const strip = document.createElement('div');
  strip.style.cssText = [
    'position:absolute', 'bottom:0', 'left:0', 'right:0', 'height:36px',
    'display:flex', 'align-items:center', 'gap:20px', 'padding:0 18px',
    'border-top:1px solid rgba(92,255,208,0.1)',
    'background:rgba(5,10,8,0.94)', 'backdrop-filter:blur(4px)',
    "font-family:'JetBrains Mono',monospace", 'font-size:10px',
    'color:rgba(92,255,208,0.45)', 'z-index:20', 'flex-shrink:0',
    'box-sizing:border-box',
  ].join(';');

  function makeBtn(text, title, onClick) {
    const btn = document.createElement('button');
    btn.style.cssText = [
      'background:none', 'border:none', 'padding:0', 'cursor:pointer',
      "font:10px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.55)',
      'letter-spacing:0.06em', 'transition:color 0.15s',
    ].join(';');
    btn.textContent = text;
    if (title) btn.title = title;
    btn.addEventListener('mouseover', () => { btn.style.color = '#5cffd0'; });
    btn.addEventListener('mouseout',  () => { btn.style.color = 'rgba(92,255,208,0.55)'; });
    btn.addEventListener('click', onClick);
    return btn;
  }

  const emailBtn = makeBtn('✉ ' + email, 'Copy email address', () => {
    navigator.clipboard.writeText(email).catch(() => {});
    const orig = emailBtn.textContent;
    emailBtn.textContent = '✓ copied';
    emailBtn.style.color = '#5cffd0';
    setTimeout(() => { emailBtn.textContent = orig; emailBtn.style.color = 'rgba(92,255,208,0.55)'; }, 1800);
  });

  const ghLink = document.createElement('a');
  ghLink.href = github;
  ghLink.target = '_blank';
  ghLink.rel = 'noopener noreferrer';
  ghLink.textContent = '⌥ ' + githubLabel;
  ghLink.style.cssText = [
    "font:10px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.45)',
    'text-decoration:none', 'letter-spacing:0.06em', 'transition:color 0.15s',
  ].join(';');
  ghLink.addEventListener('mouseover', () => { ghLink.style.color = '#5cffd0'; });
  ghLink.addEventListener('mouseout',  () => { ghLink.style.color = 'rgba(92,255,208,0.45)'; });

  strip.appendChild(emailBtn);
  strip.appendChild(ghLink);

  if (resume) {
    const resLink = document.createElement('a');
    resLink.href = resume;
    resLink.target = '_blank';
    resLink.rel = 'noopener noreferrer';
    resLink.textContent = '↓ resume';
    resLink.style.cssText = [
      'margin-left:auto', "font:9px 'JetBrains Mono',monospace",
      'color:#d9d4c7', 'text-decoration:none', 'letter-spacing:0.12em',
      'border:1px solid rgba(217,212,199,0.35)', 'padding:3px 10px',
      'transition:border-color 0.15s',
    ].join(';');
    resLink.addEventListener('mouseover', () => { resLink.style.borderColor = '#d9d4c7'; });
    resLink.addEventListener('mouseout',  () => { resLink.style.borderColor = 'rgba(217,212,199,0.35)'; });
    strip.appendChild(resLink);
  }

  // Pad the container so content doesn't sit under the strip
  const origPB = el.style.paddingBottom;
  el.style.paddingBottom = '36px';
  el.appendChild(strip);

  return function remove() {
    strip.remove();
    el.style.paddingBottom = origPB;
  };
}
