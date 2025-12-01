/**
 * Script to refresh RSS articles (Clear and Re-fetch)
 * This ensures all articles have the newly added imageUrl field
 */

const mongoose = require('mongoose');
const { RssArticle } = require('../models');
const { fetchRssFeeds } = require('../jobs/rssFeedFetcher');
require('dotenv').config();

const refreshRSSArticles = async () => {
    try {
        console.log('🔄 Starting RSS article refresh...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee-internal', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // 1. Clear existing articles
        console.log('🗑️  Clearing existing RSS articles...');
        const deleteResult = await RssArticle.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} old articles\n`);

        // 2. Re-fetch all feeds
        console.log('📰 Fetching fresh articles with images...');
        await fetchRssFeeds();

        console.log('\n✨ Done! RSS articles have been refreshed with images.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
refreshRSSArticles();
