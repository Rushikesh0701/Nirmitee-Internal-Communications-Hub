/**
 * Manual script to fetch RSS articles from all feeds
 * Run this to populate articles from the newly added RSS feeds
 */

const mongoose = require('mongoose');
const { fetchRssFeeds } = require('../jobs/rssFeedFetcher');
require('dotenv').config();

const fetchArticles = async () => {
    try {
        console.log('🚀 Starting manual RSS article fetch...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee-internal', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Fetch all RSS feeds
        await fetchRssFeeds();

        console.log('\n✨ Done! Articles have been fetched and stored.');
        console.log('💡 You can now view them in your RSS Feeds page.\n');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
fetchArticles();
