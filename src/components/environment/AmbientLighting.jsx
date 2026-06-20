import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../../store/useStore.js'

// Clamp t to [0,1]
function sat(t) { return Math.max(0, Math.min(1, t)) }

// Compute ambient color + intensity from hour
function getAmbient(hour) {
  const night  = { color: new THREE.Color('#1a1a3e'), intensity: 0.12 }
  const dawn   = { color: new THREE.Color('#ff9966'), intensity: 0.30 }
  const day    = { color: new THREE.Color('#fffbf0'), intensity: 0.50 }
  const sunset = { color: new THREE.Color('#ff6b35'), intensity: 0.30 }

  if (hour < 5)        return night
  if (hour < 8)  { const t = sat((hour - 5) / 3);  return { color: night.color.clone().lerp(dawn.color,   t), intensity: night.intensity + t * (dawn.intensity - night.intensity) } }
  if (hour < 10) { const t = sat((hour - 8) / 2);  return { color: dawn.color.clone().lerp(day.color,    t), intensity: dawn.intensity  + t * (day.intensity  - dawn.intensity)  } }
  if (hour < 17)       return day
  if (hour < 20) { const t = sat((hour - 17) / 3); return { color: day.color.clone().lerp(sunset.color,  t), intensity: day.intensity   - t * (day.intensity  - sunset.intensity) } }
  if (hour < 22) { const t = sat((hour - 20) / 2); return { color: sunset.color.clone().lerp(night.color, t), intensity: sunset.intensity - t * (sunset.intensity - night.intensity) } }
  return night
}

// Directional window light: comes through back wall at [0,3,-8], aimed at origin
function getDirLight(hour) {
  if (hour < 5 || hour >= 22) return { intensity: 0, color: new THREE.Color('#ffffff') }
  const white  = new THREE.Color('#fff8e7')
  const warm   = new THREE.Color('#ffb347')
  const orange = new THREE.Color('#ff4500')

  if (hour < 8)  { const t = sat((hour - 5) / 3);  return { intensity: t * 0.5,                           color: warm.clone().lerp(white,  t) } }
  if (hour < 17)                                    return { intensity: 1.2,                                color: white }
  if (hour < 20) { const t = sat((hour - 17) / 3); return { intensity: 1.2 - t * 0.8,                     color: white.clone().lerp(orange, t) } }
  if (hour < 22) { const t = sat((hour - 20) / 2); return { intensity: 0.4 - t * 0.4,                     color: orange } }
  return { intensity: 0, color: new THREE.Color('#ffffff') }
}

export default function AmbientLighting() {
  const ambRef = useRef()
  const dirRef = useRef()

  useFrame(() => {
    const hour = useStore.getState().localHour
    const amb  = getAmbient(hour)
    const dir  = getDirLight(hour)

    if (ambRef.current) {
      ambRef.current.color.copy(amb.color)
      ambRef.current.intensity = amb.intensity
    }
    if (dirRef.current) {
      dirRef.current.intensity = dir.intensity
      dirRef.current.color.copy(dir.color)
      dirRef.current.visible = dir.intensity > 0
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.4} />
      {/* Pendant lamp above room center — unchanged */}
      <pointLight
        position={[0, 1.6, 0]}
        color="#fff5e0"
        intensity={40}
        distance={12}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />
      {/* Window directional light: simulates sunlight entering through back wall */}
      <directionalLight
        ref={dirRef}
        position={[0, 3, -8]}
        intensity={1.0}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.001}
      />
    </>
  )
}
