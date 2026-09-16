// ============================================================================
// BasketProofApp.jsx — Rebuilt from C:\Users\hp\OneDrive\Desktop\comparison (Kotlin Compose)
// Source commit: c5d527c chore: finish the redaction and drop remaining stale restore references
//
// Screens rebuilt:
// 1. ShoppingListScreen (BasketCompareScreens.kt:40) — Item drafts, quantity, saved lists
// 2. ResolutionScreen (BasketCompareScreens.kt:133) — Cross-platform product resolution (Blinkit, Instamart, Zepto)
// 3. ResultsScreen (BasketCompareScreens.kt:412) — Strict verification with UNKNOWN totals
// 4. SavedListsScreen (BasketCompareScreens.kt:963) — Preconfigured family baskets
// ============================================================================

import { useState } from 'react';

const THEME = {
  bg: '#121316',
  surface: '#1C1D22',
  surfaceAlt: '#25272F',
  border: '#2E313D',
  textPrimary: '#F1F2F6',
  textSecondary: '#A0A4B4',
  textMuted: '#6B7082',
  accent: '#7C4DFF', // Android Material 3 Purple accent
  accentHover: '#651FFF',
  error: '#FF5252',
  success: '#00E676',
  warning: '#FFD740',
};

const DEFAULT_ITEMS = [
  { id: 'item-1', name: 'Sample Whole Milk 1L', quantity: '2' },
  { id: 'item-2', name: 'Sample Sourdough Bread', quantity: '1' },
  { id: 'item-3', name: 'Sample Farm Eggs 6pk', quantity: '1' },
];

export default function BasketProofApp({ onClose }) {
  const [screen, setScreen] = useState('shopping'); // shopping | resolution | results | saved
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [newItemName, setNewItemName] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Resolution selections
  const [selections, setSelections] = useState({
    zepto: { name: 'Zepto Daily Fresh Milk 1L', price: 68 },
    instamart: { name: 'Amul Taaza Milk 1L', price: 70 },
    blinkit: null, // Blinkit unmatched to demonstrate UNKNOWN rule
  });
  const [blinkitManualPrice, setBlinkitManualPrice] = useState('');

  function addItem() {
    if (!newItemName.trim()) return;
    setItems([...items, { id: `item-${Date.now()}`, name: newItemName.trim(), quantity: '1' }]);
    setNewItemName('');
  }

  function removeItem(id) {
    setItems(items.filter(it => it.id !== id));
  }

  return (
    <div
      className="basketproof-app-root"
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
      {/* App Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${THEME.border}`,
          backgroundColor: THEME.surface,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: THEME.accent }}>🧺</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              BasketProof
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'rgba(255, 82, 82, 0.15)',
                  color: THEME.error,
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  letterSpacing: '0.05em',
                }}
              >
                DEMO DATA
              </span>
            </div>
            <div style={{ fontSize: '10px', color: THEME.textMuted }}>Kotlin Compose · Evidence Engine</div>
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
            title="About BasketProof"
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

      {/* Screen Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Shopping List Screen (BasketCompareScreens.kt:40) */}
        {screen === 'shopping' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Shopping list</h2>
                <p style={{ fontSize: '11px', color: THEME.textSecondary, marginTop: '4px', lineHeight: 1.4 }}>
                  Add the items you want to compare, then Compare. Nothing is picked for you -- you choose the exact product per platform next.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setScreen('saved')}
                style={{
                  background: 'none',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: '8px',
                  color: THEME.accent,
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                Saved lists
              </button>
            </div>

            {/* Item Drafts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: THEME.surface,
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${THEME.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: THEME.textMuted }}>Qty: {item.quantity}</div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: THEME.error,
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            {/* Add Item Row */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Add another item (e.g. Butter 500g)"
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
                onClick={addItem}
                style={{
                  backgroundColor: THEME.surfaceAlt,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.textPrimary,
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {/* Compare Action */}
            <button
              onClick={() => setScreen('resolution')}
              style={{
                marginTop: '12px',
                backgroundColor: THEME.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Compare across 3 platforms →
            </button>
          </>
        )}

        {/* Resolution Screen (BasketCompareScreens.kt:133) */}
        {screen === 'resolution' && (
          <>
            <div>
              <button
                onClick={() => setScreen('shopping')}
                style={{ background: 'none', border: 'none', color: THEME.accent, fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                ← Back to shopping list
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '6px 0 2px' }}>Pick your products</h2>
              <p style={{ fontSize: '11px', color: THEME.textSecondary, lineHeight: 1.4 }}>
                Review live matching across Blinkit, Instamart, and Zepto.
              </p>
            </div>

            {/* Invariant Banner */}
            <div
              style={{
                backgroundColor: 'rgba(124, 77, 255, 0.12)',
                border: '1px solid rgba(124, 77, 255, 0.3)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                color: THEME.textPrimary,
              }}
            >
              ⚖️ <strong>Core Rule:</strong> UNKNOWN is better than WRONG. Any unverified platform line stays uncalculated.
            </div>

            {/* Platform Candidates Card */}
            <div
              style={{
                backgroundColor: THEME.surface,
                borderRadius: '14px',
                padding: '14px',
                border: `1px solid ${THEME.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Item 1: Sample Whole Milk 1L</div>

              {/* Zepto candidate */}
              <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: THEME.success }}>ZEPTO (LIVE)</span>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Zepto Daily Fresh Milk 1L</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>₹68</span>
                </div>
              </div>

              {/* Instamart candidate */}
              <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: THEME.warning }}>INSTAMART (LIVE)</span>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>Amul Taaza Milk 1L</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>₹70</span>
                </div>
              </div>

              {/* Blinkit Manual Fallback (BasketCompareScreens.kt:215) */}
              <div style={{ border: `1px dashed ${THEME.border}`, borderRadius: '10px', padding: '10px', backgroundColor: THEME.surfaceAlt }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: THEME.textSecondary }}>Blinkit (typed by you)</div>
                <div style={{ fontSize: '10px', color: THEME.textMuted, margin: '4px 0 8px', lineHeight: 1.3 }}>
                  If Blinkit is not connected above, or no live match was found for this item, you can still type a price you've seen in the Blinkit app -- it will be clearly marked as user-entered, not a verified price.
                </div>
                <input
                  type="number"
                  placeholder="Price you saw (Rs.)"
                  value={blinkitManualPrice}
                  onChange={e => setBlinkitManualPrice(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: '8px',
                    padding: '8px',
                    color: THEME.textPrimary,
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => setScreen('results')}
              style={{
                marginTop: '6px',
                backgroundColor: THEME.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Run comparison →
            </button>
          </>
        )}

        {/* Results Screen (BasketCompareScreens.kt:412) */}
        {screen === 'results' && (
          <>
            <div>
              <button
                onClick={() => setScreen('resolution')}
                style={{ background: 'none', border: 'none', color: THEME.accent, fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                ← Back to picks
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '6px 0 2px' }}>Comparison</h2>
              <div style={{ fontSize: '12px', color: THEME.textSecondary }}>Platform subtotals</div>
              <div style={{ fontSize: '10px', color: THEME.textMuted }}>Swipe sideways to compare platforms</div>
            </div>

            {/* Platform Subtotals Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Zepto Card */}
              <div
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: '14px',
                  padding: '14px',
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>Zepto</span>
                  <span style={{ fontSize: '10px', color: THEME.success, fontWeight: '700' }}>VERIFIED EVIDENCE</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.textPrimary, margin: '6px 0' }}>
                  ₹206
                </div>
                <div style={{ fontSize: '11px', color: THEME.textMuted }}>
                  Items: ₹136 · Handling: ₹5 · Delivery: ₹65
                </div>
                <div style={{ fontSize: '10px', color: THEME.textSecondary, marginTop: '6px' }}>
                  Delivery context: 10 mins · Verified
                </div>
              </div>

              {/* Instamart Card */}
              <div
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: '14px',
                  padding: '14px',
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>Swiggy Instamart</span>
                  <span style={{ fontSize: '10px', color: THEME.success, fontWeight: '700' }}>VERIFIED EVIDENCE</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.textPrimary, margin: '6px 0' }}>
                  ₹218
                </div>
                <div style={{ fontSize: '11px', color: THEME.textMuted }}>
                  Items: ₹140 · Handling: ₹8 · Delivery: ₹70
                </div>
                <div style={{ fontSize: '10px', color: THEME.textSecondary, marginTop: '6px' }}>
                  Delivery context: 15 mins · Verified
                </div>
              </div>

              {/* Blinkit Card (Demonstrates UNKNOWN rule) */}
              <div
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: '14px',
                  padding: '14px',
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700' }}>Blinkit</span>
                  <span style={{ fontSize: '10px', color: THEME.error, fontWeight: '700' }}>UNVERIFIED LINE</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.error, margin: '6px 0' }}>
                  {blinkitManualPrice ? `₹${(parseInt(blinkitManualPrice, 10) * 2 + 50).toLocaleString()}*` : 'UNKNOWN'}
                </div>
                <div style={{ fontSize: '11px', color: THEME.error }}>
                  {blinkitManualPrice
                    ? 'User-entered price (unverified by platform session)'
                    : 'Not priced: Sample Sourdough Bread'}
                </div>
                <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '6px' }}>
                  Delivery context: UNKNOWN
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 82, 82, 0.08)',
                border: '1px solid rgba(255, 82, 82, 0.25)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '11px',
                color: THEME.error,
                lineHeight: 1.4,
              }}
            >
              Refuses to show you a price it cannot prove. If any item is missing or session-stale, the total remains UNKNOWN rather than guessing.
            </div>
          </>
        )}

        {/* Saved Lists Screen (BasketCompareScreens.kt:963) */}
        {screen === 'saved' && (
          <>
            <div>
              <button
                onClick={() => setScreen('shopping')}
                style={{ background: 'none', border: 'none', color: THEME.accent, fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                ← Back to shopping list
              </button>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '6px 0 2px' }}>Saved lists</h2>
              <p style={{ fontSize: '11px', color: THEME.textSecondary }}>
                Family recurring grocery baskets.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Weekly Groceries', itemsCount: 3, lastUsed: '3 days ago' },
                { name: 'Breakfast Essentials', itemsCount: 4, lastUsed: '1 week ago' },
              ].map(sl => (
                <div
                  key={sl.name}
                  style={{
                    backgroundColor: THEME.surface,
                    borderRadius: '12px',
                    padding: '14px',
                    border: `1px solid ${THEME.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>{sl.name}</div>
                    <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '2px' }}>
                      {sl.itemsCount} items · Last compared {sl.lastUsed}
                    </div>
                  </div>
                  <button
                    onClick={() => setScreen('shopping')}
                    style={{
                      backgroundColor: THEME.accent,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div
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
            <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.accent }}>About BasketProof</div>
            <div style={{ fontSize: '12px', color: THEME.textSecondary, lineHeight: 1.5 }}>
              A private grocery price comparison tool for one family, adding items across three delivery services separately. Built on a single rule: UNKNOWN is better than WRONG — it declines to state a total unless it has verified evidence for every line of it.
            </div>
            <div style={{ fontSize: '11px', color: THEME.textMuted, lineHeight: 1.4, borderTop: `1px solid ${THEME.border}`, paddingTop: '8px' }}>
              • Built by Dhruv Kothari (Python, FastAPI, Kotlin)<br />
              • Running on sample fixture data with verified vs unknown state demonstration.
            </div>
            <button
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

      {/* Bottom Bar Indicator */}
      <footer
        style={{
          borderTop: `1px solid ${THEME.border}`,
          backgroundColor: THEME.surface,
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          fontSize: '10px',
          color: THEME.textMuted,
        }}
      >
        <span>STATUS: ACTIVE ENFORCEMENT</span>
        <span>UNKNOWN &gt; WRONG</span>
      </footer>
    </div>
  );
}
