import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import '../tokens.css';
import { identity, contact, education, experience, projects, proofPoints, blinkTools, personalProjectIds, hackathonProjectIds, featuredProjectIds, whatIDid } from '../content/index.js';
import DemoPanel, { DEMOS } from './DemoPanel.jsx';
import { phoneCanRoom } from '../lib/capability.js';
import { fetchMumbaiWeather, istParts } from '../lib/mumbai.js';

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
  /* Prefixed with .w-root: these overlays render inside it, and its reset
     (".w-root *", later in this sheet) would otherwise zero their padding. */
  .w-root .work-reader-bar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.5rem 1rem; border-bottom: var(--hair) solid var(--faint); }
  .work-reader-bar strong { margin-right: auto; }
  .w-root .work-reader-btn { display: inline-flex; align-items: center; min-height: 44px; padding: 0 1rem; border: var(--hair) solid var(--faint); background: transparent; color: var(--bone); font: inherit; font-size: 0.875rem; cursor: pointer; text-decoration: none; }
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

  .w-root .work-demo-head {
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

  .w-root .work-demo-title {
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

  .w-root .work-demo-action {
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

  .work-demo-stage { position: relative; }
  .w-root .work-demo-wait {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #0b0d12; color: #9a9aa2; font: 13px var(--font-mono, monospace); letter-spacing: 0.04em;
    transition: opacity 0.3s;
  }
  .work-demo-wait::before { content: ''; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #9a9aa255; border-top-color: #f6f4ee; animation: w-spin 0.8s linear infinite; }
  @keyframes w-spin { to { transform: rotate(1turn); } }
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
    --acc-text: #b53b0a;
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

  /* Bottom room for the fixed Résumé/Email bar plus the Ask pill above it. */
  .w-wrap { max-width: 1280px; margin: auto; padding: 24px 20px calc(176px + env(safe-area-inset-bottom)); }
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
  .w-live a, .w-live button { border: 0; cursor: pointer; font: inherit; display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 12px; background: var(--ink); color: var(--paper); text-decoration: none; font-weight: 500; }
  .w-links { display: flex; gap: 10px; margin-top: 12px; font-size: 15px; }
  .w-links a { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); color: var(--ink); font-weight: 500; text-decoration: none; }
  .w-links a span { color: var(--mute); }
  .w-room { margin-top: 22px; display: none; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r); background: var(--paper); text-decoration: none; }
  .w-room b { font-weight: 500; display: block; }
  .w-laptop { display: none; color: var(--mute); }
  @media (pointer: coarse) { .w-roomlink, .w-room { display: none !important; } .w-laptop { display: inline; } }
  /* A phone that passed phoneCanRoom() gets the room offer back. */
  @media (pointer: coarse) { .w-root--room .w-room { display: flex !important; } .w-root--room .w-roomlink { display: inline-flex !important; } .w-root--room .w-laptop { display: none !important; } }
  .w-room small { color: var(--mute); font-size: 13.5px; }
  .w-ar { margin-left: auto; font-family: var(--mono); color: var(--acc-text); }

  .w-root [id] { scroll-margin-top: 24px; }
  .w-label { font: 500 13px/1 var(--mono); letter-spacing: 0.02em; color: var(--mute); margin: 48px 0 16px; display: flex; justify-content: space-between; }
  .w-proof { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r); overflow: hidden; }
  .w-proof > div { background: var(--paper); padding: 16px 18px; display: grid; grid-template-columns: 76px 1fr; gap: 14px; align-items: baseline; }
  .w-n { font: 600 22px/1 "IBM Plex Sans", system-ui, sans-serif; letter-spacing: -0.02em; color: var(--acc-text); }
  .w-proof p { font-size: 15.5px; color: var(--ink2); }

  .w-feat { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .w-card { background: var(--paper); border: 1px solid var(--line); border-radius: 18px; padding: 10px; display: flex; flex-direction: column; }
  .w-shot { aspect-ratio: 16 / 10; border-radius: 10px; background: #ebe8e0; position: relative; overflow: hidden; }
  .w-shot img, .w-shot svg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top; }
  .w-shot > span { position: absolute; left: 12px; bottom: 10px; font: 11.5px var(--mono); color: var(--mute); }
  .w-ci { padding: 14px 8px 8px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .w-meta { font: 12.5px var(--mono); color: var(--mute); }
  .w-card h3 { font-size: 19px; letter-spacing: -0.015em; line-height: 1.25; }
  .w-card p { font-size: 15px; color: var(--ink2); }
  .w-clamp { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; }
  .w-card-acts { margin-top: auto; padding-top: 6px; }
  .w-go span { display: inline-block; transition: transform 0.15s; }
  .w-go[aria-expanded="true"] span { transform: rotate(90deg); }
  .w-root .w-go.w-laptop { display: none; color: var(--mute); cursor: default; }
  @media (pointer: coarse) { .w-root .w-go.w-laptop { display: flex; } }
  .w-root--room .w-go.w-laptop { display: none !important; }
  .w-casepanel { background: var(--paper); border: 1px solid var(--line); border-radius: 18px; padding: 24px; }
  .w-casehead { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .w-casehead h3 { font-size: 22px; letter-spacing: -0.015em; line-height: 1.25; }
  .w-root .w-closecase { margin-top: 0; background: transparent; cursor: pointer; }
  .w-res { display: flex; align-items: baseline; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); }
  .w-res b { font: 500 20px var(--mono); letter-spacing: -0.03em; }
  .w-res small { font-size: 13.5px; color: var(--mute); }
  .w-go { display: flex; justify-content: space-between; align-items: center; width: 100%; height: 44px; margin-top: 6px; padding: 0 14px; border: 0; border-radius: 10px; background: var(--bg); text-decoration: none; font: 500 14.5px "IBM Plex Sans", system-ui, sans-serif; color: var(--ink); cursor: pointer; list-style: none; }
  .w-go::-webkit-details-marker { display: none; }
  .w-case { margin-top: 6px; }
  .w-case > summary { margin-top: 0; }
  .w-case[open] > summary { margin-bottom: 10px; }
  .w-bul a { display: inline-block; padding: 3px 0; }
  .w-bul { font-size: 14.5px; color: var(--ink2); padding: 0 6px 0 18px; display: flex; flex-direction: column; gap: 8px; }

  .w-list { border-top: 1px solid var(--line); }
  /* Blink and Personal side by side from 1100px. Hackathon is its own full-width block with two columns. Below 1100px everything is one column. */
  .w-root .w-two > div > .w-label:first-child, .w-root .w-hack > .w-label:first-child, .w-root .w-exp > .w-label:first-child { margin-top: 48px; }
  @media (min-width: 1100px) {
    .w-two, .w-hgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 48px; align-items: start; }
  }
  .w-row { display: grid; grid-template-columns: 52px 1fr auto; gap: 0 12px; align-items: baseline; padding: 16px 0; border-bottom: 1px solid var(--line); }
  .w-row--xp { grid-template-columns: 118px 1fr; }
  .w-row--gh { grid-template-columns: 104px 1fr; }
  .w-contrib { font-size: 15px; color: var(--ink2); margin: -4px 0 14px; }
  @media (max-width: 559px) { .w-row--xp, .w-row--gh { grid-template-columns: 1fr; gap: 4px; } }
  .w-y { font: 13px var(--mono); color: var(--mute); }
  .w-row b { font-weight: 500; }
  .w-row p { font-size: 15px; color: var(--ink2); margin-top: 2px; }
  .w-row .w-meta { display: block; margin-top: 6px; }
  .w-did { font-size: 14px !important; color: var(--mute) !important; margin-top: 6px !important; }
  .w-tour { width: 100%; aspect-ratio: 16 / 9; border-radius: 14px; background: #1a1713; display: block; }
  .w-cs-row { display: block; }
  .w-cs-row summary { cursor: pointer; display: flex; flex-direction: column; gap: 8px; }
  .w-cs-row summary img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 10px; }
  .w-cs dt { font: 600 17px/1.4 "IBM Plex Sans", system-ui, sans-serif; color: var(--ink); margin: 24px 0 8px; }
  .w-cs dd { margin: 0; font-size: 16px; color: var(--ink2); }
  .w-cs dd ul { list-style: disc; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; }
  .w-csw { container-type: inline-size; }
  /* Wide panels (the full-width Blink card, project rows) lay the sections out as equal columns; half-width cards stay stacked. */
  @media (min-width: 1024px) { @container (min-width: 640px) { .w-cs { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 0 32px; } } }
  .w-root .w-row p, .w-root .w-card p, .w-root .w-cs dd, .w-root .w-bul, .w-root .w-contact { max-width: 72ch; }
  .w-casewrap { position: relative; margin-top: 6px; }
  .w-casewrap .w-case { margin-top: 0; }
  .w-pdf { display: inline-flex; align-items: center; gap: 8px; height: 44px; margin-top: 16px; padding: 0 16px; border: 1px solid var(--ink); border-radius: 10px; color: var(--ink); font: 500 15px/1 "IBM Plex Sans", system-ui, sans-serif; text-decoration: none; }
  .w-pdf:hover, .w-pdf:focus-visible { background: var(--paper); }
  .w-pdf svg { flex: none; }
  .w-pdfq { position: absolute; top: 0; right: 44px; height: 44px; display: inline-flex; align-items: center; font: 400 15px/1 "IBM Plex Sans", system-ui, sans-serif; color: var(--mute); text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 4px; }
  .w-pdfq:hover, .w-pdfq:focus-visible { color: var(--ink); }
  .w-case[open] + .w-pdfq { display: none; }
  /* On phones the link would sit over the middle of the How I built it bar; the panel's own PDF button covers it there. */
  @media (max-width: 639px) { .w-pdfq { display: none; } }
  .w-did b { font: 500 11px var(--mono); letter-spacing: 0.08em; text-transform: uppercase; margin-right: 6px; color: var(--ink2); }
  .w-acts { grid-column: 2 / -1; display: flex; gap: 16px; margin-top: 2px; }
  /* 32 px tall hit area (WCAG 2.5.8 asks for 24) with the same thin underline look. */
  .w-act { font: 13px var(--mono); color: var(--ink); background: none; border: 0; padding: 0; min-height: 32px; display: inline-flex; align-items: center; cursor: pointer; text-decoration: underline; text-decoration-color: var(--line); text-decoration-thickness: 1px; text-underline-offset: 5px; }
  .w-act.w-laptop { text-decoration: none; color: var(--mute); cursor: default; }
  .w-case-in { margin-top: 2px; }
  /* Compact row. Line 1 is year, title, tag and links. Line 2 is one description with a reserved two-line height so every collapsed row is the same height. */
  .w-row--c { display: block; padding: 14px 0; }
  .w-r1 { display: flex; flex-wrap: wrap; align-items: center; column-gap: 12px; min-height: 32px; }
  .w-r1 .w-y { flex: none; width: 52px; }
  .w-r1 .w-t { font-weight: 500; }
  .w-tag { font: 12.5px var(--mono); color: var(--mute); }
  .w-r1 .w-acts { margin: 0 0 0 auto; gap: 16px; flex-wrap: wrap; }
  .w-row .w-r2 { margin: 4px 0 0 64px; height: 45px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .w-more { margin: 6px 0 0 64px; }
  .w-more .w-did:first-child { margin-top: 0 !important; }
  .w-act[aria-expanded="true"] { text-decoration-color: var(--ink); }
  @media (min-width: 1100px) {
    .w-r1 { flex-wrap: nowrap; }
    .w-r1 .w-t { flex: none; }
    .w-tag { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .w-r1 .w-acts { flex: none; flex-wrap: nowrap; white-space: nowrap; }
  }
  @media (max-width: 559px) { .w-row .w-r2, .w-more { margin-left: 0; } }
  .w-case-in > summary { list-style: none; }
  .w-case-in > summary::-webkit-details-marker { display: none; }
  .w-case-in .w-cs { margin-bottom: 4px; }
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
  .w-bar .w-btn { height: 52px; }

  /* Pinned header (720px and up). Shown once the hero Résumé button has scrolled out of view. */
  .w-pin { display: none; }
  @media (min-width: 720px) {
    .w-pin {
      position: fixed; top: 0; left: 0; right: 0; z-index: 20; height: 56px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 max(32px, calc((100vw - 1280px) / 2 + 32px));
      background: var(--bg); border-bottom: 1px solid var(--line);
      transform: translateY(-100%); visibility: hidden;
      transition: transform 160ms ease-out, visibility 0s linear 160ms;
    }
    .w-pin--on { transform: none; visibility: visible; transition: transform 160ms ease-out, visibility 0s; }
    .w-bar { display: none; }
    .w-root [id] { scroll-margin-top: 72px; }
  }
  .w-pin-name { font-weight: 600; font-size: 17px; letter-spacing: -0.01em; text-decoration: none; color: var(--ink); }
  .w-pin-name:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .w-pin-r { display: flex; align-items: center; gap: 12px; }
  .w-root .w-pin .h-btn { height: 40px; min-width: 0; padding: 0 18px; font-size: 14.5px; border-radius: 10px; }
  .w-root .w-pin .h-link { min-height: 40px; padding: 0 4px; font-size: 14.5px; }
  .w-pin .h-link + .h-link { margin-left: 4px; }

  @media (min-width: 960px) {
    .w-wrap { padding: 48px 32px 104px; }
    .w-side { position: sticky; top: 24px; align-self: start; max-height: calc(100vh - 48px); overflow-y: auto; scrollbar-width: thin; overscroll-behavior: contain; }
    .w-side::-webkit-scrollbar { width: 6px; }
    .w-side::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
    @media (max-height: 900px) { .w-wrap { padding-top: 32px; } .w-desk { max-width: 260px; } .w-root h1 { margin-top: 16px; } .w-sub { margin-top: 8px; } .w-live { margin-top: 12px; padding: 10px 14px; } .w-cta { margin-top: 14px; } .w-room { margin-top: 12px; padding: 10px 14px; } }
    .w-cta { display: flex; }
    .w-room { display: flex; }
    .w-bar { display: none; }
    .w-root h1 { font-size: 40px; }
    .w-label:first-child { margin-top: 4px; }
    .w-feat { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .w-feat .w-card:first-child { grid-column: 1 / -1; }
    .w-feat > .w-card:not(:first-child) { grid-row: 2; }
    .w-feat > .w-casepanel { grid-column: 1 / -1; grid-row: 3; }
    .w-feat .w-card:first-child .w-shot { aspect-ratio: 3 / 1; }
    .w-card:hover { border-color: #cfcbc0; }
  }

  /* ---- hero (mock D structure): one canvas, one left edge, three button levels ---- */

  .w-root { overflow-x: clip; }
  .w-root .h-hero { padding: 0 0 48px; }
  .h-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
  .h-left { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
  .w-root .h-name { font-size: clamp(48px, 5.5vw, 72px); line-height: 1; letter-spacing: -0.03em; font-weight: 600; margin: 0; }
  .h-left .w-desk { max-width: 220px; }
  .h-left .w-status { margin: 8px 0 20px; }
  .h-head { font-size: 24px; line-height: 1.35; letter-spacing: -0.01em; color: var(--ink); margin-top: 16px; text-wrap: balance; }
  .h-avail { margin-top: 16px; }
  .w-root .h-avail p { font-size: 17px; line-height: 1.5; color: var(--mute); }
  .w-root .h-avail p + p { margin-top: 8px; }
  .h-actions { display: none; gap: 16px; margin-top: 32px; }
  .h-links { display: flex; flex-wrap: wrap; gap: 0 32px; margin-top: 8px; }

  .h-btn, .h-link { font: 500 17px/1 "IBM Plex Sans", system-ui, sans-serif; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
  .h-btn { height: 56px; min-width: 160px; padding: 0 28px; border-radius: 12px; border: 1px solid var(--ink); }
  .w-root .h-btn--p { background: var(--ink); color: var(--bg); }
  .h-btn--p:hover { background: var(--ink2); border-color: var(--ink2); }
  .w-root .h-btn--s { background: transparent; color: var(--ink); }
  .h-btn--s:hover { background: var(--paper); }
  .w-root .h-link { min-height: 44px; color: var(--mute); }
  .w-root .h-link:hover { color: var(--ink); }
  .h-link:hover, .h-link:focus-visible { text-decoration: underline; text-underline-offset: 4px; }
  .h-btn:focus-visible, .h-link:focus-visible, .h-chip:focus-visible, .h-go:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .w-root .w-btn:focus-visible, .w-root .w-act:focus-visible, .w-root .w-go:focus-visible, .w-root .w-links a:focus-visible, .w-root .w-live a:focus-visible, .w-root .w-live button:focus-visible, .w-root .w-contact a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }

  .h-glow { position: relative; align-self: center; }
  /* The one accent: a static soft glow hugging all four sides of the card. */
  .h-glow::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; border-radius: var(--r); box-shadow: 0 0 72px 20px color-mix(in srgb, var(--acc) 45%, transparent); }
  .h-ask { position: relative; z-index: 1; display: flex; flex-direction: column; padding: 32px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--r); }
  .w-root .h-ask h2 { font-size: 24px; line-height: 1.3; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
  .h-ask-sub { font-size: 15px; line-height: 1.5; color: var(--mute); margin-top: 8px; }
  .h-field { display: flex; align-items: center; gap: 8px; height: 48px; margin-top: 24px; padding: 0 6px 0 16px; background: var(--bg); border: 1px solid var(--mute); border-radius: 12px; }
  .h-field:focus-within { border-color: var(--ink); outline: 2px solid var(--ink); outline-offset: 2px; }
  .h-ask input { flex: 1; min-width: 0; height: 100%; font: 400 17px/1.4 "IBM Plex Sans", system-ui, sans-serif; color: var(--ink); background: transparent; border: 0; outline: none; }
  .h-ask input::placeholder { color: var(--mute); opacity: 1; }
  .h-go { flex: none; width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--ink); color: var(--bg); font: 500 17px/1 "IBM Plex Sans", system-ui, sans-serif; cursor: pointer; }
  .h-go:hover { background: var(--ink2); }
  .h-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .h-chip { height: 36px; padding: 0 16px; border: 1px solid var(--mute); border-radius: 99px; background: transparent; color: var(--ink2); font: 400 15px/1 "IBM Plex Sans", system-ui, sans-serif; cursor: pointer; }
  .h-chip:hover { background: var(--paper); }

  .h-proof { list-style: none; display: grid; grid-template-columns: minmax(0, 1fr); margin-top: 40px; background: var(--paper); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; }
  .h-proof li { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 16px; align-items: baseline; padding: 18px 20px; }
  .h-proof li + li { border-top: 1px solid var(--line); }
  .h-proof b { display: block; font-size: 30px; line-height: 1.1; font-weight: 600; letter-spacing: -0.02em; color: var(--acc-text); font-variant-numeric: tabular-nums; }
  .h-proof span { display: block; font-size: 15px; line-height: 1.5; color: var(--ink2); }
  @media (min-width: 720px) {
    .h-proof { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .h-proof li { display: block; padding: 24px; }
    .h-proof li + li { border-top: 0; }
    .h-proof li:nth-child(even) { border-left: 1px solid var(--line); }
    .h-proof li:nth-child(n+3) { border-top: 1px solid var(--line); }
    .h-proof b { font-size: 40px; }
    .h-proof span { margin-top: 8px; }
  }
  @media (min-width: 1100px) {
    .h-proof { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .h-proof li:nth-child(n+3) { border-top: 0; }
    .h-proof li + li { border-left: 1px solid var(--line); }
  }

  @media (min-width: 641px) { .w-wrap { padding-left: 32px; padding-right: 32px; } }
  @media (min-width: 960px) {
    .h-grid { grid-template-columns: minmax(0, 58fr) minmax(0, 42fr); gap: 64px; }
    .h-actions { display: flex; }
    .h-head { font-size: 28px; line-height: 1.3; }
    .h-ask { padding: 40px; }
    .w-root .h-ask h2 { font-size: 28px; }
    .h-field { height: 56px; }
    .h-go { width: 40px; height: 40px; }
    .h-chip { height: 40px; }
  }
  /* Desktop first screen: about 8% smaller type and buttons, 28px more air above the name. */
  @media (min-width: 1100px) {
    .w-wrap { padding-top: 76px; }
    @media (max-height: 900px) { .w-wrap { padding-top: 60px; } }
    .w-root .h-name { font-size: clamp(44px, 5.1vw, 66px); }
    .h-head { font-size: 26px; }
    .w-root .h-avail p { font-size: 15.6px; }
    .h-btn { height: 51px; min-width: 148px; padding: 0 26px; font-size: 15.6px; }
    .h-link { font-size: 15.6px; }
  }
  html[data-hero-ask] #ask-wrap { visibility: hidden; }

  @media (prefers-reduced-motion: reduce) {
    .w-root *, .w-root *::before, .w-root *::after { transition: none !important; scroll-behavior: auto !important; }
  }
`;

// The two strongest existing Ask questions (the same ones the pill suggests).
const ASK_CHIPS = ['Why hire Dhruv?', 'What did he build at Blink?'];

// Short captions for the hero proof row only; the full text stays in the content file (Ask, résumé, llms.txt).
const PROOF_SHORT = {
  '18%': 'reply rate on 489 outreach emails at Blink',
  'Top 5': 'finalist, IIT Madras × BITS Goa security hackathon',
  '2×': 'hackathon wins at Innovathon 2025 and REALMS 2025',
};

// The number inside a proof value (18, 7, 5, 2) is wrapped so it can count up. Digits are tabular so they do not jitter.
function ProofValue({ value }) {
  const m = /^(\D*)(\d+)(.*)$/.exec(value);
  if (!m || m[1]) return value;
  return <>{m[1]}<data value={m[2]} data-cu={m[2]} style={{ display: 'inline-block', minWidth: `${m[2].length}ch`, fontVariantNumeric: 'tabular-nums' }}>{m[2]}</data>{m[3]}</>;
}

const PREVIEWS = { focuslock: '/previews/focuslock.jpg', darksentinel: '/previews/darksentinel.jpg', expense: '/previews/expense.jpg', portfolio3d: '/previews/portfolio3d.jpg' };

// Room tour: the files load when scrolled near (H.264 MP4 first for Safari, WebM as fallback). It plays muted only while
// at least 60% of it is on screen, pauses when it leaves, and stays paused (controls on) under reduced motion.
function TourVideo() {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loader = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || v.querySelector('source')) return;
      [['/media/room-tour.mp4', 'video/mp4'], ['/media/room-tour.webm', 'video/webm']].forEach(([src, type]) => {
        const el = document.createElement('source'); el.src = src; el.type = type; v.appendChild(el);
      });
      v.load();
      loader.disconnect();
    }, { rootMargin: '200px' });
    const player = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) { if (!calm) v.play().catch(() => {}); } else v.pause();
    }, { threshold: [0, 0.6] });
    loader.observe(v);
    player.observe(v);
    return () => { loader.disconnect(); player.disconnect(); };
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
    fetch('/api/proof').then((r) => r.json()).then((d) => { if (live && d?.commits?.length) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, []);
  if (!data) return null;
  return (
    <>
      <h2 className="w-label"><span>Live from GitHub</span><span>updated {ago(data.updated)}</span></h2>
      {typeof data.contributions === 'number' && <p className="w-contrib">{data.contributions.toLocaleString('en-US')} contributions in the last year</p>}
      <div className="w-list" data-testid="gh-proof">
        {data.commits.map((c) => (
          <div className="w-row w-row--gh" key={`${c.repo}-${c.sha}`}>
            <span className="w-y">{ago(c.date)}</span>
            <span>
              <b>{c.repo}</b>
              <p><a href={c.url} target="_blank" rel="noopener noreferrer">{c.msg}</a></p>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const CASE_SECTIONS = [['problem', 'Problem'], ['decisions', 'Decisions'], ['broke', 'What broke'], ['result', 'Result']];
const caseText = (c) => c && (
  <div className="w-csw">
    <dl className="w-cs" style={{ '--cols': CASE_SECTIONS.filter(([k]) => c[k]?.length).length }}>
      {CASE_SECTIONS.filter(([k]) => c[k]?.length).map(([k, label]) => (
        <div key={k}><dt>{label}</dt><dd><ul>{c[k].map((b) => (<li key={b}>{b}</li>))}</ul></dd></div>
      ))}
    </dl>
  </div>
);

// Same-site PDF: opens in this tab so Back returns to the page.
const caseLabel = (id) => `One-page case file (PDF) for ${projects.find((x) => x.id === id)?.name ?? id}`;
// Only projects whose case study carries a `pdf` field have a generated case file.
const hasPdf = (id) => Boolean((id === 'blink' ? experience[0] : projects.find((x) => x.id === id))?.caseStudy?.pdf);
const casePdf = (id) => hasPdf(id) && (
  <a className="w-pdf" href={`/casefiles/${id}.pdf`} aria-label={caseLabel(id)}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z" /><path d="M9.5 1.5v3h3M8 7v4.5M6 9.5l2 2 2-2" strokeLinecap="round" /></svg>
    One-page case file (PDF)
  </a>
);
const casePdfQuiet = (id) => hasPdf(id) && <a className="w-pdfq" href={`/casefiles/${id}.pdf`} aria-label={caseLabel(id)}>Case file (PDF)</a>;

const didLine = (id) => whatIDid[id] && <p className="w-did"><b>What I did</b> {whatIDid[id]}</p>;

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
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      window.scrollTo(0, y); // Back's own scroll restore runs while overflow is still hidden and lands on 0
    };
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
  // { id, index } of the open demo; the trigger gets focus back on close.
  const [open, setOpen] = useState(null);
  const trigger = useRef(null);
  // The featured row's shared case panel: id of the project whose case is open.
  const [caseId, setCaseId] = useState(null);
  const [moreId, setMoreId] = useState(null);
  const caseBtn = useRef(null);
  const closeCase = () => { setCaseId(null); caseBtn.current?.focus({ preventScroll: true }); };
  // The résumé reader and demo panels are in-page overlays. Each pushes one history entry when it opens, so browser
  // Back (or the trackpad gesture) closes the overlay instead of leaving the site; the close button pops that same
  // entry, so no dangling entry is left behind.
  const closeOverlay = useCallback((el) => {
    if (window.history.state?.wOverlay) window.history.back(); // popstate below closes it and returns focus
    else { setReaderOpen(false); setOpen(null); el.current?.focus({ preventScroll: true }); }
  }, []);
  const closeReader = useCallback(() => closeOverlay(readerTrigger), [closeOverlay]);
  const closeDemo = useCallback(() => closeOverlay(trigger), [closeOverlay]);
  useEffect(() => {
    const onPop = () => {
      if (window.history.state?.wOverlay) return;
      setReaderOpen(false);
      setOpen(null);
      (trigger.current || readerTrigger.current)?.focus({ preventScroll: true });
      trigger.current = null;
      readerTrigger.current = null;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Phones only: probed at idle, after first paint, so it costs the page nothing.
  const [roomOnPhone, setRoomOnPhone] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return undefined;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    const id = idle(() => setRoomOnPhone(phoneCanRoom()));
    return () => (window.cancelIdleCallback || clearTimeout)(id);
  }, []);
  const roomHref = (tour) => (roomOnPhone ? '/room/?room=phone&tour=1' : tour ? '/room/?tour=1' : '/room/');

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
  const statusText = `${formatIst(now)} in Mumbai${temperature !== null ? ` · ${temperature}°C` : ''}`;

  // A project with no description yet renders as a bare title and a lone tech
  // chip, which reads as a broken stub rather than as work. Withhold it until
  // there is something true to say about it.
  const listed = projects.filter((p) => p.description || p.tagline);
  const pick = (ids) => ids.map((id) => listed.find((p) => p.id === id)).filter(Boolean);
  const featured = pick(featuredProjectIds);
  const personal = pick(personalProjectIds);
  const hackathon = pick(hackathonProjectIds);

  // The hero's second proof item counts the projects that have a Try it demo on this page.
  const demoCount = listed.filter((p) => DEMOS[p.id]).length;
  const proofItems = proofPoints.map((p) => (p.value === '4'
    ? { value: String(demoCount), text: 'projects with a demo you can try on this page' }
    : { ...p, text: PROOF_SHORT[p.value] || p.text }));
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const blink = experience[0];
  const openResume = (e) => {
    if (!canEmbedPdf()) return;
    e.preventDefault();
    readerTrigger.current = e.currentTarget;
    trigger.current = null;
    window.history.pushState({ wOverlay: 'resume' }, '');
    setReaderOpen(true);
  };
  // Open the first variant that fits the screen: on a phone, FocusLock opens
  // its Android app instead of the Windows app scaled to unreadable text.
  const tryDemo = (project, e) => {
    trigger.current = e.currentTarget;
    readerTrigger.current = null;
    window.history.pushState({ wOverlay: 'demo' }, '');
    const list = DEMOS[project.id];
    setOpen({ id: project.id, index: Math.max(0, list.findIndex((d) => !d.minWidth || window.innerWidth >= d.minWidth)) });
  };
  // Hero Ask card -> the existing Ask panel (public/os/shell/ask-pill.js, hero variant). The card has no client of its
  // own: it sends the question and its own element, and the panel grows out of the card's rect. While the card is on
  // screen the floating pill is hidden (html[data-hero-ask]).
  const [askText, setAskText] = useState('');
  const askCardRef = useRef(null);
  const askRowRef = useRef(null);
  useEffect(() => {
    const el = askCardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => document.documentElement.toggleAttribute('data-hero-ask', e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => { io.disconnect(); document.documentElement.removeAttribute('data-hero-ask'); };
  }, []);
  // Proof numbers count up once when the row first scrolls into view. The final value is in the HTML already.
  const proofRef = useRef(null);
  useEffect(() => {
    const ul = proofRef.current;
    if (!ul || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const els = [...ul.querySelectorAll('[data-cu]')];
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 900);
        const eased = 1 - (1 - k) ** 3;
        els.forEach((el) => { el.textContent = String(Math.round(Number(el.dataset.cu) * eased)); });
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(ul);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  // Pinned header: on once the hero's Résumé button (or, where that is hidden, the hero link row) has scrolled above the viewport.
  const [pin, setPin] = useState(false);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const btn = document.querySelector('.h-actions');
      const el = btn && btn.offsetParent ? btn : document.querySelector('.h-links');
      setPin(Boolean(el) && el.getBoundingClientRect().bottom < 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(measure); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  const toTop = (e) => { e.preventDefault(); window.scrollTo({ top: 0 }); };
  const warmAsk = () => document.getElementById('ask-pill')?.dispatchEvent(new Event('pointerenter'));
  const askFromHero = (q, tries = 0) => {
    const card = document.getElementById('ask-card');
    if (!card) { if (tries < 15) setTimeout(() => askFromHero(q, tries + 1), 200); return; }
    setAskText('');
    // The panel grows out of this card's rect and closes back into it (ask-pill.js, hero variant).
    card.dispatchEvent(new CustomEvent('ask-hero', { detail: { q: q.trim(), from: askCardRef.current, input: askRowRef.current?.querySelector('input') } }));
  };

  // Tells the Ask pill (public/os/shell/ask-pill.js) to step aside while a
  // demo or the résumé covers the page; it sits above everything otherwise.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-overlay', Boolean(open || readerOpen));
  }, [open, readerOpen]);
  // A cold load of /work/#p-x (an Ask source opened from the room) arrives before
  // these sections render, so the browser's own jump finds nothing.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  const TAGS = { darksentinel: 'Top 5 finalist', fraud: 'Winner, Innovathon 2025', hexfence: 'ETHGlobal Mumbai 2026', crisiswatch: 'MumbaiHacks' };
  const renderRow = (p) => {
    const hasMore = p.caseStudy || whatIDid[p.id] || p.badge || p.label;
    const isOpen = moreId === p.id;
    return (
      <div className="w-row w-row--c" key={p.id} id={`p-${p.id}`}>
        <div className="w-r1">
          <span className="w-y">{p.year}</span>
          <b className="w-t">{p.name}</b>
          {TAGS[p.id] && <span className="w-tag">{TAGS[p.id]}</span>}
          <span className="w-acts">
            {DEMOS[p.id] && <button type="button" className="w-act" onClick={(e) => tryDemo(p, e)}>Try it</button>}
            {p.links?.live === '/room/' && <span className="w-act w-laptop">Laptop only</span>}
            {p.links?.live && (
              <a className={`w-act${p.links.live === '/room/' ? ' w-roomlink' : ''}`} href={p.links.live === '/room/' ? roomHref(false) : p.links.live}
                {...(p.links.live.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>{p.links.live === '/room/' ? 'Walk through it' : 'Visit'}</a>
            )}
            {p.links?.github && (
              <a className="w-act" href={p.links.github} target="_blank" rel="noopener noreferrer">Source</a>
            )}
            {hasMore && (
              <button type="button" className="w-act" aria-expanded={isOpen} aria-controls={`more-${p.id}`} onClick={() => setMoreId(isOpen ? null : p.id)}>
                {p.caseStudy ? 'How I built it' : 'More'}
              </button>
            )}
          </span>
        </div>
        <p className="w-r2">{p.tagline || p.description}</p>
        {isOpen && (
          <div className="w-more" id={`more-${p.id}`}>
            {didLine(p.id)}
            {(p.badge || p.label) && <span className="w-meta">{p.badge || p.label}</span>}
            {casePdf(p.id)}
            {caseText(p.caseStudy)}
          </div>
        )}
      </div>
    );
  };

  const secondAction = (project) => {
    if (DEMOS[project.id]) return <button type="button" className="w-go" onClick={(e) => tryDemo(project, e)}>Try it<span aria-hidden="true">→</span></button>;
    const live = project.links?.live;
    if (live === '/room/') return (
      <>
        <a className="w-go w-roomlink" href={roomHref(false)}>Walk through it<span aria-hidden="true">→</span></a>
        <span className="w-go w-laptop">Laptop only</span>
      </>
    );
    if (live) return <a className="w-go" href={live} target="_blank" rel="noopener noreferrer">Visit<span aria-hidden="true">→</span></a>;
    if (project.links?.github) return <a className="w-go" href={project.links.github} target="_blank" rel="noopener noreferrer">Source<span aria-hidden="true">→</span></a>;
    return null;
  };

  const renderFeatured = (project) => (
    <article className="w-card" key={project.id} id={`p-${project.id}`}>
      {PREVIEWS[project.id] && (
        <div className="w-shot">
          <img src={PREVIEWS[project.id]} alt={`${project.name} screenshot`} loading="lazy" />
        </div>
      )}
      <div className="w-ci">
        <span className="w-meta">{project.year} · {project.tech.slice(0, 3).join(', ')}</span>
        <h3>{project.name}</h3>
        <p className="w-clamp">{project.summary || project.tagline}</p>
        <div className="w-card-acts">
          {project.caseStudy && (
            <button type="button" className="w-go" aria-expanded={caseId === project.id} aria-controls="feat-case"
              onClick={(e) => { caseBtn.current = e.currentTarget; setCaseId(caseId === project.id ? null : project.id); }}>
              How I built it<span aria-hidden="true">→</span>
            </button>
          )}
          {secondAction(project)}
        </div>
      </div>
    </article>
  );

  const casePanel = (project) => (
    <section className="w-casepanel" id="feat-case" aria-label={`${project.name}, how I built it`}>
      <div className="w-casehead">
        <h3>{project.name}</h3>
        <button type="button" className="w-pdf w-closecase" onClick={closeCase}>Close</button>
      </div>
      {caseText(project.caseStudy)}
      {casePdf(project.id)}
    </section>
  );

  const footText = 'Built by hand. There is also a real 3D room you can walk around on a laptop.';

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
      <div className={`w-root${roomOnPhone ? ' w-root--room' : ''}`}>
        <div className="w-wrap">
          <section className="h-hero" aria-label="Introduction">
            <div className="h-grid">
              <div className="h-left">
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
                <h1 className="h-name">{identity.name}</h1>
                <p className="h-head">{identity.headline}</p>
                <div className="h-avail">
                  {identity.availability.map((line) => (<p key={line}>{line}</p>))}
                </div>
                <div className="h-actions">
                  {contact.resume && (
                    <a className="h-btn h-btn--p" href={contact.resume} onClick={openResume}>Résumé</a>
                  )}
                  <a className="h-btn h-btn--s" href={`mailto:${contact.email}`}>Email</a>
                </div>
                <div className="h-links">
                  <a className="h-link" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                  <a className="h-link" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a className="h-link w-roomlink" href={roomHref(true)}>3D room</a>
                </div>
              </div>
              <div className="h-glow" ref={askCardRef}>
                <form className="h-ask" role="search" onSubmit={(e) => { e.preventDefault(); askFromHero(askText); }}>
                  <h2>Ask about my work</h2>
                  <p className="h-ask-sub">An AI answers from my projects and résumé.</p>
                  <div className="h-field" ref={askRowRef}>
                    <input id="h-ask-q" type="text" maxLength={300} autoComplete="off" spellCheck="false" aria-label="Ask about Dhruv" placeholder={narrow ? 'Ask a question' : 'What did Dhruv build at Blink?'}
                      value={askText} onChange={(e) => setAskText(e.target.value)} onFocus={warmAsk} onPointerEnter={warmAsk} />
                    <button type="submit" className="h-go" aria-label="Ask">↑</button>
                  </div>
                  <div className="h-chips">
                    {ASK_CHIPS.map((q) => (
                      <button type="button" className="h-chip" key={q} onClick={() => askFromHero(q)}>{q}</button>
                    ))}
                  </div>
                </form>
              </div>
            </div>
            <ul className="h-proof" id="proof" aria-label="Proof" ref={proofRef}>
              {proofItems.map((p) => (
                <li key={p.text}><b><ProofValue value={p.value} /></b><span>{p.text}</span></li>
              ))}
            </ul>
          </section>

          <main id="work-main" ref={mainRef} tabIndex={-1}>
            <h2 className="w-label"><span>Featured</span></h2>
            <div className="w-feat">
              <article className="w-card">
                <div className="w-ci">
                  <span className="w-meta">Blink.new · {blink.from.slice(-4)} · Python, Gmail API, LLM</span>
                  <h3>An outreach pipeline people actually replied to</h3>
                  <p>I built four growth tools at Blink as the sole developer. They cover creator outreach (650 creators sourced), link building, SEO and AI-search tracking, and a Reddit copilot.</p>
                  <div className="w-res"><b>18%</b><small>of contacted creators replied · 14 positive</small></div>
                  <div className="w-casewrap">
                    <details className="w-case">
                      <summary className="w-go">How I built it<span>→</span></summary>
                      <ul className="w-bul">
                        {blink.caseStudy.summary.map((b) => (<li key={b}>{b}</li>))}
                      </ul>
                      {casePdf('blink')}
                      {caseText(blink.caseStudy)}
                    </details>
                    {casePdfQuiet('blink')}
                  </div>
                </div>
              </article>
              {featured.map((p) => (<Fragment key={p.id}>{renderFeatured(p)}{caseId === p.id && casePanel(p)}</Fragment>))}
            </div>

            <div className="w-two">
              <div className="w-two-blink">
                <h2 className="w-label" id="blink"><span>At Blink.new (internship)</span></h2>
                <div className="w-list">
                  {blinkTools.filter((t) => t.id !== 'outreach').map((t) => (
                    <div className="w-row w-row--c" key={t.id}>
                      <div className="w-r1"><span className="w-y">2026</span><b className="w-t">{t.name}</b></div>
                      <p className="w-r2">{t.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-two-personal">
                <h2 className="w-label"><span>Personal projects</span><span>{personal.length}</span></h2>
                <div className="w-list">{personal.map(renderRow)}</div>
              </div>
            </div>

            <section className="w-hack">
              <h2 className="w-label" id="hackathons"><span>Hackathon projects</span><span>{hackathon.length}</span></h2>
              <div className="w-hgrid">
                <div className="w-list">{hackathon.slice(0, 2).map(renderRow)}</div>
                <div className="w-list">{hackathon.slice(2).map(renderRow)}</div>
              </div>
            </section>

            <section className="w-exp">
              <h2 className="w-label" id="experience"><span>Experience</span></h2>
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
            </section>

            <GithubProof />

            <h2 className="w-label"><span>Room tour</span><span>1 min, no sound</span></h2>
            <TourVideo />

            <h2 className="w-label" id="contact"><span>Contact</span></h2>
            <p className="w-contact">
              Open to remote software engineering and growth engineering internships from December 2026. Email{' '}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>.
            </p>
            <p className="w-foot">{footText}</p>
          </main>
        </div>
        <header className={`w-pin${pin ? ' w-pin--on' : ''}`} inert={!pin}>
          <a className="w-pin-name" href="#top" onClick={toTop}>{identity.name}</a>
          <nav className="w-pin-r" aria-label="Pinned links">
            {contact.resume && (
              <a className="h-btn h-btn--p" href={contact.resume} onClick={openResume}>Résumé</a>
            )}
            <a className="h-btn h-btn--s" href={`mailto:${contact.email}`}>Email</a>
            <a className="h-link" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="h-link" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </nav>
        </header>
        <nav className="w-bar" aria-label="Quick actions">
          {contact.resume && (
            <a className="w-btn w-btn--p" href={contact.resume} onClick={openResume}>Résumé</a>
          )}
          <a className="w-btn" href={`mailto:${contact.email}`}>Email</a>
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
