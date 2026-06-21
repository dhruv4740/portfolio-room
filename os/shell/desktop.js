/**
 * desktop.js — Builds icons from registry, starts clock, wires sound toggle, renders taskbar.
 */
import { openApp, setTaskbarCallback, focus, minimizeApp, getOpenWindows } from './windowManager.js';

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
    icon.addEventListener('dblclick', () => openApp(app, ctx));
    // Single-click also works (common on OS UIs)
    let clickTimer = null;
    icon.addEventListener('click', () => {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; openApp(app, ctx); return; }
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
      btn.className = 'taskbar-btn' + (entry.el.classList.contains('focused') ? ' focused' : '') + (entry.minimized ? ' minimized' : '');
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
