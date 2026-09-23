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
      const file = match && resolve('public/apps', match[1], 'index.html')
      if (!file || !existsSync(file)) return next()
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(readFileSync(file))
    })
  },
}

export default defineConfig({
  plugins: [react(), staticAppIndex],
  // Production builds were emitting classic React.createElement with no React
  // in scope ("React is not defined" on first paint) even though the resolved
  // oxc config says automatic. Pinning esbuild's JSX mode fixes the output.
  esbuild: { jsx: 'automatic' },
  build: {
    // Nothing on the /work path may pull in three or the scan bundle — if this
    // warning starts naming a chunk on the fast path, that is a regression.
    chunkSizeWarningLimit: 2048,
    rollupOptions: {
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
