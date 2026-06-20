import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../../store/useStore.js'

// Read hour directly from URL so the initial material value is correct
// even before useLocalTime's useEffect fires (headless SW renderer may delay rAF).
function getInitialHour() {
  if (typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search)
    const v = p.get('hour')
    if (v !== null) { const n = parseFloat(v); if (!isNaN(n)) return n }
  }
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

// Vertical gradient sky plane behind the window opening.
// Positioned at z=-7.5, sized 8x4 to fill the window view from camera at [0,1.7,3].
// uHour drives a 5-band color mapping (night/dawn/day/sunset/dusk).

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uHour;
  varying vec2 vUv;

  // Smoothstep ramp between two values
  float band(float lo, float hi, float v) {
    return smoothstep(lo, hi, v);
  }

  // Linear remap from [a,b] → [0,1]
  float remap(float v, float a, float b) {
    return clamp((v - a) / (b - a), 0.0, 1.0);
  }

  void main() {
    // vUv.y: 0=bottom (horizon), 1=top (zenith)
    float t = vUv.y;   // horizon at bottom
    float h = uHour;

    // ── Define palette colors ──────────────────────────────────────────
    // Night (0-5 / 20-24)
    vec3 nightZenith   = vec3(0.02, 0.02, 0.10);
    vec3 nightHorizon  = vec3(0.05, 0.05, 0.18);

    // Dawn (5-8)
    vec3 dawnZenith    = vec3(0.10, 0.08, 0.25);
    vec3 dawnHorizon   = vec3(0.95, 0.45, 0.20);

    // Day (8-17)
    vec3 dayZenith     = vec3(0.26, 0.53, 0.96);
    vec3 dayHorizon    = vec3(0.60, 0.82, 1.00);

    // Sunset (17-20)
    vec3 sunsetZenith  = vec3(0.15, 0.05, 0.30);
    vec3 sunsetHorizon = vec3(1.00, 0.35, 0.05);

    // ── Compute sky gradient for each period ──────────────────────────
    vec3 nightSky  = mix(nightHorizon,  nightZenith,  t);
    vec3 dawnSky   = mix(dawnHorizon,   dawnZenith,   t);
    vec3 daySky    = mix(dayHorizon,    dayZenith,    t);
    vec3 sunsetSky = mix(sunsetHorizon, sunsetZenith, t);

    // ── Blend between bands based on hour ─────────────────────────────
    vec3 col = nightSky;

    // night → dawn  (5..8)
    col = mix(col, dawnSky,   remap(h, 5.0, 8.0));
    // dawn → day    (8..10)
    col = mix(col, daySky,    remap(h, 8.0, 10.0));
    // day → sunset  (17..20)
    col = mix(col, sunsetSky, remap(h, 17.0, 20.0));
    // sunset → night (20..22)
    col = mix(col, nightSky,  remap(h, 20.0, 22.0));

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function TimeBasedSky() {
  const meshRef = useRef()

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        // getInitialHour() ensures the correct value on the very first frame,
        // even before useLocalTime's useEffect fires or rAF callbacks run.
        uHour: { value: getInitialHour() },
      },
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    })
    // Disable tone mapping: sky colors are authored in sRGB-ish space already.
    // Without this, Three.js ACESFilmic tonemapping drastically brightens dark night values.
    mat.toneMapped = false
    return mat
  }, [])

  // Push updated hour to shader every frame
  useFrame(() => {
    if (material.uniforms) {
      material.uniforms.uHour.value = useStore.getState().localHour
    }
  })

  return (
    // z=-7.5 puts it geometrically behind the back wall at z=-4
    // DoubleSide ensures it's visible looking from +z through the window opening
    <mesh ref={meshRef} position={[0, 0.2, -7.5]} material={material}>
      <planeGeometry args={[8, 4]} />
    </mesh>
  )
}
