// useAudio — Howler.js wrapper for the Phase 13 audio system.
//
// Design rules:
//  - Howl instances are created lazily on first enable (never on page load).
//  - Missing/404 audio files are caught by onloaderror/onplayerror and only
//    logged as console.warn — they NEVER throw or crash the app.
//  - All audio is OFF by default; nothing plays until the user toggles on.
//  - Ambient crossfade picks ambient_day vs ambient_night by store.localHour.

import { useEffect, useRef } from 'react'
import { Howl, Howler } from 'howler'
import { SOUNDS } from '../data/sounds.js'
import useStore from '../store/useStore.js'

// ---------------------------------------------------------------------------
// Module-level singleton map — Howl instances survive re-renders.
// ---------------------------------------------------------------------------
const _howls = {}

function _safeError(name, err) {
  console.warn(`[audio] "${name}" load/play error (file missing?):`, err)
}

function _getOrCreate(name) {
  if (_howls[name]) return _howls[name]
  const def = SOUNDS[name]
  if (!def) return null

  const h = new Howl({
    src: [def.src],
    loop: def.loop,
    volume: def.volume,
    preload: true,
    onloaderror: (_id, err) => _safeError(name, err),
    onplayerror: (_id, err) => _safeError(name, err),
  })
  _howls[name] = h
  return h
}

// Initialise all Howl instances (called once on first enable).
function _initAll() {
  Object.keys(SOUNDS).forEach(_getOrCreate)
}

// ---------------------------------------------------------------------------
// Ambient crossfade helper.
// Fades out the wrong ambient and fades in the right one over ~1.5 s.
// ---------------------------------------------------------------------------
let _activeAmbient = null

function _startAmbient(localHour) {
  const target = (localHour >= 6 && localHour < 20) ? 'ambient_day' : 'ambient_night'
  const other  = target === 'ambient_day' ? 'ambient_night' : 'ambient_day'

  const outHowl = _howls[other]
  if (outHowl && outHowl.playing()) {
    outHowl.fade(outHowl.volume(), 0, 1500)
    setTimeout(() => { if (outHowl.playing()) outHowl.stop() }, 1600)
  }

  const inHowl = _howls[target]
  if (inHowl && !inHowl.playing()) {
    inHowl.volume(0)
    inHowl.play()
    inHowl.fade(0, SOUNDS[target].volume, 1500)
  }

  _activeAmbient = target
}

function _stopAmbient() {
  ;['ambient_day', 'ambient_night'].forEach((name) => {
    const h = _howls[name]
    if (h && h.playing()) {
      h.fade(h.volume(), 0, 600)
      setTimeout(() => { if (h.playing()) h.stop() }, 700)
    }
  })
  _activeAmbient = null
}

// ---------------------------------------------------------------------------
// Public play / stop helpers (module-level, guard on soundEnabled internally)
// ---------------------------------------------------------------------------
export function audioPlay(name) {
  const h = _howls[name]
  if (!h) return
  if (!h.playing()) h.play()
}

export function audioStop(name) {
  const h = _howls[name]
  if (!h) return
  if (h.playing()) h.stop()
}

// ---------------------------------------------------------------------------
// React hook — call once (e.g. in App or SoundToggle).
// Handles enable/disable lifecycle tied to store.soundEnabled.
// ---------------------------------------------------------------------------
export default function useAudio() {
  const soundEnabled = useStore((s) => s.soundEnabled)
  const localHour    = useStore((s) => s.localHour)
  const phase        = useStore((s) => s.phase)
  const initialised  = useRef(false)

  // Enable / disable
  useEffect(() => {
    if (soundEnabled) {
      if (!initialised.current) {
        _initAll()
        initialised.current = true
      }
      Howler.mute(false)
      _startAmbient(localHour)
    } else {
      Howler.mute(true)
      _stopAmbient()
    }
  }, [soundEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Crossfade ambient when the hour crosses day/night boundary while enabled
  useEffect(() => {
    if (!soundEnabled || !initialised.current) return
    const target = (localHour >= 6 && localHour < 20) ? 'ambient_day' : 'ambient_night'
    if (target !== _activeAmbient) _startAmbient(localHour)
  }, [localHour, soundEnabled])

  // Car engine: loop while FOCUSED, stop otherwise
  useEffect(() => {
    if (!soundEnabled || !initialised.current) return
    if (phase === 'FOCUSED') {
      audioPlay('car_engine')
    } else {
      audioStop('car_engine')
    }
  }, [phase, soundEnabled])

  // Stop engine on unmount / disable
  useEffect(() => {
    return () => {
      audioStop('car_engine')
    }
  }, [])
}
