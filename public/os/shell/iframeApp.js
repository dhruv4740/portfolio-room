// iframeApp.js — a dhruvOS window whose body is a real, separately built web
// app served from /apps/<name>/ (its own bundle, fetched only when opened).
// The window manager gives us mount(body, ctx) → { cleanup, setVisible };
// closing removes the iframe so the app's memory goes with it, minimising
// tells it to pause anything expensive via postMessage.
// `zoom` scales the app's whole document (same-origin, so we can reach in)
// for apps whose natural type is small; the readability floor is in
// docs/PROMPT-R8-GEMINI.md.
import { closeApp, minimizeApp } from './windowManager.js';

// `banner` is an optional strip above the app: { text, action?: { label, run(ctx) } }.
export function iframeApp({ id, title, icon, src, width = 1280, height = 780, zoom = 1, banner = null }) {
  return {
    id, title, icon, width, height,
    mount(body, ctx) {
      if (banner) {
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        const strip = document.createElement('div');
        strip.className = 'iframe-banner';
        const text = document.createElement('span');
        text.textContent = banner.text;
        strip.appendChild(text);
        if (banner.action && banner.action.available?.(ctx) !== false) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = banner.action.label;
          button.addEventListener('click', () => banner.action.run(ctx));
          strip.appendChild(button);
        }
        body.appendChild(strip);
      }
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.title = title;
      frame.setAttribute('loading', 'eager');
      frame.style.cssText = `display:block;width:100%;${banner ? 'flex:1;min-height:0;' : 'height:100%;'}border:0;background:#0b0d12;`;
      if (zoom !== 1) frame.addEventListener('load', () => { try { frame.contentDocument.documentElement.style.zoom = String(zoom); } catch { /* cross-origin: leave it */ } });
      body.appendChild(frame);
      // Copied desktop renderers can retain their native window controls.
      // Accept requests only from this exact same-origin child document.
      const onWindowRequest = (event) => {
        if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.source !== 'dhruvOS') return;
        if (event.data.type === 'app-hide') minimizeApp(id);
        else if (event.data.type === 'app-close') closeApp(id);
      };
      window.addEventListener('message', onWindowRequest);
      const post = (type) => { try { frame.contentWindow?.postMessage({ source: 'dhruvOS', type }, location.origin); } catch { /* ignore */ } };
      return {
        cleanup() { window.removeEventListener('message', onWindowRequest); frame.remove(); },
        setVisible(visible) { post(visible ? 'app-show' : 'app-hide'); },
      };
    },
  };
}
