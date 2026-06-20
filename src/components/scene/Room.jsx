// Room: 10 (W) x 4 (H) x 8 (D) units, camera sits inside.
// Built from plane meshes so normals face inward.
// Back wall (z=-4) has a window opening 3.2 wide x 1.8 tall, centered at y=0.2.

import { useMemo } from 'react'
import { floorWoodTexture, floorRoughnessTexture, wallPlasterTexture } from '../../lib/textures.js'

const HALF_W = 5   // half of 10
const HALF_H = 2   // half of 4
const HALF_D = 4   // half of 8

// Window opening dimensions and center
const WIN_W  = 3.2
const WIN_H  = 1.8
const WIN_CY = 0.2   // vertical center of window in world y

// Frame thickness (border + mullions around the opening)
const FRAME_T = 0.08
const FRAME_COLOR = '#4a3f35'
const WALL_COLOR  = '#e8e4dc'

// Derived window edges
const WIN_LEFT   = -WIN_W / 2
const WIN_RIGHT  =  WIN_W / 2
const WIN_BOTTOM =  WIN_CY - WIN_H / 2
const WIN_TOP    =  WIN_CY + WIN_H / 2

// Back wall is 10 wide x 4 tall. Split into 4 segments around the opening.
const aboveH  = HALF_H - WIN_TOP
const aboveCY = WIN_TOP + aboveH / 2
const belowH  = WIN_BOTTOM - (-HALF_H)
const belowCY = -HALF_H + belowH / 2
const leftW   = WIN_LEFT - (-HALF_W)
const leftCX  = -HALF_W + leftW / 2
const rightW  = HALF_W - WIN_RIGHT
const rightCX = WIN_RIGHT + rightW / 2

export default function Room() {
  // Procedural textures — created once, shared via module cache
  const floorMap     = useMemo(() => floorWoodTexture(), [])
  const floorRough   = useMemo(() => floorRoughnessTexture(), [])
  const wallMap      = useMemo(() => wallPlasterTexture(), [])

  // Repeat scales — floor planks span 2.5 units per tile; walls 3 units per tile
  useMemo(() => {
    floorMap.repeat.set(4, 3.2)    // 10/2.5 = 4 horizontal, 8/2.5 ≈ 3.2 vertical
    floorRough.repeat.set(4, 3.2)
    wallMap.repeat.set(3, 1.5)
  }, [floorMap, floorRough, wallMap])

  return (
    <group>
      {/* Floor — procedural wood planks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -HALF_H, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial
          map={floorMap}
          roughnessMap={floorRough}
          roughness={0.80}
          metalness={0.02}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALF_H, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#b8b8b0" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* ── Back wall: 4 segments leaving the window opening clear ── */}
      {/* Above window — full width, from WIN_TOP to ceiling */}
      <mesh position={[0, aboveCY, -HALF_D]} receiveShadow>
        <planeGeometry args={[10, aboveH]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* Below window — full width, from floor to WIN_BOTTOM */}
      <mesh position={[0, belowCY, -HALF_D]} receiveShadow>
        <planeGeometry args={[10, belowH]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* Left of window — only spans window vertical range */}
      <mesh position={[leftCX, WIN_CY, -HALF_D]} receiveShadow>
        <planeGeometry args={[leftW, WIN_H]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* Right of window — only spans window vertical range */}
      <mesh position={[rightCX, WIN_CY, -HALF_D]} receiveShadow>
        <planeGeometry args={[rightW, WIN_H]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* ── Window frame: 4 thin dark bars around the opening ── */}
      {/* Top bar */}
      <mesh position={[0, WIN_TOP + FRAME_T / 2, -HALF_D + 0.01]}>
        <boxGeometry args={[WIN_W + FRAME_T * 2, FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Bottom bar */}
      <mesh position={[0, WIN_BOTTOM - FRAME_T / 2, -HALF_D + 0.01]}>
        <boxGeometry args={[WIN_W + FRAME_T * 2, FRAME_T, FRAME_T]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Left bar */}
      <mesh position={[WIN_LEFT - FRAME_T / 2, WIN_CY, -HALF_D + 0.01]}>
        <boxGeometry args={[FRAME_T, WIN_H + FRAME_T * 2, FRAME_T]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Right bar */}
      <mesh position={[WIN_RIGHT + FRAME_T / 2, WIN_CY, -HALF_D + 0.01]}>
        <boxGeometry args={[FRAME_T, WIN_H + FRAME_T * 2, FRAME_T]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Front wall (Z = +HALF_D, faces -Z) */}
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, HALF_D]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* Left wall (X = -HALF_W, faces +X) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HALF_W, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>

      {/* Right wall (X = +HALF_W, faces -X) */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HALF_W, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial map={wallMap} roughness={0.88} metalness={0.0} envMapIntensity={0.3} />
      </mesh>
    </group>
  )
}
