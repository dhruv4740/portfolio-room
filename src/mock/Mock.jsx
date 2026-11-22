import { useEffect, useRef, useState } from 'react';
import './mock.css';
import { identity, contact, education, experience, projects, proofPoints, blinkTools, personalProjectIds } from '../v3/content/index.js';
import Desk from './Desk.jsx';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = (id) => projects.find((p) => p.id === id);
const DEMO = { focuslock: '/apps/focuslock/', darksentinel: '/apps/darksentinel/' };
const SHOT = { focuslock: '/previews/focuslock.jpg', darksentinel: '/previews/darksentinel.jpg' };
const ROLE = { focuslock: 'Personal project', basket: 'Personal project', blink: 'Sole developer, growth intern', darksentinel: 'Team build: dashboards, API and the uncertain-zone Claude call', hexfence: 'Team build (ETHGlobal Mumbai)' };
const ROWS = ['focuslock', 'blink', 'basket', 'darksentinel', 'hexfence'];
const BLINK = { name: 'Creator outreach pipeline (Blink.new)', tagline: '18% of contacted creators replied, across 489 outreach emails drafted by an LLM pipeline.', year: 2026, tech: ['Python', 'SQLite', 'YouTube Data API', 'Gmail API', 'LLM drafting'], links: {} };
const QUESTIONS = ['What did Dhruv build at Blink?', 'How does FocusLock work?', 'Is he open to internships?'];

function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || !('IntersectionObserver' in window)) { el?.classList.add('in'); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.disconnect(); } }), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`m-reveal ${className}`}>{children}</div>;
}

function CountUp({ value, on }) {
  const m = /^(\d+)(.*)$/.exec(value);
  const [n, setN] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (!m || !on || reduced() || !('IntersectionObserver' in window)) return;
    const end = +m[1];
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => { const k = Math.min(1, (t - t0) / 1100); setN(Math.round(end * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); else setN(null); };
      setN(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <b ref={ref}>{n === null ? value : n + m[2]}</b>;
}

function AskSection({ bold }) {
  const host = useRef(null);
  const box = useRef(null);
  useEffect(() => {
    let tries = 0, t, off = () => {};
    const grab = () => {
      const w = document.getElementById('ask-wrap');
      if (!w) { if (tries++ < 60) t = setTimeout(grab, 150); return; }
      host.current.appendChild(w);
      if (bold) {
        const inp = w.querySelector('input');
        const set = () => box.current?.classList.toggle('live', document.activeElement === inp || inp.value.length > 0);
        const evs = ['focus', 'blur', 'input'];
        evs.forEach((ev) => inp.addEventListener(ev, set));
        off = () => evs.forEach((ev) => inp.removeEventListener(ev, set));
      }
    };
    grab();
    return () => { clearTimeout(t); off(); };
  }, [bold]);
  const ask = (q) => {
    const w = document.getElementById('ask-wrap');
    const inp = w?.querySelector('input');
    const form = w?.querySelector('form');
    if (!inp || !form) return;
    inp.value = q;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  };
  return (
    <section className="m-sec" aria-labelledby="m-ask-h">
      <span className="m-label">Ask</span>
      <div className="m-ask" ref={box}>
        <h2 id="m-ask-h">Ask this site anything about Dhruv</h2>
        <p className="m-sub">Answers come from his résumé and project notes.</p>
        <div className="m-ask-host" ref={host} />
        <div className="m-chips">{QUESTIONS.map((q) => <button key={q} type="button" className="m-chip" onClick={() => ask(q)}>{q}</button>)}</div>
      </div>
    </section>
  );
}

export default function Mock({ variant = 'a' }) {
  const bold = variant === 'b';
  const deskRef = useRef(null);
  useEffect(() => {
    document.title = `Redesign mock-up ${variant.toUpperCase()} · Dhruv Kothari`;
    if (!bold || reduced() || !deskRef.current) return;
    deskRef.current.querySelectorAll('path,rect,circle').forEach((el, i) => {
      const len = Math.ceil(el.getTotalLength?.() || 400);
      el.style.setProperty('--len', len);
      el.style.animationDelay = `${i * 70}ms`;
    });
  }, [bold, variant]);
  const blink = experience[0];
  const more = [...personalProjectIds, 'crisiswatch', 'fraud'].map(byId).filter(Boolean);
  return (
    <div className={`m-root ${bold ? 'm-b' : 'm-a'}`}>
      <div className="m-banner">Redesign mock-up {variant.toUpperCase()} · preview only · <a href={`/mock/${bold ? 'a' : 'b'}/`} style={{ color: '#ece7de' }}>see {bold ? 'A' : 'B'}</a></div>
      <main className="m-wrap">
        <header>
          <div ref={deskRef}><Desk /></div>
          <h1>{identity.name}</h1>
          <p className="m-head">{identity.pitch}</p>
          <p className="m-avail">{identity.now}</p>
          <div className="m-actions">
            <a className="m-btn p" href="/resume/">Résumé</a>
            <a className="m-btn s" href={`mailto:${contact.email}`}>Email</a>
            <a className="m-quiet" href={contact.github}>GitHub</a>
            <a className="m-quiet" href={contact.linkedin}>LinkedIn</a>
          </div>
        </header>

        <section className="m-sec" aria-label="Proof">
          <span className="m-label">Proof</span>
          <ul className="m-proof">{proofPoints.map((p) => <li key={p.value}><CountUp value={p.value} on={bold} /><span>{p.text}</span></li>)}</ul>
        </section>

        <AskSection bold={bold} />

        <section className="m-sec" aria-label="Selected work">
          <span className="m-label">Selected work</span>
          <Reveal>
            {ROWS.map((id) => {
              const p = id === 'blink' ? BLINK : byId(id);
              const cs = id === 'focuslock';
              return (
                <article className="m-row" key={id}>
                  <h3>{p.name}</h3>
                  <p className="m-out">{p.tagline}</p>
                  <p className="m-meta"><b>{ROLE[id]}</b> · {p.year}<br />{p.tech.join(' · ')}</p>
                  {SHOT[id] && <><div className="m-prev" aria-hidden="true"><img src={SHOT[id]} alt="" loading="lazy" /></div><figure className="m-shot"><img src={SHOT[id]} alt={`${p.name} screenshot`} loading="lazy" /></figure></>}
                  <div className="m-links">
                    <a href={cs ? '/mock/focuslock/' : '#'} className={cs ? '' : 'dis'} aria-disabled={cs ? undefined : 'true'}>Read the case study{cs ? ' →' : ' (soon)'}</a>
                    {DEMO[id] && <a href={DEMO[id]}>Try it</a>}
                    {id === 'hexfence' && <a href={p.links.live}>Try it</a>}
                    {p.links?.github && <a href={p.links.github}>Source</a>}
                  </div>
                </article>
              );
            })}
          </Reveal>
        </section>

        <section className="m-sec m-blink" aria-label="Blink">
          <span className="m-label">At Blink.new · growth intern, sole developer</span>
          <p className="m-in">{blink.detail}</p>
          <ul className="m-tools">{blinkTools.map((t) => <li key={t.id}><b>{t.name}</b><span>{t.detail}</span></li>)}</ul>
        </section>

        <section className="m-sec" aria-label="More projects">
          <span className="m-label">More projects</span>
          <ul className="m-more">{more.map((p) => <li key={p.id}>{p.name}<span>{p.year}</span></li>)}</ul>
        </section>

        <section className="m-sec" aria-label="Experience and education">
          <span className="m-label">Experience and education</span>
          <ul className="m-exp">
            {experience.map((e) => <li key={e.org}><b>{e.role}, {e.org}</b><span>{e.from} to {e.to}</span></li>)}
            <li><b>{education.degree}, {education.school}</b><span>{education.year}</span></li>
          </ul>
        </section>

        <section className="m-sec" aria-label="3D room">
          <span className="m-label">The 3D room</span>
          <a className="m-room" href="/room/"><img src="/media/room-tour.jpg" alt="Still from the 3D room tour" loading="lazy" /><div><b>Walk through the 3D desk</b><span>An interactive room with live project demos. Laptop recommended.</span></div></a>
        </section>

        <section className="m-sec m-contact" aria-label="Contact">
          <span className="m-label">Contact</span>
          <p>{identity.now}</p>
          <div className="m-actions">
            <a className="m-btn p" href={`mailto:${contact.email}`}>{contact.email}</a>
            <a className="m-quiet" href={contact.github}>GitHub</a>
            <a className="m-quiet" href={contact.linkedin}>LinkedIn</a>
          </div>
        </section>
      </main>
    </div>
  );
}
