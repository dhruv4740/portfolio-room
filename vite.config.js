import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Production builds were emitting classic React.createElement with no React
  // in scope ("React is not defined" on first paint) even though the resolved
  // oxc config says automatic. Pinning esbuild's JSX mode fixes the output.
  esbuild: { jsx: 'automatic' },
  build: {
    // Spark's renderer is ~5MB raw / ~1.8MB gzip and is dynamically imported by
    // SplatStage, so it lands in its own lazy chunk automatically. Nothing on
    // the /work path may pull it in — if this warning starts naming a chunk on
    // the fast path, that is a regression, not noise.
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
