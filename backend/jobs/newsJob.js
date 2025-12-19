const cron = require('node-cron');
const logger = require('../utils/logger');
const newsService = require('../services/newsService');

/**
 * News prefetch cron job
 * Runs every 15 minutes to keep the cache warm
 */
const startNewsPrefetchJob = () => {
    cron.schedule('*/15 * * * *', async () => {
        try {
            logger.info('Starting news prefetch job...');
            await newsService.getAllNews({ limit: 50, page: 1 });
            const metadata = newsService.getCacheMetadata();
            logger.info('News prefetch completed successfully', {
                articlesCount: metadata.articleCount,
                nextPage: metadata.nextPage || 'none'
            });
        } catch (error) {
            logger.error('Error in news prefetch cron job', { error: error.message });
        }
    });

    logger.info('News prefetch cron job activated (every 15 minutes)');
};

module.exports = {
    startNewsPrefetchJob
};
