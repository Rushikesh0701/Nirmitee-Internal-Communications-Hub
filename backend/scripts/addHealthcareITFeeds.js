/**
 * Script to add Healthcare IT News RSS Feeds
 * Healthcare IT news sources for medical technology and healthcare information systems
 */

const mongoose = require('mongoose');
const { RSSFeed, User } = require('../models');
require('dotenv').config();

// Healthcare IT News RSS Feeds
const HEALTHCARE_IT_FEEDS = [
    {
        feedUrl: 'https://www.mobihealthnews.com/rss.xml',
        category: 'HealthcareIT',
        description: 'MobiHealthNews - Mobile health, digital health, and healthcare technology news',
        source: 'Healthcare IT'
    },
    {
        feedUrl: 'https://www.statnews.com/category/health-tech/feed',
        category: 'HealthcareIT',
        description: 'STAT News Health Tech - Healthcare technology and innovation news',
        source: 'Healthcare IT'
    },
    {
        feedUrl: 'https://www.healthcaredive.com/feed/',
        category: 'HealthcareIT',
        description: 'Healthcare Dive - Healthcare industry news, policy, and technology',
        source: 'Healthcare IT'
    },
    {
        feedUrl: 'https://www.healthcareitnews.com/rss.xml',
        category: 'HealthcareIT',
        description: 'Healthcare IT News - Healthcare information technology news and analysis',
        source: 'Healthcare IT'
    }
];

const addHealthcareITFeeds = async () => {
    try {
        console.log('🏥 Starting to add Healthcare IT News RSS Feeds...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee-internal', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB\n');

        // Find an admin user to assign as creator
        let adminUser = await User.findOne({ email: { $regex: /admin/i } });

        if (!adminUser) {
            // If no admin found, find any user
            adminUser = await User.findOne();
        }

        if (!adminUser) {
            console.error('❌ No users found in database. Please create a user first.');
            process.exit(1);
        }

        console.log(`📝 Using user: ${adminUser.email} as feed creator\n`);

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log('📰 Processing Healthcare IT feeds...\n');

        for (const feedData of HEALTHCARE_IT_FEEDS) {
            try {
                // Check if feed already exists
                const existingFeed = await RSSFeed.findOne({ feedUrl: feedData.feedUrl });

                if (existingFeed) {
                    console.log(`⏭️  Skipped (already exists): ${feedData.feedUrl}`);
                    skippedCount++;
                    continue;
                }

                // Create new feed
                const newFeed = await RSSFeed.create({
                    feedUrl: feedData.feedUrl,
                    category: feedData.category,
                    isActive: true,
                    createdById: adminUser._id
                });

                console.log(`✅ Added: ${feedData.description}`);
                console.log(`   URL: ${feedData.feedUrl}`);
                console.log(`   Category: ${feedData.category}`);
                console.log(`   Priority: HIGH (HealthcareIT news will be prioritized)\n`);
                addedCount++;

            } catch (error) {
                console.error(`❌ Error adding feed ${feedData.feedUrl}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Successfully added: ${addedCount} Healthcare IT feeds`);
        console.log(`⏭️  Skipped (existing): ${skippedCount} feeds`);
        console.log(`❌ Errors: ${errorCount} feeds`);
        console.log(`📝 Total processed: ${HEALTHCARE_IT_FEEDS.length} feeds`);
        console.log('='.repeat(60));
        console.log('\n💡 Note: HealthcareIT news will be displayed with HIGH priority');
        console.log('💡 Run the RSS fetcher job to populate articles from these feeds.\n');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
addHealthcareITFeeds();

