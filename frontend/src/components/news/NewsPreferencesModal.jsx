import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { X, Sparkles, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

// Default categories (fallback)
const DEFAULT_CATEGORIES = [
  { value: 'AI', label: 'AI & Machine Learning', icon: '🤖', description: 'Latest in artificial intelligence' },
  { value: 'Cloud', label: 'Cloud Computing', icon: '☁️', description: 'AWS, Azure, GCP and more' },
  { value: 'DevOps', label: 'DevOps', icon: '🔧', description: 'CI/CD, containers, automation' },
  { value: 'Programming', label: 'Programming', icon: '💻', description: 'Languages, frameworks, best practices' },
  { value: 'Cybersecurity', label: 'Cybersecurity', icon: '🔒', description: 'Security news and threats' },
  { value: 'HealthcareIT', label: 'Healthcare IT', icon: '🏥', description: 'Health tech innovations' }
];

// Icon and description mapping for dynamic categories
const CATEGORY_META = {
  'AI': { icon: '🤖', description: 'Latest in artificial intelligence' },
  'Cloud': { icon: '☁️', description: 'AWS, Azure, GCP and more' },
  'DevOps': { icon: '🔧', description: 'CI/CD, containers, automation' },
  'Programming': { icon: '💻', description: 'Languages, frameworks, best practices' },
  'Cybersecurity': { icon: '🔒', description: 'Security news and threats' },
  'HealthcareIT': { icon: '🏥', description: 'Health tech innovations' },
  'Technology': { icon: '⚡', description: 'General tech news' },
  'Blockchain': { icon: '🔗', description: 'Web3, crypto, and blockchain' },
  'Frontend': { icon: '🎨', description: 'UI/UX and frontend development' },
  'default': { icon: '📰', description: 'News and updates' }
};

export default function NewsPreferencesModal({ isOpen, onClose, preferences, onSave, saving }) {
  const { theme } = useTheme();
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Fetch categories from API
  const { data: categoriesData } = useQuery(
    ['rssCategories'],
    async () => {
      try {
        const response = await api.get('/news/categories?activeOnly=true');
        return response.data?.data || [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
      }
    },
    {
      staleTime: 10 * 60 * 1000,
      retry: 1
    }
  );

  // Build display categories from API only (no fallbacks)
  const displayCategories = (categoriesData && categoriesData.length > 0)
    ? categoriesData.map(cat => ({
        value: cat.value,
        label: cat.name,
        icon: CATEGORY_META[cat.value]?.icon || CATEGORY_META.default.icon,
        description: CATEGORY_META[cat.value]?.description || CATEGORY_META.default.description
      }))
    : [];

  useEffect(() => {
    if (preferences?.categories) {
      setSelectedCategories(preferences.categories);
    }
  }, [preferences]);

  if (!isOpen) return null;

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = () => {
    onSave({
      categories: selectedCategories,
      language: preferences?.language || 'en',
      onboardingComplete: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] border border-slate-700/50'
          : 'bg-white shadow-2xl'
      }`}>
        {/* Header */}
        <div className={`relative px-6 pt-6 pb-4 ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20'
            : 'bg-gradient-to-r from-indigo-50 to-purple-50'
        }`}>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-slate-700/50 text-slate-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${
              theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'
            }`}>
              <Sparkles className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Personalize Your Feed
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Select topics you're interested in
              </p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-indigo-500/20 border-2 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-indigo-50 border-2 border-indigo-500 ring-2 ring-indigo-100'
                      : theme === 'dark'
                        ? 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className={`absolute top-2 right-2 p-1 rounded-full ${
                      theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-500'
                    }`}>
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className={`font-semibold text-sm mb-1 ${
                    isSelected
                      ? theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'
                      : theme === 'dark' ? 'text-slate-200' : 'text-gray-800'
                  }`}>
                    {cat.label}
                  </div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                  }`}>
                    {cat.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <p className={`mt-4 text-center text-xs ${
            theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
          }`}>
            {selectedCategories.length === 0 
              ? 'Select at least one topic or skip to see all news'
              : `${selectedCategories.length} topic${selectedCategories.length > 1 ? 's' : ''} selected`
            }
          </p>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          theme === 'dark' ? 'border-slate-700/50 bg-slate-900/50' : 'border-gray-100 bg-gray-50'
        }`}>
          <button
            onClick={() => onSave({ categories: [], language: 'en', onboardingComplete: true })}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              saving
                ? 'opacity-50 cursor-not-allowed'
                : ''
            } ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
            }`}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
