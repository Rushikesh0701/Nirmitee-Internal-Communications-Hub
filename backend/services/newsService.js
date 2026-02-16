const axios = require('axios');
const Parser = require('rss-parser');
const logger = require('../utils/logger');
const { RssSource } = require('../models');
require('dotenv').config();

const {
  mapCategoryToNewsData,
  isValidDateFormat,
  transformNewsDataArticles,
  filterArticlesBySource,
  sortArticles,
  transformRSSArticle,
  deduplicateArticles,
  applyFilters
} = require('../utils/newsDataHelpers');

// RSS Parser instance
const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
  }
});

// Note: NEWS_RSS_FEEDS has been moved to the database (RssSource model)

// In-memory cache for merged articles (for getNewsById lookup)
let cachedArticles = [];
let cacheTimestamp = 0;
let cacheMetadata = {
  lastUpdated: null,
  articleCount: 0,
  sources: [],
  totalResults: 0 // Cache the total results for consistent pagination
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate NewsData.io API key
 */
const validateNewsDataApiKey = () => {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey || apiKey === 'your_newsdata_api_key_here' || apiKey.trim() === '') {
    logger.error('NewsData.io API key validation failed');
    throw new Error('NewsData.io API key is not configured. Please set NEWSDATA_API_KEY in your .env file');
  }

  return apiKey;
};

/**
 * Build NewsData.io API URL parameters
 * Note: from_date and to_date are only available in paid plans, so we skip them
 */
const buildNewsDataParams = (options, apiKey) => {
  const { q, category, language = 'en', limit = 10, nextPage } = options;
  const params = new URLSearchParams();

  params.append('apikey', apiKey);
  if (language) params.append('language', language);
  if (category) params.append('category', mapCategoryToNewsData(category));
  if (q?.trim()) params.append('q', q.trim());
  // Note: from_date and to_date require paid plan - skipping
  if (nextPage && typeof nextPage === 'string' && !nextPage.includes(':')) params.append('page', nextPage);
  // Limit to 10 for free tier compatibility to avoid 422 errors
  params.append('size', '10');

  return params;
};

/**
 * Handle NewsData.io API response errors
 */
const handleNewsDataApiError = (error) => {
  logger.error('NewsData.io API Error Details', {
    message: error.message,
    response: error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : null,
    request: error.request ? 'Request made but no response' : null
  });

  if (error.response) {
    const statusCode = error.response.status;
    const responseData = error.response.data || {};
    const errorMessage = responseData.message || responseData.results?.message || error.message;

    if (statusCode === 401) {
      throw new Error('Invalid NewsData.io API key. Please check your NEWSDATA_API_KEY in .env file. Make sure you replaced the placeholder with your actual API key from https://newsdata.io/');
    }
    if (statusCode === 429) {
      throw new Error('NewsData.io API rate limit exceeded. Please try again later');
    }
    if (statusCode >= 500) {
      throw new Error('NewsData.io API server error. Please try again later');
    }
    throw new Error(`NewsData.io API error (${statusCode}): ${errorMessage || 'Unknown error'}`);
  }

  if (error.request) {
    throw new Error('Unable to connect to NewsData.io API. Please check your internet connection');
  }

  throw new Error(`Error fetching news: ${error.message}`);
};

/**
 * Validate NewsData.io API response
 */
const validateNewsDataResponse = (response) => {
  if (response.data?.status && response.data.status !== 'success') {
    const errorMsg = response.data.message || response.data.results?.message || 'Failed to fetch news from NewsData.io';
    logger.error('NewsData.io API returned error status', { status: response.data.status });
    throw new Error(errorMsg);
  }

  if (response.data?.code && response.data.code !== 200) {
    const errorMsg = response.data.message || `API returned error code: ${response.data.code}`;
    logger.error('NewsData.io API error code', { code: response.data.code });
    throw new Error(errorMsg);
  }
};

/**
 * Fetches news from NewsData.io API
 * Supports advanced search and filtering options
 */
const fetchNewsFromNewsData = async (options = {}) => {
  try {
    const { q, category, from, to, language = 'en', source, sort, limit = 10, nextPage } = options;
    const apiKey = validateNewsDataApiKey();

    const params = buildNewsDataParams(options, apiKey);
    const apiUrl = `https://newsdata.io/api/1/latest?${params.toString()}`;

    logger.info('Fetching news from NewsData.io');

    let response;
    try {
      response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
    } catch (axiosError) {
      throw axiosError;
    }

    logger.info('NewsData.io API Response received', { status: response.status });
    validateNewsDataResponse(response);

    const articles = response.data?.results || [];
    logger.info('NewsData.io articles received', { count: articles.length });

    if (articles.length === 0) {
      return {
        results: [],
        totalResults: 0,
        nextPage: null,
        status: 'success',
        message: 'No articles found for your query'
      };
    }

    let transformedArticles = transformNewsDataArticles(articles, category);

    // Filter out articles with "ONLY AVAILABLE IN PAID PLANS" messages (free tier limitation)
    transformedArticles = transformedArticles.filter(article => {
      const title = (article.title || '').toUpperCase();
      const description = (article.description || '').toUpperCase();
      return !title.includes('ONLY AVAILABLE IN PAID') && !description.includes('ONLY AVAILABLE IN PAID');
    });

    if (source) {
      transformedArticles = filterArticlesBySource(transformedArticles, source);
    }

    if (sort === 'date') {
      transformedArticles = sortArticlesByDate(transformedArticles);
    }

    return {
      results: transformedArticles,
      totalResults: response.data.totalResults || transformedArticles.length,
      nextPage: response.data.nextPage || null,
      status: 'success'
    };
  } catch (error) {
    handleNewsDataApiError(error);
  }
};

/**
 * Fetch news from a single RSS feed
 */
const fetchNewsFromRSSFeed = async (feedUrl, category = 'HealthcareIT') => {
  try {
    logger.info('Fetching RSS feed', { feedUrl });

    const feed = await rssParser.parseURL(feedUrl);
    const articles = (feed.items || []).map(item => transformRSSArticle(item, feedUrl, category));

    logger.info('RSS feed articles received', { feedUrl, count: articles.length });

    return articles;
  } catch (error) {
    logger.warn('Failed to fetch RSS feed', { feedUrl, error: error.message });
    return [];
  }
};

/**
 * Fetch news from all active RSS feeds in parallel
 */
const fetchAllRSSFeeds = async () => {
  try {
    logger.info('Fetching RSS feeds from database');

    // Fetch active RSS sources from DB
    const rssSources = await RssSource.find({ isActive: true });

    if (rssSources.length === 0) {
      logger.warn('No active RSS sources found in database');
      return [];
    }

    logger.info(`Fetching ${rssSources.length} active RSS feeds`);

    const feedPromises = rssSources.map(source =>
      fetchNewsFromRSSFeed(source.url, source.category)
    );

    const results = await Promise.allSettled(feedPromises);

    const allArticles = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    logger.info('Total RSS articles fetched', { count: allArticles.length });

    return allArticles;
  } catch (error) {
    logger.error('Error fetching RSS feeds', { error: error.message });
    return [];
  }
};

/**
 * Get all news from NewsData.io API and RSS feeds
 * Merges, deduplicates, filters, and sorts the results
 */
const getAllNews = async (options = {}) => {
  const { q, category, from, to, language = 'en', source, sort, limit = 10, page = 1, nextPage } = options;

  logger.info('getAllNews called', { page, limit, nextPage, category, q });

  let newsDataArticles = [];
  let rssArticles = [];
  let newsDataNextPage = null;
  let newsDataError = null;
  // Handle composite nextPage token (e.g. "nd:token:p:2" or "p:2")
  let newsDataToken = nextPage;
  let currentPage = parseInt(page) || 1;

  if (nextPage && typeof nextPage === 'string' && nextPage.includes(':')) {
    const parts = nextPage.split(':');
    if (nextPage.startsWith('nd:')) {
      newsDataToken = parts[1] === 'null' ? null : parts[1];
      currentPage = parseInt(parts[3]) || 1;
    } else if (nextPage.startsWith('p:')) {
      currentPage = parseInt(parts[1]) || 1;
      newsDataToken = null;
    }
  }

  // Fetch from NewsData.io API
  try {
    logger.info('Fetching from NewsData.io', { newsDataToken });
    const newsData = await fetchNewsFromNewsData({
      q: q || undefined,
      category: category || undefined,
      from: from || undefined,
      to: to || undefined,
      language,
      source: source || undefined,
      sort: sort || undefined,
      limit: 10, // Consistent with buildNewsDataParams
      nextPage: newsDataToken || undefined
    });

    if (newsData.results && newsData.results.length > 0) {
      newsDataArticles = newsData.results;
      newsDataNextPage = newsData.nextPage || null;
      logger.info('NewsData.io articles fetched', { count: newsDataArticles.length, nextPage: newsDataNextPage });
    } else {
      logger.warn('No articles from NewsData.io');
    }
  } catch (error) {
    logger.warn('NewsData.io API error', { error: error.message });
    newsDataError = error;
  }

  // Always use cached RSS articles if available, refresh if empty or on page 1
  const isCacheExpired = Date.now() - cacheTimestamp > CACHE_TTL;
  if (cachedArticles.length === 0 || isCacheExpired || currentPage === 1) {
    try {
      logger.info('Refreshing articles cache (RSS + NewsData)');
      rssArticles = await fetchAllRSSFeeds();
      logger.info('RSS articles fetched', { count: rssArticles.length });
    } catch (error) {
      logger.warn('RSS feeds error', { error: error.message });
    }
  } else {
    // Filter out NewsData articles from cache to avoid duplicates with the fresh fetch
    rssArticles = cachedArticles.filter(a => a.source_id === 'rss');
    logger.info('Using cached RSS articles', { count: rssArticles.length });
  }

  // Merge current fetch with RSS articles
  let allArticles = [...newsDataArticles, ...rssArticles];

  // Deduplicate
  allArticles = deduplicateArticles(allArticles);

  // Apply filters
  allArticles = applyFilters(allArticles, { q, category, source, from, to });

  // Sort
  allArticles = sortArticles(allArticles, sort || 'date', q);

  // Calculate pagination for the MERGED list
  const requestedLimit = parseInt(limit) || 20;
  const startIndex = (currentPage - 1) * requestedLimit;
  const paginatedArticles = allArticles.slice(startIndex, startIndex + requestedLimit);

  // Update cache
  if (currentPage === 1) {
    cachedArticles = allArticles;
  } else {
    // Merge new articles into cache for future ID lookups
    const existingIds = new Set(cachedArticles.map(a => a.article_id));
    const newArticles = allArticles.filter(a => !existingIds.has(a.article_id));
    cachedArticles = [...cachedArticles, ...newArticles];
  }

  cacheTimestamp = Date.now();

  // Update total results count
  if (currentPage === 1 || !cacheMetadata.totalResults) {
    cacheMetadata.totalResults = allArticles.length;
  }

  // Generate composite nextPage token
  let compositeNextPage = null;
  const hasMoreLocal = allArticles.length > startIndex + requestedLimit;

  if (newsDataNextPage || hasMoreLocal) {
    if (newsDataNextPage) {
      compositeNextPage = `nd:${newsDataNextPage}:p:${currentPage + 1}`;
    } else {
      compositeNextPage = `p:${currentPage + 1}`;
    }
  }

  logger.info('Returning results', {
    count: paginatedArticles.length,
    totalAvailable: allArticles.length,
    currentIndex: startIndex,
    nextPage: compositeNextPage
  });

  return {
    results: paginatedArticles,
    totalResults: cacheMetadata.totalResults,
    nextPage: compositeNextPage,
    status: 'success',
    error: newsDataError ? newsDataError.message : null
  };
};

/**
 * Get news by ID - finds article from in-memory merged list
 */
const getNewsById = async (id) => {
  // If cache is stale, refresh it
  if (Date.now() - cacheTimestamp > CACHE_TTL || cachedArticles.length === 0) {
    await getAllNews({ limit: 100 });
  }

  // Find article by ID
  const article = cachedArticles.find(a =>
    a.article_id === id || a.id === id || a.link === id
  );

  if (!article) {
    throw new Error('Article not found');
  }

  return article;
};

/**
 * Get RSS-only news (Healthcare IT feeds)
 */
const getRSSNews = async (options = {}) => {
  const { q, category, limit = 10, page = 1 } = options;

  let rssArticles = await fetchAllRSSFeeds();

  // Apply filters
  rssArticles = applyFilters(rssArticles, { q, category });

  // Sort by date (newest first)
  rssArticles = sortArticlesByDate(rssArticles);

  // Paginate
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedArticles = rssArticles.slice(startIndex, endIndex);

  const hasMore = rssArticles.length > endIndex;

  return {
    results: paginatedArticles,
    totalResults: rssArticles.length,
    nextPage: hasMore ? (parseInt(page) + 1).toString() : null,
    status: 'success'
  };
};

/**
 * Create news - Not supported, news comes from external API
 */
const createNews = async (newsData) => {
  throw new Error('News creation is not supported. News is fetched from external APIs.');
};

/**
 * Update news - Not supported, news comes from external API
 */
const updateNews = async (id, updateData, userId, user) => {
  throw new Error('News updates are not supported. News is fetched from external APIs.');
};

/**
 * Delete news - Not supported, news comes from external API
 */
const deleteNews = async (id, userId, user) => {
  throw new Error('News deletion is not supported. News is fetched from external APIs.');
};



/**
 * Check for news updates since a given timestamp
 * Returns count and basic info without fetching full articles
 */
const checkNewsUpdates = async (lastCheckTime) => {
  try {
    // Use cached articles if available and fresh
    if (Date.now() - cacheTimestamp > CACHE_TTL || cachedArticles.length === 0) {
      await getAllNews({ limit: 50 }); // Refresh cache with reasonable limit
    }

    const checkTimestamp = new Date(lastCheckTime);

    // Filter articles published after the last check time
    const newArticles = cachedArticles.filter(article => {
      const articleDate = new Date(article.publishedAt || article.pubDate || article.createdAt);
      return articleDate > checkTimestamp;
    });

    // Sort by date (newest first)
    newArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.pubDate || a.createdAt);
      const dateB = new Date(b.publishedAt || b.pubDate || b.createdAt);
      return dateB - dateA;
    });

    // Return count and first 3 article titles
    const latestArticles = newArticles.slice(0, 3).map(article => ({
      title: article.title,
      publishedAt: article.publishedAt || article.pubDate || article.createdAt,
      source: article.source_name || article.source
    }));

    return {
      newArticlesCount: newArticles.length,
      latestArticles,
      hasUpdates: newArticles.length > 0,
      status: 'success'
    };
  } catch (error) {
    logger.error('Error checking news updates', { error: error.message });
    return {
      newArticlesCount: 0,
      latestArticles: [],
      hasUpdates: false,
      status: 'error',
      message: error.message
    };
  }
};


/**
 * Get cache metadata
 */
const getCacheMetadata = () => {
  return {
    ...cacheMetadata,
    articleCount: cachedArticles.length,
    lastUpdated: cacheTimestamp ? new Date(cacheTimestamp) : null
  };
};

module.exports = {
  getAllNews,
  getNewsById,
  getRSSNews,
  createNews,
  updateNews,
  deleteNews,
  fetchNewsFromNewsData,
  fetchNewsFromRSSFeed,
  fetchAllRSSFeeds,
  checkNewsUpdates,
  getCacheMetadata
};
