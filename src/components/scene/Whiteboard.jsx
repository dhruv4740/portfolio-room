import { Text } from '@react-three/drei'
import { ABOUT } from '../../data/about.js'

// Whiteboard on the LEFT wall (x = -5, facing +x into the room).
// Board center at x=-4.9, z=0, y≈0 (vertically centered in room).
// Text is positioned just in front of the board surface at x=-4.82.

export default function Whiteboard() {
  const wallX   = -4.9
  const boardW  = 3.0
  const boardH  = 1.6
  const boardY  = 0.2   // slightly above room center, comfortable reading height
  const frameT  = 0.06  // frame thickness
  const surfaceX = wallX + 0.02   // board surface, flush to wall + small gap
  const textX    = wallX + 0.06   // text in front of surface to avoid z-fight

  return (
    <group>
      {/* White surface */}
      <mesh
        position={[surfaceX, boardY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[boardW, boardH]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.4} metalness={0.0} />
      </mesh>

      {/* Dark frame — top */}
      <mesh position={[surfaceX, boardY + boardH / 2, 0]} castShadow>
        <boxGeometry args={[frameT, frameT, boardW + frameT * 2]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* bottom */}
      <mesh position={[surfaceX, boardY - boardH / 2, 0]} castShadow>
        <boxGeometry args={[frameT, frameT, boardW + frameT * 2]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* left */}
      <mesh position={[surfaceX, boardY, boardW / 2 + frameT / 2]} castShadow>
        <boxGeometry args={[frameT, boardH, frameT]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* right */}
      <mesh position={[surfaceX, boardY, -boardW / 2 - frameT / 2]} castShadow>
        <boxGeometry args={[frameT, boardH, frameT]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Name — large */}
      <Text
        position={[textX, boardY + 0.42, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.22}
        color="#1a1a1a"
        anchorX="left"
        anchorY="middle"
        maxWidth={2.6}
      >
        {ABOUT.name}
      </Text>

      {/* Role — medium */}
      <Text
        position={[textX, boardY + 0.10, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.13}
        color="#333"
        anchorX="left"
        anchorY="middle"
        maxWidth={2.6}
      >
        {ABOUT.role}
      </Text>

      {/* Bio — smaller */}
      <Text
        position={[textX, boardY - 0.20, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.10}
        color="#555"
        anchorX="left"
        anchorY="middle"
        maxWidth={2.6}
      >
        {ABOUT.bio}
      </Text>
    </group>
  )
}
