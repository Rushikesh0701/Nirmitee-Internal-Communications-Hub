const newsService = require('../services/newsService');
const dummyDataService = require('../services/dummyDataService');
const logger = require('../utils/logger');
const { getMongoUserIdSafe } = require('../utils/userMappingHelper');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const { isNewsDataRequest, getNewsDataErrorMessage } = require('../utils/newsDataHelpers');

/**
 * Transform dummy news to NewsData.io format
 */
const transformDummyNewsToNewsDataFormat = (dummyNews, category) => {
  return {
            results: (dummyNews.news || []).map(item => ({
              article_id: item._id || item.id || `dummy-${Date.now()}-${Math.random()}`,
              title: item.title || 'Untitled',
              description: item.summary || item.content || '',
              link: item.sourceUrl || '#',
              image_url: item.imageUrl || null,
              pubDate: item.publishedAt || item.createdAt || new Date().toISOString(),
              source_id: 'dummy',
              source_name: 'Sample News',
              category: item.category || category || 'technology',
              creator: item.Author ? [`${item.Author.firstName} ${item.Author.lastName}`] : [],
              content: item.content || item.summary || ''
            })),
            totalResults: dummyNews.pagination?.total || (dummyNews.news || []).length,
            nextPage: dummyNews.pagination && dummyNews.pagination.page < dummyNews.pagination.pages 
              ? dummyNews.pagination.page + 1 
              : null,
            status: 'success'
          };
};

/**
 * Get dummy news with fallback handling
 */
const getDummyNewsFallback = (queryParams) => {
  const { page = 1, limit = 10, category, priority, published } = queryParams;
  return dummyDataService.getDummyNews({
    page: parseInt(page),
    limit: parseInt(limit),
    category,
    priority,
    published: published === 'true' ? true : undefined
  });
};

/**
 * Normalize database news to NewsData.io format
 */
const normalizeDatabaseNews = (dbNews) => {
  if (!dbNews || !dbNews.news) return [];
  
  return dbNews.news.map(item => ({
    article_id: item._id?.toString() || item.id || `db-${Date.now()}-${Math.random()}`,
    title: item.title || 'Untitled',
    description: item.summary || item.content || '',
    link: item.sourceUrl || '#',
    image_url: item.imageUrl || null,
    pubDate: item.publishedAt || item.createdAt || new Date().toISOString(),
    source_id: item.sourceType === 'rss' ? 'rss' : 'internal',
    source_name: item.sourceType === 'rss' ? 'RSS Feed' : (item.Author ? `${item.Author.firstName} ${item.Author.lastName}` : 'Internal'),
    category: item.category || 'technology',
    creator: item.Author ? [`${item.Author.firstName} ${item.Author.lastName}`] : [],
    content: item.content || item.summary || '',
    sourceType: item.sourceType || 'internal'
  }));
};

/**
 * Merge and deduplicate news from multiple sources
 * Prioritizes HealthcareIT news and high priority items
 */
const mergeNewsSources = (newsDataArticles, dbNewsArticles) => {
  const allArticles = [...newsDataArticles, ...dbNewsArticles];
  const seenTitles = new Set();
  const merged = [];

  // Deduplicate by title (case-insensitive)
  for (const article of allArticles) {
    const titleKey = (article.title || '').toLowerCase().trim();
    if (titleKey && !seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      merged.push(article);
    }
  }

  // Sort by priority (HealthcareIT/high priority first), then by date (newest first)
  const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
  return merged.sort((a, b) => {
    // Check if article is HealthcareIT category
    const isAHealthcareIT = a.category === 'HealthcareIT' || a.category === 'healthcareit';
    const isBHealthcareIT = b.category === 'HealthcareIT' || b.category === 'healthcareit';
    
    // HealthcareIT articles get highest priority
    if (isAHealthcareIT && !isBHealthcareIT) return -1;
    if (!isAHealthcareIT && isBHealthcareIT) return 1;
    
    // Then sort by priority level
    const priorityA = priorityOrder[a.priority] || 2;
    const priorityB = priorityOrder[b.priority] || 2;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }
    
    // Finally sort by date (newest first)
    const dateA = new Date(a.pubDate || 0);
    const dateB = new Date(b.pubDate || 0);
    return dateB - dateA;
  });
};

/**
 * Handle NewsData.io API request (with optional database merge)
 */
const handleNewsDataRequest = async (req, res, mergeWithDatabase = false) => {
  const {
    page = 1,
    limit = 10,
    q,
    category,
    from,
    to,
    language = 'en',
    source,
    sort,
    nextPage
  } = req.query;

  let newsDataResults = [];
  let newsDataNextPage = null;
  let newsDataError = null;

  // Always try to fetch from NewsData.io
  try {
    const newsData = await newsService.fetchNewsFromNewsData({
      q: q || undefined,
      category: category || 'technology', // Default to technology if no category
      from: from || undefined,
      to: to || undefined,
      language,
      source: source || undefined,
      sort: sort || undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      nextPage: nextPage || undefined
    });

    if (newsData.results && newsData.results.length > 0) {
      newsDataResults = newsData.results;
      newsDataNextPage = newsData.nextPage || null;
    }
  } catch (error) {
    logger.warn('NewsData.io API error (will try database fallback)', { error: error.message });
    newsDataError = error;
  }

  // If merging with database or NewsData.io failed, fetch from database
  if (mergeWithDatabase || newsDataError) {
    try {
      // Fetch more items from database to account for deduplication when merging
      const fetchLimit = parseInt(limit) * 2; // Fetch more to account for deduplication
      const dbNews = await newsService.getAllNews({
        page: parseInt(page),
        limit: fetchLimit,
        category,
        priority: undefined,
        published: undefined,
        q,           // Pass search query
        from,        // Pass date range start
        to,          // Pass date range end
        source,      // Pass source filter
        sort,        // Pass sort order
        language     // Pass language filter
      });

      const normalizedDbNews = normalizeDatabaseNews(dbNews);

      if (newsDataResults.length > 0) {
        // Merge both sources
        const merged = mergeNewsSources(newsDataResults, normalizedDbNews);
        const paginatedMerged = merged.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
        
        // Determine if there are more pages:
        // 1. If NewsData.io has nextPage token, use it (highest priority - it's a token string)
        // 2. Otherwise, check if there might be more results:
        //    - NewsData.io returned full limit (might have more)
        //    - Merged results exceed current page limit
        //    - Database has more pages
        const newsDataMightHaveMore = !newsDataNextPage && newsDataResults.length >= parseInt(limit);
        const hasMoreMerged = merged.length > (parseInt(page) * parseInt(limit));
        const dbHasMore = dbNews.pagination && dbNews.pagination.page < dbNews.pagination.pages;
        
        // Use NewsData.io token if available, otherwise use page number if there might be more
        const finalNextPage = newsDataNextPage || (newsDataMightHaveMore || hasMoreMerged || dbHasMore ? (parseInt(page) + 1).toString() : null);

        return sendSuccess(res, {
          results: paginatedMerged,
          totalResults: merged.length,
          nextPage: finalNextPage,
          status: 'success'
        }, newsDataError ? getNewsDataErrorMessage(newsDataError) : 'News from multiple sources');
      } else {
        // Only database news available
        const transformedDbNews = normalizedDbNews.map(item => ({
          ...item,
          source_name: item.source_name || 'Internal'
        }));

        // Check if database has more pages
        const dbHasMore = dbNews.pagination && dbNews.pagination.page < dbNews.pagination.pages;
        const dbNextPage = dbHasMore ? (parseInt(page) + 1).toString() : null;

        return sendSuccess(res, {
          results: transformedDbNews,
          totalResults: transformedDbNews.length,
          nextPage: dbNextPage,
          status: 'success'
        }, newsDataError ? getNewsDataErrorMessage(newsDataError) : null);
      }
    } catch (dbError) {
      logger.error('Database error', { error: dbError.message });
      
      // Fallback to dummy data
      if (newsDataResults.length > 0) {
        return sendSuccess(res, {
          results: newsDataResults,
          totalResults: newsDataResults.length,
          nextPage: newsDataNextPage,
          status: 'success'
        }, newsDataError ? getNewsDataErrorMessage(newsDataError) : null);
      }

      const dummyNews = getDummyNewsFallback(req.query);
      const transformedDummyNews = transformDummyNewsToNewsDataFormat(dummyNews, category);
      return sendSuccess(res, transformedDummyNews, newsDataError ? getNewsDataErrorMessage(newsDataError) : 'Using sample data');
    }
  }

  // Only NewsData.io results (no merge requested and no error)
  if (newsDataResults.length === 0) {
    return sendSuccess(res, {
      results: [],
      totalResults: 0,
      nextPage: null,
      status: 'success'
    }, newsDataError ? getNewsDataErrorMessage(newsDataError) : 'No articles found for your query. Please try a different search term or category.');
  }

  return sendSuccess(res, {
    results: newsDataResults,
    totalResults: newsDataResults.length,
    nextPage: newsDataNextPage,
    status: 'success'
  });
};

/**
 * Handle database news request
 */
const handleDatabaseNewsRequest = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    priority, 
    published,
    q,
    from,
    to,
    source,
    sort,
    language
  } = req.query;
    
    try {
    const news = await newsService.getAllNews({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        priority,
        published: published === 'true',
        q,
        from,
        to,
        source,
        sort,
        language
      });

    if (!news || !news.news || (Array.isArray(news.news) && news.news.length === 0)) {
      const dummyNews = getDummyNewsFallback(req.query);
      return sendSuccess(res, dummyNews);
    }

    return sendSuccess(res, news);
  } catch (dbError) {
    logger.warn('Database error, using dummy data', { error: dbError.message });
    const dummyNews = getDummyNewsFallback(req.query);
    return sendSuccess(res, dummyNews);
  }
};

/**
 * GET /api/news - Get all news
 * Always tries NewsData.io first, then merges with database/RSS if available
 */
const getAllNews = async (req, res, next) => {
  try {
    // Always try NewsData.io and merge with database/RSS
    return await handleNewsDataRequest(req, res, true);
  } catch (error) {
    logger.warn('Error in getAllNews, using fallback', { error: error.message });
    try {
      // Try database as fallback
      return await handleDatabaseNewsRequest(req, res);
    } catch (fallbackError) {
      // Last resort: dummy data
      const dummyNews = getDummyNewsFallback(req.query);
      return sendSuccess(res, dummyNews, 'Using sample data due to service unavailability');
    }
  }
};

/**
 * GET /api/news/:id - Get news by ID
 */
const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await newsService.getNewsById(id, req.userId);
    return sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/news - Create news
 */
const createNews = async (req, res, next) => {
  try {
    const authorId = await getMongoUserIdSafe(req.userId);
    const newsData = { ...req.body, authorId };
    const news = await newsService.createNews(newsData);
    return sendSuccess(res, news, null, 201);
  } catch (error) {
    if (error.message.includes('authentication') || error.message.includes('login')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
};

/**
 * PUT /api/news/:id - Update news
 */
const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await newsService.updateNews(id, req.body, req.userId, req.user);
    return sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/news/:id - Delete news
 */
const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    await newsService.deleteNews(id, req.userId, req.user);
    return sendSuccess(res, null, 'News deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/news/sync-rss - Sync RSS feeds to news
 */
const syncRSSFeeds = async (req, res, next) => {
  try {
    const systemUserId = await getMongoUserIdSafe(req.userId);
    const result = await newsService.syncRSSFeedsToNews(systemUserId);
    return sendSuccess(res, result, `Synced RSS feeds. Created ${result.totalNewsCreated} news items.`);
  } catch (error) {
    if (error.message.includes('authentication') || error.message.includes('login')) {
      return sendError(res, error.message, 401);
    }
    next(error);
  }
};

/**
 * GET /api/news/rss - Get news from RSS feed
 */
const getNewsFromRSS = async (req, res, next) => {
  try {
    const { feedUrl, category, limit = 10 } = req.query;
    
    if (!feedUrl) {
      return sendError(res, 'feedUrl is required', 400);
    }

    const news = await newsService.getNewsFromRSSFeed(feedUrl, category, parseInt(limit));
    return sendSuccess(res, news);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  syncRSSFeeds,
  getNewsFromRSS
};
