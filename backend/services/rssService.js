const { RSSFeed, RssArticle, User } = require('../models');
const Parser = require('rss-parser');
const parser = new Parser();
const logger = require('../utils/logger');

// Feed management
const getAllFeeds = async () => {
  return await RSSFeed.find({ isActive: true })
    .populate('createdById', 'firstName lastName')
    .sort({ createdAt: -1 });
};

const getFeedById = async (id) => {
  const feed = await RSSFeed.findById(id)
    .populate('createdById', 'firstName lastName');
  if (!feed) {
    throw new Error('RSS feed not found');
  }
  return feed;
};

const createFeed = async (feedData) => {
  const feed = await RSSFeed.create(feedData);
  return await RSSFeed.findById(feed._id)
    .populate('createdById', 'firstName lastName');
};

const updateFeed = async (id, updateData, user) => {
  const feed = await RSSFeed.findById(id);
  if (!feed) {
    throw new Error('RSS feed not found');
  }

  // Only Admin/Moderator can update
  if (!['Admin', 'Moderator'].includes(user.Role?.name)) {
    throw new Error('Unauthorized');
  }

  Object.assign(feed, updateData);
  await feed.save();
  return await RSSFeed.findById(feed._id)
    .populate('createdById', 'firstName lastName');
};

const deleteFeed = async (id, user) => {
  const feed = await RSSFeed.findById(id);
  if (!feed) {
    throw new Error('RSS feed not found');
  }

  if (!['Admin', 'Moderator'].includes(user.Role?.name)) {
    throw new Error('Unauthorized');
  }

  await RSSFeed.findByIdAndDelete(id);
};

// Article management
const getArticlesByCategory = async (category, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const articles = await RssArticle.find({ category })
    .populate('feedId', 'feedUrl category')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RssArticle.countDocuments({ category });

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getAllArticles = async (categories = [], page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const query = categories.length > 0 ? { category: { $in: categories } } : {};

  const articles = await RssArticle.find(query)
    .populate('feedId', 'feedUrl category')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await RssArticle.countDocuments(query);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getArticlesGroupedByCategory = async (categories = []) => {
  const query = categories.length > 0 ? { category: { $in: categories } } : {};

  const articles = await RssArticle.find(query)
    .populate('feedId', 'feedUrl category')
    .sort({ publishedAt: -1 });

  // Group by category
  const grouped = {};
  articles.forEach(article => {
    if (!grouped[article.category]) {
      grouped[article.category] = [];
    }
    grouped[article.category].push(article);
  });

  return grouped;
};

// Fetch and store articles from a feed
const fetchAndStoreFeedArticles = async (feedId) => {
  const feed = await RSSFeed.findById(feedId);
  if (!feed || !feed.isActive) {
    throw new Error('RSS feed not found or inactive');
  }

  try {
    const feedData = await parser.parseURL(feed.feedUrl);
    const articles = [];

    for (const item of feedData.items || []) {
      try {
        // Parse published date
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        // Check if article already exists
        const existingArticle = await RssArticle.findOne({ link: item.link });
        if (existingArticle) {
          continue; // Skip duplicates
        }

        // Helper to extract image URL
        const extractImageUrl = (item) => {
          if (item.enclosure?.url) return item.enclosure.url;
          if (item['media:content']?.$?.url) return item['media:content'].$.url;
          if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
          if (item.content) {
            const match = item.content.match(/<img[^>]+src="([^"]+)"/);
            if (match) return match[1];
          }
          return null;
        };

        const article = await RssArticle.create({
          title: item.title || 'Untitled',
          link: item.link || '',
          description: item.contentSnippet || item.content || item.description || '',
          imageUrl: extractImageUrl(item),
          category: feed.category,
          publishedAt,
          feedId: feed._id
        });

        articles.push(article);
      } catch (error) {
        logger.error('Error storing article from feed', { feedId, error: error.message });
        // Continue with next article
      }
    }

    // Update last fetched time
    await RSSFeed.findByIdAndUpdate(feedId, { lastFetchedAt: new Date() });

    return {
      feedId: feed._id,
      feedUrl: feed.feedUrl,
      category: feed.category,
      articlesCount: articles.length
    };
  } catch (error) {
    logger.error('Failed to fetch RSS feed', { feedId, error: error.message });
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
  }
};

// Fetch all active feeds and store articles (for cron job)
const fetchAllFeeds = async () => {
  const feeds = await RSSFeed.find({ isActive: true });
  const results = [];

  for (const feed of feeds) {
    try {
      const result = await fetchAndStoreFeedArticles(feed._id);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({
        success: false,
        feedId: feed._id,
        feedUrl: feed.feedUrl,
        error: error.message
      });
    }
  }

  return results;
};

// Subscription management
const getUserSubscriptions = async (userEmail) => {
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    // Return empty array if user not found in MongoDB (might be Sequelize-only user)
    return [];
  }
  return user.rssSubscriptions || [];
};

const updateUserSubscriptions = async (userEmail, categories) => {
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    throw new Error('User not found in MongoDB. Please ensure your account is properly synced.');
  }

  // Validate categories
  const validCategories = ['AI', 'Cloud', 'DevOps', 'Programming', 'Cybersecurity'];
  const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
  if (invalidCategories.length > 0) {
    throw new Error(`Invalid categories: ${invalidCategories.join(', ')}`);
  }

  // Validate minimum 3 categories
  if (categories.length < 3) {
    throw new Error('Each employee must subscribe to at least 3 RSS categories');
  }

  // Remove duplicates
  const uniqueCategories = [...new Set(categories)];

  user.rssSubscriptions = uniqueCategories;
  await user.save();

  return user.rssSubscriptions;
};

// Legacy method for backward compatibility
const fetchFeedItems = async (id) => {
  const feed = await RSSFeed.findById(id);
  if (!feed) {
    throw new Error('RSS feed not found');
  }

  try {
    const feedData = await parser.parseURL(feed.feedUrl);

    // Update last fetched time
    await RSSFeed.findByIdAndUpdate(id, { lastFetchedAt: new Date() });

    return {
      feed: {
        title: feedData.title,
        description: feedData.description,
        link: feedData.link
      },
      items: feedData.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.content || item.contentSnippet,
        creator: item.creator
      }))
    };
  } catch (error) {
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
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
  fetchAndStoreFeedArticles,
  fetchAllFeeds,
  getUserSubscriptions,
  updateUserSubscriptions
};
