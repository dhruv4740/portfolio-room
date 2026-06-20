/**
 * verify-survey.mjs — Hologram chart verification harness.
 *
 * Usage:
 *   node scripts/verify-survey.mjs
 *
 * What it does:
 *  1. Spawns `npx vite --port 5174` (DEV server — ?survey only works in DEV)
 *  2. Waits until server responds
 *  3. Launches Chromium headless with software WebGL
 *  4. Visits /?survey — waits up to 30s for "click to explore" (CINEMATIC HUD)
 *  5. Settles 800ms, screenshots scripts/shots/survey-hologram.png
 *  6. Prints CONSOLE / PAGE ERRORS
 *  7. Kills dev server + browser
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
    await waitForPort(PORT, 25000)
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

  const url = `http://localhost:${PORT}/?survey`
  console.log(`\n[harness] === Capturing survey view => survey-hologram.png ===`)

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page    = await context.newPage()

  const consoleMessages = []
  const pageErrors      = []

  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }))
  page.on('pageerror', err => pageErrors.push(err.message))

  // First nav — lets Vite optimizer warm up
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 15000 })
  } catch (_) {
    console.warn('[harness] nav1 failed — continuing')
  }

  try { await page.waitForSelector('canvas', { timeout: 8000 }) } catch (_) {}

  // Brief wait for optimizer reload to settle
  await sleep(4000)

  // Second nav — clean load
  console.log('[harness] Re-navigating after optimizer warmup...')
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 15000 })
  } catch (_) {
    console.warn('[harness] nav2 failed — continuing')
  }

  try { await page.waitForSelector('canvas', { timeout: 8000 }) } catch (_) {}

  // Wait for CINEMATIC state — "click to explore" text in HUD
  console.log('[harness] Waiting for CINEMATIC state ("click to explore")...')
  try {
    await page.waitForFunction(
      () => document.body && document.body.innerText &&
            document.body.innerText.includes('click to explore'),
      { timeout: 30000 }
    )
    console.log('[harness] ✓ CINEMATIC state reached')
  } catch {
    console.log('[harness] ✗ Timeout waiting for CINEMATIC state — screenshotting anyway')
  }

  // Settle for flicker to be visible
  await sleep(800)

  const shotPath = join(SHOTS_DIR, 'survey-hologram.png')
  try {
    await page.screenshot({ path: shotPath, fullPage: false, timeout: 20000 })
    console.log(`[harness] Screenshot: ${shotPath}`)
  } catch (e) {
    console.warn(`[harness] Screenshot failed: ${e.message}`)
  }

  // 3. Print summary
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

  console.log('\n=== SCREENSHOT ===')
  console.log(' ', shotPath)
  console.log('='.repeat(70) + '\n')

  // 4. Cleanup
  await context.close()
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
