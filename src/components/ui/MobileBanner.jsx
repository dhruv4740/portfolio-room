import { useState } from 'react'

// Small dismissable "best on desktop" notice shown only on mobile.
export default function MobileBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(10,10,10,0.88)',
        border: '1px solid rgba(0,207,255,0.3)',
        borderRadius: '8px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span>best experienced on desktop</span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(0,207,255,0.7)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          cursor: 'pointer',
          padding: '0 2px',
          lineHeight: 1,
        }}
        aria-label="dismiss"
      >
        ×
      </button>
    </div>
  )
}
