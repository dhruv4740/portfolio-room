// Desk positioned in the front-right quadrant: x~+2.8, z~+2.5
// Desktop surface sits at y=-1.25 (≈0.75 above floor at y=-2).
// Decorative props: monitor (scrolling terminal), keyboard, potted plant.
// Easter eggs: rubber duck hidden behind monitor (Phase 14).

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { audioPlay } from '../../hooks/useAudio.js'
import { incrementDuckCount } from '../ui/DuckBadge.jsx'

// ---------------------------------------------------------------------------
// Terminal lines for the scrolling monitor screen
// ---------------------------------------------------------------------------
const TERMINAL_LINES = [
  '> npm run dev',
  '  vite v5 ready :5173',
  '> git log --oneline',
  '  c7032ca feat: phase 14',
  '  ad8e2ca feat: design UX',
  '  ca23b4a feat: initial',
  '> node scripts/verify.mjs',
  '  [harness] server ready',
  '  [harness] CINEMATIC ok',
  '  [harness] done.',
  '> // why does this work at 2am',
  '> // it always does',
  '> ping localhost',
  '  64b 127.0.0.1 t=0.042ms',
  '> cat CLAUDE.md | head -2',
  '  # Global Dev Directives',
  '  No filler, no pleasantries.',
  '> _',
]

const LINE_H   = 14
const CANVAS_W = 256
const CANVAS_H = 128

// ---------------------------------------------------------------------------
// Scrolling terminal screen
// ---------------------------------------------------------------------------
function MonitorScreen({ position }) {
  const scrollRef = useRef(0)
  const texRef    = useRef(null)
  const ctxRef    = useRef(null)

  // Build canvas + texture once
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas  = document.createElement('canvas')
    canvas.width  = CANVAS_W
    canvas.height = CANVAS_H
    ctxRef.current = canvas.getContext('2d')
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    texRef.current = tex
    return tex
  }, [])

  useFrame((_, delta) => {
    const ctx = ctxRef.current
    const tex = texRef.current
    if (!ctx || !tex) return

    scrollRef.current += delta * 8   // 8 px/s scroll speed

    ctx.fillStyle = '#050f05'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.font      = '10px monospace'
    ctx.fillStyle = '#00e060'

    const scroll    = scrollRef.current
    const startLine = Math.floor(scroll / LINE_H) % TERMINAL_LINES.length
    const rowCount  = Math.ceil(CANVAS_H / LINE_H) + 1

    for (let row = 0; row < rowCount; row++) {
      const lineIdx = (startLine + row) % TERMINAL_LINES.length
      const y       = row * LINE_H - (scroll % LINE_H) + LINE_H
      ctx.fillText(TERMINAL_LINES[lineIdx], 4, y)
    }

    tex.needsUpdate = true
  })

  if (!texture) return null

  return (
    <mesh position={position}>
      <planeGeometry args={[0.84, 0.49]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Rubber Duck — sphere body + sphere head + cone beak
// Hidden behind the monitor.
// position = LOCAL coords (inside the desk group)
// ---------------------------------------------------------------------------
function RubberDuck({ localPosition, deskWorldOffset }) {
  const { scene } = useThree()
  const [lx, ly, lz] = localPosition
  const [dx, , dz]   = deskWorldOffset

  function spawnParticles() {
    // World position of duck
    const wx = dx + lx
    const wy = ly
    const wz = dz + lz

    const N = 24
    const positions = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      positions[i * 3]     = wx + (Math.random() - 0.5) * 0.08
      positions[i * 3 + 1] = wy + (Math.random() - 0.5) * 0.08 + 0.08
      positions[i * 3 + 2] = wz + (Math.random() - 0.5) * 0.08
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: '#ffe000', size: 0.04, sizeAttenuation: true })
    const pts = new THREE.Points(geo, mat)
    scene.add(pts)

    const vels = Array.from({ length: N }, () => ({
      x: (Math.random() - 0.5) * 1.0,
      y: Math.random() * 1.5 + 0.3,
      z: (Math.random() - 0.5) * 1.0,
    }))

    let elapsed = 0
    const pos   = geo.attributes.position

    function step() {
      elapsed += 0.016
      if (elapsed > 0.6) {
        scene.remove(pts)
        geo.dispose()
        mat.dispose()
        return
      }
      for (let i = 0; i < N; i++) {
        pos.setX(i, pos.getX(i) + vels[i].x * 0.016)
        pos.setY(i, pos.getY(i) + vels[i].y * 0.016 - 4.9 * 0.016 * 0.016)
        pos.setZ(i, pos.getZ(i) + vels[i].z * 0.016)
      }
      pos.needsUpdate = true
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  function handleClick(e) {
    e.stopPropagation()
    audioPlay('duck')
    const count = incrementDuckCount()
    window.dispatchEvent(new CustomEvent('duck:found', { detail: count }))
    spawnParticles()
  }

  const headY = ly + 0.055
  const beakZ = lz + 0.04

  return (
    <>
      {/* Body */}
      <mesh position={[lx, ly, lz]} onClick={handleClick}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#ffe000" roughness={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[lx, headY, lz]} onClick={handleClick}>
        <sphereGeometry args={[0.033, 10, 10]} />
        <meshStandardMaterial color="#ffe000" roughness={0.5} />
      </mesh>
      {/* Beak — orange cone, rotated to point forward (+z) */}
      <mesh position={[lx, headY, beakZ]} rotation={[Math.PI / 2, 0, 0]} onClick={handleClick}>
        <coneGeometry args={[0.012, 0.03, 8]} />
        <meshStandardMaterial color="#ff8800" roughness={0.5} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main Desk
// ---------------------------------------------------------------------------
export default function Desk() {
  const deskX = 2.8
  const deskZ = 2.5
  const deskY = -1.25
  const legH  = 0.75
  const topThick = 0.08
  const legY = deskY - topThick / 2 - legH / 2

  // Duck local position (inside group, so group offset is [deskX,0,deskZ])
  // Place it behind the monitor: monitor center z=-0.35, duck at z=-0.52
  const duckLocal   = [0.0, deskY + 0.05, -0.52]
  const deskOffset  = [deskX, 0, deskZ]

  // Monitor screen face: bezel front face at z = -0.35 + 0.02 = -0.33
  const screenZ = -0.33 - 0.001   // just in front of bezel face

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

      {/* Monitor bezel */}
      <mesh position={[0.0, deskY + 0.55, -0.35]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.4}
          emissive="#0a0f1a" emissiveIntensity={0.4} />
      </mesh>

      {/* Scrolling terminal screen — on the front face of the bezel */}
      <MonitorScreen position={[0.0, deskY + 0.55, screenZ]} />

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

      {/* Hidden rubber duck — tucked behind the monitor */}
      <RubberDuck localPosition={duckLocal} deskWorldOffset={deskOffset} />

    </group>
  )
}
