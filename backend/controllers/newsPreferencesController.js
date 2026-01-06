const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get user's news preferences
 * GET /api/users/news-preferences
 */
const getNewsPreferences = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const user = await User.findById(userId).select('newsPreferences');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return default preferences if not set
        const preferences = user.newsPreferences || {
            categories: [],
            language: 'en',
            onboardingComplete: false
        };

        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        logger.error('Error fetching news preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch news preferences'
        });
    }
};

/**
 * Update user's news preferences
 * PUT /api/users/news-preferences
 */
const updateNewsPreferences = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { categories, language, onboardingComplete } = req.body;

        // Validate categories against database
        if (categories && !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Categories must be an array'
            });
        }

        if (categories && categories.length > 0) {
            // Fetch valid categories from database
            const RssCategory = require('../models/RssCategory');
            const dbCategories = await RssCategory.find({ isActive: true }).select('value');
            const validCategories = dbCategories.map(cat => cat.value);

            const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
            if (invalidCategories.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid categories: ${invalidCategories.join(', ')}`
                });
            }
        }

        // Validate language
        const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'hi', 'mr', 'ta', 'te', 'ur', 'bn', 'pa', 'gu', 'kn', 'ml', 'or', 'sd'];
        if (language && !validLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid language code'
            });
        }

        // Build update object
        const updateData = {};
        if (categories !== undefined) updateData['newsPreferences.categories'] = categories;
        if (language !== undefined) updateData['newsPreferences.language'] = language;
        if (onboardingComplete !== undefined) updateData['newsPreferences.onboardingComplete'] = onboardingComplete;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('newsPreferences');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        logger.info(`News preferences updated for user ${userId}`);

        res.json({
            success: true,
            message: 'News preferences updated successfully',
            data: user.newsPreferences
        });
    } catch (error) {
        logger.error('Error updating news preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update news preferences'
        });
    }
};

module.exports = {
    getNewsPreferences,
    updateNewsPreferences
};
