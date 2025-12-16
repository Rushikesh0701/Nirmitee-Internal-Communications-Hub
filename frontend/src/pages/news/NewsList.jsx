import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { Search, Filter, X, Calendar, Globe, User, TrendingUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';

function NewsList() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filter states
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, year
  const [sortBy, setSortBy] = useState('relevance'); // relevance, date, popularity
  const [language, setLanguage] = useState('en');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, title, content, both
  const [exactPhrase, setExactPhrase] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const techCategories = [
    { value: '', label: 'All Categories' },
    { value: 'AI', label: 'AI & Machine Learning' },
    { value: 'Cloud', label: 'Cloud Computing' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Programming', label: 'Programming' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'HealthcareIT', label: 'Healthcare IT' },
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Newest First' },
    { value: 'popularity', label: 'Most Popular' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'hi', label: 'Hindi' },
    { value: 'mr', label: 'Marathi' },
    { value: 'ta', label: 'Tamil' },
    { value: 'te', label: 'Telugu' },
    { value: 'ur', label: 'Urdu' },
    { value: 'bn', label: 'Bengali' },
    { value: 'pa', label: 'Punjabi' },
    { value: 'gu', label: 'Gujarati' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'or', label: 'Oriya' },
    { value: 'sd', label: 'Sindhi' }
  ];

  // Get unique sources from articles
  const availableSources = useMemo(() => {
    const sources = new Set();
    articles.forEach(article => {
      if (article.source_name) {
        sources.add(article.source_name);
      }
    });
    return Array.from(sources).sort();
  }, [articles]);

  // Calculate date range based on selection
  const getDateRangeParams = () => {
    if (dateRange === 'custom' && minDate && maxDate) {
      return { from: minDate, to: maxDate };
    }

    const now = new Date();
    let from = null;

    switch (dateRange) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
        break;
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case 'month':
        from = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
        break;
      case 'year':
        from = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
        break;
      default:
        return null;
    }

    return from ? { from } : null;
  };

  // Build enhanced search query
  const buildSearchQuery = () => {
    let searchQuery = query.trim();

    // Handle exact phrase search
    if (exactPhrase && searchQuery && !searchQuery.startsWith('"') && !searchQuery.endsWith('"')) {
      searchQuery = `"${searchQuery}"`;
    }

    // Handle search type
    if (searchType === 'title' && searchQuery) {
      searchQuery = `title:${searchQuery}`;
    } else if (searchType === 'content' && searchQuery) {
      searchQuery = `content:${searchQuery}`;
    }

    return searchQuery;
  };

  // Fetch news with enhanced filters
  const fetchNews = async (isNewSearch = false) => {
    const currentQuery = buildSearchQuery();

    // Allow fetching news without query or category - backend supports it
    if (isNewSearch) {
      setLoading(true);
      setArticles([]);
      setNextPage(null);
    } else {
      setLoadingMore(true);
    }
    setError('');

    try {
      const params = new URLSearchParams();

      // Add search query
      if (currentQuery) {
        params.append('q', currentQuery);
      }

      // Add category
      if (category) {
        params.append('category', category);
      }

      // Add date range
      const dateParams = getDateRangeParams();
      if (dateParams?.from) {
        params.append('from', dateParams.from);
      }
      if (dateParams?.to) {
        params.append('to', dateParams.to);
      }

      // Add language - always send for consistent behavior
      if (language) {
        params.append('language', language);
      }

      // Add source filter
      if (sourceFilter) {
        params.append('source', sourceFilter);
      }

      // Add sort - always send to ensure proper ordering
      if (sortBy) {
        params.append('sort', sortBy);
      }

      // Add pagination
      if (!isNewSearch && nextPage) {
        params.append('nextPage', nextPage);
      }

      params.append('limit', '10');

      const response = await api.get(`/news?${params.toString()}`);
      const responseData = response.data.data || response.data;
      const newArticles = responseData.results || responseData.news || [];
      const backendMessage = response.data.message;

      if (newArticles.length > 0) {
        setArticles(prevArticles => {
          // Merge articles
          const merged = isNewSearch ? newArticles : [...prevArticles, ...newArticles];
          
          // Deduplicate on the frontend to ensure no duplicates
          const deduped = deduplicateArticles(merged);
          
          return deduped;
        });
        setNextPage(responseData.nextPage || null);
        setError('');
      } else {
        if (isNewSearch) {
          setError(backendMessage || 'No articles found. Try adjusting your search criteria.');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch news. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Deduplicate articles helper function
  const deduplicateArticles = (articles) => {
    const seen = new Map();
    const deduplicated = [];

    for (const article of articles) {
      // Use URL as primary deduplication key (most reliable)
      const urlKey = (article.sourceUrl || article.link || article.url || '').toLowerCase().trim();
      
      // Use exact title (case-insensitive, whitespace normalized) as secondary key
      const titleKey = (article.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
      
      // Create a combined key - prefer URL over title
      const combinedKey = urlKey || titleKey;
      
      // Skip if we've seen this exact article before
      if (combinedKey && seen.has(combinedKey)) continue;
      
      // Mark as seen
      if (combinedKey) seen.set(combinedKey, true);

      deduplicated.push(article);
    }

    return deduplicated;
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setDateRange('all');
    setSortBy('relevance');
    setLanguage('en');
    setSourceFilter('');
    setSearchType('all');
    setExactPhrase(false);
    setMinDate('');
    setMaxDate('');
    setError('');
  };

  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Initial load - fetch news on component mount
  useEffect(() => {
    fetchNews(true);
    setIsInitialMount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for filter changes and refetch (after initial mount)
  useEffect(() => {
    if (!isInitialMount) {
      fetchNews(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, dateRange, sortBy, language, sourceFilter, searchType, exactPhrase, minDate, maxDate]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (dateRange !== 'all') count++;
    if (sortBy !== 'relevance') count++;
    if (language !== 'en') count++;
    if (sourceFilter) count++;
    if (searchType !== 'all') count++;
    if (exactPhrase) count++;
    return count;
  }, [query, dateRange, sortBy, language, sourceFilter, searchType, exactPhrase]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tech News Feed</h1>
        <p className="text-gray-600">Search and filter technology news with advanced options</p>
      </div>

      {/* Main Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news by keywords, phrases, or topics..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || loadingMore}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Search size={18} />
            {loading && !loadingMore ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Quick Search Tips */}
        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-2">
          <span className="flex items-center gap-1">
            <span className="font-semibold">Tip:</span> Use quotes for exact phrases
          </span>
          <span>•</span>
          <span>Use AND/OR for boolean search</span>
          <span>•</span>
          <span>Use - to exclude terms</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X size={14} />
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
            </button>
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TrendingUp size={14} className="inline mr-1" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {techCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={14} className="inline mr-1" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <TrendingUp size={14} className="inline mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe size={14} className="inline mr-1" />
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Search Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search In
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Fields</option>
                  <option value="title">Title Only</option>
                  <option value="content">Content Only</option>
                  <option value="both">Title & Content</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  {availableSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exactPhrase}
                    onChange={(e) => setExactPhrase(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Exact phrase match</span>
                </label>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={minDate}
                    onChange={(e) => setMinDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={maxDate}
                    onChange={(e) => setMaxDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Searching for news...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      )}

      {/* No Results State */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-medium">No articles found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}

      {/* Articles List */}
      {!loading && articles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Found <span className="font-semibold">{articles.length}</span> articles
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {articles.map((article, index) => {
              // Map fields to handle news structure
              const title = article.title;
              const description = article.summary || article.content || article.description || '';
              const imageUrl = article.imageUrl || article.image_url;
              const date = article.publishedAt || article.pubDate || article.createdAt;
              let link = article.sourceUrl || article.link;
              const source = article.source_name || 'News Source';

              // Generate a more robust unique key
              const uniqueKey = article._id 
                || article.article_id 
                || article.id 
                || `${title.slice(0, 30)}-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className="flex flex-col border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden cursor-pointer group"
                  onClick={() => {
                    if (link) {
                      // Open the link - backend should have extracted the actual URL
                      // If it's still a Google News URL, the browser will handle the redirect
                      window.open(link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {imageUrl && (
                    <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                        {title}
                      </h3>
                      {date && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">
                      {description.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500 truncate flex-1 mr-2 flex items-center gap-1">
                        <User size={12} />
                        {source}
                      </span>
                      {article.category && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs whitespace-nowrap">
                          {article.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {nextPage && !loadingMore && articles.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchNews(false)}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* Loading More State */}
      {loadingMore && (
        <div className="text-center mt-4 py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading more articles...</p>
        </div>
      )}
    </div>
  );
}

export default NewsList;
