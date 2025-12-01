import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { getDateRangeParams, buildSearchQuery } from '../utils/newsConstants';

/**
 * Custom hook for news filtering and fetching
 */
export const useNewsFilter = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('technology');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPage, setNextPage] = useState(null);
  
  // Advanced filters
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [language, setLanguage] = useState('en');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [exactPhrase, setExactPhrase] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const availableSources = useMemo(() => {
    const sources = new Set();
    articles.forEach(article => {
      if (article.source_name) sources.add(article.source_name);
    });
    return Array.from(sources).sort();
  }, [articles]);

  const fetchNews = async (isNewSearch = false) => {
    const currentQuery = buildSearchQuery(query, exactPhrase, searchType);
    
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
      if (currentQuery) params.append('q', currentQuery);
      if (category) params.append('category', category);
      
      const dateParams = getDateRangeParams(dateRange, minDate, maxDate);
      if (dateParams?.from) params.append('from', dateParams.from);
      if (dateParams?.to) params.append('to', dateParams.to);
      
      if (language && language !== 'en') params.append('language', language);
      if (sourceFilter) params.append('source', sourceFilter);
      if (sortBy && sortBy !== 'relevance') params.append('sort', sortBy);
      if (!isNewSearch && nextPage) params.append('nextPage', nextPage);
      params.append('limit', '10');

      const response = await api.get(`/news?${params.toString()}`);
      const responseData = response.data.data || response.data;
      const newArticles = responseData.results || responseData.news || [];

      if (newArticles.length > 0) {
        setArticles(prevArticles =>
          isNewSearch ? newArticles : [...prevArticles, ...newArticles]
        );
        setNextPage(responseData.nextPage || null);
        setError('');
      } else if (isNewSearch) {
        setError(response.data.message || 'No articles found. Try adjusting your search criteria.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('technology');
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

  useEffect(() => {
    // Fetch news on initial load
    fetchNews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // State
    query, setQuery,
    category, setCategory,
    articles,
    loading,
    loadingMore,
    error,
    nextPage,
    dateRange, setDateRange,
    sortBy, setSortBy,
    language, setLanguage,
    sourceFilter, setSourceFilter,
    searchType, setSearchType,
    exactPhrase, setExactPhrase,
    minDate, setMinDate,
    maxDate, setMaxDate,
    // Computed
    availableSources,
    activeFiltersCount,
    // Actions
    fetchNews,
    clearFilters,
  };
};

