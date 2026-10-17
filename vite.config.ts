import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps the built app portable: the same dist/ works when Vite
// serves it over http and when Electron loads it from file://.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
})
