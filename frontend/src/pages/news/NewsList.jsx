import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, X, Calendar, Globe, User, TrendingUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import NewsUpdateToast from '../../components/NewsUpdateToast';

function NewsList() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageTokens, setPageTokens] = useState({}); // Map of page number to nextPage token
  const [hasMorePages, setHasMorePages] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Records per page selector
  const [totalResults, setTotalResults] = useState(0); // Total number of results from backend
  

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
  const fetchNews = async (isNewSearch = false, targetPage = null) => {
    const currentQuery = buildSearchQuery();
    const pageToLoad = targetPage !== null ? targetPage : currentPage;

    // Allow fetching news without query or category - backend supports it
    if (isNewSearch || targetPage !== null) {
      setLoading(true);
      setError('');
    } else {
      setLoadingMore(true);
    }

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

      // Add pagination - use stored token for the target page
      if (pageToLoad > 1 && pageTokens[pageToLoad]) {
        params.append('nextPage', pageTokens[pageToLoad]);
      }

      params.append('limit', recordsPerPage.toString());

      const response = await api.get(`/news?${params.toString()}`);
      const responseData = response.data.data || response.data;
      const newArticles = responseData.results || responseData.news || [];
      const backendMessage = response.data.message;
      const nextPageToken = responseData.nextPage || null;
      const totalCount = responseData.totalResults || 0;

      if (newArticles.length > 0) {
        // Replace articles with new page results
        const deduped = deduplicateArticles(newArticles);
        setArticles(deduped);
        setTotalResults(totalCount);
        
        // Store the next page token for future navigation
        if (nextPageToken) {
          setPageTokens(prev => ({
            ...prev,
            [pageToLoad + 1]: nextPageToken
          }));
          setHasMorePages(true);
        } else {
          setHasMorePages(false);
        }
        
        setNextPage(nextPageToken);
        setError('');
      } else {
        setArticles([]);
        setTotalResults(0);
        setHasMorePages(false);
        setNextPage(null);
        if (isNewSearch || targetPage !== null) {
          setError(backendMessage || 'No articles found. Try adjusting your search criteria.');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch news. Please try again.';
      setError(errorMessage);
      setArticles([]);
      setHasMorePages(false);
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
    setCurrentPage(1);
    setPageTokens({});
    setHasMorePages(false);
    fetchNews(true, 1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page === currentPage || page < 1) return;
    setCurrentPage(page);
    fetchNews(false, page);
    // Scroll to top of articles
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    if (hasMorePages && !loading && !loadingMore) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading && !loadingMore) {
      handlePageChange(currentPage - 1);
    }
  };

  // Handle records per page change
  const handleRecordsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setRecordsPerPage(newLimit);
    setCurrentPage(1);
    setPageTokens({});
    setHasMorePages(false);
    // Fetch will be triggered by useEffect watching recordsPerPage
  };

  // Handle first page navigation
  const handleFirstPage = () => {
    if (currentPage !== 1 && !loading && !loadingMore) {
      handlePageChange(1);
    }
  };

  // Handle last page navigation
  const handleLastPage = () => {
    if (totalResults > 0 && !loading && !loadingMore) {
      // totalPages = ceil(totalRecords / pageSize)
      const totalPages = Math.ceil(totalResults / recordsPerPage);
      if (currentPage !== totalPages) {
        handlePageChange(totalPages);
      }
    }
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
    // Reset pagination and total
    setCurrentPage(1);
    setPageTokens({});
    setHasMorePages(false);
    setTotalResults(0); // Reset total to get fresh count
  };

  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);

  // News update polling state
  const pollingIntervalRef = useRef(null);
  const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  const LAST_CHECK_KEY = 'newsLastCheckTime';

  // Check for news updates
  const checkForNewsUpdates = async () => {
    try {
      const lastCheckTime = localStorage.getItem(LAST_CHECK_KEY);
      
      // If no last check time, set it to now and skip check
      if (!lastCheckTime) {
        localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
        return;
      }

      const response = await api.get(`/news/check-updates?lastCheckTime=${lastCheckTime}`);
      const data = response.data.data || response.data;

      if (data.hasUpdates && data.newArticlesCount > 0) {
        // Display custom toast
        toast.custom(
          (t) => (
            <NewsUpdateToast
              newArticlesCount={data.newArticlesCount}
              latestArticles={data.latestArticles}
              onViewNow={() => {
                toast.dismiss(t.id);
                // Update last check time
                localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
                // Refresh the news list
                setCurrentPage(1);
                setPageTokens({});
                setHasMorePages(false);
                fetchNews(true, 1);
              }}
              onDismiss={() => {
                toast.dismiss(t.id);
                // Update last check time even on dismiss
                localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
              }}
            />
          ),
          {
            duration: 10000, // 10 seconds
            position: 'top-right',
          }
        );
      }

      // Update last check time after successful check
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error checking for news updates:', error);
    }
  };

  // Initial load - fetch news on component mount
  useEffect(() => {
    setCurrentPage(1);
    setPageTokens({});
    setHasMorePages(false);
    fetchNews(true, 1);
    setIsInitialMount(false);
    
    // Initialize last check time if not set
    if (!localStorage.getItem(LAST_CHECK_KEY)) {
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for filter changes and refetch (after initial mount)
  useEffect(() => {
    if (!isInitialMount) {
      setCurrentPage(1);
      setPageTokens({});
      setHasMorePages(false);
      fetchNews(true, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, dateRange, sortBy, language, sourceFilter, searchType, exactPhrase, minDate, maxDate]);

  // Watch for recordsPerPage changes and refetch
  useEffect(() => {
    if (!isInitialMount) {
      setCurrentPage(1);
      setPageTokens({});
      setHasMorePages(false);
      fetchNews(true, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsPerPage]);

  // Set up polling for news updates
  useEffect(() => {
    
    // Start polling immediately (after a short delay)
    const initialTimeout = setTimeout(() => {
      checkForNewsUpdates();
    }, 10000); // Check after 10 seconds of being on the page

    // Set up interval for subsequent checks
    pollingIntervalRef.current = setInterval(() => {
      checkForNewsUpdates();
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearTimeout(initialTimeout);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

      {/* Pagination Controls */}
      {!loading && articles.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: Records per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={handleRecordsPerPageChange}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium bg-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Center: Page range info */}
            <div className="text-sm text-gray-600">
              {(() => {
                // Pagination formula:
                // startIndex = (currentPage - 1) * pageSize
                // endIndex = startIndex + pageSize
                const startIndex = (currentPage - 1) * recordsPerPage + 1;
                const endIndex = Math.min(startIndex + articles.length - 1, totalResults);
                
                return (
                  <>
                    <span className="font-semibold">
                      {startIndex}-{endIndex}
                    </span>
                    <span className="mx-1">of</span>
                    <span className="font-semibold">{totalResults > 0 ? totalResults : articles.length}</span>
                  </>
                );
              })()}
            </div>

            {/* Right: Navigation Controls */}
            <div className="flex items-center gap-1">
              {/* First Page Button */}
              <button
                onClick={handleFirstPage}
                disabled={currentPage === 1 || loadingMore}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              </button>

              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loadingMore}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronDown className="rotate-90" size={18} />
              </button>

              {/* Page Number Display */}
              <div className="hidden sm:flex items-center px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-lg min-w-[60px] justify-center">
                {currentPage}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={!hasMorePages || loadingMore}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                title={hasMorePages ? "Next page" : "No more pages"}
              >
                {loadingMore ? (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ChevronDown className="rotate-[-90deg]" size={18} />
                )}
              </button>

              {/* Last Page Button */}
              <button
                onClick={handleLastPage}
                disabled={totalResults === 0 || currentPage === Math.ceil(totalResults / recordsPerPage) || loadingMore}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title={`Last page (${Math.ceil(totalResults / recordsPerPage)})`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsList;
