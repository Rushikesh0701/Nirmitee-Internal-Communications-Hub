import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useEffect, useCallback, Suspense } from 'react'
import { useAuthStore } from './store/authStore'

import Layout from './layouts/Layout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import RootRedirect from './components/RootRedirect'
import AdminRoute from './components/AdminRoute'
import AnnouncementNotification from './components/AnnouncementNotification'
import { ThemeProvider } from './contexts/ThemeContext'
import { publicRoutes, protectedRoutes } from './config/routes'
import { PageSkeleton } from './components/skeletons'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus - use staleTime instead
      refetchOnMount: false, // Don't refetch on mount if data exists and is fresh
      refetchOnReconnect: false, // Don't auto-refetch on reconnect
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh for 2 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes - keep data in cache for 30 minutes
      keepPreviousData: true, // Keep previous data while fetching new data
      structuralSharing: true, // Optimize re-renders
    },
  },
})

// Suspense fallback component for page content only
const PageSuspenseFallback = () => (
  <div className="flex-1 p-2 lg:p-3">
    <PageSkeleton lines={8} showHeader={true} />
  </div>
)

// Auth Suspense fallback
const AuthSuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <PageSkeleton lines={5} showHeader={false} />
  </div>
)

function App() {
  const { initialize } = useAuthStore()
  
  // Memoize initialize to prevent unnecessary re-renders
  const handleInitialize = useCallback(() => {
    initialize()
  }, [initialize])
  
  useEffect(() => {
    handleInitialize()
  }, [handleInitialize])
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AnnouncementNotification />
        <Routes>
          <Route element={<AuthLayout />}>
            {publicRoutes.map(({ path, component: Component }) => (
              <Route 
                key={path} 
                path={path} 
                element={
                  <PublicRoute>
                    <Suspense fallback={<AuthSuspenseFallback />}>
                      <Component />
                    </Suspense>
                  </PublicRoute>
                } 
              />
            ))}
          </Route>

          <Route element={<Layout />}>
            {protectedRoutes.map(({ path, component: Component, admin }) => {
              const RouteWrapper = admin ? AdminRoute : ProtectedRoute
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <RouteWrapper>
                      <Suspense fallback={<PageSuspenseFallback />}>
                        <Component />
                      </Suspense>
                    </RouteWrapper>
                  }
                />
              )
            })}
          </Route>

          <Route path="/" element={<RootRedirect />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
