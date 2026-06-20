/**
 * verify-panels.mjs — Panel UI verification harness.
 *
 * Usage:
 *   node scripts/verify-panels.mjs
 *
 * What it does:
 *  1. Spawns `npx vite --port 5174` (DEV server — ?panel= only works in DEV mode)
 *  2. Waits until server responds
 *  3. Launches Chromium headless with software WebGL
 *  4. For each panel (contact, about, help):
 *       loads /?panel=<name>, waits ~3s for boot skip + panel open, screenshots
 *  5. Prints CONSOLE + PAGE ERRORS for all runs
 *  6. Kills dev server + browser
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

  const savedShots = []
  const allErrors  = {}

  // Helper: load a ?panel= URL, wait for the panel to appear, screenshot.
  async function capturePanel(panelName) {
    const url      = `http://localhost:${PORT}/?panel=${panelName}`
    const filename = `panel-${panelName}.png`
    console.log(`\n[harness] === Capturing panel=${panelName} => ${filename} ===`)

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
    await sleep(3000)

    // Second nav — clean load after optimizer
    console.log('[harness] Re-navigating after optimizer warmup...')
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 15000 })
    } catch (_) {
      console.warn('[harness] nav2 failed — continuing')
    }

    try { await page.waitForSelector('canvas', { timeout: 8000 }) } catch (_) {}

    // Wait for panel to appear — each panel has role="dialog"
    console.log(`[harness] Waiting for panel dialog to appear...`)
    try {
      await page.waitForSelector('[role="dialog"]', { timeout: 12000 })
      console.log(`[harness] ✓ Panel dialog found`)
    } catch {
      console.log(`[harness] ✗ Panel dialog not found — taking screenshot anyway`)
    }

    // Small settle
    await sleep(600)

    const shotPath = join(SHOTS_DIR, filename)
    try {
      await page.screenshot({ path: shotPath, fullPage: false, timeout: 20000 })
      savedShots.push(shotPath)
      console.log(`[harness] Screenshot: ${shotPath}`)
    } catch (e) {
      console.warn(`[harness] Screenshot failed: ${e.message}`)
    }

    allErrors[filename] = { consoleMessages, pageErrors }
    await context.close()
  }

  // 3. Capture all three panels
  await capturePanel('contact')
  await capturePanel('about')
  await capturePanel('help')

  // 4. Print summary
  console.log('\n' + '='.repeat(70))
  for (const [file, { consoleMessages, pageErrors }] of Object.entries(allErrors)) {
    console.log(`\n=== ${file.toUpperCase()} — CONSOLE MESSAGES ===`)
    const deduped = dedupeMessages(consoleMessages)
    if (deduped.length === 0) {
      console.log('  (none)')
    } else {
      deduped.forEach(m => console.log(' ', m))
    }
    console.log(`\n=== ${file.toUpperCase()} — PAGE ERRORS ===`)
    if (pageErrors.length === 0) {
      console.log('  (none)')
    } else {
      pageErrors.forEach(e => console.log(' ', e))
    }
  }

  console.log('\n=== SCREENSHOTS ===')
  savedShots.forEach(p => console.log(' ', p))
  console.log('='.repeat(70) + '\n')

  // 5. Cleanup
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
