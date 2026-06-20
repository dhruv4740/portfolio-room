/**
 * HologramChart — a 3D bar chart floating above the desk, rendered with a
 * custom GLSL hologram shader (fresnel edge glow + scanlines + flicker).
 *
 * Desk surface world Y: -1.25  (from Desk.jsx: deskY = -1.25)
 * Desk world centre:    x=2.8, z=2.5  (Desk group position)
 * Hologram Y:           deskY + 0.5 = -0.75  (hovers 0.5 units above surface)
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { SKILLS } from '../../data/skills.js'

// ---------------------------------------------------------------------------
// Desk constants (mirror Desk.jsx so changes there can be updated here too)
// ---------------------------------------------------------------------------
const DESK_X   = 2.8
const DESK_Z   = 2.5
const DESK_Y   = -1.25   // top surface of desk
const HOVER    = 0.50    // units above desk surface

// The group Y = DESK_Y + HOVER = -0.75
// Everything inside the group is in desk-local coords with Y=0 at hover height.

// ---------------------------------------------------------------------------
// Hologram GLSL
// ---------------------------------------------------------------------------
const holoVert = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv        = uv;
    vNormal    = normalize(normalMatrix * normal);
    vWorldPos  = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const holoFrag = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;      // base cyan
  uniform vec3  uRimColor;   // brighter rim

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    // ── Fresnel edge glow ─────────────────────────────────────────────────
    // viewDir from world position toward the camera (cameraPosition is built-in)
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
    fresnel = pow(fresnel, 2.0);   // sharpen the rim

    // ── Horizontal scanlines ──────────────────────────────────────────────
    // Use world Y so lines stay fixed in space regardless of bar height
    float scan = 0.82 + 0.18 * sin(vWorldPos.y * 28.0 + uTime * 0.5);

    // ── Flicker ───────────────────────────────────────────────────────────
    float flicker = 0.92 + 0.08 * sin(uTime * 17.3) * sin(uTime * 4.1);

    // ── Compose ───────────────────────────────────────────────────────────
    vec3 col = mix(uColor, uRimColor, fresnel);
    col *= scan * flicker;

    // Alpha: base translucent + extra at rim for the glow halo
    float alpha = 0.25 + 0.55 * fresnel;

    gl_FragColor = vec4(col, alpha);
  }
`

// ---------------------------------------------------------------------------
// One shared ShaderMaterial (all bars share the same uniforms object — that's fine
// because uTime is global; each bar's transform is set per mesh).
// ---------------------------------------------------------------------------
function useHoloMaterial() {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader:   holoVert,
      fragmentShader: holoFrag,
      uniforms: {
        uTime:     { value: 0 },
        uColor:    { value: new THREE.Color(0x00e5ff) },   // cyan
        uRimColor: { value: new THREE.Color(0x88ffff) },   // bright rim
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      side:        THREE.DoubleSide,
    })
  }, [])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const BAR_W     = 0.09   // bar width/depth
const BAR_MAX_H = 0.70   // max bar height (level=100 maps to this)
const SPACING   = 0.18   // centre-to-centre X spacing between bars
const LABEL_Y   = -0.07  // label sits just below Y=0 (hover plane)
const LABEL_SIZE = 0.032

export default function HologramChart() {
  const groupRef = useRef()
  const mat      = useHoloMaterial()

  // Freeze rotation in ?survey dev mode so the bars face the camera at capture time
  const isSurvey = import.meta.env.DEV &&
    typeof location !== 'undefined' &&
    new URLSearchParams(location.search).has('survey')

  // Advance uTime each frame + slow Y-rotation of the whole group
  useFrame((_, dt) => {
    if (!groupRef.current) return
    if (!isSurvey) groupRef.current.rotation.y += 0.15 * dt
    mat.uniforms.uTime.value += dt
  })

  const count  = SKILLS.length
  // Centre the row of bars around X=0 (the group is already at desk X)
  const startX = -((count - 1) * SPACING) / 2

  return (
    // World position: desk centre (x,z) + hover height
    // Initial rotation.y=0 means bar row faces ±Z (toward room interior / camera).
    <group ref={groupRef} position={[DESK_X, DESK_Y + HOVER, DESK_Z]} rotation={[0, 0, 0]}>

      {SKILLS.map((skill, i) => {
        const barH = (skill.level / 100) * BAR_MAX_H
        const bx   = startX + i * SPACING

        return (
          <group key={skill.name} position={[bx, 0, 0]}>
            {/* Bar — bottom edge at Y=0, top at Y=barH */}
            <mesh
              position={[0, barH / 2, 0]}
              material={mat}
            >
              <boxGeometry args={[BAR_W, barH, BAR_W]} />
            </mesh>

            {/* Skill label below the bar row */}
            <Text
              position={[0, LABEL_Y, 0]}
              rotation={[0, 0, 0]}
              fontSize={LABEL_SIZE}
              color="#00e5ff"
              anchorX="center"
              anchorY="top"
              outlineWidth={0.003}
              outlineColor="#003344"
              maxWidth={0.12}
            >
              {skill.name}
            </Text>
          </group>
        )
      })}

      {/* Chart title above the bars */}
      <Text
        position={[0, BAR_MAX_H + 0.08, 0]}
        fontSize={0.038}
        color="#88ffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.004}
        outlineColor="#003344"
      >
        SKILLS
      </Text>
    </group>
  )
}
