// iframeApp.js — a dhruvOS window whose body is a real, separately built web
// app served from /apps/<name>/ (its own bundle, fetched only when opened).
// The window manager gives us mount(body, ctx) → { cleanup, setVisible };
// closing removes the iframe so the app's memory goes with it, minimising
// tells it to pause anything expensive via postMessage.
// `zoom` scales the app's whole document (same-origin, so we can reach in)
// for apps whose natural type is small; the readability floor is in
// docs/PROMPT-R8-GEMINI.md.
export function iframeApp({ id, title, icon, src, width = 1280, height = 780, zoom = 1 }) {
  return {
    id, title, icon, width, height,
    mount(body) {
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.title = title;
      frame.setAttribute('loading', 'eager');
      frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#0b0d12;';
      if (zoom !== 1) frame.addEventListener('load', () => { try { frame.contentDocument.documentElement.style.zoom = String(zoom); } catch { /* cross-origin: leave it */ } });
      body.appendChild(frame);
      const post = (type) => { try { frame.contentWindow?.postMessage({ source: 'dhruvOS', type }, location.origin); } catch { /* ignore */ } };
      return {
        cleanup() { frame.remove(); },
        setVisible(visible) { post(visible ? 'app-show' : 'app-hide'); },
      };
    },
  };
}
