import { Suspense, lazy, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, SSAO, Vignette, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Environment, Lightformer, ContactShadows } from '@react-three/drei'
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
      {/* ── Self-contained IBL via Lightformers (no CDN, no file fetch) ────
          Three Lightformers bake into a 256px env-map at mount time.
          • Cool blue-white rectangle simulates the window wall (−Z, elevated)
          • Warm orange fill from above-right mimics the pendant lamp area
          • Soft neutral top-fill for gentle ambient bounce on metals/ceramics
          background=false so our custom sky plane remains the backdrop.
          environmentIntensity is intentionally low — just enough for IBL
          reflections on the laptop, desk metal, and hologram without washing
          out the time-of-day lighting from AmbientLighting. */}
      <Environment
        background={false}
        resolution={256}
        environmentIntensity={0.22}
      >
        {/* Window wall: cool blue-white, large area, coming from -Z direction */}
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#aac8ff"
          position={[0, 1.0, -6]}
          scale={[6, 3, 1]}
          target={[0, 0, 0]}
        />
        {/* Pendant / warm ceiling fill: amber from above */}
        <Lightformer
          form="circle"
          intensity={0.9}
          color="#ffcf80"
          position={[1.5, 3.5, 1.5]}
          scale={[1.5, 1.5, 1]}
          target={[2, -1, 2]}
        />
        {/* Soft neutral side/top for general ambient on surfaces */}
        <Lightformer
          form="rect"
          intensity={0.45}
          color="#e8e8f0"
          position={[-3, 2.5, 0]}
          scale={[2, 4, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

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
      {/* ── Cinematic post-processing stack ─────────────────────────────────
          Order (within each EffectPass, effects run top→bottom):
            1. ToneMapping  — ACES Filmic grade; must be first so downstream
               effects operate on tonemapped colours. The EffectComposer sets
               gl.toneMapping=NoToneMapping, so this is the ONLY tone map.
            2. Bloom        — threshold-based; only pixels above luminance 0.82
               bloom (hologram cyan, laptop/game screen, night stars, pendant).
               Room at standard brightness stays unaffected.
            3. SSAO         — subtle contact darkening in corners / under props.
               enableNormalPass is set on the composer so the normal texture
               is available. Samples kept low (16) for perf; intensity 0.6.
            4. Vignette     — subtle edge darkening, darkness 0.5.
            5. GlitchEffect — custom boot-reveal + idle shimmer; sits after the
               grade effects so its colour shifts interact with toned output.
            6. SMAA         — SMAA is a convolution effect → the composer wraps
               it in its own EffectPass automatically, always last.
          Sky (toneMapped=false) and particles (ShaderMaterial) bypass the
          renderer toneMapping anyway and are unaffected by this stack. */}
      <EffectComposer enableNormalPass multisampling={4}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Bloom
          luminanceThreshold={0.82}
          luminanceSmoothing={0.08}
          intensity={0.55}
          radius={0.55}
          mipmapBlur
        />
        <SSAO
          samples={16}
          rings={3}
          radius={8}
          intensity={0.6}
          luminanceInfluence={0.7}
          bias={0.04}
        />
        <Vignette darkness={0.5} offset={0.25} />
        <GlitchEffect />
        <SMAA />
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
