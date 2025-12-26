import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import NotificationBell from '../components/NotificationBell'
import { getUserRole } from '../utils/userHelpers'
import { useDocumentTitle, useNotificationSound } from '../hooks/useNotificationEffects'
import { useTheme } from '../contexts/ThemeContext'
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
  Sun,
  Shield,
  UserCheck
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

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme: sidebarTheme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsedState)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)

  useDocumentTitle('Nirmitee Hub')
  useNotificationSound()

  const handleLogout = () => {
    setAvatarDropdownOpen(false)
    logout()
    navigate('/login')
  }

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarDropdownOpen && !event.target.closest('.avatar-dropdown-container')) {
        setAvatarDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [avatarDropdownOpen])

  const userRole = getUserRole(user)
  const isAdminOrModerator = ['Admin', 'Moderator'].includes(userRole) ||
    ['ADMIN', 'MODERATOR'].includes(user?.role)

  // Get role icon for glowy display
  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return Shield
      case 'Moderator':
        return UserCheck
      default:
        return Users
    }
  }

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
    <div className="min-h-screen bg-slate-50">
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
              ? 'bg-slate-900 border-r border-slate-800 shadow-sm'
              : 'bg-white border-r border-slate-200 shadow-sm'
            }`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className={`${sidebarCollapsed ? 'px-3' : 'px-4'} h-[56px] border-b ${sidebarTheme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'} flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {sidebarCollapsed ? (
                <button
                  onClick={() => handleSidebarCollapseToggle(false)}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 group ${sidebarTheme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
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
                    className={`p-1.5 rounded-lg transition-all duration-200 ${sidebarTheme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                    title="Collapse sidebar"
                  >
                    <ChevronsLeft size={16} className={sidebarTheme === 'dark' ? 'text-slate-400 hover:text-slate-300 transition-colors' : 'text-slate-500 hover:text-slate-700 transition-colors'} />
                  </button>
                </>
              )}
            </div>

            {/* Navigation with Sections */}
            <nav className={`flex-1 overflow-y-auto p-2 scrollbar-hide ${sidebarTheme === 'dark' ? 'sidebar-scrollbar-dark' : 'sidebar-scrollbar-light'}`}>
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
                        className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 group relative
                          ${isActive
                            ? 'bg-slate-700 text-white'
                            : sidebarTheme === 'dark'
                              ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-800'
                              : 'text-slate-600 hover:text-slate-700 hover:bg-slate-100'
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
                          className={`w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg transition-all duration-200 group ${sidebarTheme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTheme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'}`}>
                          {section.title}
                        </p>
                        <ChevronDown
                          size={12}
                          className={`transition-all duration-200 ${isExpanded ? 'rotate-180' : ''} ${sidebarTheme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`}
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
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 group relative
                                      ${isActive
                                        ? 'bg-slate-700 text-white'
                                        : sidebarTheme === 'dark'
                                          ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                                          : 'text-slate-700 hover:text-slate-700 hover:bg-slate-100'
                                      }`}
                                  >
                                    <Icon
                                      size={18}
                                      className={`transition-all duration-200 ${isActive
                                          ? 'text-white'
                                          : sidebarTheme === 'dark'
                                            ? 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'
                                            : 'text-slate-500 group-hover:text-slate-700'
                                        }`}
                                    />
                                    <span className={`flex-1 text-xs transition-all duration-200 ${isActive ? 'font-semibold' : 'group-hover:font-medium'
                                      }`}>{item.label}</span>
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
              <div className={`p-2 border-t ${sidebarTheme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <Link
                  to="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer group ${sidebarTheme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                >
                  <div className="relative">
                    <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <User size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <p className={`text-[11px] font-semibold leading-tight transition-colors break-words line-clamp-2 ${sidebarTheme === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900'}`}>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user?.displayName || user?.name || 'User'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const RoleIcon = getRoleIcon(userRole || 'Employee')
                        const isAdmin = userRole === 'Admin'
                        const isModerator = userRole === 'Moderator'
                        return (
                          <>
                            <RoleIcon 
                              size={12} 
                              className={sidebarTheme === 'dark' 
                                ? isAdmin 
                                  ? 'text-slate-500' 
                                  : isModerator
                                  ? 'text-slate-500'
                                  : 'text-slate-400'
                                : isAdmin
                                  ? 'text-slate-700'
                                  : isModerator
                                  ? 'text-slate-700'
                                  : 'text-slate-600'
                              }
                            />
                            <span 
                              className={`text-[10px] font-semibold ${sidebarTheme === 'dark' 
                                ? isAdmin 
                                  ? 'text-slate-500' 
                                  : isModerator
                                  ? 'text-slate-500'
                                  : 'text-slate-400'
                                : isAdmin
                                  ? 'text-slate-700'
                                  : isModerator
                                  ? 'text-slate-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              {userRole || 'Employee'}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Logout Button at Bottom */}
            <div className={`p-2 border-t ${sidebarTheme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <motion.button
                onClick={handleLogout}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'} px-3 py-2 rounded-lg transition-all duration-200 font-medium ${sidebarTheme === 'dark'
                    ? 'text-red-400 hover:text-white hover:bg-red-600'
                    : 'text-red-600 hover:text-white hover:bg-red-600'
                  }`}
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
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
        <main className={`flex-1 min-h-screen flex flex-col pt-14 lg:pt-0 relative transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'} ${
          sidebarTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
        }`}>
          {/* Top bar */}
          <div
            className={`hidden lg:flex backdrop-blur-xl border-b px-4 lg:px-6 h-[60px] items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-200 ${
              sidebarTheme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="hidden lg:flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${
                sidebarTheme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-100 border-slate-200'
              }`}>
                <span className={`text-sm transition-colors ${
                  sidebarTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>Welcome back,</span>
                <span className={`text-sm font-semibold transition-colors ${
                  sidebarTheme === 'dark' ? 'text-slate-500' : 'text-slate-700'
                }`}>
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
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                  sidebarTheme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={sidebarTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {sidebarTheme === 'dark' ? (
                  <Sun size={18} className="transition-colors" />
                ) : (
                  <Moon size={18} className="transition-colors" />
                )}
              </button>
              <NotificationBell />
              
              {/* Avatar Dropdown */}
              <div className="relative avatar-dropdown-container">
                <button
                  onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    sidebarTheme === 'dark'
                      ? 'hover:bg-slate-800/50'
                      : 'hover:bg-slate-100'
                  }`}
                  title="User menu"
                >
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user?.name || 'User'} className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <User size={16} className="text-white" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {avatarDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 transition-colors ${
                        sidebarTheme === 'dark'
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          sidebarTheme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-700/50'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <User size={18} className={sidebarTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
                        <span className="text-sm font-medium">Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          sidebarTheme === 'dark'
                            ? 'text-rose-400 hover:bg-slate-700/50'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <LogOut size={18} className={sidebarTheme === 'dark' ? 'text-rose-400' : 'text-rose-500'} />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Page content */}
          <motion.div
            className="flex-1 p-2 lg:p-3"
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