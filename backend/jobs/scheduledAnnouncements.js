const announcementService = require('../services/announcementService');
const logger = require('../utils/logger');

/**
 * Cron job placeholder for publishing scheduled announcements
 * 
 * This function should be called periodically (e.g., every minute) to check
 * for announcements that are scheduled to be published.
 * 
 * To set up a cron job, you can use node-cron or similar:
 * 
 * const cron = require('node-cron');
 * const { publishScheduledAnnouncements } = require('./jobs/scheduledAnnouncements');
 * 
 * // Run every minute
 * cron.schedule('* * * * *', async () => {
 *   try {
 *     const count = await publishScheduledAnnouncements();
 *     if (count > 0) {
 *       logger.info(`Published ${count} scheduled announcement(s)`);
 *     }
 *   } catch (error) {
 *     logger.error('Error publishing scheduled announcements:', error);
 *   }
 * });
 */
const publishScheduledAnnouncements = async () => {
  try {
    const count = await announcementService.publishScheduledAnnouncements();
    if (count > 0) {
      logger.info(`Published ${count} scheduled announcement(s)`);
    }
    return count;
  } catch (error) {
    logger.error('Error publishing scheduled announcements', { error });
    throw error;
  }
};

module.exports = {
  publishScheduledAnnouncements
};
