// os/apps/lab.js — the Lab launcher. Lists the verified-working demo
// experiments and opens each in an iframe on demand, torn down on close.
//
// These are heavy WebGL pages. The iframe for a demo is only created the
// instant its card is opened, and is fully removed (src cleared, element
// removed) the instant the visitor backs out or the window closes — so its
// rAF loop and GL context stop existing rather than just going offscreen.
// That matters on integrated graphics with the 3D room still live behind
// the OS.
import { LAB_APPS } from '../shell/labRegistry.js';
import { mountContactStrip } from '../shell/contactStrip.js';

const STATUS_LABEL = {
  works: 'EXPERIMENT',
  degraded: 'EXPERIMENT — PARTIAL',
};

export default {
  id: 'lab',
  title: 'lab',
  icon: '⌬',
  width: 780,
  height: 580,

  mount(body, ctx) {
    body.style.cssText = [
      'position:relative', 'overflow:hidden', 'background:#050a08',
      "font-family:'JetBrains Mono','Courier New',monospace", 'color:#5cffd0',
    ].join(';');

    const listView = document.createElement('div');
    listView.style.cssText = 'position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'padding:24px 32px 16px;border-bottom:1px solid rgba(92,255,208,0.08);';
    hdr.innerHTML = `
      <div style="font-size:8px;letter-spacing:0.26em;color:rgba(92,255,208,0.3);margin-bottom:8px;">LAB — CRAFT EXPERIMENTS, NOT PRODUCTS</div>
      <div style="font-size:20px;font-weight:700;letter-spacing:0.04em;color:#5cffd0;">dhruv.lab</div>
      <div style="font-size:10px;color:rgba(92,255,208,0.4);line-height:1.6;margin-top:8px;max-width:52ch;">
        Standalone rendering demos. Each is a self-contained sketch — some are
        rough on purpose. Open one, poke at it, close it.
      </div>`;
    listView.appendChild(hdr);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1px;background:rgba(92,255,208,0.06);padding:1px;margin-top:1px;';
    listView.appendChild(grid);

    const iframeView = document.createElement('div');
    iframeView.style.cssText = 'position:absolute;inset:0;display:none;flex-direction:column;background:#000;';

    const iframeBar = document.createElement('div');
    iframeBar.style.cssText = [
      'display:flex', 'align-items:center', 'gap:10px', 'padding:6px 12px',
      'background:#0c1610', 'border-bottom:1px solid rgba(92,255,208,0.15)', 'flex-shrink:0',
    ].join(';');
    const backBtn = document.createElement('button');
    backBtn.textContent = '← back to lab';
    backBtn.style.cssText = [
      'background:none', 'border:1px solid rgba(92,255,208,0.3)', 'color:rgba(92,255,208,0.75)',
      "font:10px 'JetBrains Mono',monospace", 'letter-spacing:0.08em', 'padding:4px 10px', 'cursor:pointer',
    ].join(';');
    backBtn.addEventListener('mouseover', () => { backBtn.style.borderColor = '#5cffd0'; backBtn.style.color = '#5cffd0'; });
    backBtn.addEventListener('mouseout', () => { backBtn.style.borderColor = 'rgba(92,255,208,0.3)'; backBtn.style.color = 'rgba(92,255,208,0.75)'; });
    const iframeTitle = document.createElement('span');
    iframeTitle.style.cssText = 'font-size:10px;letter-spacing:0.1em;color:rgba(92,255,208,0.5);';
    iframeBar.append(backBtn, iframeTitle);

    const iframeSlot = document.createElement('div');
    iframeSlot.style.cssText = 'position:relative;flex:1;min-height:0;';

    iframeView.append(iframeBar, iframeSlot);
    body.append(listView, iframeView);

    let activeFrame = null;

    function closeDemo() {
      if (activeFrame) {
        // Clearing src (not just removing the node) drops the document and
        // its rAF/GL context immediately rather than leaving it parked.
        activeFrame.src = 'about:blank';
        activeFrame.remove();
        activeFrame = null;
      }
      iframeView.style.display = 'none';
      listView.style.display = 'block';
    }

    function openDemo(entry) {
      iframeTitle.textContent = entry.title.toUpperCase();
      const frame = document.createElement('iframe');
      frame.title = entry.title;
      frame.src = entry.src;
      frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;';
      frame.setAttribute('allow', 'autoplay');
      iframeSlot.appendChild(frame);
      activeFrame = frame;
      listView.style.display = 'none';
      iframeView.style.display = 'flex';
    }

    backBtn.addEventListener('click', closeDemo);

    LAB_APPS.forEach((entry) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.style.cssText = [
        'display:block', 'text-align:left', 'background:#050a08', 'border:0',
        'padding:16px 18px', 'cursor:pointer', 'font-family:inherit', 'color:inherit',
        'transition:background 0.15s',
      ].join(';');
      card.addEventListener('mouseover', () => { card.style.background = 'rgba(92,255,208,0.05)'; });
      card.addEventListener('mouseout', () => { card.style.background = '#050a08'; });

      const statusEl = document.createElement('div');
      statusEl.textContent = STATUS_LABEL[entry.status] || 'EXPERIMENT';
      statusEl.style.cssText = `font-size:8px;letter-spacing:0.2em;margin-bottom:8px;color:${entry.status === 'degraded' ? 'rgba(255,176,0,0.6)' : 'rgba(92,255,208,0.3)'};`;

      const titleEl = document.createElement('div');
      titleEl.textContent = entry.title;
      titleEl.style.cssText = 'font-size:14px;font-weight:700;letter-spacing:0.02em;margin-bottom:6px;color:#5cffd0;';

      const blurbEl = document.createElement('div');
      blurbEl.textContent = entry.blurb;
      blurbEl.style.cssText = 'font-size:10px;color:rgba(92,255,208,0.45);line-height:1.6;';

      card.append(statusEl, titleEl, blurbEl);

      if (entry.note) {
        const noteEl = document.createElement('div');
        noteEl.textContent = entry.note;
        noteEl.style.cssText = 'font-size:9px;color:rgba(255,176,0,0.5);line-height:1.5;margin-top:6px;font-style:italic;';
        card.appendChild(noteEl);
      }

      card.addEventListener('click', () => openDemo(entry));
      grid.appendChild(card);
    });

    const removeStrip = mountContactStrip(body);

    return function cleanup() {
      closeDemo();
      removeStrip();
      listView.remove();
      iframeView.remove();
    };
  },
};
