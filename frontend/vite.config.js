import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',  // 🔥 REQUIRED for Netlify or any static hosting!
  plugins: [react()],
  
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