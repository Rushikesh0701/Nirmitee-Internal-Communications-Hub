import { X, Newspaper, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom toast component for news updates
 * Displays count of new articles and titles
 */
const NewsUpdateToast = ({ newArticlesCount, latestArticles, onViewNow, onDismiss }) => {
  const { theme } = useTheme();
  return (
    <div className={`border-l-4 border-slate-600 rounded-lg p-4 max-w-md ${
      theme === 'dark' ? 'bg-[#0a0e17]/90' : 'bg-white'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <Newspaper className="text-slate-700" size={20} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className={`text-caption ${
                theme === 'dark' ? 'text-slate-200' : 'text-gray-900'
              }`}>
                {newArticlesCount} New Article{newArticlesCount !== 1 ? 's' : ''} Available
              </h3>
              <p className={`text-xs mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Fresh tech news just for you
              </p>
            </div>
            <button
              onClick={onDismiss}
              className={`flex-shrink-0 transition-colors ml-2 ${
                theme === 'dark' 
                  ? 'text-slate-500 hover:text-slate-300' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* Latest articles preview */}
          {latestArticles && latestArticles.length > 0 && (
            <div className="mb-3 space-y-1">
              {latestArticles.map((article, index) => (
                <div key={index} className={`text-xs line-clamp-1 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  • {article.title}
                </div>
              ))}
              {newArticlesCount > 3 && (
                <div className={`text-xs italic ${
                  theme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  +{newArticlesCount - 3} more article{newArticlesCount - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={onViewNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff4701] text-white text-overline rounded hover:bg-[#ff5500] transition-colors"
          >
            View Now
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsUpdateToast;
