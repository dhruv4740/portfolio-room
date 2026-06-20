import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import Room from './components/scene/Room.jsx'
import AmbientLighting from './components/environment/AmbientLighting.jsx'
import GlitchEffect from './components/terminal/GlitchEffect.jsx'
import TerminalBoot from './components/terminal/TerminalBoot.jsx'
import CameraRig from './components/player/CameraRig.jsx'
import PlayerController from './components/player/PlayerController.jsx'
import HUD from './components/ui/HUD.jsx'
import useStore from './store/useStore.js'

const Perf = import.meta.env.DEV ? lazy(() => import('r3f-perf').then(m => ({ default: m.Perf }))) : null

function SceneContents() {
  const phase = useStore((s) => s.phase)
  return (
    <>
      <AmbientLighting />
      <Room />
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
