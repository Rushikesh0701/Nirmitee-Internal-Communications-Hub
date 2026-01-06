import { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import { useQuery } from 'react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, X, Newspaper, RefreshCw, Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import EmptyState from '../../components/EmptyState';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// New components
import NewsCard from '../../components/news/NewsCard';
import TopicSidebar from '../../components/news/TopicSidebar';
import NewsPreferencesModal from '../../components/news/NewsPreferencesModal';
import { useNewsPreferences } from '../../hooks/useNewsPreferences';

// Default categories (fallback if API returns nothing)
const DEFAULT_CATEGORIES = [
  { value: 'AI', label: 'AI & ML' },
  { value: 'Cloud', label: 'Cloud' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Programming', label: 'Programming' },
  { value: 'Cybersecurity', label: 'Security' }
];

function NewsList() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState(null); // null = My Feed, 'all' = All News, or category value
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  
  // Preferences hook
  const { 
    preferences, 
    loading: prefsLoading, 
    saving: prefsSaving,
    savePreferences,
    needsOnboarding 
  } = useNewsPreferences();

  // Fetch categories from API
  const { data: categoriesData } = useQuery(
    ['rssCategories'],
    async () => {
      try {
        const response = await api.get('/admin/rss-categories?activeOnly=true');
        return response.data?.data || [];
      } catch (err) {
        // Silently fail and use defaults
        console.error('Error fetching categories:', err);
        return [];
      }
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 1
    }
  );

  // Use fetched categories only (no fallbacks)
  const availableCategories = (categoriesData && categoriesData.length > 0)
    ? categoriesData.map(cat => ({ value: cat.value, label: cat.name }))
    : [];
  
  // Refs
  const fetchingRef = useRef(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Determine which categories to filter by
  const getActiveCategories = useCallback(() => {
    if (activeFilter === 'all') return []; // No filter, show all
    if (activeFilter && activeFilter !== 'all') return [activeFilter]; // Single category
    // My Feed - use user preferences
    return preferences.categories || [];
  }, [activeFilter, preferences.categories]);

  // Fetch news with filters
  const fetchNews = useCallback(async (isNewSearch = false, pageToken = null) => {
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    if (isNewSearch) {
      setLoading(true);
      setArticles([]);
      setError('');
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      
      // Add search query
      if (query.trim()) {
        params.append('q', query.trim());
      }

      // Add category filter (comma-separated for multiple categories)
      const categories = getActiveCategories();
      if (categories.length > 0) {
        params.append('category', categories.join(','));
      }

      // Add language from preferences
      if (preferences.language) {
        params.append('language', preferences.language);
      }

      // Pagination
      if (pageToken) {
        params.append('nextPage', pageToken);
      }

      params.append('limit', '20');

      const response = await api.get(`/news?${params.toString()}`);
      const responseData = response.data.data || response.data;
      const newArticles = responseData.results || responseData.news || [];
      const nextPageToken = responseData.nextPage || null;

      if (newArticles.length > 0) {
        // Deduplicate
        const deduped = deduplicateArticles(isNewSearch ? newArticles : [...articles, ...newArticles]);
        setArticles(deduped);
        setNextPage(nextPageToken);
        setHasMorePages(!!nextPageToken);
        setError('');
      } else if (isNewSearch) {
        setArticles([]);
        setError('No articles found. Try adjusting your preferences or search.');
        setHasMorePages(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [query, getActiveCategories, preferences.language, articles]);

  // Deduplicate articles
  const deduplicateArticles = (articles) => {
    const seen = new Map();
    return articles.filter(article => {
      const key = (article.sourceUrl || article.link || article.title || '').toLowerCase().trim();
      if (key && seen.has(key)) return false;
      if (key) seen.set(key, true);
      return true;
    });
  };

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMorePages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePages && !loadingMore) {
          fetchNews(false, nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMorePages, nextPage, fetchNews]);

  // Initial load and filter changes
  useEffect(() => {
    if (!prefsLoading) {
      fetchNews(true);
    }
  }, [activeFilter, preferences.categories, preferences.language, prefsLoading]);

  // Show onboarding modal for new users
  useEffect(() => {
    if (!prefsLoading && needsOnboarding) {
      setShowPreferencesModal(true);
    }
  }, [prefsLoading, needsOnboarding]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews(true);
  };

  // Handle preference save
  const handleSavePreferences = async (newPrefs) => {
    const success = await savePreferences(newPrefs);
    if (success) {
      setShowPreferencesModal(false);
      setActiveFilter(null); // Switch to My Feed
      fetchNews(true);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Topic Sidebar - Hidden on mobile */}
      <div className="hidden lg:block sticky top-4 h-fit">
        <TopicSidebar
          selectedCategories={preferences.categories || []}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onCustomizeClick={() => setShowPreferencesModal(true)}
          categories={availableCategories}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {activeFilter === 'all' ? 'All News' : activeFilter ? activeFilter : 'My Feed'}
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {activeFilter === null && preferences.categories?.length > 0
                ? `Showing news from ${preferences.categories.join(', ')}`
                : 'Latest tech news from around the world'
              }
            </p>
          </div>

          {/* Mobile customize button */}
          <button
            onClick={() => setShowPreferencesModal(true)}
            className={`lg:hidden px-4 py-2 rounded-lg text-sm font-medium ${
              theme === 'dark'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}
          >
            Customize Feed
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className={`flex-1 relative rounded-xl overflow-hidden ${
            theme === 'dark'
              ? 'bg-slate-800/50 border border-slate-700/50'
              : 'bg-white border border-gray-200'
          }`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
            }`} size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news..."
              className={`w-full pl-11 pr-4 py-3 bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'text-slate-200 placeholder-slate-500'
                  : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            } disabled:opacity-50`}
          >
            Search
          </button>
        </form>

        {/* Mobile Category Pills */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === null
                ? theme === 'dark'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-600 text-white'
                : theme === 'dark'
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            My Feed
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? theme === 'dark'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-600 text-white'
                : theme === 'dark'
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveFilter(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === cat.value
                  ? theme === 'dark'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-600 text-white'
                  : theme === 'dark'
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.label || cat.value}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border border-slate-700/50'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <Skeleton
                  height={144}
                  baseColor={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                  highlightColor={theme === 'dark' ? '#334155' : '#f1f5f9'}
                />
                <div className="p-4 space-y-2">
                  <Skeleton
                    height={16}
                    count={2}
                    baseColor={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                    highlightColor={theme === 'dark' ? '#334155' : '#f1f5f9'}
                  />
                  <Skeleton
                    height={12}
                    width="60%"
                    baseColor={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                    highlightColor={theme === 'dark' ? '#334155' : '#f1f5f9'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`rounded-xl p-6 text-center ${
            theme === 'dark'
              ? 'bg-red-900/20 border border-red-800/50'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm mb-3 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              {error}
            </p>
            <button
              onClick={() => fetchNews(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <EmptyState
            icon={Newspaper}
            title="No articles found"
            message="Try adjusting your preferences or search terms"
          />
        )}

        {/* Articles Grid */}
        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {articles.map((article, index) => (
              <NewsCard
                key={article._id || article.article_id || `${article.title?.slice(0,20)}-${index}`}
                article={article}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {hasMorePages && !loading && (
          <div 
            ref={loadMoreRef}
            className={`flex items-center justify-center py-8 ${
              loadingMore ? '' : 'opacity-50'
            }`}
          >
            {loadingMore ? (
              <div className={`flex items-center gap-2 ${
                theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
              }`}>
                <Loader2 size={20} className="animate-spin" />
                <span>Loading more articles...</span>
              </div>
            ) : (
              <span className={`text-sm ${
                theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
              }`}>
                Scroll for more
              </span>
            )}
          </div>
        )}

        {/* End of Feed */}
        {!hasMorePages && articles.length > 0 && !loading && (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
          }`}>
            <p className="text-sm">You've reached the end 🎉</p>
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      <NewsPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={preferences}
        onSave={handleSavePreferences}
        saving={prefsSaving}
      />
    </div>
  );
}

export default memo(NewsList);
