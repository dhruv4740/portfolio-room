import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import useStore from '../../store/useStore'
import { setLockTarget, requestLock } from '../../lib/pointerLock'

const WALK_POS  = [0, 1.7, 2]
const LOOK_AT_Y = 1.6  // slightly below eye level — natural forward gaze

export default function CameraRig() {
  const phase    = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
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

    // Kill any running tween
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
        // Keep camera pointing forward-ish during tween
        camera.lookAt(pos.x, LOOK_AT_Y, pos.z - 3)
      },
      onComplete() {
        setPhase('WALKING')
      },
    })

    return () => tweenRef.current?.kill()
  }, [phase, camera, setPhase])

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
