// Bookshelf against the RIGHT wall (x ≈ +4.7, facing -x into the room).
// Rotated -90° around Y so books face into the room toward the camera.
// Placed at z=-0.5 — well clear of the desk (x≈+2.8, z≈+2.5).

import { useMemo } from 'react'
import useStore from '../../store/useStore'
import { shelfWoodTexture } from '../../lib/textures.js'

const SHELF_COLOR  = '#7a5c3a'
const FRAME_COLOR  = '#5c4020'

// Books: [width, height, color]
const SHELF_BOOKS = [
  // top shelf
  [
    [0.12, 0.32, '#c0392b'],
    [0.09, 0.28, '#2980b9'],
    [0.14, 0.30, '#27ae60'],
    [0.10, 0.26, '#8e44ad'],
    [0.11, 0.31, '#e67e22'],
    [0.09, 0.27, '#16a085'],
    [0.13, 0.29, '#c0392b'],
    [0.10, 0.28, '#f39c12'],
  ],
  // mid shelf
  [
    [0.10, 0.26, '#2c3e50'],
    [0.13, 0.30, '#e74c3c'],
    [0.09, 0.25, '#1abc9c'],
    [0.12, 0.28, '#9b59b6'],
    [0.11, 0.27, '#3498db'],
    [0.14, 0.31, '#e67e22'],
    [0.09, 0.26, '#27ae60'],
  ],
  // bottom shelf
  [
    [0.13, 0.28, '#8e44ad'],
    [0.10, 0.25, '#c0392b'],
    [0.12, 0.30, '#2980b9'],
    [0.09, 0.26, '#f39c12'],
    [0.11, 0.29, '#16a085'],
    [0.14, 0.27, '#e74c3c'],
    [0.10, 0.28, '#2c3e50'],
    [0.09, 0.25, '#27ae60'],
  ],
]

function BookRow({ books, shelfTopY, xStart }) {
  let cursor = xStart
  return (
    <>
      {books.map(([w, h, color], i) => {
        const cx = cursor + w / 2
        cursor += w + 0.01  // small gap between books
        return (
          <mesh key={i} position={[cx, shelfTopY + h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, 0.22]} />
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.0} />
          </mesh>
        )
      })}
    </>
  )
}

export default function Bookshelf() {
  const setCursor = useStore((s) => s.setCursor)
  const bsX    = 4.7      // right wall at x=+5; front face of shelf ≈ x=4.4
  const bsZ    = -0.5     // mid-room on z axis, well clear of desk at z=+2.5
  const bsY    = -2       // base sits on the floor

  const frameW  = 2.4
  const frameH  = 2.2
  const frameD  = 0.3
  const plankT  = 0.06

  // Shelf heights from bottom of frame
  const shelfYs = [0.5, 1.1, 1.7]   // y above bsY

  // Procedural walnut-ish shelf wood
  const shelfMap = useMemo(() => shelfWoodTexture(), [])

  return (
    // rotation Y -90° → local +z (front of shelf) becomes world -x (facing into room)
    <group
      position={[bsX, bsY, bsZ]}
      rotation={[0, -Math.PI / 2, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setCursor('hover-object', 'skills') }}
      onPointerOut={() => setCursor('default', null)}
    >
      {/* Back panel — darker frame, no map needed (mostly hidden) */}
      <mesh position={[0, frameH / 2, -frameD / 2 + plankT / 2]} receiveShadow>
        <boxGeometry args={[frameW, frameH, plankT]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Left side */}
      <mesh position={[-frameW / 2 + plankT / 2, frameH / 2, 0]} castShadow>
        <boxGeometry args={[plankT, frameH, frameD]} />
        <meshStandardMaterial map={shelfMap} roughness={0.72} metalness={0.0} />
      </mesh>

      {/* Right side */}
      <mesh position={[frameW / 2 - plankT / 2, frameH / 2, 0]} castShadow>
        <boxGeometry args={[plankT, frameH, frameD]} />
        <meshStandardMaterial map={shelfMap} roughness={0.72} metalness={0.0} />
      </mesh>

      {/* Bottom plank */}
      <mesh position={[0, plankT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameW, plankT, frameD]} />
        <meshStandardMaterial map={shelfMap} roughness={0.72} metalness={0.0} />
      </mesh>

      {/* Top plank */}
      <mesh position={[0, frameH - plankT / 2, 0]} castShadow>
        <boxGeometry args={[frameW, plankT, frameD]} />
        <meshStandardMaterial map={shelfMap} roughness={0.72} metalness={0.0} />
      </mesh>

      {/* Horizontal shelves + books */}
      {shelfYs.map((sy, si) => (
        <group key={si}>
          {/* Shelf plank */}
          <mesh position={[0, sy, 0]} castShadow receiveShadow>
            <boxGeometry args={[frameW - plankT * 2, plankT, frameD]} />
            <meshStandardMaterial map={shelfMap} roughness={0.72} metalness={0.0} />
          </mesh>
          {/* Books sitting on top of this shelf */}
          <BookRow
            books={SHELF_BOOKS[si]}
            shelfTopY={sy + plankT / 2}
            xStart={-frameW / 2 + plankT + 0.04}
          />
        </group>
      ))}
    </group>
  )
}
