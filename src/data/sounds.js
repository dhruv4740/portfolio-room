// Sound asset definitions.
// Paths are served from public/ at the web root via Vite.
// All fields consumed by src/hooks/useAudio.js.

export const SOUNDS = {
  ambient_day:    { src: '/sounds/room_day.mp3',    loop: true,  volume: 0.15 },
  ambient_night:  { src: '/sounds/room_night.mp3',  loop: true,  volume: 0.15 },
  keyboard_tap:   { src: '/sounds/keyboard.mp3',    loop: false, volume: 0.40 },
  car_engine:     { src: '/sounds/engine.mp3',      loop: true,  volume: 0.20 },
  checkpoint:     { src: '/sounds/checkpoint.mp3',  loop: false, volume: 0.60 },
  paper_scatter:  { src: '/sounds/paper.mp3',       loop: false, volume: 0.50 },
  mug_fall:       { src: '/sounds/mug_fall.mp3',    loop: false, volume: 0.70 },
  glitch_zap:     { src: '/sounds/glitch.mp3',      loop: false, volume: 0.80 },
}
