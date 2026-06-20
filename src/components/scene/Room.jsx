// Room: 10 (W) x 4 (H) x 8 (D) units, camera sits inside.
// Built from plane meshes so normals face inward.

const HALF_W = 5   // half of 10
const HALF_H = 2   // half of 4
const HALF_D = 4   // half of 8

export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -HALF_H, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#8b6f47" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, HALF_H, 0]}
      >
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#b0b0a8" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Back wall (Z = -HALF_D, faces +Z toward camera) */}
      <mesh position={[0, 0, -HALF_D]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Front wall (Z = +HALF_D, faces -Z) */}
      <mesh
        rotation={[0, Math.PI, 0]}
        position={[0, 0, HALF_D]}
        receiveShadow
      >
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Left wall (X = -HALF_W, faces +X) */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-HALF_W, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Right wall (X = +HALF_W, faces -X) */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[HALF_W, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.8} metalness={0.0} />
      </mesh>
    </group>
  )
}
