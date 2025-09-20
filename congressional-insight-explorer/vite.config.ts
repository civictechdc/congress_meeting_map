import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = (
  (globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env?.BASE_PATH ?? '/'
)

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: basePath,
  plugins: [react()],
  assetsInclude: ['**/*.jsonld'],
  build: {
    rollupOptions: {
      external: [],
    },
  },
}))
