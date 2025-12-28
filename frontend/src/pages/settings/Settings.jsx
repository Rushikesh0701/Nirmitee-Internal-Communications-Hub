import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { 
  Settings as SettingsIcon, 
  Bell,
  User,
  Shield,
  Moon,
  Sun,
  Save,
  CheckCircle
} from 'lucide-react';
import { DetailSkeleton } from '../../components/skeletons';
import toast from 'react-hot-toast';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun }
  ];

  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Profile Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input-field w-full bg-slate-100 dark:bg-slate-800"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="input-field w-full"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={updateUserMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Notification Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      Push Notifications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      Blog Notifications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      Discussion Notifications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">
                      Recognition Notifications
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={updateUserMutation.isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Privacy Settings
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Privacy settings will be available in a future update.
              </p>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Appearance
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200">
                    Theme
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Switch between light and dark mode
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="btn-secondary flex items-center gap-2"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;

