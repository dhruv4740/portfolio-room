import { useEffect } from 'react'
import useStore from '../store/useStore.js'

// Returns current local hour as a float 0..24 (e.g. 14.5 = 2:30 PM).
// DEV ONLY: if the URL has ?hour=N, returns N instead (allows screenshot overrides).
function getCurrentHour() {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search)
    const override = params.get('hour')
    if (override !== null) {
      const n = parseFloat(override)
      if (!isNaN(n)) return n
    }
  }
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

export default function useLocalTime() {
  const setLocalHour = useStore((s) => s.setLocalHour)

  useEffect(() => {
    // Sync once on mount, then every 60s
    setLocalHour(getCurrentHour())
    const id = setInterval(() => setLocalHour(getCurrentHour()), 60_000)
    return () => clearInterval(id)
  }, [setLocalHour])

  return useStore((s) => s.localHour)
}
