import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../../store/useStore.js'

// Read hour from URL so initial values are correct on the first frame.
function getInitialHour() {
  if (typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search)
    const v = p.get('hour')
    if (v !== null) { const n = parseFloat(v); if (!isNaN(n)) return n }
  }
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function calcBrightness(hour) {
  if (hour >= 5 && hour < 8)   return 1.0 - ((hour - 5) / 3) * 0.95
  if (hour >= 8 && hour < 17)  return 0.0
  if (hour >= 17 && hour < 20) return ((hour - 17) / 3) * 0.6
  if (hour >= 20 && hour < 22) return 0.6 + ((hour - 20) / 2) * 0.4
  return 1.0  // night
}

// Star/particle field visible through the window opening.
// Particles confined to x[-6,6], y[-3,4], z[-7,-4.5] so they appear outside.
// Additive blending, no depthWrite — soft glowing stars.

const vertexShader = /* glsl */`
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uBrightness;
  varying float vTwinkle;
  varying float vBrightness;

  void main() {
    // Twinkle: sine wave with per-particle phase offset
    float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase * 6.2831);
    vTwinkle = twinkle;
    vBrightness = uBrightness;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    // Point size: base aSize scaled by twinkle slightly, attenuated by distance
    gl_PointSize = aSize * (1.0 + 0.4 * twinkle) * (12.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 5.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */`
  varying float vTwinkle;
  varying float vBrightness;

  void main() {
    // Soft circular point (distance from center)
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * vTwinkle * vBrightness;
    // White-blue tint
    vec3 col = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 1.0, 1.0), vTwinkle * 0.5);
    gl_FragColor = vec4(col, alpha);
  }
`

export default function ParticleField() {
  const meshRef = useRef()

  // Cap particle count on low-core devices
  const count = useMemo(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    return cores < 4 ? 1500 : 3000
  }, [])

  const { positions, phases, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases    = new Float32Array(count)
    const sizes     = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Spread across the volume outside the window
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12   // x: -6 to 6
      positions[i * 3 + 1] = Math.random() * 7 - 3         // y: -3 to 4
      positions[i * 3 + 2] = Math.random() * -2.5 - 4.5    // z: -4.5 to -7
      phases[i]  = Math.random()
      sizes[i]   = 0.8 + Math.random() * 1.6               // 0.8..2.4
    }
    return { positions, phases, sizes }
  }, [count])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:       { value: 0 },
      uBrightness: { value: calcBrightness(getInitialHour()) },
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    vertexColors: false,
  }), [])

  useFrame((_, delta) => {
    if (!material.uniforms) return
    material.uniforms.uTime.value += delta
    material.uniforms.uBrightness.value = calcBrightness(useStore.getState().localHour)
  })

  return (
    <points ref={meshRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
    </points>
  )
}
