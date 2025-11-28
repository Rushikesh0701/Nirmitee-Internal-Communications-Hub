const feedService = require('../services/feedService');
const dummyDataService = require('../services/dummyDataService');
const { sendSuccess } = require('../utils/responseHelpers');
const { handleDatabaseError } = require('../utils/errorHandlers');

/**
 * GET /api/feed - Get unified feed
 */
const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const userId = req.userId || 'dummy-user-id-123';

    const feed = await feedService.getFeed(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type
    });

    if (!feed?.feed || feed.feed.length === 0) {
      const dummyFeed = dummyDataService.getDummyFeed({
        page: parseInt(page),
        limit: parseInt(limit),
        type
      });
      return sendSuccess(res, dummyFeed);
    }

    return sendSuccess(res, feed);
  } catch (error) {
    try {
      const dummyFeed = handleDatabaseError(
        error,
        (params) => dummyDataService.getDummyFeed({
          page: parseInt(params.page) || 1,
          limit: parseInt(params.limit) || 20,
          type: params.type || 'all'
        }),
        req.query
      );
      return sendSuccess(res, dummyFeed);
    } catch {
      next(error);
    }
  }
};

module.exports = {
  getFeed
};
