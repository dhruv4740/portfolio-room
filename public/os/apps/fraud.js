// ============================================================================
// public/os/apps/fraud.js — Fraud Detection Dashboard
// Rebuilt from C:\Users\hp\kharghar-hacks\kharghar
// Source commit: 31c0cd4 added model
//
// Source files:
// - kharghar/src/pages/Dashboard.tsx
// - kharghar/src/components/RiskMeter.tsx
// - kharghar/src/components/DataTable.tsx
// ============================================================================

import content from '../shell/content.js';

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    background: #0B0F19;
    color: #F1F5F9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
    overflow: hidden;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .fd-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* Top Bar */
  .fd-topbar {
    height: 44px;
    background: #0E1424;
    border-bottom: 1px solid rgba(0, 255, 157, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .fd-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fd-brand-title {
    font-size: 13px;
    font-weight: 700;
    color: #00FF9D;
    letter-spacing: 0.05em;
  }
  .fd-demo-tag {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 255, 157, 0.15);
    color: #00FF9D;
    border: 1px solid rgba(0, 255, 157, 0.4);
    letter-spacing: 0.05em;
  }
  .fd-about-btn {
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
  .fd-about-btn:hover { color: #fff; border-color: #00FF9D; }

  /* Main scroll area */
  .fd-main {
    flex: 1;
    overflow-y: auto;
    padding: 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Header Section */
  .fd-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .fd-title {
    font-size: 18px;
    font-weight: 700;
    color: #00FF9D;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fd-btn-upload {
    background: rgba(0, 255, 157, 0.15);
    border: 1px solid #00FF9D;
    color: #00FF9D;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .fd-btn-upload:hover {
    background: #00FF9D;
    color: #0B0F19;
  }

  /* Stats Grid */
  .fd-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  .fd-stat-card {
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fd-stat-card.critical { border-color: rgba(239, 68, 68, 0.4); }
  .fd-stat-title {
    font-size: 11px;
    color: #94A3B8;
    text-transform: uppercase;
  }
  .fd-stat-val {
    font-size: 24px;
    font-weight: 800;
    color: #F8FAFC;
  }
  .fd-stat-val.critical { color: #EF4444; }
  .fd-stat-val.accent { color: #00FF9D; }

  /* Filters */
  .fd-filters-row {
    display: flex;
    gap: 10px;
  }
  .fd-input {
    flex: 1;
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: #F8FAFC;
    font-size: 12px;
    outline: none;
  }
  .fd-select {
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: #F8FAFC;
    font-size: 12px;
    outline: none;
  }

  /* Table */
  .fd-table-card {
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    overflow: hidden;
  }
  .fd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .fd-table th {
    text-align: left;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    color: #94A3B8;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .fd-table td {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .fd-risk-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .fd-risk-pill.low { background: rgba(0, 255, 157, 0.15); color: #00FF9D; }
  .fd-risk-pill.medium { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
  .fd-risk-pill.high { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

  /* Modal */
  .fd-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 100;
  }
  .fd-modal {
    width: 440px;
    background: #111827;
    border: 1px solid #00FF9D;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const INITIAL_TRANSACTIONS = [
  { id: 'TX-1048', date: '2025-03-01', vendor: 'Sample CloudSecure Inc', amount: 2500, riskLevel: 'low' },
  { id: 'TX-1049', date: '2025-03-05', vendor: 'Sample Unknown Offshore Corp', amount: 15000, riskLevel: 'high' },
  { id: 'TX-1050', date: '2025-03-06', vendor: 'Sample OfficeSupply Co', amount: 450, riskLevel: 'medium' },
  { id: 'TX-1051', date: '2025-03-08', vendor: 'Sample Tech Logistics', amount: 1200, riskLevel: 'low' },
  { id: 'TX-1052', date: '2025-03-10', vendor: 'Sample Shell Advisory LLC', amount: 8400, riskLevel: 'high' },
];

export default {
  id: 'fraud',
  title: 'Fraud Detection',
  icon: '⚖️',
  width: 780,
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
    root.className = 'fd-root';
    shadow.appendChild(root);

    let transactions = [...INITIAL_TRANSACTIONS];
    let searchQuery = '';
    let riskFilter = 'all';
    let showAbout = false;
    let uploadBanner = '';

    function render() {
      const filtered = transactions.filter(tx => {
        const matchSearch = tx.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRisk = riskFilter === 'all' || tx.riskLevel === riskFilter;
        return matchSearch && matchRisk;
      });

      const highRiskCount = transactions.filter(t => t.riskLevel === 'high').length;

      root.innerHTML = `
        <!-- Top Bar -->
        <div class="fd-topbar">
          <div class="fd-brand">
            <span style="font-size:16px;">⚖️</span>
            <span class="fd-brand-title">Financial Fraud Detection Dashboard</span>
            <span class="fd-demo-tag">DEMO DATA</span>
          </div>
          <button class="fd-about-btn" id="fd-btn-about" title="About Fraud Detection">ⓘ</button>
        </div>

        <!-- Main Content -->
        <div class="fd-main">
          <!-- Header -->
          <div class="fd-header-row">
            <div class="fd-title">
              <span>Financial Dashboard</span>
              <span style="font-size:14px;color:#F59E0B;">⚠️</span>
            </div>
            <button class="fd-btn-upload" id="fd-btn-upload">
              + Simulate CSV Ingestion
            </button>
          </div>

          ${uploadBanner ? `
            <div style="padding:10px 14px;background:rgba(0,255,157,0.1);border:1px solid #00FF9D;border-radius:8px;font-size:11px;color:#00FF9D;">
              ${uploadBanner}
            </div>
          ` : ''}

          <!-- Stats Overview -->
          <div class="fd-stat-grid">
            <div class="fd-stat-card">
              <span class="fd-stat-title">Total Transactions</span>
              <span class="fd-stat-val">${transactions.length}</span>
              <span style="font-size:10px;color:#00FF9D;">↑ 12% sample volume</span>
            </div>
            <div class="fd-stat-card ${highRiskCount > 0 ? 'critical' : ''}">
              <span class="fd-stat-title">High Risk Alerts</span>
              <span class="fd-stat-val ${highRiskCount > 0 ? 'critical' : ''}">${highRiskCount}</span>
              <span style="font-size:10px;color:#EF4444;">Flagged for analyst audit</span>
            </div>
            <div class="fd-stat-card">
              <span class="fd-stat-title">Risk Meter</span>
              <span class="fd-stat-val accent">18%</span>
              <span style="font-size:10px;color:#94A3B8;">Normalized XGBoost Index</span>
            </div>
          </div>

          <!-- Filters Section -->
          <div class="fd-filters-row">
            <input
              type="text"
              id="fd-search-input"
              class="fd-input"
              placeholder="Search transactions..."
              value="${searchQuery}"
            >
            <select id="fd-risk-select" class="fd-select">
              <option value="all" ${riskFilter === 'all' ? 'selected' : ''}>All Risk Levels</option>
              <option value="high" ${riskFilter === 'high' ? 'selected' : ''}>High Risk Only</option>
              <option value="medium" ${riskFilter === 'medium' ? 'selected' : ''}>Medium Risk</option>
              <option value="low" ${riskFilter === 'low' ? 'selected' : ''}>Low Risk</option>
            </select>
          </div>

          <!-- Data Table -->
          <div class="fd-table-card">
            <table class="fd-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>DATE</th>
                  <th>VENDOR</th>
                  <th>AMOUNT</th>
                  <th>RISK LEVEL</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(tx => `
                  <tr>
                    <td style="font-family:monospace;color:#94A3B8;">${tx.id}</td>
                    <td>${tx.date}</td>
                    <td style="font-weight:600;">${tx.vendor}</td>
                    <td style="font-weight:700;">₹${tx.amount.toLocaleString()}</td>
                    <td><span class="fd-risk-pill ${tx.riskLevel}">${tx.riskLevel}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${showAbout ? renderAbout() : ''}
      `;

      attachListeners();
    }

    function renderAbout() {
      const p = content.projects.find(x => x.id === 'fraud') || {};
      return `
        <div class="fd-modal-overlay">
          <div class="fd-modal">
            <h3 style="color:#00FF9D;font-size:15px;">About Fraud Detection Dashboard</h3>
            <p style="font-size:12px;line-height:1.5;color:#E2E8F0;">${p.tagline || 'Innovathon 2025 winner.'}</p>
            <div style="font-size:11px;color:#94A3B8;line-height:1.4;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
              • <strong>Attribution & Ownership:</strong> Machine-learning fraud detection for small businesses (Innovathon 2025 winner). The XGBoost model work was a teammate's; Dhruv Kothari contributed README edits, model file integration, and the dashboard shell.<br>
              • In-browser simulation runs on sample transaction fixtures labeled as demo data.
            </div>
            <button class="fd-btn-upload" id="fd-btn-close-about" style="align-self:flex-end;">Close</button>
          </div>
        </div>
      `;
    }

    function attachListeners() {
      shadow.getElementById('fd-btn-about')?.addEventListener('click', () => {
        showAbout = true;
        render();
      });
      shadow.getElementById('fd-btn-close-about')?.addEventListener('click', () => {
        showAbout = false;
        render();
      });

      shadow.getElementById('fd-search-input')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
        const inp = shadow.getElementById('fd-search-input');
        if (inp) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }
      });

      shadow.getElementById('fd-risk-select')?.addEventListener('change', (e) => {
        riskFilter = e.target.value;
        render();
      });

      shadow.getElementById('fd-btn-upload')?.addEventListener('click', () => {
        const sampleBatch = [
          { id: `TX-${Date.now().toString().slice(-4)}`, date: 'Today', vendor: 'Sample Automated Ingestion Item', amount: 3100, riskLevel: 'low' },
        ];
        transactions = [...sampleBatch, ...transactions];
        uploadBanner = '✓ Ingested sample CSV batch (1 transaction evaluated).';
        render();
        setTimeout(() => {
          uploadBanner = '';
          render();
        }, 3000);
      });
    }

    render();

    return () => {
      root.remove();
    };
  },
};
