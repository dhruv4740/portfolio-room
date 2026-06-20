import { useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

// CustomCursor — follows mouse via direct DOM transform (no React state for position).
// Hides in WALKING (pointer-locked crosshair) and BOOT (terminal).
// Morphs visually based on cursorState from store.

export default function CustomCursor() {
  const phase         = useStore((s) => s.phase)
  const cursorState   = useStore((s) => s.cursorState)
  const hoveredObject = useStore((s) => s.hoveredObject)

  const elRef = useRef(null)

  // Track mouse position directly in DOM — no setState, no re-render per move.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    function onMove(e) {
      el.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Hide in WALKING or BOOT
  const hidden = phase === 'WALKING' || phase === 'BOOT'
  if (hidden) return null

  // Visual config per cursorState
  let size   = 14
  let filled = false
  let label  = null

  if (cursorState === 'hover-object') {
    size  = 34
    label = hoveredObject
  } else if (cursorState === 'grab') {
    size   = 28
    filled = true
  } else if (cursorState === 'link') {
    size  = 22
    label = '↗'
  }

  const half = size / 2

  return (
    <div
      ref={elRef}
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        pointerEvents: 'none',
        zIndex:        9999,
        // Start offscreen so it doesn't flash at 0,0 before first mousemove
        transform:     'translate3d(-100px,-100px,0)',
      }}
    >
      {/* Ring / dot */}
      <div
        style={{
          position:     'absolute',
          top:          -half,
          left:         -half,
          width:        size,
          height:       size,
          borderRadius: '50%',
          border:       filled ? 'none' : '2px solid rgba(255,255,255,0.85)',
          background:   filled ? 'rgba(255,255,255,0.75)' : 'transparent',
          transition:   'width 120ms ease, height 120ms ease, top 120ms ease, left 120ms ease, background 120ms ease',
          boxShadow:    cursorState !== 'default' ? '0 0 8px rgba(0,207,255,0.5)' : 'none',
        }}
      />
      {/* Small dot in center when default */}
      {cursorState === 'default' && (
        <div
          style={{
            position:     'absolute',
            top:          -2,
            left:         -2,
            width:        4,
            height:       4,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.9)',
          }}
        />
      )}
      {/* Label */}
      {label && (
        <span
          style={{
            position:   'absolute',
            top:        -half - 2,
            left:       half + 8,
            color:      'rgba(255,255,255,0.9)',
            fontFamily: 'var(--font-mono)',
            fontSize:   '11px',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
