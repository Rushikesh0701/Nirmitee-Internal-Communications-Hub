import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin: inject env vars into firebase-messaging-sw.js
function firebaseSWEnvPlugin() {
  let envVars = {};

  return {
    name: 'firebase-sw-env',

    configResolved(config) {
      // Load VITE_ env vars
      const env = loadEnv(config.mode, config.root, 'VITE_');
      envVars = env;
    },

    // Dev server: serve the SW file with env vars replaced on the fly
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/firebase-messaging-sw.js') {
          const filePath = path.resolve('public/firebase-messaging-sw.js');
          let content = fs.readFileSync(filePath, 'utf-8');

          // Replace __VITE_*__ placeholders with actual values
          content = content.replace(/__VITE_([A-Z_]+)__/g, (match, key) => {
            return envVars[`VITE_${key}`] || match;
          });

          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Service-Worker-Allowed', '/');
          res.end(content);
          return;
        }
        next();
      });
    },

    // Build: replace placeholders in the output
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const swPath = path.resolve(outDir, 'firebase-messaging-sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__VITE_([A-Z_]+)__/g, (match, key) => {
          return envVars[`VITE_${key}`] || match;
        });
        fs.writeFileSync(swPath, content);
      }
    }
  };
}

export default defineConfig({
  base: '/',  // Use absolute paths for SPA routing
  plugins: [react(), firebaseSWEnvPlugin()],
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