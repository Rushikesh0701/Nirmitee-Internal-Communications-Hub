import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme, DEFAULT_BRANDING } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { updateThemeConfig, resetThemeConfig } from '../../services/themeApi';
import { 
  Settings as SettingsIcon, 
  Bell,
  User,
  Shield,
  Moon,
  Sun,
  Save,
  Palette,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import toast from 'react-hot-toast';
import ColorPicker from '../../components/theme/ColorPicker';
import ThemePreview from '../../components/theme/ThemePreview';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

// Collapsible section component
const CollapsibleSection = ({ id, title, icon: Icon, isExpanded, onToggle, children }) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] hover:bg-slate-100 dark:hover:bg-[#1a2030] transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-slate-600 dark:text-slate-400" />
        <span className="text-button text-slate-800 dark:text-slate-100">{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp size={18} className="text-slate-500" />
      ) : (
        <ChevronDown size={18} className="text-slate-500" />
      )}
    </button>
    {isExpanded && (
      <div 
        className="p-4 bg-white dark:bg-[#0d1220] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    )}
  </div>
);

const Settings = () => {
  const { theme, toggleTheme, branding, updateBranding, refreshBranding } = useTheme();
  const { user, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.department || '',
    bio: user?.bio || ''
  });

  // Check if user is admin
  const isAdmin = useMemo(() => {
    const role = user?.roleId?.name || user?.role;
    return role?.toLowerCase() === 'admin';
  }, [user]);

  // Theme customization state
  const [themeConfig, setThemeConfig] = useState(branding);
  const [expandedSections, setExpandedSections] = useState({
    sidebar: true,
    header: false,
    colors: false,
    brand: false
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync theme config with branding from context
  useEffect(() => {
    setThemeConfig(branding);
    // When branding updates from context (e.g., after reset), clear unsaved changes
    // This ensures the UI correctly reflects there are no pending edits
    setHasUnsavedChanges(false);
  }, [branding]);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.preferences?.emailNotifications !== false,
    pushNotifications: user?.preferences?.pushNotifications !== false,
    blogNotifications: user?.preferences?.blogNotifications !== false,
    discussionNotifications: user?.preferences?.discussionNotifications !== false,
    recognitionNotifications: user?.preferences?.recognitionNotifications !== false
  });

  // Update user mutation
  const updateUserMutation = useMutation(
    (data) => api.put(`/users/${user?._id || user?.id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user');
        fetchUser();
        toast.success('Settings saved successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      }
    }
  );

  // Theme update mutation
  const updateThemeMutation = useMutation(
    (config) => updateThemeConfig(config),
    {
      onSuccess: (response) => {
        if (response.success) {
          updateBranding(response.data.config);
          setHasUnsavedChanges(false);
          toast.success('Theme updated successfully');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update theme');
      }
    }
  );

  // Theme reset mutation
  const resetThemeMutation = useMutation(
    () => resetThemeConfig(),
    {
      onSuccess: (response) => {
        if (response.success) {
          // Update context with reset config
          updateBranding(response.data.config);
          // Force local state to match the reset config
          setThemeConfig(response.data.config);
          // Clear unsaved changes flag
          setHasUnsavedChanges(false);
          // Refresh branding from backend to ensure consistency
          refreshBranding();
          toast.success('Theme reset to defaults');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reset theme');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate({
      ...formData,
      preferences: notifications
    });
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  // Theme config handlers - Memoized to prevent re-renders of all ColorPickers
  const handleColorChange = useCallback((section, key, value) => {
    setThemeConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleBrandChange = useCallback((key, value) => {
    setThemeConfig(prev => ({
      ...prev,
      brand: {
        ...prev.brand,
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveTheme = () => {
    if (window.confirm('Are you sure you want to save these theme changes? This will apply the new theme to all users.')) {
      updateThemeMutation.mutate(themeConfig);
    }
  };

  const handleResetTheme = () => {
    if (window.confirm('Are you sure you want to reset to default theme? This will discard all custom theme settings and restore the original defaults.')) {
      resetThemeMutation.mutate();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <motion.div 
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#151a28]">
          <SettingsIcon size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-h1 text-slate-800 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-caption mt-0.5">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-button rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#ff4701] text-white hover:bg-[#ff5500]'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="card space-y-3">
              <h2 className="text-h2 text-slate-800 dark:text-slate-100 mb-3">
                Profile Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input w-full text-caption py-2"
                  />
                </div>
                <div>
                  <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input w-full text-caption py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input w-full bg-slate-100 dark:bg-[#151a28] dark:border-[#151a28] text-caption py-2"
                />
                <p className="text-overline text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="input w-full text-caption py-2"
                />
              </div>

              <div>
                <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="input w-full text-caption py-2"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={updateUserMutation.isLoading}
                className="btn btn-primary flex items-center gap-2 text-caption"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSubmit} className="card space-y-3">
              <h2 className="text-h2 text-slate-800 dark:text-slate-100 mb-3">
                Notification Preferences
              </h2>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Email Notifications
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Receive notifications via email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4701]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Push Notifications
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Receive browser push notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4701]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Blog Notifications
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Get notified about new blogs
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.blogNotifications}
                      onChange={(e) => handleNotificationChange('blogNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4701]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Discussion Notifications
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Get notified about new discussions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.discussionNotifications}
                      onChange={(e) => handleNotificationChange('discussionNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4701]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Recognition Notifications
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Get notified about recognitions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.recognitionNotifications}
                      onChange={(e) => handleNotificationChange('recognitionNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4701]"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={updateUserMutation.isLoading}
                className="btn btn-primary flex items-center gap-2 text-caption"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="card space-y-3">
              <h2 className="text-h2 text-slate-800 dark:text-slate-100 mb-3">
                Privacy Settings
              </h2>
              <p className="text-caption text-slate-600 dark:text-slate-300">
                Privacy settings will be available in a future update.
              </p>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Dark/Light Mode Toggle - Available to all users */}
              <div className="card space-y-3">
                <h2 className="text-h2 text-slate-800 dark:text-slate-100 mb-3">
                  Display Mode
                </h2>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#151a28] rounded-lg">
                  <div>
                    <h3 className="text-button text-slate-800 dark:text-slate-100">
                      Theme
                    </h3>
                    <p className="text-overline text-slate-600 dark:text-slate-300">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="btn btn-secondary flex items-center gap-2 text-caption"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>

              {/* Admin-only Theme Customization */}
              {isAdmin && (
                <div className="card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-h2 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Palette size={20} />
                        Organization Theme
                      </h2>
                      <p className="text-overline text-slate-500 dark:text-slate-400 mt-1">
                        Customize colors and branding for all users
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <span className="text-overline text-warning-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  {/* Live Preview */}
                  <ThemePreview config={themeConfig} isDark={theme === 'dark'} />

                  {/* Sidebar Colors */}
                  <CollapsibleSection 
                    id="sidebar" 
                    title="Sidebar Colors" 
                    icon={Palette}
                    isExpanded={expandedSections.sidebar}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ColorPicker
                        label="Background"
                        value={themeConfig?.sidebar?.background || '#0F1E56'}
                        onChange={(v) => handleColorChange('sidebar', 'background', v)}
                      />
                      <ColorPicker
                        label="Background (Dark)"
                        value={themeConfig?.sidebar?.backgroundDark || '#040812'}
                        onChange={(v) => handleColorChange('sidebar', 'backgroundDark', v)}
                      />
                      <ColorPicker
                        label="Text"
                        value={themeConfig?.sidebar?.text || '#B0B7D0'}
                        onChange={(v) => handleColorChange('sidebar', 'text', v)}
                      />
                      <ColorPicker
                        label="Text (Dark)"
                        value={themeConfig?.sidebar?.textDark || '#8892AC'}
                        onChange={(v) => handleColorChange('sidebar', 'textDark', v)}
                      />
                      <ColorPicker
                        label="Active Item"
                        value={themeConfig?.sidebar?.active || '#3342A5'}
                        onChange={(v) => handleColorChange('sidebar', 'active', v)}
                      />
                      <ColorPicker
                        label="Active (Dark)"
                        value={themeConfig?.sidebar?.activeDark || '#1E2B78'}
                        onChange={(v) => handleColorChange('sidebar', 'activeDark', v)}
                      />
                      <ColorPicker
                        label="Hover"
                        value={themeConfig?.sidebar?.hover || '#1C2B78'}
                        onChange={(v) => handleColorChange('sidebar', 'hover', v)}
                      />
                      <ColorPicker
                        label="Hover (Dark)"
                        value={themeConfig?.sidebar?.hoverDark || '#0D1842'}
                        onChange={(v) => handleColorChange('sidebar', 'hoverDark', v)}
                      />
                    </div>
                  </CollapsibleSection>

                  {/* Header Colors */}
                  <CollapsibleSection 
                    id="header" 
                    title="Header Colors" 
                    icon={Palette}
                    isExpanded={expandedSections.header}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ColorPicker
                        label="Background"
                        value={themeConfig?.header?.background || '#FFFFFF'}
                        onChange={(v) => handleColorChange('header', 'background', v)}
                      />
                      <ColorPicker
                        label="Background (Dark)"
                        value={themeConfig?.header?.backgroundDark || '#0a0e17'}
                        onChange={(v) => handleColorChange('header', 'backgroundDark', v)}
                      />
                      <ColorPicker
                        label="Text"
                        value={themeConfig?.header?.text || '#111827'}
                        onChange={(v) => handleColorChange('header', 'text', v)}
                      />
                      <ColorPicker
                        label="Text (Dark)"
                        value={themeConfig?.header?.textDark || '#E5E7EB'}
                        onChange={(v) => handleColorChange('header', 'textDark', v)}
                      />
                    </div>
                  </CollapsibleSection>

                  {/* Brand Colors */}
                  <CollapsibleSection 
                    id="colors" 
                    title="Brand Colors" 
                    icon={Palette}
                    isExpanded={expandedSections.colors}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <ColorPicker
                        label="Primary"
                        value={themeConfig?.colors?.primary || '#ff4701'}
                        onChange={(v) => handleColorChange('colors', 'primary', v)}
                      />
                      <ColorPicker
                        label="Secondary"
                        value={themeConfig?.colors?.secondary || '#6366F1'}
                        onChange={(v) => handleColorChange('colors', 'secondary', v)}
                      />
                      <ColorPicker
                        label="Accent"
                        value={themeConfig?.colors?.accent || '#8B5CF6'}
                        onChange={(v) => handleColorChange('colors', 'accent', v)}
                      />
                      <ColorPicker
                        label="Success"
                        value={themeConfig?.colors?.success || '#10B981'}
                        onChange={(v) => handleColorChange('colors', 'success', v)}
                      />
                      <ColorPicker
                        label="Warning"
                        value={themeConfig?.colors?.warning || '#F59E0B'}
                        onChange={(v) => handleColorChange('colors', 'warning', v)}
                      />
                      <ColorPicker
                        label="Error"
                        value={themeConfig?.colors?.error || '#EF4444'}
                        onChange={(v) => handleColorChange('colors', 'error', v)}
                      />
                      <ColorPicker
                        label="Info"
                        value={themeConfig?.colors?.info || '#3B82F6'}
                        onChange={(v) => handleColorChange('colors', 'info', v)}
                      />
                    </div>
                  </CollapsibleSection>

                  {/* Brand Identity */}
                  <CollapsibleSection 
                    id="brand" 
                    title="Brand Identity" 
                    icon={Palette}
                    isExpanded={expandedSections.brand}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          value={themeConfig?.brand?.organizationName || ''}
                          onChange={(e) => handleBrandChange('organizationName', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="Nirmitee Robotics"
                        />
                      </div>
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={themeConfig?.brand?.platformName || ''}
                          onChange={(e) => handleBrandChange('platformName', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="Internal Hub"
                        />
                      </div>
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={themeConfig?.brand?.slogan || ''}
                          onChange={(e) => handleBrandChange('slogan', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="Innovate. Connect. Grow."
                        />
                      </div>
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Footer Text
                        </label>
                        <input
                          type="text"
                          value={themeConfig?.brand?.footerText || ''}
                          onChange={(e) => handleBrandChange('footerText', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="© 2026 Nirmitee Robotics"
                        />
                      </div>
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={themeConfig?.brand?.supportEmail || ''}
                          onChange={(e) => handleBrandChange('supportEmail', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="hr@nirmitee.io"
                        />
                      </div>
                      <div>
                        <label className="block text-overline text-slate-700 dark:text-slate-300 mb-1">
                          Support URL
                        </label>
                        <input
                          type="url"
                          value={themeConfig?.brand?.supportUrl || ''}
                          onChange={(e) => handleBrandChange('supportUrl', e.target.value)}
                          className="input w-full text-caption py-2"
                          placeholder="https://nirmitee.io/support"
                        />
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveTheme}
                      disabled={updateThemeMutation.isLoading || !hasUnsavedChanges}
                      className="btn btn-primary flex items-center gap-2 text-caption disabled:opacity-50"
                    >
                      <Save size={16} />
                      {updateThemeMutation.isLoading ? 'Saving...' : 'Save Theme'}
                    </button>
                    <button
                      onClick={handleResetTheme}
                      disabled={resetThemeMutation.isLoading}
                      className="btn btn-secondary flex items-center gap-2 text-caption"
                    >
                      <RotateCcw size={16} />
                      {resetThemeMutation.isLoading ? 'Resetting...' : 'Reset to Defaults'}
                    </button>
                  </div>
                </div>
              )}

              {/* Non-admin message */}
              {!isAdmin && (
                <div className="card">
                  <p className="text-caption text-slate-600 dark:text-slate-300">
                    Theme customization is only available to administrators.
                  </p>
                </div>
              )}
            </div>
          )}
      </motion.div>
    </motion.div>
  );
};

export default Settings;
