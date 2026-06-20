import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import useStore from '../../store/useStore'

const LINES = [
  'initializing dhruv.exe',
  'loading modules: [projects] [skills] [contact]',
  'mounting 3d environment...',
  'WARNING: reality distortion detected',
  'booting...',
]

const CHAR_MIN = 20
const CHAR_MAX = 45
const LINE_PAUSE = 320 // ms between lines

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function TerminalBoot() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const setGlitchIntensity = useStore((s) => s.setGlitchIntensity)

  const [displayedLines, setDisplayedLines] = useState([])
  const [currentLine, setCurrentLine] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const overlayRef = useRef(null)
  const destroyed = useRef(false)

  // Blink cursor every 530ms
  useEffect(() => {
    const id = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(id)
  }, [])

  // Run boot sequence once on mount
  useEffect(() => {
    if (phase !== 'BOOT') return
    destroyed.current = false

    function runReveal() {
      const proxy = { value: 0 }
      // 1. Glitch ramp up
      gsap.to(proxy, {
        value: 1,
        duration: 0.25,
        ease: 'power2.in',
        onUpdate() {
          setGlitchIntensity(proxy.value)
        },
        onComplete() {
          // 2. Fade overlay out
          if (overlayRef.current) {
            gsap.to(overlayRef.current, {
              opacity: 0,
              duration: 0.4,
              ease: 'power1.in',
              onComplete() {
                // 3. Glitch settle
                const p2 = { value: 1 }
                gsap.to(p2, {
                  value: 0.02,
                  duration: 0.8,
                  ease: 'power2.out',
                  onUpdate() {
                    setGlitchIntensity(p2.value)
                  },
                  onComplete() {
                    setPhase('CINEMATIC')
                  },
                })
              },
            })
          }
        },
      })
    }

    if (prefersReducedMotion()) {
      // Show all lines instantly then reveal
      setDisplayedLines(LINES.slice(0, LINES.length - 1))
      setCurrentLine(LINES[LINES.length - 1])
      setTimeout(runReveal, 400)
      return
    }

    let lineIdx = 0
    let charIdx = 0
    let timeoutId = null

    function typeChar() {
      if (destroyed.current) return
      const line = LINES[lineIdx]

      if (charIdx < line.length) {
        const typed = line.slice(0, charIdx + 1)
        setCurrentLine(typed)
        charIdx++
        const delay = CHAR_MIN + Math.random() * (CHAR_MAX - CHAR_MIN)
        timeoutId = setTimeout(typeChar, delay)
      } else {
        // Line done
        const finishedLine = line
        lineIdx++
        charIdx = 0

        if (lineIdx < LINES.length) {
          timeoutId = setTimeout(() => {
            if (destroyed.current) return
            setDisplayedLines((prev) => [...prev, finishedLine])
            setCurrentLine('')
            timeoutId = setTimeout(typeChar, 80)
          }, LINE_PAUSE)
        } else {
          // All lines done → push last line to displayed, then reveal
          setDisplayedLines((prev) => [...prev, finishedLine])
          setCurrentLine('')
          timeoutId = setTimeout(runReveal, 600)
        }
      }
    }

    timeoutId = setTimeout(typeChar, 500)

    return () => {
      destroyed.current = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase !== 'BOOT') return null

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '10vw',
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(13px, 1.6vw, 18px)',
        color: '#33ff66',
        textShadow: '0 0 8px #33ff6699, 0 0 2px #33ff66',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {displayedLines.map((line, i) => (
        <div key={i} style={{ marginBottom: '0.35em', opacity: 0.85 }}>
          <span style={{ color: '#22cc55', marginRight: '0.6em' }}>{'>'}</span>
          {line}
        </div>
      ))}
      {(currentLine !== '' || displayedLines.length < LINES.length) && (
        <div style={{ marginBottom: '0.35em' }}>
          <span style={{ color: '#22cc55', marginRight: '0.6em' }}>{'>'}</span>
          {currentLine}
          <span
            style={{
              display: 'inline-block',
              width: '0.6em',
              height: '1.1em',
              background: '#33ff66',
              verticalAlign: 'text-bottom',
              marginLeft: '1px',
              opacity: cursorVisible ? 1 : 0,
              boxShadow: '0 0 6px #33ff66',
            }}
          />
        </div>
      )}
    </div>
  )
}
