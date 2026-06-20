// KonamiOverlay — full-screen invert effect + "nice try" message.
// Triggered by the Konami sequence. Auto-resets after 3 seconds.
// Uses a CSS class toggled on document.documentElement to apply
// filter:invert(1) hue-rotate(180deg) globally — simplest robust invert.

import { useState, useCallback, useEffect, useRef } from 'react'
import useKonamiCode from '../../hooks/useKonamiCode.js'
import useStore from '../../store/useStore.js'

const INVERT_CLASS = 'konami-invert'

// Inject the CSS rule once at module load
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `.${INVERT_CLASS} { filter: invert(1) hue-rotate(180deg); }`
  document.head.appendChild(style)
}

export default function KonamiOverlay() {
  const [active, setActive] = useState(false)

  const activate = useCallback(() => {
    // Don't trigger during FOCUSED (game driving uses arrow keys)
    if (useStore.getState().phase === 'FOCUSED') return
    setActive(true)
  }, [])

  useKonamiCode(activate)

  useEffect(() => {
    if (active) {
      document.documentElement.classList.add(INVERT_CLASS)
      const id = setTimeout(() => {
        setActive(false)
        document.documentElement.classList.remove(INVERT_CLASS)
      }, 3000)
      return () => {
        clearTimeout(id)
        document.documentElement.classList.remove(INVERT_CLASS)
      }
    }
  }, [active])

  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#0cf',
          textShadow: '0 0 20px rgba(0,207,255,0.9), 0 0 40px rgba(0,207,255,0.5)',
          letterSpacing: '0.1em',
          userSelect: 'none',
        }}
      >
        nice try
      </span>
    </div>
  )
}
