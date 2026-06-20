// NavBar — bottom-left corner nav. Opens about/contact/help panels.
// Hidden during BOOT and WALKING (pointer-locked immersive mode).
// Visible during CINEMATIC and FOCUSED.

import useStore from '../../store/useStore.js'

const wrapStyle = {
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  zIndex: 30,
  display: 'flex',
  gap: '6px',
  pointerEvents: 'auto',
}

const btnBase = {
  background: 'rgba(0,0,0,0.50)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '6px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.75)',
  letterSpacing: '0.04em',
  userSelect: 'none',
  lineHeight: 1,
  pointerEvents: 'auto',
}

const btnActive = {
  ...btnBase,
  border: '1px solid rgba(0,207,255,0.55)',
  color: 'rgba(0,207,255,0.95)',
}

const PANELS = ['about', 'contact', 'help']

export default function NavBar() {
  const phase      = useStore((s) => s.phase)
  const openPanel  = useStore((s) => s.openPanel)
  const setOpenPanel = useStore((s) => s.setOpenPanel)

  // Hide during boot or immersive walking
  if (phase === 'BOOT' || phase === 'WALKING') return null

  function toggle(panel) {
    setOpenPanel(openPanel === panel ? null : panel)
  }

  return (
    <div style={wrapStyle}>
      {PANELS.map((p) => (
        <button
          key={p}
          style={openPanel === p ? btnActive : btnBase}
          onClick={() => toggle(p)}
          aria-pressed={openPanel === p}
          aria-label={`Open ${p} panel`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
