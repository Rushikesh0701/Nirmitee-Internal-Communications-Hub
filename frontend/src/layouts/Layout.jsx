import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import NotificationBell from '../components/NotificationBell'
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
  UsersRound
} from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdminOrModerator = ['ADMIN', 'MODERATOR'].includes(user?.role)

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/feed', icon: Newspaper, label: 'Feed' },
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

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary-600">Nirmitee Hub</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex h-full lg:h-screen">
        {/* Sidebar - Fixed on all screen sizes */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-primary-600">
                Nirmitee Hub
              </h1>
              <p className="text-sm text-gray-500 mt-1">Internal Communications</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t">
              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 mb-4 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user?.name || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.role || 'Employee'}
                  </p>
                </div>
              </Link>
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content - Scrollable */}
        <main className="flex-1 lg:ml-64 h-full overflow-y-auto">
          <div className="bg-white border-b px-4 lg:px-8 py-4 flex items-center justify-end sticky top-0 z-10">
            <NotificationBell />
          </div>
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

