import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import NotificationBell from '../components/NotificationBell'
import RoleBadge from '../components/RoleBadge'
import { getUserRole } from '../utils/userHelpers'
import { useDocumentTitle, useNotificationSound } from '../hooks/useNotificationEffects'
import Logo from '../assets/Logo.png'
import CollapsedLogo from '../assets/Untitled_design-removebg-preview.png'
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
  ChevronsRight,
  Moon,
  Sun
} from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'

// Helper functions for sidebar state persistence
const getSidebarCollapsedState = () => {
  try {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  } catch {
    return false
  }
}

const setSidebarCollapsedState = (collapsed) => {
  try {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
  } catch (error) {
    console.error('Failed to save sidebar collapsed state:', error)
  }
}

const getExpandedSectionsState = () => {
  try {
    const saved = localStorage.getItem('sidebarExpandedSections')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const setExpandedSectionsState = (sections) => {
  try {
    localStorage.setItem('sidebarExpandedSections', JSON.stringify(sections))
  } catch (error) {
    console.error('Failed to save expanded sections state:', error)
  }
}

// Helper functions for theme persistence
const getSidebarTheme = () => {
  try {
    const saved = localStorage.getItem('sidebarTheme')
    return saved || 'light' // Default to light theme
  } catch {
    return 'light'
  }
}

const saveSidebarTheme = (theme) => {
  try {
    localStorage.setItem('sidebarTheme', theme)
  } catch (error) {
    console.error('Failed to save sidebar theme:', error)
  }
}

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsedState)
  const [sidebarTheme, setSidebarTheme] = useState(getSidebarTheme) // 'light' or 'dark'

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

  // State to track expanded sections - load from localStorage or initialize all as expanded
  const [expandedSections, setExpandedSections] = useState(() => {
    const savedSections = getExpandedSectionsState()
    if (savedSections) {
      return savedSections
    }
    // Initialize with default sections (admin will be added when user loads)
    const sections = {}
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
  // Merge saved state with new sections, defaulting new sections to expanded
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

  // Save sidebar collapsed state to localStorage whenever it changes
  useEffect(() => {
    setSidebarCollapsedState(sidebarCollapsed)
  }, [sidebarCollapsed])

  // Save expanded sections to localStorage whenever they change
  useEffect(() => {
    setExpandedSectionsState(expandedSections)
  }, [expandedSections])

  // Save sidebar theme to localStorage whenever it changes
  useEffect(() => {
    saveSidebarTheme(sidebarTheme)
  }, [sidebarTheme])

  const toggleTheme = () => {
    setSidebarTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => {
      const updated = {
        ...prev,
        [sectionTitle]: !prev[sectionTitle]
      }
      return updated
    })
  }

  const handleSidebarCollapseToggle = (collapsed) => {
    setSidebarCollapsed(collapsed)
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
        {/* Modern Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-56'}
             transition-all duration-300 ease-in-out 
             ${sidebarTheme === 'dark'
              ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/60 shadow-[4px_0_24px_rgba(0,0,0,0.3)]'
              : 'bg-gradient-to-b from-slate-50 via-white to-slate-50/50 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.06)]'
            }
             backdrop-blur-xl`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className={`${sidebarCollapsed ? 'px-3' : 'px-4 lg:px-6'} h-[60px] border-b ${sidebarTheme === 'dark' ? 'border-slate-700/50 bg-gradient-to-r from-slate-800/50 via-transparent to-transparent' : 'border-slate-200/50 bg-gradient-to-r from-indigo-50/30 via-transparent to-transparent'} flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {sidebarCollapsed ? (
                <button
                  onClick={() => handleSidebarCollapseToggle(false)}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all duration-200 group ${sidebarTheme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50/50'}`}
                >
                  <img src={CollapsedLogo} alt="Nirmitee.io" className="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-200" />
                </button>
              ) : (
                <>
                  <Link to="/dashboard" className="flex flex-col items-start justify-center gap-0.5 group">
                    <img src={Logo} alt="Nirmitee.io" className="h-5 group-hover:opacity-80 transition-opacity" />
                    <p className={`text-[9px] tracking-wide font-medium leading-tight transition-colors ${sidebarTheme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'}`}>Internal Communications Hub</p>
                  </Link>
                  <button
                    onClick={() => handleSidebarCollapseToggle(true)}
                    className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${sidebarTheme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-indigo-50/50'}`}
                    title="Collapse sidebar"
                  >
                    <ChevronsLeft size={16} className={sidebarTheme === 'dark' ? 'text-slate-400 hover:text-slate-300 transition-colors' : 'text-slate-500 hover:text-indigo-600 transition-colors'} />
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
                        className={`flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : sidebarTheme === 'dark'
                              ? 'text-slate-300 hover:text-indigo-400 hover:bg-slate-700/50'
                              : 'text-slate-600 hover:text-indigo-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-50/50'
                          }`}
                        title={item.label}
                      >
                        <Icon
                          size={20}
                          className={`transition-all duration-200 ${isActive
                              ? 'text-white'
                              : sidebarTheme === 'dark'
                                ? 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'
                                : 'text-slate-400 group-hover:text-indigo-600 group-hover:scale-110'
                            }`}
                        />
                        {isActive && (
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                        )}
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
                        className={`w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg transition-all duration-200 group ${sidebarTheme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-indigo-50/30'}`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTheme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-indigo-600'}`}>
                          {section.title}
                        </p>
                        <ChevronDown
                          size={12}
                          className={`transition-all duration-200 ${isExpanded ? 'rotate-180' : ''} ${sidebarTheme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-indigo-600'}`}
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
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group relative
                                      ${isActive
                                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                        : sidebarTheme === 'dark'
                                          ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                          : 'text-slate-700 hover:text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-transparent'
                                      }`}
                                  >
                                    <Icon
                                      size={18}
                                      className={`transition-all duration-200 ${isActive
                                          ? 'text-white'
                                          : sidebarTheme === 'dark'
                                            ? 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'
                                            : 'text-slate-500 group-hover:text-indigo-600 group-hover:scale-110'
                                        }`}
                                    />
                                    <span className={`flex-1 text-xs transition-all duration-200 ${isActive ? 'font-semibold' : 'group-hover:font-medium'
                                      }`}>{item.label}</span>
                                    {isActive && (
                                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm" />
                                    )}
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
              <div className={`p-1.5 border-t ${sidebarTheme === 'dark' ? 'border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-transparent' : 'border-slate-200/50 bg-gradient-to-r from-indigo-50/20 to-transparent'}`}>
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-start gap-2 p-1.5 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md ${sidebarTheme === 'dark'
                      ? 'bg-slate-800/50 hover:bg-slate-700/70'
                      : 'bg-gradient-to-r from-indigo-50/50 to-purple-50/30 hover:from-indigo-100/50 hover:to-purple-100/40'
                    }`}
                >
                  <div className="relative">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <User size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <p className={`text-[11px] font-semibold leading-tight transition-colors break-words line-clamp-2 ${sidebarTheme === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user?.displayName || user?.name || 'User'}
                    </p>
                    <div className="flex items-center gap-1">
                      <RoleBadge role={userRole || 'Employee'} size="sm" />
                      <ChevronDown size={9} className={sidebarTheme === 'dark' ? 'text-slate-500 group-hover:text-slate-300 transition-colors' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'} />
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Logout Button at Bottom */}
            <div className={`${sidebarCollapsed ? 'p-2' : 'p-2'} border-t ${sidebarTheme === 'dark' ? 'border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-transparent' : 'border-slate-200/50 bg-gradient-to-r from-rose-50/20 to-transparent'}`}>
              <motion.button
                onClick={handleLogout}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'} px-3 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-lg hover:shadow-rose-500/30 ${sidebarTheme === 'dark'
                    ? 'text-rose-400 hover:text-white hover:bg-gradient-to-r hover:from-rose-600 hover:to-rose-700'
                    : 'text-rose-600 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600'
                  }`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={sidebarCollapsed ? "Logout" : ""}
              >
                <LogOut size={16} className="transition-transform duration-200 group-hover:scale-110" />
                {!sidebarCollapsed && <span className="text-xs font-semibold">Logout</span>}
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
                <span className="text-sm font-semibold text-indigo-600">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`.trim()
                    : user?.displayName || user?.name || 'User'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
                title={sidebarTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {sidebarTheme === 'dark' ? (
                  <Sun size={18} className="transition-colors" />
                ) : (
                  <Moon size={18} className="transition-colors" />
                )}
              </button>
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