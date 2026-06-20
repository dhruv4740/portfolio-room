// useKonamiCode — listens globally for the Konami sequence on window keydown.
// Fires onActivate() once the full sequence is detected.
// Sequence: ↑ ↑ ↓ ↓ ← → ← → B A

import { useEffect, useRef } from 'react'

const SEQUENCE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
]

export default function useKonamiCode(onActivate) {
  const indexRef = useRef(0)

  useEffect(() => {
    function handleKeyDown(e) {
      const expected = SEQUENCE[indexRef.current]
      if (e.code === expected) {
        indexRef.current += 1
        if (indexRef.current === SEQUENCE.length) {
          indexRef.current = 0
          onActivate()
        }
      } else {
        // Reset, but re-check if this key is the start of the sequence
        indexRef.current = e.code === SEQUENCE[0] ? 1 : 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onActivate])
}
