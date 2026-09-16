// ============================================================================
// public/os/apps/focuslock.js — FocusLock Windows Agent Dashboard
// Rebuilt from C:\Users\hp\OneDrive\Desktop\new-focuslock\windows-agent
// Source commit: 9a13ab4 chore(android): bump version to 0.7.1 (versionCode 10)
//
// Source files:
// - windows-agent/src/index.html
// - windows-agent/src/renderer.js
// - windows-agent/src/index.css
// ============================================================================

import content from '../shell/content.js';

const CSS = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: radial-gradient(circle at top left, #0d111d 0%, #05070c 100%);
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    box-sizing: border-box;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .fl-win-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* Header / Sub-titlebar */
  .fl-topbar {
    height: 42px;
    background: rgba(10, 15, 30, 0.85);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
  }
  .fl-logo-box {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .fl-logo-title {
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    color: #f8fafc;
  }
  .fl-demo-tag {
    font-size: 9px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(99, 102, 241, 0.2);
    color: #a78bfa;
    border: 1px solid rgba(99, 102, 241, 0.4);
    letter-spacing: 0.05em;
  }
  .fl-about-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #94a3b8;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fl-about-btn:hover { color: #fff; border-color: #6366f1; }

  /* Body container with Sidebar and Main */
  .fl-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  .fl-sidebar {
    width: 180px;
    background: rgba(10, 15, 30, 0.6);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 8px;
    flex-shrink: 0;
  }
  .fl-nav-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .fl-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }
  .fl-nav-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }
  .fl-nav-btn.active {
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    font-weight: 600;
  }
  .fl-sidebar-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 10px;
    color: #10b981;
  }
  .fl-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }

  /* Main Content Area */
  .fl-main {
    flex: 1;
    overflow-y: auto;
    padding: 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .fl-panel-title {
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
  }

  .fl-card-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 16px;
  }
  .fl-card {
    background: rgba(17, 24, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
  }
  .fl-card h3 {
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 4px;
  }
  .fl-status-desc {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Focus Card */
  .fl-timer-box {
    margin: 12px 0;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    text-align: center;
  }
  .fl-countdown {
    font-size: 20px;
    font-weight: 700;
    color: #6366f1;
  }
  .fl-chips-row {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  .fl-chip {
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 11px;
    cursor: pointer;
  }
  .fl-chip.active {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
    font-weight: 600;
  }
  .fl-btn-primary {
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .fl-btn-primary:hover { background: #4f46e5; }
  .fl-btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    cursor: pointer;
  }

  /* Streak Card */
  .fl-streak-box {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 14px 0 8px;
  }
  .fl-streak-num {
    font-size: 32px;
    font-weight: 800;
    color: #f59e0b;
  }
  .fl-streak-lbl {
    font-size: 12px;
    color: #94a3b8;
  }
  .fl-streak-meta {
    font-size: 11px;
    color: #64748b;
  }

  /* Distraction Insights */
  .fl-insights-grid {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 16px;
    margin-top: 12px;
  }
  .fl-stat-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    padding-right: 12px;
  }
  .fl-stat-num {
    font-size: 22px;
    font-weight: 700;
    color: #f8fafc;
  }
  .fl-stat-lbl {
    font-size: 10px;
    color: #94a3b8;
  }
  .fl-bars-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
  }
  .fl-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .fl-bar-track {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
  }
  .fl-bar-fill {
    height: 100%;
    background: #6366f1;
    border-radius: 3px;
  }

  /* Rule inputs & Lists */
  .fl-inputs-row {
    display: flex;
    gap: 8px;
    margin: 14px 0;
  }
  .fl-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px 12px;
    color: #f8fafc;
    font-size: 12px;
    outline: none;
  }
  .fl-select {
    background: rgba(17, 24, 39, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    color: #f8fafc;
    font-size: 12px;
    outline: none;
  }
  .fl-rules-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .fl-rule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 6px;
    font-size: 12px;
  }
  .fl-rule-del {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 13px;
  }

  /* Info Banner */
  .fl-info-banner {
    display: flex;
    gap: 10px;
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 10px;
    padding: 12px;
    font-size: 11px;
    line-height: 1.4;
  }
  .fl-info-banner h4 { font-size: 12px; color: #a78bfa; margin-bottom: 2px; }

  /* About Modal */
  .fl-modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 100;
  }
  .fl-modal {
    width: 440px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  }
`;

export default {
  id: 'focuslock',
  title: 'FocusLock',
  icon: '🛡️',
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
    root.className = 'fl-win-root';
    shadow.appendChild(root);

    // State
    let activeTab = 'tab-dashboard';
    let focusDuration = 25;
    let focusActive = false;
    let countdownSec = 0;
    let timerInterval = null;

    let blockedDomains = ['instagram.com', 'youtube.com/shorts', 'reddit.com/r/all'];
    let blockedApps = ['steam.exe', 'discord.exe'];
    let todos = [
      { id: 1, text: 'Review algorithmic proofs', done: false },
      { id: 2, text: 'Clean inbox before deep work', done: true },
    ];
    let syncCode = 'dhruv-01';
    let dailyLimit = 60;
    let showAbout = false;

    function render() {
      root.innerHTML = `
        <!-- Top Bar -->
        <div class="fl-topbar">
          <div class="fl-logo-box">
            <span style="font-size:16px;">🛡️</span>
            <span class="fl-logo-title">FocusLock Desktop Dashboard</span>
            <span class="fl-demo-tag">DEMO DATA</span>
          </div>
          <button class="fl-about-btn" id="btn-about" title="About FocusLock">ⓘ</button>
        </div>

        <!-- Body with Sidebar and Main -->
        <div class="fl-body">
          <div class="fl-sidebar">
            <div class="fl-nav-items">
              <button class="fl-nav-btn ${activeTab === 'tab-dashboard' ? 'active' : ''}" data-tab="tab-dashboard">
                <span>📊</span> Dashboard
              </button>
              <button class="fl-nav-btn ${activeTab === 'tab-rules' ? 'active' : ''}" data-tab="tab-rules">
                <span>🛡️</span> Blocked Rules
              </button>
              <button class="fl-nav-btn ${activeTab === 'tab-todos' ? 'active' : ''}" data-tab="tab-todos">
                <span>✅</span> Shared Tasks
              </button>
              <button class="fl-nav-btn ${activeTab === 'tab-settings' ? 'active' : ''}" data-tab="tab-settings">
                <span>⚙️</span> Settings
              </button>
            </div>
            <div class="fl-sidebar-footer">
              <span class="fl-status-dot"></span>
              <span>Agent Active</span>
            </div>
          </div>

          <div class="fl-main">
            ${renderTabContent()}
          </div>
        </div>

        ${showAbout ? renderAboutModal() : ''}
      `;

      attachListeners();
    }

    function renderTabContent() {
      if (activeTab === 'tab-dashboard') {
        return `
          <h1 class="fl-panel-title">Overview</h1>
          <div class="fl-card-grid">
            <!-- Focus Session Card -->
            <div class="fl-card">
              <h3>Active Focus Protection</h3>
              <p class="fl-status-desc">System-wide monitoring is running in the background.</p>
              <div class="fl-timer-box">
                <span class="fl-countdown" id="fl-countdown-text">
                  ${focusActive ? formatTime(countdownSec) : 'Focus Inactive'}
                </span>
              </div>
              <div class="fl-chips-row">
                <button class="fl-chip ${focusDuration === 25 ? 'active' : ''}" data-mins="25">25 min</button>
                <button class="fl-chip ${focusDuration === 45 ? 'active' : ''}" data-mins="45">45 min</button>
                <button class="fl-chip ${focusDuration === 90 ? 'active' : ''}" data-mins="90">90 min</button>
              </div>
              <div>
                ${focusActive
                  ? `<button class="fl-btn-secondary" id="btn-stop-focus">Stop Focus</button>`
                  : `<button class="fl-btn-primary" id="btn-start-focus">Start Focus</button>`
                }
              </div>
            </div>

            <!-- Streak Card -->
            <div class="fl-card">
              <h3>🔥 Focus Streak</h3>
              <p class="fl-status-desc">Days under your daily limit in a row.</p>
              <div class="fl-streak-box">
                <span class="fl-streak-num">14</span>
                <span class="fl-streak-lbl">day streak</span>
              </div>
              <div class="fl-streak-meta">Best: <strong>21</strong> days</div>
            </div>
          </div>

          <!-- Distraction Insights -->
          <div class="fl-card">
            <h3>📊 Distraction Insights</h3>
            <p class="fl-status-desc">Today's usage time and blocked apps.</p>
            <div class="fl-insights-grid">
              <div class="fl-stat-box">
                <div>
                  <div class="fl-stat-num">18</div>
                  <div class="fl-stat-lbl">Min Spent Today</div>
                </div>
                <div>
                  <div class="fl-stat-num">${todos.filter(t => t.done).length}</div>
                  <div class="fl-stat-lbl">Tasks Completed</div>
                </div>
              </div>
              <div class="fl-bars-list">
                <div class="fl-bar-row">
                  <span style="width:90px;">instagram.com</span>
                  <div class="fl-bar-track"><div class="fl-bar-fill" style="width: 45%;"></div></div>
                  <span>10m</span>
                </div>
                <div class="fl-bar-row">
                  <span style="width:90px;">youtube.com</span>
                  <div class="fl-bar-track"><div class="fl-bar-fill" style="width: 25%;"></div></div>
                  <span>5m</span>
                </div>
                <div class="fl-bar-row">
                  <span style="width:90px;">steam.exe</span>
                  <div class="fl-bar-track"><div class="fl-bar-fill" style="width: 15%;"></div></div>
                  <span>3m</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Banner -->
          <div class="fl-info-banner">
            <span style="font-size:16px;">ℹ️</span>
            <div>
              <h4>No Extension Required</h4>
              <p>FocusLock monitors active window titles system-wide and automatically shuts down matching tabs across all browsers.</p>
            </div>
          </div>
        `;
      }

      if (activeTab === 'tab-rules') {
        return `
          <h1 class="fl-panel-title">System Block Rules</h1>
          <div class="fl-card">
            <h3>Blocked Domains &amp; Apps</h3>
            <p class="fl-status-desc">Add websites or apps that you want to block when your limit is reached or during focus sessions.</p>

            <div class="fl-inputs-row">
              <input type="text" id="fl-new-rule-input" class="fl-input" placeholder="e.g. reddit.com, steam.exe">
              <select id="fl-rule-type" class="fl-select">
                <option value="domain">Website (Domain/Path)</option>
                <option value="app">Desktop App (Process)</option>
              </select>
              <button class="fl-btn-primary" id="btn-add-rule">Add Block Rule</button>
            </div>

            <div class="fl-rules-grid">
              <div>
                <h4 style="font-size:12px;margin-bottom:8px;color:#94a3b8;">Blocked Websites (System-wide)</h4>
                ${blockedDomains.map((d, i) => `
                  <div class="fl-rule-item">
                    <span>${d}</span>
                    <button class="fl-rule-del" data-del-domain="${i}">✕</button>
                  </div>
                `).join('')}
              </div>
              <div>
                <h4 style="font-size:12px;margin-bottom:8px;color:#94a3b8;">Blocked Desktop Processes</h4>
                ${blockedApps.map((a, i) => `
                  <div class="fl-rule-item">
                    <span>${a}</span>
                    <button class="fl-rule-del" data-del-app="${i}">✕</button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }

      if (activeTab === 'tab-todos') {
        return `
          <h1 class="fl-panel-title">Shared Tasks</h1>
          <div class="fl-card">
            <h3>Shared Task Checklist</h3>
            <p class="fl-status-desc">These tasks sync automatically between your phone and laptop in real-time. Toggling a task here updates your phone screen instantly.</p>

            <div class="fl-inputs-row">
              <input type="text" id="fl-new-todo-input" class="fl-input" placeholder="Add a mindful task you need to complete...">
              <button class="fl-btn-primary" id="btn-add-todo">Add Task</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${todos.map((t, i) => `
                <div class="fl-rule-item" style="cursor:pointer;" data-toggle-todo="${i}">
                  <span style="display:flex;align-items:center;gap:8px;text-decoration:${t.done ? 'line-through' : 'none'};color:${t.done ? '#64748b' : '#f8fafc'};">
                    <span>${t.done ? '✅' : '⬜'}</span>
                    <span>${t.text}</span>
                  </span>
                  <button class="fl-rule-del" data-del-todo="${i}">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (activeTab === 'tab-settings') {
        return `
          <h1 class="fl-panel-title">Settings</h1>
          <div class="fl-card" style="margin-bottom:14px;">
            <h3>Sync Code</h3>
            <p class="fl-status-desc">Use the same code here and in the phone app to keep this PC in sync.</p>
            <div style="display:flex;gap:10px;align-items:center;margin-top:12px;">
              <input type="text" class="fl-input" id="fl-sync-input" value="${syncCode}" style="max-width:240px;">
              <button class="fl-btn-primary" id="btn-save-sync">Save &amp; Restart</button>
              <span id="fl-sync-saved" style="color:#10b981;font-size:11px;display:none;">Saved ✓</span>
            </div>
          </div>

          <div class="fl-card">
            <h3>Daily Limits</h3>
            <p class="fl-status-desc">How much time is allowed per day on tracked apps before blocking kicks in.</p>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;max-width:300px;">
              <label style="font-size:11px;color:#94a3b8;">Daily limit (minutes):</label>
              <input type="number" class="fl-input" id="fl-limit-input" value="${dailyLimit}">
              <button class="fl-btn-primary" id="btn-save-limit">Save Limits</button>
              <span id="fl-limit-saved" style="color:#10b981;font-size:11px;display:none;">Saved ✓</span>
            </div>
          </div>
        `;
      }

      return '';
    }

    function renderAboutModal() {
      const p = content.projects.find(x => x.id === 'focuslock') || {};
      return `
        <div class="fl-modal-overlay" id="fl-modal-overlay">
          <div class="fl-modal">
            <h3 style="color:#6366f1;font-size:16px;">About FocusLock</h3>
            <p style="font-size:12px;line-height:1.5;color:#cbd5e1;">${p.tagline || 'Screen-time limits that follow you across Android and Windows.'}</p>
            <div style="font-size:11px;color:#94a3b8;line-height:1.4;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">
              • Built by Dhruv Kothari (Kotlin, Android Accessibility, Electron SendInput agent)<br>
              • In-browser simulation runs with demo data and local policy synchronization.
            </div>
            <button class="fl-btn-primary" id="btn-close-about" style="align-self:flex-end;">Close</button>
          </div>
        </div>
      `;
    }

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function attachListeners() {
      // Tab switching
      shadow.querySelectorAll('.fl-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.getAttribute('data-tab');
          render();
        });
      });

      // About
      shadow.getElementById('btn-about')?.addEventListener('click', () => {
        showAbout = true;
        render();
      });
      shadow.getElementById('btn-close-about')?.addEventListener('click', () => {
        showAbout = false;
        render();
      });

      // Duration chips
      shadow.querySelectorAll('.fl-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          focusDuration = parseInt(chip.getAttribute('data-mins'), 10);
          render();
        });
      });

      // Start/Stop focus
      shadow.getElementById('btn-start-focus')?.addEventListener('click', () => {
        focusActive = true;
        countdownSec = focusDuration * 60;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          countdownSec--;
          if (countdownSec <= 0) {
            focusActive = false;
            clearInterval(timerInterval);
          }
          const countdownEl = shadow.getElementById('fl-countdown-text');
          if (countdownEl) {
            countdownEl.textContent = focusActive ? formatTime(countdownSec) : 'Focus Inactive';
          }
        }, 1000);
        render();
      });

      shadow.getElementById('btn-stop-focus')?.addEventListener('click', () => {
        focusActive = false;
        if (timerInterval) clearInterval(timerInterval);
        render();
      });

      // Add Rule
      shadow.getElementById('btn-add-rule')?.addEventListener('click', () => {
        const input = shadow.getElementById('fl-new-rule-input');
        const type = shadow.getElementById('fl-rule-type')?.value;
        const val = input?.value?.trim();
        if (val) {
          if (type === 'domain') blockedDomains.push(val);
          else blockedApps.push(val);
          render();
        }
      });

      // Delete Rule
      shadow.querySelectorAll('[data-del-domain]').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-del-domain'), 10);
          blockedDomains.splice(idx, 1);
          render();
        });
      });
      shadow.querySelectorAll('[data-del-app]').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-del-app'), 10);
          blockedApps.splice(idx, 1);
          render();
        });
      });

      // Add Todo
      shadow.getElementById('btn-add-todo')?.addEventListener('click', () => {
        const input = shadow.getElementById('fl-new-todo-input');
        const val = input?.value?.trim();
        if (val) {
          todos.push({ id: Date.now(), text: val, done: false });
          render();
        }
      });

      // Toggle Todo
      shadow.querySelectorAll('[data-toggle-todo]').forEach(b => {
        b.addEventListener('click', (e) => {
          if (e.target.classList.contains('fl-rule-del')) return;
          const idx = parseInt(b.getAttribute('data-toggle-todo'), 10);
          todos[idx].done = !todos[idx].done;
          render();
        });
      });

      // Delete Todo
      shadow.querySelectorAll('[data-del-todo]').forEach(b => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-del-todo'), 10);
          todos.splice(idx, 1);
          render();
        });
      });

      // Save sync code
      shadow.getElementById('btn-save-sync')?.addEventListener('click', () => {
        const inp = shadow.getElementById('fl-sync-input');
        if (inp?.value) {
          syncCode = inp.value.trim();
          const savedMsg = shadow.getElementById('fl-sync-saved');
          if (savedMsg) savedMsg.style.display = 'inline';
          setTimeout(() => { if (savedMsg) savedMsg.style.display = 'none'; }, 2000);
        }
      });

      // Save limit
      shadow.getElementById('btn-save-limit')?.addEventListener('click', () => {
        const inp = shadow.getElementById('fl-limit-input');
        if (inp?.value) {
          dailyLimit = parseInt(inp.value, 10);
          const savedMsg = shadow.getElementById('fl-limit-saved');
          if (savedMsg) savedMsg.style.display = 'inline';
          setTimeout(() => { if (savedMsg) savedMsg.style.display = 'none'; }, 2000);
        }
      });
    }

    render();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      root.remove();
    };
  },
};
