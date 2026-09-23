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
  'BIOS POST',
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
  'Starting desktop environment...',
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

    if (message.type === 'room-key') {
      const key=message.key;
      if(typeof key!=='string'||key==='Escape'||key==='Tab'||key.length>16)return;
      setEmbeddedState('room');
      const findEditable=root=>{if(!root)return null;const own=root.querySelector('input,textarea,[contenteditable="true"]');if(own)return own;for(const el of root.querySelectorAll('*'))if(el.shadowRoot){const found=findEditable(el.shadowRoot);if(found)return found;}return null;};
      let target=document.activeElement;
      while(target?.shadowRoot?.activeElement)target=target.shadowRoot.activeElement;
      if(!target?.matches('input,textarea,[contenteditable="true"]')) {
        target=findEditable(document.querySelector('.os-window.focused'));
      }
      if(!target){ctx.openApp('terminal');target=findEditable(document.querySelector('#win-body-terminal'));}
      if(!target)return;
      const event=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});
      if(!target.dispatchEvent(event))return;
      if(target.matches('input,textarea')){
        let start=target.selectionStart??target.value.length,end=target.selectionEnd??start;
        if(key==='Backspace'){if(start===end)start=Math.max(0,start-1);target.setRangeText('',start,end,'end');}
        else if(key.length===1)target.setRangeText(key,start,end,'end');
        else if(key==='ArrowLeft'||key==='ArrowRight'){const p=Math.max(0,Math.min(target.value.length,start+(key==='ArrowLeft'?-1:1)));target.setSelectionRange(p,p);}
        target.dispatchEvent(new Event('input',{bubbles:true}));
      }
      return;
    }
    if (message.type === 'open-app') {
      // Deep links (/#/os/<app>) from the host. Unknown ids are ignored.
      if (typeof message.app === 'string' && apps.some((a) => a.id === message.app)) ctx.openApp(message.app);
      return;
    }
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

  // Real input inside the OS, so the host can hand control back from its
  // guided tour (the iframe swallows these events otherwise).
  for (const type of ['pointerdown', 'keydown', 'wheel']) {
    window.addEventListener(type, (event) => {
      if (event.isTrusted) postToHost({ type: 'user-input' });
    }, { capture: true, passive: true });
  }
  // A click into a project app's own iframe only shows up here as focus
  // leaving this document for that frame.
  window.addEventListener('blur', () => {
    setTimeout(() => {
      if (document.activeElement?.tagName === 'IFRAME') postToHost({ type: 'user-input' });
    }, 0);
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
