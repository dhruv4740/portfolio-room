/**
 * verify-focus.mjs — Headless verification for the FOCUSED laptop view.
 *
 * Usage:
 *   node scripts/verify-focus.mjs
 *
 * What it does:
 *  1. Spawns `npx vite --port 5174` (DEV server — required for import.meta.env.DEV)
 *  2. Navigates to http://localhost:5174/?focus
 *     The ?focus param triggers setPhase('FOCUSED') on mount so CameraRig
 *     immediately tweens to the laptop screen.
 *  3. Waits ~3s for the dolly tween to settle
 *  4. Screenshots scripts/shots/focus-01.png
 *  5. Prints CONSOLE / PAGE ERRORS summary
 *  6. Kills server + browser
 *
 * Hard timeout: 60s
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
const BASE_URL   = `http://localhost:${PORT}/?focus`
const TIMEOUT_MS = 120000

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
  page.on('crash', () => console.error('[harness] PAGE CRASHED'))

  // 3. Navigate — wait for networkidle so Vite optimizer settles
  console.log(`[harness] Navigating to ${BASE_URL}...`)
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  } catch (_) {
    console.warn('[harness] networkidle timeout — continuing')
  }

  // Re-navigate after optimizer warmup
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 })
  } catch (_) {
    console.warn('[harness] second nav networkidle timeout — continuing')
  }

  // 4. Wait ~3s for GSAP dolly tween to complete + game to render a few frames
  console.log('[harness] Waiting 3.2s for dolly tween + game render...')
  await sleep(3200)

  // 5. Screenshot
  const savedShots = []
  async function shot(filename) {
    const p = join(SHOTS_DIR, filename)
    try {
      await page.screenshot({ path: p, fullPage: false, timeout: 15000, animations: 'disabled' })
      savedShots.push(p)
      console.log(`[harness] Screenshot: ${p}`)
    } catch (e) {
      console.warn(`[harness] Screenshot ${filename} failed: ${e.message}`)
    }
  }

  await shot('focus-01.png')

  // 6. Canvas pixel probe — check the game canvas is non-black
  const canvasCheck = await Promise.race([
    page.evaluate(() => {
      const result = { canvasFound: false, canvasCount: 0, width: 0, height: 0, allBlack: null, nonBlackCount: 0, error: null }
      try {
        const canvases = document.querySelectorAll('canvas')
        result.canvasCount = canvases.length
        if (canvases.length === 0) { result.error = 'No canvas found'; return result }
        let target = canvases[0]
        for (const c of canvases) {
          if (c.width * c.height > target.width * target.height) target = c
        }
        result.canvasFound = true
        result.width  = target.width
        result.height = target.height
        if (target.width === 0 || target.height === 0) { result.error = 'Zero-dimension canvas'; return result }
        const off = document.createElement('canvas')
        off.width  = target.width
        off.height = target.height
        off.getContext('2d').drawImage(target, 0, 0)
        const ctx2d = off.getContext('2d')
        const pts = []
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            const x = Math.floor((target.width / 6) * (i + 1))
            const y = Math.floor((target.height / 6) * (j + 1))
            const px = ctx2d.getImageData(x, y, 1, 1).data
            pts.push([px[0], px[1], px[2], px[3]])
          }
        }
        result.allBlack = pts.every(([r,g,b]) => r === 0 && g === 0 && b === 0)
        result.nonBlackCount = pts.filter(([r,g,b]) => r > 0 || g > 0 || b > 0).length
      } catch (e) { result.error = e.message }
      return result
    }),
    sleep(6000).then(() => ({ canvasFound: false, canvasCount: 0, error: 'evaluate timeout' })),
  ])

  // 7. Summary
  console.log('\n' + '='.repeat(70))
  console.log('=== CONSOLE MESSAGES ===')
  const deduped = dedupeMessages(consoleMessages)
  if (deduped.length === 0) console.log('  (none)')
  else deduped.forEach(m => console.log(' ', m))

  console.log('\n=== PAGE ERRORS ===')
  if (pageErrors.length === 0) console.log('  (none)')
  else pageErrors.forEach(e => console.log(' ', e))

  console.log('\n=== FAILED REQUESTS ===')
  if (failedRequests.length === 0) console.log('  (none)')
  else failedRequests.forEach(r => console.log(' ', r))

  console.log('\n=== CANVAS CHECK ===')
  console.log('  Canvas elements found  :', canvasCheck.canvasCount)
  if (canvasCheck.canvasFound) {
    console.log('  Canvas dimensions      :', `${canvasCheck.width}x${canvasCheck.height}`)
    console.log('  All-black pixels       :', canvasCheck.allBlack)
    console.log('  Non-black pixels /25   :', canvasCheck.nonBlackCount)
  }
  if (canvasCheck.error) console.log('  Error                  :', canvasCheck.error)

  console.log('\n=== SCREENSHOTS ===')
  savedShots.forEach(p => console.log(' ', p))
  console.log('='.repeat(70) + '\n')

  // 8. Cleanup
  devServer.kill('SIGTERM')
  try { devServer.kill('SIGKILL') } catch (_) {}

  try {
    await Promise.race([browser.close(), sleep(3000)])
  } catch (_) {}

  clearTimeout(hardTimeout)
  console.log('[harness] Done.')
  process.exit(0)
}

main().catch(err => {
  console.error('[harness] Fatal error:', err)
  process.exit(1)
})
