import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import NotificationBell from '../components/NotificationBell'
import RoleBadge from '../components/RoleBadge'
import { getUserRole } from '../utils/userHelpers'
import { useDocumentTitle, useNotificationSound } from '../hooks/useNotificationEffects'
import Logo from '../assets/Logo.png'
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  MessageSquare,
  Award,
  ClipboardList,
  GraduationCap,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Megaphone,
  Users,
  UsersRound,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  useDocumentTitle('Nirmitee Hub')
  useNotificationSound()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRole = getUserRole(user)
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(userRole) || 
                             ['ADMIN', 'MODERATOR'].includes(user?.role)

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/news', icon: Newspaper, label: 'News' },
    { path: '/blogs', icon: BookOpen, label: 'Blogs' },
    { path: '/discussions', icon: MessageSquare, label: 'Discussions' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/recognitions', icon: Award, label: 'Recognitions' },
    { path: '/surveys', icon: ClipboardList, label: 'Surveys' },
    { path: '/learning', icon: GraduationCap, label: 'Learning' },
    { path: '/directory', icon: UsersRound, label: 'Directory' },
    ...(isAdminOrModerator
      ? [
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/rewards', icon: Award, label: 'Manage Rewards' },
        { path: '/admin/rss', icon: Newspaper, label: 'RSS Sources' }
      ]
      : [])
  ]

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebf3ff' }}>
      {/* Mobile header */}
      <motion.div 
        className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200 fixed top-0 left-0 right-0 z-30 shadow-sm"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard">
            <img src={Logo} alt="Nirmitee.io" className="h-8 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="flex min-h-screen">
        {/* Light Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-72
             transition-transform duration-300 ease-in-out bg-white border-r border-slate-200 shadow-lg`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-100">
              <Link to="/dashboard" className="block">
                <motion.div whileHover={{ scale: 1.02 }}>
                  <img src={Logo} alt="Nirmitee.io" className="h-10" />
                </motion.div>
              </Link>
              <p className="text-xs text-slate-500 tracking-wide font-medium mt-3">Internal Communications Hub</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                      <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <ChevronRight size={16} />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-slate-100">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {user?.name || user?.displayName || 'User'}
                  </p>
                  <div className="mt-0.5">
                    <RoleBadge role={userRole || 'Employee'} size="sm" />
                  </div>
                </div>
              </Link>
              
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 mt-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 lg:ml-72 min-h-screen flex flex-col pt-16 lg:pt-0 relative">
          {/* Top bar */}
          <motion.div 
            className="hidden lg:flex bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-8 py-4 items-center justify-between sticky top-0 lg:top-0 z-20 shadow-sm"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100">
                <span className="text-sm text-slate-600">Welcome back,</span>
                <span className="text-sm font-semibold text-indigo-600">{user?.displayName || user?.name || user?.firstName || 'User'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </motion.div>

          {/* Page content */}
          <motion.div 
            className="flex-1 p-4 lg:p-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            key={location.pathname}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default Layout
