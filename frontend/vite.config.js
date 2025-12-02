import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://nirmitee-internal-communications-hub.onrender.com',
        changeOrigin: true,
        credentials: true
      }
    }
  }
})

