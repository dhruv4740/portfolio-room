// DuckBadge — corner badge shown after finding the hidden duck at least once.
// Reads/writes localStorage key 'duckFinds'. Exported as a component AND
// exports the incrementDuckCount helper used by Desk.jsx.

import { useState, useEffect } from 'react'

const LS_KEY = 'duckFinds'

export function readDuckCount() {
  try {
    return parseInt(localStorage.getItem(LS_KEY) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

export function incrementDuckCount() {
  const next = readDuckCount() + 1
  try { localStorage.setItem(LS_KEY, String(next)) } catch {}
  return next
}

export default function DuckBadge() {
  const [count, setCount] = useState(() => readDuckCount())

  // Listen for custom event emitted by Desk on duck click
  useEffect(() => {
    function onFind(e) {
      setCount(e.detail)
    }
    window.addEventListener('duck:found', onFind)
    return () => window.removeEventListener('duck:found', onFind)
  }, [])

  if (count === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 15,
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,220,0,0.5)',
        borderRadius: '8px',
        padding: '4px 10px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        color: 'rgba(255,220,0,0.9)',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{ fontSize: '14px' }}>🦆</span>
      <span>you found the duck {count} {count === 1 ? 'time' : 'times'}</span>
    </div>
  )
}
