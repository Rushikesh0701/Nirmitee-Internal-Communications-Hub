const rssService = require('../services/rssService');
const dummyDataService = require('../services/dummyDataService');

const getAllFeeds = async (req, res, next) => {
  try {
    const feeds = await rssService.getAllFeeds();
    
    // If no feeds found, return dummy data
    if (!feeds || feeds.length === 0) {
      const dummyFeeds = dummyDataService.getDummyRSSFeeds();
      return res.json({ success: true, data: dummyFeeds });
    }
    
    res.json({ success: true, data: feeds });
  } catch (error) {
    // If database error, return dummy data
    if (error.name === 'SequelizeConnectionRefusedError' || 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      const feeds = dummyDataService.getDummyRSSFeeds();
      return res.json({ success: true, data: feeds });
    }
    next(error);
  }
};

const getFeedById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feed = await rssService.getFeedById(id);
    res.json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

const createFeed = async (req, res, next) => {
  try {
    const feedData = { ...req.body, createdById: req.userId };
    const feed = await rssService.createFeed(feedData);
    res.status(201).json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

const updateFeed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const feed = await rssService.updateFeed(id, req.body, req.user);
    res.json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

const deleteFeed = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rssService.deleteFeed(id, req.user);
    res.json({ success: true, message: 'RSS feed deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const fetchFeedItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const items = await rssService.fetchFeedItems(id);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// Get articles by category
const getArticlesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await rssService.getArticlesByCategory(category, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// Get all articles (optionally filtered by user subscriptions)
const getAllArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const categories = req.query.categories ? req.query.categories.split(',') : [];
    
    const result = await rssService.getAllArticles(categories, page, limit);
    
    // If no articles found, return dummy data
    if (!result || !result.articles || result.articles.length === 0) {
      const dummyArticles = dummyDataService.getDummyRSSArticles({
        page,
        limit,
        category: categories[0]
      });
      return res.json({ success: true, data: dummyArticles });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    // If database error, return dummy data
    if (error.name === 'SequelizeConnectionRefusedError' || 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      const dummyArticles = dummyDataService.getDummyRSSArticles({
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        category: req.query.categories ? req.query.categories.split(',')[0] : undefined
      });
      return res.json({ success: true, data: dummyArticles });
    }
    next(error);
  }
};

// Get articles grouped by category
const getArticlesGroupedByCategory = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    let categories = [];
    
    // If user is authenticated, get their subscriptions
    if (userEmail) {
      categories = await rssService.getUserSubscriptions(userEmail);
    }
    
    // If categories provided in query, use those instead
    if (req.query.categories) {
      categories = req.query.categories.split(',');
    }
    
    const grouped = await rssService.getArticlesGroupedByCategory(categories);
    
    // If no articles found, return dummy data grouped by category
    if (!grouped || Object.keys(grouped).length === 0) {
      const dummyArticles = dummyDataService.getDummyRSSArticles({ category: categories[0] });
      const groupedDummy = {};
      if (dummyArticles.articles && dummyArticles.articles.length > 0) {
        dummyArticles.articles.forEach(article => {
          if (!groupedDummy[article.category]) {
            groupedDummy[article.category] = [];
          }
          groupedDummy[article.category].push(article);
        });
      }
      // Add more dummy articles for other categories
      const allDummyArticles = dummyDataService.getDummyRSSArticles({});
      allDummyArticles.articles.forEach(article => {
        if (!groupedDummy[article.category]) {
          groupedDummy[article.category] = [];
        }
        groupedDummy[article.category].push(article);
      });
      return res.json({ success: true, data: groupedDummy });
    }
    
    res.json({ success: true, data: grouped });
  } catch (error) {
    // If database error, return dummy data
    if (error.name === 'SequelizeConnectionRefusedError' || 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'MongoServerError' ||
        error.name === 'MongooseError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connection')) {
      const allDummyArticles = dummyDataService.getDummyRSSArticles({});
      const groupedDummy = {};
      allDummyArticles.articles.forEach(article => {
        if (!groupedDummy[article.category]) {
          groupedDummy[article.category] = [];
        }
        groupedDummy[article.category].push(article);
      });
      return res.json({ success: true, data: groupedDummy });
    }
    next(error);
  }
};

// Get user subscriptions
const getUserSubscriptions = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'User email not found'
      });
    }
    const subscriptions = await rssService.getUserSubscriptions(userEmail);
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

// Update user subscriptions
const updateUserSubscriptions = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'User email not found'
      });
    }
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }
    
    const subscriptions = await rssService.updateUserSubscriptions(userEmail, categories);
    res.json({ success: true, data: subscriptions, message: 'Subscriptions updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFeeds,
  getFeedById,
  createFeed,
  updateFeed,
  deleteFeed,
  fetchFeedItems,
  getArticlesByCategory,
  getAllArticles,
  getArticlesGroupedByCategory,
  getUserSubscriptions,
  updateUserSubscriptions
};
