// os/apps/contact.js — contact card
import content from '../shell/content.js';

export default {
  id: 'contact',
  title: 'contact',
  icon: '✉',
  width: 480,
  height: 320,

  mount(body) {
    const { identity, contact } = content;
    body.style.cssText = [
      'position:relative', 'overflow:hidden', 'background:#050a08',
      "font-family:'JetBrains Mono',monospace",
      'display:flex', 'align-items:center', 'justify-content:center',
    ].join(';');

    // scanline texture
    const scanlines = document.createElement('div');
    scanlines.style.cssText = [
      'position:absolute', 'inset:0', 'pointer-events:none', 'z-index:0',
      'background:repeating-linear-gradient(transparent 0,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px)',
    ].join(';');
    body.appendChild(scanlines);

    const card = document.createElement('div');
    card.style.cssText = [
      'position:relative', 'z-index:1', 'width:340px',
      'border:1px solid rgba(92,255,208,0.22)', 'padding:32px 34px 28px',
    ].join(';');

    // corner accents
    [
      'top:0;left:0;border-top:1px solid #5cffd0;border-left:1px solid #5cffd0;',
      'top:0;right:0;border-top:1px solid #5cffd0;border-right:1px solid #5cffd0;',
      'bottom:0;left:0;border-bottom:1px solid #5cffd0;border-left:1px solid #5cffd0;',
      'bottom:0;right:0;border-bottom:1px solid #5cffd0;border-right:1px solid #5cffd0;',
    ].forEach(css => {
      const c = document.createElement('div');
      c.style.cssText = `position:absolute;width:14px;height:14px;${css}`;
      card.appendChild(c);
    });

    // header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'font-size:8px;letter-spacing:0.32em;color:rgba(92,255,208,0.35);margin-bottom:22px;';
    hdr.textContent = 'CONTACT // DHRUV KOTHARI';
    card.appendChild(hdr);

    // name
    const name = document.createElement('div');
    name.style.cssText = 'font-size:20px;letter-spacing:0.06em;color:#5cffd0;font-weight:700;margin-bottom:4px;';
    name.textContent = identity.name;
    card.appendChild(name);

    // role
    const role = document.createElement('div');
    role.style.cssText = 'font-size:11px;color:rgba(92,255,208,0.5);letter-spacing:0.05em;margin-bottom:2px;';
    role.textContent = identity.role;
    card.appendChild(role);

    // location
    const loc = document.createElement('div');
    loc.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.3);letter-spacing:0.05em;margin-bottom:26px;';
    loc.textContent = identity.location;
    card.appendChild(loc);

    // divider
    const div = document.createElement('div');
    div.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.15);letter-spacing:0.12em;margin-bottom:16px;';
    div.textContent = '─────────────────────';
    card.appendChild(div);

    // email row
    const emailRow = document.createElement('div');
    emailRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;';

    const emailIcon = document.createElement('span');
    emailIcon.style.cssText = 'font-size:12px;color:rgba(92,255,208,0.35);flex-shrink:0;';
    emailIcon.textContent = '✉';

    const emailText = document.createElement('span');
    emailText.style.cssText = 'font-size:11px;color:rgba(92,255,208,0.75);letter-spacing:0.03em;transition:color 0.15s;';
    emailText.textContent = contact.email;

    const copyHint = document.createElement('span');
    copyHint.style.cssText = 'font-size:8px;color:rgba(92,255,208,0.25);letter-spacing:0.1em;margin-left:auto;';
    copyHint.textContent = '[click to copy]';

    emailRow.append(emailIcon, emailText, copyHint);
    card.appendChild(emailRow);

    // github row
    const ghRow = document.createElement('div');
    ghRow.style.cssText = 'display:flex;align-items:center;gap:10px;' + (contact.resume ? 'margin-bottom:22px;' : '');

    const ghIcon = document.createElement('span');
    ghIcon.style.cssText = 'font-size:12px;color:rgba(92,255,208,0.35);flex-shrink:0;';
    ghIcon.textContent = '⌥';

    const ghLink = document.createElement('a');
    ghLink.href = contact.github;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghLink.textContent = contact.githubLabel;
    ghLink.style.cssText = 'font-size:11px;color:rgba(92,255,208,0.75);text-decoration:none;letter-spacing:0.03em;transition:color 0.15s;';

    ghRow.append(ghIcon, ghLink);
    card.appendChild(ghRow);

    if (contact.resume) {
      const resLink = document.createElement('a');
      resLink.href = contact.resume;
      resLink.target = '_blank';
      resLink.rel = 'noopener noreferrer';
      resLink.textContent = '↓ DOWNLOAD RESUME';
      resLink.style.cssText = [
        'display:inline-block', 'font-size:9px', 'letter-spacing:0.18em',
        'color:#d9d4c7', 'text-decoration:none',
        'border:1px solid rgba(217,212,199,0.4)', 'padding:7px 18px',
        'transition:border-color 0.15s',
      ].join(';');
      resLink.addEventListener('mouseover', () => { resLink.style.borderColor = '#d9d4c7'; });
      resLink.addEventListener('mouseout',  () => { resLink.style.borderColor = 'rgba(217,212,199,0.4)'; });
      card.appendChild(resLink);
    }

    body.appendChild(card);

    // interactions
    function onEmailClick() {
      navigator.clipboard.writeText(contact.email).catch(() => {});
      emailText.textContent = '✓ copied to clipboard';
      emailText.style.color = '#5cffd0';
      copyHint.style.display = 'none';
      setTimeout(() => {
        emailText.textContent = contact.email;
        emailText.style.color = 'rgba(92,255,208,0.75)';
        copyHint.style.display = '';
      }, 2000);
    }
    function onEmailOver() { emailText.style.color = '#5cffd0'; }
    function onEmailOut()  { emailText.style.color = 'rgba(92,255,208,0.75)'; }
    function onGhOver()    { ghLink.style.color = '#5cffd0'; }
    function onGhOut()     { ghLink.style.color = 'rgba(92,255,208,0.75)'; }

    emailRow.addEventListener('click',     onEmailClick);
    emailRow.addEventListener('mouseover', onEmailOver);
    emailRow.addEventListener('mouseout',  onEmailOut);
    ghLink.addEventListener('mouseover',   onGhOver);
    ghLink.addEventListener('mouseout',    onGhOut);

    return function cleanup() {
      emailRow.removeEventListener('click',     onEmailClick);
      emailRow.removeEventListener('mouseover', onEmailOver);
      emailRow.removeEventListener('mouseout',  onEmailOut);
      ghLink.removeEventListener('mouseover',   onGhOver);
      ghLink.removeEventListener('mouseout',    onGhOut);
    };
  },
};
