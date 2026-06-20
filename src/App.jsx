import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Room from './components/scene/Room.jsx'
import AmbientLighting from './components/environment/AmbientLighting.jsx'

const Perf = import.meta.env.DEV ? lazy(() => import('r3f-perf').then(m => ({ default: m.Perf }))) : null

export default function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.7, 3], fov: 60, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <AmbientLighting />
        <Room />
        <OrbitControls
          target={[0, 1.0, 0]}
          minDistance={0.5}
          maxDistance={9}
        />
        {Perf && <Perf position="top-left" />}
      </Suspense>
    </Canvas>
  )
}
