/**
 * Script to remove RSS items from News collection
 * This cleans up the main News table as requested
 */

const mongoose = require('mongoose');
const { News } = require('../models');
require('dotenv').config();

const cleanupRSSNews = async () => {
    try {
        console.log('🧹 Starting cleanup of RSS items from News collection...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee-internal', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Delete all news items with sourceType 'rss'
        const result = await News.deleteMany({ sourceType: 'rss' });

        console.log(`✅ Deleted ${result.deletedCount} RSS items from News collection.`);
        console.log('✨ The News collection is now clean.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
cleanupRSSNews();
