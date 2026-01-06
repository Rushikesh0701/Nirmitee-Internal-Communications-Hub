import { memo } from 'react';
import { Clock, ExternalLink, User, Bookmark, Share2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

function NewsCard({ article, index }) {
  const { theme } = useTheme();
  
  // Map fields to handle news structure
  const title = article.title || 'Untitled';
  const description = article.summary || article.content || article.description || '';
  const imageUrl = article.imageUrl || article.image_url;
  const date = article.publishedAt || article.pubDate || article.createdAt;
  const link = article.sourceUrl || article.link;
  const source = article.source_name || 'News Source';
  const category = article.category;

  // Calculate estimated read time (rough estimate)
  const wordCount = description.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleCardClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
          : 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100'
      }`}
    >
      {/* Image Container */}
      <div className={`relative w-full h-36 overflow-hidden ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
      }`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : ''} ${
          theme === 'dark' ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          <span className="text-4xl opacity-50">📰</span>
        </div>
        
        {/* Category Badge */}
        {category && (
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            theme === 'dark'
              ? 'bg-indigo-500/80 text-white'
              : 'bg-indigo-600/90 text-white'
          }`}>
            {category}
          </div>
        )}

        {/* External Link Icon */}
        <div className={`absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
          theme === 'dark'
            ? 'bg-slate-900/80 text-slate-300'
            : 'bg-white/80 text-gray-600'
        }`}>
          <ExternalLink size={14} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Source & Date */}
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-1.5 text-xs ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
          }`}>
            <User size={12} />
            <span className="font-medium truncate max-w-[120px]">{source}</span>
          </div>
          {date && (
            <div className={`flex items-center gap-1 text-xs ${
              theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
            }`}>
              <Clock size={10} />
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-sm leading-snug line-clamp-2 mb-2 transition-colors ${
          theme === 'dark'
            ? 'text-slate-100 group-hover:text-indigo-300'
            : 'text-gray-900 group-hover:text-indigo-600'
        }`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-xs line-clamp-2 mb-3 flex-1 ${
          theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          {description.replace(/<[^>]*>/g, '')}
        </p>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-gray-100'
        }`}>
          <span className={`flex items-center gap-1 text-xs ${
            theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            <Clock size={10} />
            {readTime} min read
          </span>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement bookmark
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
            >
              <Bookmark size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share && link) {
                  navigator.share({ title, url: link });
                } else if (link) {
                  navigator.clipboard.writeText(link);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-500 hover:text-slate-300'
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(NewsCard);
