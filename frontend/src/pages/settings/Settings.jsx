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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <motion.div 
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#0a3a3c]">
          <SettingsIcon size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
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
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Profile Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input w-full bg-slate-100 dark:bg-[#0a3a3c] dark:border-[#0a3a3c] text-sm py-2"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="input w-full text-sm py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="input w-full text-sm py-2"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                disabled={updateUserMutation.isLoading}
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSubmit} className="card space-y-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Notification Preferences
              </h2>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Email Notifications
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Push Notifications
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Blog Notifications
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Discussion Notifications
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      Recognition Notifications
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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
                className="btn btn-primary flex items-center gap-2 text-sm"
              >
                <Save size={16} />
                {updateUserMutation.isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="card space-y-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Privacy Settings
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Privacy settings will be available in a future update.
              </p>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="card space-y-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Appearance
              </h2>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0a3a3c] rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Theme
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Switch between light and dark mode
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="btn btn-secondary flex items-center gap-2 text-sm"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          )}
      </motion.div>
    </motion.div>
  );
};

export default Settings;

