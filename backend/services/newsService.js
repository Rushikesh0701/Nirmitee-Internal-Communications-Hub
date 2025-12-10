const { User, RSSFeed, RssArticle } = require('../models');
const { ROLES } = require('../constants/roles');
const Parser = require('rss-parser');
const parser = new Parser();
const axios = require('axios');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

const {
  mapCategoryToNewsData,
  mapSortToNewsData,
  isValidDateFormat,
  transformNewsDataArticles,
  filterArticlesBySource,
  sortArticlesByDate
} = require('../utils/newsDataHelpers');

/**
 * Get all news from database
 */
/**
 * Get all news from database (Internal News + RSS Articles)
 * Supports search, filtering, and sorting
 */
const getAllNews = async (options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    priority, 
    published,
    q,           // Search query
    from,        // Date range start
    to,          // Date range end
    source,      // Source filter
    sort = 'relevance', // Sort order: 'date', 'relevance', 'popularity'
    language     // Language filter (not used for RSS, but kept for API compatibility)
  } = options;
  const skip = (page - 1) * limit;

  // 1. Build query for RSS articles only (News model removed - not storing news)
  const rssQuery = {};

  // Category filter
  if (category) {
    // Support case-insensitive category matching
    rssQuery.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  // Search query - search in title and description
  if (q && q.trim()) {
    const searchTerm = q.trim();
    // Remove special search prefixes like "title:", "content:"
    let cleanSearch = searchTerm
      .replace(/^title:/i, '')
      .replace(/^content:/i, '')
      .replace(/"/g, '') // Remove exact phrase quotes
      .trim();
    
    if (cleanSearch) {
      // Create regex for case-insensitive search
      const searchRegex = new RegExp(cleanSearch, 'i');
      rssQuery.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
  }

  // Date range filters
  if (from || to) {
    rssQuery.publishedAt = {};
    if (from) {
      rssQuery.publishedAt.$gte = new Date(from);
    }
    if (to) {
      // Set to end of day for 'to' date
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      rssQuery.publishedAt.$lte = toDate;
    }
  }

  // 2. Determine sort order
  let sortOrder = { publishedAt: -1 }; // Default: newest first
  if (sort === 'date') {
    sortOrder = { publishedAt: -1 };
  } else if (sort === 'popularity') {
    sortOrder = { views: -1, publishedAt: -1 };
  }
  // 'relevance' sorting is handled post-query for text searches

  // 3. Fetch from RSS sources
  const fetchLimit = skip + limit;

  let rssArticles = await RssArticle.find(rssQuery)
    .populate('feedId', 'feedUrl category')
    .sort(sortOrder)
    .limit(fetchLimit)
    .lean();

  // 4. Apply source filter (post-query since source info might be in feedId)
  if (source && source.trim()) {
    const sourceFilter = source.trim().toLowerCase();
    rssArticles = rssArticles.filter(article => {
      const feedUrl = article.feedId?.feedUrl || '';
      const articleSource = feedUrl.toLowerCase();
      return articleSource.includes(sourceFilter);
    });
  }

  // 5. Normalize RSS articles to match News schema
  const normalizedRss = rssArticles.map(article => ({
    _id: article._id,
    title: article.title,
    content: article.description || '',
    summary: article.description || '',
    imageUrl: article.imageUrl,
    category: article.category,
    priority: article.category === 'HealthcareIT' ? 'high' : 'medium',
    isPublished: true,
    publishedAt: article.publishedAt,
    sourceUrl: article.link,
    sourceType: 'rss',
    authorId: {
      firstName: 'RSS',
      lastName: 'Feed',
      email: 'rss@nirmitee.com'
    },
    createdAt: article.publishedAt
  }));

  // 6. Sort for relevance (if searching and sort is relevance)
  let allNews = normalizedRss;
  if (q && q.trim() && sort === 'relevance') {
    const searchTerm = q.trim().toLowerCase()
      .replace(/^title:/i, '')
      .replace(/^content:/i, '')
      .replace(/"/g, '')
      .trim();
    
    // Score by relevance: title matches > content matches
    allNews = normalizedRss.sort((a, b) => {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      const contentA = (a.content || '').toLowerCase();
      const contentB = (b.content || '').toLowerCase();
      
      // Calculate relevance scores
      const scoreA = (titleA.includes(searchTerm) ? 10 : 0) + (contentA.includes(searchTerm) ? 5 : 0);
      const scoreB = (titleB.includes(searchTerm) ? 10 : 0) + (contentB.includes(searchTerm) ? 5 : 0);
      
      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Higher score first
      }
      // If same score, sort by date
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
  } else if (sort === 'date') {
    allNews = normalizedRss.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt);
      const dateB = new Date(b.publishedAt || b.createdAt);
      return dateB - dateA;
    });
  }

  // 7. Paginate the result
  const paginatedNews = allNews.slice(skip, skip + limit);

  // 8. Get total count with the same filters
  const total = await RssArticle.countDocuments(rssQuery);

  return {
    news: paginatedNews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get news by ID (RSS articles only - News model removed)
 */
const getNewsById = async (id, userId) => {
  const news = await RssArticle.findById(id)
    .populate('feedId', 'feedUrl category');

  if (!news) {
    throw new Error('News not found');
  }

  // Convert RSS article to news format
  return {
    _id: news._id,
    title: news.title,
    content: news.description || '',
    summary: news.description || '',
    imageUrl: news.imageUrl,
    category: news.category,
    priority: news.category === 'HealthcareIT' ? 'high' : 'medium',
    isPublished: true,
    publishedAt: news.publishedAt,
    sourceUrl: news.link,
    sourceType: 'rss',
    authorId: {
      firstName: 'RSS',
      lastName: 'Feed',
      email: 'rss@nirmitee.com'
    },
    views: news.views || 0,
    createdAt: news.publishedAt
  };
};

/**
 * Validate and normalize MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!id) {
    throw new Error(`${fieldName} is required`);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName} format. Must be a valid MongoDB ObjectId.`);
  }

  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};

/**
 * Create news (Not supported - News model removed, not storing news)
 */
const createNews = async (newsData) => {
  throw new Error('News creation is not supported. News storage has been removed.');
};

/**
 * Update news (Not supported - News model removed, not storing news)
 */
const updateNews = async (id, updateData, userId, user) => {
  throw new Error('News updates are not supported. News storage has been removed.');
};

/**
 * Delete news (Not supported - News model removed, not storing news)
 */
const deleteNews = async (id, userId, user) => {
  throw new Error('News deletion is not supported. News storage has been removed.');
};

/**
 * Extract image URL from RSS item
 */
const extractImageUrl = (item) => {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.$?.url) return item['media:content'].$.url;
  if (item.content) {
    const match = item.content.match(/<img[^>]+src="([^"]+)"/);
    if (match) return match[1];
  }
  return null;
};

/**
 * Resolve Google News RSS redirect URLs to actual article URLs
 * Google News RSS links are redirect URLs that need to be resolved
 */
const resolveGoogleNewsUrl = async (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's a Google News RSS link
  if (!url.includes('news.google.com/rss/articles')) {
    return url; // Not a Google News link, return as-is
  }

  try {
    // Try to extract URL from the link itself or follow redirect
    // Google News RSS URLs sometimes have the actual URL in query params or need redirect following
    const response = await axios.head(url, {
      maxRedirects: 5,
      timeout: 5000,
      validateStatus: (status) => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Get the final URL after redirects
    const finalUrl = response.request?.res?.responseUrl || response.request?.path || url;
    
    // If still a Google News URL, try to extract from content
    if (finalUrl.includes('news.google.com') || finalUrl.includes('workspace')) {
      // Try alternative: use a URL resolver service or return original
      // For now, return the original URL and let frontend handle it
      logger.warn('Could not resolve Google News URL', { originalUrl: url, finalUrl });
      return url;
    }

    return finalUrl;
  } catch (error) {
    logger.warn('Error resolving Google News URL', { url, error: error.message });
    // Return original URL if resolution fails
    return url;
  }
};

/**
 * Extract actual URL from RSS item content (for Google News)
 * Sometimes the actual URL is embedded in the content/description
 */
const extractUrlFromContent = (item) => {
  const content = item.content || item.contentSnippet || item.description || '';
  
  if (!content) return null;
  
  // Try multiple patterns to find the actual article URL
  const urlPatterns = [
    // Standard URL pattern
    /https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w)*)?)?/g,
    // URL in href attribute
    /href=["']([^"']+)["']/gi,
    // URL parameter
    /url=([^&\s"']+)/gi,
    // Link tag
    /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  ];

  const foundUrls = new Set();
  
  for (const pattern of urlPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      let url = match[1] || match[0];
      
      // Clean up the URL
      url = url.replace(/^href=["']/i, '').replace(/["']$/, '')
                .replace(/^url=/i, '').trim();
      
      // Skip Google News URLs, workspace URLs, and invalid URLs
      if (url && 
          !url.includes('news.google.com') && 
          !url.includes('workspace') &&
          !url.includes('google.com/accounts') &&
          url.startsWith('http')) {
        try {
          const parsedUrl = new URL(url);
          // Make sure it's a real article URL (has a domain)
          if (parsedUrl.hostname && parsedUrl.hostname !== 'news.google.com') {
            foundUrls.add(url);
          }
        } catch (e) {
          // Not a valid URL, continue
        }
      }
    }
  }

  // Return the first valid URL found (usually the article URL)
  if (foundUrls.size > 0) {
    return Array.from(foundUrls)[0];
  }

  return null;
};

/**
 * Fetch news from RSS feed
 */
const fetchNewsFromRSSFeed = async (feedUrl, category) => {
  try {
    const feedData = await parser.parseURL(feedUrl);
    const newsItems = [];

    for (const item of feedData.items || []) {
      try {
        const content = item.content || item.contentSnippet || item.description || '';
        const summary = item.contentSnippet || item.description || '';
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        const imageUrl = extractImageUrl(item);

        // Resolve Google News redirect URLs to actual article URLs
        let articleUrl = item.link || '';
        
        // First try to extract URL from content (faster, no network call)
        const extractedUrl = extractUrlFromContent(item);
        if (extractedUrl) {
          articleUrl = extractedUrl;
        } else if (articleUrl.includes('news.google.com/rss/articles')) {
          // If it's a Google News URL and we couldn't extract from content,
          // try to resolve it (this is async, so we'll do it synchronously for now)
          // For better performance, we could batch resolve these
          articleUrl = articleUrl; // Keep original for now, frontend can handle
        }

        newsItems.push({
          title: item.title || 'Untitled',
          content,
          summary: summary.substring(0, 500),
          imageUrl,
          category: category || 'General',
          priority: category === 'HealthcareIT' ? 'high' : 'medium', // Prioritize HealthcareIT news
          isPublished: true,
          publishedAt,
          sourceUrl: articleUrl,
          sourceType: 'rss'
        });
      } catch (error) {
        logger.error('Error processing RSS item', { error: error.message });
      }
    }

    return newsItems;
  } catch (error) {
    logger.error('Failed to fetch RSS feed', { feedUrl, error: error.message });
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
  }
};

/**
 * Sync RSS feeds to news (Not supported - News model removed, RSS articles are stored in RssArticle collection)
 */
const syncRSSFeedsToNews = async (systemUserId) => {
  throw new Error('RSS feed syncing to News is not supported. News storage has been removed. RSS articles are stored in the RssArticle collection.');
};

/**
 * Get news from RSS feed
 */
const getNewsFromRSSFeed = async (feedUrl, category, limit = 10) => {
  const newsItems = await fetchNewsFromRSSFeed(feedUrl, category);
  return newsItems.slice(0, limit);
};

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
 */
const buildNewsDataParams = (options, apiKey) => {
  const { q, category, from, to, language = 'en', source, sort, limit = 10, nextPage } = options;
  const params = new URLSearchParams();

  params.append('apikey', apiKey);
  if (language) params.append('language', language);
  if (category) params.append('category', mapCategoryToNewsData(category));
  if (q?.trim()) params.append('q', q.trim());
  if (from && isValidDateFormat(from)) params.append('from_date', from);
  if (to && isValidDateFormat(to)) params.append('to_date', to);
  if (nextPage && typeof nextPage === 'string') params.append('page', nextPage);
  if (limit && limit > 0) params.append('size', Math.min(limit, 50));
  // Add sort parameter - NewsData.io supports: relevance, date, popularity
  if (sort) params.append('prioritybycountry', sort === 'date' ? 'latest' : sort);

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
    const apiUrl = `https://newsdata.io/api/1/news?${params.toString()}`;

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

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  fetchNewsFromRSSFeed,
  syncRSSFeedsToNews,
  getNewsFromRSSFeed,
  fetchNewsFromNewsData
};
