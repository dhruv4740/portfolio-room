/**
 * Laptop — open laptop sitting on the desk, rendering the CarGame on its screen.
 *
 * World position: [2.8, -1.21, 2.2]  (desk surface at y=-1.21, laptop slightly forward)
 * Screen faces toward -Z (toward room interior / approaching player at z≈2).
 *
 * Lid angle: 105° open (105° from closed = 15° past vertical, screen tilted toward player).
 *   lidRotX = -105 * PI/180  (rotation around X axis at hinge)
 *
 * Screen world center (computed analytically):
 *   Hinge local: [0, 0.03, -0.11]
 *   Lid half-height in lid-local: 0.11
 *   After rotation: y += sin(75°)*0.11 = 0.1063, z += cos(75°)*0.11 = 0.0285
 *   Screen world ≈ [2.8, -1.21 + 0.03 + 0.1063, 2.2 - 0.11 + 0.0285] ≈ [2.8, -1.0737, 2.1185]
 *
 * Exported constants for CameraRig FOCUSED tween:
 *   LAPTOP_SCREEN_POS — world position of screen center
 *   LAPTOP_FOCUSED_CAM — camera position for FOCUSED view
 *   LAPTOP_FOCUSED_TARGET — lookAt target for FOCUSED view
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CarGame, DESIGN_W, DESIGN_H } from '../../game/carGame.js'
import { PROJECTS } from '../../data/projects.js'
import useStore from '../../store/useStore.js'

// ---------------------------------------------------------------------------
// Exported geometry constants (used by CameraRig)
// ---------------------------------------------------------------------------

const BASE_H    = 0.03
const LID_H     = 0.22
const DESK_SURF = -1.21       // world y of desk surface
const LAPTOP_X  = 2.8
const LAPTOP_Z  = 2.2         // slightly forward of desk center (2.5), toward room
const HINGE_LOCAL_Z = -0.11   // back edge of base
const LID_OPEN_DEG  = 105
const LID_OPEN_RAD  = (LID_OPEN_DEG * Math.PI) / 180

// Hinge world position
const HINGE_WORLD_Y = DESK_SURF + BASE_H
const HINGE_WORLD_Z = LAPTOP_Z + HINGE_LOCAL_Z

// Screen center in lid-local after rotation (from hinge pivot):
//   lid half-height = LID_H/2 up the lid face
//   angle from vertical = LID_OPEN_DEG - 90 = 15° tilt toward player (negative z)
const LID_HALF = LID_H / 2
const ANG_FROM_VERT = LID_OPEN_RAD - Math.PI / 2  // 15° = 0.2618 rad
const SCR_DY = Math.cos(ANG_FROM_VERT) * LID_HALF   // ≈ 0.106
const SCR_DZ = Math.sin(ANG_FROM_VERT) * LID_HALF   // ≈ 0.028

export const LAPTOP_SCREEN_POS = [
  LAPTOP_X,
  HINGE_WORLD_Y + SCR_DY,
  HINGE_WORLD_Z + SCR_DZ,
]

// FOCUSED camera: 0.55 units in front of screen (toward room / +z direction from screen)
export const LAPTOP_FOCUSED_CAM = [
  LAPTOP_X,
  LAPTOP_SCREEN_POS[1] + 0.12,   // slightly above screen center for natural viewing
  LAPTOP_SCREEN_POS[2] + 0.55,
]

export const LAPTOP_FOCUSED_TARGET = [...LAPTOP_SCREEN_POS]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Laptop() {
  const phase          = useStore((s) => s.phase)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const setLaptopPrompt  = useStore((s) => s.setLaptopPrompt)
  const setCursor        = useStore((s) => s.setCursor)
  const { camera }     = useThree()

  // ---------------------------------------------------------------------------
  // Game engine + CanvasTexture — created once
  // ---------------------------------------------------------------------------
  const { engine, texture } = useMemo(() => {
    const offscreen = document.createElement('canvas')
    offscreen.width  = DESIGN_W
    offscreen.height = DESIGN_H

    const eng = new CarGame({
      onCheckpoint: (project) => useStore.getState().setActiveProject(project),
      projects: PROJECTS,
    })
    eng.mount(offscreen)

    const tex = new THREE.CanvasTexture(offscreen)
    tex.colorSpace = THREE.SRGBColorSpace
    // flipY=true is the CanvasTexture default; Canvas2D is top-down, WebGL expects
    // bottom-up — flipY=true corrects this so the game renders upright.
    tex.flipY = true

    return { engine: eng, texture: tex }
  }, [])

  // Dispose texture on unmount
  useEffect(() => {
    return () => texture.dispose()
  }, [texture])

  // ---------------------------------------------------------------------------
  // Frame loop — always animate the screen
  // ---------------------------------------------------------------------------
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)  // cap at 50ms to avoid large steps
    engine.frame(delta)
    texture.needsUpdate = true
  })

  // ---------------------------------------------------------------------------
  // Input — only wire Arrow/WASD to engine while FOCUSED
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'FOCUSED') {
      // Zero input on detach so car doesn't keep driving
      engine.setInput({ up: false, down: false, left: false, right: false })
      return
    }

    function onKeyDown(e) {
      const map = keyToInput(e.code)
      if (map) engine.setInput(map)
    }
    function onKeyUp(e) {
      const map = keyToInputOff(e.code)
      if (map) engine.setInput(map)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      engine.setInput({ up: false, down: false, left: false, right: false })
    }
  }, [phase, engine])

  // ---------------------------------------------------------------------------
  // Proximity detection — check distance to laptop each frame while WALKING
  // ---------------------------------------------------------------------------
  const laptopPos = useMemo(() => new THREE.Vector3(LAPTOP_X, LAPTOP_SCREEN_POS[1], LAPTOP_Z), [])
  const inRangeRef = useRef(false)

  useFrame(() => {
    if (phase !== 'WALKING') {
      if (inRangeRef.current) {
        inRangeRef.current = false
        setLaptopPrompt(false)
      }
      return
    }

    const dist = camera.position.distanceTo(laptopPos)
    const near = dist < 2.5

    if (near !== inRangeRef.current) {
      inRangeRef.current = near
      setLaptopPrompt(near)
    }
  })

  // E key handler — enter FOCUSED when near laptop in WALKING
  useEffect(() => {
    if (phase !== 'WALKING') return
    const setPhase = useStore.getState().setPhase

    function onKeyDown(e) {
      if (e.code !== 'KeyE') return
      if (!inRangeRef.current) return
      setPhase('FOCUSED')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase])

  // ---------------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------------
  const BASE_W    = 0.35
  const BASE_D    = 0.22
  const LID_D     = 0.016
  const LID_W     = 0.34
  const SCR_W     = 0.30
  const SCR_H     = LID_H - 0.025  // small bezel top/bottom
  const LID_ROT   = -(LID_OPEN_RAD)  // negative = rotate screen top toward player

  // Lid pivot is at the back-top edge of the base
  // Base sits at y=0 in group (desk surface), center at BASE_H/2
  // Group world position: LAPTOP_X, DESK_SURF, LAPTOP_Z
  const groupPos = [LAPTOP_X, DESK_SURF, LAPTOP_Z]

  return (
    <group position={groupPos}>
      {/* --- Base / keyboard slab --- */}
      <mesh position={[0, BASE_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Keyboard surface (slightly recessed visual) */}
      <mesh position={[0, BASE_H + 0.0005, 0.01]}>
        <boxGeometry args={[BASE_W - 0.04, 0.001, BASE_D - 0.05]} />
        <meshStandardMaterial color="#111113" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* --- Lid — pivot at hinge point (back of base, top) --- */}
      {/* We use a group whose origin is at the hinge point, then rotate from there */}
      <group position={[0, BASE_H, HINGE_LOCAL_Z]}>
        <group rotation={[LID_ROT, 0, 0]}>
          {/* Lid panel — center is half-height up from pivot */}
          <mesh position={[0, LID_HALF, 0]} castShadow>
            <boxGeometry args={[LID_W, LID_H, LID_D]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.5} metalness={0.6} />
          </mesh>

          {/* Screen — on the inner face (+z face of lid, faces room interior) */}
          {/* Inner face z = +LID_D/2, screen sits flush on it */}
          <mesh
            position={[0, LID_HALF, LID_D / 2 + 0.0005]}
            onPointerOver={(e) => { e.stopPropagation(); setCursor('hover-object', 'laptop') }}
            onPointerOut={() => setCursor('default', null)}
          >
            <planeGeometry args={[SCR_W, SCR_H]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>

          {/* Thin Apple-style logo glow on outer face (optional, tasteful) */}
          <mesh position={[0, LID_HALF, -(LID_D / 2 + 0.0005)]}>
            <planeGeometry args={[0.05, 0.05]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------

function keyToInput(code) {
  switch (code) {
    case 'ArrowUp':    case 'KeyW': return { up: true }
    case 'ArrowDown':  case 'KeyS': return { down: true }
    case 'ArrowLeft':  case 'KeyA': return { left: true }
    case 'ArrowRight': case 'KeyD': return { right: true }
    default: return null
  }
}

function keyToInputOff(code) {
  switch (code) {
    case 'ArrowUp':    case 'KeyW': return { up: false }
    case 'ArrowDown':  case 'KeyS': return { down: false }
    case 'ArrowLeft':  case 'KeyA': return { left: false }
    case 'ArrowRight': case 'KeyD': return { right: false }
    default: return null
  }
}
