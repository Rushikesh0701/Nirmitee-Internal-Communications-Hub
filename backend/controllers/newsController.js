const newsService = require('../services/newsService');
const dummyDataService = require('../services/dummyDataService');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHelpers');
const { getNewsDataErrorMessage } = require('../utils/newsDataHelpers');

/**
 * Transform dummy news to NewsData.io format
 */
const transformDummyNewsToNewsDataFormat = (dummyNews, category) => {
  return {
    results: (dummyNews.news || []).map(item => ({
      article_id: item._id || item.id || `dummy-${Date.now()}-${Math.random()}`,
      id: item._id || item.id || `dummy-${Date.now()}-${Math.random()}`,
      title: item.title || 'Untitled',
      description: item.summary || item.content || '',
      link: item.sourceUrl || '#',
      url: item.sourceUrl || '#',
      image_url: item.imageUrl || null,
      image: item.imageUrl || null,
      pubDate: item.publishedAt || item.createdAt || new Date().toISOString(),
      publishedAt: item.publishedAt || item.createdAt || new Date().toISOString(),
      source_id: 'dummy',
      source_name: 'Sample News',
      source: 'Sample News',
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
 * GET /api/news - Get all news (merged from NewsData.io + RSS feeds)
 */
const getAllNews = async (req, res, next) => {
  try {
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

    let result;
    let errorMessage = null;

    try {
      result = await newsService.getAllNews({
        q: q || undefined,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
        language,
        source: source || undefined,
        sort: sort || undefined,
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1,
        nextPage: nextPage || undefined
      });

      if (result.error) {
        errorMessage = getNewsDataErrorMessage({ message: result.error });
      }
    } catch (error) {
      logger.warn('Error fetching live news', { error: error.message });
      errorMessage = getNewsDataErrorMessage(error);
      result = null;
    }

    // If we got results, return them
    if (result && result.results && result.results.length > 0) {
      return sendSuccess(res, result, errorMessage);
    }

    // Fallback to dummy data
    logger.info('Using dummy data fallback');
    const dummyNews = getDummyNewsFallback(req.query);
    const transformedDummyNews = transformDummyNewsToNewsDataFormat(dummyNews, category);
    return sendSuccess(res, transformedDummyNews, errorMessage || 'Using sample data');
  } catch (error) {
    logger.error('Fatal error in getAllNews', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/news/rss - Get RSS-only news (Healthcare IT feeds)
 */
const getRSSNews = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      q,
      category
    } = req.query;

    let result;

    try {
      result = await newsService.getRSSNews({
        q: q || undefined,
        category: category || undefined,
        limit: parseInt(limit) || 10,
        page: parseInt(page) || 1
      });
    } catch (error) {
      logger.warn('Error fetching RSS news', { error: error.message });
      result = {
        results: [],
        totalResults: 0,
        nextPage: null,
        status: 'success'
      };
    }

    // If we got results, return them
    if (result && result.results && result.results.length > 0) {
      return sendSuccess(res, result);
    }

    // Return empty results
    return sendSuccess(res, {
      results: [],
      totalResults: 0,
      nextPage: null,
      status: 'success'
    }, 'No RSS articles found');
  } catch (error) {
    logger.error('Fatal error in getRSSNews', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/news/:id - Get news by ID
 */
const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'Article ID is required', 400);
    }

    try {
      const article = await newsService.getNewsById(id);
      return sendSuccess(res, article);
    } catch (error) {
      if (error.message === 'Article not found') {
        return sendError(res, 'Article not found', 404);
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error in getNewsById', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/news - Create news (not supported)
 */
const createNews = async (req, res, next) => {
  try {
    await newsService.createNews(req.body);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * PUT /api/news/:id - Update news (not supported)
 */
const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    await newsService.updateNews(id, req.body);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * DELETE /api/news/:id - Delete news (not supported)
 */
const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    await newsService.deleteNews(id);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

module.exports = {
  getAllNews,
  getRSSNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
};
