// SoundToggle — fixed top-right button that enables/disables the audio system.
// The first click is the user gesture that satisfies browser autoplay policy.

import useStore from '../../store/useStore.js'

const btnStyle = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  zIndex: 30,
  pointerEvents: 'auto',
  background: 'rgba(0,0,0,0.50)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: '6px',
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.75)',
  letterSpacing: '0.04em',
  userSelect: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  lineHeight: 1,
}

const dotStyle = (on) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: on ? 'rgba(0,207,255,0.9)' : 'rgba(255,255,255,0.25)',
  flexShrink: 0,
})

export default function SoundToggle() {
  const soundEnabled  = useStore((s) => s.soundEnabled)
  const toggleSound   = useStore((s) => s.toggleSound)

  return (
    <button
      style={btnStyle}
      onClick={toggleSound}
      title={soundEnabled ? 'Mute audio' : 'Enable audio'}
      aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
      aria-pressed={soundEnabled}
    >
      <span style={dotStyle(soundEnabled)} />
      {soundEnabled ? '♪ ON' : '♪ OFF'}
    </button>
  )
}
