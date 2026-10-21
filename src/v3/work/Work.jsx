import { useCallback, useEffect, useRef, useState } from 'react';
import '../tokens.css';
import { identity, contact, education, experience, projects, proofPoints, blinkTools, personalProjectIds, hackathonProjectIds } from '../content/index.js';
import { fetchMumbaiWeather, istParts } from '../lib/mumbai.js';
import DemoPanel, { DEMOS } from './DemoPanel.jsx';
import { LIVE_APPS_HERO } from '../lib/features.js';

const css = `
  /* ---- skip link --------------------------------------------------------- */

  .work-skip {
    position: absolute;
    left: 1rem;
    top: -4rem;
    background: var(--signal);
    color: var(--void);
    padding: 0.65rem 1rem;
    font-family: var(--font-mono);
    font-size: var(--t-data);
    letter-spacing: var(--track-data);
    text-transform: uppercase;
    z-index: 50;
    transition: top var(--d-feedback) var(--ease);
  }

  .work-skip:focus-visible {
    top: 1rem;
    outline-offset: 0;
  }

  /* ---- résumé reader (full screen) ---------------------------------------- */

  .work-reader { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; background: #0A0A0B; }
  .work-reader-bar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 1rem; border-bottom: var(--hair) solid var(--faint); }
  .work-reader-bar strong { margin-right: auto; }
  .work-reader-btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1rem; border: var(--hair) solid var(--faint); background: transparent; color: var(--bone); font: inherit; font-size: 0.875rem; cursor: pointer; text-decoration: none; }
  .work-reader-btn:hover, .work-reader-btn:focus-visible { background: var(--bone); color: var(--void); }
  .work-reader-frame { flex: 1; width: 100%; border: 0; background: #fff; }

  /* ---- live demo panel (overlay at every width) --------------------------- */

  .work-demo {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    background: var(--void-lift);
    min-width: 0;
  }

  .work-demo-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: var(--hair) solid var(--faint);
  }

  .work-demo-kicker {
    color: var(--dim);
    font-size: var(--t-micro);
    letter-spacing: var(--track-data);
  }

  .work-demo-title {
    font-size: var(--t-body);
    font-weight: 500;
    margin-top: 0.3rem;
  }

  .work-demo-title span {
    color: var(--dim);
    font-weight: 400;
    margin-left: 0.4em;
  }

  .work-demo-actions {
    display: flex;
    gap: 0.5rem;
    flex: none;
  }

  .work-demo-action {
    min-height: 44px;
    font-size: var(--t-micro);
    letter-spacing: var(--track-data);
    padding: 0.5rem 0.75rem;
    border: var(--hair) solid var(--faint);
    color: var(--bone);
    background: transparent;
    cursor: pointer;
  }

  .work-demo-action:hover,
  .work-demo-action:focus-visible {
    border-color: var(--dim);
  }

  /* /work's page colours are light; the demo panel is its own dark surface. */
  .work-demo .work-demo-title { color: var(--bone); }
  .work-demo .work-demo-title span,
  .work-demo .work-demo-kicker { color: #9a9aa2; }
  .work-demo a.work-demo-action,
  .work-demo button.work-demo-action { color: var(--bone); text-decoration: none; background: transparent; }

  .work-demo-body {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }

  .work-demo-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: #0b0d12;
  }

  .work-demo-loading {
    color: var(--dim);
  }

  /* ---- page: light editorial layout (scoped to .w-root) ------------------- */

  html, body { background: #ece7de; }
  body { color: #17160f; }

  .w-root {
    --bg: #ece7de;
    --paper: #fbfaf7;
    --ink: #17160f;
    --ink2: #3a3832;
    --mute: #6b675e;
    --line: #d8d2c6;
    --acc: #c2410c;
    --r: 14px;
    --mono: "IBM Plex Mono", ui-monospace, monospace;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.6 "IBM Plex Sans", system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  .w-root *, .w-root *::before, .w-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .w-root a { color: inherit; }
  .w-root h1 { font-size: 34px; line-height: 1.1; font-weight: 600; letter-spacing: -0.022em; margin-top: 28px; }
  .w-root h3 { font-weight: 600; }

  .w-wrap { max-width: 1180px; margin: auto; padding: 24px 20px 112px; }
  .w-side { display: flex; flex-direction: column; }
  .w-desk { width: 100%; max-width: 420px; height: auto; display: block; }
  .w-status { display: flex; align-items: center; gap: 8px; font: 13px/1.4 var(--mono); color: var(--mute); margin-top: 10px; }
  .w-dot { width: 6px; height: 6px; border-radius: 50%; background: #d9a514; box-shadow: 0 0 0 3px #d9a51422; flex: none; }
  .w-lede { font-size: 20px; line-height: 1.4; letter-spacing: -0.01em; margin-top: 10px; color: var(--ink); }
  .w-sub { color: var(--ink2); margin-top: 14px; font-size: 16px; max-width: 34ch; }
  .w-cta { display: none; gap: 10px; margin-top: 24px; }
  .w-btn {
    flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    height: 50px; padding: 0 20px; border-radius: 12px; font-weight: 500; font-size: 15.5px;
    text-decoration: none; border: 1px solid var(--line); background: var(--paper); color: var(--ink);
    transition: transform 0.15s, background 0.15s;
  }
  .w-btn:active { transform: scale(0.98); }
  .w-root .w-btn--p { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .w-live { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--ink); border-radius: var(--r); background: var(--paper); }
  .w-live p { margin: 0 0 10px; font-size: 15px; }
  .w-live div { display: flex; flex-wrap: wrap; gap: 8px; }
    .w-ask { padding: 14px 16px; border: 1px solid #d8d2c6; border-radius: 12px; background: #fbfaf6; margin-bottom: 8px; }
  .w-live a, .w-live button { border: 0; cursor: pointer; font: inherit; display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 12px; background: var(--ink); color: var(--paper); text-decoration: none; font-weight: 500; }
  .w-links { display: flex; gap: 10px; margin-top: 12px; font-size: 15px; }
  .w-links a { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--ink); font-weight: 500; text-decoration: none; }
  .w-links a span { color: var(--mute); }
  .w-room { margin-top: 22px; display: none; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r); background: var(--paper); text-decoration: none; }
  .w-room b { font-weight: 500; display: block; }
  .w-laptop { display: none; color: var(--mute); }
  @media (pointer: coarse) { .w-roomlink, .w-room { display: none !important; } .w-laptop { display: inline; } }
  .w-room small { color: var(--mute); font-size: 13.5px; }
  .w-ar { margin-left: auto; font-family: var(--mono); color: var(--acc); }

  .w-label { font: 500 13px/1 var(--mono); letter-spacing: 0.02em; color: var(--mute); margin: 48px 0 16px; display: flex; justify-content: space-between; }
  .w-proof { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r); overflow: hidden; }
  .w-proof > div { background: var(--paper); padding: 16px 18px; display: grid; grid-template-columns: 76px 1fr; gap: 14px; align-items: baseline; }
  .w-n { font: 600 22px/1 "IBM Plex Sans", system-ui, sans-serif; letter-spacing: -0.02em; color: var(--acc); }
  .w-proof p { font-size: 15.5px; color: var(--ink2); }

  .w-feat { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -20px; padding: 0 20px 4px; scrollbar-width: none; }
  .w-feat::-webkit-scrollbar { display: none; }
  .w-card { flex: 0 0 84%; scroll-snap-align: start; scroll-margin-left: 20px; background: var(--paper); border: 1px solid var(--line); border-radius: 18px; padding: 10px; display: flex; flex-direction: column; }
  .w-shot { aspect-ratio: 16 / 10; border-radius: 10px; background: #ebe8e0; position: relative; overflow: hidden; }
  .w-shot img, .w-shot svg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .w-shot > span { position: absolute; left: 12px; bottom: 10px; font: 11.5px var(--mono); color: var(--mute); }
  .w-ci { padding: 14px 8px 8px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .w-meta { font: 12.5px var(--mono); color: var(--mute); }
  .w-card h3 { font-size: 19px; letter-spacing: -0.015em; line-height: 1.25; }
  .w-card p { font-size: 15px; color: var(--ink2); }
  .w-res { display: flex; align-items: baseline; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); }
  .w-res b { font: 500 20px var(--mono); letter-spacing: -0.03em; }
  .w-res small { font-size: 13.5px; color: var(--mute); }
  .w-go { display: flex; justify-content: space-between; align-items: center; width: 100%; height: 44px; margin-top: 6px; padding: 0 14px; border: 0; border-radius: 10px; background: var(--bg); text-decoration: none; font: 500 14.5px "IBM Plex Sans", system-ui, sans-serif; color: var(--ink); cursor: pointer; list-style: none; }
  .w-go::-webkit-details-marker { display: none; }
  .w-case { margin-top: 6px; }
  .w-case > summary { margin-top: 0; }
  .w-case[open] > summary { margin-bottom: 10px; }
  .w-bul { font-size: 14.5px; color: var(--ink2); padding: 0 6px 0 18px; display: flex; flex-direction: column; gap: 8px; }

  .w-list { border-top: 1px solid var(--line); }
  .w-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: baseline; padding: 16px 0; border-bottom: 1px solid var(--line); }
  .w-row--xp { grid-template-columns: 118px 1fr; }
  @media (max-width: 559px) { .w-row--xp { grid-template-columns: 1fr; gap: 4px; } }
  .w-y { font: 13px var(--mono); color: var(--mute); }
  .w-row b { font-weight: 500; }
  .w-row p { font-size: 15px; color: var(--ink2); margin-top: 2px; }
  .w-did { font-size: 14px !important; color: var(--mute) !important; margin-top: 6px !important; }
  .w-tour { width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; background: #1a1713; display: block; }
  .w-cs-row { display: block; }
  .w-cs-row summary { cursor: pointer; display: flex; flex-direction: column; gap: 8px; }
  .w-cs-row summary img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; }
  .w-cs dt { font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink2); margin-top: 10px; }
  .w-cs dd { margin: 2px 0 0; font-size: 15px; color: var(--ink2); }
  .w-did b { font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; margin-right: 6px; color: var(--ink2); }
  .w-acts { grid-column: 2 / -1; display: flex; gap: 16px; margin-top: 8px; }
  .w-act { font: 13px var(--mono); color: var(--ink); background: none; border: 0; border-bottom: 1px solid var(--line); padding: 0 0 1px; cursor: pointer; text-decoration: none; }
  .w-contact { font-size: 15.5px; color: var(--ink2); max-width: 46ch; }
  .w-contact a { color: var(--ink); border-bottom: 1px solid var(--line); text-decoration: none; }
  .w-foot { margin-top: 40px; font-size: 14px; color: var(--mute); }

  .w-bar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
    display: flex; gap: 10px; padding: 10px 20px calc(10px + env(safe-area-inset-bottom));
    background: color-mix(in srgb, var(--bg) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(14px); -webkit-backdrop-filter: saturate(1.4) blur(14px);
    border-top: 1px solid var(--line);
  }
  .w-bar .w-btn { height: 48px; }

  @media (min-width: 960px) {
    .w-wrap { display: grid; grid-template-columns: 400px 1fr; gap: 88px; padding: 56px 48px; }
    .w-side { position: sticky; top: 56px; align-self: start; }
    .w-cta { display: flex; }
    .w-room { display: flex; }
    .w-bar { display: none; }
    .w-root h1 { font-size: 40px; }
    .w-label:first-child { margin-top: 4px; }
    .w-feat { display: grid; grid-template-columns: 1fr 1fr; margin: 0; padding: 0; overflow: visible; }
    .w-feat .w-card:first-child { grid-column: 1 / -1; }
    .w-feat .w-card:first-child .w-shot { aspect-ratio: 3 / 1; }
    .w-hint { display: none; }
    .w-card:hover { border-color: #cfcbc0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .w-root *, .w-root *::before, .w-root *::after { transition: none !important; scroll-behavior: auto !important; }
  }
`;

const PREVIEWS = { focuslock: '/previews/focuslock.jpg', darksentinel: '/previews/darksentinel.jpg', portfolio3d: '/og.jpg' };

// The cards in the "Featured" band, after Blink (built from experience[0]).
const FEATURED_IDS = ['focuslock', 'basket'];

// Facts only, taken from public/resume.pdf. Projects with no résumé line get none.
const WHAT_I_DID = {
  focuslock: 'Kotlin, Android, Electron and Firebase. Backed by 233 automated tests; CI builds a signed APK and the Windows installer.',
  portfolio3d: 'Three.js, React 19, GSAP, GLSL, Playwright. Detects each visitor’s GPU and serves a 3D, mobile or no-WebGL version, holding 30 to 60 FPS on integrated graphics.',
  darksentinel: 'Built the LLM review layer: only predictions the model is unsure about go to an LLM, keeping inference cost bounded. Team project; finalist at the IIT Madras x BITS Goa hackathon 2026.',
  blackout: 'Kotlin, Android. Fingerprint unlock, a Quick Settings tile, and it steps aside for calls and alarms. No internet permission.',
  basket: 'Price comparator with 636 tests.',
};
// Ask box: the same module the room notepad uses (public/os/shell/ask.js), loaded on demand.
function AskBox() {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    const url = '/os/shell/ask.js';
    import(/* @vite-ignore */ url).then((m) => { if (live && ref.current) m.mountAsk(ref.current); }).catch(() => {});
    return () => { live = false; };
  }, []);
  return <div className="w-ask" ref={ref} data-testid="work-ask" />;
}

// Room tour: loads only when scrolled near, plays muted, and does not autoplay under reduced motion.
function TourVideo() {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.getAttribute('src')) v.src = '/media/room-tour.webm';
        if (!calm) v.play().catch(() => {});
      } else v.pause();
    }, { rootMargin: '200px' });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video className="w-tour" ref={ref} muted loop playsInline controls preload="none" poster="/media/room-tour.jpg"
      aria-label="A one-minute guided tour of the 3D room and the demos on its monitor and phone" data-testid="room-tour" />
  );
}

// Live from GitHub: /api/proof (Pages Function, KV-cached, public REST API, no token). Renders nothing if it fails.
const ago = (iso) => {
  const d = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 86400e3));
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 60 ? `${d} days ago` : `${Math.round(d / 30)} months ago`;
};
function GithubProof() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('/api/proof').then((r) => r.json()).then((d) => { if (live && d?.repos?.length) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, []);
  if (!data) return null;
  return (
    <>
      <div className="w-label"><span>Live from GitHub</span><span>updated {ago(data.updated)}</span></div>
      <div className="w-list" data-testid="gh-proof">
        {data.repos.map((r) => (
          <div className="w-row" key={r.name}>
            <span className="w-y">{r.pushed ? ago(r.pushed) : ''}</span>
            <span>
              <b><a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a></b>
              <p>{[r.language, r.stars ? `${r.stars} ${r.stars === 1 ? 'star' : 'stars'}` : ''].filter(Boolean).join(' · ')}</p>
              <ul className="w-bul">
                {r.commits.map((c) => (<li key={c.sha}><a href={c.url} target="_blank" rel="noopener noreferrer">{c.sha}</a> {c.msg}</li>))}
              </ul>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const CASE_IDS = ['blink', 'focuslock', 'darksentinel', 'blackout', 'portfolio3d'];
const caseText = (c) => c && (
  <dl className="w-cs">
    <dt>Problem</dt><dd>{c.problem}</dd>
    <dt>Decisions</dt><dd>{c.decisions}</dd>
    <dt>Result</dt><dd>{c.result}</dd>
  </dl>
);

const didLine = (id) => WHAT_I_DID[id] && <p className="w-did"><b>What I did</b> {WHAT_I_DID[id]}</p>;

// Full-screen résumé reader. Phones cannot show a PDF inline (iOS shows page 1,
// Android shows nothing), so there the button opens the file in its own tab.
const canEmbedPdf = () => typeof navigator !== 'undefined'
  && navigator.pdfViewerEnabled !== false
  && !window.matchMedia('(pointer: coarse)').matches;

function ResumeReader({ src, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="work-reader" role="dialog" aria-modal="true" aria-label="Résumé">
      <div className="work-reader-bar">
        <strong>Résumé</strong>
        <a className="work-reader-btn" href={src} download="Dhruv-Kothari-Resume.pdf">Download PDF</a>
        <a className="work-reader-btn" href={src} target="_blank" rel="noopener noreferrer">Open in new tab</a>
        <button type="button" className="work-reader-btn" ref={closeRef} onClick={onClose}>Close</button>
      </div>
      <iframe className="work-reader-frame" src={`${src}#view=FitH`} title="Résumé PDF" />
    </div>
  );
}

// "3:28 pm" in Mumbai time.
function formatIst(date) {
  const { hour, minute } = istParts(date);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

export default function Work() {
  const mainRef = useRef(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const readerTrigger = useRef(null);
  const closeReader = useCallback(() => {
    setReaderOpen(false);
    readerTrigger.current?.focus({ preventScroll: true });
  }, []);
  // { id, index } of the open demo; the trigger gets focus back on close.
  const [open, setOpen] = useState(null);
  const trigger = useRef(null);
  const closeDemo = useCallback(() => {
    setOpen(null);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  const [now, setNow] = useState(() => new Date());
  const [temperature, setTemperature] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let alive = true;
    fetchMumbaiWeather()
      .then((w) => { if (alive && typeof w?.temperature === 'number') setTemperature(w.temperature); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // A project with no description yet renders as a bare title and a lone tech
  // chip, which reads as a broken stub rather than as work. Withhold it until
  // there is something true to say about it.
  const listed = projects.filter((p) => p.description || p.tagline);
  const pick = (ids) => ids.map((id) => listed.find((p) => p.id === id)).filter(Boolean);
  const featured = pick(FEATURED_IDS);
  const personal = pick(personalProjectIds);
  const hackathon = pick(hackathonProjectIds);

  const blink = experience[0];
  const openResume = (e) => {
    if (!canEmbedPdf()) return;
    e.preventDefault();
    readerTrigger.current = e.currentTarget;
    setReaderOpen(true);
  };
  const tryDemo = (project, e) => {
    trigger.current = e.currentTarget;
    setOpen({ id: project.id, index: 0 });
  };

  const renderRow = (p) => (
    <div className="w-row" key={p.id}>
      <span className="w-y">{p.year}</span>
      <span>
        <b>{p.name}</b>
        <p>{p.tagline || p.description}</p>
        {didLine(p.id)}
        {(p.badge || p.label) && <span className="w-meta">{p.badge || p.label}</span>}
      </span>
      <span className="w-acts">
        {DEMOS[p.id] && <button type="button" className="w-act" onClick={(e) => tryDemo(p, e)}>Try it</button>}
        {p.links?.live === '/' && <span className="w-act w-laptop">Laptop only</span>}
        {p.links?.live && (
          <a className={`w-act${p.links.live === '/' ? ' w-roomlink' : ''}`} href={p.links.live}
            {...(p.links.live.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>{p.links.live === '/' ? 'Walk through it' : 'Visit'}</a>
        )}
        {p.links?.github && (
          <a className="w-act" href={p.links.github} target="_blank" rel="noopener noreferrer">Source</a>
        )}
      </span>
    </div>
  );

  const renderFeatured = (project) => (
    <article className="w-card" key={project.id}>
      <div className="w-shot">
        {PREVIEWS[project.id]
          ? <img src={PREVIEWS[project.id]} alt={`${project.name} screenshot`} loading="lazy" />
          : <span aria-hidden="true" />}
      </div>
      <div className="w-ci">
        <span className="w-meta">{project.year} · {project.tech.slice(0, 3).join(', ')}</span>
        <h3>{project.name}</h3>
        <p>{project.summary || project.tagline}</p>
        {didLine(project.id)}
        {project.badge && (
          <div className="w-res"><small>{project.badge}</small></div>
        )}
        {DEMOS[project.id] ? (
          <button type="button" className="w-go" onClick={(e) => tryDemo(project, e)}>Try it<span>→</span></button>
        ) : project.links?.live && (
          <a className="w-go" href={project.links.live}>Try it<span>→</span></a>
        )}
      </div>
    </article>
  );

  const statusText = `${formatIst(now)} in Mumbai${temperature !== null ? ` · ${temperature}°C` : ''}`;
  const footText = 'Built by hand. The desk at the top is a real 3D room you can walk through on a laptop.';

  return (
    <>
      <style>{css}</style>
      <button
        type="button"
        className="work-skip mono"
        onClick={() => mainRef.current?.focus()}
      >
        Skip to content
      </button>
      <div className="w-root">
        <div className="w-wrap">
          <aside className="w-side">
            <svg className="w-desk" viewBox="0 0 420 170" fill="none" stroke="#17160f" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="276" y="8" width="128" height="88" rx="3"/><path d="M340 8v88M276 52h128" strokeWidth=".9"/>
              <path d="M282 96v-14l8-4v18M296 96v-24h8v24M312 96v-10l6-6 6 6v10M330 96v-18h7v18M348 96v-30h9v30M364 96v-12h8v12M380 96v-20l6-3 6 3v20" stroke="#86837a" strokeWidth=".8"/>
              <circle cx="384" cy="26" r="6" stroke="#c2410c" strokeWidth=".9"/>
              <path d="M10 126h400"/><path d="M14 126v4h392v-4" strokeWidth=".9"/><path d="M28 130v38M392 130v38"/>
              <rect x="138" y="30" width="132" height="80" rx="5"/><rect x="146" y="38" width="116" height="64" rx="2" fill="#c2410c" fillOpacity=".09" stroke="none"/>
              <path d="M158 54h46M158 62h70M158 70h34" stroke="#c2410c" strokeWidth="1" strokeOpacity=".55"/>
              <path d="M196 110l-5 13h26l-5-13"/><path d="M186 123h36"/>
              <rect x="150" y="117" width="78" height="7" rx="2"/><path d="M156 120.5h66" strokeWidth=".6" strokeDasharray="2 2"/>
              <rect x="240" y="117" width="14" height="8" rx="4"/>
              <path d="M58 126h34M75 126V88l26-26M101 62l14 8-6 11-14-8z"/><path d="M107 79l-7 18" stroke="#c2410c" strokeOpacity=".35" strokeDasharray="1.5 3"/>
              <path d="M290 126v-16h20v16M310 114h4a4 4 0 0 1 0 8h-4"/><path d="M296 104c0-4 4-4 4-8M304 104c0-4 4-4 4-8" stroke="#86837a" strokeWidth=".8"/>
              <rect x="22" y="104" width="40" height="22" rx="2"/><path d="M42 104v22" strokeWidth=".8"/>
            </svg>
            <p className="w-status"><span className="w-dot" /><span>{statusText}</span></p>
            <h1>{identity.name}</h1>
            <p className="w-lede">{identity.pitch}</p>
            <p className="w-sub">{identity.now}</p>
            {LIVE_APPS_HERO && (
              <div className="w-live" data-testid="work-live-apps">
                <p><b>Try my real apps.</b> Running builds, one tap.</p>
                <div>
                  <button type="button" onClick={(e) => tryDemo({ id: 'focuslock' }, e)}>FocusLock</button>
                  <button type="button" onClick={(e) => tryDemo({ id: 'darksentinel' }, e)}>DarkSentinel</button>
                  <button type="button" onClick={(e) => tryDemo({ id: 'basket' }, e)}>BasketProof</button>
                </div>
              </div>
            )}
            <div className="w-cta">
              {contact.resume && (
                <a className="w-btn w-btn--p" href={contact.resume} target="_blank" rel="noopener noreferrer" onClick={openResume}>Résumé</a>
              )}
              <a className="w-btn" href={`mailto:${contact.email}`}>Email me</a>
            </div>
            <div className="w-links">
              <a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
            </div>
            <a className="w-room" href="/?tour=1">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#17160f" strokeWidth="1.2" aria-hidden="true"><rect x="1" y="1" width="32" height="32" rx="8" stroke="#d8d2c6"/><path d="M9 23h16M12 23v-8h10v8M15 15v-3h4v3"/></svg>
              <span><b>See my portfolio in 3D</b><small>Walk through my desk and try my projects live · 60-second guided tour</small></span>
              <span className="w-ar">→</span>
            </a>
          </aside>

          <main id="work-main" ref={mainRef} tabIndex={-1}>
            <div className="w-label"><span>Proof</span></div>
            <div className="w-proof">
              {proofPoints.map((p) => (
                <div key={p.text}><span className="w-n">{p.value}</span><p>{p.text}</p></div>
              ))}
            </div>

            <div className="w-label"><span>Ask</span></div>
            <AskBox />

            <div className="w-label"><span>Featured</span><span className="w-hint">swipe →</span></div>
            <div className="w-feat">
              <article className="w-card">
                <div className="w-shot">
                  <svg viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 170 L60 150 L120 156 L180 110 L240 92 L320 40" stroke="#c2410c" strokeWidth="1.4" fill="none"/></svg>
                </div>
                <div className="w-ci">
                  <span className="w-meta">Blink.new · {blink.from.slice(-4)} · Python, Gmail API, LLM</span>
                  <h3>An outreach pipeline people actually replied to</h3>
                  <p>Sole developer on four growth tools I built and maintained: a creator outreach pipeline that sourced 650 creators, a link-building engine, SEO and AI-search mention tracking, and a Reddit growth copilot.</p>
                  <div className="w-res"><b>18%</b><small>of contacted creators replied · 14 positive</small></div>
                  <details className="w-case">
                    <summary className="w-go">Read the case<span>→</span></summary>
                    <ul className="w-bul">
                      {blink.bullets.map((b) => (<li key={b}>{b}</li>))}
                    </ul>
                  </details>
                </div>
              </article>
              {featured.map(renderFeatured)}
            </div>

            <div className="w-label"><span>Room tour</span><span>1 min, no sound</span></div>
            <TourVideo />

            <GithubProof />

            <div className="w-label"><span>Case studies</span><span>{CASE_IDS.length}</span></div>
            <div className="w-list" data-testid="case-studies">
              {CASE_IDS.map((id) => {
                const p = id === 'blink' ? { ...blink, name: 'Blink.new growth tools', tech: [] } : projects.find((x) => x.id === id);
                if (!p?.caseStudy) return null;
                return (
                  <details className="w-row w-cs-row" key={id}>
                    <summary><b>{p.name}</b>{PREVIEWS[id] && <img src={PREVIEWS[id]} alt={`${p.name} screenshot`} loading="lazy" />}</summary>
                    {caseText(p.caseStudy)}
                    <a className="w-act" href={`/casefiles/${id}.pdf`} target="_blank" rel="noopener noreferrer">One-page case file (PDF)</a>
                  </details>
                );
              })}
            </div>

            <div className="w-label"><span>At Blink.new (internship)</span></div>
            <div className="w-list">
              {blinkTools.map((t) => (
                <div className="w-row" key={t.id}>
                  <span className="w-y">2026</span>
                  <span><b>{t.name}</b><p>{t.detail}</p></span>
                </div>
              ))}
            </div>

            <div className="w-label"><span>Personal projects</span><span>{personal.length}</span></div>
            <div className="w-list">{personal.map(renderRow)}</div>

            <div className="w-label"><span>Hackathon projects</span><span>{hackathon.length}</span></div>
            <div className="w-list">{hackathon.map(renderRow)}</div>

            <div className="w-label"><span>Experience</span></div>
            <div className="w-list">
              {experience.map((job) => (
                <div className="w-row w-row--xp" key={job.id}>
                  <span className="w-y">{job.from} – {job.to}</span>
                  <span><b>{job.role} · {job.org}</b><p>{job.detail}</p></span>
                </div>
              ))}
              <div className="w-row w-row--xp">
                <span className="w-y">{education.year}</span>
                <span><b>{education.degree}</b><p>{education.school}</p></span>
              </div>
            </div>

            <div className="w-label"><span>Contact</span></div>
            <p className="w-contact">
              Open to remote internships in AI and growth engineering. Email{' '}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>.
            </p>
            <p className="w-foot">{footText}</p>
          </main>
        </div>
        <nav className="w-bar" aria-label="Quick actions">
          {contact.resume && (
            <a className="w-btn w-btn--p" href={contact.resume} target="_blank" rel="noopener noreferrer" onClick={openResume}>Résumé</a>
          )}
          <a className="w-btn" href={`mailto:${contact.email}`}>Email me</a>
        </nav>
        {readerOpen && contact.resume && <ResumeReader src={contact.resume} onClose={closeReader} />}
        {open && (
          <DemoPanel
            project={projects.find((p) => p.id === open.id)}
            demo={DEMOS[open.id][open.index]}
            onClose={closeDemo}
          />
        )}
      </div>
    </>
  );
}
