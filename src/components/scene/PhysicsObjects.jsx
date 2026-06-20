// PhysicsObjects — desk physics: fixed colliders + dynamic mug + paper stack.
//
// Desk world position: group at [2.8, 0, 2.5], tabletop at y=-1.25 (center),
// thickness=0.08, so top surface (resting plane) = y = -1.25 + 0.04 = -1.21.
//
// Mug rests at local [-0.75, deskY+0.08, -0.2] inside desk group.
// World mug centre: [2.8-0.75, -1.17, 2.5-0.2] = [2.05, -1.17, 2.3]
// Half-height of mug = 0.05 → bottom at -1.22 ≈ resting surface -1.21 (close enough, let Rapier settle).
//
// Paper stack is new — placed at local [0.35, deskY+0.025, 0.1] → world [3.15, -1.225, 2.6]
// Stack: width=0.22, height=0.03, depth=0.16 (thin flat pile of papers)

import { useRef } from 'react'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'

// Desk geometry constants (must match Desk.jsx)
const DESK_X     = 2.8
const DESK_Z     = 2.5
const DESK_TOP_Y = -1.25          // centre of tabletop mesh
const TOP_THICK  = 0.08
const TOP_SURF_Y = DESK_TOP_Y + TOP_THICK / 2  // -1.21 — the resting plane

// Tabletop collider half-extents
const TOP_HX = 2.2 / 2   // 1.1
const TOP_HY = TOP_THICK / 2  // 0.04
const TOP_HZ = 1.0 / 2   // 0.5

// Floor at y=-2, spanning the room (10 wide x 8 deep)
const FLOOR_Y   = -2
const FLOOR_HX  = 5
const FLOOR_HY  = 0.05
const FLOOR_HZ  = 4

// ---------- Mug ----------
// Local desk-group offset: [-0.75, deskY+0.08, -0.2]  →  world:
const MUG_X = DESK_X + (-0.75)   // 2.05
const MUG_Y = TOP_SURF_Y + 0.05  // half-height above surface: 0.05 → rest at -1.16
const MUG_Z = DESK_Z + (-0.2)    // 2.3
// Mug collider: cylinderGeometry args=[0.055, 0.05, 0.1, 16] → use cuboid 0.06×0.05×0.06
const MUG_HX = 0.06
const MUG_HY = 0.05
const MUG_HZ = 0.06

// ---------- Paper stack ----------
// New prop placed to the right side of desk, local [0.35, deskY+0.025, 0.1]
const PAP_X  = DESK_X + 0.35     // 3.15
const PAP_Y  = TOP_SURF_Y + 0.015 + 0.001  // half-height 0.015 above surface + tiny gap
const PAP_Z  = DESK_Z + 0.1      // 2.6
const PAP_W  = 0.22              // width
const PAP_H  = 0.03              // height (thin stack)
const PAP_D  = 0.16              // depth

export default function PhysicsObjects() {
  const mugRef = useRef()
  const papRef = useRef()

  function knockMug(e) {
    e.stopPropagation()
    if (!mugRef.current) return
    // Upward + outward impulse (away from monitor, slightly up)
    mugRef.current.applyImpulse({ x: -0.08, y: 0.12, z: 0.06 }, true)
  }

  function knockPapers(e) {
    e.stopPropagation()
    if (!papRef.current) return
    // Impulse that sends papers sliding off the side + a small upward kick
    papRef.current.applyImpulse({ x: 0.06, y: 0.08, z: 0.05 }, true)
  }

  return (
    <Physics gravity={[0, -9.81, 0]}>

      {/* ── Fixed: desk top surface ── */}
      <RigidBody type="fixed">
        <CuboidCollider
          args={[TOP_HX, TOP_HY, TOP_HZ]}
          position={[DESK_X, DESK_TOP_Y, DESK_Z]}
        />
      </RigidBody>

      {/* ── Fixed: room floor ── */}
      <RigidBody type="fixed">
        <CuboidCollider
          args={[FLOOR_HX, FLOOR_HY, FLOOR_HZ]}
          position={[0, FLOOR_Y - FLOOR_HY, 0]}
        />
      </RigidBody>

      {/* ── Dynamic: ceramic mug ── */}
      <RigidBody
        ref={mugRef}
        type="dynamic"
        position={[MUG_X, MUG_Y, MUG_Z]}
        canSleep
        colliders={false}
        mass={0.3}
      >
        <CuboidCollider args={[MUG_HX, MUG_HY, MUG_HZ]} />
        {/* Visual mesh */}
        <mesh castShadow onClick={knockMug}>
          <cylinderGeometry args={[0.055, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#e8cfa0" roughness={0.5} metalness={0.0} />
        </mesh>
      </RigidBody>

      {/* ── Dynamic: paper stack ── */}
      <RigidBody
        ref={papRef}
        type="dynamic"
        position={[PAP_X, PAP_Y, PAP_Z]}
        canSleep
        colliders={false}
        mass={0.15}
      >
        <CuboidCollider args={[PAP_W / 2, PAP_H / 2, PAP_D / 2]} />
        {/* Visual mesh — slightly creamy white */}
        <mesh castShadow onClick={knockPapers}>
          <boxGeometry args={[PAP_W, PAP_H, PAP_D]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.9} metalness={0.0} />
        </mesh>
        {/* Top sheet slight colour variation */}
        <mesh position={[0, PAP_H / 2 + 0.001, 0]}>
          <boxGeometry args={[PAP_W - 0.01, 0.002, PAP_D - 0.01]} />
          <meshStandardMaterial color="#ede8dc" roughness={0.9} metalness={0.0} />
        </mesh>
      </RigidBody>

    </Physics>
  )
}
