/**
 * Script to add Top Tech News RSS Feeds
 * Based on:
 * - https://pesto.tech/resources/top-10-websites-for-keeping-up-with-tech-news-in-2025
 * - https://daily.dev/blog/top-10-best-tech-websites-and-blogs-2025
 */

const mongoose = require('mongoose');
const { RSSFeed, User } = require('../models');
require('dotenv').config();

// Top 10 Tech News RSS Feeds from Pesto.tech + Daily.dev
const TOP_TECH_NEWS_FEEDS = [
    // 1. TechCrunch - Startup & Tech News (Both lists)
    {
        feedUrl: 'https://techcrunch.com/feed/',
        category: 'AI',
        description: 'TechCrunch - Startup news, tech product reviews, and breaking tech news',
        source: 'Pesto.tech & Daily.dev'
    },

    // 2. Wired - Technology & Culture (Both lists)
    {
        feedUrl: 'https://www.wired.com/feed/rss',
        category: 'AI',
        description: 'Wired - Future tech trends, in-depth articles, and expert opinions',
        source: 'Pesto.tech & Daily.dev'
    },

    // 3. The Verge - Tech, Science, Art & Culture (Both lists)
    {
        feedUrl: 'https://www.theverge.com/rss/index.xml',
        category: 'Programming',
        description: 'The Verge - Technology, science, art, and culture coverage',
        source: 'Pesto.tech & Daily.dev'
    },

    // 4. Ars Technica - Tech News & Analysis (Both lists)
    {
        feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
        category: 'Programming',
        description: 'Ars Technica - Technical depth in hardware, software, and IT trends',
        source: 'Pesto.tech & Daily.dev'
    },

    // 5. CNET - Product Reviews & Tech News (Both lists)
    {
        feedUrl: 'https://www.cnet.com/rss/news/',
        category: 'Programming',
        description: 'CNET - Product reviews, tech news, and how-to guides',
        source: 'Pesto.tech & Daily.dev'
    },

    // 6. Gizmodo - Design, Tech & Science (Both lists)
    {
        feedUrl: 'https://gizmodo.com/rss',
        category: 'AI',
        description: 'Gizmodo - Technology, design, science, and science fiction',
        source: 'Pesto.tech & Daily.dev'
    },

    // 7. ZDNet - IT Industry & Business Tech (Pesto.tech)
    {
        feedUrl: 'https://www.zdnet.com/news/rss.xml',
        category: 'Cloud',
        description: 'ZDNet - IT industry analysis, business technology, and research',
        source: 'Pesto.tech'
    },

    // 8. TechRadar - Gadgets & Electronics (Both lists)
    {
        feedUrl: 'https://www.techradar.com/rss',
        category: 'Programming',
        description: 'TechRadar - Gadget reviews, tech news, and buying guides',
        source: 'Pesto.tech & Daily.dev'
    },

    // 9. Engadget - Consumer Electronics (Both lists)
    {
        feedUrl: 'https://www.engadget.com/rss.xml',
        category: 'Programming',
        description: 'Engadget - Consumer electronics news and product reviews',
        source: 'Pesto.tech & Daily.dev'
    },

    // 10. Mashable - Tech & Digital Culture (Both lists)
    {
        feedUrl: 'https://mashable.com/feeds/rss/all',
        category: 'AI',
        description: 'Mashable - Technology, digital culture, and entertainment',
        source: 'Pesto.tech & Daily.dev'
    },

    // 11. Digital Trends - Tech News & Reviews (Daily.dev)
    {
        feedUrl: 'https://www.digitaltrends.com/feed/',
        category: 'Programming',
        description: 'Digital Trends - Latest tech news, gadget reviews, and buying guides',
        source: 'Daily.dev'
    }
];

// Additional specialized feeds for comprehensive category coverage
const ADDITIONAL_SPECIALIZED_FEEDS = [
    // AI & Machine Learning
    {
        feedUrl: 'https://feeds.feedburner.com/oreilly/radar',
        category: 'AI',
        description: 'O\'Reilly Radar - AI, data science, and emerging tech trends',
        source: 'Additional'
    },
    {
        feedUrl: 'https://ai.googleblog.com/feeds/posts/default',
        category: 'AI',
        description: 'Google AI Blog - Latest AI research and developments',
        source: 'Additional'
    },

    // Cloud Computing
    {
        feedUrl: 'https://aws.amazon.com/blogs/aws/feed/',
        category: 'Cloud',
        description: 'AWS Blog - Cloud computing news and updates',
        source: 'Additional'
    },
    {
        feedUrl: 'https://cloud.google.com/blog/rss',
        category: 'Cloud',
        description: 'Google Cloud Blog - Cloud platform updates and best practices',
        source: 'Additional'
    },
    {
        feedUrl: 'https://azure.microsoft.com/en-us/blog/feed/',
        category: 'Cloud',
        description: 'Microsoft Azure Blog - Cloud services and enterprise solutions',
        source: 'Additional'
    },

    // DevOps
    {
        feedUrl: 'https://devops.com/feed/',
        category: 'DevOps',
        description: 'DevOps.com - DevOps news, practices, and tools',
        source: 'Additional'
    },
    {
        feedUrl: 'https://www.docker.com/blog/feed/',
        category: 'DevOps',
        description: 'Docker Blog - Container technology and DevOps',
        source: 'Additional'
    },
    {
        feedUrl: 'https://kubernetes.io/feed.xml',
        category: 'DevOps',
        description: 'Kubernetes Blog - Container orchestration and cloud-native',
        source: 'Additional'
    },

    // Cybersecurity
    {
        feedUrl: 'https://krebsonsecurity.com/feed/',
        category: 'Cybersecurity',
        description: 'Krebs on Security - Cybersecurity news and analysis',
        source: 'Additional'
    },
    {
        feedUrl: 'https://www.darkreading.com/rss.xml',
        category: 'Cybersecurity',
        description: 'Dark Reading - Cybersecurity news and threat intelligence',
        source: 'Additional'
    },
    {
        feedUrl: 'https://www.bleepingcomputer.com/feed/',
        category: 'Cybersecurity',
        description: 'Bleeping Computer - Security news and tech support',
        source: 'Additional'
    },
    {
        feedUrl: 'https://threatpost.com/feed/',
        category: 'Cybersecurity',
        description: 'Threatpost - Cybersecurity threats and vulnerabilities',
        source: 'Additional'
    },

    // Programming & Development
    {
        feedUrl: 'https://javascriptweekly.com/rss',
        category: 'Programming',
        description: 'JavaScript Weekly - JavaScript news and articles',
        source: 'Additional'
    },
    {
        feedUrl: 'https://dev.to/feed',
        category: 'Programming',
        description: 'DEV Community - Programming articles and tutorials',
        source: 'Additional'
    },
    {
        feedUrl: 'https://github.blog/feed/',
        category: 'Programming',
        description: 'GitHub Blog - Developer tools and open source',
        source: 'Additional'
    },
    {
        feedUrl: 'https://stackoverflow.blog/feed/',
        category: 'Programming',
        description: 'Stack Overflow Blog - Programming insights and best practices',
        source: 'Additional'
    }
];

const addRSSFeeds = async () => {
    try {
        console.log('🚀 Starting to add Top 10 Tech News RSS Feeds...\n');

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

        // Combine all feeds
        const allFeeds = [...TOP_TECH_NEWS_FEEDS, ...ADDITIONAL_SPECIALIZED_FEEDS];

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log('📰 Processing feeds...\n');

        for (const feedData of allFeeds) {
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
                console.log(`   Category: ${feedData.category}\n`);
                addedCount++;

            } catch (error) {
                console.error(`❌ Error adding feed ${feedData.feedUrl}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log('='.repeat(60));
        console.log(`✅ Successfully added: ${addedCount} feeds`);
        console.log(`⏭️  Skipped (existing): ${skippedCount} feeds`);
        console.log(`❌ Errors: ${errorCount} feeds`);
        console.log(`📝 Total processed: ${allFeeds.length} feeds`);
        console.log('='.repeat(60));

        // Show category distribution
        console.log('\n📈 Category Distribution:');
        const categoryCounts = {};
        const allDbFeeds = await RSSFeed.find({ isActive: true });

        allDbFeeds.forEach(feed => {
            categoryCounts[feed.category] = (categoryCounts[feed.category] || 0) + 1;
        });

        Object.entries(categoryCounts).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} feeds`);
        });

        console.log('\n✨ Done! You can now fetch articles from these feeds.');
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
addRSSFeeds();
