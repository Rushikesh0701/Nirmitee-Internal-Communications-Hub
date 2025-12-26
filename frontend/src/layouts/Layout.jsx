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
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  useDocumentTitle('Nirmitee Hub')
  useNotificationSound()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRole = getUserRole(user)
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(userRole) || 
                             ['ADMIN', 'MODERATOR'].includes(user?.role)

  // Organize navigation into sections - use useMemo to prevent unnecessary recalculations
  const navSections = useMemo(() => [
    {
      title: 'ANALYTICS',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ...(isAdminOrModerator ? [{ path: '/analytics', icon: BarChart3, label: 'Analytics' }] : [])
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { path: '/announcements', icon: Megaphone, label: 'Announcements' },
        { path: '/news', icon: Newspaper, label: 'News' },
        { path: '/blogs', icon: BookOpen, label: 'Blogs' },
        { path: '/discussions', icon: MessageSquare, label: 'Discussions' }
      ]
    },
    {
      title: 'COLLABORATION',
      items: [
        { path: '/groups', icon: Users, label: 'Groups' },
        { path: '/recognitions', icon: Award, label: 'Recognitions' },
        { path: '/surveys', icon: ClipboardList, label: 'Surveys' }
      ]
    },
    {
      title: 'LEARNING',
      items: [
        { path: '/learning', icon: GraduationCap, label: 'Learning' },
        { path: '/directory', icon: UsersRound, label: 'Directory' }
      ]
    },
    ...(isAdminOrModerator
      ? [{
          title: 'ADMIN',
          items: [
            { path: '/admin/rewards', icon: Award, label: 'Manage Rewards' },
            { path: '/admin/rss', icon: Newspaper, label: 'RSS Sources' }
          ]
        }]
      : [])
  ], [isAdminOrModerator])

  // State to track expanded sections - initialize all as expanded
  const [expandedSections, setExpandedSections] = useState(() => {
    const sections = {}
    // Initialize with default sections (admin will be added when user loads)
    const defaultSections = ['ANALYTICS', 'COMMUNICATION', 'COLLABORATION', 'LEARNING']
    defaultSections.forEach(title => {
      sections[title] = true
    })
    return sections
  })

  // Track which sections have been rendered before (to skip animation on first appearance)
  // Use ref to avoid re-renders and for immediate access
  const renderedSectionsRef = useRef(new Set(['ANALYTICS', 'COMMUNICATION', 'COLLABORATION', 'LEARNING']))

  // Update expanded sections immediately when navSections changes (e.g., admin section appears)
  useEffect(() => {
    setExpandedSections(prev => {
      const updated = { ...prev }
      let hasChanges = false
      navSections.forEach(section => {
        // If section is new (wasn't in previous state), add it as expanded
        if (updated[section.title] === undefined) {
          updated[section.title] = true
          hasChanges = true
        }
      })
      // Only update if there are actual changes to prevent unnecessary re-renders
      return hasChanges ? updated : prev
    })

    // Track newly added sections in ref (updates synchronously, no re-render)
    navSections.forEach(section => {
      renderedSectionsRef.current.add(section.title)
    })
  }, [navSections])

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }))
  }

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
        <div className="flex items-center justify-between p-3">
          <Link to="/dashboard">
            <img src={Logo} alt="Nirmitee.io" className="h-7 cursor-pointer hover:opacity-80 transition-opacity" />
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
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <Menu size={20} />
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
            } lg:translate-x-0 fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-56'}
             transition-all duration-300 ease-in-out bg-white border-r border-slate-200 shadow-lg`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className={`${sidebarCollapsed ? 'px-3' : 'px-4 lg:px-6'} h-[60px] border-b border-slate-100 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {sidebarCollapsed ? (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="flex items-center justify-center"
                >
                  <img src={Logo} alt="Nirmitee.io" className="h-5" />
                </button>
              ) : (
                <>
                  <Link to="/dashboard" className="flex flex-col items-start justify-center gap-0.5">
                    <img src={Logo} alt="Nirmitee.io" className="h-5" />
                    <p className="text-[9px] text-slate-500 tracking-wide font-medium leading-tight">Internal Communications Hub</p>
                  </Link>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                    title="Collapse sidebar"
                  >
                    <ChevronsLeft size={16} className="text-slate-500" />
                  </button>
                </>
              )}
            </div>

            {/* Navigation with Sections */}
            <nav className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {sidebarCollapsed ? (
                // Collapsed view - show only icons
                <div className="space-y-1">
                  {navSections.flatMap(section => section.items).map((item) => {
                    const Icon = item.icon
                    const isActive = isActivePath(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 group
                          ${isActive 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        title={item.label}
                      >
                        <Icon 
                          size={20} 
                          className={isActive 
                            ? 'text-indigo-600' 
                            : 'text-slate-400 group-hover:text-indigo-500'
                          } 
                        />
                      </Link>
                    )
                  })}
                </div>
              ) : (
                // Expanded view - show full navigation
                navSections.map((section) => {
                  const isExpanded = expandedSections[section.title] !== false
                  return (
                    <div key={section.title} className="mb-3">
                      {/* Section Header - Clickable */}
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between px-3 py-1.5 mb-1 hover:bg-slate-50 rounded-md transition-colors group"
                      >
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {section.title}
                        </p>
                        <ChevronDown 
                          size={12} 
                          className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {/* Section Items - With smooth animation */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            className="space-y-0.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {section.items.map((item, itemIndex) => {
                              const Icon = item.icon
                              const isActive = isActivePath(item.path)
                              // Skip animation delay for sections that just appeared (like admin section on first load)
                              const isNewSection = !renderedSectionsRef.current.has(section.title)
                              return (
                                <motion.div
                                  key={item.path}
                                  initial={isNewSection ? false : { opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={isNewSection ? { duration: 0 } : { 
                                    duration: 0.25, 
                                    delay: itemIndex * 0.04,
                                    ease: "easeOut" 
                                  }}
                                >
                                  <Link
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all duration-200 group
                                      ${isActive 
                                        ? 'bg-indigo-100 text-indigo-700' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                  >
                                    <Icon 
                                      size={18} 
                                      className={isActive 
                                        ? 'text-indigo-600' 
                                        : 'text-slate-400 group-hover:text-indigo-500'
                                      } 
                                    />
                                    <span className="flex-1 text-xs">{item.label}</span>
                                  </Link>
                                </motion.div>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </nav>

            {/* User Profile Section - Above Logout */}
            {!sidebarCollapsed && (
              <div className="p-1.5 border-t border-slate-100">
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-1.5 p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">
                      {user?.name || user?.displayName || 'User'}
                    </p>
                    <div className="mt-0 flex items-center gap-1">
                      <RoleBadge role={userRole || 'Employee'} size="sm" />
                      <ChevronDown size={9} className="text-slate-400" />
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Logout Button at Bottom */}
            <div className={`${sidebarCollapsed ? 'p-2' : 'p-2'} border-t border-slate-100`}>
              <motion.button
                onClick={handleLogout}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} px-2.5 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-all font-medium`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                title={sidebarCollapsed ? "Logout" : ""}
              >
                <LogOut size={14} />
                {!sidebarCollapsed && <span className="text-xs">Logout</span>}
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
        <main className={`flex-1 min-h-screen flex flex-col pt-14 lg:pt-0 relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
          {/* Top bar */}
          <div 
            className="hidden lg:flex bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 lg:px-6 h-[60px] items-center justify-between sticky top-0 z-20 shadow-sm"
          >
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
                <span className="text-sm text-slate-600">Welcome back,</span>
                <span className="text-sm font-semibold text-indigo-600">{user?.displayName || user?.name || user?.firstName || 'User'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>

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
