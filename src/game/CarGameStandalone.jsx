import { useEffect, useRef, useState } from 'react'
import { CarGame, DESIGN_W, DESIGN_H } from './carGame.js'
import { PROJECTS } from '../data/projects.js'
import ProjectCard from './ProjectCard.jsx'

// CSS scale factor: show the canvas at 2x logical size
const SCALE = 2

export default function CarGameStandalone() {
  const canvasRef  = useRef(null)
  const engineRef  = useRef(null)
  const rafRef     = useRef(null)
  const lastRef    = useRef(null)
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new CarGame({
      projects: PROJECTS,
      onCheckpoint: (project) => {
        setActiveProject(project)
      },
    })
    engine.mount(canvas)
    engineRef.current = engine
    // Expose engine on window for headless test harness only
    if (typeof window !== 'undefined') window.__carEngine = engine

    // rAF loop — caller drives the engine
    function loop(ts) {
      const dt = lastRef.current != null ? Math.min((ts - lastRef.current) / 1000, 0.05) : 0
      lastRef.current = ts
      engine.frame(dt)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    // Key handling
    const KEY_MAP = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up',  s: 'down',  a: 'left',  d: 'right',
      W: 'up',  S: 'down',  A: 'left',  D: 'right',
    }
    const state = { up: false, down: false, left: false, right: false }

    function onKeyDown(e) {
      const dir = KEY_MAP[e.key]
      if (!dir) return
      e.preventDefault()
      if (!state[dir]) {
        state[dir] = true
        engine.setInput({ ...state })
      }
    }

    function onKeyUp(e) {
      const dir = KEY_MAP[e.key]
      if (!dir) return
      state[dir] = false
      engine.setInput({ ...state })
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      engineRef.current = null
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0b0e14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: DESIGN_W * SCALE,
          height: DESIGN_H * SCALE,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
        <ProjectCard
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      </div>
      <div
        style={{
          marginTop: '10px',
          fontSize: '10px',
          color: 'rgba(112, 144, 176, 0.7)',
          letterSpacing: '0.06em',
        }}
      >
        arrows / WASD to drive
      </div>
    </div>
  )
}
