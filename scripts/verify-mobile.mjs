/**
 * verify-mobile.mjs — Mobile emulation verification harness.
 *
 * Usage:
 *   node scripts/verify-mobile.mjs
 *
 * What it does:
 *  1. Spawns `npx vite --port 5174` (DEV server)
 *  2. Waits until server responds
 *  3. Launches Chromium headless with iPhone 14 Pro mobile emulation
 *     (viewport 390×844, isMobile:true, hasTouch:true, phone UA)
 *  4. Navigates to http://localhost:5174/
 *  5. Waits up to 12s for CINEMATIC state ("click to explore" or orbitable scene)
 *  6. Screenshots scripts/shots/mobile.png
 *  7. Prints CONSOLE + PAGE ERRORS
 *  8. Kills dev server + browser
 *
 * Checks:
 *  - No pointer-lock crosshair in DOM (div with crosshair style absent)
 *  - "best experienced on desktop" banner present
 *  - No page errors
 *
 * Hard timeout: 150s
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
const TIMEOUT_MS = 150000

const __dirname  = dirname(fileURLToPath(import.meta.url))
const SHOTS_DIR  = join(__dirname, 'shots')

mkdirSync(SHOTS_DIR, { recursive: true })

// iPhone 14 Pro UA
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitForPort(port, maxMs = 25000) {
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
    await waitForPort(PORT, 30000)
    console.log(`[harness] Dev server ready at http://localhost:${PORT}`)
  } catch (err) {
    console.error('[harness] Dev server failed to start:', err.message)
    devServer.kill()
    process.exit(1)
  }

  // 2. Launch Chromium headless with mobile emulation
  console.log('[harness] Launching Chromium headless (mobile emulation)...')
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
    viewport:   { width: 390, height: 844 },
    isMobile:   true,
    hasTouch:   true,
    userAgent:  MOBILE_UA,
  })

  const page = await context.newPage()

  const consoleMessages = []
  const pageErrors      = []

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }))
  page.on('pageerror', err => pageErrors.push(err.message))

  const url = `http://localhost:${PORT}/`
  console.log(`\n[harness] Navigating to ${url} (mobile emulation)...`)

  // First nav — lets Vite optimizer warm up
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 15000 })
  } catch (_) {
    console.warn('[harness] nav1 failed — continuing')
  }

  try { await page.waitForSelector('canvas', { timeout: 8000 }) } catch (_) {}
  await sleep(4000)

  // Second nav — clean load after optimizer
  console.log('[harness] Re-navigating after optimizer warmup...')
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 15000 })
  } catch (_) {
    console.warn('[harness] nav2 failed — continuing')
  }

  try { await page.waitForSelector('canvas', { timeout: 8000 }) } catch (_) {}

  // Wait for the loading screen to clear and terminal to finish
  console.log('[harness] Waiting for CINEMATIC state...')
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText &&
        document.body.innerText.includes('click to explore'),
      { timeout: 30000 }
    )
    console.log('[harness] ✓ CINEMATIC state reached')
  } catch {
    console.log('[harness] ✗ Timeout waiting for CINEMATIC — taking screenshot anyway')
  }

  await sleep(1000)

  // Check for mobile-specific DOM elements
  const mobileChecks = await page.evaluate(() => {
    const bodyText = document.body.innerText || ''
    // Look for the "best experienced on desktop" banner
    const hasMobileBanner = bodyText.includes('best experienced on desktop')
    // Crosshair is a div with background white rounded, only in WALKING HUD
    // In mobile mode there should be no crosshair-style div with specific inline style
    const allDivs = Array.from(document.querySelectorAll('div'))
    const hasCrosshair = allDivs.some(d =>
      d.style.width === '8px' &&
      d.style.height === '8px' &&
      d.style.borderRadius === '50%'
    )
    return { hasMobileBanner, hasCrosshair }
  })

  console.log('\n[harness] Mobile checks:')
  console.log(`  "best experienced on desktop" banner: ${mobileChecks.hasMobileBanner ? '✓ PRESENT' : '✗ MISSING'}`)
  console.log(`  Pointer-lock crosshair: ${mobileChecks.hasCrosshair ? '✗ PRESENT (unexpected)' : '✓ ABSENT'}`)

  const shotPath = join(SHOTS_DIR, 'mobile.png')
  try {
    await page.screenshot({ path: shotPath, fullPage: false, timeout: 20000 })
    console.log(`\n[harness] Screenshot: ${shotPath}`)
  } catch (e) {
    console.warn(`[harness] Screenshot failed: ${e.message}`)
  }

  // Print summary
  console.log('\n' + '='.repeat(70))
  console.log('\n=== CONSOLE MESSAGES ===')
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

  console.log('\n=== RESULT ===')
  const passed = mobileChecks.hasMobileBanner && !mobileChecks.hasCrosshair && pageErrors.length === 0
  console.log(`  Overall: ${passed ? 'PASS' : 'FAIL'}`)
  console.log(`  Screenshot: ${shotPath}`)
  console.log('='.repeat(70) + '\n')

  // Cleanup
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
