const mongoose = require('mongoose');
const RssSource = require('../models/RssSource');
require('dotenv').config();

const NEWS_RSS_FEEDS = [
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/', category: 'AI' },
    { name: 'Machine Learning Mastery', url: 'https://machinelearningmastery.com/feed/', category: 'AI' },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/', category: 'AI' },
    { name: 'Google AI Blog', url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss', category: 'AI' },
    { name: 'Nvidia Blog', url: 'https://blogs.nvidia.com/feed/', category: 'AI' },
    { name: 'MarkTechPost', url: 'https://www.marktechpost.com/feed/', category: 'AI' },
    { name: 'AWS Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: 'Cloud' },
    { name: 'Google Cloud Blog', url: 'https://cloud.google.com/blog/rss', category: 'Cloud' },
    { name: 'Azure Blog', url: 'https://azure.microsoft.com/en-us/blog/feed/', category: 'Cloud' },
    { name: 'Cloud Computing News', url: 'https://www.cloudcomputing-news.net/feed/', category: 'Cloud' },
    { name: 'InfoWorld Cloud', url: 'https://www.infoworld.com/category/cloud-computing/index.rss', category: 'Cloud' },
    { name: 'DevOps Digest', url: 'https://www.devopsdigest.com/feed', category: 'DevOps' },
    { name: 'DevOps.com', url: 'https://devops.com/feed/', category: 'DevOps' },
    { name: 'The New Stack', url: 'https://thenewstack.io/feed/', category: 'DevOps' },
    { name: 'Docker Blog', url: 'https://www.docker.com/blog/feed/', category: 'DevOps' },
    { name: 'Kubernetes', url: 'https://kubernetes.io/feed.xml', category: 'DevOps' },
    { name: 'InfoWorld Programming', url: 'https://www.infoworld.com/index.rss', category: 'Programming' },
    { name: 'Stack Overflow Blog', url: 'https://stackoverflow.blog/feed/', category: 'Programming' },
    { name: 'Dev.to', url: 'https://dev.to/feed/', category: 'Programming' },
    { name: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: 'Programming' },
    { name: 'Coding Horror', url: 'https://blog.codinghorror.com/rss/', category: 'Programming' },
    { name: 'HackerNoon', url: 'https://hackernoon.com/feed', category: 'Programming' },
    { name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'Cybersecurity' },
    { name: 'Threatpost', url: 'https://threatpost.com/feed/', category: 'Cybersecurity' },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'Cybersecurity' },
    { name: 'SecurityWeek', url: 'https://www.securityweek.com/feed/', category: 'Cybersecurity' },
    { name: 'The Hacker News', url: 'https://thehackernews.com/feeds/posts/default?alt=rss', category: 'Cybersecurity' },
    { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', category: 'Cybersecurity' },
    { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/rss.xml', category: 'HealthcareIT' },
    { name: 'Health IT Outcomes', url: 'https://www.healthitoutcomes.com/rss/rss.ashx', category: 'HealthcareIT' },
    { name: 'HealthTech Magazine', url: 'https://www.healthtechmagazine.net/rss.xml', category: 'HealthcareIT' },
    { name: 'MedTech Pharma', url: 'https://medtech.pharmaintelligence.informa.com/-/media/rss/mt.xml', category: 'HealthcareIT' },
    { name: 'FierceHealthcare', url: 'https://www.fiercehealthcare.com/rss.xml', category: 'HealthcareIT' },
    { name: 'MobiHealthNews', url: 'https://www.mobihealthnews.com/rss.xml', category: 'HealthcareIT' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: 'Technology' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology' },
    { name: 'NYT Technology', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'Technology' }
];

const seedRssSources = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee-communications');
        console.log('Connected to MongoDB');

        // Clear existing sources if any (Optional - user might want to keep manual ones)
        // For seeding, let's only add if not exists

        let addedCount = 0;
        for (const feed of NEWS_RSS_FEEDS) {
            const exists = await RssSource.findOne({ url: feed.url });
            if (!exists) {
                await new RssSource({ ...feed, isActive: true }).save();
                addedCount++;
            }
        }

        console.log(`Seeding complete. Added ${addedCount} sources.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding RSS sources:', error);
        process.exit(1);
    }
};

seedRssSources();
