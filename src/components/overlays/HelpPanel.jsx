import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore.js'

const cardStyle = {
  position: 'fixed',
  bottom: '60px',
  left: '20px',
  width: '300px',
  background: 'rgba(10, 12, 22, 0.90)',
  border: '1px solid rgba(0, 207, 255, 0.30)',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 0 32px rgba(0, 207, 255, 0.12), 0 8px 24px rgba(0,0,0,0.65)',
  backdropFilter: 'blur(12px)',
  zIndex: 41,
  pointerEvents: 'auto',
}

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 700,
  color: '#e0f0ff',
  marginBottom: '16px',
  letterSpacing: '0.02em',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  marginBottom: '9px',
}

const keyStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  color: 'rgba(0,207,255,0.85)',
  background: 'rgba(0,207,255,0.08)',
  border: '1px solid rgba(0,207,255,0.25)',
  borderRadius: '4px',
  padding: '2px 7px',
  flexShrink: 0,
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
}

const descStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  color: 'rgba(200,220,240,0.70)',
  letterSpacing: '0.02em',
  lineHeight: 1.4,
}

const dividerStyle = {
  width: '100%',
  height: '1px',
  background: 'rgba(255,255,255,0.07)',
  margin: '12px 0',
}

const secretStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  color: 'rgba(255,255,255,0.28)',
  letterSpacing: '0.04em',
  fontStyle: 'italic',
  lineHeight: 1.5,
}

const closeBtnStyle = {
  position: 'absolute',
  top: '14px',
  right: '14px',
  background: 'none',
  border: 'none',
  color: 'rgba(160,190,220,0.55)',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  padding: '2px 4px',
}

const panelVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.16, ease: 'easeIn' } },
}

const CONTROLS = [
  { key: 'click room',   desc: 'enter walk mode + lock pointer' },
  { key: 'WASD',        desc: 'move around the room' },
  { key: 'mouse',       desc: 'look around' },
  { key: 'shift',       desc: 'sprint' },
  { key: 'E',           desc: 'interact with laptop' },
  { key: 'arrows / WASD', desc: 'drive in the car game' },
  { key: 'esc',         desc: 'exit walk mode / close panels' },
  { key: '♪ top-right', desc: 'toggle ambient sound' },
]

export default function HelpPanel() {
  const openPanel    = useStore((s) => s.openPanel)
  const setOpenPanel = useStore((s) => s.setOpenPanel)
  const isOpen       = openPanel === 'help'
  const cardRef      = useRef(null)

  // Esc to close
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setOpenPanel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, setOpenPanel])

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return
    function onPointer(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setOpenPanel(null)
      }
    }
    const id = setTimeout(() => window.addEventListener('pointerdown', onPointer), 80)
    return () => {
      clearTimeout(id)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [isOpen, setOpenPanel])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={cardRef}
          style={cardStyle}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-label="Controls help panel"
        >
          <button
            style={closeBtnStyle}
            onClick={() => setOpenPanel(null)}
            aria-label="Close help panel"
          >
            ✕
          </button>

          <div style={titleStyle}>controls</div>

          {CONTROLS.map(({ key, desc }) => (
            <div key={key} style={rowStyle}>
              <span style={keyStyle}>{key}</span>
              <span style={descStyle}>{desc}</span>
            </div>
          ))}

          <div style={dividerStyle} />

          <p style={secretStyle}>
            there's a secret sequence hidden in the room.
            some keyboards remember more than you think.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
