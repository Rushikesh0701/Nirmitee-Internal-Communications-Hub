const rssService = require('../services/rssService');
const newsService = require('../services/newsService');
const { User, Role } = require('../models');

/**
 * Cron job to fetch RSS feeds every 6 hours and store articles
 * 
 * This function fetches all active RSS feeds and stores new articles in the database.
 * It also syncs RSS feeds to news items.
 * It should be called periodically using node-cron.
 * 
 * Example usage in server.js:
 * cron.schedule('0 0,6,12,18 * * *', async () => {
 *   await fetchRssFeeds();
 * });
 */
const fetchRssFeeds = async () => {
  try {
    console.log('🔄 Starting RSS feed fetch job...');

    // Fetch and store RSS articles
    const results = await rssService.fetchAllFeeds();

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalArticles = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.articlesCount || 0), 0);

    console.log(`✅ RSS feed fetch completed:`);
    console.log(`   - Successful feeds: ${successCount}`);
    console.log(`   - Failed feeds: ${failCount}`);
    console.log(`   - New articles stored: ${totalArticles}`);

    // Sync RSS feeds to news
    try {
      console.log('🔄 Syncing RSS feeds to news...');

      // Find first admin user or system user for RSS-sourced news
      const adminRole = await Role.findOne({ name: 'Admin' });
      let systemUser = null;

      if (adminRole) {
        systemUser = await User.findOne({ roleId: adminRole._id });
      }

      if (!systemUser) {
        // Fallback to first user if no admin found
        systemUser = await User.findOne();
      }

      if (systemUser) {
        const newsSyncResult = await newsService.syncRSSFeedsToNews(systemUser._id);
        console.log(`✅ RSS to News sync completed:`);
        console.log(`   - New news items created: ${newsSyncResult.totalNewsCreated}`);
      } else {
        console.warn('⚠️  No system user found for RSS to News sync');
      }
    } catch (error) {
      console.error('❌ Error syncing RSS feeds to news:', error.message);
      // Don't throw - RSS article fetch was successful
    }

    return results;
  } catch (error) {
    console.error('❌ Error in RSS feed fetch job:', error);
    throw error;
  }
};

module.exports = {
  fetchRssFeeds
};

