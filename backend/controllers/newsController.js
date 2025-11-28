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
 * Handle NewsData.io API request
 */
const handleNewsDataRequest = async (req, res) => {
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

  try {
    const newsData = await newsService.fetchNewsFromNewsData({
      q: q || undefined,
      category: category || undefined,
      from: from || undefined,
      to: to || undefined,
      language,
      source: source || undefined,
      sort: sort || undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      nextPage: nextPage || undefined
    });

    if (!newsData.results || newsData.results.length === 0) {
      return sendSuccess(res, {
              results: [],
              totalResults: 0,
              nextPage: null,
              status: 'success'
      }, newsData.message || 'No articles found for your query. Please try a different search term or category.');
    }

    return sendSuccess(res, newsData);
  } catch (newsDataError) {
    logger.error('NewsData.io API error', { error: newsDataError.message });
    
    try {
      const dummyNews = getDummyNewsFallback(req.query);
      const transformedDummyNews = transformDummyNewsToNewsDataFormat(dummyNews, category);
      const userMessage = getNewsDataErrorMessage(newsDataError);
      
      return sendSuccess(res, transformedDummyNews, userMessage);
    } catch (fallbackError) {
      logger.error('Error in fallback dummy data', { error: fallbackError.message });
      return sendSuccess(res, {
        results: [],
        totalResults: 0,
        nextPage: null,
        status: 'success'
      }, 'Unable to load news at this time. Please try again later.');
        }
      }
};

/**
 * Handle database news request
 */
const handleDatabaseNewsRequest = async (req, res) => {
  const { page = 1, limit = 10, category, priority, published } = req.query;
    
    try {
    const news = await newsService.getAllNews({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        priority,
        published: published === 'true'
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
 */
const getAllNews = async (req, res, next) => {
  try {
    if (isNewsDataRequest(req.query)) {
      return await handleNewsDataRequest(req, res);
    }
    return await handleDatabaseNewsRequest(req, res);
  } catch (error) {
    logger.warn('Error in getAllNews, using dummy data', { error: error.message });
    const dummyNews = getDummyNewsFallback(req.query);
    return sendSuccess(res, dummyNews);
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
