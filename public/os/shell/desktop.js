/**
 * desktop.js — Builds icons, clock, sound toggle, contact button, exploration meter, taskbar.
 */
import { openApp, setTaskbarCallback, focus, minimizeApp } from './windowManager.js';
import { applyWallpaper } from '../apps/wallpaper.js';

export function initDesktop(apps, ctx) {
  const savedWallpaper = ctx.store.get('wallpaper.palette') || 'green';
  applyWallpaper(savedWallpaper);
  // ── Clock ──
  const clockEl = document.getElementById('clock');
  function tick() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2, '0');
    const m = String(n.getMinutes()).padStart(2, '0');
    const s = String(n.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);

  // ── Sound toggle ──
  const soundBtn = document.getElementById('sound-toggle');
  const parentMusic = (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.__v3Music)
    ? window.parent.__v3Music
    : null;
  if (parentMusic) {
    const updateSoundBtn = (st) => {
      const on = st.playing;
      soundBtn.textContent = on ? '♪ ON' : '♪ OFF';
      soundBtn.classList.toggle('on', on);
    };
    parentMusic.subscribe(updateSoundBtn);
    soundBtn.addEventListener('click', () => {
      parentMusic.toggle();
    });
  } else {
    soundBtn.addEventListener('click', () => {
      const on = ctx.audio.toggle();
      soundBtn.textContent = on ? '♪ ON' : '♪ OFF';
      soundBtn.classList.toggle('on', on);
    });
  }

  // ── Contact button ──
  const menubar = document.getElementById('menubar');
  const contactBtn = document.createElement('button');
  contactBtn.id = 'contact-btn';
  contactBtn.textContent = '✉ contact';
  contactBtn.style.cssText = [
    'background:none', 'border:1px solid rgba(92,255,208,0.25)',
    'color:rgba(92,255,208,0.6)', "font:10px 'JetBrains Mono',monospace",
    'letter-spacing:0.1em', 'padding:3px 10px', 'cursor:pointer',
    'transition:all 0.2s', 'margin-left:8px',
  ].join(';');
  contactBtn.addEventListener('mouseover', () => {
    contactBtn.style.borderColor = 'rgba(92,255,208,0.7)';
    contactBtn.style.color = '#5cffd0';
  });
  contactBtn.addEventListener('mouseout', () => {
    contactBtn.style.borderColor = 'rgba(92,255,208,0.25)';
    contactBtn.style.color = 'rgba(92,255,208,0.6)';
  });
  contactBtn.addEventListener('click', () => ctx.openContact());

  // Insert contact button before the clock
  if (clockEl && clockEl.parentNode === menubar) {
    menubar.insertBefore(contactBtn, clockEl);
  } else {
    menubar.appendChild(contactBtn);
  }

  // ── Exploration meter ──
  const exploredEl = document.createElement('span');
  exploredEl.id = 'explored-meter';
  exploredEl.style.cssText = [
    "font:9px 'JetBrains Mono',monospace", 'color:rgba(92,255,208,0.3)',
    'letter-spacing:0.12em', 'margin-left:12px',
  ].join(';');
  exploredEl.textContent = 'SYS ▸ 0%';
  menubar.insertBefore(exploredEl, contactBtn);

  let toastTimeout = null;
  function updateMeter({ count }) {
    const total = apps.length;
    const pct = Math.round((count / total) * 100);
    exploredEl.textContent = `SYS ▸ ${pct}%`;
    if (pct >= 100 && !toastTimeout) {
      toastTimeout = setTimeout(() => showToast('SYSTEM: ALL APPS EXPLORED — open contact to reach Dhruv'), 400);
    }
  }
  ctx.store.on('explored:change', updateMeter);
  // Sync on load
  const initCount = ctx.store.exploredCount();
  if (initCount > 0) {
    const pct = Math.round((initCount / apps.length) * 100);
    exploredEl.textContent = `SYS ▸ ${pct}%`;
  }

  // ── Toast helper ──
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed', 'bottom:52px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:9999', 'background:#0c1610',
      'border:1px solid rgba(92,255,208,0.35)', 'padding:8px 20px',
      "font:10px 'JetBrains Mono',monospace", 'color:#5cffd0',
      'letter-spacing:0.08em', 'opacity:0', 'pointer-events:none',
      'transition:opacity 0.3s',
    ].join(';');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 350);
      }, 3200);
    });
  }

  // Projects come first. Secondary tools remain available without competing
  // with the work, and every launcher supports one click and keyboard input.
  const workspace = document.getElementById('workspace');
  const projectIds = ['darksentinel', 'focuslock', 'crisiswatch', 'fraud'];
  const launchers = document.createElement('div');
  launchers.className = 'desktop-launchers';
  workspace.appendChild(launchers);
  for (const [title, entries] of [
    ['PROJECTS', projectIds.map(id => apps.find(app => app.id === id)).filter(Boolean)],
    ['ABOUT & TOOLS', apps.filter(app => !projectIds.includes(app.id) && !app.hideIcon)],
  ]) {
    const section = document.createElement('section');
    section.className = 'desktop-app-group';
    section.setAttribute('aria-label', title);
    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);
    launchers.appendChild(section);
    entries.forEach(app => {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'desk-icon';
    icon.setAttribute('aria-label', `Open ${app.title}`);
    icon.innerHTML = `
      <div class="icon-glyph">${app.icon}</div>
      <div class="icon-label">${app.title}</div>
    `;
    icon.addEventListener('click', () => ctx.openApp(app.id));
    section.appendChild(icon);
    });
  }

  // ── Right-click context menu ──
  let ctxMenu = null;
  function removeCtxMenu() {
    if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; }
  }

  workspace.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    removeCtxMenu();

    ctxMenu = document.createElement('div');
    ctxMenu.style.cssText = [
      'position:absolute',
      `left:${e.clientX - workspace.getBoundingClientRect().left}px`,
      `top:${e.clientY - workspace.getBoundingClientRect().top}px`,
      'background:#0c1610', 'border:1px solid rgba(92,255,208,0.22)',
      "font-family:'JetBrains Mono',monospace",
      'color:rgba(92,255,208,0.8)', 'z-index:8000',
      'min-width:170px', 'padding:4px 0',
      'box-shadow:0 6px 28px rgba(0,0,0,0.6)',
    ].join(';');

    const items = [
      { label: '⊚  Skills',        action: () => ctx.openApp('skills') },
      { label: '⚡  DarkSentinel',  action: () => ctx.openApp('darksentinel') },
      { label: '🛡️  FocusLock',     action: () => ctx.openApp('focuslock') },
      { label: '🔍  CrisisWatch',   action: () => ctx.openApp('crisiswatch') },
      { label: '⚖️  Fraud Detect',  action: () => ctx.openApp('fraud') },
      { label: '♫  Music Player',  action: () => ctx.openApp('music') },
      null,
      { label: '≋  Wallpaper', action: () => ctx.openApp('wallpaper') },
      { label: '✉  Contact',   action: () => ctx.openContact() },
      null,
      { label: '↺  Reset explored', action: () => {
        try { localStorage.removeItem('dhruvos.v1'); } catch (_) {}
        location.reload();
      }},
    ];

    items.forEach(item => {
      if (!item) {
        const sep = document.createElement('div');
        sep.style.cssText = 'height:1px;background:rgba(92,255,208,0.09);margin:3px 0;';
        ctxMenu.appendChild(sep);
        return;
      }
      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = [
        'display:block', 'width:100%', 'background:none', 'border:none',
        "padding:7px 16px", "font:10px 'JetBrains Mono',monospace",
        'color:rgba(92,255,208,0.8)', 'cursor:pointer', 'text-align:left',
        'letter-spacing:0.04em', 'transition:background 0.1s',
      ].join(';');
      btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(92,255,208,0.07)'; });
      btn.addEventListener('mouseout',  () => { btn.style.background = 'none'; });
      btn.addEventListener('click', () => { removeCtxMenu(); item.action(); });
      ctxMenu.appendChild(btn);
    });

    workspace.appendChild(ctxMenu);
  });

  workspace.addEventListener('click', removeCtxMenu);

  // ── Taskbar ──
  const taskbar = document.getElementById('taskbar');
  setTaskbarCallback((openWindows) => {
    taskbar.innerHTML = '';
    openWindows.forEach((entry, id) => {
      const app = apps.find(a => a.id === id);
      const btn = document.createElement('button');
      btn.className = 'taskbar-btn' +
        (entry.el.classList.contains('focused') ? ' focused' : '') +
        (entry.minimized ? ' minimized' : '');
      btn.textContent = (app ? app.icon + ' ' : '') + (app ? app.title : id);
      btn.addEventListener('click', () => {
        if (entry.minimized || !entry.el.classList.contains('focused')) {
          focus(id);
        } else {
          minimizeApp(id);
        }
      });
      taskbar.appendChild(btn);
    });
  });
}
