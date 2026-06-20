import { Suspense, lazy, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from '@react-three/postprocessing'
import { Environment, ContactShadows } from '@react-three/drei'
import Room from './components/scene/Room.jsx'
import Desk from './components/scene/Desk.jsx'
import Whiteboard from './components/scene/Whiteboard.jsx'
import Bookshelf from './components/scene/Bookshelf.jsx'
import Laptop from './components/scene/Laptop.jsx'
import HologramChart from './components/scene/HologramChart.jsx'
import AmbientLighting from './components/environment/AmbientLighting.jsx'
import TimeBasedSky from './components/environment/TimeBasedSky.jsx'
import ParticleField from './components/environment/ParticleField.jsx'
import GlitchEffect from './components/terminal/GlitchEffect.jsx'
import TerminalBoot from './components/terminal/TerminalBoot.jsx'
import CameraRig from './components/player/CameraRig.jsx'
import PlayerController from './components/player/PlayerController.jsx'
import HUD from './components/ui/HUD.jsx'
import CustomCursor from './components/ui/CustomCursor.jsx'
import SoundToggle from './components/ui/SoundToggle.jsx'
import KonamiOverlay from './components/ui/KonamiOverlay.jsx'
import DuckBadge from './components/ui/DuckBadge.jsx'
import LoadingScreen from './components/ui/LoadingScreen.jsx'
import MobileBanner from './components/ui/MobileBanner.jsx'
import ProjectCard from './game/ProjectCard.jsx'
import useStore from './store/useStore.js'
import useLocalTime from './hooks/useLocalTime.js'
import useAudio from './hooks/useAudio.js'

// Lazy-load Rapier physics — keeps the WASM in a separate async chunk
// so it doesn't block the initial bundle parse. Skipped entirely on mobile.
const PhysicsObjects = lazy(() => import('./components/scene/PhysicsObjects.jsx'))

const Perf = import.meta.env.DEV ? lazy(() => import('r3f-perf').then(m => ({ default: m.Perf }))) : null
const CarGameStandalone = import.meta.env.DEV
  ? lazy(() => import('./game/CarGameStandalone.jsx'))
  : null

// DEV-ONLY: positions the camera to view the desk + hologram when ?survey is active.
// Uses useFrame (priority 100) to run after OrbitControls so it wins every frame.
// Survey camera constants
// Room: 10W x 4H x 8D. Walls at x=±5, z=±4, floor y=-2, ceiling y=+2.
// Desk world centre: [2.8, -1.25, 2.5]; hologram floats at y=-0.75.
// Camera slightly left + in front of desk, elevated, looking right+down at hologram.
const _surveyCamPos    = new THREE.Vector3(0.8, 0.3, 3.6)
const _surveyLookAt    = new THREE.Vector3(2.8, -0.75, 2.2)

function SurveyCamera() {
  const { camera } = useThree()
  // OrbitControls is suppressed in ?survey mode, so a one-shot effect is enough.
  useEffect(() => {
    camera.position.copy(_surveyCamPos)
    camera.lookAt(_surveyLookAt)
  }, [camera])
  return null
}

function SceneContents() {
  const phase    = useStore((s) => s.phase)
  const isMobile = useStore((s) => s.isMobile)
  // Keep store.localHour in sync with real time (or ?hour= override in DEV)
  useLocalTime()

  const isSurvey = import.meta.env.DEV &&
    new URLSearchParams(location.search).has('survey')

  return (
    <>
      {/* ── Image-based lighting (IBL) ────────────────────────────────────
          'apartment' preset gives a warm interior fill; background=false keeps
          our custom sky/window untouched. Wrapped in Suspense so a CDN hiccup
          can't crash the scene. environmentIntensity kept low so it's a subtle
          fill + reflection source, not a washout over AmbientLighting. */}
      <Suspense fallback={null}>
        <Environment
          preset="apartment"
          background={false}
          environmentIntensity={0.28}
        />
      </Suspense>

      <AmbientLighting />
      <TimeBasedSky />
      <ParticleField />
      <Room />
      <Desk />
      <Whiteboard />
      <Bookshelf />
      <Laptop />
      <HologramChart />

      {/* ── Contact shadows under desk area ──────────────────────────────
          Grounding blob shadow so props don't float above the desk surface.
          Positioned at floor level (y=-2). Narrow opacity so it's a hint,
          not a hard dark patch. blur kept high for soft spread. */}
      <ContactShadows
        position={[2.8, -1.99, 2.5]}
        width={2.6}
        height={1.2}
        far={1.2}
        blur={2.8}
        opacity={0.38}
        color="#1a0e06"
      />

      {/* PhysicsObjects: lazy-loaded (separate rapier WASM chunk), skipped on mobile */}
      {!isMobile && (
        <Suspense fallback={null}>
          <PhysicsObjects />
        </Suspense>
      )}
      {isSurvey && <SurveyCamera />}
      <CameraRig />
      {/* PlayerController uses pointer-lock — desktop only */}
      {!isMobile && phase === 'WALKING' && <PlayerController />}
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
  const isMobile     = useStore((s) => s.isMobile)

  // Phase 13: audio system lifecycle (mounts Howl instances on first enable)
  useAudio()

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

  // DEV-ONLY: ?survey query param — skip to CINEMATIC to view desk + hologram
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!new URLSearchParams(location.search).has('survey')) return
    if (phase === 'BOOT') {
      const id = setTimeout(() => setPhase('CINEMATIC'), 100)
      return () => clearTimeout(id)
    }
  }, [])  // run once on mount

  return (
    <>
      {/* Loading screen: sits above Canvas, fades when sceneLoaded → true */}
      <LoadingScreen />
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
      <SoundToggle />
      {/* Custom cursor is pointer-based — don't show on touch devices */}
      {!isMobile && <CustomCursor />}
      <FocusVignette />
      <KonamiOverlay />
      <DuckBadge />
      {/* Mobile notice */}
      {isMobile && <MobileBanner />}
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
