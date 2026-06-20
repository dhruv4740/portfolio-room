import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Euler, Vector3 } from 'three'
import useStore from '../../store/useStore'
import useWASD from '../../hooks/useWASD'
import { exitLock } from '../../lib/pointerLock'

const SPEED = 2          // units/sec
const SPRINT_MULT = 1.5
const SENSITIVITY = 0.002
const PITCH_LIMIT = 1.0472  // ±60°
const EYE_Y = 1.7
const BOUNDS = { minX: -4.5, maxX: 4.5, minZ: -3.5, maxZ: 3.5 }

export default function PlayerController() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const { camera, gl } = useThree()
  const keys = useWASD()

  // Accumulated yaw/pitch — stored in refs to avoid re-renders
  const yaw = useRef(0)
  const pitch = useRef(0)
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'))
  const forward = useRef(new Vector3())

  // Wire up mousemove only while pointer is locked; clean up on unmount
  useEffect(() => {
    if (phase !== 'WALKING') return

    function onMouseMove(e) {
      if (document.pointerLockElement !== gl.domElement) return
      yaw.current -= e.movementX * SENSITIVITY
      pitch.current -= e.movementY * SENSITIVITY
      pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current))

      euler.current.set(pitch.current, yaw.current, 0)
      camera.quaternion.setFromEuler(euler.current)
    }

    function onKeyDown(e) {
      if (e.code === 'Escape') exitLock()
    }

    // When pointer lock is released while WALKING, go back to CINEMATIC
    function onLockChange() {
      if (document.pointerLockElement === null) {
        setPhase('CINEMATIC')
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerlockchange', onLockChange)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerlockchange', onLockChange)
    }
  }, [phase, camera, gl.domElement, setPhase])

  useFrame((_, delta) => {
    if (phase !== 'WALKING') return

    const k = keys.current
    const sprint = k.ShiftLeft || k.ShiftRight ? SPRINT_MULT : 1
    const speed = SPEED * sprint * delta

    // Build forward/right vectors from yaw only (ignore pitch for translation)
    const sinY = Math.sin(yaw.current)
    const cosY = Math.cos(yaw.current)

    let dx = 0
    let dz = 0

    if (k.KeyW || k.ArrowUp)    { dx -= sinY * speed; dz -= cosY * speed }
    if (k.KeyS || k.ArrowDown)  { dx += sinY * speed; dz += cosY * speed }
    if (k.KeyA || k.ArrowLeft)  { dx -= cosY * speed; dz += sinY * speed }
    if (k.KeyD || k.ArrowRight) { dx += cosY * speed; dz -= sinY * speed }

    const nx = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, camera.position.x + dx))
    const nz = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, camera.position.z + dz))

    camera.position.set(nx, EYE_Y, nz)
  })

  return null
}
