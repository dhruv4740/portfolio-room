/**
 * main.js — Orchestrates: intro → boot → desktop
 * ES module; loaded as type="module" from index.html.
 */
import audio from './shell/audio.js';
import content from './shell/content.js';
import store from './shell/store.js';
import { initDesktop } from './shell/desktop.js';
import { openApp } from './shell/windowManager.js';
import { runIntro } from './intro/tear.js';
import { initBeneathCanvas } from './shell/beneathCanvas.js';
import apps from './shell/registry.js';

const EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';
const HOST_ORIGIN = window.location.origin;

// ── Build ctx ────────────────────────────────────────────────────────────────
const ctx = {
  openApp: (id) => {
    const app = apps.find(a => a.id === id);
    if (app) {
      store.markExplored(id);
      openApp(app, ctx);
    }
  },
  openProject: (projectId) => {
    store.emit('open-project', { id: projectId });
    const app = apps.find(a => a.id === 'projects');
    if (app) {
      store.markExplored('projects');
      openApp(app, ctx);
    }
  },
  openContact: () => {
    const app = apps.find(a => a.id === 'contact');
    if (app) {
      store.markExplored('contact');
      openApp(app, ctx);
    }
  },
  audio,
  content,
  store,
  theme: { green: '#5cffd0', amber: '#ffb000', bg: '#050a08', red: '#ff4f4f', surface: '#0c1610', muted: 'rgba(92,255,208,0.45)' },
};

// ── Boot sequence ─────────────────────────────────────────────────────────────
const BOOT_LINES = [
  'dhruvOS v2.0 — BIOS POST',
  'Copyright (c) 2026 Dhruv Kothari',
  ' ',
  '[ OK ] CPU check ............ 4 cores detected',
  '[ OK ] Memory test .......... 16384 MB OK',
  '[ OK ] Kernel init .......... v5.15.0-dhruv',
  '[ OK ] Mounting /apps ....... done',
  '[ OK ] Loading GUI stack .... done',
  '[ OK ] Content manifest ..... loaded',
  '[ .. ] Spawning shell session',
  ' ',
  'Starting dhruvOS desktop environment...',
];

function runBoot(onDone) {
  const bootEl = document.getElementById('boot');
  const linesEl = document.getElementById('boot-lines');
  const bar = document.getElementById('boot-progress-bar');
  bootEl.style.opacity = '1';
  bootEl.style.pointerEvents = 'all';
  bootEl.classList.add('active');

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    gsap.to(bootEl, {
      opacity: 0, duration: 0.45,
      onComplete: () => { bootEl.style.display = 'none'; onDone(); },
    });
  }

  bootEl.addEventListener('click', finish, { once: true });

  BOOT_LINES.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'bline';
    div.textContent = text;
    linesEl.appendChild(div);
    setTimeout(() => {
      div.classList.add('vis');
      bar.style.width = ((i + 1) / BOOT_LINES.length * 100) + '%';
      if (i === BOOT_LINES.length - 1) setTimeout(finish, 400);
    }, i * 140 + 80);
  });
}

function showDesktop() {
  const desktopEl = document.getElementById('desktop');
  gsap.to(desktopEl, {
    opacity: 1, duration: 0.55, delay: 0.15,
    onComplete: () => desktopEl.classList.add('active'),
  });
  initDesktop(apps, ctx);
}

// Embedded v3 entry: the room already supplied the reveal. Start at the
// desktop and open Selected Work immediately so the destination is useful on
// arrival. The bridge is deliberately narrow and same-origin; no arbitrary
// parent can control the standalone OS.
function postToHost(message) {
  if (window.parent === window) return;
  window.parent.postMessage({ source: 'dhruvOS', version: 1, ...message }, HOST_ORIGIN);
}

function setEmbeddedState(state) {
  document.documentElement.dataset.v3State = state;
  document.body.dataset.v3State = state;
  window.dispatchEvent(new CustomEvent('v3:visibility', { detail: { state } }));
  if (state === 'room') audio.stop();
  postToHost({ type: 'state', state });
}

function initEmbeddedBridge() {
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== HOST_ORIGIN) return;
    const message = event.data;
    if (!message || message.source !== 'v3-scan') return;

    if (message.type === 'host-hello') {
      postToHost({ type: 'ready', state: 'inside' });
      return;
    }
    if (message.type === 'enter') {
      setEmbeddedState('inside');
      return;
    }
    if (message.type === 'leave') {
      setEmbeddedState('room');
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    postToHost({ type: 'request-leave' });
  });
}

function showEmbeddedDesktop() {
  ['os-beneath', 'tear-shadow', 'flat-site', 'tear-hint', 'intro-skip', 'boot']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

  const desktopEl = document.getElementById('desktop');
  desktopEl.style.opacity = '1';
  desktopEl.style.pointerEvents = 'all';
  desktopEl.classList.add('active');
  initDesktop(apps, ctx);
  // One concrete action is already available; later visits retain this
  // window and any app state because the parent keeps this document alive.
  ctx.openApp('projects');
  setEmbeddedState('inside');
  postToHost({ type: 'ready', state: 'inside' });
}

// ── Entry point ───────────────────────────────────────────────────────────────
if (EMBEDDED) {
  initEmbeddedBridge();
  showEmbeddedDesktop();
} else {
  initBeneathCanvas();

  runIntro(() => {
    runBoot(() => {
      showDesktop();
    });
  });
}
