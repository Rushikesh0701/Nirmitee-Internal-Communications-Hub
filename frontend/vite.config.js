import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',  // Use absolute paths for SPA routing
  plugins: [react()],
  publicDir: 'public',  // Copy files from public folder to dist

  // Local dev settings only
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://nirmitee-internal-communications-hub.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})