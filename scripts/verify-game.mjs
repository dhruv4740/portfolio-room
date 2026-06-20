/**
 * verify-game.mjs — Headless verification harness for the CarGame standalone route.
 *
 * Usage:
 *   node scripts/verify-game.mjs
 *
 * What it does:
 *  1. Spawns `npx vite --port 5174` (DEV server — required for import.meta.env.DEV branch)
 *  2. Waits until the port responds
 *  3. Launches Chromium headless with software rendering flags
 *  4. Navigates to http://localhost:5174/?game
 *  5. Takes initial screenshot, then simulates driving for ~3s, takes more screenshots
 *  6. Prints structured summary (CONSOLE / PAGE ERRORS / SCREENSHOTS)
 *  7. Kills dev server + browser
 *
 * Hard timeout: 35s
 */

import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import http from 'http'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT       = 5174
const BASE_URL   = `http://localhost:${PORT}/?game`
const TIMEOUT_MS = 90000

const __dirname  = dirname(fileURLToPath(import.meta.url))
const SHOTS_DIR  = join(__dirname, 'shots')

mkdirSync(SHOTS_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitForPort(port, maxMs = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs
    function probe() {
      http.get(`http://localhost:${port}/`, (res) => {
        res.destroy()
        resolve()
      }).on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server on port ${port} never responded within ${maxMs}ms`))
        } else {
          setTimeout(probe, 400)
        }
      })
    }
    probe()
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function dedupeMessages(messages) {
  const counts = new Map()
  for (const m of messages) {
    const key = `[${m.type}] ${m.text}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([key, count]) =>
    count > 1 ? `${key}  (x${count})` : key
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Hard overall timeout
  const hardTimeout = setTimeout(() => {
    console.error('FATAL: Hard timeout reached. Exiting.')
    process.exit(2)
  }, TIMEOUT_MS)
  hardTimeout.unref()

  // 1. Start Vite dev server
  console.log(`[harness] Starting Vite dev server on port ${PORT}...`)
  const devServer = spawn(
    'npx',
    ['vite', '--port', String(PORT)],
    {
      cwd: join(__dirname, '..'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

  devServer.stdout.on('data', d => process.stdout.write(`[vite] ${d}`))
  devServer.stderr.on('data', d => process.stderr.write(`[vite:err] ${d}`))

  try {
    await waitForPort(PORT, 20000)
    console.log(`[harness] Dev server ready at http://localhost:${PORT}`)
  } catch (err) {
    console.error('[harness] Dev server failed to start:', err.message)
    devServer.kill()
    process.exit(1)
  }

  // 2. Launch Chromium headless
  console.log('[harness] Launching Chromium headless...')
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--enable-webgl2',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  // 3. Register listeners BEFORE navigation
  const consoleMessages = []
  const pageErrors      = []
  const failedRequests  = []

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() })
  })

  page.on('pageerror', err => {
    pageErrors.push(err.message)
  })

  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`)
  })

  page.on('crash', () => {
    console.error('[harness] PAGE CRASHED')
  })

  page.on('close', () => {
    console.warn('[harness] PAGE CLOSED unexpectedly')
  })

  // 4. Navigate to game route.
  // Vite's dep optimizer triggers a full page reload on first access —
  // we use 'networkidle' so we wait until after the reload settles.
  console.log(`[harness] Navigating to ${BASE_URL} (waiting for networkidle)...`)
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  } catch (_) {
    // networkidle can time out on large bundles; fall back to just waiting
    console.warn('[harness] networkidle timeout — continuing')
  }

  // 5. Screenshots + driving simulation
  const savedShots = []

  async function shot(filename) {
    const p = join(SHOTS_DIR, filename)
    try {
      await page.screenshot({ path: p, fullPage: false, timeout: 20000, animations: 'disabled' })
      savedShots.push(p)
      console.log(`[harness] Screenshot: ${p}`)
    } catch (e) {
      console.warn(`[harness] Screenshot ${filename} failed: ${e.message}`)
    }
  }

  // Wait for the game canvas specifically
  try {
    await page.waitForSelector('canvas', { timeout: 10000 })
  } catch (_) {
    console.warn('[harness] canvas not found after networkidle — continuing anyway')
  }

  // Re-navigate now that Vite's optimizer has fully warmed up (avoids mid-test HMR reload)
  console.log('[harness] Re-navigating to stabilize after optimizer...')
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 })
    console.log('[harness] Second nav complete')
  } catch (e) {
    console.warn('[harness] second nav error:', e.message)
  }

  // Quick health check — can we still interact?
  try {
    const isAlive = await Promise.race([
      page.title(),
      sleep(3000).then(() => 'TIMEOUT'),
    ])
    console.log('[harness] Page title after nav2:', isAlive)
  } catch (e) {
    console.warn('[harness] Page title check failed:', e.message)
  }

  try {
    await page.waitForSelector('canvas', { timeout: 8000 })
    console.log('[harness] Canvas found after re-nav')
  } catch (_) {
    console.warn('[harness] Canvas NOT found after re-nav')
  }

  // Initial screenshot — static game state with labeled gates visible
  await sleep(800)
  await shot('game-01-initial.png')

  // Drive via the exposed window.__carEngine handle.
  // CarGameStandalone sets this on mount for headless test use.
  // Car starts at t=0.08 heading right; CP1 at t=0.115 is ~37px ahead.
  const engineReady = await page.evaluate(() => !!window.__carEngine)
  console.log('[harness] __carEngine available:', engineReady)

  if (engineReady) {
    await page.evaluate(() => window.__carEngine.setInput({ up: true }))
    console.log('[harness] Engine input {up:true} — driving 3.5s toward CP1...')
  } else {
    console.log('[harness] __carEngine not found — firing key events as fallback...')
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true, cancelable: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    })
  }

  await sleep(3500)
  await shot('game-02-after.png')

  if (engineReady) {
    await page.evaluate(() => window.__carEngine.setInput({ up: false }))
  } else {
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }))
    })
  }
  console.log('[harness] drive input released')

  // Brief pause for ProjectCard slide-in animation, then capture card screenshot
  await sleep(800)
  await shot('game-03-card.png')

  // 6. Canvas pixel probe
  const canvasCheck = await Promise.race([
    page.evaluate(() => {
    const result = {
      canvasFound: false,
      canvasCount: 0,
      width: 0,
      height: 0,
      allBlack: null,
      nonBlackCount: 0,
      error: null,
    }

    try {
      const canvases = document.querySelectorAll('canvas')
      result.canvasCount = canvases.length

      if (canvases.length === 0) {
        result.error = 'No <canvas> elements found in DOM'
        return result
      }

      // Pick the largest canvas
      let target = canvases[0]
      for (const c of canvases) {
        if (c.width * c.height > target.width * target.height) target = c
      }

      result.canvasFound = true
      result.width  = target.width
      result.height = target.height

      if (target.width === 0 || target.height === 0) {
        result.error = 'Canvas has zero dimensions'
        return result
      }

      // Sample pixels via offscreen copy
      const off  = document.createElement('canvas')
      off.width  = target.width
      off.height = target.height
      const ctx2d = off.getContext('2d')
      ctx2d.drawImage(target, 0, 0)

      const pts = []
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const x  = Math.floor((target.width  / 6) * (i + 1))
          const y  = Math.floor((target.height / 6) * (j + 1))
          const px = ctx2d.getImageData(x, y, 1, 1).data
          pts.push([px[0], px[1], px[2], px[3]])
        }
      }

      const allBlack = pts.every(([r, g, b]) => r === 0 && g === 0 && b === 0)
      result.allBlack = allBlack
      result.nonBlackCount = pts.filter(([r, g, b]) => r > 0 || g > 0 || b > 0).length

    } catch (e) {
      result.error = e.message
    }

    return result
  }),
  sleep(6000).then(() => ({ canvasFound: false, canvasCount: 0, width: 0, height: 0, allBlack: null, nonBlackCount: 0, error: 'evaluate timeout' })),
  ])

  // 7. Structured summary
  console.log('\n' + '='.repeat(70))
  console.log('=== CONSOLE MESSAGES ===')
  const deduped = dedupeMessages(consoleMessages)
  if (deduped.length === 0) {
    console.log('  (none)')
  } else {
    deduped.forEach(m => console.log(' ', m))
  }

  console.log('\n=== PAGE ERRORS ===')
  if (pageErrors.length === 0) {
    console.log('  (none)')
  } else {
    pageErrors.forEach(e => console.log(' ', e))
  }

  console.log('\n=== FAILED REQUESTS ===')
  if (failedRequests.length === 0) {
    console.log('  (none)')
  } else {
    failedRequests.forEach(r => console.log(' ', r))
  }

  console.log('\n=== CANVAS CHECK ===')
  console.log('  Canvas elements found  :', canvasCheck.canvasCount)
  if (canvasCheck.canvasFound) {
    console.log('  Canvas dimensions      :', `${canvasCheck.width}x${canvasCheck.height}`)
    console.log('  All-black pixels       :', canvasCheck.allBlack)
    console.log('  Non-black pixels /25   :', canvasCheck.nonBlackCount)
  }
  if (canvasCheck.error) {
    console.log('  Error                  :', canvasCheck.error)
  }

  console.log('\n=== SCREENSHOTS ===')
  savedShots.forEach(p => console.log(' ', p))
  console.log('='.repeat(70) + '\n')

  // 8. Cleanup
  devServer.kill('SIGTERM')
  try { devServer.kill('SIGKILL') } catch (_) {}

  try {
    await Promise.race([
      browser.close(),
      sleep(3000),
    ])
  } catch (_) {}

  clearTimeout(hardTimeout)
  console.log('[harness] Done.')
  process.exit(0)
}

main().catch(err => {
  console.error('[harness] Fatal error:', err)
  process.exit(1)
})
