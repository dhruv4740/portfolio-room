import { Suspense, lazy, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import Room from './components/scene/Room.jsx'
import Desk from './components/scene/Desk.jsx'
import Whiteboard from './components/scene/Whiteboard.jsx'
import Bookshelf from './components/scene/Bookshelf.jsx'
import Laptop from './components/scene/Laptop.jsx'
import AmbientLighting from './components/environment/AmbientLighting.jsx'
import GlitchEffect from './components/terminal/GlitchEffect.jsx'
import TerminalBoot from './components/terminal/TerminalBoot.jsx'
import CameraRig from './components/player/CameraRig.jsx'
import PlayerController from './components/player/PlayerController.jsx'
import HUD from './components/ui/HUD.jsx'
import ProjectCard from './game/ProjectCard.jsx'
import useStore from './store/useStore.js'

const Perf = import.meta.env.DEV ? lazy(() => import('r3f-perf').then(m => ({ default: m.Perf }))) : null
const CarGameStandalone = import.meta.env.DEV
  ? lazy(() => import('./game/CarGameStandalone.jsx'))
  : null

function SceneContents() {
  const phase = useStore((s) => s.phase)
  return (
    <>
      <AmbientLighting />
      <Room />
      <Desk />
      <Whiteboard />
      <Bookshelf />
      <Laptop />
      <CameraRig />
      {phase === 'WALKING' && <PlayerController />}
      {Perf && <Perf position="top-left" />}
      <EffectComposer>
        <GlitchEffect />
      </EffectComposer>
    </>
  )
}

// Vignette overlay — visible only during FOCUSED to frame the laptop screen
function FocusVignette() {
  const phase = useStore((s) => s.phase)
  if (phase !== 'FOCUSED') return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8,
        background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.72) 100%)',
      }}
    />
  )
}

export default function App() {
  // DEV-ONLY: ?game query param renders the car game standalone for testing
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('game')) {
    return (
      <Suspense fallback={null}>
        <CarGameStandalone />
      </Suspense>
    )
  }

  return <AppShell />
}

function AppShell() {
  const phase        = useStore((s) => s.phase)
  const setPhase     = useStore((s) => s.setPhase)
  const activeProject = useStore((s) => s.activeProject)
  const setActiveProject = useStore((s) => s.setActiveProject)

  // DEV-ONLY: ?focus query param — jump straight to FOCUSED for screenshot verification
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!new URLSearchParams(location.search).has('focus')) return
    if (phase === 'BOOT') {
      // Give TerminalBoot a tick to mount, then skip to FOCUSED
      const id = setTimeout(() => setPhase('FOCUSED'), 100)
      return () => clearTimeout(id)
    }
  }, [])  // run once on mount

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 1.7, 3], fov: 60, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
      <TerminalBoot />
      <HUD />
      <FocusVignette />
      {/* ProjectCard sits outside Canvas, reads activeProject from store */}
      {activeProject && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
          <ProjectCard
            project={activeProject}
            onClose={() => setActiveProject(null)}
          />
        </div>
      )}
    </>
  )
}
