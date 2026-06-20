import useStore from '../../store/useStore'

const baseStyle = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.55)',
  zIndex: 10,
}

const bottomHint = {
  position: 'absolute',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
}

const crosshair = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.7)',
  boxShadow: '0 0 4px rgba(255,255,255,0.4)',
}

const promptStyle = {
  position: 'absolute',
  bottom: '60px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.55)',
  border: '1px solid rgba(0,207,255,0.4)',
  borderRadius: '6px',
  padding: '4px 12px',
  color: 'rgba(0,207,255,0.9)',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
  fontSize: '11px',
}

export default function HUD() {
  const phase        = useStore((s) => s.phase)
  const laptopPrompt = useStore((s) => s.laptopPrompt)

  if (phase === 'CINEMATIC') {
    return (
      <div style={baseStyle}>
        <div style={bottomHint}>click to explore · drag to look</div>
      </div>
    )
  }

  if (phase === 'WALKING') {
    return (
      <div style={baseStyle}>
        <div style={crosshair} />
        {laptopPrompt && (
          <div style={promptStyle}>press E to use laptop</div>
        )}
        <div style={bottomHint}>WASD move · shift sprint · esc to exit</div>
      </div>
    )
  }

  if (phase === 'FOCUSED') {
    return (
      <div style={baseStyle}>
        <div style={bottomHint}>drive: arrows / WASD · esc to step back</div>
      </div>
    )
  }

  return null
}
