import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Dev only: Vite's SPA fallback answers /apps/<name>/ with the portfolio's own
// index.html, which booted the whole room recursively inside the OS windows.
// Serve each static app's own index.html instead (preview/prod already do).
const staticAppIndex = {
  name: 'static-app-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const match = /^\/apps\/([\w-]+)\/?(?:index\.html)?(?:\?.*)?$/.exec(req.url || '')
      // Relative to this config, not the working directory: a server started
      // from another checkout served that checkout's apps.
      const file = match && resolve(import.meta.dirname, 'public/apps', match[1], 'index.html')
      if (!file || !existsSync(file)) return next()
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(readFileSync(file))
    })
  },
}

// Local parity with the host's _redirects: /work -> /work/ , /resume -> /resume/.
const slashRedirects = {
  name: 'slash-redirects',
  configureServer(server) { server.middlewares.use(redirect) },
  configurePreviewServer(server) { server.middlewares.use(redirect) },
}
function redirect(req, res, next) {
  const m = /^\/(work|resume)(\?.*)?$/.exec(req.url || '')
  if (!m) return next()
  res.statusCode = 301
  res.setHeader('Location', `/${m[1]}/${m[2] || ''}`)
  res.end()
}

export default defineConfig({
  plugins: [react(), staticAppIndex, slashRedirects],
  // Production builds were emitting classic React.createElement with no React
  // in scope ("React is not defined" on first paint) even though the resolved
  // oxc config says automatic. Pinning esbuild's JSX mode fixes the output.
  esbuild: { jsx: 'automatic' },
  // Real HTML files for / , /work/ and /resume/. No SPA fallback: an unknown
  // path must 404, never answer with the room's index.html.
  appType: 'mpa',
  build: {
    // Nothing on the /work path may pull in three or the scan bundle — if this
    // warning starts naming a chunk on the fast path, that is a regression.
    chunkSizeWarningLimit: 2048,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        work: resolve(import.meta.dirname, 'work/index.html'),
        resume: resolve(import.meta.dirname, 'resume/index.html'),
      },
      output: {
        manualChunks(id) {
          // three is shared by the scan surface only, but splitting it keeps
          // the Scan chunk readable when checking what actually grew.
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('react-dom') || id.includes('node_modules/react/')) return 'react'
        },
      },
    },
  },
})
