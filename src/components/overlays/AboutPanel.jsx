import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore.js'
import { ABOUT } from '../../data/about.js'

const cardStyle = {
  position: 'fixed',
  bottom: '60px',
  left: '20px',
  width: '340px',
  background: 'rgba(10, 12, 22, 0.90)',
  border: '1px solid rgba(0, 207, 255, 0.30)',
  borderRadius: '10px',
  padding: '24px 22px 20px',
  boxShadow: '0 0 32px rgba(0, 207, 255, 0.12), 0 8px 24px rgba(0,0,0,0.65)',
  backdropFilter: 'blur(12px)',
  zIndex: 41,
  pointerEvents: 'auto',
}

const nameStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '22px',
  fontWeight: 700,
  color: '#e0f0ff',
  letterSpacing: '0.01em',
  lineHeight: 1.2,
  marginBottom: '6px',
}

const roleStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'rgba(0,207,255,0.85)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: '16px',
}

const dividerStyle = {
  width: '32px',
  height: '1px',
  background: 'rgba(0,207,255,0.35)',
  marginBottom: '16px',
}

const bioStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '13px',
  color: 'rgba(200,220,240,0.80)',
  lineHeight: 1.65,
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

export default function AboutPanel() {
  const openPanel    = useStore((s) => s.openPanel)
  const setOpenPanel = useStore((s) => s.setOpenPanel)
  const isOpen       = openPanel === 'about'
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
          aria-label="About panel"
        >
          <button
            style={closeBtnStyle}
            onClick={() => setOpenPanel(null)}
            aria-label="Close about panel"
          >
            ✕
          </button>

          <div style={nameStyle}>{ABOUT.name}</div>
          <div style={roleStyle}>{ABOUT.role}</div>
          <div style={dividerStyle} />
          <p style={bioStyle}>{ABOUT.bio}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
