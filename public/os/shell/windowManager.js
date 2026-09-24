/**
 * windowManager.js
 * openApp(appDef, ctx) → create / focus window
 * closeApp(id)
 * focus(id)
 * getOpenWindows() → Map<id, {win, appDef, minimized}>
 */

const workspace = document.getElementById('workspace');
let zCounter = 10;
const openWindows = new Map(); // id → { el, titlebarEl, bodyEl, cleanup, minimized }
let _taskbarUpdate = null;
let osVisible = true;

function updateVisibility(entry) {
  entry.setVisible?.(osVisible && !entry.minimized);
}

window.addEventListener('v3:visibility', (event) => {
  osVisible = event.detail?.state !== 'room';
  openWindows.forEach(updateVisibility);
});

export function setTaskbarCallback(fn) {
  _taskbarUpdate = fn;
}

function notify() {
  if (_taskbarUpdate) _taskbarUpdate(openWindows);
}

export function focus(id) {
  const entry = openWindows.get(id);
  if (!entry) return;
  // Unminimize if needed
  if (entry.minimized) {
    entry.minimized = false;
    entry.el.classList.remove('minimized');
  }
  zCounter++;
  entry.el.style.zIndex = zCounter;
  document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
  entry.el.classList.add('focused');
  updateVisibility(entry);
  notify();
}

export function closeApp(id) {
  const entry = openWindows.get(id);
  if (!entry) return;
  entry.setVisible?.(false);
  if (entry.cleanup) {
    try { entry.cleanup(); } catch (_) {}
  }
  if (window.gsap) {
    gsap.to(entry.el, {
      scale: 0.85, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => { entry.el.remove(); }
    });
  } else {
    entry.el.remove();
  }
  openWindows.delete(id);
  notify();
}

export function minimizeApp(id) {
  const entry = openWindows.get(id);
  if (!entry) return;
  entry.minimized = !entry.minimized;
  entry.el.classList.toggle('minimized', entry.minimized);
  updateVisibility(entry);
  notify();
}

export function openApp(appDef, ctx) {
  // If already open, focus it
  if (openWindows.has(appDef.id)) {
    focus(appDef.id);
    return;
  }

  const wsRect = workspace.getBoundingClientRect();
  const W = Math.min(appDef.width || 500, wsRect.width - 40);
  const H = Math.min(appDef.height || 360, wsRect.height - 60);

  const cascade = openWindows.size;
  const startX = Math.min(80 + cascade * 28, wsRect.width - W - 20);
  const startY = Math.min(30 + cascade * 28, wsRect.height - H - 20);

  const win = document.createElement('div');
  win.className = 'os-window';
  win.style.width = W + 'px';
  win.style.height = H + 'px';
  win.style.left = Math.max(8, startX) + 'px';
  win.style.top = Math.max(8, startY) + 'px';

  win.innerHTML = `
    <div class="win-titlebar" data-drag>
      <div class="traffic-lights">
        <div class="tl red" data-close title="Close"></div>
        <div class="tl yellow" data-minimize title="Minimize"></div>
        <div class="tl green-tl" data-maximize title="Fill the screen"></div>
      </div>
      <div class="win-title">${appDef.title}</div>
    </div>
    <div class="win-body" id="win-body-${appDef.id}"></div>
  `;

  workspace.appendChild(win);

  // Wire traffic lights
  win.querySelector('[data-close]').addEventListener('click', e => {
    e.stopPropagation();
    closeApp(appDef.id);
  });
  win.querySelector('[data-minimize]').addEventListener('click', e => {
    e.stopPropagation();
    minimizeApp(appDef.id);
  });

  win.querySelector('[data-maximize]').addEventListener('click', e => {
    e.stopPropagation();
    toggleMaximize(appDef.id);
  });
  win.querySelector('[data-drag]').addEventListener('dblclick', e => {
    if (e.target.closest('.tl')) return;
    toggleMaximize(appDef.id);
  });

  // Focus on mousedown
  win.addEventListener('mousedown', () => focus(appDef.id), { capture: true });

  // Draggable titlebar
  _makeDraggable(win, win.querySelector('[data-drag]'));

  // Animate open
  if (window.gsap) {
    gsap.set(win, { scale: 0.88, opacity: 0, transformOrigin: 'center top' });
    gsap.to(win, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(1.4)' });
  }

  // Mount app
  const bodyEl = document.getElementById('win-body-' + appDef.id);
  let cleanup = null;
  let setVisible = null;
  try {
    const result = appDef.mount(bodyEl, ctx);
    if (typeof result === 'function') cleanup = result;
    else if (result) {
      if (typeof result.cleanup === 'function') cleanup = result.cleanup;
      if (typeof result.setVisible === 'function') setVisible = result.setVisible;
    }
  } catch (e) {
    console.error(`[windowManager] ${appDef.id} mount error:`, e);
    bodyEl.innerHTML = `<div class="app-error">App failed to mount:<br>${e.message}</div>`;
  }

  openWindows.set(appDef.id, {
    el: win, titlebarEl: win.querySelector('.win-titlebar'), bodyEl,
    cleanup, setVisible, minimized: false,
  });

  focus(appDef.id);
  notify();
}

// Fill the workspace, or go back to the size and place it had before. Apps
// resize their own canvases through ResizeObserver on the window body.
export function toggleMaximize(id) {
  const entry = openWindows.get(id);
  if (!entry) return;
  const { el } = entry;
  if (entry.restore) {
    Object.assign(el.style, entry.restore);
    entry.restore = null;
    el.classList.remove('maximized');
  } else {
    entry.restore = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
    fitMaximized(el);
    el.classList.add('maximized');
  }
  focus(id);
}

function fitMaximized(el) {
  const wsRect = workspace.getBoundingClientRect();
  Object.assign(el.style, { left: '0px', top: '0px', width: wsRect.width + 'px', height: wsRect.height + 'px' });
}

export function getOpenWindows() {
  return openWindows;
}

function _makeDraggable(win, handle) {
  let dragging = false, ox = 0, oy = 0;

  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('.tl') || win.classList.contains('maximized')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const wsRect = workspace.getBoundingClientRect();
    let nx = e.clientX - ox;
    let ny = e.clientY - oy;
    nx = Math.max(0, Math.min(nx, wsRect.width - win.offsetWidth));
    ny = Math.max(0, Math.min(ny, wsRect.height - win.offsetHeight));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
  });

  handle.addEventListener('pointerup', () => { dragging = false; });
  handle.addEventListener('pointercancel', () => { dragging = false; });
}

// Keep windows on-screen on resize
window.addEventListener('resize', () => {
  const wsRect = workspace.getBoundingClientRect();
  openWindows.forEach(({ el, restore }) => {
    if (restore) { fitMaximized(el); return; }
    const l = parseInt(el.style.left) || 0;
    const t = parseInt(el.style.top) || 0;
    el.style.left = Math.max(0, Math.min(l, wsRect.width - el.offsetWidth)) + 'px';
    el.style.top = Math.max(0, Math.min(t, wsRect.height - el.offsetHeight)) + 'px';
  });
});
