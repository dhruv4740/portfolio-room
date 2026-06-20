import { useEffect, useRef } from 'react'

const TRACKED_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight',
])

// Returns a ref whose .current is an object of { [code]: boolean }.
// Using a ref (not state) means key changes never trigger re-renders.
export default function useWASD() {
  const keys = useRef({})

  useEffect(() => {
    function onKeyDown(e) {
      if (TRACKED_KEYS.has(e.code)) keys.current[e.code] = true
    }
    function onKeyUp(e) {
      if (TRACKED_KEYS.has(e.code)) keys.current[e.code] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return keys
}
