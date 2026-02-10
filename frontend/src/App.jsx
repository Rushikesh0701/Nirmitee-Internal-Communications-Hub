import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useEffect, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import { useAuth } from '@clerk/clerk-react'
import api from './services/api'

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
import SSOCallback from './pages/auth/SSOCallback'

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
  const { initialize, setAnonymous } = useAuthStore()
  const { getToken, isLoaded: isClerkLoaded, isSignedIn } = useAuth()
  
  // EFFECT: Set up automatic Clerk token injection for all API requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        try {
          const manualToken = localStorage.getItem('accessToken');
          if (manualToken) {
            config.headers.Authorization = `Bearer ${manualToken}`;
            return config;
          }

          if (isClerkLoaded) {
            const clerkToken = await getToken();
            if (clerkToken) {
              config.headers.Authorization = `Bearer ${clerkToken}`;
            }
          }
        } catch (error) {
          console.error('Error in auth interceptor:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    }
  }, [getToken, isClerkLoaded])

  // EFFECT: Controlled initialization
  useEffect(() => {
    const manualToken = localStorage.getItem('accessToken')
    
    if (isClerkLoaded) {
      if (isSignedIn) {
        // Clerk is signed in - verify with backend
        initialize(true)
      } else if (manualToken) {
        // Not signed in to Clerk, but have manual token - verify
        initialize()
      } else {
        // Not signed in, no token - set anonymous state immediately
        // faster and avoids 401 error in console
        setAnonymous()
      }
    }
  }, [initialize, isClerkLoaded, isSignedIn, setAnonymous])
  
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
          {/* SSO callback route - must be outside AuthLayout to avoid PublicRoute redirect */}
          <Route path="/sso-callback" element={<SSOCallback />} />

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
