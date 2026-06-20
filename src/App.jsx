import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import Room from './components/scene/Room.jsx'
import Desk from './components/scene/Desk.jsx'
import Whiteboard from './components/scene/Whiteboard.jsx'
import Bookshelf from './components/scene/Bookshelf.jsx'
import AmbientLighting from './components/environment/AmbientLighting.jsx'
import GlitchEffect from './components/terminal/GlitchEffect.jsx'
import TerminalBoot from './components/terminal/TerminalBoot.jsx'
import CameraRig from './components/player/CameraRig.jsx'
import PlayerController from './components/player/PlayerController.jsx'
import HUD from './components/ui/HUD.jsx'
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
      <CameraRig />
      {phase === 'WALKING' && <PlayerController />}
      {Perf && <Perf position="top-left" />}
      <EffectComposer>
        <GlitchEffect />
      </EffectComposer>
    </>
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
    </>
  )
}
