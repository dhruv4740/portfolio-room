import { useEffect } from 'react';
import './mock.css';
import { projects, identity, contact } from '../v3/content/index.js';

const p = projects.find((x) => x.id === 'focuslock');

function Diagram() {
  const box = { fill: '#fbfaf7', stroke: '#17160f', strokeWidth: 1.25 };
  const t = { fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fill: '#17160f' };
  const s = { ...t, fill: '#6b675e', fontSize: 9.5 };
  return (
    <svg className="m-diag" viewBox="0 0 640 170" fill="none" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Diagram: an Android app and a Windows agent both read and write one Firestore database">
      <rect x="10" y="40" width="170" height="90" rx="8" {...box} />
      <text x="95" y="72" textAnchor="middle" {...t}>Android app</text>
      <text x="95" y="90" textAnchor="middle" {...s}>Kotlin</text>
      <text x="95" y="106" textAnchor="middle" {...s}>Accessibility service</text>
      <rect x="460" y="40" width="170" height="90" rx="8" {...box} />
      <text x="545" y="72" textAnchor="middle" {...t}>Windows agent</text>
      <text x="545" y="90" textAnchor="middle" {...s}>Electron</text>
      <text x="545" y="106" textAnchor="middle" {...s}>active-win polling</text>
      <rect x="240" y="40" width="160" height="90" rx="8" stroke="#c2410c" strokeWidth="1.5" fill="#fbfaf7" />
      <text x="320" y="72" textAnchor="middle" {...t}>Firestore</text>
      <text x="320" y="90" textAnchor="middle" {...s}>users/&lt;sync code&gt;/</text>
      <text x="320" y="106" textAnchor="middle" {...s}>policy · usage_days</text>
      <path d="M180 85h60M400 85h60" stroke="#17160f" strokeWidth="1.25" />
      <path d="M232 80l8 5-8 5M468 80l-8 5 8 5M188 80l-8 5 8 5M392 80l8 5-8 5" stroke="#17160f" strokeWidth="1.25" />
      <text x="320" y="24" textAnchor="middle" {...s}>no application server</text>
    </svg>
  );
}

export default function FocuslockPage() {
  useEffect(() => { document.title = 'FocusLock case study (mock-up) · Dhruv Kothari'; }, []);
  const cs = p.caseStudy;
  return (
    <div className="m-root m-cs">
      <div className="m-banner">Redesign mock-up · case study · preview only</div>
      <main className="m-wrap">
        <p><a className="m-back" href="/mock/a/">← Mock-up A</a> &nbsp; <a className="m-back" href="/mock/b/">Mock-up B</a></p>
        <h1>{p.name}</h1>
        <p style={{ fontSize: '1.15rem', marginTop: 10 }}>{p.tagline} One daily allowance, shared by an Android phone and a Windows PC, so switching device does not reset it.</p>
        <dl>
          <dt>Role</dt><dd>Personal project</dd>
          <dt>When</dt><dd>2026: first prototype May 2026, v0.7.1 on 28 July 2026</dd>
          <dt>Stack</dt><dd>{p.tech.join(', ')}</dd>
        </dl>

        <h2>Problem</h2>
        <p>{cs.problem}</p>

        <h2>How it works</h2>
        <Diagram />
        <p>Both apps read one policy and write usage into one Firestore subtree, chosen by a sync code the user picks. Android detects the foreground app through an event-driven Accessibility service. The Windows agent polls the active window, matches process names and browser URLs against the policy, and closes tabs or kills processes.</p>

        <h2>Trade-offs</h2>
        <p>{cs.decisions}</p>

        <h2>What broke, and the fix</h2>
        <p>The Windows agent logged "closed tab" but the tab stayed open. Posting a synthetic Ctrl key message never updates Windows' global key state, so Chromium saw a plain W. Switching from PostMessage to SendInput, which updates key state, fixed it.</p>
        <p>On Android, the lock screen was an overlay drawn over the blocked app, which kept playing audio underneath. The service now fires a Home action the moment the lock engages, so the app leaves the foreground and playback stops.</p>

        <h2>Tests</h2>
        <div className="m-stats"><div><b>233</b><span>automated tests</span></div><div><b>72</b><span>commits (as of v0.7.1)</span></div></div>

        <h2>Links</h2>
        <div className="m-actions" style={{ marginTop: 0 }}>
          <a className="m-btn p" href="/apps/focuslock/">Try the live demo</a>
          <a className="m-btn s" href={p.links.github}>Source on GitHub</a>
          <a className="m-quiet" href={contact.resume}>{identity.name}, résumé</a>
        </div>
      </main>
    </div>
  );
}
