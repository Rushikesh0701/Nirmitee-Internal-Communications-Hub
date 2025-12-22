import { X, Newspaper, ChevronRight } from 'lucide-react';

/**
 * Custom toast component for news updates
 * Displays count of new articles and titles
 */
const NewsUpdateToast = ({ newArticlesCount, latestArticles, onViewNow, onDismiss }) => {
  return (
    <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Newspaper className="text-blue-600" size={20} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {newArticlesCount} New Article{newArticlesCount !== 1 ? 's' : ''} Available
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Fresh tech news just for you
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* Latest articles preview */}
          {latestArticles && latestArticles.length > 0 && (
            <div className="mb-3 space-y-1">
              {latestArticles.map((article, index) => (
                <div key={index} className="text-xs text-gray-600 line-clamp-1">
                  • {article.title}
                </div>
              ))}
              {newArticlesCount > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{newArticlesCount - 3} more article{newArticlesCount - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={onViewNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
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
