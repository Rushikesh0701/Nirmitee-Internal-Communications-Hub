import { Settings, Sparkles, Hash } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TopicSidebar({ 
  selectedCategories = [], 
  onCategoryChange, 
  onCustomizeClick,
  activeFilter,
  onFilterChange,
  categories = []
}) {
  const { theme } = useTheme();

  // Use provided categories from API (plain text, no icons)
  const displayCategories = categories.map(cat => ({
    value: cat.value,
    label: cat.label || cat.name || cat.value
  }));

  return (
    <aside className={`w-56 shrink-0 rounded-2xl overflow-hidden ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50'
        : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-gray-100'
      }`}>
        <h3 className={`font-semibold text-sm ${
          theme === 'dark' ? 'text-slate-200' : 'text-gray-800'
        }`}>
          Topics
        </h3>
      </div>

      {/* Feed Options */}
      <div className="p-2">
        <button
          onClick={() => onFilterChange(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            activeFilter === null
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Sparkles size={16} />
          <span className="font-medium text-sm">My Feed</span>
          {selectedCategories.length > 0 && (
            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
              theme === 'dark' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {selectedCategories.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onFilterChange('all')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            activeFilter === 'all'
              ? theme === 'dark'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`}
        >
          <Hash size={16} />
          <span className="font-medium text-sm">All News</span>
        </button>
      </div>

      {/* Categories */}
      <div className={`px-4 py-2 border-t ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-gray-100'
      }`}>
        <p className={`text-xs font-medium mb-2 ${
          theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
        }`}>
          BROWSE BY TOPIC
        </p>
        <div className="space-y-1">
          {displayCategories.map((cat) => {
            const isActive = activeFilter === cat.value;
            const isInPreferences = selectedCategories.includes(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => onFilterChange(cat.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-slate-700/70 text-slate-100'
                      : 'bg-gray-100 text-gray-900'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <span className="text-sm flex-1">{cat.label}</span>
                {isInPreferences && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customize Button */}
      <div className={`p-3 border-t ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-gray-100'
      }`}>
        <button
          onClick={onCustomizeClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30 hover:from-indigo-600/30 hover:to-purple-600/30'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100'
          }`}
        >
          <Settings size={14} />
          Customize Feed
        </button>
      </div>
    </aside>
  );
}
