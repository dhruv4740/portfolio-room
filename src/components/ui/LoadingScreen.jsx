import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

// Fades out once the loader queue goes idle. The scene is largely procedural
// (few/no assets tracked by useProgress), so we hide on `!active` rather than
// waiting for progress===100, with a hard safety timeout so it can never stick.
export default function LoadingScreen() {
  const { progress, active } = useProgress()
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    function beginFade() {
      if (startedRef.current) return
      startedRef.current = true
      setFading(true)
      setTimeout(() => setVisible(false), 600)
    }
    // Hide shortly after the loader queue is idle (no items left / none ever).
    if (!active) {
      const t = setTimeout(beginFade, 400)
      return () => clearTimeout(t)
    }
    // Safety net: never let the loader stick even if `active` stays true.
    const safety = setTimeout(beginFade, 3000)
    return () => clearTimeout(safety)
  }, [active])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        transition: 'opacity 0.55s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'rgba(0,207,255,0.55)',
          marginBottom: '20px',
          textTransform: 'uppercase',
        }}
      >
        loading scene
      </div>
      <div
        style={{
          width: '200px',
          height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(4, Math.round(progress))}%`,
            background: 'rgba(0,207,255,0.7)',
            borderRadius: '1px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <div
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.06em',
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  )
}
