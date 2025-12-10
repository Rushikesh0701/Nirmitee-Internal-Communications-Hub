import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import NotificationBell from '../components/NotificationBell'
import RoleBadge from '../components/RoleBadge'
import { getUserRole } from '../utils/userHelpers'
import Logo from '../assets/Logo.png'
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  MessageSquare,
  Award,
  ClipboardList,
  GraduationCap,
  Rss,
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
    { path: '/rss', icon: Rss, label: 'RSS Feeds' },
    ...(isAdminOrModerator
      ? [
        { path: '/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/rewards', icon: Award, label: 'Manage Rewards' }
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-lg shadow-lg border-b border-blue-100/50 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard">
            <img src={Logo} alt="Nirmitee.io" className="h-8 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Glassmorphic Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 sidebar-glass
             transition-transform duration-300 ease-in-out`}
        >
          
          <div className="h-full flex flex-col relative">
            {/* Sidebar Header */}
            <div className="p-6 sidebar-header-glass hidden lg:block">
              <Link to="/dashboard" className="block">
                <img 
                  src={Logo} 
                  alt="Nirmitee.io" 
                  className="h-10 mb-2 cursor-pointer hover:opacity-80 transition-opacity" 
                />
              </Link>
              <p className="text-xs text-slate-500 mt-2 tracking-wide font-medium">Internal Communications Hub</p>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto sidebar-scroll">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-item-glass ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <Icon size={20} className="nav-icon" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="text-white opacity-90" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-blue-100/50">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="user-card-glass flex items-center gap-3 mb-3 cursor-pointer"
              >
                <div className="avatar-ring">
                  <div className="avatar-ring-inner w-10 h-10">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-blue-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user?.name || user?.displayName || 'User'}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={userRole || 'Employee'} size="sm" />
                  </div>
                </div>
              </Link>
              
              <button
                onClick={handleLogout}
                className="logout-btn-glass"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 sidebar-overlay z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content - Fully Scrollable */}
        <main className="flex-1 lg:ml-64 min-h-screen flex flex-col pt-16 lg:pt-0">
          {/* Top bar with notification */}
          <div className="bg-white border-b px-4 lg:px-8 py-4 flex items-center justify-end 
                          sticky top-0 lg:top-0 z-20">
            <NotificationBell />
          </div>

          {/* Page content - Scrollable */}
          <div className="flex-1 p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
