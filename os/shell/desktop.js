/**
 * desktop.js — Builds icons, clock, sound toggle, contact button, exploration meter, taskbar.
 */
import { openApp, setTaskbarCallback, focus, minimizeApp } from './windowManager.js';

export function initDesktop(apps, ctx) {
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
  soundBtn.addEventListener('click', () => {
    const on = ctx.audio.toggle();
    soundBtn.textContent = on ? '♪ ON' : '♪ OFF';
    soundBtn.classList.toggle('on', on);
  });

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

  // ── Desktop icons ──
  const workspace = document.getElementById('workspace');
  apps.forEach((app, i) => {
    const icon = document.createElement('div');
    icon.className = 'desk-icon';
    icon.style.top = (40 + i * 88) + 'px';
    icon.style.left = '20px';
    icon.innerHTML = `
      <div class="icon-glyph">${app.icon}</div>
      <div class="icon-label">${app.title}</div>
    `;
    icon.addEventListener('dblclick', () => ctx.openApp(app.id));
    let clickTimer = null;
    icon.addEventListener('click', () => {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; ctx.openApp(app.id); return; }
      clickTimer = setTimeout(() => { clickTimer = null; }, 300);
    });
    workspace.appendChild(icon);
  });

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
