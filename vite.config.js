import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Rapier WASM + JS bindings → separate lazy chunk
          if (id.includes('@react-three/rapier') || id.includes('@dimforge/rapier3d')) {
            return 'physics'
          }
          // drei utilities (large, but not WASM) → separate vendor chunk
          if (id.includes('@react-three/drei')) {
            return 'drei'
          }
          // postprocessing → separate chunk (loaded eagerly but tree-shaken better)
          if (id.includes('@react-three/postprocessing') || id.includes('postprocessing')) {
            return 'postprocessing'
          }
        },
      },
    },
  },
})
