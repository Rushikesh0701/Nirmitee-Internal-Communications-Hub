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
        // Use localhost for local development
        // target: 'http://localhost:5002',
        target: 'https://nirmitee-internal-communications-hub.onrender.com',
        changeOrigin: true,
        secure: false,
        // Deployed backend URL (commented out for local development)
        // target: 'https://nirmitee-internal-communications-hub.onrender.com',
      }
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})