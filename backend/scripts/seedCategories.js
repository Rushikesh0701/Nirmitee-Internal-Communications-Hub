/**
 * Seed script to add default RSS categories to the database
 * Run with: node scripts/seedCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RssCategory = require('../models/RssCategory');

const defaultCategories = [
    { name: 'AI & Machine Learning', value: 'AI' },
    { name: 'Cloud Computing', value: 'Cloud' },
    { name: 'DevOps', value: 'DevOps' },
    { name: 'Programming', value: 'Programming' },
    { name: 'Cybersecurity', value: 'Cybersecurity' },
    { name: 'Healthcare IT', value: 'HealthcareIT' },
    { name: 'General Tech', value: 'Technology' }
];

async function seedCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check existing categories
        const existingCount = await RssCategory.countDocuments();
        console.log(`Found ${existingCount} existing categories`);

        let added = 0;
        let skipped = 0;

        for (const category of defaultCategories) {
            // Check if category already exists
            const exists = await RssCategory.findOne({ value: category.value });
            if (exists) {
                console.log(`Skipping "${category.name}" - already exists`);
                skipped++;
                continue;
            }

            // Create new category
            await RssCategory.create({
                name: category.name,
                value: category.value,
                isActive: true
            });
            console.log(`Added "${category.name}"`);
            added++;
        }

        console.log(`\nDone! Added ${added} categories, skipped ${skipped} existing.`);

        // Show all categories
        const allCategories = await RssCategory.find().sort({ name: 1 });
        console.log('\nCurrent categories in database:');
        allCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.value})`);
        });

    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

seedCategories();
