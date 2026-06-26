import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { LAB_ENTRIES } from '../lab/registry.js';

const SWATCH_GRADIENTS = {
  A: 'linear-gradient(135deg, #38e1ff, #a06bff, #ff6bdb)',
  B: 'linear-gradient(135deg, #00ff88, #38e1ff, #0a0a1a)',
  C: 'linear-gradient(135deg, #1a0a2e, #6b38ff, #c0a0ff)',
  D: 'linear-gradient(135deg, #ff9500, #ff3b6b, #a06bff)',
  E: 'linear-gradient(135deg, #38ffb4, #38e1ff, #a06bff)',
  F: 'linear-gradient(135deg, #ff6ec4, #7873f5, #4ade80)',
  G: 'linear-gradient(135deg, #38e1ff, #5b6cff, #c0a0ff)',
  H: 'linear-gradient(135deg, #00ff88, #0aff0a, #0a0a0a)',
  I: 'linear-gradient(135deg, #ff3b6b, #ffb000, #38e1ff)',
  J: 'linear-gradient(135deg, #ffd23f, #ff6b6b, #a06bff)',
  K: 'linear-gradient(135deg, #f4f3ee, #1a1a2e, #ff3b6b)',
  L: 'linear-gradient(135deg, #0a0a2e, #6b38ff, #38e1ff)',
  M: 'linear-gradient(135deg, #00ffcc, #38e1ff, #a06bff)',
  N: 'linear-gradient(135deg, #ff6b35, #f7c59f, #1a1a40)',
  O: 'linear-gradient(135deg, #00ff66, #ff00ff, #0a0a0a)',
  P: 'linear-gradient(135deg, #ffe066, #38e1ff, #0a0a2e)',
  '—': 'linear-gradient(135deg, #a06bff, #38e1ff, #ff6bdb)',
  '+': 'linear-gradient(135deg, #38e1ff, #00ff88, #a06bff)',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  .lab-root *,
  .lab-root *::before,
  .lab-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .lab-root {
    --bg: #070708;
    --bg-card: #0d0d0f;
    --cyan: #38e1ff;
    --violet: #a06bff;
    --text: #e8e8ec;
    --text-muted: #6b6b78;
    --border: rgba(255,255,255,0.06);
    --border-hover: rgba(56,225,255,0.25);
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  .lab-root::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1000;
    opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
    animation: lab-grain 0.5s steps(2) infinite;
  }

  @keyframes lab-grain {
    0%   { transform: translate(0,0); }
    25%  { transform: translate(-2px,1px); }
    50%  { transform: translate(1px,-2px); }
    75%  { transform: translate(2px,1px); }
    100% { transform: translate(-1px,2px); }
  }

  .lab-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 60% 40% at 80% 10%, rgba(160,107,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 50% 35% at 15% 85%, rgba(56,225,255,0.05) 0%, transparent 60%);
  }

  .lab-page {
    position: relative;
    z-index: 1;
    max-width: 960px;
    margin: 0 auto;
    padding: 80px 40px 60px;
  }

  .lab-kicker {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--cyan);
    text-transform: uppercase;
    opacity: 0;
  }

  .lab-headline {
    font-size: clamp(48px, 8vw, 88px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.0;
    margin-top: 20px;
    background: linear-gradient(135deg, var(--text) 30%, rgba(160,107,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0;
  }

  .lab-sub {
    margin-top: 24px;
    font-size: 15px;
    font-weight: 400;
    color: var(--text-muted);
    letter-spacing: 0.01em;
    opacity: 0;
  }

  .lab-divider {
    height: 1px;
    background: var(--border);
    margin: 56px 0;
    opacity: 0;
    transform-origin: left;
  }

  .lab-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    list-style: none;
  }

  .lab-card {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    align-items: center;
    gap: 24px;
    padding: 28px 32px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 4px;
    text-decoration: none;
    color: inherit;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transition:
      border-color 0.35s ease,
      background 0.35s ease;
    outline: none;
  }

  .lab-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, rgba(56,225,255,0.04) 0%, rgba(160,107,255,0.04) 100%);
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  .lab-card::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, var(--cyan), var(--violet));
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  .lab-card:hover,
  .lab-card:focus-visible {
    border-color: var(--border-hover);
    background: #0f0f12;
  }

  .lab-card:hover::before,
  .lab-card:focus-visible::before { opacity: 1; }

  .lab-card:hover::after,
  .lab-card:focus-visible::after { transform: scaleY(1); }

  .lab-card:focus-visible {
    outline: 2px solid var(--cyan);
    outline-offset: 2px;
  }

  .lab-letter {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    transition: color 0.25s ease;
  }

  .lab-card:hover .lab-letter,
  .lab-card:focus-visible .lab-letter { color: var(--cyan); }

  .lab-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lab-title {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text);
    transition: color 0.25s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  .lab-card:hover .lab-title,
  .lab-card:focus-visible .lab-title {
    color: #fff;
    transform: skewX(-1.5deg) translateX(4px);
  }

  .lab-blurb {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-muted);
    letter-spacing: 0.01em;
    line-height: 1.5;
    transition: color 0.25s ease;
  }

  .lab-card:hover .lab-blurb,
  .lab-card:focus-visible .lab-blurb { color: #8888a0; }

  .lab-swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  .lab-card:hover .lab-swatch,
  .lab-card:focus-visible .lab-swatch {
    transform: scale(1.15) rotate(15deg);
  }

  .lab-swatch-inner {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-size: 200% 200%;
    animation: lab-swatch-shift 4s ease infinite;
  }

  @keyframes lab-swatch-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .lab-arrow {
    position: absolute;
    right: 32px;
    top: 50%;
    transform: translateY(-50%) translateX(-8px);
    opacity: 0;
    color: var(--cyan);
    font-size: 18px;
    transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  .lab-card:hover .lab-arrow,
  .lab-card:focus-visible .lab-arrow {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  .lab-footer {
    margin-top: 64px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
    opacity: 0;
  }

  .lab-footer p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  @media (max-width: 600px) {
    .lab-page { padding: 48px 20px 40px; }
    .lab-card {
      grid-template-columns: 36px 1fr;
      padding: 20px 20px;
      gap: 16px;
    }
    .lab-swatch { display: none; }
    .lab-arrow { right: 20px; }
  }
`;

export default function Lab() {
  const rootRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      rootRef.current
        ?.querySelectorAll('.lab-kicker, .lab-headline, .lab-sub, .lab-divider, .lab-card, .lab-footer')
        .forEach((el) => { el.style.opacity = '1'; });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tlRef.current = tl;

    tl.to('.lab-kicker', { opacity: 1, y: 0, duration: 0.6, clearProps: 'transform' }, 0)
      .from('.lab-kicker', { y: -12 }, 0)

      .to('.lab-headline', { opacity: 1, duration: 0.8 }, 0.15)
      .from('.lab-headline', { y: 32, skewX: -2 }, 0.15)

      .to('.lab-sub', { opacity: 1, duration: 0.6 }, 0.4)
      .from('.lab-sub', { y: 16 }, 0.4)

      .to('.lab-divider', { opacity: 1, scaleX: 1, duration: 0.7 }, 0.55)
      .from('.lab-divider', { scaleX: 0 }, 0.55)

      .to('.lab-card', {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: 'power2.out',
      }, 0.75)
      .from('.lab-card', { y: 28 }, 0.75)

      .to('.lab-footer', { opacity: 1, duration: 0.5 }, 1.6);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="lab-root" ref={rootRef}>
        <div className="lab-ambient" aria-hidden="true" />
        <main className="lab-page" role="main">
          <p className="lab-kicker">DHRUV KOTHARI — LAB</p>
          <h1 className="lab-headline">The concepts.</h1>
          <p className="lab-sub">Every direction explored. Open each for the real thing.</p>
          <div className="lab-divider" role="separator" aria-hidden="true" />

          <nav aria-label="Lab concepts">
            <ul className="lab-list">
              {LAB_ENTRIES.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/lab/${entry.id}`}
                    className="lab-card"
                    aria-label={`${entry.letter}: ${entry.title}`}
                  >
                    <span className="lab-letter" aria-hidden="true">{entry.letter}</span>
                    <div className="lab-body">
                      <span className="lab-title">{entry.title}</span>
                      <span className="lab-blurb">{entry.blurb}</span>
                    </div>
                    <div className="lab-swatch" aria-hidden="true">
                      <div
                        className="lab-swatch-inner"
                        style={{
                          background: SWATCH_GRADIENTS[entry.letter] ?? SWATCH_GRADIENTS['+'],
                        }}
                      />
                    </div>
                    <span className="lab-arrow" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="lab-footer" role="contentinfo">
            <p>Concept demos — one hero moment each, not the full site.</p>
          </footer>
        </main>
      </div>
    </>
  );
}
