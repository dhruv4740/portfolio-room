import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore.js'
import { CONTACT } from '../../data/contact.js'

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  pointerEvents: 'auto',
}

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
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px',
}

const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  width: '64px',
  flexShrink: 0,
}

const linkStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: '#00cfff',
  textDecoration: 'none',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const copyBtnStyle = {
  background: 'none',
  border: '1px solid rgba(0,207,255,0.30)',
  borderRadius: '4px',
  color: 'rgba(0,207,255,0.75)',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  padding: '2px 7px',
  cursor: 'pointer',
  marginLeft: '8px',
  flexShrink: 0,
  letterSpacing: '0.04em',
}

const hintStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  color: 'rgba(255,255,255,0.25)',
  fontStyle: 'italic',
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

export default function ContactPanel() {
  const openPanel    = useStore((s) => s.openPanel)
  const setOpenPanel = useStore((s) => s.setOpenPanel)
  const isOpen       = openPanel === 'contact'

  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)

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
    // small delay so the nav button click that opened it doesn't immediately close it
    const id = setTimeout(() => window.addEventListener('pointerdown', onPointer), 80)
    return () => {
      clearTimeout(id)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [isOpen, setOpenPanel])

  function copyEmail() {
    navigator.clipboard.writeText(CONTACT.email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const hasLinkedin = CONTACT.linkedin !== 'REPLACE ME'
  const hasTwitter  = CONTACT.twitter  !== 'REPLACE ME'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* invisible backdrop — only blocks click-outside via pointerdown listener above */}
          <div style={{ ...backdropStyle, pointerEvents: 'none' }} />
          <motion.div
            ref={cardRef}
            style={cardStyle}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Contact panel"
          >
            <button
              style={closeBtnStyle}
              onClick={() => setOpenPanel(null)}
              aria-label="Close contact panel"
            >
              ✕
            </button>

            <div style={titleStyle}>contact</div>

            {/* Email row */}
            <div style={rowStyle}>
              <span style={labelStyle}>email</span>
              <a href={`mailto:${CONTACT.email}`} style={linkStyle}>
                {CONTACT.email}
              </a>
              <button style={copyBtnStyle} onClick={copyEmail} aria-label="Copy email">
                {copied ? 'copied!' : 'copy'}
              </button>
            </div>

            {/* GitHub row */}
            <div style={rowStyle}>
              <span style={labelStyle}>github</span>
              <a href={CONTACT.github} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                {CONTACT.github.replace('https://', '')}
              </a>
            </div>

            {/* LinkedIn — only if filled */}
            {hasLinkedin ? (
              <div style={rowStyle}>
                <span style={labelStyle}>linkedin</span>
                <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {CONTACT.linkedin.replace('https://', '')}
                </a>
              </div>
            ) : (
              <div style={{ ...rowStyle, marginBottom: '10px' }}>
                <span style={labelStyle}>linkedin</span>
                <span style={hintStyle}>add me · edit src/data/contact.js</span>
              </div>
            )}

            {/* Twitter — only if filled */}
            {hasTwitter ? (
              <div style={rowStyle}>
                <span style={labelStyle}>twitter</span>
                <a href={CONTACT.twitter} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {CONTACT.twitter.replace('https://', '')}
                </a>
              </div>
            ) : (
              <div style={rowStyle}>
                <span style={labelStyle}>twitter</span>
                <span style={hintStyle}>add me · edit src/data/contact.js</span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
