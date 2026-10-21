// os/apps/gallery.js — kinetic project showcase driven by content.js
import content from '../shell/content.js';
import { mountContactStrip } from '../shell/contactStrip.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

function scrambleTo(el, final, ms = 500) {
  let frame = 0;
  const total = Math.ceil(ms / 16);
  const id = setInterval(() => {
    frame++;
    const progress = frame / total;
    let out = '';
    for (let i = 0; i < final.length; i++) {
      if (final[i] === ' ') { out += ' '; continue; }
      out += i / final.length < progress
        ? final[i]
        : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = out;
    if (frame >= total) { el.textContent = final; clearInterval(id); }
  }, 16);
  return () => clearInterval(id);
}

export default {
  id: 'gallery',
  title: 'gallery',
  icon: '⊞',
  width: 740,
  height: 560,

  mount(body, ctx) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden', 'background:#050a08',
      "font-family:'JetBrains Mono','Courier New',monospace", 'color:#5cffd0',
    ].join(';');

    const scroller = document.createElement('div');
    scroller.style.cssText = [
      'position:absolute', 'inset:0', 'overflow-y:auto', 'overflow-x:hidden',
      'scrollbar-width:thin', 'scrollbar-color:rgba(92,255,208,0.15) transparent',
      'padding-bottom:40px',
    ].join(';');
    body.appendChild(scroller);

    // header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'padding:28px 44px 20px;border-bottom:1px solid rgba(92,255,208,0.08);';
    hdr.innerHTML = `
      <div style="font-size:8px;letter-spacing:0.26em;color:rgba(92,255,208,0.3);margin-bottom:10px;">SELECTED WORK — DHRUV KOTHARI</div>
      <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;color:#5cffd0;">${content.identity.name.toLowerCase()}.work</div>`;
    scroller.appendChild(hdr);

    const titleEls  = [];
    const cleanupFns = [];

    content.projects.forEach((proj, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      const card = document.createElement('div');
      card.style.cssText = [
        'padding:28px 44px 24px',
        'border-bottom:1px solid rgba(92,255,208,0.06)',
        'cursor:default', 'position:relative',
        'transition:background 0.18s, border-left 0.18s',
        'border-left:3px solid transparent',
      ].join(';');

      // row: num + title + year
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:baseline;gap:20px;margin-bottom:9px;';

      const numEl = document.createElement('span');
      numEl.textContent = num;
      numEl.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.22);letter-spacing:0.18em;flex-shrink:0;padding-top:2px;';

      const title = document.createElement('div');
      title.textContent = proj.name;
      title.style.cssText = [
        'font-size:24px', 'font-weight:700', 'letter-spacing:-0.01em', 'line-height:1.1',
        'will-change:transform', 'transition:transform 0.08s linear', 'flex:1',
      ].join(';');
      titleEls.push(title);

      const yr = document.createElement('span');
      yr.textContent = proj.year;
      yr.style.cssText = 'font-size:12px;color:#d9d4c7;letter-spacing:0.1em;flex-shrink:0;font-weight:700;';

      row.append(numEl, title, yr);

      // tagline
      const tagline = document.createElement('div');
      tagline.textContent = proj.tagline;
      tagline.style.cssText = 'font-size:11px;color:rgba(92,255,208,0.35);line-height:1.65;margin-bottom:5px;padding-left:46px;letter-spacing:0.02em;';

      const desc = document.createElement('div');
      desc.textContent = proj.description;
      desc.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.45);line-height:1.8;margin-bottom:13px;padding-left:46px;max-height:0;overflow:hidden;transition:max-height 0.3s ease;';

      const tagRow = document.createElement('div');
      tagRow.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;padding-left:46px;margin-bottom:10px;';
      proj.tech.forEach(tag => {
        const t = document.createElement('span');
        t.textContent = tag;
        t.style.cssText = [
          'font-size:8px', 'letter-spacing:0.16em', 'padding:2px 8px',
          'border:1px solid rgba(92,255,208,0.16)', 'color:rgba(92,255,208,0.5)',
        ].join(';');
        tagRow.appendChild(t);
      });

      // link chips + open-project CTA
      const linksRow = document.createElement('div');
      linksRow.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;padding-left:46px;';

      if (proj.links.live) {
        const a = document.createElement('a');
        a.href = proj.links.live; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = '↗ live';
        a.style.cssText = 'font-size:9px;letter-spacing:0.14em;padding:3px 10px;border:1px solid rgba(92,255,208,0.25);color:rgba(92,255,208,0.65);text-decoration:none;transition:all 0.15s;';
        a.addEventListener('mouseover', () => { a.style.borderColor = '#5cffd0'; a.style.color = '#5cffd0'; });
        a.addEventListener('mouseout',  () => { a.style.borderColor = 'rgba(92,255,208,0.25)'; a.style.color = 'rgba(92,255,208,0.65)'; });
        linksRow.appendChild(a);
      }
      if (proj.links.github) {
        const a = document.createElement('a');
        a.href = proj.links.github; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = '⌥ github';
        a.style.cssText = 'font-size:9px;letter-spacing:0.14em;padding:3px 10px;border:1px solid rgba(92,255,208,0.25);color:rgba(92,255,208,0.65);text-decoration:none;transition:all 0.15s;';
        a.addEventListener('mouseover', () => { a.style.borderColor = '#5cffd0'; a.style.color = '#5cffd0'; });
        a.addEventListener('mouseout',  () => { a.style.borderColor = 'rgba(92,255,208,0.25)'; a.style.color = 'rgba(92,255,208,0.65)'; });
        linksRow.appendChild(a);
      }

      // "→ open in projects" cross-link
      const detailBtn = document.createElement('button');
      detailBtn.textContent = '→ details';
      detailBtn.style.cssText = [
        'font-size:9px', 'letter-spacing:0.14em', 'padding:3px 10px',
        'border:1px solid rgba(92,255,208,0.18)', 'color:rgba(92,255,208,0.4)',
        "background:none", "cursor:pointer", "font-family:inherit",
        'transition:all 0.15s',
      ].join(';');
      detailBtn.addEventListener('mouseover', () => { detailBtn.style.borderColor = '#5cffd0'; detailBtn.style.color = '#5cffd0'; });
      detailBtn.addEventListener('mouseout',  () => { detailBtn.style.borderColor = 'rgba(92,255,208,0.18)'; detailBtn.style.color = 'rgba(92,255,208,0.4)'; });
      detailBtn.addEventListener('click', (e) => { e.stopPropagation(); ctx?.openProject?.(proj.id); });
      linksRow.appendChild(detailBtn);

      // arrow indicator
      const arrow = document.createElement('div');
      arrow.textContent = '→';
      arrow.style.cssText = [
        'position:absolute', 'right:40px', 'top:50%', 'transform:translateY(-50%)',
        'font-size:16px', 'opacity:0', 'transition:opacity 0.15s, transform 0.15s',
        'color:rgba(92,255,208,0.5)',
      ].join(';');

      card.append(row, tagline, desc, tagRow, linksRow, arrow);
      scroller.appendChild(card);

      let stopScramble = null;
      let expanded = false;

      const onEnter = () => {
        card.style.background = 'rgba(92,255,208,0.02)';
        card.style.borderLeft = '3px solid rgba(92,255,208,0.35)';
        arrow.style.opacity = '1';
        arrow.style.transform = 'translateY(-50%) translateX(5px)';
        if (!expanded) {
          desc.style.maxHeight = '120px';
          expanded = true;
        }
        if (stopScramble) stopScramble();
        stopScramble = scrambleTo(title, proj.name, 480);
      };
      const onLeave = () => {
        card.style.background = '';
        card.style.borderLeft = '3px solid transparent';
        arrow.style.opacity = '0';
        arrow.style.transform = 'translateY(-50%)';
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanupFns.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
        if (stopScramble) stopScramble();
      });
    });

    // kinetic skew on scroll velocity
    let lastTop = 0, vel = 0, skewRaf = null;
    function decaySkew() {
      vel *= 0.82;
      const skew = vel * 0.1;
      titleEls.forEach(el => { el.style.transform = Math.abs(skew) > 0.01 ? `skewY(${skew}deg)` : ''; });
      if (Math.abs(vel) > 0.08) { skewRaf = requestAnimationFrame(decaySkew); }
      else { vel = 0; titleEls.forEach(el => { el.style.transform = ''; }); skewRaf = null; }
    }
    function onScroll() {
      const cur = scroller.scrollTop;
      vel = cur - lastTop; lastTop = cur;
      if (!skewRaf) skewRaf = requestAnimationFrame(decaySkew);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => {});
    ro.observe(body);

    const removeStrip = mountContactStrip(body);

    return function cleanup() {
      cancelAnimationFrame(skewRaf);
      ro.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      cleanupFns.forEach(fn => fn());
      removeStrip();
      scroller.remove();
    };
  },
};
