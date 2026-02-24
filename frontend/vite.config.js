import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/',  // Use absolute paths for SPA routing
  plugins: [react()],
  publicDir: 'public',  // Copy files from public folder to dist

  // Force all packages to use the same React instance
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
  },

  // Local dev settings only
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Use localhost for local development
        // target: 'http://localhost:5002',
        target: 'https://nirmitee-internal-communications-hub.onrender.com/api',
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