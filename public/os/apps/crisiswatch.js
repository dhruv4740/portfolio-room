// ============================================================================
// public/os/apps/crisiswatch.js — CrisisWatch Claim Verification & Misinformation Tracker
// Rebuilt from C:\Users\hp\AppData\Local\Temp\resume-audit\crisiswatch-web
// Source commit: 330509f Add side-by-side comparison and why false explainer UI components
//
// Source files:
// - app/components/sections/live-demo.tsx
// - app/components/sections/trending.tsx
// - app/components/ui/verdict-card.tsx
// ============================================================================

import content from '../shell/content.js';

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: #0B0B14;
    color: #F1F5F9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
    overflow: hidden;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .cw-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* Top Bar */
  .cw-topbar {
    height: 44px;
    background: rgba(15, 15, 26, 0.9);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .cw-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cw-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: linear-gradient(135deg, #A78BFA 0%, #38BDF8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cw-demo-tag {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(167, 139, 250, 0.15);
    color: #A78BFA;
    border: 1px solid rgba(167, 139, 250, 0.4);
    letter-spacing: 0.05em;
  }
  .cw-about-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #94A3B8;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cw-about-btn:hover { color: #fff; border-color: #6366F1; }

  /* Body */
  .cw-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .cw-sidebar {
    width: 170px;
    background: #0F0F1B;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 8px;
    flex-shrink: 0;
  }
  .cw-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 6px;
    color: #94A3B8;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    margin-bottom: 4px;
    transition: all 0.15s ease;
  }
  .cw-nav-btn:hover { background: rgba(255, 255, 255, 0.05); color: #F1F5F9; }
  .cw-nav-btn.active {
    background: rgba(99, 102, 241, 0.15);
    color: #A78BFA;
    font-weight: 600;
  }

  /* Main container */
  .cw-main {
    flex: 1;
    overflow-y: auto;
    padding: 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .cw-section-title {
    font-size: 18px;
    font-weight: 700;
    color: #F8FAFC;
  }
  .cw-section-subtitle {
    font-size: 11px;
    color: #94A3B8;
    margin-top: 2px;
  }

  /* Card */
  .cw-card {
    background: rgba(20, 20, 35, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Claim input */
  .cw-input-box {
    display: flex;
    gap: 8px;
  }
  .cw-input {
    flex: 1;
    background: rgba(10, 10, 20, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    padding: 10px 14px;
    color: #F8FAFC;
    font-size: 12px;
    outline: none;
  }
  .cw-btn {
    background: #6366F1;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }
  .cw-btn:hover { background: #4F46E5; }
  .cw-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Presets */
  .cw-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cw-preset-chip {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94A3B8;
    font-size: 10px;
    cursor: pointer;
  }
  .cw-preset-chip:hover { border-color: #6366F1; color: #E2E8F0; }

  /* Progress Stepper */
  .cw-stepper {
    display: flex;
    gap: 8px;
    margin: 8px 0;
  }
  .cw-step {
    flex: 1;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 10px;
    color: #64748B;
  }
  .cw-step.active {
    border-color: #6366F1;
    color: #A78BFA;
    background: rgba(99, 102, 241, 0.08);
  }
  .cw-step.done {
    border-color: #10B981;
    color: #10B981;
    background: rgba(16, 185, 129, 0.08);
  }

  /* Verdict Card */
  .cw-verdict-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cw-verdict-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cw-verdict-pill {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
    border: 1px solid rgba(239, 68, 68, 0.4);
  }
  .cw-confidence {
    font-size: 12px;
    font-weight: 700;
    color: #38BDF8;
  }
  .cw-why-false {
    background: rgba(239, 68, 68, 0.06);
    border-left: 3px solid #EF4444;
    padding: 10px 12px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 1.4;
    color: #CBD5E1;
  }
  .cw-sources-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 11px;
  }
  .cw-source-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 4px;
    color: #94A3B8;
  }

  /* Trending items */
  .cw-trending-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .cw-trend-item {
    background: rgba(20, 20, 35, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cw-trend-cat {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    color: #38BDF8;
  }
  .cw-trend-claim {
    font-size: 12px;
    font-weight: 600;
    color: #F8FAFC;
    line-height: 1.3;
  }
  .cw-trend-verdict {
    font-size: 10px;
    font-weight: 700;
    color: #EF4444;
  }

  /* About Modal */
  .cw-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 100;
  }
  .cw-modal {
    width: 440px;
    background: #0F0F1E;
    border: 1px solid #6366F1;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const SAMPLE_CLAIMS = [
  'WHO declares global emergency over new virus strain',
  'Government announces ban on 500 rupee currency notes',
  'Major city drinking water contaminated with chemicals',
];

const TRENDING_ITEMS = [
  { cat: 'Health / Emergency', claim: 'WHO declares global emergency over new virus strain', status: 'DEBUNKED', summary: 'Official WHO bulletins contain zero emergency declarations. Claim traces to clickbait domain.' },
  { cat: 'Financial / Policy', claim: 'Government announces ban on 500 rupee notes from next month', status: 'FALSE', summary: 'RBI has issued no withdrawal notification. Currency remains fully legal tender.' },
  { cat: 'Public Safety', claim: 'Power grid shutdown scheduled across 3 states tonight', status: 'FABRICATED', summary: 'National Load Despatch Centre reports normal frequency with no scheduled outages.' },
  { cat: 'Telecom / 5G', claim: '5G towers emitting harmful localized radiation spikes', status: 'DISPROVEN', summary: 'DoT compliance audits show emissions well below safe ICNIRP threshold levels.' },
];

export default {
  id: 'crisiswatch',
  title: 'CrisisWatch',
  icon: '🔍',
  width: 800,
  height: 520,

  mount(body, ctx) {
    const host = document.createElement('div');
    host.style.cssText = 'width:100%;height:100%;';
    body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'cw-root';
    shadow.appendChild(root);

    let activeNav = 'check'; // check | trending | architecture
    let claimText = SAMPLE_CLAIMS[0];
    let isVerifying = false;
    let verifyStep = 0;
    let verdictResult = null;
    let showAbout = false;
    let stepTimer = null;

    function runVerification(claim) {
      isVerifying = true;
      verifyStep = 1;
      verdictResult = null;
      render();

      stepTimer = setTimeout(() => {
        verifyStep = 2;
        render();

        stepTimer = setTimeout(() => {
          verifyStep = 3;
          render();

          stepTimer = setTimeout(() => {
            isVerifying = false;
            verifyStep = 4;
            verdictResult = {
              verdict: 'FALSE',
              confidence: '88% Confidence',
              whyFalse: 'No verified health ministry or international health agency has issued this warning. Official WHO releases confirm regular surveillance protocols only.',
              sources: [
                { name: 'World Health Organization (WHO) Newsroom', status: 'Clean — No notice found' },
                { name: 'Ministry of Health & Family Welfare', status: 'Debunked official press release' },
                { name: 'FactCheck Central Repository', status: 'Flagged as recurrent rumor' },
              ],
            };
            render();
          }, 600);
        }, 600);
      }, 600);
    }

    function render() {
      root.innerHTML = `
        <!-- Top Bar -->
        <div class="cw-topbar">
          <div class="cw-brand">
            <span style="font-size:16px;">🔍</span>
            <span class="cw-title">CrisisWatch Claim Verification</span>
            <span class="cw-demo-tag">DEMO DATA</span>
          </div>
          <button class="cw-about-btn" id="cw-btn-about" title="About CrisisWatch">ⓘ</button>
        </div>

        <!-- Body -->
        <div class="cw-body">
          <div class="cw-sidebar">
            <div>
              <button class="cw-nav-btn ${activeNav === 'check' ? 'active' : ''}" data-nav="check">
                <span>⚡</span> Claim Verification
              </button>
              <button class="cw-nav-btn ${activeNav === 'trending' ? 'active' : ''}" data-nav="trending">
                <span>🔥</span> Trending Claims
              </button>
              <button class="cw-nav-btn ${activeNav === 'architecture' ? 'active' : ''}" data-nav="architecture">
                <span>📐</span> LangGraph Pipeline
              </button>
            </div>
            <div style="font-size:9px;color:#94A3B8;padding:8px 4px;border-top:1px solid rgba(255,255,255,0.06);">
              Built at MumbaiHacks<br>
              Structured Evidence Engine
            </div>
          </div>

          <div class="cw-main">
            ${renderMain()}
          </div>
        </div>

        ${showAbout ? renderAbout() : ''}
      `;

      attachListeners();
    }

    function renderMain() {
      if (activeNav === 'check') {
        return `
          <div>
            <h1 class="cw-section-title">Claim Verification</h1>
            <p class="cw-section-subtitle">AI-assisted claim checking with structured verdicts and evidence synthesis.</p>
          </div>

          <div class="cw-card">
            <div class="cw-input-box">
              <input type="text" id="cw-claim-input" class="cw-input" value="${claimText}" placeholder="Enter a claim to fact check...">
              <button class="cw-btn" id="cw-btn-verify" ${isVerifying ? 'disabled' : ''}>
                ${isVerifying ? 'Verifying...' : 'Verify Claim'}
              </button>
            </div>

            <div class="cw-presets">
              <span style="font-size:10px;color:#64748B;align-self:center;">Try sample claim:</span>
              ${SAMPLE_CLAIMS.map((c, i) => `
                <button class="cw-preset-chip" data-preset="${i}">${c.slice(0, 36)}...</button>
              `).join('')}
            </div>

            ${(isVerifying || verifyStep > 0) ? `
              <div class="cw-stepper">
                <div class="cw-step ${verifyStep === 1 ? 'active' : verifyStep > 1 ? 'done' : ''}">
                  1. Claim Extraction
                </div>
                <div class="cw-step ${verifyStep === 2 ? 'active' : verifyStep > 2 ? 'done' : ''}">
                  2. Source Retrieval
                </div>
                <div class="cw-step ${verifyStep === 3 ? 'active' : verifyStep > 3 ? 'done' : ''}">
                  3. Evidence Synthesis
                </div>
              </div>
            ` : ''}
          </div>

          ${verdictResult ? `
            <div class="cw-verdict-card">
              <div class="cw-verdict-header">
                <span class="cw-verdict-pill">VERDICT: ${verdictResult.verdict}</span>
                <span class="cw-confidence">${verdictResult.confidence}</span>
              </div>

              <div>
                <h4 style="font-size:12px;font-weight:700;color:#F8FAFC;margin-bottom:4px;">Why False</h4>
                <div class="cw-why-false">
                  ${verdictResult.whyFalse}
                </div>
              </div>

              <div>
                <h4 style="font-size:11px;font-weight:600;color:#94A3B8;margin-bottom:6px;">Verified Sources &amp; Evidence</h4>
                <div class="cw-sources-list">
                  ${verdictResult.sources.map(s => `
                    <div class="cw-source-item">
                      <span style="font-weight:600;color:#F1F5F9;">${s.name}</span>
                      <span>${s.status}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        `;
      }

      if (activeNav === 'trending') {
        return `
          <div>
            <h1 class="cw-section-title">Trending Claims</h1>
            <p class="cw-section-subtitle">Real-time misinformation tracker monitoring social feeds and WhatsApp forwards.</p>
          </div>

          <div class="cw-trending-grid">
            ${TRENDING_ITEMS.map(item => `
              <div class="cw-trend-item">
                <span class="cw-trend-cat">${item.cat}</span>
                <div class="cw-trend-claim">${item.claim}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                  <span class="cw-trend-verdict">${item.status}</span>
                  <button class="cw-btn" style="padding:3px 8px;font-size:10px;" data-check-trend="${item.claim}">Verify</button>
                </div>
                <p style="font-size:10px;color:#94A3B8;line-height:1.3;margin-top:4px;">${item.summary}</p>
              </div>
            `).join('')}
          </div>
        `;
      }

      if (activeNav === 'architecture') {
        return `
          <div>
            <h1 class="cw-section-title">LangGraph Architecture</h1>
            <p class="cw-section-subtitle">State machine flow powering deterministic fact-check reasoning.</p>
          </div>

          <div class="cw-card">
            <h3 style="font-size:13px;color:#A78BFA;">Structured Verification Graph</h3>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:11px;color:#CBD5E1;line-height:1.4;">
              <div><strong>1. Claim Normalizer:</strong> De-noises social media syntax, emoji patterns, and extractable core assertions.</div>
              <div><strong>2. Parallel Tool Retrieval:</strong> Dispatches queries to NewsAPI, Tavily search, Wikipedia, and Google Fact Check APIs in parallel.</div>
              <div><strong>3. Reliability &amp; Stance Scoring:</strong> Ranks source authority and maps contradictory vs corroborating reports.</div>
              <div><strong>4. Structured Verdict Generator:</strong> Emits strict JSON verdict schemas rather than arbitrary unstructured text.</div>
            </div>
          </div>
        `;
      }

      return '';
    }

    function renderAbout() {
      const p = content.projects.find(x => x.id === 'crisiswatch') || {};
      return `
        <div class="cw-modal-overlay">
          <div class="cw-modal">
            <h3 style="color:#A78BFA;font-size:15px;">About CrisisWatch</h3>
            <p style="font-size:12px;line-height:1.5;color:#E2E8F0;">${p.tagline || 'Claim verification for a misinformation-heavy feed.'}</p>
            <div style="font-size:11px;color:#94A3B8;line-height:1.4;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
              • Built by Dhruv Kothari at MumbaiHacks.<br>
              • Built on LangGraph with structured JSON verdicts and modular verification tools.<br>
              • Offline simulation running on local fixtures with demo data.
            </div>
            <button class="cw-btn" id="cw-btn-close-about" style="align-self:flex-end;">Close</button>
          </div>
        </div>
      `;
    }

    function attachListeners() {
      shadow.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeNav = btn.getAttribute('data-nav');
          render();
        });
      });

      shadow.getElementById('cw-btn-about')?.addEventListener('click', () => {
        showAbout = true;
        render();
      });
      shadow.getElementById('cw-btn-close-about')?.addEventListener('click', () => {
        showAbout = false;
        render();
      });

      shadow.getElementById('cw-btn-verify')?.addEventListener('click', () => {
        const inp = shadow.getElementById('cw-claim-input');
        if (inp?.value) {
          claimText = inp.value;
          runVerification(claimText);
        }
      });

      shadow.querySelectorAll('[data-preset]').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-preset'), 10);
          claimText = SAMPLE_CLAIMS[idx];
          runVerification(claimText);
        });
      });

      shadow.querySelectorAll('[data-check-trend]').forEach(b => {
        b.addEventListener('click', () => {
          claimText = b.getAttribute('data-check-trend');
          activeNav = 'check';
          runVerification(claimText);
        });
      });
    }

    render();

    return () => {
      if (stepTimer) clearTimeout(stepTimer);
      root.remove();
    };
  },
};
