// Desk positioned in the front-right quadrant: x~+2.8, z~+2.5
// Desktop surface sits at y=-1.25 (≈0.75 above floor at y=-2).
// Decorative props: monitor, keyboard, mug, potted plant. No physics, no laptop.

export default function Desk() {
  const deskX = 2.8
  const deskZ = 2.5
  const deskY = -1.25   // top surface of desk
  const legH  = 0.75    // how tall the legs are below the tabletop
  const topThick = 0.08

  // Top surface center is at deskY; legs sit below it
  const legY = deskY - topThick / 2 - legH / 2  // center of legs

  return (
    <group position={[deskX, 0, deskZ]}>

      {/* Tabletop */}
      <mesh position={[0, deskY, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, topThick, 1.0]} />
        <meshStandardMaterial color="#c8a96e" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Four legs */}
      {[[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, legY, lz]} castShadow>
          <boxGeometry args={[0.07, legH, 0.07]} />
          <meshStandardMaterial color="#a07840" roughness={0.7} metalness={0.0} />
        </mesh>
      ))}

      {/* Monitor screen (thin box) */}
      <mesh position={[0.0, deskY + 0.55, -0.35]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.4}
          emissive="#0a0f1a" emissiveIntensity={0.6} />
      </mesh>
      {/* Monitor stand neck */}
      <mesh position={[0.0, deskY + 0.18, -0.35]} castShadow>
        <boxGeometry args={[0.06, 0.24, 0.06]} />
        <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Monitor stand base */}
      <mesh position={[0.0, deskY + 0.04, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.04, 0.16]} />
        <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0.0, deskY + 0.02, -0.05]} castShadow>
        <boxGeometry args={[0.55, 0.025, 0.18]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Ceramic mug — removed; physics version lives in PhysicsObjects.jsx */}

      {/* Potted plant — pot */}
      <mesh position={[0.8, deskY + 0.07, -0.3]} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.1, 12]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} metalness={0.0} />
      </mesh>
      {/* Plant soil */}
      <mesh position={[0.8, deskY + 0.12, -0.3]}>
        <cylinderGeometry args={[0.068, 0.068, 0.01, 12]} />
        <meshStandardMaterial color="#3b2210" roughness={1.0} />
      </mesh>
      {/* Green foliage — three overlapping spheres */}
      <mesh position={[0.8, deskY + 0.28, -0.3]} castShadow>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#3a7d44" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[0.74, deskY + 0.22, -0.3]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#2d6e36" roughness={0.9} metalness={0.0} />
      </mesh>
      <mesh position={[0.86, deskY + 0.22, -0.28]} castShadow>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color="#4a8f54" roughness={0.9} metalness={0.0} />
      </mesh>

    </group>
  )
}
