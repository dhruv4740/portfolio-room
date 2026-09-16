// ============================================================================
// public/os/apps/darksentinel.js — DarkSentinel Threat Monitoring Dashboard
// Rebuilt from C:\Users\hp\OneDrive\Documents\demo_website\darksentinel-ui
// Source commit: d5821bf Clean realtime UI text: remove emojis and corrupted characters
//
// Source files:
// - app/MissionControl.tsx
// - app/pipeline/page.tsx
// - app/threats/page.tsx
// - lib/constants.ts
// ============================================================================

import content from '../shell/content.js';

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: #080E0C;
    color: #E2E8F0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    user-select: none;
    box-sizing: border-box;
    overflow: hidden;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ds-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* Command Bar */
  .ds-commandbar {
    height: 44px;
    background: #0C1613;
    border-bottom: 1px solid rgba(0, 229, 160, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .ds-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ds-brand-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #00E5A0;
    text-transform: uppercase;
  }
  .ds-demo-tag {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 229, 160, 0.15);
    color: #00E5A0;
    border: 1px solid rgba(0, 229, 160, 0.4);
    letter-spacing: 0.05em;
  }
  .ds-threat-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(255, 45, 85, 0.2);
    color: #FF2D55;
    border: 1px solid rgba(255, 45, 85, 0.4);
  }
  .ds-about-btn {
    background: none;
    border: 1px solid rgba(0, 229, 160, 0.3);
    color: #7A9B8C;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ds-about-btn:hover { color: #00E5A0; border-color: #00E5A0; }

  /* Body */
  .ds-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .ds-navrail {
    width: 170px;
    background: #091310;
    border-right: 1px solid rgba(0, 229, 160, 0.15);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 8px;
    flex-shrink: 0;
  }
  .ds-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 6px;
    color: #7A9B8C;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    margin-bottom: 4px;
  }
  .ds-nav-btn:hover { background: rgba(0, 229, 160, 0.05); color: #E2E8F0; }
  .ds-nav-btn.active {
    background: rgba(0, 229, 160, 0.12);
    color: #00E5A0;
    font-weight: 600;
    border-left: 2px solid #00E5A0;
  }

  /* Main panel */
  .ds-main {
    flex: 1;
    overflow-y: auto;
    padding: 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Stat cards */
  .ds-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .ds-stat-card {
    background: #0F1F1A;
    border: 1px solid rgba(0, 229, 160, 0.15);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ds-stat-card.critical { border-color: rgba(255, 45, 85, 0.35); }
  .ds-stat-lbl {
    font-size: 10px;
    color: #7A9B8C;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .ds-stat-val {
    font-size: 22px;
    font-weight: 700;
    color: #E2E8F0;
  }
  .ds-stat-val.critical { color: #FF2D55; }

  /* Tactical panel */
  .ds-panel {
    background: #0D1C17;
    border: 1px solid rgba(0, 229, 160, 0.15);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ds-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 229, 160, 0.1);
    padding-bottom: 8px;
  }
  .ds-panel-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #00E5A0;
    text-transform: uppercase;
  }

  /* Threat table */
  .ds-threat-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .ds-threat-table th {
    text-align: left;
    padding: 6px 8px;
    color: #7A9B8C;
    font-weight: 600;
    border-bottom: 1px solid rgba(0, 229, 160, 0.1);
  }
  .ds-threat-table td {
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .ds-pill {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .ds-pill.critical { background: rgba(255, 45, 85, 0.2); color: #FF2D55; }
  .ds-pill.high { background: rgba(255, 149, 0, 0.2); color: #FF9500; }
  .ds-pill.medium { background: rgba(255, 204, 0, 0.2); color: #FFCC00; }
  .ds-pill.low { background: rgba(48, 209, 88, 0.2); color: #30D158; }

  /* Pipeline stages */
  .ds-pipeline-stages {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ds-stage-item {
    background: #091310;
    border: 1px solid rgba(0, 229, 160, 0.1);
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ds-stage-item.highlight {
    border-color: rgba(0, 229, 160, 0.4);
    background: rgba(0, 229, 160, 0.05);
  }
  .ds-stage-name {
    font-size: 12px;
    font-weight: 600;
    color: #E2E8F0;
  }
  .ds-stage-desc {
    font-size: 10px;
    color: #7A9B8C;
    margin-top: 2px;
  }
  .ds-btn {
    background: #00E5A0;
    color: #080E0C;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .ds-btn:hover { background: #00FFB2; }

  /* Modal */
  .ds-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 100;
  }
  .ds-modal {
    width: 440px;
    background: #0C1613;
    border: 1px solid #00E5A0;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const INITIAL_THREATS = [
  { hash: 'e4a19b8', category: 'drugs', score: 0.92, severity: 'critical', summary: 'Sample marketplace listings on darknet relay' },
  { hash: '7c82d41', category: 'stolen_data', score: 0.72, severity: 'high', summary: 'Uncertain-zone RF score (0.72) -> Claude API evaluated' },
  { hash: '3f901a5', category: 'malware', score: 0.65, severity: 'high', summary: 'Uncertain-zone RF score (0.65) -> Claude API evaluated' },
  { hash: 'b1192e0', category: 'weapons', score: 0.88, severity: 'critical', summary: 'Sample illicit weapon distribution channel' },
  { hash: '6d45e73', category: 'hacking', score: 0.44, severity: 'medium', summary: 'Public exploit script discussion (bounded low risk)' },
];

export default {
  id: 'darksentinel',
  title: 'DarkSentinel',
  icon: '⚡',
  width: 820,
  height: 540,

  mount(body, ctx) {
    const host = document.createElement('div');
    host.style.cssText = 'width:100%;height:100%;';
    body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'ds-root';
    shadow.appendChild(root);

    let activeNav = 'mission'; // mission | pipeline | threats | system
    let showAbout = false;
    let scanRunning = false;
    let scanStep = 0;
    let scanInterval = null;

    function render() {
      root.innerHTML = `
        <!-- Top Command Bar -->
        <div class="ds-commandbar">
          <div class="ds-brand">
            <span style="font-size:16px;">⚡</span>
            <span class="ds-brand-title">DarkSentinel Threat Monitor</span>
            <span class="ds-demo-tag">DEMO DATA</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="ds-threat-badge">DEFCON 2 · CRITICAL</span>
            <button class="ds-about-btn" id="ds-btn-about" title="About DarkSentinel">ⓘ</button>
          </div>
        </div>

        <!-- Body Layout -->
        <div class="ds-body">
          <div class="ds-navrail">
            <div>
              <button class="ds-nav-btn ${activeNav === 'mission' ? 'active' : ''}" data-nav="mission">
                <span>🛡️</span> Mission Control
              </button>
              <button class="ds-nav-btn ${activeNav === 'pipeline' ? 'active' : ''}" data-nav="pipeline">
                <span>⚙️</span> Pipeline Monitor
              </button>
              <button class="ds-nav-btn ${activeNav === 'threats' ? 'active' : ''}" data-nav="threats">
                <span>👁️</span> Threat Feed
              </button>
              <button class="ds-nav-btn ${activeNav === 'system' ? 'active' : ''}" data-nav="system">
                <span>📊</span> System Health
              </button>
            </div>
            <div style="font-size:9px;color:#7A9B8C;line-height:1.4;padding:8px 4px;border-top:1px solid rgba(0,229,160,0.1);">
              RF + RoBERTa + Claude<br>
              Uncertain-zone trigger: Active
            </div>
          </div>

          <div class="ds-main">
            ${renderMain()}
          </div>
        </div>

        ${showAbout ? renderAbout() : ''}
      `;

      attachListeners();
    }

    function renderMain() {
      if (activeNav === 'mission') {
        return `
          <div class="ds-stat-grid">
            <div class="ds-stat-card">
              <span class="ds-stat-lbl">Total Threats</span>
              <span class="ds-stat-val">42</span>
            </div>
            <div class="ds-stat-card critical">
              <span class="ds-stat-lbl">Critical Alerts</span>
              <span class="ds-stat-val critical">7</span>
            </div>
            <div class="ds-stat-card">
              <span class="ds-stat-lbl">Active Services</span>
              <span class="ds-stat-val">6/6</span>
            </div>
            <div class="ds-stat-card">
              <span class="ds-stat-lbl">Scans Today</span>
              <span class="ds-stat-val">15</span>
            </div>
          </div>

          <div class="ds-panel">
            <div class="ds-panel-header">
              <span class="ds-panel-title">Recent Threats</span>
              <span style="font-size:10px;color:#7A9B8C;">Filtered by Risk Score</span>
            </div>
            <table class="ds-threat-table">
              <thead>
                <tr>
                  <th>HASH</th>
                  <th>CATEGORY</th>
                  <th>RISK SCORE</th>
                  <th>SEVERITY</th>
                  <th>ANALYSIS</th>
                </tr>
              </thead>
              <tbody>
                ${INITIAL_THREATS.map(t => `
                  <tr>
                    <td style="font-family:monospace;color:#00E5A0;">${t.hash}</td>
                    <td>${t.category}</td>
                    <td style="font-weight:700;">${t.score}</td>
                    <td><span class="ds-pill ${t.severity}">${t.severity}</span></td>
                    <td style="color:#A0AEC0;">${t.summary}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      if (activeNav === 'pipeline') {
        return `
          <div class="ds-panel">
            <div class="ds-panel-header">
              <div>
                <span class="ds-panel-title">Pipeline Monitor</span>
                <span style="font-size:10px;color:#7A9B8C;margin-left:8px;">
                  Scan ID: ${scanRunning ? 'scan-live-904' : 'idle'}
                </span>
              </div>
              <button class="ds-btn" id="ds-btn-trigger-scan" ${scanRunning ? 'disabled' : ''}>
                ${scanRunning ? 'Scanning...' : 'New Scan'}
              </button>
            </div>

            <div style="font-size:11px;color:#A0AEC0;line-height:1.4;">
              Demonstrates Dhruv's architecture: CICFlowMeter Random Forest model scores Tor traffic. When scores fall in the <strong>uncertain zone (0.55 to 0.75)</strong>, the Claude API triggers with a 60-second cooldown to classify ambiguous threats without unbounded token expense.
            </div>

            <div class="ds-pipeline-stages">
              <div class="ds-stage-item ${scanRunning && scanStep >= 1 ? 'highlight' : ''}">
                <div>
                  <div class="ds-stage-name">Stage 1: Tor Traffic Collection &amp; Ingestion</div>
                  <div class="ds-stage-desc">CICFlowMeter extracts 83 network flow features</div>
                </div>
                <span class="ds-pill ${scanRunning && scanStep >= 1 ? 'high' : 'low'}">${scanRunning && scanStep >= 1 ? 'ACTIVE' : 'READY'}</span>
              </div>

              <div class="ds-stage-item ${scanRunning && scanStep >= 2 ? 'highlight' : ''}">
                <div>
                  <div class="ds-stage-name">Stage 2: Random Forest Binary Classifier</div>
                  <div class="ds-stage-desc">Evaluates Tor flow probability score</div>
                </div>
                <span class="ds-pill ${scanRunning && scanStep >= 2 ? 'high' : 'low'}">${scanRunning && scanStep >= 2 ? 'SCORING' : 'READY'}</span>
              </div>

              <div class="ds-stage-item highlight" style="border: 1px solid #00E5A0;">
                <div>
                  <div class="ds-stage-name" style="color:#00E5A0;">Stage 3: Uncertain-Zone Claude Call (0.55 - 0.75)</div>
                  <div class="ds-stage-desc">
                    Fires only when Random Forest is unsure. 60s cooldown bounds paid model cost.
                  </div>
                </div>
                <span class="ds-pill ${scanRunning && scanStep >= 3 ? 'critical' : 'high'}">
                  ${scanRunning && scanStep >= 3 ? 'CALLING CLAUDE' : 'ARMED'}
                </span>
              </div>

              <div class="ds-stage-item ${scanRunning && scanStep >= 4 ? 'highlight' : ''}">
                <div>
                  <div class="ds-stage-name">Stage 4: Threat Synthesis &amp; Alert Routing</div>
                  <div class="ds-stage-desc">RoBERTa secondary classifier and risk aggregation</div>
                </div>
                <span class="ds-pill ${scanRunning && scanStep >= 4 ? 'high' : 'low'}">${scanRunning && scanStep >= 4 ? 'ROUTING' : 'READY'}</span>
              </div>
            </div>
          </div>
        `;
      }

      if (activeNav === 'threats') {
        return `
          <div class="ds-panel">
            <div class="ds-panel-header">
              <span class="ds-panel-title">Threat Feed</span>
              <span style="font-size:10px;color:#7A9B8C;">All Flagged Darknet Relays</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${INITIAL_THREATS.map(t => `
                <div style="background:#091310;border:1px solid rgba(0,229,160,0.12);border-radius:6px;padding:12px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="display:flex;gap:8px;align-items:center;">
                      <span style="font-family:monospace;color:#00E5A0;font-size:12px;">#${t.hash}</span>
                      <span class="ds-pill ${t.severity}">${t.severity}</span>
                      <span style="font-size:11px;color:#7A9B8C;text-transform:uppercase;">${t.category}</span>
                    </div>
                    <div style="font-size:11px;color:#E2E8F0;margin-top:4px;">${t.summary}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:14px;font-weight:700;color:${t.severity === 'critical' ? '#FF2D55' : '#FF9500'};">${t.score}</div>
                    <div style="font-size:9px;color:#7A9B8C;">RISK INDEX</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (activeNav === 'system') {
        return `
          <div class="ds-panel">
            <div class="ds-panel-header">
              <span class="ds-panel-title">Service Health &amp; Subsystems</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${[
                { name: 'CICFlowMeter Ingestion Daemon', status: 'online', lat: '12ms' },
                { name: 'Tor SOCKS5 Proxy Service', status: 'online', lat: '45ms' },
                { name: 'Random Forest Inference Engine', status: 'online', lat: '8ms' },
                { name: 'RoBERTa Text Classifier', status: 'online', lat: '32ms' },
                { name: 'Claude API Gateway (Uncertain-Zone)', status: 'online', lat: '620ms' },
                { name: 'Alert Dispatch & Notification Queue', status: 'online', lat: '15ms' },
              ].map(s => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#091310;border-radius:6px;border:1px solid rgba(0,229,160,0.1);">
                  <div>
                    <div style="font-size:12px;font-weight:600;">${s.name}</div>
                    <div style="font-size:10px;color:#7A9B8C;">Latency: ${s.lat}</div>
                  </div>
                  <span class="ds-pill low">ONLINE</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      return '';
    }

    function renderAbout() {
      const p = content.projects.find(x => x.id === 'darksentinel') || {};
      return `
        <div class="ds-modal-overlay">
          <div class="ds-modal">
            <h3 style="color:#00E5A0;font-size:15px;text-transform:uppercase;">About DarkSentinel</h3>
            <p style="font-size:12px;line-height:1.5;color:#E2E8F0;">${p.tagline || 'Darknet threat monitoring. Hackathon finalist.'}</p>
            <div style="font-size:11px;color:#7A9B8C;line-height:1.4;border-top:1px solid rgba(0,229,160,0.2);padding-top:8px;">
              • <strong>Attribution & Ownership:</strong> Team project for Secure AI Systems & Software Hackathon (BITS Goa x IIT Madras finalist). Deven owned model training, LLM prompts and Tor capture; Dhruv Kothari built the dashboards, API features, and the uncertain-zone Claude call.<br>
              • Running in-browser on simulated threat fixtures with demo data.
            </div>
            <button class="ds-btn" id="ds-btn-close-about" style="align-self:flex-end;">Close</button>
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

      shadow.getElementById('ds-btn-about')?.addEventListener('click', () => {
        showAbout = true;
        render();
      });
      shadow.getElementById('ds-btn-close-about')?.addEventListener('click', () => {
        showAbout = false;
        render();
      });

      shadow.getElementById('ds-btn-trigger-scan')?.addEventListener('click', () => {
        scanRunning = true;
        scanStep = 1;
        render();
        if (scanInterval) clearInterval(scanInterval);
        scanInterval = setInterval(() => {
          scanStep++;
          if (scanStep > 4) {
            scanRunning = false;
            clearInterval(scanInterval);
          }
          render();
        }, 1200);
      });
    }

    render();

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      root.remove();
    };
  },
};
