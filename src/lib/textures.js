/**
 * Procedural texture helpers — all CanvasTexture, no external files.
 * Call once; cached in module scope so components share the same GPU uploads.
 */

import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Internal cache
// ---------------------------------------------------------------------------
const _cache = new Map()

function cached(key, factory) {
  if (_cache.has(key)) return _cache.get(key)
  const tex = factory()
  _cache.set(key, tex)
  return tex
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Linear pseudo-random float in [lo, hi) seeded by a simple LCG. */
function seededRand(seed) {
  // Returns a closure that yields repeatable values
  let s = seed >>> 0
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// ---------------------------------------------------------------------------
// Floor wood-plank texture
//   512×512 canvas — horizontal planks with grain lines and color variation
// ---------------------------------------------------------------------------
export function floorWoodTexture() {
  return cached('floor-wood', () => {
    const W = 512, H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const rand = seededRand(0xdeadbeef)

    // Base warm wood tone
    ctx.fillStyle = '#8b6238'
    ctx.fillRect(0, 0, W, H)

    // Plank rows — each plank is ~48px tall, staggered seams
    const PLANK_H = 48
    const planks = Math.ceil(H / PLANK_H) + 1
    const colors = ['#7a5530', '#8b6238', '#94693e', '#7c5c34', '#9a7040']

    for (let p = 0; p < planks; p++) {
      const py = p * PLANK_H
      const col = colors[Math.floor(rand() * colors.length)]
      ctx.fillStyle = col
      ctx.fillRect(0, py, W, PLANK_H - 1)

      // Fine horizontal grain lines within plank
      const grainCount = 6 + Math.floor(rand() * 8)
      for (let g = 0; g < grainCount; g++) {
        const gy = py + rand() * (PLANK_H - 2)
        const gAlpha = 0.04 + rand() * 0.08
        ctx.strokeStyle = `rgba(0,0,0,${gAlpha.toFixed(3)})`
        ctx.lineWidth = 0.5 + rand() * 1.0
        ctx.beginPath()
        ctx.moveTo(0, gy)
        // Slight wave
        const mid = W / 2
        ctx.bezierCurveTo(
          mid * 0.4, gy + (rand() - 0.5) * 3,
          mid * 1.1, gy + (rand() - 0.5) * 3,
          W, gy + (rand() - 0.5) * 2
        )
        ctx.stroke()
      }

      // Horizontal seam between planks
      ctx.fillStyle = 'rgba(30,15,5,0.35)'
      ctx.fillRect(0, py + PLANK_H - 1, W, 1)
    }

    // Knots — rare dark spots
    for (let k = 0; k < 4; k++) {
      const kx = rand() * W
      const ky = rand() * H
      const gr = ctx.createRadialGradient(kx, ky, 0, kx, ky, 10 + rand() * 12)
      gr.addColorStop(0, 'rgba(40,20,5,0.5)')
      gr.addColorStop(1, 'rgba(40,20,5,0)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.ellipse(kx, ky, 14, 10, rand() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  })
}

// ---------------------------------------------------------------------------
// Floor roughness map
//   Grayscale variation — shinier near center (light), rougher at edges
// ---------------------------------------------------------------------------
export function floorRoughnessTexture() {
  return cached('floor-roughness', () => {
    const W = 256, H = 256
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const rand = seededRand(0xcafe1234)

    // Base mid-gray
    ctx.fillStyle = '#888'
    ctx.fillRect(0, 0, W, H)

    // Subtle per-pixel noise via ImageData
    const id = ctx.getImageData(0, 0, W, H)
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 120 + Math.floor(rand() * 60)
      id.data[i] = id.data[i+1] = id.data[i+2] = v
      id.data[i+3] = 255
    }
    ctx.putImageData(id, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })
}

// ---------------------------------------------------------------------------
// Wall plaster texture — off-white with very subtle noise
// ---------------------------------------------------------------------------
export function wallPlasterTexture() {
  return cached('wall-plaster', () => {
    const W = 256, H = 256
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const rand = seededRand(0xabc12345)

    const id = ctx.createImageData(W, H)
    for (let i = 0; i < id.data.length; i += 4) {
      // Off-white base: r=232, g=228, b=220
      const noise = Math.floor((rand() - 0.5) * 18)
      id.data[i]   = Math.min(255, Math.max(200, 232 + noise))
      id.data[i+1] = Math.min(255, Math.max(200, 228 + noise))
      id.data[i+2] = Math.min(255, Math.max(190, 220 + Math.floor(noise * 0.8)))
      id.data[i+3] = 255
    }
    ctx.putImageData(id, 0, 0)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  })
}

// ---------------------------------------------------------------------------
// Desk wood texture — warmer, more orange-toned than floor
// ---------------------------------------------------------------------------
export function deskWoodTexture() {
  return cached('desk-wood', () => {
    const W = 256, H = 256
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const rand = seededRand(0xf00dface)

    // Base warm honey tone
    ctx.fillStyle = '#c8935a'
    ctx.fillRect(0, 0, W, H)

    // Wide grain lines (lengthwise = horizontal on canvas)
    const grainLines = 18 + Math.floor(rand() * 10)
    for (let g = 0; g < grainLines; g++) {
      const gy = rand() * H
      const gAlpha = 0.05 + rand() * 0.12
      const darker = rand() > 0.5
      ctx.strokeStyle = darker
        ? `rgba(80,40,10,${gAlpha.toFixed(3)})`
        : `rgba(220,160,80,${gAlpha.toFixed(3)})`
      ctx.lineWidth = 0.5 + rand() * 2
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(
        W * 0.3, gy + (rand() - 0.5) * 6,
        W * 0.7, gy + (rand() - 0.5) * 6,
        W, gy + (rand() - 0.5) * 4
      )
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  })
}

// ---------------------------------------------------------------------------
// Bookshelf wood texture — darker, walnut-ish
// ---------------------------------------------------------------------------
export function shelfWoodTexture() {
  return cached('shelf-wood', () => {
    const W = 256, H = 256
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    const rand = seededRand(0x5ca1ab1e)

    ctx.fillStyle = '#5c3e20'
    ctx.fillRect(0, 0, W, H)

    const grainLines = 14 + Math.floor(rand() * 8)
    for (let g = 0; g < grainLines; g++) {
      const gy = rand() * H
      const gAlpha = 0.06 + rand() * 0.10
      ctx.strokeStyle = `rgba(30,15,5,${gAlpha.toFixed(3)})`
      ctx.lineWidth = 0.5 + rand() * 1.5
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(
        W * 0.4, gy + (rand() - 0.5) * 4,
        W * 0.8, gy + (rand() - 0.5) * 4,
        W, gy + (rand() - 0.5) * 3
      )
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  })
}
