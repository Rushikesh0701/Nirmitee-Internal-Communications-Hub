import { useMemo, memo } from 'react';
import { 
  Home, 
  Newspaper, 
  FileText, 
  MessageSquare, 
  Award, 
  BookOpen,
  Users,
  Bell
} from 'lucide-react';

/**
 * Theme Preview Component
 * Shows live preview of sidebar and header with applied theme colors
 */
const ThemePreview = ({ config, isDark = false }) => {
  // Get colors based on light/dark mode
  const getColor = (section, key) => {
    if (!config?.[section]) return '#000000';
    const darkKey = `${key}Dark`;
    if (isDark && config[section][darkKey]) {
      return config[section][darkKey];
    }
    return config[section][key] || '#000000';
  };

  const sidebarBg = getColor('sidebar', 'background');
  const sidebarText = getColor('sidebar', 'text');
  const sidebarActive = getColor('sidebar', 'active');
  const sidebarHover = getColor('sidebar', 'hover');
  
  const headerBg = getColor('header', 'background');
  const headerText = getColor('header', 'text');

  const menuItems = useMemo(() => [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Newspaper, label: 'News', active: false },
    { icon: FileText, label: 'Blogs', active: false },
    { icon: MessageSquare, label: 'Discussions', active: false },
    { icon: Award, label: 'Recognition', active: false },
    { icon: BookOpen, label: 'Learning', active: false },
    { icon: Users, label: 'Groups', active: false },
  ], []);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg">
      {/* Preview Label */}
      <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-overline text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
        Live Preview ({isDark ? 'Dark Mode' : 'Light Mode'})
      </div>
      
      <div className="flex h-64">
        {/* Sidebar Preview */}
        <div 
          className="w-44 flex flex-col py-3 px-2"
          style={{ backgroundColor: sidebarBg }}
        >
          {/* Logo area */}
          <div className="px-2 mb-3">
            <div 
              className="text-caption font-semibold truncate"
              style={{ color: sidebarText }}
            >
              {config?.brand?.platformName || 'Nirmitee Hub'}
            </div>
          </div>
          
          {/* Menu items */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-overline transition-colors cursor-pointer"
                  style={{ 
                    backgroundColor: item.active ? sidebarActive : 'transparent',
                    color: sidebarText 
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = sidebarHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={14} />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header Preview */}
          <div 
            className="h-10 flex items-center justify-between px-3 border-b"
            style={{ 
              backgroundColor: headerBg,
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}
          >
            <div 
              className="text-caption font-medium"
              style={{ color: headerText }}
            >
              Dashboard
            </div>
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: headerText }} />
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: config?.colors?.primary || '#ff4701' }}
              />
            </div>
          </div>

          {/* Content area */}
          <div 
            className="flex-1 p-3"
            style={{ backgroundColor: isDark ? '#0a0e17' : '#ebf3ff' }}
          >
            {/* Sample cards */}
            <div className="grid grid-cols-2 gap-2">
              {['Primary', 'Success', 'Warning', 'Info'].map((type, i) => {
                const colorKey = type.toLowerCase();
                return (
                  <div 
                    key={i}
                    className="p-2 rounded shadow-sm"
                    style={{ 
                      backgroundColor: isDark ? '#151a28' : '#ffffff',
                      borderLeft: `3px solid ${config?.colors?.[colorKey] || '#3B82F6'}`
                    }}
                  >
                    <div 
                      className="text-overline font-medium"
                      style={{ color: isDark ? '#E5E7EB' : '#111827' }}
                    >
                      {type}
                    </div>
                    <div 
                      className="text-overline opacity-60 mt-0.5"
                      style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                    >
                      Sample card
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ThemePreview);
