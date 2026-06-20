import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import useStore from '../../store/useStore'
import { setLockTarget, requestLock } from '../../lib/pointerLock'
import { LAPTOP_FOCUSED_CAM, LAPTOP_FOCUSED_TARGET } from '../scene/Laptop.jsx'

const WALK_POS  = [0, 1.7, 2]
const LOOK_AT_Y = 1.6  // slightly below eye level — natural forward gaze

// Cinematic overview position (where camera is before player clicks in)
const CINEMATIC_POS    = [0, 1.7, 3]
const CINEMATIC_TARGET = [0, 1.0, 0]

export default function CameraRig() {
  const phase    = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const setActiveProject = useStore((s) => s.setActiveProject)
  const { camera, gl } = useThree()
  const tweenRef = useRef(null)

  // Register the canvas as the pointer-lock target so PlayerController and
  // CameraRig both reference the same element via the shared pointerLock module.
  useEffect(() => {
    setLockTarget(gl.domElement)
  }, [gl.domElement])

  // One-shot click handler while in CINEMATIC: lock + transition.
  // The lock request must be called synchronously inside the user gesture,
  // so we call requestLock() here before dispatching the state change.
  useEffect(() => {
    if (phase !== 'CINEMATIC') return

    function onClick() {
      requestLock()        // must be synchronous inside the click event
      setPhase('TRANSITION')
    }

    gl.domElement.addEventListener('click', onClick, { once: true })
    return () => gl.domElement.removeEventListener('click', onClick)
  }, [phase, gl.domElement, setPhase])

  // GSAP tween camera to walking start when entering TRANSITION
  useEffect(() => {
    if (phase !== 'TRANSITION') return

    tweenRef.current?.kill()

    const pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }

    tweenRef.current = gsap.to(pos, {
      x: WALK_POS[0],
      y: WALK_POS[1],
      z: WALK_POS[2],
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate() {
        camera.position.set(pos.x, pos.y, pos.z)
        camera.lookAt(pos.x, LOOK_AT_Y, pos.z - 3)
      },
      onComplete() {
        setPhase('WALKING')
      },
    })

    return () => tweenRef.current?.kill()
  }, [phase, camera, setPhase])

  // GSAP tween to FOCUSED: dolly camera to face the laptop screen
  useEffect(() => {
    if (phase !== 'FOCUSED') return

    tweenRef.current?.kill()

    const pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const [tx, ty, tz] = LAPTOP_FOCUSED_CAM
    const [lx, ly, lz] = LAPTOP_FOCUSED_TARGET

    tweenRef.current = gsap.to(pos, {
      x: tx,
      y: ty,
      z: tz,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate() {
        camera.position.set(pos.x, pos.y, pos.z)
        camera.lookAt(lx, ly, lz)
      },
    })

    return () => tweenRef.current?.kill()
  }, [phase, camera])

  // Escape while FOCUSED: tween back to cinematic overview, clear project card
  useEffect(() => {
    if (phase !== 'FOCUSED') return

    function onKeyDown(e) {
      if (e.code !== 'Escape') return

      tweenRef.current?.kill()

      const pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      const [cx, cy, cz] = CINEMATIC_POS
      const [ltx, lty, ltz] = CINEMATIC_TARGET

      tweenRef.current = gsap.to(pos, {
        x: cx,
        y: cy,
        z: cz,
        duration: 1.0,
        ease: 'power2.inOut',
        onUpdate() {
          camera.position.set(pos.x, pos.y, pos.z)
          camera.lookAt(ltx, lty, ltz)
        },
        onComplete() {
          setActiveProject(null)
          setPhase('CINEMATIC')
        },
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, camera, setPhase, setActiveProject])

  // Only render OrbitControls in CINEMATIC
  if (phase !== 'CINEMATIC') return null

  return (
    <OrbitControls
      target={[0, 1.0, 0]}
      minDistance={0.5}
      maxDistance={9}
    />
  )
}
