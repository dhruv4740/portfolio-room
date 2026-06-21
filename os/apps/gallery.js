// gallery.js — kinetic project showcase for dhruvOS
const PROJECTS = [
  {
    num: '01',
    name: 'Reddit Growth Copilot',
    year: '2024',
    tags: ['AI', 'Node.js', 'Reddit API'],
    desc: 'AI pipeline that finds relevant Reddit threads and auto-drafts on-brand replies for growth teams. Processes 1 000+ threads per day.',
  },
  {
    num: '02',
    name: 'GeoSVG Maps',
    year: '2024',
    tags: ['SVG', 'Leaflet.js', 'Web API'],
    desc: 'Interactive SVG map generator with live coordinate overlay and custom region rendering. Exports clean vector output.',
  },
  {
    num: '03',
    name: '3D Portfolio',
    year: '2025',
    tags: ['React Three Fiber', 'Three.js', 'GSAP'],
    desc: 'Immersive R3F portfolio with physics-driven walkable room, shader transitions, real-time postFX and a terminal boot sequence.',
  },
  {
    num: '04',
    name: 'dhruvOS',
    year: '2026',
    tags: ['Canvas 2D', 'Web Audio', 'ES Modules'],
    desc: 'This OS. A fake retro-future desktop environment: draggable windows, working terminal, live wallpaper, and multiple app concepts baked in.',
  },
];

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

function scrambleTo(el, final, ms = 520) {
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
  width: 720,
  height: 560,

  mount(body, _ctx) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden',
      'background:#050a08',
      'font-family:"JetBrains Mono","Courier New",monospace',
      'color:#5cffd0',
    ].join(';');

    const scroller = document.createElement('div');
    scroller.style.cssText = [
      'position:absolute', 'inset:0', 'overflow-y:auto', 'overflow-x:hidden',
      'scrollbar-width:thin', 'scrollbar-color:rgba(92,255,208,0.2) transparent',
    ].join(';');
    body.appendChild(scroller);

    // header
    const hdr = document.createElement('div');
    hdr.style.cssText = 'padding:28px 40px 18px;border-bottom:1px solid rgba(92,255,208,0.1);';
    hdr.innerHTML = `
      <div style="font-size:9px;letter-spacing:0.22em;color:rgba(92,255,208,0.35);margin-bottom:8px;">SELECTED WORK — DHRUV KOTHARI</div>
      <div style="font-size:20px;font-weight:700;letter-spacing:0.04em;">dhruv.work</div>`;
    scroller.appendChild(hdr);

    const titleEls = [];
    const cleanupFns = [];

    PROJECTS.forEach((proj) => {
      const card = document.createElement('div');
      card.style.cssText = [
        'padding:32px 40px 28px',
        'border-bottom:1px solid rgba(92,255,208,0.07)',
        'cursor:default',
        'position:relative',
        'transition:background 0.2s',
      ].join(';');

      // row: number + title + year
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:baseline;gap:20px;margin-bottom:10px;';

      const num = document.createElement('span');
      num.textContent = proj.num;
      num.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.28);letter-spacing:0.18em;flex-shrink:0;padding-top:2px;';

      const title = document.createElement('div');
      title.textContent = proj.name;
      title.style.cssText = [
        'font-size:26px', 'font-weight:700', 'letter-spacing:-0.01em', 'line-height:1.1',
        'will-change:transform', 'transition:transform 0.08s linear',
      ].join(';');
      titleEls.push(title);

      const yr = document.createElement('span');
      yr.textContent = proj.year;
      yr.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.28);letter-spacing:0.1em;margin-left:auto;flex-shrink:0;';

      row.append(num, title, yr);

      const desc = document.createElement('div');
      desc.textContent = proj.desc;
      desc.style.cssText = 'font-size:11px;color:rgba(92,255,208,0.5);line-height:1.75;margin-bottom:14px;padding-left:46px;';

      const tagRow = document.createElement('div');
      tagRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;padding-left:46px;';
      proj.tags.forEach(tag => {
        const t = document.createElement('span');
        t.textContent = tag;
        t.style.cssText = [
          'font-size:8px', 'letter-spacing:0.16em', 'padding:3px 9px',
          'border:1px solid rgba(92,255,208,0.18)', 'border-radius:2px',
          'color:rgba(92,255,208,0.55)',
        ].join(';');
        tagRow.appendChild(t);
      });

      // hover arrow
      const arrow = document.createElement('div');
      arrow.textContent = '→';
      arrow.style.cssText = [
        'position:absolute', 'right:38px', 'top:50%',
        'transform:translateY(-50%)',
        'font-size:18px', 'opacity:0',
        'transition:opacity 0.18s, transform 0.18s',
        'color:rgba(92,255,208,0.6)',
      ].join(';');

      card.append(row, desc, tagRow, arrow);
      scroller.appendChild(card);

      let stopScramble = null;
      const onEnter = () => {
        card.style.background = 'rgba(92,255,208,0.025)';
        arrow.style.opacity = '1';
        arrow.style.transform = 'translateY(-50%) translateX(5px)';
        if (stopScramble) stopScramble();
        stopScramble = scrambleTo(title, proj.name, 500);
      };
      const onLeave = () => {
        card.style.background = '';
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
      titleEls.forEach(el => { el.style.transform = skew !== 0 ? `skewY(${skew}deg)` : ''; });
      if (Math.abs(vel) > 0.08) {
        skewRaf = requestAnimationFrame(decaySkew);
      } else {
        vel = 0;
        titleEls.forEach(el => { el.style.transform = ''; });
        skewRaf = null;
      }
    }

    function onScroll() {
      const cur = scroller.scrollTop;
      vel = cur - lastTop;
      lastTop = cur;
      if (!skewRaf) skewRaf = requestAnimationFrame(decaySkew);
    }
    scroller.addEventListener('scroll', onScroll, { passive: true });

    // footer spacer
    const spacer = document.createElement('div');
    spacer.style.height = '48px';
    scroller.appendChild(spacer);

    const ro = new ResizeObserver(() => {});
    ro.observe(body);

    return function cleanup() {
      cancelAnimationFrame(skewRaf);
      ro.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      cleanupFns.forEach(fn => fn());
      scroller.remove();
    };
  },
};
