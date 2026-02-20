import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

const AFTER_SIGN_OUT_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_OUT_URL || '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl={AFTER_SIGN_OUT_URL}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ClerkProvider>
  </React.StrictMode>,
)

// ============================================
// Service Worker Registration
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registered with scope:', registration.scope);

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        registration.update();
        console.log('[SW] Checking for service worker updates...');
      }, 60 * 60 * 1000);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New content available; please refresh.');
            }
          });
        }
      });
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  });
}
