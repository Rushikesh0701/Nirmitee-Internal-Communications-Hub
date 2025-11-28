import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

import Layout from './layouts/Layout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AnnouncementNotification from './components/AnnouncementNotification'
import { publicRoutes, protectedRoutes } from './config/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  const { initialize } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  return (
    <QueryClientProvider client={queryClient}>
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
              <Route key={path} path={path} element={<Component />} />
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
                      <Component />
                    </RouteWrapper>
                  }
                />
              )
            })}
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
    </QueryClientProvider>
  )
}

export default App
