// ============================================================================
// ExpenseApp.jsx — Rebuilt from C:\Users\hp\expense-tracker (React Native)
// Source commit: d7c29f5 chore: sanitize paths, strengthen gitignore, and prepare repository for public release
//
// Screens rebuilt:
// 1. Dashboard (DashboardScreen.tsx) — Monthly spend hero, spend trend, category donut, top merchant
// 2. Transactions (TransactionsScreen.tsx) — Day-grouped transaction feed, search, filter chips, add modal
// 3. Uber Splits (UberScreen.tsx) — Ride ledger and peer split calculator
// 4. Insights (InsightsScreen.tsx) — Category distribution breakdown and monthly stats
// 5. Settings (SettingsScreen.tsx) — Native SMS peek/ack buffer diagnostics & local SQLite state
// ============================================================================

import { useState, useMemo } from 'react';

// Design tokens from src/theme.ts
const THEME = {
  bg: '#000000',
  surface: '#0E0E0E',
  surfaceAlt: '#161616',
  border: '#222222',
  textPrimary: '#FFFFFF',
  textSecondary: '#B5B5B5',
  textMuted: '#6E6E6E',
  accent: '#3DDC84',
  debit: '#FF5C5C',
  credit: '#3DDC84',
  self: '#7AA2FF',
  warning: '#c9c4b6',
};

const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', merchant: 'Sample Supermarket', category: 'Groceries', amount: 1450, type: 'expense', date: 'Today, 2:15 PM', account: 'HDFC **4021' },
  { id: 'tx-2', merchant: 'Sample Cafe & Bakery', category: 'Food', amount: 280, type: 'expense', date: 'Today, 11:30 AM', account: 'UPI' },
  { id: 'tx-3', merchant: 'Metro Transit Pass', category: 'Transport', amount: 500, type: 'expense', date: 'Yesterday, 6:40 PM', account: 'UPI' },
  { id: 'tx-4', merchant: 'Sample Electric Co', category: 'Utilities', amount: 2100, type: 'expense', date: '14 Sep, 10:00 AM', account: 'HDFC **4021' },
  { id: 'tx-5', merchant: 'Monthly Stipend / Salary', category: 'Income', amount: 45000, type: 'income', date: '01 Sep, 9:00 AM', account: 'HDFC **4021' },
  { id: 'tx-6', merchant: 'Uber Ride — BKC to Bandra', category: 'Uber', amount: 420, type: 'expense', date: '12 Sep, 8:15 PM', account: 'UPI', splitEligible: true },
];

export default function ExpenseApp({ onClose }) {
  const [tab, setTab] = useState('dashboard'); // dashboard | transactions | uber | insights | settings
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // New Transaction Form
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food');

  // Uber Split State
  const [splitFriends, setSplitFriends] = useState('3');
  const [splitResult, setSplitResult] = useState(null);

  const categories = ['All', 'Groceries', 'Food', 'Transport', 'Utilities', 'Uber'];

  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = tx.merchant.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || tx.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [transactions, search, selectedCategory]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  function handleAddTransaction(e) {
    e.preventDefault();
    if (!newMerchant || !newAmount) return;
    const amountNum = parseFloat(newAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const item = {
      id: `tx-${Date.now()}`,
      merchant: newMerchant,
      category: newCategory,
      amount: amountNum,
      type: 'expense',
      date: 'Just now',
      account: 'Cash/Manual',
    };
    setTransactions([item, ...transactions]);
    setNewMerchant('');
    setNewAmount('');
    setShowAddModal(false);
  }

  function calculateSplit(rideAmount) {
    const count = parseInt(splitFriends, 10);
    if (count > 0) {
      const perHead = Math.round(rideAmount / count);
      setSplitResult({ count, perHead, total: rideAmount });
    }
  }

  return (
    <div
      className="expense-app-root"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: THEME.bg,
        color: THEME.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 8px',
          borderBottom: `1px solid ${THEME.border}`,
          backgroundColor: THEME.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: THEME.accent }}>✦</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Expense Tracker
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(255, 92, 92, 0.15)',
                  color: THEME.debit,
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                DEMO DATA
              </span>
            </div>
            <div style={{ fontSize: '10px', color: THEME.textMuted }}>SQLite · SMS Peek/Ack</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAboutModal(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${THEME.border}`,
              color: THEME.textSecondary,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="About Expense Tracker"
          >
            ⓘ
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: THEME.textSecondary,
              fontSize: '18px',
              cursor: 'pointer',
              padding: '2px 6px',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Main Screen Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {tab === 'dashboard' && (
          <>
            {/* Spend Hero Card (DashboardScreen.tsx) */}
            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '16px',
                padding: '18px',
                border: `1px solid ${THEME.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '11px', color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total Spent This Month
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: THEME.textPrimary, margin: '6px 0 12px' }}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: `1px solid ${THEME.border}` }}>
                <div>
                  <div style={{ fontSize: '10px', color: THEME.textMuted }}>Income</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: THEME.credit }}>+₹45,000</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: THEME.textMuted }}>Net Savings</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: THEME.self }}>
                    ₹{(45000 - totalSpent).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown (Donut Chart representation) */}
            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '16px',
                padding: '16px',
                border: `1px solid ${THEME.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Spending by Category</span>
                <span style={{ fontSize: '11px', color: THEME.accent }}>Live Metrics</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'Groceries', amount: 1450, color: '#3DDC84', pct: '30%' },
                  { name: 'Utilities', amount: 2100, color: '#7AA2FF', pct: '44%' },
                  { name: 'Transport & Uber', amount: 920, color: '#c9c4b6', pct: '19%' },
                  { name: 'Food & Dining', amount: 280, color: '#FF5C5C', pct: '7%' },
                ].map(cat => (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: THEME.textSecondary }}>{cat.name}</span>
                      <span style={{ fontWeight: '600' }}>₹{cat.amount.toLocaleString()} ({cat.pct})</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: THEME.surfaceAlt, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: cat.pct, height: '100%', backgroundColor: cat.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Uber Card */}
            <div
              onClick={() => setTab('uber')}
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '14px',
                border: `1px solid ${THEME.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: THEME.textPrimary }}>🚗 Uber Rides & Splits</div>
                <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>
                  Split recent ride (₹420) with friends
                </div>
              </div>
              <span style={{ color: THEME.accent, fontSize: '18px' }}>→</span>
            </div>

            {/* Recent Transactions Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Recent Transactions</span>
                <button
                  onClick={() => setTab('transactions')}
                  style={{ background: 'none', border: 'none', color: THEME.accent, fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                >
                  View All ({transactions.length})
                </button>
              </div>

              {transactions.slice(0, 3).map(tx => (
                <div
                  key={tx.id}
                  style={{
                    backgroundColor: THEME.surface,
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${THEME.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{tx.merchant}</div>
                    <div style={{ fontSize: '10px', color: THEME.textMuted }}>{tx.category} · {tx.date}</div>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: tx.type === 'income' ? THEME.credit : THEME.debit,
                    }}
                  >
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'transactions' && (
          <>
            {/* Search & Filters (TransactionsScreen.tsx) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                style={{
                  flex: 1,
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: THEME.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  backgroundColor: THEME.accent,
                  color: '#000',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor: selectedCategory === cat ? THEME.accent : THEME.surface,
                    color: selectedCategory === cat ? '#000000' : THEME.textSecondary,
                    border: `1px solid ${selectedCategory === cat ? THEME.accent : THEME.border}`,
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTx.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: THEME.textMuted, fontSize: '12px' }}>
                  No transactions found matching filter
                </div>
              ) : (
                filteredTx.map(tx => (
                  <div
                    key={tx.id}
                    style={{
                      backgroundColor: THEME.surface,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: `1px solid ${THEME.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{tx.merchant}</div>
                      <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '2px' }}>
                        {tx.category} · {tx.date} · {tx.account}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: tx.type === 'income' ? THEME.credit : THEME.debit,
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === 'uber' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Uber Rides & Split Calculator</div>
            <div style={{ fontSize: '11px', color: THEME.textMuted }}>
              Automatic ride tagging from SMS receipts and one-tap peer split computation.
            </div>

            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${THEME.border}`,
              }}
            >
              <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '6px' }}>Selected Ride</div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>Uber Ride — BKC to Bandra</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: THEME.debit, margin: '8px 0' }}>₹420</div>

              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: THEME.textSecondary }}>Split among how many people?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['2', '3', '4', '5'].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        setSplitFriends(num);
                        calculateSplit(420);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: splitFriends === num ? THEME.accent : THEME.surfaceAlt,
                        color: splitFriends === num ? '#000' : THEME.textPrimary,
                        border: `1px solid ${splitFriends === num ? THEME.accent : THEME.border}`,
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {splitResult && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(61, 220, 132, 0.1)',
                    border: '1px solid rgba(61, 220, 132, 0.25)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: THEME.accent, fontWeight: '700' }}>Split Result</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: THEME.textPrimary, margin: '4px 0' }}>
                    ₹{splitResult.perHead} / person
                  </div>
                  <div style={{ fontSize: '10px', color: THEME.textSecondary }}>
                    Total ₹{splitResult.total} split across {splitResult.count} people.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Monthly Insights</div>
            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${THEME.border}`,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Top Merchant</div>
              <div style={{ fontSize: '15px', color: THEME.textPrimary, fontWeight: '600' }}>Sample Supermarket</div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>₹1,450 across 1 transaction this month</div>
            </div>

            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${THEME.border}`,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>Largest Outflow</div>
              <div style={{ fontSize: '15px', color: THEME.textPrimary, fontWeight: '600' }}>Sample Electric Co</div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>₹2,100 utility bill</div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Diagnostics & Settings</div>
            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${THEME.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Engine Architecture</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: THEME.textPrimary }}>Peek/Ack Event Buffer</div>
                <div style={{ fontSize: '10px', color: THEME.textSecondary, marginTop: '2px' }}>
                  Kotlin captures SMS and notifications into peek/ack queue; TypeScript processes and acks.
                </div>
              </div>
              <div style={{ height: '1px', backgroundColor: THEME.border }} />
              <div>
                <div style={{ fontSize: '12px', color: THEME.textMuted }}>Database Storage</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: THEME.accent }}>Local SQLite (Active)</div>
                <div style={{ fontSize: '10px', color: THEME.textSecondary, marginTop: '2px' }}>
                  Zero network calls, offline encrypted records.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add expense"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: THEME.surface,
              borderRadius: '16px',
              border: `1px solid ${THEME.border}`,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Add Expense</div>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Merchant / Note (e.g. Sample Grocery)"
                value={newMerchant}
                onChange={e => setNewMerchant(e.target.value)}
                required
                style={{
                  backgroundColor: THEME.surfaceAlt,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  padding: '10px',
                  color: THEME.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                required
                style={{
                  backgroundColor: THEME.surfaceAlt,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  padding: '10px',
                  color: THEME.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                style={{
                  backgroundColor: THEME.surfaceAlt,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  padding: '10px',
                  color: THEME.textPrimary,
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="Food">Food</option>
                <option value="Groceries">Groceries</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Uber">Uber</option>
              </select>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: THEME.accent,
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  data-phone-dialog-close="true"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: THEME.surfaceAlt,
                    color: THEME.textSecondary,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="About Expense Tracker"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: THEME.surface,
              borderRadius: '16px',
              border: `1px solid ${THEME.border}`,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.accent }}>About Expense Tracker</div>
            <div style={{ fontSize: '12px', color: THEME.textSecondary, lineHeight: 1.5 }}>
              Logs your spending by reading the receipts your phone already gets. React Native app where Kotlin captures SMS and notifications into a peek/ack buffer, and a TypeScript parser logs expenses automatically into local SQLite.
            </div>
            <div style={{ fontSize: '11px', color: THEME.textMuted, lineHeight: 1.4, borderTop: `1px solid ${THEME.border}`, paddingTop: '8px' }}>
              • Built by Dhruv Kothari (React Native, Kotlin, SQLite)<br />
              • Running on sample fixture data with fake latency simulation.
            </div>
            <button
              data-phone-dialog-close="true"
              onClick={() => setShowAboutModal(false)}
              style={{
                backgroundColor: THEME.surfaceAlt,
                color: THEME.textPrimary,
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        style={{
          display: 'flex',
          borderTop: `1px solid ${THEME.border}`,
          backgroundColor: THEME.surface,
          padding: '6px 4px 10px',
          justifyContent: 'space-around',
          flexShrink: 0,
        }}
      >
        {[
          { id: 'dashboard', label: 'Home', icon: '📊' },
          { id: 'transactions', label: 'Feed', icon: '📝' },
          { id: 'uber', label: 'Uber', icon: '🚗' },
          { id: 'insights', label: 'Stats', icon: '📈' },
          { id: 'settings', label: 'Config', icon: '⚙️' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              background: 'none',
              border: 'none',
              color: tab === item.id ? THEME.accent : THEME.textMuted,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: tab === item.id ? '700' : '500',
              padding: '4px 8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
