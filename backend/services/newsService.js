const axios = require('axios');
const Parser = require('rss-parser');
const logger = require('../utils/logger');
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

// Comprehensive RSS Feed URLs for all categories
const NEWS_RSS_FEEDS = [
  // ═══════════════════════════════════════════════════════════════════
  // AI & Machine Learning
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://www.artificialintelligence-news.com/feed/', category: 'AI' },
  { url: 'https://machinelearningmastery.com/feed/', category: 'AI' },
  { url: 'https://openai.com/blog/rss/', category: 'AI' },
  { url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss', category: 'AI' },
  { url: 'https://blogs.nvidia.com/feed/', category: 'AI' },
  { url: 'https://www.marktechpost.com/feed/', category: 'AI' },

  // ═══════════════════════════════════════════════════════════════════
  // Cloud Computing
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'Cloud' },
  { url: 'https://cloud.google.com/blog/rss', category: 'Cloud' },
  { url: 'https://azure.microsoft.com/en-us/blog/feed/', category: 'Cloud' },
  { url: 'https://www.cloudcomputing-news.net/feed/', category: 'Cloud' },
  { url: 'https://www.infoworld.com/category/cloud-computing/index.rss', category: 'Cloud' },

  // ═══════════════════════════════════════════════════════════════════
  // DevOps
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://www.devopsdigest.com/feed', category: 'DevOps' },
  { url: 'https://devops.com/feed/', category: 'DevOps' },
  { url: 'https://thenewstack.io/feed/', category: 'DevOps' },
  { url: 'https://www.docker.com/blog/feed/', category: 'DevOps' },
  { url: 'https://kubernetes.io/feed.xml', category: 'DevOps' },

  // ═══════════════════════════════════════════════════════════════════
  // Programming
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://www.infoworld.com/index.rss', category: 'Programming' },
  { url: 'https://stackoverflow.blog/feed/', category: 'Programming' },
  { url: 'https://dev.to/feed/', category: 'Programming' },
  { url: 'https://css-tricks.com/feed/', category: 'Programming' },
  { url: 'https://blog.codinghorror.com/rss/', category: 'Programming' },
  { url: 'https://hackernoon.com/feed', category: 'Programming' },

  // ═══════════════════════════════════════════════════════════════════
  // Cybersecurity
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://www.darkreading.com/rss.xml', category: 'Cybersecurity' },
  { url: 'https://threatpost.com/feed/', category: 'Cybersecurity' },
  { url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity' },
  { url: 'https://www.securityweek.com/feed/', category: 'Cybersecurity' },
  { url: 'https://thehackernews.com/feeds/posts/default?alt=rss', category: 'Cybersecurity' },
  { url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity' },

  // ═══════════════════════════════════════════════════════════════════
  // Healthcare IT
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://www.healthcareitnews.com/rss.xml', category: 'HealthcareIT' },
  { url: 'https://www.healthitoutcomes.com/rss/rss.ashx', category: 'HealthcareIT' },
  { url: 'https://www.healthtechmagazine.net/rss.xml', category: 'HealthcareIT' },
  { url: 'https://medtech.pharmaintelligence.informa.com/-/media/rss/mt.xml', category: 'HealthcareIT' },
  { url: 'https://www.fiercehealthcare.com/rss.xml', category: 'HealthcareIT' },
  { url: 'https://www.mobihealthnews.com/rss.xml', category: 'HealthcareIT' },

  // ═══════════════════════════════════════════════════════════════════
  // General Tech (covers all categories)
  // ═══════════════════════════════════════════════════════════════════
  { url: 'https://techcrunch.com/feed/', category: 'Technology' },
  { url: 'https://www.wired.com/feed/rss', category: 'Technology' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: 'Technology' },
  { url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'Technology' }
];

// In-memory cache for merged articles (for getNewsById lookup)
let cachedArticles = [];
let cacheTimestamp = 0;
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
  if (nextPage && typeof nextPage === 'string') params.append('page', nextPage);
  if (limit && limit > 0) params.append('size', Math.min(limit, 50));

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
 * Fetch news from all Healthcare IT RSS feeds in parallel
 */
const fetchAllRSSFeeds = async () => {
  try {
    logger.info('Fetching all Healthcare IT RSS feeds');

    const feedPromises = NEWS_RSS_FEEDS.map(feed =>
      fetchNewsFromRSSFeed(feed.url, feed.category)
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

  // Fetch from NewsData.io API
  try {
    logger.info('Fetching from NewsData.io', { nextPage });
    const newsData = await fetchNewsFromNewsData({
      q: q || undefined,
      category: category || undefined,
      from: from || undefined,
      to: to || undefined,
      language,
      source: source || undefined,
      sort: sort || undefined,
      limit: parseInt(limit) || 10,
      nextPage: nextPage || undefined // Pass nextPage for pagination
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

  // Only fetch RSS feeds on the first page to avoid pagination conflicts
  // On subsequent pages, we want fresh NewsData.io articles
  if (!nextPage && (parseInt(page) === 1)) {
    try {
      logger.info('Fetching RSS feeds');
      rssArticles = await fetchAllRSSFeeds();
      logger.info('RSS articles fetched', { count: rssArticles.length });
    } catch (error) {
      logger.warn('RSS feeds error', { error: error.message });
    }
  } else {
    logger.info('Skipping RSS feeds', { nextPage, page });
  }

  // Merge all articles
  let allArticles = [...newsDataArticles, ...rssArticles];
  logger.info('Articles merged', { total: allArticles.length });

  // Deduplicate
  allArticles = deduplicateArticles(allArticles);
  logger.info('After deduplication', { total: allArticles.length });

  // Apply filters (only if no nextPage - NewsData.io already filtered)
  if (!nextPage) {
    allArticles = applyFilters(allArticles, { q, category, source, from, to });
    logger.info('After filtering', { total: allArticles.length });
  }

  // Sort based on sort option (date, relevance, popularity)
  allArticles = sortArticles(allArticles, sort || 'date', q);

  // Update cache for getNewsById (replace instead of append to avoid infinite growth)
  if (!nextPage) {
    cachedArticles = allArticles;
  } else {
    cachedArticles = [...cachedArticles, ...allArticles];
  }
  cacheTimestamp = Date.now();

  logger.info('Returning results', { count: allArticles.length, nextPage: newsDataNextPage });

  return {
    results: allArticles,
    totalResults: allArticles.length,
    nextPage: newsDataNextPage, // Return NewsData.io's nextPage token
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

module.exports = {
  getAllNews,
  getNewsById,
  getRSSNews,
  createNews,
  updateNews,
  deleteNews,
  fetchNewsFromNewsData,
  fetchNewsFromRSSFeed,
  fetchAllRSSFeeds
};
