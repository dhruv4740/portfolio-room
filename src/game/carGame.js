/**
 * CarGame — framework-agnostic top-down Canvas2D car racing engine.
 *
 * Design resolution: 512 x 320 (logical pixels).
 * Caller drives the frame loop; call frame(dt) each tick.
 * Uses ctx.shadowBlur for neon glow — looks great in real browsers (headless screenshots
 * won't capture blur, which is the correct tradeoff).
 *
 * Public API:
 *   mount(canvas)          — attach engine to a canvas element and size it
 *   update(dt)             — advance physics/state by dt seconds
 *   render()               — draw the current frame
 *   frame(dt)              — update(dt) + render() in one call
 *   setInput({up,down,left,right}) — set current key state (booleans)
 *   reset()                — reset car to start position
 *   getCanvas()            — return the canvas element
 *   DESIGN_W / DESIGN_H   — design resolution constants
 */

// ---------------------------------------------------------------------------
// Track geometry — a rounded-rectangle closed loop
// ---------------------------------------------------------------------------

export const DESIGN_W = 512
export const DESIGN_H = 320

// Track center path as a series of [x,y] points (closed loop, rounded-rect)
const TW = 420   // track bounding width
const TH = 240   // track bounding height
const TX = (DESIGN_W - TW) / 2  // 46
const TY = (DESIGN_H - TH) / 2  // 40
const TR = 48    // corner radius

function buildTrackPath() {
  const pts = []
  const steps = 24

  // Top-left corner (starts at top-left arc midpoint going clockwise)
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI + (Math.PI / 2) * (i / steps)
    pts.push([TX + TR + Math.cos(a) * TR, TY + TR + Math.sin(a) * TR])
  }
  // Top edge
  pts.push([TX + TW - TR, TY])
  // Top-right corner
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / steps)
    pts.push([TX + TW - TR + Math.cos(a) * TR, TY + TR + Math.sin(a) * TR])
  }
  // Right edge
  pts.push([TX + TW, TY + TH - TR])
  // Bottom-right corner
  for (let i = 0; i <= steps; i++) {
    const a = 0 + (Math.PI / 2) * (i / steps)
    pts.push([TX + TW - TR + Math.cos(a) * TR, TY + TH - TR + Math.sin(a) * TR])
  }
  // Bottom edge
  pts.push([TX + TR, TY + TH])
  // Bottom-left corner
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI / 2 + (Math.PI / 2) * (i / steps)
    pts.push([TX + TR + Math.cos(a) * TR, TY + TH - TR + Math.sin(a) * TR])
  }
  // Left edge back to start
  pts.push([TX, TY + TR])

  return pts
}

const TRACK_PATH = buildTrackPath()
const TRACK_WIDTH = 38  // half-width of drivable surface from centerline

// ---------------------------------------------------------------------------
// Track helpers
// ---------------------------------------------------------------------------

function segLen(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function trackLength(path) {
  let len = 0
  for (let i = 0; i < path.length; i++) {
    len += segLen(path[i], path[(i + 1) % path.length])
  }
  return len
}

const TOTAL_LEN = trackLength(TRACK_PATH)

function sampleTrack(t) {
  let target = ((t % 1) + 1) % 1 * TOTAL_LEN
  const path = TRACK_PATH
  for (let i = 0; i < path.length; i++) {
    const a = path[i]
    const b = path[(i + 1) % path.length]
    const seg = segLen(a, b)
    if (target <= seg) {
      const f = target / seg
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    target -= seg
  }
  return path[0]
}

function nearestOnTrack(px, py) {
  const path = TRACK_PATH
  let minDist = Infinity
  let accumulated = 0
  for (let i = 0; i < path.length; i++) {
    const a = path[i]
    const b = path[(i + 1) % path.length]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const seg = segLen(a, b)
    const t = seg > 0 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (seg * seg))) : 0
    const cx = a[0] + t * dx
    const cy = a[1] + t * dy
    const dist = Math.hypot(px - cx, py - cy)
    if (dist < minDist) minDist = dist
    accumulated += seg
  }
  return minDist
}

// ---------------------------------------------------------------------------
// Checkpoint / boost definitions
// ---------------------------------------------------------------------------

const CHECKPOINT_DEFS = [
  { t: 0.115, label: 'Flask Flats'   },
  { t: 0.30,  label: 'React Ridge'   },
  { t: 0.50,  label: 'Rapier Ravine' },
  { t: 0.67,  label: 'Claude Curve'  },
  { t: 0.86,  label: 'Python Pass'   },
]

const BOOST_DEFS = [
  { t: 0.14 },
  { t: 0.35 },
  { t: 0.56 },
  { t: 0.73 },
  { t: 0.93 },
]

// ---------------------------------------------------------------------------
// Colour palette
// ---------------------------------------------------------------------------

const C = {
  bg:              '#0b0e14',
  grass:           '#0d1a0d',
  trackSurface:    '#1a1f2e',
  trackEdgeOuter:  '#00ffe7',
  trackEdgeInner:  '#7b2fff',
  trackGlowOuter:  'rgba(0,255,231,0.25)',
  trackGlowInner:  'rgba(123,47,255,0.25)',
  startLine:       '#ffffff',
  carFill:         '#00cfff',
  carGlowFill:     'rgba(0,207,255,0.3)',
  checkpointArmed: '#ffdd00',
  checkpointHit:   '#ff4488',
  checkpointLabel: '#c8d8f0',
  boostColor:      '#ff9900',
  boostGlow:       'rgba(255,153,0,0.35)',
  miniText:        '#7090b0',
}

// ---------------------------------------------------------------------------
// CarGame engine class
// ---------------------------------------------------------------------------

export class CarGame {
  static DESIGN_W = DESIGN_W
  static DESIGN_H = DESIGN_H

  constructor(options = {}) {
    this._canvas = null
    this._ctx    = null
    this._input  = { up: false, down: false, left: false, right: false }
    this._onCheckpoint = options.onCheckpoint ?? (() => {})
    this._projects = options.projects ?? []

    this._checkpoints = CHECKPOINT_DEFS.map((def, i) => ({
      ...def,
      project:   this._projects[i] ?? null,
      armed:     true,
      hitTimer:  0,
    }))

    this._boosts = BOOST_DEFS.map(def => ({
      t:            def.t,
      active:       true,
      respawnTimer: 0,
    }))

    this._car = { x: 0, y: 0, angle: 0, speed: 0, boostTimer: 0, flashTimer: 0 }
    this._cpPositions    = null
    this._boostPositions = null
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  mount(canvas) {
    this._canvas = canvas
    canvas.width  = DESIGN_W
    canvas.height = DESIGN_H
    this._ctx = canvas.getContext('2d')
    this._buildPositions()
    this.reset()
  }

  getCanvas() { return this._canvas }

  setInput(input) { this._input = { ...this._input, ...input } }

  reset() {
    // Start on the top straight (t=0.08) already heading right toward CP1 at t=0.10.
    // t=0 is on the left edge going upward through the corner — unusable with ArrowUp only.
    const START_T = 0.08
    const pos  = sampleTrack(START_T)
    const next = sampleTrack(START_T + 0.01)
    this._car.x     = pos[0]
    this._car.y     = pos[1]
    this._car.angle = Math.atan2(next[1] - pos[1], next[0] - pos[0])
    this._car.speed = 0
    this._car.boostTimer = 0
    this._car.flashTimer = 0
    this._checkpoints.forEach(cp => { cp.armed = true; cp.hitTimer = 0 })
    this._boosts.forEach(b => { b.active = true; b.respawnTimer = 0 })
  }

  update(dt) {
    if (!this._canvas) return
    this._updateCar(dt)
    this._updateCheckpoints(dt)
    this._updateBoosts(dt)
  }

  render() {
    if (!this._ctx) return
    this._draw()
  }

  frame(dt) {
    this.update(dt)
    this.render()
  }

  // ---------------------------------------------------------------------------
  // Internal: position cache
  // ---------------------------------------------------------------------------

  _buildPositions() {
    this._cpPositions = this._checkpoints.map(cp => {
      const pos  = sampleTrack(cp.t)
      const next = sampleTrack(cp.t + 0.005)
      return { x: pos[0], y: pos[1], angle: Math.atan2(next[1] - pos[1], next[0] - pos[0]) }
    })
    this._boostPositions = this._boosts.map(b => {
      const pos = sampleTrack(b.t)
      return { x: pos[0], y: pos[1] }
    })
  }

  // ---------------------------------------------------------------------------
  // Internal: physics
  // ---------------------------------------------------------------------------

  _updateCar(dt) {
    const car = this._car
    const inp = this._input
    const MAX_SPEED  = 120
    const BOOST_SPEED = 175
    const ACCEL      = 90
    const BRAKE      = 130
    const DRAG       = 0.92
    const STEER_RATE = 2.8
    const GRASS_MULT = 0.42

    const boosting = car.boostTimer > 0
    const maxSpd   = boosting ? BOOST_SPEED : MAX_SPEED
    const dist     = nearestOnTrack(car.x, car.y)
    const onTrack  = dist < TRACK_WIDTH

    if (inp.up)        car.speed += ACCEL * dt
    else if (inp.down) car.speed -= BRAKE * dt

    car.speed *= Math.pow(DRAG, dt * 60)
    if (!onTrack) car.speed *= 1 - (1 - GRASS_MULT) * dt * 5
    car.speed = Math.max(-30, Math.min(maxSpd, car.speed))

    const steerFactor = Math.abs(car.speed) / MAX_SPEED
    if (inp.left)  car.angle -= STEER_RATE * steerFactor * dt
    if (inp.right) car.angle += STEER_RATE * steerFactor * dt

    car.x += Math.cos(car.angle) * car.speed * dt
    car.y += Math.sin(car.angle) * car.speed * dt
    car.x = Math.max(8, Math.min(DESIGN_W - 8, car.x))
    car.y = Math.max(8, Math.min(DESIGN_H - 8, car.y))

    if (car.boostTimer > 0) car.boostTimer = Math.max(0, car.boostTimer - dt)
    if (car.flashTimer > 0) car.flashTimer = Math.max(0, car.flashTimer - dt)
  }

  // ---------------------------------------------------------------------------
  // Internal: checkpoint logic
  // ---------------------------------------------------------------------------

  _updateCheckpoints(dt) {
    const car = this._car
    this._checkpoints.forEach((cp, i) => {
      if (cp.hitTimer > 0) cp.hitTimer = Math.max(0, cp.hitTimer - dt)

      const pos = this._cpPositions[i]
      // Transform car into gate-local coords (gate perpendicular to track dir)
      const dx    = car.x - pos.x
      const dy    = car.y - pos.y
      const cos   = Math.cos(-pos.angle)
      const sin   = Math.sin(-pos.angle)
      const localX = dx * cos - dy * sin  // along track direction
      const localY = dx * sin + dy * cos  // across track

      const inside = Math.abs(localX) < 8 && Math.abs(localY) < TRACK_WIDTH

      if (inside && cp.armed) {
        cp.armed    = false
        cp.hitTimer = 0.6
        this._car.flashTimer = 0.4
        if (cp.project) this._onCheckpoint(cp.project)
      }
      if (!inside && !cp.armed) cp.armed = true
    })
  }

  // ---------------------------------------------------------------------------
  // Internal: boost pickups
  // ---------------------------------------------------------------------------

  _updateBoosts(dt) {
    const car = this._car
    this._boosts.forEach((b, i) => {
      if (!b.active) {
        b.respawnTimer -= dt
        if (b.respawnTimer <= 0) b.active = true
        return
      }
      const pos = this._boostPositions[i]
      if (Math.hypot(car.x - pos.x, car.y - pos.y) < 12) {
        b.active = false
        b.respawnTimer = 8
        car.boostTimer = 2.5
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Internal: rendering
  // ---------------------------------------------------------------------------

  _draw() {
    const ctx = this._ctx
    const W = DESIGN_W
    const H = DESIGN_H

    ctx.fillStyle = C.bg
    ctx.fillRect(0, 0, W, H)

    this._drawTrackSurface(ctx)
    this._drawStartFinish(ctx)
    this._drawBoosts(ctx)
    this._drawCheckpoints(ctx)
    this._drawCar(ctx)

    ctx.fillStyle = C.miniText
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('arrows / WASD to drive', W / 2, H - 6)
  }

  _drawTrackSurface(ctx) {
    const path = TRACK_PATH
    const W = TRACK_WIDTH

    ctx.save()

    // Fill track surface band (thick stroke along centerline)
    ctx.lineWidth   = W * 2
    ctx.strokeStyle = C.trackSurface
    ctx.lineJoin    = 'round'
    ctx.lineCap     = 'round'
    ctx.beginPath()
    ctx.moveTo(path[0][0], path[0][1])
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1])
    ctx.closePath()
    ctx.stroke()

    // Helper to build offset path
    const buildOffsetPath = (offset) => {
      ctx.beginPath()
      for (let i = 0; i < path.length; i++) {
        const prev = path[(i - 1 + path.length) % path.length]
        const next = path[(i + 1) % path.length]
        const tx   = next[0] - prev[0]
        const ty   = next[1] - prev[1]
        const len  = Math.hypot(tx, ty) || 1
        const nx   = -ty / len * offset
        const ny   =  tx / len * offset
        const ox   = path[i][0] + nx
        const oy   = path[i][1] + ny
        i === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy)
      }
      ctx.closePath()
    }

    // Outer border — neon cyan glow
    buildOffsetPath(W)
    ctx.lineWidth        = 2
    ctx.strokeStyle      = C.trackEdgeOuter
    ctx.shadowColor      = C.trackEdgeOuter
    ctx.shadowBlur       = 10
    ctx.stroke()
    ctx.shadowBlur       = 0

    // Inner border — neon purple glow
    buildOffsetPath(-W)
    ctx.lineWidth        = 2
    ctx.strokeStyle      = C.trackEdgeInner
    ctx.shadowColor      = C.trackEdgeInner
    ctx.shadowBlur       = 10
    ctx.stroke()
    ctx.shadowBlur       = 0

    ctx.restore()
  }

  _drawStartFinish(ctx) {
    const pos   = sampleTrack(0)
    const pos2  = sampleTrack(0.005)
    const angle = Math.atan2(pos2[1] - pos[1], pos2[0] - pos[0])
    const perp  = angle + Math.PI / 2

    ctx.save()
    ctx.strokeStyle = C.startLine
    ctx.shadowColor = C.startLine
    ctx.shadowBlur  = 6
    ctx.lineWidth   = 2
    ctx.setLineDash([4, 4])
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(pos[0] + Math.cos(perp) * TRACK_WIDTH, pos[1] + Math.sin(perp) * TRACK_WIDTH)
    ctx.lineTo(pos[0] - Math.cos(perp) * TRACK_WIDTH, pos[1] - Math.sin(perp) * TRACK_WIDTH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.shadowBlur  = 0
    ctx.restore()
  }

  _drawBoosts(ctx) {
    const time = performance.now() / 1000

    this._boosts.forEach((b, i) => {
      const pos = this._boostPositions[i]
      if (!b.active) {
        ctx.save()
        ctx.globalAlpha = 0.18
        ctx.fillStyle   = '#444466'
        ctx.fillRect(pos.x - 5, pos.y - 3, 10, 6)
        ctx.restore()
        return
      }

      const pulse = 0.55 + 0.45 * Math.sin(time * 4 + i * 1.3)
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.globalAlpha      = pulse
      ctx.fillStyle        = C.boostColor
      ctx.shadowColor      = C.boostColor
      ctx.shadowBlur       = 8
      ctx.font             = 'bold 10px monospace'
      ctx.textAlign        = 'center'
      ctx.textBaseline     = 'middle'
      ctx.fillText('>>', 0, 0)
      ctx.shadowBlur       = 0

      ctx.restore()
    })
  }

  _drawCheckpoints(ctx) {
    const time = performance.now() / 1000

    // Gate colors per checkpoint — visually distinct from orange boosts
    const GATE_COLORS = ['#00ff88', '#ff44cc', '#44ccff', '#ffee00', '#ff6644']

    this._checkpoints.forEach((cp, i) => {
      const pos   = this._cpPositions[i]
      const perp  = pos.angle + Math.PI / 2
      const hit   = cp.hitTimer > 0
      const baseColor = GATE_COLORS[i % GATE_COLORS.length]
      const color = hit ? C.checkpointHit : baseColor
      const alpha = hit ? 1 : 0.75 + 0.25 * Math.sin(time * 2.5 + i * 1.2)

      // Gate spans full track width across the lane
      const gateW = TRACK_WIDTH * 0.92
      const x1 = pos.x + Math.cos(perp) * gateW
      const y1 = pos.y + Math.sin(perp) * gateW
      const x2 = pos.x - Math.cos(perp) * gateW
      const y2 = pos.y - Math.sin(perp) * gateW

      ctx.save()
      ctx.globalAlpha = alpha

      // Gate beam — neon glow via shadowBlur
      ctx.strokeStyle  = color
      ctx.lineWidth    = hit ? 3 : 2
      ctx.shadowColor  = color
      ctx.shadowBlur   = hit ? 18 : 12
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.shadowBlur   = 0

      // Gate posts (small filled circles at lane edges)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur  = 8
      ctx.beginPath()
      ctx.arc(x1, y1, hit ? 4 : 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x2, y2, hit ? 4 : 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur  = 0

      // Label: number + name, positioned outside the track loop
      const nx = -Math.sin(pos.angle)
      const ny =  Math.cos(pos.angle)
      // Determine which normal direction points away from track center
      const toCenter = (pos.x - DESIGN_W / 2) * nx + (pos.y - DESIGN_H / 2) * ny
      const outDir   = toCenter > 0 ? 1 : -1
      const labelDist = TRACK_WIDTH + 16
      let lx = pos.x + nx * labelDist * outDir
      let ly = pos.y + ny * labelDist * outDir

      // Clamp label so it stays inside canvas with margin
      lx = Math.max(28, Math.min(DESIGN_W - 28, lx))
      ly = Math.max(8,  Math.min(DESIGN_H - 8,  ly))

      ctx.globalAlpha  = 1
      ctx.fillStyle    = color
      ctx.font         = 'bold 8px monospace'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      // Number badge
      ctx.shadowColor  = color
      ctx.shadowBlur   = 6
      ctx.fillText(`${i + 1}`, lx, ly - 6)
      ctx.shadowBlur   = 0
      // Name in lighter text below number
      ctx.fillStyle    = C.checkpointLabel
      ctx.font         = '7px monospace'
      ctx.fillText(cp.label, lx, ly + 5)

      ctx.restore()
    })
  }

  _drawCar(ctx) {
    const car      = this._car
    const time     = performance.now() / 1000
    const flash    = car.flashTimer > 0
    const boosting = car.boostTimer > 0
    const CL = 12
    const CW = 5

    const carFill = flash
      ? `hsl(${Math.floor(time * 800) % 360},100%,70%)`
      : boosting ? '#ffcc44' : C.carFill
    const glowColor = flash
      ? `hsl(${Math.floor(time * 800) % 360},100%,70%)`
      : boosting ? '#ffaa00' : C.carFill

    ctx.save()
    ctx.translate(car.x, car.y)
    ctx.rotate(car.angle)

    // Car body with neon glow
    ctx.fillStyle   = carFill
    ctx.shadowColor = glowColor
    ctx.shadowBlur  = boosting ? 20 : 12
    ctx.fillRect(-CL, -CW, CL * 2, CW * 2)
    ctx.shadowBlur  = 0

    // Windshield
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(CL * 0.1, -CW + 1, CL * 0.5, CW * 2 - 2)

    ctx.restore()
  }
}
